import win32print
import win32ui
import win32con
import os
from PIL import Image, ImageFont, ImageDraw

def print_text(text, title=None, username=None, reason=None, font_size=40, line_spacing=1.5, margin_left_right=5, margin_top_bottom=10):
    """
    텍스트를 프린터로 출력하는 함수

    Args:
        text: 출력할 텍스트
        title: 제목 (선택사항, 제공시 상단에 제목과 구분선 표시)
        username: 사용자 이름 (선택사항, 제공시 처방받는 이 표시)
        reason: 처방 사유 (선택사항, 제공시 하단에 표시)
        font_size: 폰트 크기
        line_spacing: 줄 간격 배율
        margin_left_right: 좌우 여백 (mm 단위)
        margin_top_bottom: 상하 여백 (mm 단위)
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
        # 1mm = 11.811 픽셀 (300 DPI 기준)
        dpi_scale = 11.811
        img_width = int(80 * dpi_scale)   # 약 945 픽셀
        img_height = int(297 * dpi_scale)  # 약 3508 픽셀
        
        img = Image.new('RGB', (img_width, img_height), 'white')
        draw = ImageDraw.Draw(img)
        
        # 5. 폰트 로드
        # backend 폴더 내의 font.ttf 사용
        base_dir = os.path.dirname(os.path.abspath(__file__))
        font_path = os.path.join(base_dir, 'font.ttf')
        
        try:
            font = ImageFont.truetype(font_path, font_size)
            print(f"✅ 폰트 로드 성공: {font_path}")
        except Exception as e:
            print(f"⚠️ 커스텀 폰트 로드 실패 ({e}), 시스템 폰트로 대체합니다.")
            try:
                font = ImageFont.truetype("malgun.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        # 6. 여백 설정 (mm를 픽셀로 변환)
        margin_x = int(margin_left_right * dpi_scale)
        margin_y = int(margin_top_bottom * dpi_scale)
        max_width = img_width - (margin_x * 2)
        
        print(f"📄 용지 크기: {img_width} x {img_height} 픽셀 (80mm x 297mm)")
        print(f"📏 좌우 여백: {margin_left_right}mm ({margin_x}픽셀)")
        print(f"📏 상하 여백: {margin_top_bottom}mm ({margin_y}픽셀)")
        print(f"📝 텍스트 영역 너비: {max_width}픽셀")
        
        # 7. 자동 줄바꿈 함수
        def wrap_text(text, font, max_width):
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
                    width = bbox[2] - bbox[0]
                    
                    if width <= max_width:
                        current_line = test_line
                    else:
                        if current_line:
                            lines.append(current_line.rstrip())
                        current_line = word + ' '
                
                if current_line:
                    lines.append(current_line.rstrip())
            
            return lines
        
        # 8. 텍스트 줄바꿈 처리
        lines = wrap_text(text, font, max_width)
        
        # 9. 줄 높이 계산
        bbox = draw.textbbox((0, 0), "Test", font=font)
        line_height = int((bbox[3] - bbox[1]) * line_spacing)
        
        # 10. 텍스트 그리기
        y_position = margin_y

        # 사용자 이름이 있으면 표시
        if username:
            user_text = f"처방받는 이: {username}"
            draw.text((margin_x, y_position), user_text, fill="black", font=font)
            y_position += line_height

        # 제목이 있으면 제목과 구분선 그리기
        if title:
            # 구분선 그리기 (먼저 - 이름과 제목 사이)
            separator = "-" * int(max_width / (font_size * 0.5))  # 대략적인 대시 개수 계산
            draw.text((margin_x, y_position), separator, fill="black", font=font)
            y_position += line_height

            # 제목 그리기 (나중)
            draw.text((margin_x, y_position), title, fill="black", font=font)
            y_position += line_height
            
        if title or username:
            # 제목/이름과 본문 사이 빈 줄 추가
            y_position += line_height // 2

        for line in lines:
            if line:  # 빈 줄이 아닐 때
                draw.text((margin_x, y_position), line, fill="black", font=font)
            y_position += line_height

            # 용지를 벗어나면 경고
            if y_position > img_height - margin_y:
                print(f"⚠️  경고: 텍스트가 용지 범위를 벗어났습니다!")
                break
        
        # 처방 사유 출력 (본문 아래에)
        if reason:
            y_position += line_height # 본문과 간격
            
            # 구분선
            separator = "-" * int(max_width / (font_size * 0.5))
            draw.text((margin_x, y_position), separator, fill="black", font=font)
            y_position += line_height
            
            # 소제목
            draw.text((margin_x, y_position), "[처방 사유]", fill="black", font=font)
            y_position += line_height
            
            # 사유 내용 (줄바꿈 처리)
            reason_lines = wrap_text(reason, font, max_width)
            for r_line in reason_lines:
                draw.text((margin_x, y_position), r_line, fill="black", font=font)
                y_position += line_height

        
        # 11. 이미지를 흑백으로 변환
        img = img.convert("1")
        
        # 12. 프린트 작업 시작
        hdc.StartDoc("Text Print Job")
        hdc.StartPage()
        
        # 13. 이미지를 프린터에 그리기
        from PIL import ImageWin
        dib = ImageWin.Dib(img)
        
        # 비율 유지하면서 프린터 크기에 맞추기
        scale = min(printer_width / img_width, printer_height / img_height)
        scaled_width = int(img_width * scale)
        scaled_height = int(img_height * scale)
        
        # 중앙 정렬
        x = (printer_width - scaled_width) // 2
        y = (printer_height - scaled_height) // 2
        
        dib.draw(hdc.GetHandleOutput(), (x, y, x + scaled_width, y + scaled_height))
        
        # 14. 프린트 작업 종료
        hdc.EndPage()
        hdc.EndDoc()
        hdc.DeleteDC()
        
        print(f"✅ 프린트 출력 완료! (프린터: {printer_name})")
        
    except Exception as e:
        print(f"❌ 프린트 오류: {e}")
    
    finally:
        # 15. 프린터 핸들 닫기
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