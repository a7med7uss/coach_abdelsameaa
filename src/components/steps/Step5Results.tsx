import React from 'react';
import { HealthResults, UserInput, Language } from '../../types/health';
import { getTranslation } from '../../i18n/translations';
import { BMIVisualizer } from '../BMIVisualizer';
import { CalculationDetails } from '../CalculationDetails';
import {
  Heart,
  Flame,
  Scale,
  PieChart,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface Step5Props {
  results: HealthResults;
  input: UserInput;
  lang: Language;
  onReset: () => void;
  onOpenSaveImage: () => void;
}

export const Step5Results: React.FC<Step5Props> = ({
  results,
  input,
  lang,
  onReset,
  onOpenSaveImage,
}) => {
  const t = getTranslation(lang);

  const getCategoryTranslation = (key: string) => {
    return (t.bmiCategories as any)[key] || key;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-4">
      {/* 1. HEALTH SUMMARY SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-health-700 dark:text-health-400 font-bold text-base border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Heart className="w-5 h-5 text-rose-500" />
          <h2>{t.results.healthSummary}</h2>
        </div>

        {/* Primary BMI Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-health-50/70 dark:bg-slate-850 dark:bg-slate-900/60 p-4 rounded-xl border border-health-100 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-health-800 dark:text-health-300">
                {t.results.bmiLabel}
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {results.bmi.toFixed(1)}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t.results.weightStatusLabel}:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-health-800 dark:text-health-300 shadow-xs border border-health-200 dark:border-slate-700">
                {getCategoryTranslation(results.bmiCategory)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.results.currentWeightLabel}
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {input.weightKg} <span className="text-xs font-normal text-slate-500">{t.inputs.weightUnit}</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.results.healthyWeightRangeLabel}
              </span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {results.minHealthyWeight} – {results.maxHealthyWeight} <span className="text-xs text-slate-500">{t.inputs.weightUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual BMI Gauge */}
        <BMIVisualizer bmi={results.bmi} visualZone={results.bmiVisualZone} lang={lang} />
      </div>

      {/* 2. CALORIES SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-health-700 dark:text-health-400 font-bold text-base border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Flame className="w-5 h-5 text-amber-500" />
          <h2>{t.results.caloriesSection}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {t.results.bmrLabel}
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {results.bmr}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{t.results.bmrDesc}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {t.results.tdeeLabel}
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {results.tdee}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{t.results.tdeeDesc}</span>
          </div>

          <div className="bg-health-600 text-white p-4 rounded-xl shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90 block">
                {t.results.targetCaloriesLabel}
              </span>
              <div className="text-3xl font-black mt-1">
                {results.targetCalories}
              </div>
            </div>
            <span className="text-[10px] opacity-80 block mt-1">{t.results.targetCaloriesDesc}</span>
          </div>
        </div>
      </div>

      {/* 3. WEIGHT ANALYSIS SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-health-700 dark:text-health-400 font-bold text-base border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Scale className="w-5 h-5 text-health-600 dark:text-health-400" />
          <h2>{t.results.weightAnalysisSection}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 block">{t.results.minHealthyWeightLabel}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{results.minHealthyWeight} {t.inputs.weightUnit}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 block">{t.results.maxHealthyWeightLabel}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{results.maxHealthyWeight} {t.inputs.weightUnit}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 block">{t.results.obesityThresholdLabel}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{results.obesityThresholdWeight} {t.inputs.weightUnit}</span>
          </div>
        </div>

        {/* Clean Weight Gap Presentation */}
        {results.isUnderweight && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold">{t.results.weightToGainLabel}</span>
            </div>
            <span className="text-lg font-black text-blue-700 dark:text-blue-300">
              +{results.weightToGain} {t.inputs.weightUnit}
            </span>
          </div>
        )}

        {results.isOverweightOrObese && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold">{t.results.weightToLoseLabel}</span>
            </div>
            <span className="text-lg font-black text-amber-700 dark:text-amber-300">
              -{results.weightToLose} {t.inputs.weightUnit}
            </span>
          </div>
        )}

        {results.isHealthy && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{t.results.healthyWeightNote}</span>
          </div>
        )}
      </div>

      {/* 4. DAILY NUTRITION NEEDS (MACROS) SECTION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-health-700 dark:text-health-400 font-bold text-base border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <PieChart className="w-5 h-5 text-emerald-500" />
          <h2>{t.results.macrosSection}</h2>
        </div>

        {/* Calorie Exceeded Warning Alert Banner */}
        {results.isMacroCalorieExceeded && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t.results.macroCalorieExceededWarning}</p>
              <p className="mt-1 opacity-90">{t.results.reduceGPerKgPrompt}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {/* Protein Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {t.results.proteinLabel}
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-health-600 dark:text-health-400 font-semibold">
                  {results.macros.proteinGPerKg} {t.inputs.gPerKgUnit}
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-health-100 dark:bg-health-950/60 text-health-700 dark:text-health-300 font-bold">
                  {results.macros.proteinPercent}%
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                {results.macros.proteinGrams} <span className="text-xs font-normal text-slate-400">g</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1.5">
              {results.macros.proteinCalories} {t.results.kcalUnit}
            </span>
          </div>

          {/* Fat Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {t.results.fatLabel}
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-health-600 dark:text-health-400 font-semibold">
                  {results.macros.fatGPerKg} {t.inputs.gPerKgUnit}
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-health-100 dark:bg-health-950/60 text-health-700 dark:text-health-300 font-bold">
                  {results.macros.fatPercent}%
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                {results.macros.fatGrams} <span className="text-xs font-normal text-slate-400">g</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1.5">
              {results.macros.fatCalories} {t.results.kcalUnit}
            </span>
          </div>

          {/* Carbohydrates Card (Calculated from remaining calories) */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              results.isMacroCalorieExceeded
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-700'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {t.results.carbohydratesLabel}
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {lang === 'ar' ? 'المتبقي تلقائياً' : 'Remaining Auto'}
                </span>
                {!results.isMacroCalorieExceeded && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    {results.macros.carbohydratePercent}%
                  </span>
                )}
              </div>
              {results.isMacroCalorieExceeded ? (
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-2">
                  {t.results.calorieExceededShort}
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                  {results.macros.carbohydrateGrams} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1.5">
              {results.isMacroCalorieExceeded ? '—' : `${results.macros.carbohydrateCalories} ${t.results.kcalUnit}`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. CALCULATION DETAILS SECTION */}
      <CalculationDetails results={results} lang={lang} />

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onOpenSaveImage}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-health-600 hover:bg-health-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
        >
          <Camera className="w-5 h-5" />
          <span>{t.navigation.saveImage}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.navigation.recalculate}</span>
        </button>
      </div>
    </div>
  );
};
