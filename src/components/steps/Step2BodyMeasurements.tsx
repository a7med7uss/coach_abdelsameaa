import React from 'react';
import { UserInput, Language } from '../../types/health';
import { getTranslation } from '../../i18n/translations';
import { Ruler, Scale, AlertCircle } from 'lucide-react';

interface Step2Props {
  input: UserInput;
  onChange: (fields: Partial<UserInput>) => void;
  lang: Language;
  error?: string | null;
}

export const Step2BodyMeasurements: React.FC<Step2Props> = ({
  input,
  onChange,
  lang,
  error,
}) => {
  const t = getTranslation(lang);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ heightCm: 0 });
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange({ heightCm: num });
      }
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ weightKg: 0 });
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange({ weightKg: num });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Height Input */}
      <div>
        <label
          htmlFor="height-input"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5"
        >
          <Ruler className="w-4 h-4 text-health-600 dark:text-health-400" />
          <span>{t.inputs.heightLabel}</span>
          <span className="text-slate-400 font-normal">({t.inputs.heightUnit})</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="height-input"
            type="number"
            min={50}
            max={250}
            step="0.1"
            value={input.heightCm > 0 ? input.heightCm : ''}
            onChange={handleHeightChange}
            placeholder={t.inputs.heightPlaceholder}
            className={`w-full px-4 py-3.5 rounded-xl border ${
              error && input.heightCm <= 0
                ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            } text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-health-500 focus:border-health-500 focus:outline-none transition-all shadow-sm`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 text-xs font-semibold text-slate-400 pointer-events-none">
            {t.inputs.heightUnit}
          </div>
        </div>
      </div>

      {/* Weight Input */}
      <div>
        <label
          htmlFor="weight-input"
          className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5"
        >
          <Scale className="w-4 h-4 text-health-600 dark:text-health-400" />
          <span>{t.inputs.weightLabel}</span>
          <span className="text-slate-400 font-normal">({t.inputs.weightUnit})</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="weight-input"
            type="number"
            min={10}
            max={300}
            step="0.1"
            value={input.weightKg > 0 ? input.weightKg : ''}
            onChange={handleWeightChange}
            placeholder={t.inputs.weightPlaceholder}
            className={`w-full px-4 py-3.5 rounded-xl border ${
              error && input.weightKg <= 0
                ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            } text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-health-500 focus:border-health-500 focus:outline-none transition-all shadow-sm`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 text-xs font-semibold text-slate-400 pointer-events-none">
            {t.inputs.weightUnit}
          </div>
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
