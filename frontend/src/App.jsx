import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Stepper, { Step } from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Camera, Upload, RefreshCw, User, BookOpen } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import Dither from '@/components/Dither';
import ASCIIText from '@/components/ASCIIText';
import './App.css';

function App() {
  const stepperRef = useRef(null);
  const webcamRef = useRef(null);
  const scrollRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'camera'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const capturedFile = dataURLtoFile(imageSrc, 'camera-capture.jpg');
      setFile(capturedFile);
      setPreview(imageSrc);
      setResult(null);
      setError(null);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('username', name); // Send name if backend needs it (optional update later)

    try {
      // Backend is assumed to be running on localhost:5000
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Server response:", response.data);
      setResult(response.data);
      stepperRef.current.next(); // Move to result step on success
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setName("");
    setMode('upload');
    stepperRef.current.goToStep(1);
  };

  const getNextButtonText = () => {
    if (currentStep === 1) return "다음";
    if (currentStep === 2) return loading ? "분석 중..." : "감정 분석하기";
    return "처음으로"; // Step 3
  };

  const getNextButtonProps = () => {
    if (currentStep === 1) {
      return {
        disabled: !name.trim(),
        onClick: () => stepperRef.current.next(),
      };
    }
    if (currentStep === 2) {
      return {
        disabled: !file || loading,
        onClick: handleAnalyze,
      };
    }
    if (currentStep === 3) {
      return {
        onClick: handleRestart,
      };
    }
    return {};
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center py-4 px-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <Dither waveSpeed={0.05} enableMouseInteraction={false} />
      </div>
      <div className="w-full max-w-7xl text-center mb-4 shrink-0 z-10 relative">
        <div className="mb-2 flex justify-center h-[110px] relative">
           <ASCIIText
             text="감정 문학 자판기"
             enableWaves={false}
             asciiFontSize={3}
           />
        </div>
        <p className="text-muted-foreground text-sm">당신의 표정을 분석하여 어울리는 문학 작품을 처방해드립니다.</p>
      </div>

      <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col z-10 relative">
        <Stepper
          ref={stepperRef}
          initialStep={1}
          onStepChange={(step) => setCurrentStep(step)}
          nextButtonText={getNextButtonText()}
          backButtonText="이전"
          nextButtonProps={getNextButtonProps()}
          backButtonProps={{
             disabled: loading || currentStep === 3 // Disable back on result screen
          }}
          stepCircleContainerClassName="bg-card border-border shadow-lg flex flex-col max-h-full h-full"
          stepContainerClassName="bg-muted/30 shrink-0 py-4"
          contentClassName="p-6 flex-1 min-h-0 overflow-y-auto"
          footerClassName="p-6 bg-muted/30 shrink-0"
        >
          {/* Step 1: Name Input */}
          <Step>
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">이름을 알려주세요</h2>
                <p className="text-muted-foreground">맞춤형 처방을 위해 당신의 이름을 입력해주세요.</p>
              </div>
              <div className="w-full max-w-sm">
                <Label htmlFor="name" className="sr-only">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center text-lg h-12"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      stepperRef.current.next();
                    }
                  }}
                />
              </div>
            </div>
          </Step>

          {/* Step 2: Photo Capture */}
          <Step>
            <div className="flex flex-col h-full space-y-4">
              <div className="text-center shrink-0">
                <h2 className="text-xl font-semibold mb-1">현재의 표정을 보여주세요</h2>
                <p className="text-sm text-muted-foreground">사진을 업로드하거나 카메라로 촬영해주세요.</p>
              </div>

              <div className="flex justify-center gap-4 shrink-0">
                 <Button 
                    variant={mode === 'upload' ? 'default' : 'outline'}
                    onClick={() => { setMode('upload'); handleRetake(); }}
                    className="gap-2 h-8 text-sm"
                 >
                    <Upload className="w-3 h-3" /> 업로드
                 </Button>
                 <Button 
                    variant={mode === 'camera' ? 'default' : 'outline'}
                    onClick={() => { setMode('camera'); handleRetake(); }}
                    className="gap-2 h-8 text-sm"
                 >
                    <Camera className="w-3 h-3" /> 카메라
                 </Button>
              </div>

              <Card className="flex-1 overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-muted/50 min-h-0">
                <div className="flex flex-col items-center justify-center h-full w-full p-2 relative">
                  {preview ? (
                    <div className="relative h-full w-full flex items-center justify-center">
                      <img src={preview} alt="Preview" className="rounded-lg shadow-sm max-h-full max-w-full object-contain" />
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="absolute top-2 right-2 opacity-90 hover:opacity-100"
                        onClick={handleRetake}
                      >
                        다시 선택
                      </Button>
                    </div>
                  ) : (
                    <>
                      {mode === 'upload' ? (
                        <div className="text-center w-full h-full flex flex-col items-center justify-center">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                            id="file-upload"
                          />
                          <Label 
                            htmlFor="file-upload" 
                            className="cursor-pointer flex flex-col items-center gap-4 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <span className="text-base font-medium text-muted-foreground">클릭하여 사진 선택하기</span>
                          </Label>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
                           <div className="relative rounded-lg overflow-hidden h-full w-full bg-black flex items-center justify-center">
                              <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ facingMode: "user" }}
                                className="max-h-full max-w-full object-contain"
                              />
                           </div>
                           <Button onClick={capture} className="gap-2 shrink-0">
                             <Camera className="w-4 h-4" /> 촬영하기
                           </Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                      <p className="text-lg font-medium animate-pulse">당신의 감정을 읽고 있습니다...</p>
                    </div>
                  )}
                </div>
              </Card>
              
              {error && (
                <div className="text-destructive text-center p-2 bg-destructive/10 rounded-md text-sm shrink-0">
                   {error}
                </div>
              )}
            </div>
          </Step>

          {/* Step 3: Result */}
          <Step>
            {result ? (
              <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-1 shrink-0">
                   <h2 className="text-2xl font-bold text-primary">처방전이 도착했습니다</h2>
                   <p className="text-md text-muted-foreground">
                      <span className="font-semibold text-foreground">{name}</span>님의 현재 기분은 
                      <span className="font-bold text-primary mx-1">"{result.analysis.detected_emotion}"</span>
                      인 것 같네요.
                   </p>
                </div>

                <Card className="border-primary/20 shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
                   <CardHeader className="bg-primary/5 pb-3 shrink-0">
                      <div className="flex items-start justify-between">
                         <div>
                            <CardDescription className="text-primary font-medium mb-1">오늘의 추천 문학</CardDescription>
                            <CardTitle className="text-xl">{result.recommendation.title}</CardTitle>
                         </div>
                         <BookOpen className="w-6 h-6 text-primary/40" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                         {result.recommendation.author} · {result.recommendation.genre}
                      </div>
                   </CardHeader>
                   <CardContent ref={scrollRef} className="pt-4 flex-1 overflow-y-auto">
                      <div className="prose prose-stone dark:prose-invert max-w-none">
                         <ScrollReveal
                           scrollContainerRef={scrollRef}
                           baseOpacity={0}
                           enableBlur={true}
                           baseRotation={5}
                           blurStrength={10}
                           rotationStrength={5}
                           wordAnimationEnd="bottom bottom"
                           textClassName="whitespace-pre-wrap leading-relaxed text-md font-normal"
                         >
                           {result.recommendation.content}
                         </ScrollReveal>
                      </div>
                      <Separator className="my-4" />
                      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                         <p className="font-medium text-foreground mb-1">AI 감정 분석 코멘트:</p>
                         {result.analysis.reason}
                      </div>
                   </CardContent>
                </Card>
              </div>
            ) : (
               <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">결과가 없습니다.</p>
               </div>
            )}
          </Step>
        </Stepper>
      </div>
    </div>
  );
}

export default App;
