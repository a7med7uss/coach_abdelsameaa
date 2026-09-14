import React from 'react';
import { Language } from '../types/health';
import { getTranslation } from '../i18n/translations';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number; // 1 to 5
  maxCompletedStep?: number;
  lang: Language;
  onStepClick?: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  maxCompletedStep = 1,
  lang,
  onStepClick,
}) => {
  const t = getTranslation(lang);

  const stepTitles = [
    t.steps.basicInfo,
    t.steps.bodyMeasurements,
    t.steps.activityLevel,
    t.steps.yourGoal,
    t.steps.results,
  ];

  return (
    <nav aria-label="Step progress" className="w-full mb-6 sm:mb-8">
      {/* Progress Bar Container */}
      <div className="flex items-center justify-between relative max-w-2xl mx-auto px-2">
        {/* Background Track Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 -z-0 rounded-full" />
        
        {/* Active Progress Track Line */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-health-600 dark:bg-health-500 -z-0 rounded-full transition-all duration-300 ltr:left-4 ltr:right-auto rtl:right-4 rtl:left-auto"
          style={{
            width: `calc(${((currentStep - 1) / 4) * 100}% - 1rem)`,
          }}
        />

        {/* Step Circles */}
        {stepTitles.map((title, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          // Step is clickable if it is already completed OR was previously reached (and not current)
          const isClickable = Boolean(
            onStepClick && !isCurrent && (stepNum < currentStep || stepNum <= maxCompletedStep)
          );

          const circleContent = (
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                isCompleted
                  ? 'bg-health-600 dark:bg-health-500 text-white shadow-xs hover:bg-health-700 dark:hover:bg-health-400'
                  : isCurrent
                  ? 'bg-white dark:bg-slate-800 text-health-600 dark:text-health-400 border-2 border-health-600 dark:border-health-500 shadow-md scale-110'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 opacity-60'
              } ${isClickable ? 'cursor-pointer hover:scale-105 active:scale-95 ring-offset-1 focus:outline-none focus:ring-2 focus:ring-health-500' : ''}`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </div>
          );

          return (
            <div key={stepNum} className="flex flex-col items-center relative z-10">
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNum)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  aria-label={`${title} (${stepNum}) - ${lang === 'ar' ? 'الرجوع لهذه الخطوة' : 'Return to this step'}`}
                >
                  {circleContent}
                  <span className="text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block text-center max-w-[80px] truncate text-slate-600 dark:text-slate-300 group-hover:text-health-600 dark:group-hover:text-health-400 underline-offset-2 group-hover:underline">
                    {title}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  {circleContent}
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block text-center max-w-[80px] truncate ${
                      isCurrent
                        ? 'text-health-700 dark:text-health-300 font-bold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {title}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Label on Mobile */}
      <div className="sm:hidden text-center mt-3">
        <span className="text-xs font-semibold text-health-700 dark:text-health-400">
          {t.steps.results === stepTitles[currentStep - 1] ? '' : `${currentStep}/5: `}
          {stepTitles[currentStep - 1]}
        </span>
      </div>
    </nav>
  );
};
