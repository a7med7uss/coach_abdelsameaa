export interface FoodNutritionPer100g {
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
}

export interface FoodSource {
  source_id: string;
  source_name: string;
  source_url?: string;
  source_record_id?: string;
}

export interface FoodItem {
  id: string;
  name_en: string;
  name_ar: string;
  category: string;
  subcategory?: string;
  state?: string;
  nutrition_per_100g: FoodNutritionPer100g;
  source: FoodSource;
  confidence?: string;
}

export interface FoodDatabaseSource {
  id: string;
  name: string;
  url?: string;
  description?: string;
}

export interface FoodDatabase {
  schemaVersion: string;
  datasetName: string;
  basis: string;
  lastUpdated: string;
  sources: FoodDatabaseSource[];
  foods: FoodItem[];
}

export interface ArabicFoodLocalizationItem {
  id: string;
  name_ar: string;
  aliases_ar?: string[];
  name_quality?: string;
}

export interface ArabicFoodLocalizationDatabase {
  schemaVersion: string;
  datasetName: string;
  language: string;
  basis?: string;
  sourceDatabase: string;
  lastUpdated: string;
  foods: ArabicFoodLocalizationItem[];
}

