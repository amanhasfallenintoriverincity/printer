import win32print
import win32ui
import win32con
import os
from datetime import datetime
from PIL import Image, ImageFont, ImageDraw

def print_text(text, title=None, username=None, reason=None, font_size=50, line_spacing=1.5, margin_left_right=5, margin_top_bottom=10):
    """
    텍스트를 프린터로 출력하는 함수 (처방전 스타일 - image1.png 기반)
    """
    
    # 1. 프린터 설정
    printer_name = win32print.GetDefaultPrinter()
    hprinter = win32print.OpenPrinter(printer_name)
    
    try:
        # 2. 디바이스 컨텍스트 생성
        hdc = win32ui.CreateDC()
        hdc.CreatePrinterDC(printer_name)
        
        # 3. 프린터 해상도 가져오기
        printer_width = hdc.GetDeviceCaps(win32con.HORZRES)
        printer_height = hdc.GetDeviceCaps(win32con.VERTRES)
        
        # 4. 이미지 생성 (80mm x 297mm 용지, 300 DPI 기준)
        dpi_scale = 11.811
        img_width = int(80 * dpi_scale)   # 약 945 픽셀
        img_height = int(297 * dpi_scale)  # 약 3508 픽셀
        
        img = Image.new('RGB', (img_width, img_height), 'white')
        draw = ImageDraw.Draw(img)
        
        # 5. 폰트 로드
        base_dir = os.path.dirname(os.path.abspath(__file__))
        font_path = os.path.join(base_dir, 'font.ttf')
        
        def get_font(size):
            try:
                # 폰트가 굵은 버전이 따로 없다면 동일한 폰트를 크기만 조절하여 사용
                return ImageFont.truetype(font_path, size)
            except:
                try:
                    return ImageFont.truetype("malgun.ttf", size)
                except:
                    return ImageFont.load_default()

        # 각 섹션별 폰트 크기 정의
        font_title = get_font(int(font_size * 1.8))  # 제목 (매우 크게)
        font_name = get_font(int(font_size * 1.4))   # 환자 이름 (약간 크게)
        font_normal = get_font(font_size)           # 본문
        font_small = get_font(int(font_size * 0.7)) # 소제목 및 날짜
        
        # 6. 여백 설정
        margin_x = int(margin_left_right * dpi_scale)
        margin_y = int(margin_top_bottom * dpi_scale)
        max_width = img_width - (margin_x * 2)
        
        # 7. 자동 줄바꿈 함수
        def wrap_text(text, font, max_w):
            lines = []
            paragraphs = text.split('\n')
            for paragraph in paragraphs:
                if not paragraph.strip():
                    lines.append('')
                    continue
                words = paragraph.split(' ')
                current_line = ''
                for word in words:
                    test_line = current_line + word + ' '
                    bbox = draw.textbbox((0, 0), test_line, font=font)
                    if (bbox[2] - bbox[0]) <= max_w:
                        current_line = test_line
                    else:
                        if current_line:
                            lines.append(current_line.rstrip())
                        current_line = word + ' '
                if current_line:
                    lines.append(current_line.rstrip())
            return lines

        # 8. 그리기 시작
        y_position = margin_y
        
        # --- Header ---
        # 1) Title (Left) & Patient Name (Right)
        # 제목 그리기
        if title:
            draw.text((margin_x, y_position), title, fill="black", font=font_title)
            
        # 환자명 레이블 및 이름 그리기 (오른쪽 정렬)
        if username:
            label_text = "환자명"
            u_label_bbox = draw.textbbox((0, 0), label_text, font=font_small)
            u_name_bbox = draw.textbbox((0, 0), username, font=font_name)
            
            label_x = img_width - margin_x - (u_label_bbox[2] - u_label_bbox[0])
            name_x = img_width - margin_x - (u_name_bbox[2] - u_name_bbox[0])
            
            draw.text((label_x, y_position), label_text, fill="black", font=font_small)
            draw.text((name_x, y_position + int(font_size * 0.8)), username, fill="black", font=font_name)

        # 제목의 높이만큼 아래로 이동
        title_bbox = draw.textbbox((0, 0), title if title else " ", font=font_title)
        y_position += (title_bbox[3] - title_bbox[1]) + 15
        
        # 2) Info Line (문학 처방전 · 발급일)
        today = datetime.now().strftime("%Y-%m-%d")
        info_text = f"문학 처방전 · 발급일 {today}"
        draw.text((margin_x, y_position), info_text, fill="black", font=font_small)
        
        y_position += int(font_size * 1.5)
        
        # 3) Separator Line
        draw.line([(margin_x, y_position), (img_width - margin_x, y_position)], fill="black", width=2)
        y_position += 50 # 구분선 뒤 여백
        
        # --- Body ---
        lines = wrap_text(text, font_normal, max_width)
        line_height = int(font_size * line_spacing)
        
        for line in lines:
            if line:
                draw.text((margin_x, y_position), line, fill="black", font=font_normal)
            y_position += line_height
            if y_position > img_height - margin_y - 400: # 처방 이유를 위한 공간 확보
                break
        
        # --- Reason (Boxed) ---
        if reason:
            y_position += 60
            
            # 처방 이유 텍스트 줄바꿈 (박스 내부 여백 고려)
            reason_padding = 30
            reason_lines = wrap_text(reason, font_normal, max_width - (reason_padding * 2))
            
            # 박스 높이 계산
            reason_header_height = int(font_size * 1.2)
            reason_box_height = (len(reason_lines) * line_height) + reason_header_height + (reason_padding * 2)
            
            # 박스가 용지 하단을 넘지 않도록 조정
            if y_position + reason_box_height > img_height - margin_y:
                y_position = img_height - margin_y - reason_box_height
                
            # 박스 테두리 그리기
            draw.rectangle(
                [margin_x, y_position, img_width - margin_x, y_position + reason_box_height],
                outline="black", width=2
            )
            
            inner_y = y_position + reason_padding
            # "처방 이유" 소제목
            draw.text((margin_x + reason_padding, inner_y), "처방 이유", fill="black", font=font_small)
            inner_y += reason_header_height
            
            # 사유 본문
            for r_line in reason_lines:
                draw.text((margin_x + reason_padding, inner_y), r_line, fill="black", font=font_normal)
                inner_y += line_height
        
        # 9. 이미지를 흑백으로 변환 및 출력
        img = img.convert("1")
        
        # 프린트 작업 시작
        hdc.StartDoc("Literary Prescription")
        hdc.StartPage()
        
        from PIL import ImageWin
        dib = ImageWin.Dib(img)
        
        scale = min(printer_width / img_width, printer_height / img_height)
        scaled_width = int(img_width * scale)
        scaled_height = int(img_height * scale)
        
        x = (printer_width - scaled_width) // 2
        y = (printer_height - scaled_height) // 2
        
        dib.draw(hdc.GetHandleOutput(), (x, y, x + scaled_width, y + scaled_height))
        
        hdc.EndPage()
        hdc.EndDoc()
        hdc.DeleteDC()
        
        print(f"✅ 처방전 출력 완료! (프린터: {printer_name})")
        
    except Exception as e:
        print(f"❌ 프린트 오류: {e}")
    finally:
        win32print.ClosePrinter(hprinter)


# 사용 예시
if __name__ == '__main__':
    # 예시 1: 제목과 구분선이 있는 출력
    print_text("이것은 본문 내용입니다. 제목 아래에 구분선과 함께 표시됩니다.",
               title="오늘의 문학")

    # 예시 2: 제목 없이 기본 출력
    # print_text("안녕하세요, 프린트 테스트입니다!")

    # 예시 3: 제목과 긴 본문
    # long_text = """시인이란 슬픔을 노래하는 사람이 아니라
    # 슬픔을 사랑하는 사람이다.
    #
    # 그러므로 시인은 외로운 사람이 아니라
    # 외로움을 사랑하는 사람이다."""
    # print_text(long_text, title="시인의 마음", font_size=35)

    # 예시 4: 좌우 여백 넓게 (10mm)
    # print_text("좌우 여백이 넓은 텍스트", title="공지사항", margin_left_right=10)

    # 예시 5: 여백 최소화
    # print_text("여백 최소 설정", title="메모", margin_left_right=2, margin_top_bottom=3)