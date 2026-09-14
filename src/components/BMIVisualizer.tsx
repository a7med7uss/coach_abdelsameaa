import React from 'react';
import { Language, BMIVisualZone } from '../types/health';
import { getTranslation } from '../i18n/translations';

interface BMIVisualizerProps {
  bmi: number;
  visualZone: BMIVisualZone;
  lang: Language;
}

export const BMIVisualizer: React.FC<BMIVisualizerProps> = ({ bmi, visualZone, lang }) => {
  const t = getTranslation(lang);

  // Map BMI value (range 15 to 40) to percentage position (0% to 100%)
  const minBMI = 15;
  const maxBMI = 40;
  const clampedBMI = Math.min(Math.max(bmi, minBMI), maxBMI);
  const pointerPercentage = Math.min(Math.max(((clampedBMI - minBMI) / (maxBMI - minBMI)) * 100, 2), 98);

  const zones: { id: BMIVisualZone; label: string; color: string }[] = [
    { id: 'underweight', label: t.bmiZones.underweight, color: 'bg-blue-500' },
    { id: 'healthy', label: t.bmiZones.healthy, color: 'bg-emerald-500' },
    { id: 'overweight', label: t.bmiZones.overweight, color: 'bg-amber-500' },
    { id: 'obesity', label: t.bmiZones.obesity, color: 'bg-rose-500' },
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t.results.bmiLabel}
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {bmi.toFixed(1)}
        </span>
      </div>

      {/* Visual Color Scale Bar */}
      <div className="relative w-full h-4 rounded-full overflow-visible flex my-2 bg-slate-200 dark:bg-slate-700">
        <div className="w-[14%] h-full bg-blue-500 rounded-s-full" />
        <div className="w-[26%] h-full bg-emerald-500" />
        <div className="w-[20%] h-full bg-amber-500" />
        <div className="w-[40%] h-full bg-rose-500 rounded-e-full" />

        {/* Marker Indicator Pin */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 z-10"
          style={{
            left: lang === 'ar' ? `${100 - pointerPercentage}%` : `${pointerPercentage}%`,
          }}
        >
          <div className="w-5 h-5 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
          </div>
        </div>
      </div>

      {/* Zone Labels */}
      <div className="grid grid-cols-4 gap-1 text-center mt-3 text-[11px] sm:text-xs">
        {zones.map((zone) => {
          const isActive = visualZone === zone.id;
          return (
            <div
              key={zone.id}
              className={`py-1 rounded-md transition-all ${
                isActive
                  ? 'font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 opacity-75'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${zone.color}`} />
                <span className="truncate">{zone.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
