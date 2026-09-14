import {
  UserInput,
  HealthResults,
  BMICategoryKey,
  BMIVisualZone,
  ActivityId
} from '../types/health';

export const ACTIVITY_FACTORS: Record<ActivityId, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function classifyBMI(bmi: number): { category: BMICategoryKey; visualZone: BMIVisualZone } {
  if (bmi < 18.5) {
    return { category: 'underweight', visualZone: 'underweight' };
  } else if (bmi < 25.0) {
    return { category: 'healthy', visualZone: 'healthy' };
  } else if (bmi < 30.0) {
    return { category: 'overweight', visualZone: 'overweight' };
  } else if (bmi < 35.0) {
    return { category: 'obesity_1', visualZone: 'obesity' };
  } else if (bmi < 40.0) {
    return { category: 'obesity_2', visualZone: 'obesity' };
  } else {
    return { category: 'obesity_3', visualZone: 'obesity' };
  }
}

export function calculateBMR(gender: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  if (gender === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityId): number {
  const factor = ACTIVITY_FACTORS[activityLevel];
  return bmr * factor;
}

export function calculateHealthyWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const heightMSq = heightM * heightM;
  return {
    min: 18.5 * heightMSq,
    max: 24.9 * heightMSq,
  };
}

export function calculateObesityThreshold(heightCm: number): number {
  const heightM = heightCm / 100;
  return 30.0 * (heightM * heightM);
}

export function calculateWeightGap(bmi: number, currentWeightKg: number, minHealthy: number, maxHealthy: number) {
  if (bmi < 18.5) {
    return {
      weightToGain: Math.max(0, minHealthy - currentWeightKg),
      weightToLose: 0,
    };
  } else if (bmi >= 25.0) {
    return {
      weightToGain: 0,
      weightToLose: Math.max(0, currentWeightKg - maxHealthy),
    };
  } else {
    return {
      weightToGain: 0,
      weightToLose: 0,
    };
  }
}

export function calculateTargetCalories(tdee: number, goal: 'maintain' | 'lose' | 'gain', adjustment: number): number {
  if (goal === 'lose') {
    return tdee * (1 - adjustment);
  } else if (goal === 'gain') {
    return tdee * (1 + adjustment);
  }
  return tdee;
}

export function calculateMacros(
  targetCalories: number,
  weightKg: number,
  proteinGPerKg: number,
  fatGPerKg: number
) {
  const proteinGrams = weightKg * proteinGPerKg;
  const proteinCalories = proteinGrams * 4;

  const fatGrams = weightKg * fatGPerKg;
  const fatCalories = fatGrams * 9;

  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const isCalorieExceeded = remainingCalories < 0;

  const carbohydrateCalories = Math.max(0, remainingCalories);
  const carbohydrateGrams = Math.max(0, remainingCalories / 4);

  const proteinPercentRaw = targetCalories > 0 ? (proteinCalories / targetCalories) * 100 : 0;
  const fatPercentRaw = targetCalories > 0 ? (fatCalories / targetCalories) * 100 : 0;
  const carbohydratePercentRaw = targetCalories > 0 ? (carbohydrateCalories / targetCalories) * 100 : 0;

  return {
    proteinGPerKg,
    fatGPerKg,
    proteinGrams,
    proteinCalories,
    fatGrams,
    fatCalories,
    carbohydrateGrams,
    carbohydrateCalories,
    remainingCaloriesRaw: remainingCalories,
    proteinPercentRaw,
    fatPercentRaw,
    carbohydratePercentRaw,
    isCalorieExceeded,
  };
}

/**
 * Main calculation orchestrator. Keeps all internal calculations at full float precision.
 * Rounds only for the returned presentation properties.
 */
export function calculateHealthResults(input: UserInput): HealthResults {
  const { age, gender, heightCm, weightKg, activityLevel, goal, weightLossAdjustment, weightGainAdjustment, proteinGPerKg, fatGPerKg } = input;

  const bmiRaw = calculateBMI(weightKg, heightCm);
  const { category: bmiCategory, visualZone: bmiVisualZone } = classifyBMI(bmiRaw);

  const bmrRaw = calculateBMR(gender, weightKg, heightCm, age);
  const tdeeRaw = calculateTDEE(bmrRaw, activityLevel);

  const healthyRangeRaw = calculateHealthyWeightRange(heightCm);
  const obesityThresholdWeightRaw = calculateObesityThreshold(heightCm);

  const weightGapRaw = calculateWeightGap(
    bmiRaw,
    weightKg,
    healthyRangeRaw.min,
    healthyRangeRaw.max
  );

  const adjustment = goal === 'lose' ? weightLossAdjustment : (goal === 'gain' ? weightGainAdjustment : 0);
  const targetCaloriesRaw = calculateTargetCalories(tdeeRaw, goal, adjustment);

  const macrosRaw = calculateMacros(targetCaloriesRaw, weightKg, proteinGPerKg, fatGPerKg);

  // Status flags
  const isUnderweight = bmiRaw < 18.5;
  const isHealthy = bmiRaw >= 18.5 && bmiRaw < 25.0;
  const isOverweightOrObese = bmiRaw >= 25.0;

  // Substituted formula strings for calculation details breakdown
  const heightM = heightCm / 100;
  const genderOffsetStr = gender === 'male' ? '+ 5' : '- 161';
  const activityFactor = ACTIVITY_FACTORS[activityLevel];
  
  const bmrSubstitution = gender === 'male'
    ? `(10 × ${weightKg}) + (6.25 × ${heightCm}) − (5 × ${age}) + 5 = ${Math.round(bmrRaw)} kcal/day`
    : `(10 × ${weightKg}) + (6.25 × ${heightCm}) − (5 × ${age}) − 161 = ${Math.round(bmrRaw)} kcal/day`;

  const bmiSubstitution = `${weightKg} ÷ (${heightM.toFixed(2)}²) = ${roundTo(bmiRaw, 1)}`;
  const tdeeSubstitution = `${Math.round(bmrRaw)} × ${activityFactor} = ${Math.round(tdeeRaw)} kcal/day`;
  const healthyWeightSubstitution = `Min: 18.5 × (${heightM.toFixed(2)}²) = ${roundTo(healthyRangeRaw.min, 1)} kg | Max: 24.9 × (${heightM.toFixed(2)}²) = ${roundTo(healthyRangeRaw.max, 1)} kg`;
  
  let targetCalorieSubstitution = `${Math.round(tdeeRaw)} kcal/day`;
  if (goal === 'lose') {
    targetCalorieSubstitution = `${Math.round(tdeeRaw)} × (1 − ${(adjustment).toFixed(2)}) = ${Math.round(targetCaloriesRaw)} kcal/day`;
  } else if (goal === 'gain') {
    targetCalorieSubstitution = `${Math.round(tdeeRaw)} × (1 + ${(adjustment).toFixed(2)}) = ${Math.round(targetCaloriesRaw)} kcal/day`;
  }

  const macroSubstitution = `Protein: ${weightKg} × ${proteinGPerKg} = ${roundTo(macrosRaw.proteinGrams, 1)}g (${Math.round(macrosRaw.proteinCalories)} kcal) | Fat: ${weightKg} × ${fatGPerKg} = ${roundTo(macrosRaw.fatGrams, 1)}g (${Math.round(macrosRaw.fatCalories)} kcal) | Carbs: (${Math.round(targetCaloriesRaw)} − ${Math.round(macrosRaw.proteinCalories)} − ${Math.round(macrosRaw.fatCalories)}) ÷ 4 = ${roundTo(macrosRaw.carbohydrateGrams, 1)}g (${Math.round(macrosRaw.carbohydrateCalories)} kcal)`;

  return {
    // Raw values
    bmiRaw,
    bmrRaw,
    tdeeRaw,
    minHealthyWeightRaw: healthyRangeRaw.min,
    maxHealthyWeightRaw: healthyRangeRaw.max,
    obesityThresholdWeightRaw,
    weightToLoseRaw: weightGapRaw.weightToLose,
    weightToGainRaw: weightGapRaw.weightToGain,
    targetCaloriesRaw,
    proteinGramsRaw: macrosRaw.proteinGrams,
    carbohydrateGramsRaw: macrosRaw.carbohydrateGrams,
    fatGramsRaw: macrosRaw.fatGrams,
    proteinPercentRaw: macrosRaw.proteinPercentRaw,
    fatPercentRaw: macrosRaw.fatPercentRaw,
    carbohydratePercentRaw: macrosRaw.carbohydratePercentRaw,
    isMacroCalorieExceeded: macrosRaw.isCalorieExceeded,

    // Rounded presentation values
    bmi: roundTo(bmiRaw, 1),
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    minHealthyWeight: roundTo(healthyRangeRaw.min, 1),
    maxHealthyWeight: roundTo(healthyRangeRaw.max, 1),
    obesityThresholdWeight: roundTo(obesityThresholdWeightRaw, 1),
    weightToLose: roundTo(weightGapRaw.weightToLose, 1),
    weightToGain: roundTo(weightGapRaw.weightToGain, 1),
    targetCalories: Math.round(targetCaloriesRaw),

    macros: {
      proteinGPerKg,
      fatGPerKg,
      proteinGrams: Math.round(macrosRaw.proteinGrams),
      proteinCalories: Math.round(macrosRaw.proteinCalories),
      carbohydrateGrams: Math.round(macrosRaw.carbohydrateGrams),
      carbohydrateCalories: Math.round(macrosRaw.carbohydrateCalories),
      fatGrams: Math.round(macrosRaw.fatGrams),
      fatCalories: Math.round(macrosRaw.fatCalories),
      proteinPercent: roundTo(macrosRaw.proteinPercentRaw, 1),
      fatPercent: roundTo(macrosRaw.fatPercentRaw, 1),
      carbohydratePercent: roundTo(macrosRaw.carbohydratePercentRaw, 1),
      isCalorieExceeded: macrosRaw.isCalorieExceeded,
    },

    // Categories
    bmiCategory,
    bmiVisualZone,
    isUnderweight,
    isHealthy,
    isOverweightOrObese,

    // Details substitutions
    details: {
      bmiSubstitution,
      bmrSubstitution,
      tdeeSubstitution,
      healthyWeightSubstitution,
      targetCalorieSubstitution,
      macroSubstitution,
    },
  };
}
