import React from 'react';
import { UserInput, Language, GoalId } from '../../types/health';
import { getTranslation } from '../../i18n/translations';
import { TrendingDown, TrendingUp, Minus, Dumbbell, AlertCircle } from 'lucide-react';

interface Step4Props {
  input: UserInput;
  onChange: (fields: Partial<UserInput>) => void;
  lang: Language;
  error?: string | null;
}

export const Step4Goal: React.FC<Step4Props> = ({ input, onChange, lang, error }) => {
  const t = getTranslation(lang);

  const goals: { id: GoalId; icon: React.ReactNode }[] = [
    { id: 'maintain', icon: <Minus className="w-5 h-5 text-sky-600 dark:text-sky-400" /> },
    { id: 'lose', icon: <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" /> },
    { id: 'gain', icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> },
  ];

  const handleGoalSelect = (id: GoalId) => {
    // If switching goal, set sensible default guidance if current is untouched
    let updates: Partial<UserInput> = { goal: id };
    if (id === 'lose' && (!input.proteinGPerKg || input.proteinGPerKg === 1.8 || input.proteinGPerKg === 1.7)) {
      updates.proteinGPerKg = 2.0;
      updates.fatGPerKg = 0.7;
    } else if (id === 'gain' && (!input.proteinGPerKg || input.proteinGPerKg === 2.0 || input.proteinGPerKg === 1.8)) {
      updates.proteinGPerKg = 1.7;
      updates.fatGPerKg = 0.9;
    } else if (id === 'maintain' && (!input.proteinGPerKg || input.proteinGPerKg === 2.0 || input.proteinGPerKg === 1.7)) {
      updates.proteinGPerKg = 1.8;
      updates.fatGPerKg = 0.8;
    }
    onChange(updates);
  };

  const handleProteinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ proteinGPerKg: 0 });
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange({ proteinGPerKg: num });
      }
    }
  };

  const handleFatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ fatGPerKg: 0 });
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange({ fatGPerKg: num });
      }
    }
  };

  // Preview calculations
  const weight = input.weightKg || 70;
  const proteinGramsPreview = Math.round(weight * (input.proteinGPerKg || 0));
  const fatGramsPreview = Math.round(weight * (input.fatGPerKg || 0));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Goal Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
          {t.inputs.goalLabel} <span className="text-rose-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals.map(({ id, icon }) => {
            const isSelected = input.goal === id;
            const opt = t.goalOptions[id];

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleGoalSelect(id)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                  isSelected
                    ? 'border-health-600 dark:border-health-400 bg-health-50 dark:bg-slate-800 shadow-sm ring-1 ring-health-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div
                  className={`p-2.5 rounded-full ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60'
                  }`}
                >
                  {icon}
                </div>
                <span
                  className={`font-bold text-sm ${
                    isSelected
                      ? 'text-health-900 dark:text-white'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {opt.title}
                </span>
                <span
                  className={`text-[11px] line-clamp-2 ${
                    isSelected
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dynamic Adjustment Options for Lose Goal */}
      {input.goal === 'lose' && (
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/60 space-y-2.5 animate-fadeIn">
          <label className="block text-xs font-semibold text-amber-950 dark:text-amber-300">
            {lang === 'ar' ? 'اختر نسبة عجز السعرات (خسارة الوزن):' : 'Select Calorie Deficit Rate:'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[0.10, 0.15, 0.20].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ weightLossAdjustment: val })}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  input.weightLossAdjustment === val
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {(val * 100).toFixed(0)}%
              </button>
            ))}
          </div>
          <p className="text-[11px] text-amber-900 dark:text-amber-300/90">
            {input.weightLossAdjustment === 0.10 && (lang === 'ar' ? 'عجز خفيف ومتدرج (10%)' : 'Mild & gradual deficit (10%)')}
            {input.weightLossAdjustment === 0.15 && (lang === 'ar' ? 'عجز متوازن وفعال موصى به (15%)' : 'Recommended balanced deficit (15%)')}
            {input.weightLossAdjustment === 0.20 && (lang === 'ar' ? 'عجز مكثف لحرق الدهون (20%)' : 'Intensive fat loss deficit (20%)')}
          </p>
        </div>
      )}

      {/* 3. Dynamic Adjustment Options for Gain Goal */}
      {input.goal === 'gain' && (
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-900/60 space-y-2.5 animate-fadeIn">
          <label className="block text-xs font-semibold text-emerald-950 dark:text-emerald-300">
            {lang === 'ar' ? 'اختر نسبة فائض السعرات (زيادة الوزن):' : 'Select Calorie Surplus Rate:'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[0.10, 0.15].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ weightGainAdjustment: val })}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  input.weightGainAdjustment === val
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {(val * 100).toFixed(0)}%
              </button>
            ))}
          </div>
          <p className="text-[11px] text-emerald-900 dark:text-emerald-300/90">
            {input.weightGainAdjustment === 0.10 && (lang === 'ar' ? 'فائض خفيف لبناء عضل صافي (10%)' : 'Lean muscle surplus (10%)')}
            {input.weightGainAdjustment === 0.15 && (lang === 'ar' ? 'فائض أسرع لزيادة الوزن (15%)' : 'Faster weight gain surplus (15%)')}
          </p>
        </div>
      )}

      {/* 4. Manual Protein & Fat Inputs for EVERY Goal */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
          <Dumbbell className="w-4 h-4 text-health-600 dark:text-health-400" />
          <span>{lang === 'ar' ? 'إعدادات الماكروز اليدوية (البروتين والدهون)' : 'Manual Macro Settings (Protein & Fat)'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Protein Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="protein-input" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.inputs.proteinLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-health-700 dark:text-health-300 font-mono font-medium">
                ≈ {proteinGramsPreview} g/day
              </span>
            </div>
            <div className="relative">
              <input
                id="protein-input"
                type="number"
                step="0.1"
                min="0.1"
                value={input.proteinGPerKg > 0 ? input.proteinGPerKg : ''}
                onChange={handleProteinChange}
                placeholder="2.0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-health-500 focus:outline-none shadow-xs"
              />
              <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3.5 rtl:left-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                {t.inputs.gPerKgUnit}
              </div>
            </div>
            {/* Guidance Text */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {input.goal === 'lose' && t.inputs.proteinGuidanceLose}
              {input.goal === 'gain' && t.inputs.proteinGuidanceGain}
              {input.goal === 'maintain' && t.inputs.proteinGuidanceMaintain}
            </p>
          </div>

          {/* Fat Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="fat-input" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.inputs.fatLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-health-700 dark:text-health-300 font-mono font-medium">
                ≈ {fatGramsPreview} g/day
              </span>
            </div>
            <div className="relative">
              <input
                id="fat-input"
                type="number"
                step="0.1"
                min="0.1"
                value={input.fatGPerKg > 0 ? input.fatGPerKg : ''}
                onChange={handleFatChange}
                placeholder="0.7"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-health-500 focus:outline-none shadow-xs"
              />
              <div className="absolute top-1/2 -translate-y-1/2 ltr:right-3.5 rtl:left-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                {t.inputs.gPerKgUnit}
              </div>
            </div>
            {/* Guidance Text */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {input.goal === 'lose' && t.inputs.fatGuidanceLose}
              {input.goal === 'gain' && t.inputs.fatGuidanceGain}
              {input.goal === 'maintain' && t.inputs.fatGuidanceMaintain}
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <span className="font-bold text-health-600 dark:text-health-400">ℹ</span>
          <span>
            {lang === 'ar'
              ? 'يتم حساب الكربوهيدرات تلقائياً من السعرات المتبقية بعد استيفاء البروتين والدهون.'
              : 'Carbohydrates will be calculated automatically from the calories remaining after Protein and Fat.'}
          </span>
        </div>
      </div>

      {/* Inline Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
