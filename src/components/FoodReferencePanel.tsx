import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { FoodDatabase, FoodItem, ArabicFoodLocalizationDatabase, ArabicFoodLocalizationItem } from '../types/food';
import { Language } from '../types/health';
import { getTranslation } from '../i18n/translations';
import {
  BookOpen,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Dna,
  Wheat,
  Droplet,
  Loader2,
  Maximize2,
} from 'lucide-react';

interface FoodReferencePanelProps {
  lang: Language;
}

const PAGE_SIZE = 30;

// Curated list of high-priority staple food IDs directly from the USDA dataset
export const COMMON_FOOD_IDS: string[] = [
  'USDA-SR-01140', // أرز أبيض طويل الحبة مطهو
  'USDA-SR-01145', // خبز أبيض
  'USDA-SR-01164', // بيض كامل مقلي
  'USDA-SR-01001', // زبدة مملحة
  'USDA-SR-05064', // Chicken, broilers or fryers, breast, meat only, cooked, roasted
  'USDA-SR-23562', // Beef, ground, 90% lean meat / 10% fat, raw
  'USDA-SR-20121', // Pasta, cooked, enriched, without added salt
  'USDA-SR-11365', // Potatoes, boiled, cooked in skin, flesh, without salt
  'USDA-SR-15121', // Fish, tuna, light, canned in water, drained solids
  'USDA-SR-01077', // Milk, whole, 3.25% milkfat, with added vitamin D
  'USDA-SR-01256', // Yogurt, Greek, plain, nonfat
  'USDA-SR-01009', // Cheese, cheddar
  'USDA-SR-01016', // Cheese, cottage, lowfat, 1% milkfat
  'USDA-SR-16053', // Broadbeans (fava beans), mature seeds, cooked, boiled, without salt
  'USDA-SR-16070', // Lentils, mature seeds, cooked, boiled, without salt
  'USDA-SR-09040', // Bananas, raw
  'USDA-SR-09003', // Apples, raw, with skin
  'USDA-SR-08120', // Cereals, oats, regular and quick, not fortified, dry
];

// Helper to normalize Arabic text (ignoring alef forms, teh marbuta, and diacritics)
function normalizeArabic(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

export const FoodReferencePanel: React.FC<FoodReferencePanelProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [database, setDatabase] = useState<FoodDatabase | null>(null);
  const [arabicDatabase, setArabicDatabase] = useState<ArabicFoodLocalizationDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [, startTransition] = useTransition();

  const t = getTranslation(lang);

  // Lazy load the nutrition JSON and Arabic localization JSON when needed
  useEffect(() => {
    if ((isOpen || selectedFood) && !database && !isLoading && !loadError) {
      setIsLoading(true);
      Promise.all([
        import('../data/hc_food_database.json'),
        import('../data/hc_food_arabic_names.json'),
      ])
        .then(([dbModule, arModule]) => {
          setDatabase((dbModule.default || dbModule) as FoodDatabase);
          setArabicDatabase((arModule.default || arModule) as ArabicFoodLocalizationDatabase);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load food database or Arabic localization:', err);
          setLoadError('Failed to load food database');
          setIsLoading(false);
        });
    }
  }, [isOpen, selectedFood, database, isLoading, loadError]);

  // Build clean lookup structure from hc_food_arabic_names.json indexed by food.id
  const arabicNamesById = useMemo(() => {
    const map = new Map<string, ArabicFoodLocalizationItem>();
    if (arabicDatabase?.foods) {
      for (const item of arabicDatabase.foods) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [arabicDatabase]);

  // Fast lookup set for curated common food IDs
  const commonFoodsSet = useMemo(() => new Set(COMMON_FOOD_IDS), []);

  // Extract available unique categories including 'common'
  const categories = useMemo(() => {
    if (!database?.foods) return ['all', 'common'];
    const set = new Set<string>();
    database.foods.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['all', 'common', ...Array.from(set)];
  }, [database]);

  /**
   * Resolves the primary visible food name based on ID join:
   * If lang === 'ar':
   *   1. Exact match in hc_food_arabic_names.json by food.id
   *   2. Fallback: original food.name_ar || food.name_en
   * If lang === 'en':
   *   food.name_en
   */
  const getPrimaryName = (food: FoodItem): string => {
    if (lang === 'ar') {
      const arEntry = arabicNamesById.get(food.id);
      if (arEntry?.name_ar) {
        return arEntry.name_ar;
      }
      return food.name_ar || food.name_en;
    }
    return food.name_en;
  };

  /**
   * Resolves secondary subtitle text:
   * In Arabic interface: show English name if different from the primary Arabic name.
   * In English interface: show Arabic name if available and different.
   */
  const getSecondaryName = (food: FoodItem): string | null => {
    if (lang === 'ar') {
      // Pure Arabic view without English subtitles
      return null;
    } else {
      const arEntry = arabicNamesById.get(food.id);
      if (arEntry?.name_ar && arEntry.name_ar !== food.name_en) {
        return arEntry.name_ar;
      }
      return null;
    }
  };

  // Search & category filter supporting Arabic name, aliases, and English
  const filteredFoods = useMemo(() => {
    if (!database?.foods) return [];

    const category = selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const qNorm = normalizeArabic(searchQuery);

    if (!q) {
      if (category === 'all') {
        return database.foods;
      }
      if (category === 'common') {
        const map = new Map<string, FoodItem>();
        database.foods.forEach((f) => map.set(f.id, f));
        return COMMON_FOOD_IDS.map((id) => map.get(id)).filter(Boolean) as FoodItem[];
      }
      return database.foods.filter((food) => food.category === category);
    }

    const scoredMatches: { food: FoodItem; score: number }[] = [];

    for (const food of database.foods) {
      if (category === 'common') {
        if (!commonFoodsSet.has(food.id)) {
          continue;
        }
      } else if (category !== 'all' && food.category !== category) {
        continue;
      }

      const arEntry = arabicNamesById.get(food.id);
      let score = 0;

      if (arEntry) {
        const nameAr = arEntry.name_ar || '';
        const nameArNorm = normalizeArabic(nameAr);

        // Check aliases (e.g. رز, أرز, بيض, زبدة)
        if (arEntry.aliases_ar) {
          for (const alias of arEntry.aliases_ar) {
            const aNorm = normalizeArabic(alias);
            if (aNorm === qNorm) {
              score = Math.max(score, 100);
            } else if (aNorm.startsWith(qNorm)) {
              score = Math.max(score, 85);
            } else if (aNorm.includes(qNorm)) {
              score = Math.max(score, 65);
            }
          }
        }

        // Check Arabic localized name
        if (nameArNorm === qNorm) {
          score = Math.max(score, 100);
        } else if (nameArNorm.split(/\s+/).some((w) => w === qNorm)) {
          score = Math.max(score, 90);
        } else if (nameArNorm.startsWith(qNorm)) {
          score = Math.max(score, 75);
        } else if (nameArNorm.includes(qNorm)) {
          score = Math.max(score, 50);
        }
      }

      // Check food.name_ar if present in master DB
      if (food.name_ar) {
        const foodArNorm = normalizeArabic(food.name_ar);
        if (foodArNorm.includes(qNorm)) {
          score = Math.max(score, 45);
        }
      }

      // Check English name
      if (food.name_en) {
        const enLower = food.name_en.toLowerCase();
        if (enLower.startsWith(q)) {
          score = Math.max(score, 40);
        } else if (enLower.includes(q)) {
          score = Math.max(score, 30);
        }
      }

      if (score > 0) {
        scoredMatches.push({ food, score });
      }
    }

    scoredMatches.sort((a, b) => b.score - a.score);
    return scoredMatches.map((m) => m.food);
  }, [database, arabicNamesById, searchQuery, selectedCategory]);

  const visibleFoods = useMemo(() => {
    return filteredFoods.slice(0, displayCount);
  }, [filteredFoods, displayCount]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setSearchQuery(val);
      setDisplayCount(PAGE_SIZE);
    });
  };

  const handleCategoryChange = (cat: string) => {
    startTransition(() => {
      setSelectedCategory(cat);
      setDisplayCount(PAGE_SIZE);
    });
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return t.foodReference.allCategories;
    if (cat === 'common') return t.foodReference.commonFoods;
    return (t.foodReference.categories as any)[cat] || cat;
  };

  return (
    <>
      {/* Floating Trigger Button (Available across calculation flow) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 ltr:right-5 rtl:left-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-health-600 hover:bg-health-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-health-600/25 border border-white/20 transition-all"
        aria-label={t.foodReference.button}
      >
        <BookOpen className="w-4 h-4" />
        <span>{t.foodReference.button}</span>
      </button>

      {/* Persistent Selected Food Card (Visible when drawer is closed, non-blocking on calculator screen) */}
      {!isOpen && selectedFood && (
        <aside
          aria-label={t.foodReference.selectedFood}
          className="fixed bottom-18 ltr:right-4 rtl:left-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3.5 animate-fadeIn"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                  {t.foodReference.selectedFood}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {t.foodReference.basisPer100g}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {getPrimaryName(selectedFood)}
              </h4>
              {getSecondaryName(selectedFood) && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {getSecondaryName(selectedFood)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title={t.foodReference.title}
                aria-label={t.foodReference.title}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title={t.foodReference.close}
                aria-label={t.foodReference.close}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exact Nutritional Values */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg py-1 px-1">
              <span className="text-[9px] text-amber-800 dark:text-amber-300 block font-semibold">
                {t.foodReference.calories}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5">
                {Math.round(selectedFood.nutrition_per_100g.calories_kcal)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-slate-400 block">kcal</span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg py-1 px-1">
              <span className="text-[9px] text-blue-800 dark:text-blue-300 block font-semibold">
                {t.foodReference.protein}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5">
                {selectedFood.nutrition_per_100g.protein_g.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-slate-400 block">g</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg py-1 px-1">
              <span className="text-[9px] text-emerald-800 dark:text-emerald-300 block font-semibold">
                {t.foodReference.carbs}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5">
                {selectedFood.nutrition_per_100g.carbohydrates_g.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-slate-400 block">g</span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg py-1 px-1">
              <span className="text-[9px] text-rose-800 dark:text-rose-300 block font-semibold">
                {t.foodReference.fat}
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5">
                {selectedFood.nutrition_per_100g.fat_g.toFixed(1)}
              </span>
              <span className="text-[8px] text-slate-500 dark:text-slate-400 block">g</span>
            </div>
          </div>
        </aside>
      )}

      {/* Drawer / Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header Controls */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/90 dark:bg-slate-850/95">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t.foodReference.button}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors shrink-0"
                aria-label={t.foodReference.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute top-1/2 -translate-y-1/2 ltr:left-3.5 rtl:right-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={t.foodReference.searchPlaceholder}
                  className="w-full ltr:pl-9 ltr:pr-9 rtl:pr-9 rtl:pl-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDisplayCount(PAGE_SIZE);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills Slider */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => {
                  const isCatSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isCatSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  );
                })}
              </div>

              {/* Count & Status */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {t.foodReference.showingCount
                    .replace('{count}', String(visibleFoods.length))
                    .replace('{total}', String(filteredFoods.length))}
                </span>
                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                  {t.foodReference.basis100g}
                </span>
              </div>
            </div>

            {/* Food Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/40">
              {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs">{t.foodReference.loading}</span>
                </div>
              )}

              {loadError && (
                <div className="py-10 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {loadError}
                </div>
              )}

              {!isLoading && visibleFoods.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t.foodReference.noResults}
                </div>
              )}

              {!isLoading &&
                visibleFoods.map((food) => {
                  const isExpanded = expandedFoodId === food.id;
                  const isSelected = selectedFood?.id === food.id;
                  const nut = food.nutrition_per_100g;
                  const primaryName = getPrimaryName(food);

                  return (
                    <div
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className={`p-3.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-50/60 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Primary Food Name is ALWAYS Arabic (name_ar) */}
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {primaryName}
                          </h4>
                          {getSecondaryName(food) && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {getSecondaryName(food)}
                            </p>
                          )}
                        </div>

                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 font-medium">
                          {getCategoryLabel(food.category)}
                        </span>
                      </div>

                      {/* Macronutrient Pills (per 100g) */}
                      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg py-1.5 px-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                            <Flame className="w-3 h-3" />
                            <span>{t.foodReference.calories}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                            {Math.round(nut.calories_kcal)}
                          </span>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg py-1.5 px-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-blue-800 dark:text-blue-300 font-medium">
                            <Dna className="w-3 h-3" />
                            <span>{t.foodReference.protein}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                            {nut.protein_g.toFixed(1)}g
                          </span>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg py-1.5 px-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                            <Wheat className="w-3 h-3" />
                            <span>{t.foodReference.carbs}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                            {nut.carbohydrates_g.toFixed(1)}g
                          </span>
                        </div>

                        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg py-1.5 px-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-rose-800 dark:text-rose-300 font-medium">
                            <Droplet className="w-3 h-3" />
                            <span>{t.foodReference.fat}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">
                            {nut.fat_g.toFixed(1)}g
                          </span>
                        </div>
                      </div>

                      {/* Expandable Source Information */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedFoodId(isExpanded ? null : food.id);
                          }}
                          className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          <span>{t.foodReference.sourceLabel}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <span className="font-mono text-[9px] text-slate-400 dark:text-slate-400">{food.id}</span>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300 space-y-1 animate-fadeIn">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{food.source.source_name}</span>
                          </div>
                          {food.source.source_url && (
                            <a
                              href={food.source.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <span>DOI Reference</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Load More Button */}
              {!isLoading && visibleFoods.length < filteredFoods.length && (
                <div className="pt-2 pb-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
                  >
                    {t.foodReference.loadMore}
                  </button>
                </div>
              )}
            </div>

            {/* Persistent Selected Food Bottom Card (Inside Drawer) */}
            {selectedFood && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-2xl z-20 transition-all animate-fadeIn">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        {t.foodReference.selectedFood}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {t.foodReference.basisPer100g}
                      </span>
                    </div>
                    {/* Food Name in Arabic */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 leading-tight truncate">
                      {getPrimaryName(selectedFood)}
                    </h4>
                    {getSecondaryName(selectedFood) && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {getSecondaryName(selectedFood)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                    aria-label={t.foodReference.close}
                    title={t.foodReference.close}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Exact Nutritional Values per 100g */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl py-2 px-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                      {t.foodReference.calories}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {Math.round(selectedFood.nutrition_per_100g.calories_kcal)}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">kcal</span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl py-2 px-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-blue-800 dark:text-blue-300 block">
                      {t.foodReference.protein}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {selectedFood.nutrition_per_100g.protein_g.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">g</span>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl py-2 px-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                      {t.foodReference.carbs}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {selectedFood.nutrition_per_100g.carbohydrates_g.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">g</span>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl py-2 px-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-rose-800 dark:text-rose-300 block">
                      {t.foodReference.fat}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
                      {selectedFood.nutrition_per_100g.fat_g.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">g</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
