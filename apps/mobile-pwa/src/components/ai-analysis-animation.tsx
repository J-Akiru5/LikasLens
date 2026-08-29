"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Leaf } from "lucide-react";
import { cn } from "@likaslens/shared";

interface AnalysisStep {
  label: string;
  detail?: string;
}

const DEFAULT_STEPS: AnalysisStep[] = [
  { label: "Scanning evidence..." },
  { label: "Environmental incident detected", detail: "Photo analysis complete" },
  { label: "Category identified", detail: "Illegal Waste Disposal" },
  { label: "Severity assessed", detail: "High" },
  { label: "Recommended office", detail: "LGU Environment Office" },
];

interface AIAnalysisAnimationProps {
  steps?: AnalysisStep[];
  photoUrl?: string;
  onComplete?: () => void;
  duration?: number;
}

export function AIAnalysisAnimation({
  steps = DEFAULT_STEPS,
  photoUrl,
  onComplete,
  duration = 5000,
}: AIAnalysisAnimationProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [scanLine, setScanLine] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const stepDuration = duration / (steps.length + 1);
    let timeout: NodeJS.Timeout;

    if (currentStep < steps.length - 1) {
      timeout = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, stepDuration);
    } else {
      // All steps done, wait a beat then complete
      timeout = setTimeout(() => {
        onCompleteRef.current?.();
      }, 800);
    }

    return () => clearTimeout(timeout);
  }, [currentStep, steps.length, duration]);

  // Scan line animation
  useEffect(() => {
    if (currentStep !== 0) return;
    const interval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 30);
    return () => clearInterval(interval);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center px-6">
      {/* Photo background (blurred) */}
      {photoUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "blur(20px) brightness(0.3)" }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">
        {/* AI Icon with pulse */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer pulse rings */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid rgba(34,214,114,0.2)",
                animation: "aiPulse 2s ease-in-out infinite",
                transform: "scale(1.5)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "1px solid rgba(34,214,114,0.1)",
                animation: "aiPulse 2s ease-in-out infinite 0.5s",
                transform: "scale(2)",
              }}
            />
            {/* Main icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(34,214,114,0.15)",
                border: "2px solid rgba(34,214,114,0.4)",
                boxShadow: "0 0 40px rgba(34,214,114,0.2)",
              }}
            >
              <Leaf className="w-8 h-8 text-green" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-center text-lg font-bold mb-6"
          style={{ color: "#e8f5ee" }}
        >
          Analyzing Evidence
        </h2>

        {/* Scan line (during first step) */}
        {currentStep === 0 && (
          <div className="relative h-1 rounded-full bg-white/10 mb-6 overflow-hidden mx-8">
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${scanLine}%`,
                background:
                  "linear-gradient(90deg, transparent, #22d672)",
                transition: "width 0.03s linear",
              }}
            />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            const isPending = i > currentStep;

            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 transition-all duration-500",
                  isPending && "opacity-30",
                  isComplete && "opacity-100",
                  isCurrent && "opacity-100"
                )}
                style={{
                  transform: isComplete || isCurrent
                    ? "translateX(0)"
                    : "translateX(-8px)",
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <div className="w-5 h-5 rounded-full bg-green/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-green animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/5" />
                  )}
                </div>

                {/* Text */}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isComplete
                        ? "#22d672"
                        : isCurrent
                          ? "#e8f5ee"
                          : "rgba(232,245,238,0.3)",
                    }}
                  >
                    {isCurrent && currentStep === 0
                      ? "Scanning evidence..."
                      : step.label}
                  </p>
                  {step.detail && (isComplete || isCurrent) && (
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: isComplete
                          ? "rgba(34,214,114,0.7)"
                          : "rgba(232,245,238,0.4)",
                      }}
                    >
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aiPulse {
          0%, 100% { transform: scale(1.5); opacity: 0.3; }
          50% { transform: scale(1.8); opacity: 0.1; }
        }
      `}} />
    </div>
  );
}
