import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import GlassSurface from "./GlassSurface";

const Stepper = forwardRef(function Stepper(
  {
    children,
    initialStep = 1,
    onStepChange = () => {},
    onFinalStepCompleted = () => {},
    stepCircleContainerClassName = "",
    stepContainerClassName = "",
    contentClassName = "",
    footerClassName = "",
    backButtonProps = {},
    nextButtonProps = {},
    backButtonText = "",
    nextButtonText = "다음",
    disableStepIndicators = false,
    renderStepIndicator,
    ...rest
  },
  ref
) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  useImperativeHandle(ref, () => ({
    next: handleNext,
    back: handleBack,
    goToStep: (step) => {
      setDirection(step > currentStep ? 1 : -1);
      updateStep(step);
    },
    currentStep,
  }));

  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center w-full h-full"
      {...rest}
    >
<GlassSurface
  className={`paper-surface mx-auto w-full max-w-5xl rounded-4xl shadow-xl flex flex-col ${stepCircleContainerClassName}`}
  innerClassName="flex flex-col h-full"
  width="100%"
  height="auto"
  highlightColor="rgba(0, 0, 0, 0.35)"
  style={{ minHeight: 620 }}
>


        {/* 상단 Step indicator */}
        <div
          className={`${stepContainerClassName} flex w-full items-center px-8 pt-8 pb-6 shrink-0 relative z-10`}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 본문 */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-8 pt-4 relative z-10 ${contentClassName}`}

        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* 하단 버튼 */}
        {!isCompleted && (
          <div className={`px-8 pb-8 shrink-0 relative z-10 ${footerClassName}`}>
            <div
              className={`mt-4 flex ${
                currentStep !== 1 ? "justify-between" : "justify-end"
              }`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className={`rounded-md px-3 py-2 text-sm transition ${
                    currentStep === 1
                      ? "pointer-events-none opacity-50 text-neutral-400"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}

              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="flex items-center justify-center rounded-full bg-emerald-600 py-2 px-4 text-sm font-semibold tracking-tight text-white transition hover:bg-emerald-700 active:bg-emerald-800 shadow-sm"
                {...nextButtonProps}
              >
                {isLastStep ? "완료" : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </GlassSurface>
    </div>
  );
});

export default Stepper;

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }) {
  return (
    <motion.div
      style={{ position: 'relative', overflow: 'visible', minHeight: 380 }}
      animate={{ height: isCompleted ? 0 : 'auto' }}
      transition={{ type: 'spring', duration: 0.35 }}
      className={`${className} min-h-0`}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction}>
            {/* ✅ 여기서 스크롤 */}
<div className="h-full overflow-y-auto pt-0 scroll-pt-24">
  {children}
</div>

          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


function SlideTransition({ children, direction }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // keep for potential future needs
    void containerRef.current;
  }, [children]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.22 }} // ✅ 더 가볍게(원하면 0으로)
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {children}
    </motion.div>
  );
}

/** ✅ 애니메이션도 병원 느낌으로 “살짝만” */
const stepVariants = {
  enter: (dir) => ({
    x: dir >= 0 ? 14 : -14,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir >= 0 ? -14 : 14,
    opacity: 0,
  }),
};

export function Step({ children, className = "" }) {
  return <div className={`h-full w-full px-8 ${className}`}>{children}</div>;
}

/**
 * ✅ 1/2/3 동그라미 “초록” 통일
 * - complete: 초록 배경 + 체크 흰색
 * - active: 초록 배경 + 안에 작은 흰 점
 * - inactive: 연한 민트 배경 + 초록 글씨
 */
function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }) {
  const status =
    currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: "rgba(16,185,129,0.14)", color: "#047857" }, // emerald-700
          active: { scale: 1, backgroundColor: "#10b981", color: "#10b981" }, // emerald-500
          complete: { scale: 1, backgroundColor: "#059669", color: "#ffffff" }, // emerald-600
        }}
        transition={{ duration: 0.2 }}
        className="flex h-9 w-9 items-center justify-center rounded-full font-semibold ring-4 ring-emerald-50"
        aria-label={`Step ${step}`}
      >
        {status === "complete" ? (
          <CheckIcon className="h-4 w-4 text-white" />
        ) : status === "active" ? (
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

/** ✅ 연결선도 초록 */
function StepConnector({ isComplete }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: "rgba(16,185,129,0)" },
    complete: { width: "100%", backgroundColor: "rgba(5,150,105,1)" }, // emerald-600
  };

  return (
    <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded bg-emerald-100">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.25 }}
      />
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.05, type: "tween", ease: "easeOut", duration: 0.2 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
