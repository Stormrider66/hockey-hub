import { renderHook, act, waitFor } from '@testing-library/react';
import { WorkoutType } from '@/features/physical-trainer/types';
import { useWorkoutValidation, commonValidationRules } from '../useWorkoutValidation';

describe('useWorkoutValidation', () => {
  const mockWorkoutData = {
    name: 'Test Workout',
    type: WorkoutType.STRENGTH,
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 100,
      },
    ],
  };

  it('should initialize with valid state when data is valid', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: mockWorkoutData,
      })
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.warnings).toHaveLength(0);
    });
  });

  it('should detect validation errors', async () => {
    const invalidData = {
      ...mockWorkoutData,
      exercises: [], // No exercises
    };

    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: invalidData,
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it('should apply custom validation rules', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: { ...mockWorkoutData, name: '' },
        validationRules: {
          name: commonValidationRules.required('Workout name'),
        },
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.getFieldError('name')).toBe('Workout name is required');
  });

  it('should validate specific fields', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: mockWorkoutData,
        validationRules: {
          'exercises[0].weight': commonValidationRules.numberRange('Weight', 1, 50),
        },
      })
    );

    await act(async () => {
      await result.current.validateField('exercises[0].weight', 100);
    });

    await waitFor(() => {
      expect(result.current.getFieldError('exercises[0].weight')).toBe(
        'Weight must be between 1 and 50'
      );
    });
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: { ...mockWorkoutData, exercises: [] },
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.hasErrors).toBe(true);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('should set custom errors', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: mockWorkoutData,
      })
    );

    act(() => {
      result.current.setCustomError('name', 'Custom error message');
    });

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors.some((e) => e.message === 'Custom error message')).toBe(true);
  });

  it('should format errors correctly', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: { ...mockWorkoutData, exercises: [] },
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    // Add a second error so we can assert the separator behavior
    act(() => {
      result.current.setCustomError('name', 'Custom error message');
    });

    await act(async () => {
      await result.current.validate();
    });

    const formattedErrors = result.current.formatErrors(', ');
    // Message comes from the shared validation util for strength workouts
    expect(formattedErrors).toContain('Please add exercises to the workout');
    expect(formattedErrors).toContain('Custom error message');
    expect(formattedErrors).toContain(', ');
  });

  it('should debounce validation on data changes', async () => {
    jest.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ data }) =>
        useWorkoutValidation({
          workoutType: WorkoutType.STRENGTH,
          workoutData: data,
          debounceMs: 100,
        }),
      {
        initialProps: { data: mockWorkoutData },
      }
    );

    // Change data multiple times quickly
    rerender({ data: { ...mockWorkoutData, name: 'Updated 1' } });
    rerender({ data: { ...mockWorkoutData, name: 'Updated 2' } });
    rerender({ data: { ...mockWorkoutData, name: 'Updated 3', exercises: [] } }); // make it invalid

    // Validation should not be called immediately
    expect(result.current.hasErrors).toBe(false);

    // There's a 100ms batching timeout + debounceMs (100ms)
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isValid).toBe(false);
    });

    jest.useRealTimers();
  });

  it('should validate on mount when configured', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: { ...mockWorkoutData, exercises: [] },
        validateOnMount: true,
      })
    );

    await waitFor(() => {
      expect(result.current.hasErrors).toBe(true);
    });
  });

  it('should handle complex validation rules', async () => {
    const complexData = {
      name: 'Complex Workout',
      type: WorkoutType.HYBRID,
      blocks: [
        {
          type: 'exercise',
          exercises: [{ sets: 3, reps: 10 }],
        },
        {
          type: 'interval',
          intervals: [{ duration: 300, intensity: 85 }],
        },
      ],
    };

    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.HYBRID,
        workoutData: complexData,
        validationRules: {
          'blocks[1].intervals[0].intensity': commonValidationRules.numberRange('Intensity', 50, 100),
        },
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    expect(result.current.isValid).toBe(true);
  });

  it('should get validation summary', async () => {
    const { result } = renderHook(() =>
      useWorkoutValidation({
        workoutType: WorkoutType.STRENGTH,
        workoutData: { ...mockWorkoutData, exercises: [] },
      })
    );

    await act(async () => {
      await result.current.validate();
    });

    const summary = result.current.getValidationSummary();
    expect(summary).toContain('error');
  });
});