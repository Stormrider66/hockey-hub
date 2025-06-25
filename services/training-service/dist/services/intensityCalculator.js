"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSessionIntensity = void 0;
// Helper to find the most recent relevant test result
const findLatestTestResult = (testDefinitionId, userTestResults) => {
    return userTestResults
        .filter(r => r.testDefinitionId === testDefinitionId)
        .sort((a, b) => new Date(b.datePerformed).getTime() - new Date(a.datePerformed).getTime())[0];
};
/**
 * Resolves exercise intensity based on user test results for a given set of session sections.
 * Creates new section/exercise objects with resolved values, does not modify inputs.
 *
 * @param sections - The sections of the session template.
 * @param userTestResults - Array of relevant test results for the user.
 * @param testDefinitions - Map or Array of relevant TestDefinitions (needed for units).
 * @returns A new array of sections with resolved intensity values in exercises.
 */
const resolveSessionIntensity = (sections, userTestResults, testDefinitions // Pass definitions for unit lookup
) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[Intensity Calc] Resolving intensity for ${sections.length} sections, using ${userTestResults.length} test results.`);
    const resolvedSections = sections.map(section => {
        const resolvedExercises = section.exercises.map(exercise => {
            // Create a copy to avoid modifying the original template object
            const resolvedExercise = Object.assign({}, exercise);
            const intensityType = exercise.intensityType;
            const intensityValue = exercise.intensityValue;
            const refTestId = exercise.intensityReferenceTestId;
            let calculatedValue = undefined;
            let calculatedUnit = undefined;
            try {
                if (intensityType === 'percentage_1rm' || intensityType === 'percentage_mhr') {
                    if (refTestId && (typeof intensityValue === 'number' || typeof intensityValue === 'string')) {
                        const numericIntensityValue = parseFloat(intensityValue); // Handles both number and string % like "75"
                        const refTestResult = findLatestTestResult(refTestId, userTestResults);
                        const refTestDef = testDefinitions.get(refTestId);
                        if ((refTestResult === null || refTestResult === void 0 ? void 0 : refTestResult.value) && (refTestDef === null || refTestDef === void 0 ? void 0 : refTestDef.unit) && !isNaN(numericIntensityValue)) {
                            const baseValue = parseFloat(refTestResult.value); // Ensure base value is number
                            if (!isNaN(baseValue)) {
                                calculatedValue = (baseValue * numericIntensityValue) / 100;
                                calculatedUnit = refTestDef.unit;
                                // Optional: Round calculated value appropriately?
                                // calculatedValue = Math.round(calculatedValue);
                                console.log(`[Intensity Calc] Exercise ${exercise.exerciseId} (${intensityType}): ${numericIntensityValue}% of ${baseValue}${calculatedUnit} = ${calculatedValue.toFixed(1)}${calculatedUnit}`);
                            }
                            else {
                                console.warn(`[Intensity Calc] Reference test result value for ${refTestId} is not a valid number: ${refTestResult.value}`);
                            }
                        }
                        else {
                            console.warn(`[Intensity Calc] Could not resolve ${intensityType} for exercise ${exercise.exerciseId}: Missing/invalid refTestResult (${!!refTestResult}), refTestDef (${!!refTestDef}), or intensityValue (${intensityValue}). RefTestId: ${refTestId}`);
                        }
                    }
                    else {
                        console.warn(`[Intensity Calc] Skipping ${intensityType} for exercise ${exercise.exerciseId}: Missing reference test ID or intensity value.`);
                    }
                }
                else if (intensityType === 'fixed_weight' || intensityType === 'fixed_hr' || intensityType === 'fixed_watts') {
                    // For fixed values, just copy them and try to determine unit
                    calculatedValue = intensityValue;
                    // Try to get unit from a related test definition if reference is provided, otherwise unknown
                    const refTestDef = refTestId ? testDefinitions.get(refTestId) : undefined;
                    calculatedUnit = (refTestDef === null || refTestDef === void 0 ? void 0 : refTestDef.unit) || (intensityType === 'fixed_weight' ? 'kg' : (intensityType === 'fixed_hr' ? 'bpm' : (intensityType === 'fixed_watts' ? 'W' : undefined)));
                    console.log(`[Intensity Calc] Exercise ${exercise.exerciseId} (${intensityType}): Fixed value ${calculatedValue}${calculatedUnit || ''}`);
                }
                else if (intensityType === 'rpe') {
                    // RPE doesn't typically resolve to a different value, just use the target RPE
                    calculatedValue = intensityValue;
                    calculatedUnit = 'RPE';
                    console.log(`[Intensity Calc] Exercise ${exercise.exerciseId} (${intensityType}): Target ${calculatedValue} ${calculatedUnit}`);
                }
                else if (intensityType === 'bodyweight') {
                    calculatedValue = 'Bodyweight';
                    calculatedUnit = undefined;
                    console.log(`[Intensity Calc] Exercise ${exercise.exerciseId} (${intensityType}): ${calculatedValue}`);
                }
                // Else: No intensity type specified or unknown type
                if (calculatedValue !== undefined) {
                    resolvedExercise.resolvedIntensityValue = calculatedValue;
                }
                if (calculatedUnit !== undefined) {
                    resolvedExercise.resolvedIntensityUnit = calculatedUnit;
                }
            }
            catch (calcError) {
                console.error(`[Intensity Calc] Error calculating intensity for exercise ${exercise.exerciseId}:`, calcError);
                // Keep original values if calculation fails
            }
            return resolvedExercise;
        });
        // Create a new section object with the resolved exercises
        return Object.assign(Object.assign({}, section), { exercises: resolvedExercises });
    });
    return resolvedSections;
});
exports.resolveSessionIntensity = resolveSessionIntensity;
