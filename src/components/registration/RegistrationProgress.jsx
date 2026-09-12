import React from 'react';
import { User, Building2, ShieldCheck, Check } from 'lucide-react';

const steps = [
  { id: 1, title: 'Doctor Info', shortLabel: 'Doctor', icon: User },
  { id: 2, title: 'Clinic Info', shortLabel: 'Clinic', icon: Building2 },
  { id: 3, title: 'Account & Submit', shortLabel: 'Account', icon: ShieldCheck },
];

const RegistrationProgress = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative max-w-xs sm:max-w-md mx-auto px-2">
        {/* Background Track Line */}
        <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-200 -z-0" />
        
        {/* Active Progress Fill Line */}
        <div
          className="absolute top-4 left-6 h-[2px] bg-blue-600 transition-all duration-300 -z-0"
          style={{
            width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
          }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center relative z-10 ${
                isCompleted ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => isCompleted && onStepClick && onStepClick(step.id)}
            >
              {/* Step Circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-sm ${
                  isCompleted
                    ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`text-[11px] sm:text-xs font-medium mt-1.5 transition-colors ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : isCompleted
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegistrationProgress;
