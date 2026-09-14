import React from 'react';
import { UserInput, Language, ActivityId } from '../../types/health';
import { getTranslation } from '../../i18n/translations';
import { ACTIVITY_FACTORS } from '../../calculations/healthEngine';
import { Flame } from 'lucide-react';

interface Step3Props {
  input: UserInput;
  onChange: (fields: Partial<UserInput>) => void;
  lang: Language;
}

export const Step3ActivityLevel: React.FC<Step3Props> = ({ input, onChange, lang }) => {
  const t = getTranslation(lang);

  const options: ActivityId[] = [
    'sedentary',
    'light',
    'moderate',
    'very_active',
    'extra_active',
  ];

  return (
    <div className="space-y-3.5 animate-fadeIn">
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {t.inputs.activityLabel} <span className="text-rose-500">*</span>
      </label>

      <div className="space-y-2.5">
        {options.map((id) => {
          const isSelected = input.activityLevel === id;
          const opt = t.activityOptions[id];
          const factor = ACTIVITY_FACTORS[id];

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ activityLevel: id })}
              className={`w-full p-4 rounded-xl border-2 text-start flex items-center justify-between gap-3 transition-all ${
                isSelected
                  ? 'border-health-600 dark:border-health-400 bg-health-50 dark:bg-slate-800 shadow-sm ring-1 ring-health-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      isSelected
                        ? 'text-health-900 dark:text-white'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {opt.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-health-700 dark:text-health-300 border border-health-200 dark:border-slate-600'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ×{factor}
                  </span>
                </div>
                <p
                  className={`text-xs line-clamp-2 ${
                    isSelected
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {opt.desc}
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'border-health-600 dark:border-health-400 bg-health-600 dark:bg-health-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
