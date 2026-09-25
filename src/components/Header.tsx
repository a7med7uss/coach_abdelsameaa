import React from 'react';
import { Language, Theme } from '../types/health';
import { getTranslation } from '../i18n/translations';
import { Activity, Moon, Sun, Globe } from 'lucide-react';

import LogoImg from '../assets/Logo.jpeg';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  theme,
  onThemeToggle,
}) => {
  const t = getTranslation(lang);

  return (
    <header className="w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-30 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src={LogoImg}
            alt="Coach Abdsameea Adel Elmalky"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="min-w-0">
  <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
    {t.appTitle}
  </h1>

  {t.appSubtitle && (
    <p className="text-[9px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
      {t.appSubtitle}
    </p>
  )}
</div>
        </div>

        {/* Action Controls: Lang & Theme Switchers */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            aria-label="Switch Language"
          >
            <Globe className="w-4 h-4 text-health-600 dark:text-health-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle Dark/Light Mode"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
