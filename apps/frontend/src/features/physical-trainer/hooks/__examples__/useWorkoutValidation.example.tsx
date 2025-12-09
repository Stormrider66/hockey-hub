import React from 'react';
import { WorkoutType } from '../../types/workout.types';
import { useWorkoutValidation, commonValidationRules } from '../useWorkoutValidation';

/**
 * Example usage of useWorkoutValidation hook
 * This demonstrates how to integrate validation with a workout form
 */
export function WorkoutValidationExample() {
  const [workoutData, setWorkoutData] = React.useState({
    name: '',
    type: WorkoutType.STRENGTH,
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 100,
        restBetweenSets: 90,
      },
    ],
    intervals: [],
  });

  // Use the validation hook with custom rules
  const {
    isValid,
    isValidating,
    errors,
    warnings,
    fieldErrors,
    validate,
    validateField,
    clearErrors,
    setCustomError,
    hasErrors,
    hasWarnings,
    getFirstError,
    getFieldError,
    formatErrors,
    getValidationSummary,
  } = useWorkoutValidation({
    workoutType: WorkoutType.STRENGTH,
    workoutData,
    validationRules: {
      // Add custom validation rules
      name: commonValidationRules.required('Workout name'),
      'exercises[0].weight': [
        commonValidationRules.positiveNumber('Weight'),
        commonValidationRules.numberRange('Weight', 1, 500),
      ],
      'exercises[0].reps': commonValidationRules.numberRange('Reps', 1, 50),
      'exercises[0].sets': commonValidationRules.numberRange('Sets', 1, 10),
      // Cross-field validation
      exercises: commonValidationRules.totalDurationLimit(30),
    },
    debounceMs: 300,
    validateOnMount: false,
  });

  // Handle form field changes
  const handleFieldChange = (fieldPath: string, value: any) => {
    // Update the data
    setWorkoutData((prev) => {
      const newData = { ...prev };
      // Simple implementation - in real app, use a proper path setter
      if (fieldPath === 'name') {
        newData.name = value;
      } else if (fieldPath === 'exercises[0].weight') {
        newData.exercises[0].weight = value;
      }
      return newData;
    });

    // Validate the specific field
    validateField(fieldPath, value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    const result = await validate();

    if (result.isValid) {
      console.log('Form is valid, submitting...', workoutData);
    } else {
      console.log('Validation failed:', result.errors);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Workout Validation Example</h2>

      {/* Validation Summary */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Validation Status</h3>
        <p>Valid: {isValid ? '✅' : '❌'}</p>
        <p>Validating: {isValidating ? 'Yes' : 'No'}</p>
        <p>Errors: {errors.length}</p>
        <p>Warnings: {warnings.length}</p>
        {hasErrors && (
          <div className="mt-2 text-red-600">
            <p className="font-semibold">First Error:</p>
            <p>{getFirstError()}</p>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Workout Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Workout Name
          </label>
          <input
            type="text"
            value={workoutData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded ${
              getFieldError('name') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('name') && (
            <p className="text-red-500 text-sm mt-1">{getFieldError('name')}</p>
          )}
        </div>

        {/* Exercise Weight */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Bench Press Weight (lbs)
          </label>
          <input
            type="number"
            value={workoutData.exercises[0].weight}
            onChange={(e) =>
              handleFieldChange('exercises[0].weight', Number(e.target.value))
            }
            className={`w-full px-3 py-2 border rounded ${
              getFieldError('exercises[0].weight') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('exercises[0].weight') && (
            <p className="text-red-500 text-sm mt-1">
              {getFieldError('exercises[0].weight')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!isValid || isValidating}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Submit Workout
          </button>

          <button
            type="button"
            onClick={() => clearErrors()}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Clear Errors
          </button>

          <button
            type="button"
            onClick={() => setCustomError('name', 'Custom error example')}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Add Custom Error
          </button>
        </div>
      </form>

      {/* All Errors Display */}
      {hasErrors && (
        <div className="mt-6 p-4 bg-red-50 rounded">
          <h3 className="font-semibold text-red-700 mb-2">All Errors:</h3>
          <pre className="text-sm text-red-600 whitespace-pre-wrap">
            {formatErrors('\n')}
          </pre>
        </div>
      )}

      {/* Validation Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-700 mb-2">Summary:</h3>
        <p className="text-sm">{getValidationSummary()}</p>
      </div>
    </div>
  );
}