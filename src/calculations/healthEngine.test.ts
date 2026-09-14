import {
  calculateBMI,
  classifyBMI,
  calculateBMR,
  calculateTDEE,
  calculateHealthyWeightRange,
  calculateObesityThreshold,
  calculateWeightGap,
  calculateTargetCalories,
  calculateMacros,
  calculateHealthResults,
} from './healthEngine';
import { UserInput } from '../types/health';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function assertCloseTo(actual: number, expected: number, delta: number = 0.1, message: string = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= delta, `${message} (Expected ~${expected}, got ${actual})`);
}

console.log('--- RUNNING HEALTH ENGINE TESTS ---');

// ==========================================
// 1. BMI Classification Boundaries
// ==========================================
console.log('\n--- 1. Testing BMI Classification Boundaries ---');
assert(classifyBMI(18.49).category === 'underweight', 'BMI 18.49 is Underweight');
assert(classifyBMI(18.5).category === 'healthy', 'BMI 18.5 is Healthy Weight');
assert(classifyBMI(24.9).category === 'healthy', 'BMI 24.9 is Healthy Weight');
assert(classifyBMI(25.0).category === 'overweight', 'BMI 25.0 is Overweight');
assert(classifyBMI(29.9).category === 'overweight', 'BMI 29.9 is Overweight');
assert(classifyBMI(30.0).category === 'obesity_1', 'BMI 30.0 is Obesity Class 1');
assert(classifyBMI(34.9).category === 'obesity_1', 'BMI 34.9 is Obesity Class 1');
assert(classifyBMI(35.0).category === 'obesity_2', 'BMI 35.0 is Obesity Class 2');
assert(classifyBMI(39.9).category === 'obesity_2', 'BMI 39.9 is Obesity Class 2');
assert(classifyBMI(40.0).category === 'obesity_3', 'BMI 40.0 is Obesity Class 3');

// ==========================================
// 2. BMI Visual Zone Mapping
// ==========================================
console.log('\n--- 2. Testing BMI Visual Zones ---');
assert(classifyBMI(18.4).visualZone === 'underweight', 'Visual zone for 18.4 is underweight');
assert(classifyBMI(22.0).visualZone === 'healthy', 'Visual zone for 22.0 is healthy');
assert(classifyBMI(27.0).visualZone === 'overweight', 'Visual zone for 27.0 is overweight');
assert(classifyBMI(32.0).visualZone === 'obesity', 'Visual zone for 32.0 is obesity');
assert(classifyBMI(37.0).visualZone === 'obesity', 'Visual zone for 37.0 is obesity');
assert(classifyBMI(42.0).visualZone === 'obesity', 'Visual zone for 42.0 is obesity');

// ==========================================
// 3. TEST CASE 1: Existing Calculation Regression
// ==========================================
console.log('\n--- 3. TEST CASE 1: Existing Calculation Regression (Male 22yo, 176cm, 77kg, 1.55) ---');
const maleBMR = calculateBMR('male', 77, 176, 22);
assert(maleBMR === 1765, `Male BMR formula (Expected 1765, got ${maleBMR})`);

const maleTDEE = calculateTDEE(maleBMR, 'moderate'); // factor 1.55 -> 1765 * 1.55 = 2735.75
assertCloseTo(maleTDEE, 2735.75, 0.01, 'Male TDEE factor 1.55');

const maleBounds = calculateHealthyWeightRange(176);
assertCloseTo(maleBounds.min, 57.3056, 0.01, 'Min healthy weight for 176cm (~57.3 kg)');
assertCloseTo(maleBounds.max, 77.1302, 0.01, 'Max healthy weight for 176cm (~77.1 kg)');

const maleObesityThresh = calculateObesityThreshold(176);
assertCloseTo(maleObesityThresh, 92.928, 0.01, 'Obesity threshold weight for 176cm (~92.9 kg)');

// Female test case: 30yo, 165cm, 65kg -> BMR = (10*65) + (6.25*165) - (5*30) - 161 = 1370.25
const femaleBMR = calculateBMR('female', 65, 165, 30);
assert(femaleBMR === 1370.25, `Female BMR formula (Expected 1370.25, got ${femaleBMR})`);

// ==========================================
// 4. TEST CASE 2: Manual Macros (Weight 77kg, Protein 2.0, Fat 0.7, TDEE 2736)
// ==========================================
console.log('\n--- 4. TEST CASE 2: Manual Macros (77kg, 2.0 g/kg protein, 0.7 g/kg fat, 2736 target calories) ---');
const manualMacros = calculateMacros(2736, 77, 2.0, 0.7);

// Protein: 77 * 2.0 = 154 g (154 * 4 = 616 kcal)
assert(manualMacros.proteinGrams === 154, `Protein grams: Expected 154, got ${manualMacros.proteinGrams}`);
assert(manualMacros.proteinCalories === 616, `Protein calories: Expected 616, got ${manualMacros.proteinCalories}`);

// Fat: 77 * 0.7 = 53.9 g (53.9 * 9 = 485.1 kcal)
assertCloseTo(manualMacros.fatGrams, 53.9, 0.001, `Fat grams: Expected 53.9, got ${manualMacros.fatGrams}`);
assertCloseTo(manualMacros.fatCalories, 485.1, 0.001, `Fat calories: Expected 485.1, got ${manualMacros.fatCalories}`);

// Carbohydrates: (2736 - 616 - 485.1) / 4 = 1634.9 / 4 = 408.725 g
const expectedCarbGrams = (2736 - 616 - 485.1) / 4;
assertCloseTo(manualMacros.carbohydrateGrams, expectedCarbGrams, 0.001, `Carb grams: Expected ~408.725, got ${manualMacros.carbohydrateGrams}`);

// Display rounding verification:
assert(Math.round(manualMacros.proteinGrams) === 154, 'Display rounded Protein is 154 g');
assert(Math.round(manualMacros.fatGrams) === 54, 'Display rounded Fat is 54 g');
assert(Math.round(manualMacros.carbohydrateGrams) === 409, 'Display rounded Carbohydrates is 409 g');
assert(manualMacros.isCalorieExceeded === false, 'isCalorieExceeded is false');

// ==========================================
// 5. TEST CASE 3: Age Range 12–90
// ==========================================
console.log('\n--- 5. TEST CASE 3: Age Range 12–90 Validation & Calculation Consistency ---');
function validateAge(age: number | null | undefined): boolean {
  if (age === null || age === undefined || isNaN(age) || !isFinite(age)) return false;
  return age >= 12 && age <= 90;
}

assert(validateAge(12) === true, 'Age 12 accepted (boundary min)');
assert(validateAge(90) === true, 'Age 90 accepted (boundary max)');
assert(validateAge(11) === false, 'Age 11 rejected');
assert(validateAge(91) === false, 'Age 91 rejected');
assert(validateAge(0) === false, 'Age 0 rejected');
assert(validateAge(-5) === false, 'Negative age rejected');
assert(validateAge(NaN) === false, 'NaN age rejected');
assert(validateAge(Infinity) === false, 'Infinity age rejected');
assert(validateAge(null) === false, 'Null age rejected');

// Confirm same formula runs for age 15 without pediatric modification
const teenBmr = calculateBMR('male', 60, 168, 15);
// (10*60) + (6.25*168) - (5*15) + 5 = 600 + 1050 - 75 + 5 = 1580
assert(teenBmr === 1580, `Adult Mifflin-St Jeor runs consistently for age 15: Expected 1580, got ${teenBmr}`);

// ==========================================
// 6. TEST CASE 4: All Goals with Manual Macros
// ==========================================
console.log('\n--- 6. TEST CASE 4: All Goals with Manual Macros ---');
const goals: ('maintain' | 'lose' | 'gain')[] = ['maintain', 'lose', 'gain'];

for (const goal of goals) {
  const goalInput: UserInput = {
    age: 25,
    gender: 'male',
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate',
    goal,
    weightLossAdjustment: 0.15,
    weightGainAdjustment: 0.10,
    proteinGPerKg: goal === 'lose' ? 2.2 : (goal === 'gain' ? 1.8 : 2.0),
    fatGPerKg: goal === 'lose' ? 0.6 : (goal === 'gain' ? 0.9 : 0.8),
  };

  const res = calculateHealthResults(goalInput);
  assert(res.macros.proteinGrams > 0, `Goal ${goal}: protein calculated (${res.macros.proteinGrams}g)`);
  assert(res.macros.fatGrams > 0, `Goal ${goal}: fat calculated (${res.macros.fatGrams}g)`);
  assert(res.macros.carbohydrateGrams > 0, `Goal ${goal}: carbs calculated (${res.macros.carbohydrateGrams}g)`);
  assert(res.isMacroCalorieExceeded === false, `Goal ${goal}: calorie within target`);
}

// ==========================================
// 7. Negative Carbohydrate / Calorie Exceeded Handling
// ==========================================
console.log('\n--- 7. Testing Calorie Exceeded Handling ---');
// Target calories = 1500, Weight = 100kg, Protein = 3.0 g/kg (1200 kcal), Fat = 1.0 g/kg (900 kcal) -> Total = 2100 kcal > 1500 kcal
const exceededMacros = calculateMacros(1500, 100, 3.0, 1.0);
assert(exceededMacros.isCalorieExceeded === true, 'isCalorieExceeded correctly flagged as true');
assert(exceededMacros.carbohydrateGrams === 0, 'Carbohydrates safely clamped to 0 (not negative)');

// ==========================================
// 8. Macro Calorie Percentages Verification
// ==========================================
console.log('\n--- 8. Testing Macro Calorie Percentages ---');
// Target = 2736 kcal, 77kg, 2.0 g/kg protein (154g -> 616 kcal), 0.7 g/kg fat (53.9g -> 485.1 kcal)
// Carbs = 408.725g -> 1634.9 kcal
// proteinPercentRaw = 616 / 2736 * 100 = 22.5146...% -> display 22.5%
// fatPercentRaw = 485.1 / 2736 * 100 = 17.7299...% -> display 17.7%
// carbohydratePercentRaw = 1634.9 / 2736 * 100 = 59.7551...% -> display 59.8%
const macroPctTest = calculateMacros(2736, 77, 2.0, 0.7);
assertCloseTo(macroPctTest.proteinPercentRaw, 22.51, 0.05, 'Protein percent raw');
assertCloseTo(macroPctTest.fatPercentRaw, 17.73, 0.05, 'Fat percent raw');
assertCloseTo(macroPctTest.carbohydratePercentRaw, 59.76, 0.05, 'Carb percent raw');

const resultsForMacros = calculateHealthResults({
  age: 22,
  gender: 'male',
  heightCm: 176,
  weightKg: 77,
  activityLevel: 'moderate',
  goal: 'maintain',
  weightLossAdjustment: 0.15,
  weightGainAdjustment: 0.10,
  proteinGPerKg: 2.0,
  fatGPerKg: 0.7,
});
assert(resultsForMacros.macros.proteinPercent === 22.5, `Protein display %: Expected 22.5, got ${resultsForMacros.macros.proteinPercent}`);
assert(resultsForMacros.macros.fatPercent === 17.7, `Fat display %: Expected 17.7, got ${resultsForMacros.macros.fatPercent}`);
assert(resultsForMacros.macros.carbohydratePercent === 59.8, `Carb display %: Expected 59.8, got ${resultsForMacros.macros.carbohydratePercent}`);

console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
