import React, { useState, useEffect } from 'react';
import { UserInput, Language, Theme, HealthResults } from './types/health';
import { getTranslation } from './i18n/translations';
import { calculateHealthResults } from './calculations/healthEngine';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Step1BasicInfo } from './components/steps/Step1BasicInfo';
import { Step2BodyMeasurements } from './components/steps/Step2BodyMeasurements';
import { Step3ActivityLevel } from './components/steps/Step3ActivityLevel';
import { Step4Goal } from './components/steps/Step4Goal';
import { Step5Results } from './components/steps/Step5Results';
import { SaveImageModal } from './components/SaveImageModal';
import { FoodReferencePanel } from './components/FoodReferencePanel';
import { PasswordGate } from './components/PasswordGate';
import { ChevronRight, ChevronLeft, Calculator } from 'lucide-react';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('hc_access_gate_unlocked') === 'true';
  });
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('light');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);

  // In-memory user input state (resets on refresh)
  const [input, setInput] = useState<UserInput>({
    age: 22,
    gender: 'male',
    heightCm: 176,
    weightKg: 77,
    activityLevel: 'moderate',
    goal: 'maintain',
    weightLossAdjustment: 0.15,
    weightGainAdjustment: 0.10,
    proteinGPerKg: 2.0,
    fatGPerKg: 0.7,
  });

  const [results, setResults] = useState<HealthResults | null>(null);

  const t = getTranslation(lang);

  // Sync RTL / LTR document direction
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync Theme class on HTML root element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleInputChange = (fields: Partial<UserInput>) => {
    setErrorMsg(null);
    setInput((prev) => ({ ...prev, ...fields }));
  };

  const validateCurrentStep = (): boolean => {
    setErrorMsg(null);

    if (currentStep === 1) {
      if (!input.age || input.age < 12 || input.age > 90) {
        setErrorMsg(t.validation.ageRange);
        return false;
      }
    }

    if (currentStep === 2) {
      if (!input.heightCm || input.heightCm < 50 || input.heightCm > 250) {
        setErrorMsg(t.validation.heightRange);
        return false;
      }
      if (!input.weightKg || input.weightKg < 10 || input.weightKg > 300) {
        setErrorMsg(t.validation.weightRange);
        return false;
      }
    }

    if (currentStep === 4) {
      if (!input.proteinGPerKg || input.proteinGPerKg <= 0 || !input.fatGPerKg || input.fatGPerKg <= 0) {
        setErrorMsg(t.validation.macroPositive);
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep === 4) {
      // Execute pure orchestrator calculation function
      const calculated = calculateHealthResults(input);
      setResults(calculated);
      setCurrentStep(5);
      setMaxVisitedStep(5);
    } else {
      const nextStep = Math.min(currentStep + 1, 5);
      setCurrentStep(nextStep);
      setMaxVisitedStep((prev) => Math.max(prev, nextStep));
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep <= maxVisitedStep && targetStep !== currentStep) {
      setErrorMsg(null);
      if (targetStep === 5) {
        // Recalculate results in case inputs were updated in earlier steps
        const calculated = calculateHealthResults(input);
        setResults(calculated);
        setCurrentStep(5);
      } else {
        setCurrentStep(targetStep);
      }
    }
  };

  const handleReset = () => {
    setErrorMsg(null);
    setCurrentStep(1);
    setMaxVisitedStep(1);
    setResults(null);
  };

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        lang={lang}
        onLanguageChange={setLang}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between">
        <div>
          {/* 5-Step Indicator with Clickable Navigation for Visited Steps */}
          <StepIndicator
            currentStep={currentStep}
            maxCompletedStep={maxVisitedStep}
            lang={lang}
            onStepClick={handleStepClick}
          />

          {/* Form Step Container */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-md">
            {currentStep === 1 && (
              <Step1BasicInfo
                input={input}
                onChange={handleInputChange}
                lang={lang}
                error={errorMsg}
              />
            )}

            {currentStep === 2 && (
              <Step2BodyMeasurements
                input={input}
                onChange={handleInputChange}
                lang={lang}
                error={errorMsg}
              />
            )}

            {currentStep === 3 && (
              <Step3ActivityLevel
                input={input}
                onChange={handleInputChange}
                lang={lang}
              />
            )}

            {currentStep === 4 && (
              <Step4Goal
                input={input}
                onChange={handleInputChange}
                lang={lang}
                error={errorMsg}
              />
            )}

            {currentStep === 5 && results && (
              <Step5Results
                results={results}
                input={input}
                lang={lang}
                onReset={handleReset}
                onOpenSaveImage={() => setIsSaveModalOpen(true)}
              />
            )}

            {/* Navigation Bar (Steps 1 to 4) */}
            {currentStep < 5 && (
              <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center gap-1.5 transition-colors"
                  >
                    {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    <span>{t.navigation.prev}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-health-600 hover:bg-health-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>{currentStep === 4 ? t.navigation.calculate : t.navigation.next}</span>
                  {currentStep === 4 ? (
                    <Calculator className="w-4 h-4" />
                  ) : lang === 'ar' ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Save Image Modal */}
      {results && (
        <SaveImageModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          results={results}
          input={input}
          lang={lang}
        />
      )}

      {/* Food Reference Floating Guide */}
      <FoodReferencePanel lang={lang} />
    </div>
  );
};
