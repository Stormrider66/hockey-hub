'use client';

import React from 'react';
import { WorkoutPreview } from './WorkoutPreview';
import { WorkoutType } from '../../types/session.types';
import type { StrengthWorkout } from '../../types/strength.types';
import type { IntervalProgram } from '../../types/conditioning.types';
import type { HybridProgram } from '../../types/hybrid.types';
import type { AgilityProgram } from '../../types/agility.types';

// Sample data for demonstration
const strengthWorkout: StrengthWorkout = {
  id: '1',
  name: 'Upper Body Power',
  description: 'Focus on explosive upper body movements for hockey performance',
  totalDuration: 45,
  exercises: [
    {
      id: '1',
      name: 'Bench Press',
      category: 'strength',
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      sets: 4,
      reps: 6,
      restBetweenSets: 120,
      orderIndex: 1,
      isCompound: true,
      difficulty: 'intermediate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Pull-ups',
      category: 'strength',
      muscleGroups: ['back', 'biceps'],
      equipment: ['pull_up_bar'],
      sets: 3,
      reps: 8,
      restBetweenSets: 90,
      orderIndex: 2,
      isCompound: true,
      difficulty: 'intermediate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  warmupExercises: [
    {
      id: '3',
      name: 'Arm Circles',
      category: 'mobility',
      muscleGroups: ['shoulders'],
      equipment: ['bodyweight'],
      sets: 1,
      duration: 30,
      orderIndex: 1,
      isCompound: false,
      difficulty: 'beginner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

const conditioningProgram: IntervalProgram = {
  id: '2',
  name: 'HIIT Bike Intervals',
  description: 'High-intensity intervals for cardiovascular conditioning',
  equipment: 'bike_erg',
  totalDuration: 1800, // 30 minutes
  intervals: [
    { id: '1', type: 'warmup', duration: 300, equipment: 'bike_erg', targetMetrics: {} },
    { id: '2', type: 'work', duration: 30, equipment: 'bike_erg', targetMetrics: { heartRate: { type: 'percentage', value: 90, reference: 'max' } } },
    { id: '3', type: 'rest', duration: 30, equipment: 'bike_erg', targetMetrics: {} },
    { id: '4', type: 'work', duration: 30, equipment: 'bike_erg', targetMetrics: { heartRate: { type: 'percentage', value: 90, reference: 'max' } } },
    { id: '5', type: 'cooldown', duration: 300, equipment: 'bike_erg', targetMetrics: {} }
  ],
  targetZones: {
    zone1: 20,
    zone2: 10,
    zone3: 20,
    zone4: 40,
    zone5: 10
  },
  difficulty: 'advanced'
};

const hybridProgram: HybridProgram = {
  id: '3',
  name: 'Hockey Circuit Training',
  description: 'Combined strength and cardio for game-ready fitness',
  blocks: [
    {
      id: '1',
      type: 'exercise',
      name: 'Strength Circuit',
      duration: 600,
      orderIndex: 1,
      exercises: [],
      targetMuscleGroups: ['full_body'],
      equipment: ['dumbbells', 'kettlebells']
    },
    {
      id: '2',
      type: 'interval',
      name: 'Sprint Intervals',
      duration: 300,
      orderIndex: 2,
      intervals: [],
      equipment: 'treadmill',
      totalWorkTime: 180,
      totalRestTime: 120
    },
    {
      id: '3',
      type: 'transition',
      name: 'Active Recovery',
      duration: 120,
      orderIndex: 3,
      transitionType: 'active_recovery',
      activities: ['stretching', 'hydration']
    }
  ],
  totalDuration: 1020,
  totalExercises: 8,
  totalIntervals: 6,
  estimatedCalories: 450,
  equipment: ['dumbbells', 'kettlebells', 'treadmill']
};

const agilityProgram: AgilityProgram = {
  id: '4',
  name: 'Hockey Agility Development',
  description: 'Improve on-ice movement patterns and reaction time',
  drills: [
    {
      id: '1',
      name: 'T-Drill',
      category: 'cone_drills',
      pattern: 't_drill',
      equipment: ['cones'],
      targetTime: 10,
      restBetweenReps: 30,
      reps: 3,
      sets: 2,
      description: 'Classic agility drill',
      instructions: ['Sprint forward', 'Shuffle left', 'Shuffle right', 'Backpedal'],
      coachingCues: ['Stay low', 'Quick feet'],
      difficulty: 'intermediate',
      metrics: { time: true, accuracy: true }
    },
    {
      id: '2',
      name: '5-10-5 Drill',
      category: 'change_of_direction',
      pattern: '5_10_5',
      equipment: ['cones'],
      targetTime: 5,
      restBetweenReps: 45,
      reps: 4,
      description: 'Pro agility test',
      instructions: ['Sprint 5 yards right', 'Sprint 10 yards left', 'Sprint 5 yards to finish'],
      coachingCues: ['Explosive starts', 'Low center of gravity'],
      difficulty: 'advanced',
      metrics: { time: true, accuracy: false }
    }
  ],
  warmupDuration: 300,
  cooldownDuration: 300,
  totalDuration: 1200,
  equipmentNeeded: ['cones'],
  difficulty: 'intermediate',
  focusAreas: ['acceleration', 'deceleration', 'lateral_movement']
};

export function WorkoutPreviewDemo() {
  return (
    <div className="p-8 space-y-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Workout Preview Component Demo</h1>
        
        {/* Full-size previews */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Full-Size Previews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WorkoutPreview
              workoutType={WorkoutType.STRENGTH}
              workoutData={strengthWorkout}
              playerAssignments={{ players: ['player1', 'player2'], teams: ['team1'] }}
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.CONDITIONING}
              workoutData={conditioningProgram}
              playerAssignments={{ players: [], teams: ['team1', 'team2'] }}
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.HYBRID}
              workoutData={hybridProgram}
              playerAssignments={{ players: ['player1'], teams: [] }}
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.AGILITY}
              workoutData={agilityProgram}
              showMedical={false}
            />
          </div>
        </div>

        {/* Compact previews */}
        <div className="space-y-6 mt-12">
          <h2 className="text-xl font-semibold">Compact Previews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WorkoutPreview
              workoutType={WorkoutType.STRENGTH}
              workoutData={strengthWorkout}
              compact
              interactive
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.CONDITIONING}
              workoutData={conditioningProgram}
              compact
              interactive
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.HYBRID}
              workoutData={hybridProgram}
              compact
              interactive
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.AGILITY}
              workoutData={agilityProgram}
              compact
              interactive
            />
          </div>
        </div>

        {/* Interactive previews */}
        <div className="space-y-6 mt-12">
          <h2 className="text-xl font-semibold">Interactive Previews (Hover Effect)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WorkoutPreview
              workoutType={WorkoutType.STRENGTH}
              workoutData={strengthWorkout}
              interactive
              className="transition-transform hover:scale-[1.02]"
            />
            
            <WorkoutPreview
              workoutType={WorkoutType.CONDITIONING}
              workoutData={conditioningProgram}
              interactive
              className="transition-transform hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}