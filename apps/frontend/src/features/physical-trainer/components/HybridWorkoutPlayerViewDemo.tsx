'use client';

import React from 'react';
import HybridWorkoutPlayerView from './HybridWorkoutPlayerView';
import type { HybridProgram } from '../types/hybrid.types';
import { WorkoutEquipmentType } from '../types/conditioning.types';

// Example hybrid workout matching the image structure
const exampleHybridWorkout: HybridProgram = {
  id: 'hybrid-example-001',
  name: 'Monday Strength & Cardio Circuit',
  description: 'Complete workout combining strength training with high-intensity cardio intervals',
  blocks: [
    // Block 1 - Strength
    {
      id: 'block-1',
      type: 'exercise',
      name: 'Lower Body Strength',
      duration: 420, // 7 minutes
      orderIndex: 0,
      exercises: [
        {
          id: 'ex-1',
          exerciseId: 'squat',
          name: 'Back Squat',
          sets: 3,
          reps: 12,
          weight: 60,
          restAfter: 60,
          equipment: ['Barbell', 'Squat Rack']
        },
        {
          id: 'ex-2',
          exerciseId: 'deadlift',
          name: 'Romanian Deadlift',
          sets: 3,
          reps: 10,
          weight: 50,
          restAfter: 60,
          equipment: ['Barbell']
        }
      ],
      targetMuscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes'],
      equipment: ['Barbell', 'Squat Rack']
    },
    
    // Transition 1
    {
      id: 'trans-1',
      type: 'transition',
      name: 'Equipment Setup',
      duration: 180, // 3 minutes
      orderIndex: 1,
      transitionType: 'equipment_change',
      activities: ['Move to cardio area', 'Set up rowing machine', 'Water break']
    },
    
    // Block 2 - Cardio Intervals
    {
      id: 'block-2',
      type: 'interval',
      name: 'Rowing Intervals',
      duration: 420, // 7 minutes total
      orderIndex: 2,
      equipment: WorkoutEquipmentType.ROWING,
      intervals: [
        {
          id: 'int-1',
          type: 'work',
          name: 'High Intensity Row',
          duration: 120, // 2 min
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            watts: { type: 'absolute', value: 275 },
            heartRate: { type: 'percentage', value: 85, reference: 'max' }
          },
          color: '#ef4444'
        },
        {
          id: 'int-2',
          type: 'rest',
          name: 'Active Recovery',
          duration: 60, // 1 min
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {},
          color: '#3b82f6'
        },
        {
          id: 'int-3',
          type: 'work',
          name: 'Sprint Intervals',
          duration: 30, // 30s
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            watts: { type: 'percentage', value: 90, reference: 'max' }
          },
          color: '#ef4444'
        },
        {
          id: 'int-4',
          type: 'rest',
          name: 'Rest',
          duration: 30, // 30s
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {},
          color: '#3b82f6'
        },
        {
          id: 'int-5',
          type: 'work',
          name: 'Sprint Intervals',
          duration: 30, // 30s
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            watts: { type: 'percentage', value: 90, reference: 'max' }
          },
          color: '#ef4444'
        },
        {
          id: 'int-6',
          type: 'rest',
          name: 'Rest',
          duration: 30, // 30s
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {},
          color: '#3b82f6'
        }
      ],
      totalWorkTime: 180,
      totalRestTime: 120
    },
    
    // Block 3 - Upper Body
    {
      id: 'block-3',
      type: 'exercise',
      name: 'Upper Body Circuit',
      duration: 420, // 7 minutes
      orderIndex: 3,
      exercises: [
        {
          id: 'ex-3',
          exerciseId: 'bench',
          name: 'Dumbbell Bench Press',
          sets: 3,
          reps: 12,
          weight: 25,
          restAfter: 45,
          equipment: ['Dumbbells', 'Bench']
        },
        {
          id: 'ex-4',
          exerciseId: 'row',
          name: 'Bent Over Row',
          sets: 3,
          reps: 12,
          weight: 30,
          restAfter: 45,
          equipment: ['Barbell']
        }
      ],
      targetMuscleGroups: ['Chest', 'Back', 'Shoulders'],
      equipment: ['Dumbbells', 'Barbell', 'Bench']
    },
    
    // Transition 2
    {
      id: 'trans-2',
      type: 'transition',
      name: 'Recovery Break',
      duration: 180, // 3 minutes
      orderIndex: 4,
      transitionType: 'water_break',
      activities: ['Water break', 'Towel off', 'Prepare for next block']
    },
    
    // Block 4 - Mixed Cardio
    {
      id: 'block-4',
      type: 'interval',
      name: 'Mixed Cardio Finisher',
      duration: 420, // 7 minutes
      orderIndex: 5,
      equipment: WorkoutEquipmentType.RUNNING,
      intervals: [
        {
          id: 'int-7',
          type: 'work',
          name: 'Running Sprint',
          duration: 32, // Time for 200m
          equipment: WorkoutEquipmentType.RUNNING,
          targetMetrics: {
            distance: { type: 'absolute', value: 200 }
          },
          color: '#ef4444'
        },
        {
          id: 'int-8',
          type: 'rest',
          name: 'Walk Recovery',
          duration: 60,
          equipment: WorkoutEquipmentType.RUNNING,
          targetMetrics: {},
          color: '#3b82f6'
        },
        {
          id: 'int-9',
          type: 'work',
          name: 'Air Bike Sprint',
          duration: 180, // 3 min for 60 cal
          equipment: WorkoutEquipmentType.AIRBIKE,
          targetMetrics: {
            calories: 60
          },
          color: '#ef4444'
        },
        {
          id: 'int-10',
          type: 'rest',
          name: 'Rest',
          duration: 60,
          equipment: WorkoutEquipmentType.AIRBIKE,
          targetMetrics: {},
          color: '#3b82f6'
        },
        {
          id: 'int-11',
          type: 'work',
          name: 'Wattbike Max Effort',
          duration: 240, // 4 min
          equipment: WorkoutEquipmentType.WATTBIKE,
          targetMetrics: {
            watts: { type: 'percentage', value: 90, reference: 'max' }
          },
          color: '#ef4444'
        }
      ],
      totalWorkTime: 452,
      totalRestTime: 120
    }
  ],
  totalDuration: 2340, // 39 minutes
  totalExercises: 4,
  totalIntervals: 11,
  estimatedCalories: 450,
  equipment: ['Barbell', 'Dumbbells', 'Squat Rack', 'Bench', 'Rowing Machine', 'Air Bike', 'Wattbike']
};

export default function HybridWorkoutPlayerViewDemo() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <HybridWorkoutPlayerView
        program={exampleHybridWorkout}
        scheduledDate={new Date()}
        assignedBy="Coach Thompson"
        onStart={() => alert('Starting workout...')}
      />
    </div>
  );
}