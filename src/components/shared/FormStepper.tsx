"use client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step { n: number; label: string; description?: string; }

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (n: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center">
        {steps.map((step, i) => (
          <div key={step.n} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => onStepClick?.(step.n)}
              disabled={step.n > currentStep}
              className="flex items-center gap-3 group"
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all border-2",
                currentStep > step.n ? "bg-primary border-primary text-white" :
                currentStep === step.n ? "bg-white border-primary text-primary ring-4 ring-primary/15" :
                "bg-white border-border text-muted-foreground"
              )}>
                {currentStep > step.n ? <Check className="w-4 h-4" /> : step.n}
              </div>
              <div className="text-left hidden lg:block">
                <p className={cn("text-xs font-semibold", currentStep >= step.n ? "text-primary" : "text-muted-foreground")}>{step.label}</p>
                {step.description && <p className="text-[10px] text-muted-foreground">{step.description}</p>}
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-3 rounded", currentStep > step.n ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>
      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between mb-2">
        <span className="text-sm font-semibold text-primary">Step {currentStep} of {steps.length}</span>
        <span className="text-sm text-muted-foreground">{steps[currentStep - 1]?.label}</span>
      </div>
      <div className="md:hidden w-full bg-border rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
      </div>
    </div>
  );
}
