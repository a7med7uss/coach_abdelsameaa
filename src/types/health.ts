export type Gender = 'male' | 'female';

export type ActivityId = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export type GoalId = 'maintain' | 'lose' | 'gain';

export type Language = 'ar' | 'en';

export type Theme = 'light' | 'dark';

export interface UserInput {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityId;
  goal: GoalId;
  weightLossAdjustment: number; // 0.10, 0.15, 0.20
  weightGainAdjustment: number; // 0.10, 0.15
  proteinGPerKg: number; // e.g. 2.0 g/kg
  fatGPerKg: number;     // e.g. 0.7 g/kg
}

export type BMICategoryKey = 
  | 'underweight'
  | 'healthy'
  | 'overweight'
  | 'obesity_1'
  | 'obesity_2'
  | 'obesity_3';

export type BMIVisualZone = 'underweight' | 'healthy' | 'overweight' | 'obesity';

export interface MacroDistribution {
  proteinGPerKg: number;
  fatGPerKg: number;
  proteinGrams: number;
  proteinCalories: number;
  carbohydrateGrams: number;
  carbohydrateCalories: number;
  fatGrams: number;
  fatCalories: number;
  proteinPercent: number;
  fatPercent: number;
  carbohydratePercent: number;
  isCalorieExceeded: boolean;
}

export interface CalculationDetailsStrings {
  bmiSubstitution: string;
  bmrSubstitution: string;
  tdeeSubstitution: string;
  healthyWeightSubstitution: string;
  targetCalorieSubstitution: string;
  macroSubstitution: string;
}

export interface HealthResults {
  // Numeric raw full-precision values
  bmiRaw: number;
  bmrRaw: number;
  tdeeRaw: number;
  minHealthyWeightRaw: number;
  maxHealthyWeightRaw: number;
  obesityThresholdWeightRaw: number;
  weightToLoseRaw: number;
  weightToGainRaw: number;
  targetCaloriesRaw: number;
  proteinGramsRaw: number;
  carbohydrateGramsRaw: number;
  fatGramsRaw: number;
  proteinPercentRaw: number;
  fatPercentRaw: number;
  carbohydratePercentRaw: number;
  isMacroCalorieExceeded: boolean;

  // Render-ready rounded display values
  bmi: number;
  bmr: number;
  tdee: number;
  minHealthyWeight: number;
  maxHealthyWeight: number;
  obesityThresholdWeight: number;
  weightToLose: number;
  weightToGain: number;
  targetCalories: number;
  macros: MacroDistribution;

  // Classifications & Statuses
  bmiCategory: BMICategoryKey;
  bmiVisualZone: BMIVisualZone;
  isUnderweight: boolean;
  isHealthy: boolean;
  isOverweightOrObese: boolean;

  // Formula substitutions formatted for display
  details: CalculationDetailsStrings;
}
