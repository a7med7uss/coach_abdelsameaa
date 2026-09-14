import React from 'react';
import { UserInput, Language, Gender } from '../../types/health';
import { getTranslation } from '../../i18n/translations';
import { User, Users, AlertCircle } from 'lucide-react';

interface Step1Props {
  input: UserInput;
  onChange: (fields: Partial<UserInput>) => void;
  lang: Language;
  error?: string | null;
}

export const Step1BasicInfo: React.FC<Step1Props> = ({
  input,
  onChange,
  lang,
  error,
}) => {
  const t = getTranslation(lang);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ age: 0 });
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        onChange({ age: num });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Age Input */}
      <div>
        <label
          htmlFor="age-input"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2"
        >
          {t.inputs.ageLabel} <span className="text-slate-400 font-normal">({t.inputs.ageUnit})</span> <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="age-input"
            type="number"
            min={12}
            max={90}
            value={input.age > 0 ? input.age : ''}
            onChange={handleAgeChange}
            placeholder={t.inputs.agePlaceholder}
            className={`w-full px-4 py-3.5 rounded-xl border ${
              error
                ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            } text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-health-500 focus:border-health-500 focus:outline-none transition-all shadow-sm`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 text-xs font-semibold text-slate-400 pointer-events-none">
            {t.inputs.ageUnit}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          {lang === 'ar' ? 'العمر المتاح من 12 إلى 90 سنة' : 'Available age: 12 to 90 years'}
        </p>
      </div>

      {/* Gender Selection Cards */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
          {t.inputs.genderLabel} <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onChange({ gender: 'male' })}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
              input.gender === 'male'
                ? 'border-health-600 dark:border-health-400 bg-health-50 dark:bg-slate-800 text-health-800 dark:text-white shadow-sm ring-1 ring-health-500'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <User className="w-8 h-8 text-health-600 dark:text-health-400" />
            <span className="font-bold text-sm sm:text-base">{t.inputs.male}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ gender: 'female' })}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
              input.gender === 'female'
                ? 'border-health-600 dark:border-health-400 bg-health-50 dark:bg-slate-800 text-health-800 dark:text-white shadow-sm ring-1 ring-health-500'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Users className="w-8 h-8 text-health-600 dark:text-health-400" />
            <span className="font-bold text-sm sm:text-base">{t.inputs.female}</span>
          </button>
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
