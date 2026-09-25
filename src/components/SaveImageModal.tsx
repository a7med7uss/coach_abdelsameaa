import React, { useState, useRef, useEffect } from 'react';
import { HealthResults, UserInput, Language } from '../types/health';
import { getTranslation } from '../i18n/translations';
import { toPng } from 'html-to-image';
import { Download, X, Loader2, Share2 } from 'lucide-react';
import LogoImg from '../assets/Logo.jpeg';

interface SaveImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: HealthResults;
  input: UserInput;
  lang: Language;
}

export const SaveImageModal: React.FC<SaveImageModalProps> = ({
  isOpen,
  onClose,
  results,
  input,
  lang,
}) => {
  const [personName, setPersonName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [canShareFile, setCanShareFile] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(lang);

  // Check if Web Share API with files is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
      try {
        const testFile = new File([''], 'test.png', { type: 'image/png' });
        if (navigator.canShare({ files: [testFile] })) {
          setCanShareFile(true);
        }
      } catch {
        setCanShareFile(false);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = async (preferShare = false) => {
    if (!personName.trim()) return;
    if (!reportRef.current) return;

    setIsGenerating(true);

    try {
      // Ensure fonts are loaded before snapshot
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Small delay to ensure complete DOM paint
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toPng(reportRef.current, {
        quality: 0.95,
        pixelRatio: 3,
        cacheBust: true,
      });

      const filename = `HC-Report-${personName.trim().replace(/\s+/g, '_')}.png`;

      // Try native Web Share API if preferred/supported
      if (preferShare && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], filename, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${t.appTitle} - ${personName}`,
              text: `${t.appTitle} - ${personName} (${t.identity.name})`,
            });
            onClose();
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            // User cancelled share dialog
            return;
          }
          console.warn('Web Share failed, falling back to download:', shareErr);
        }
      }

      // Direct download fallback
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      onClose();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryTranslation = (key: string) => {
    return (t.bmiCategories as any)[key] || key;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 ltr:right-4 rtl:left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/60"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {t.modal.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t.modal.subtitle}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.modal.nameLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={t.modal.namePlaceholder}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-health-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
            {canShareFile ? (
              <>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!personName.trim() || isGenerating}
                  className="flex-1 py-2.5 px-4 bg-health-600 hover:bg-health-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.modal.generating}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>{t.modal.shareBtn}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={!personName.trim() || isGenerating}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title={t.modal.downloadBtn}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{t.modal.downloadBtn}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSave(false)}
                disabled={!personName.trim() || isGenerating}
                className="flex-1 py-2.5 px-4 bg-health-600 hover:bg-health-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.modal.generating}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{t.modal.downloadBtn}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors text-center"
            >
              {t.modal.cancelBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Off-Screen Report Template for Crisp Snapshot */}
      <div className="fixed top-0 left-[-9999px] pointer-events-none">
        <div
          ref={reportRef}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="w-[500px] bg-slate-50 text-slate-900 p-8 font-sans relative border border-slate-200"
          style={{ fontFamily: 'Cairo, Inter, sans-serif' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none font-bold text-3xl text-slate-900 rotate-[-25deg] text-center px-4">
            Coach Abdsameea Adel Elmalky
          </div>

          {/* Header Branding */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={LogoImg}
                alt="كوتش عبدالسميع عادل المالكي"
                className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0"
              />
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {t.appTitle}
                </h1>
              </div>
            </div>
            <div className="text-end">
              <div className="text-xs text-slate-400">REPORT FOR</div>
              <div className="text-base font-bold text-sky-700">
                {personName || '—'}
              </div>
            </div>
          </div>

          {/* Health Summary Card */}
          <div className="bg-white rounded-xl p-5 mb-4 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
              {t.results.healthSummary}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 block">{t.results.bmiLabel}</span>
                <span className="text-2xl font-extrabold text-slate-900">{results.bmi.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t.results.weightStatusLabel}</span>
                <span className="text-base font-bold text-emerald-600">
                  {getCategoryTranslation(results.bmiCategory)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t.results.currentWeightLabel}</span>
                <span className="text-sm font-semibold text-slate-800">{input.weightKg} {t.inputs.weightUnit}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t.results.healthyWeightRangeLabel}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {results.minHealthyWeight} - {results.maxHealthyWeight} {t.inputs.weightUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Calories Card */}
          <div className="bg-white rounded-xl p-5 mb-4 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
              {t.results.caloriesSection}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-[11px] text-slate-500 block">{t.results.bmrLabel}</span>
                <span className="text-base font-bold text-slate-900">{results.bmr}</span>
                <span className="text-[10px] text-slate-400 block">kcal/day</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-[11px] text-slate-500 block">{t.results.tdeeLabel}</span>
                <span className="text-base font-bold text-slate-900">{results.tdee}</span>
                <span className="text-[10px] text-slate-400 block">kcal/day</span>
              </div>
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
                <span className="text-[11px] text-sky-800 block font-semibold">{t.results.targetCaloriesLabel}</span>
                <span className="text-base font-extrabold text-sky-700">{results.targetCalories}</span>
                <span className="text-[10px] text-sky-600 block">kcal/day</span>
              </div>
            </div>
          </div>

          {/* Weight Analysis Card */}
          <div className="bg-white rounded-xl p-5 mb-4 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
              {t.results.weightAnalysisSection}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.results.minHealthyWeightLabel}:</span>
                <span className="font-semibold text-slate-800">{results.minHealthyWeight} {t.inputs.weightUnit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.results.maxHealthyWeightLabel}:</span>
                <span className="font-semibold text-slate-800">{results.maxHealthyWeight} {t.inputs.weightUnit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 col-span-2">
                <span className="text-slate-500">{t.results.obesityThresholdLabel}:</span>
                <span className="font-semibold text-slate-800">{results.obesityThresholdWeight} {t.inputs.weightUnit}</span>
              </div>
              {results.isUnderweight && (
                <div className="flex justify-between py-1 col-span-2 text-blue-700 font-bold bg-blue-50 p-2 rounded">
                  <span>{t.results.weightToGainLabel}:</span>
                  <span>+{results.weightToGain} {t.inputs.weightUnit}</span>
                </div>
              )}
              {results.isOverweightOrObese && (
                <div className="flex justify-between py-1 col-span-2 text-amber-700 font-bold bg-amber-50 p-2 rounded">
                  <span>{t.results.weightToLoseLabel}:</span>
                  <span>-{results.weightToLose} {t.inputs.weightUnit}</span>
                </div>
              )}
              {results.isHealthy && (
                <div className="col-span-2 text-center text-emerald-700 font-semibold bg-emerald-50 p-2 rounded">
                  {t.results.healthyWeightNote}
                </div>
              )}
            </div>
          </div>

          {/* Daily Nutrition Needs Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
              {t.results.macrosSection}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-slate-100 p-2.5 rounded-lg bg-slate-50">
                <span className="text-[11px] text-slate-500 block">{t.results.proteinLabel} ({results.macros.proteinGPerKg} {t.inputs.gPerKgUnit})</span>
                <span className="text-sm font-bold text-slate-900">{results.macros.proteinGrams}g</span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {results.macros.proteinCalories} kcal ({results.macros.proteinPercent}%)
                </span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-lg bg-slate-50">
                <span className="text-[11px] text-slate-500 block">{t.results.fatLabel} ({results.macros.fatGPerKg} {t.inputs.gPerKgUnit})</span>
                <span className="text-sm font-bold text-slate-900">{results.macros.fatGrams}g</span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {results.macros.fatCalories} kcal ({results.macros.fatPercent}%)
                </span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-lg bg-slate-50">
                <span className="text-[11px] text-slate-500 block">{t.results.carbohydratesLabel}</span>
                <span className="text-sm font-bold text-slate-900">
                  {results.isMacroCalorieExceeded ? '—' : `${results.macros.carbohydrateGrams}g`}
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  {results.isMacroCalorieExceeded
                    ? 'Exceeded'
                    : `${results.macros.carbohydrateCalories} kcal (${results.macros.carbohydratePercent}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-start">
            Coach Abdsameea Adel Elmalky - Clinical Nutrition Master's | Fitness Coach
          </div>
        </div>
      </div>
    </div>
  );
};
