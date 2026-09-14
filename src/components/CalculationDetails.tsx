import React, { useState } from 'react';
import { HealthResults, Language } from '../types/health';
import { getTranslation } from '../i18n/translations';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface CalculationDetailsProps {
  results: HealthResults;
  lang: Language;
}

export const CalculationDetails: React.FC<CalculationDetailsProps> = ({ results, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = getTranslation(lang);

  const items = [
    {
      label: t.results.bmiLabel,
      formula: t.results.formulaBMI,
      substitution: results.details.bmiSubstitution,
    },
    {
      label: t.results.bmrLabel,
      formula: t.results.formulaBMRMale, // generic label string
      substitution: results.details.bmrSubstitution,
    },
    {
      label: t.results.tdeeLabel,
      formula: t.results.formulaTDEE,
      substitution: results.details.tdeeSubstitution,
    },
    {
      label: t.results.healthyWeightRangeLabel,
      formula: t.results.formulaHealthyRange,
      substitution: results.details.healthyWeightSubstitution,
    },
    {
      label: t.results.targetCaloriesLabel,
      formula: t.results.formulaTargetCalories,
      substitution: results.details.targetCalorieSubstitution,
    },
    {
      label: t.results.macrosSection,
      formula: t.results.formulaMacros,
      substitution: results.details.macroSubstitution,
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-health-600 dark:text-health-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {t.results.calculationDetailsSection}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{isOpen ? t.results.hideDetails : t.results.showDetails}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs sm:text-sm">
          {items.map((item, index) => (
            <div key={index} className="py-3 first:pt-2 last:pb-0 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-200">
                {item.label}
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] sm:text-xs">
                {item.formula}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-health-700 dark:text-health-300 font-medium">
                {item.substitution}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
