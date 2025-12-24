import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Stepper, { Step } from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, User } from 'lucide-react';
import PrescriptionSlip from "@/components/PrescriptionSlip";

import './App.css';

function App() {
  const stepperRef = useRef(null);
  const webcamRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const capturedFile = dataURLtoFile(imageSrc, 'camera-capture.jpg');
      setFile(capturedFile);
      setPreview(imageSrc);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
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
    formData.append('username', name);

    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      stepperRef.current?.next();
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
    stepperRef.current?.goToStep(1);
  };

  const getNextButtonText = () => {
    if (currentStep === 1) return "다음";
    if (currentStep === 2) return loading ? "분석 중..." : "감정 분석하기";
    return "처음으로";
  };

  const getNextButtonProps = () => {
    if (currentStep === 1) {
      return {
        disabled: !name.trim(),
        onClick: () => stepperRef.current?.next(),
      };
    }
    if (currentStep === 2) {
      return {
        disabled: !file || loading,
        onClick: handleAnalyze,
      };
    }
    if (currentStep === 3) {
      return { onClick: handleRestart };
    }
    return {};
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center py-2 px-3 overflow-hidden relative">
      {/* Header */}
      <div className="w-full max-w-7xl text-center mb-0 shrink-0 z-10 relative">
        <h1 className="text-3xl font-bold tracking-tight mt-5">오성 문학 의원</h1>
        <p className="text-muted-foreground text-sm mt-1">
          당신의 표정을 분석하여 어울리는 문학 작품을 처방해드립니다.
        </p>
      </div>

      {/* Main */}
      <div className="w-full max-w-3xl flex-1 min-h-0 flex flex-col z-10 relative">
        <Stepper
          ref={stepperRef}
          initialStep={1}
          onStepChange={(step) => setCurrentStep(step)}
          nextButtonText={getNextButtonText()}
          backButtonText=""
          nextButtonProps={getNextButtonProps()}
          backButtonProps={{ disabled: loading || currentStep === 3 }}
          stepCircleContainerClassName="stepper-big"
          stepContainerClassName="bg-muted/30 shrink-0 py-2"
          contentClassName="p-4 flex-1 min-h-0 overflow-y-auto"
          footerClassName="p-4 bg-muted/30 shrink-0"
        >
          {/* Step 1 */}
          <Step>
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-1">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-semibold">이름을 알려주세요</h2>
                <p className="text-muted-foreground">
                  맞춤형 문학 처방을 위해 당신의 이름을 입력해주세요.
                </p>
              </div>
              <div className="w-full max-w-sm">
                <Label htmlFor="name" className="sr-only">이름</Label>
                <Input
                  id="name"
                  placeholder="신 송 희"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center text-lg h-12"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) stepperRef.current?.next();
                  }}
                />
              </div>
            </div>
          </Step>

          {/* Step 2 */}
          <Step>
            <div className="flex flex-col h-full space-y-3">
              <div className="flex-1 min-h-0 rounded-xl bg-muted/50 overflow-hidden relative">

                <div className="h-full w-full p-3 relative">
                  {preview ? (
                    <div className="relative h-full w-full flex flex-col items-center justify-center">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-[70%] h-full rounded-lg shadow-sm object-cover"
                      />

                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <Button
                          onClick={handleRetake}
                          variant="ghost"
                          className="gap-2 px-4 py-2 text-muted-foreground bg-background/60 backdrop-blur-sm hover:bg-background/80"
                        >
                          <Camera className="w-4 h-4" /> 재촬영 !
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-full w-full">
                      {/* ✅ 웹캠 너비 줄이고 중앙 정렬 */}
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[70%] rounded-lg overflow-hidden bg-black">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "user" }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* ✅ 촬영 전: 버튼 1개만 + 매우 은은하게 */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <Button
                          onClick={capture}
                          variant="ghost"
                          className="gap-2 px-4 py-2 text-muted-foreground bg-background/60 backdrop-blur-sm hover:bg-background/80"
                        >
                          <Camera className="w-4 h-4" /> 촬영하기 !
                        </Button>
                      </div>

                      {/* ✅ 촬영 전 파일 선택은 완전 숨김 (사진 찍는 흐름 방해 X) */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                      <p className="text-lg font-medium animate-pulse">당신의 감정을 읽고 있습니다...</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-destructive text-center p-2 bg-destructive/10 rounded-md text-sm shrink-0">
                  {error}
                </div>
              )}
            </div>
          </Step>

          {/* Step 3 */}
          <Step>
            {result ? (
              <div className="flex items-center justify-center" >
                <PrescriptionSlip name={name} result={result} hospitalName="오성 문학의원" />
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
