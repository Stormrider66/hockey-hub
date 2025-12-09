import { 
  SessionTemplate, 
  WorkoutExercise,
  Exercise,
  WorkoutSet 
} from '../types';
import { 
  IntervalProgram,
  Interval,
  Equipment 
} from '../types/conditioning.types';
import { 
  HybridWorkout,
  HybridBlock,
  ExerciseBlock as HybridExerciseBlock,
  IntervalBlock as HybridIntervalBlock
} from '../types/hybrid.types';
import { 
  AgilityWorkout,
  AgilityPhase,
  Drill,
  DrillPattern 
} from '../types/agility.types';
import { UnifiedWorkoutSession } from '../types/unified';
import {
  migrateStrengthWorkout,
  migrateConditioningWorkout,
  migrateHybridWorkout,
  migrateAgilityWorkout,
  detectWorkoutFormat,
  batchMigrateWorkouts,
  BatchMigrationOptions,
  MigrationResult
} from './dataMigration';

// Test data generators
export function generateTestStrengthWorkout(overrides?: Partial<SessionTemplate>): SessionTemplate {
  const baseExercise: Exercise = {
    id: 'ex-1',
    name: 'Barbell Squat',
    description: 'Compound leg exercise',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: ['barbell', 'rack'],
    instructions: ['Stand with feet shoulder-width apart', 'Lower into squat position', 'Drive through heels to stand'],
    videoUrl: 'https://example.com/video',
    difficulty: 'intermediate',
    category: 'strength'
  };

  const baseSet: WorkoutSet = {
    type: 'working',
    reps: 10,
    weight: 135,
    completed: false
  };

  const baseWorkoutExercise: WorkoutExercise = {
    exerciseId: 'ex-1',
    exercise: baseExercise,
    sets: [
      { ...baseSet, reps: 8, weight: 185 },
      { ...baseSet, reps: 6, weight: 205 },
      { ...baseSet, reps: 4, weight: 225 }
    ],
    restBetweenSets: 120,
    notes: 'Focus on depth and control'
  };

  return {
    id: 'strength-1',
    name: 'Lower Body Strength',
    description: 'Heavy compound movements for legs',
    exercises: [
      baseWorkoutExercise,
      {
        ...baseWorkoutExercise,
        exerciseId: 'ex-2',
        exercise: { ...baseExercise, id: 'ex-2', name: 'Romanian Deadlift' }
      }
    ],
    warmupDuration: 600,
    cooldownDuration: 300,
    restBetweenExercises: 180,
    estimatedDuration: 3600,
    difficulty: 'intermediate',
    focusAreas: ['lower-body'],
    createdBy: 'trainer-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    isTemplate: true,
    isPublic: false,
    tags: ['strength', 'legs'],
    ...overrides
  };
}

export function generateTestConditioningWorkout(overrides?: Partial<IntervalProgram>): IntervalProgram {
  const baseInterval: Interval = {
    duration: 180,
    intensity: 75,
    targetHeartRate: 150,
    targetPower: 200,
    equipment: 'bike' as Equipment,
    restAfter: 120
  };

  return {
    id: 'conditioning-1',
    name: 'HIIT Bike Intervals',
    description: 'High-intensity cycling workout',
    intervals: [
      { ...baseInterval, duration: 300, intensity: 60 }, // Warmup
      { ...baseInterval, duration: 120, intensity: 85 },
      { ...baseInterval, duration: 120, intensity: 90 },
      { ...baseInterval, duration: 120, intensity: 85 },
      { ...baseInterval, duration: 300, intensity: 50, restAfter: 0 } // Cooldown
    ],
    equipment: 'bike',
    totalDuration: 1860,
    warmupDuration: 300,
    cooldownDuration: 300,
    restBetweenIntervals: 120,
    estimatedCalories: 400,
    averageIntensity: 75,
    targetSystems: ['cardiovascular'],
    audioCues: true,
    countdownBeeps: true,
    createdBy: 'trainer-1',
    createdAt: new Date('2024-01-01'),
    ...overrides
  };
}

export function generateTestHybridWorkout(overrides?: Partial<HybridWorkout>): HybridWorkout {
  const exerciseBlock: HybridExerciseBlock = {
    id: 'block-1',
    type: 'exercise',
    exercises: [{
      id: 'ex-1',
      name: 'Push-ups',
      sets: [
        { type: 'working', reps: 15, completed: false },
        { type: 'working', reps: 12, completed: false },
        { type: 'working', reps: 10, completed: false }
      ],
      restBetweenSets: 30
    }],
    notes: 'Maintain proper form'
  };

  const intervalBlock: HybridIntervalBlock = {
    id: 'block-2',
    type: 'interval',
    duration: 240,
    intensity: 80,
    equipment: 'rower',
    targetMetrics: {
      heartRate: 160,
      power: 250
    }
  };

  return {
    id: 'hybrid-1',
    name: 'Circuit Training',
    description: 'Mixed strength and cardio workout',
    blocks: [exerciseBlock, intervalBlock],
    warmup: {
      duration: 300,
      exercises: [],
      instructions: 'Dynamic warmup'
    },
    cooldown: {
      duration: 300,
      exercises: [],
      instructions: 'Static stretching'
    },
    totalDuration: 2400,
    estimatedCalories: 350,
    difficulty: 'intermediate',
    targetMuscleGroups: ['full-body'],
    targetSystems: ['muscular', 'cardiovascular'],
    transitionTime: 30,
    equipment: ['bodyweight', 'rower'],
    createdBy: 'trainer-1',
    createdAt: new Date('2024-01-01'),
    isTemplate: true,
    ...overrides
  };
}

export function generateTestAgilityWorkout(overrides?: Partial<AgilityWorkout>): AgilityWorkout {
  const tDrillPattern: DrillPattern = {
    cones: [
      { x: 0, y: 0, label: 'Start' },
      { x: 0, y: 10, label: 'A' },
      { x: -5, y: 10, label: 'B' },
      { x: 5, y: 10, label: 'C' }
    ],
    path: [
      { from: 0, to: 1, direction: 'forward', distance: 10 },
      { from: 1, to: 2, direction: 'left', distance: 5 },
      { from: 2, to: 1, direction: 'right', distance: 5 },
      { from: 1, to: 3, direction: 'right', distance: 5 },
      { from: 3, to: 0, direction: 'backward', distance: Math.sqrt(125) }
    ]
  };

  const drill: Drill = {
    id: 'drill-1',
    name: 'T-Drill',
    description: 'Classic agility test',
    pattern: tDrillPattern,
    duration: 30,
    sets: 3,
    equipment: ['cones'],
    instructions: 'Sprint forward, shuffle left and right, backpedal to start',
    trackTime: true,
    trackErrors: true,
    targetTime: 12,
    restAfter: 60
  };

  const phase: AgilityPhase = {
    id: 'phase-1',
    name: 'Main Drills',
    description: 'Primary agility work',
    drills: [drill],
    order: 1,
    restAfter: 120
  };

  return {
    id: 'agility-1',
    name: 'Agility Training Session',
    description: 'Multi-directional movement patterns',
    phases: [phase],
    warmup: {
      duration: 600,
      exercises: [],
      instructions: 'Dynamic movement prep'
    },
    cooldown: {
      duration: 300,
      exercises: [],
      instructions: 'Light jogging and stretching'
    },
    totalDuration: 1800,
    estimatedCalories: 200,
    difficulty: 'intermediate',
    focusAreas: ['change-of-direction', 'acceleration'],
    equipment: ['cones', 'markers'],
    targetLevel: 'intermediate',
    createdBy: 'trainer-1',
    createdAt: new Date('2024-01-01'),
    isTemplate: true,
    ...overrides
  };
}

// Test scenario generators
export interface TestScenario {
  name: string;
  workouts: any[];
  expectedSuccessRate: number;
  expectedWarnings: number;
  expectedErrors: number;
  description: string;
}

export function generateTestScenarios(): TestScenario[] {
  return [
    {
      name: 'All Valid Data',
      workouts: [
        generateTestStrengthWorkout(),
        generateTestConditioningWorkout(),
        generateTestHybridWorkout(),
        generateTestAgilityWorkout()
      ],
      expectedSuccessRate: 100,
      expectedWarnings: 0,
      expectedErrors: 0,
      description: 'Perfect migration scenario with all valid data'
    },
    
    {
      name: 'Mixed Valid and Invalid',
      workouts: [
        generateTestStrengthWorkout(),
        { invalid: 'data', missing: 'fields' },
        generateTestConditioningWorkout(),
        null,
        generateTestHybridWorkout(),
        { type: 'unknown' }
      ],
      expectedSuccessRate: 67,
      expectedWarnings: 0,
      expectedErrors: 3,
      description: 'Mix of valid workouts and invalid data'
    },
    
    {
      name: 'Malformed Strength Data',
      workouts: [
        generateTestStrengthWorkout({ exercises: undefined as any }),
        generateTestStrengthWorkout({ exercises: 'not-an-array' as any }),
        generateTestStrengthWorkout()
      ],
      expectedSuccessRate: 33,
      expectedWarnings: 0,
      expectedErrors: 2,
      description: 'Strength workouts with malformed exercise data'
    },
    
    {
      name: 'Large Dataset',
      workouts: Array.from({ length: 100 }, (_, i) => {
        const type = i % 4;
        switch (type) {
          case 0: return generateTestStrengthWorkout({ id: `strength-${i}` });
          case 1: return generateTestConditioningWorkout({ id: `conditioning-${i}` });
          case 2: return generateTestHybridWorkout({ id: `hybrid-${i}` });
          default: return generateTestAgilityWorkout({ id: `agility-${i}` });
        }
      }),
      expectedSuccessRate: 100,
      expectedWarnings: 0,
      expectedErrors: 0,
      description: 'Large dataset with 100 valid workouts'
    },
    
    {
      name: 'Already Migrated',
      workouts: [
        generateTestUnifiedWorkout('strength'),
        generateTestUnifiedWorkout('conditioning'),
        generateTestStrengthWorkout(),
        generateTestConditioningWorkout()
      ],
      expectedSuccessRate: 50, // Only 2 need migration
      expectedWarnings: 0,
      expectedErrors: 0,
      description: 'Mix of unified and legacy workouts'
    }
  ];
}

export function generateTestUnifiedWorkout(type: 'strength' | 'conditioning' | 'hybrid' | 'agility'): UnifiedWorkoutSession {
  return {
    id: `unified-${type}-1`,
    version: '1.0.0',
    type,
    name: `Test ${type} workout`,
    description: `Test unified ${type} workout`,
    content: {
      blocks: [],
      totalDuration: 3600,
      difficulty: 'intermediate'
    },
    metadata: {
      createdBy: 'system',
      createdAt: new Date(),
      lastModifiedBy: 'system',
      lastModifiedAt: new Date(),
      tags: [],
      category: type,
      isTemplate: true,
      version: 1,
      equipment: [],
      targetAudience: ['intermediate'],
      language: 'en',
      visibility: 'private',
      permissions: {
        canEdit: ['owner'],
        canView: ['owner'],
        canShare: ['owner']
      }
    }
  };
}

// Performance testing utilities
export interface PerformanceTestResult {
  scenario: string;
  totalWorkouts: number;
  duration: number;
  throughput: number; // workouts per second
  averageTimePerWorkout: number;
  memoryUsage: number;
  success: boolean;
  errors: string[];
}

export async function runPerformanceTest(
  scenario: TestScenario,
  options: BatchMigrationOptions
): Promise<PerformanceTestResult> {
  const startTime = performance.now();
  const startMemory = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0;
  
  try {
    const result = await batchMigrateWorkouts(scenario.workouts, options);
    
    const endTime = performance.now();
    const endMemory = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0;
    const duration = endTime - startTime;
    
    return {
      scenario: scenario.name,
      totalWorkouts: scenario.workouts.length,
      duration,
      throughput: (scenario.workouts.length / duration) * 1000,
      averageTimePerWorkout: duration / scenario.workouts.length,
      memoryUsage: endMemory - startMemory,
      success: true,
      errors: []
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      scenario: scenario.name,
      totalWorkouts: scenario.workouts.length,
      duration,
      throughput: 0,
      averageTimePerWorkout: 0,
      memoryUsage: 0,
      success: false,
      errors: [error.message]
    };
  }
}

// Data validation testing
export interface ValidationTestResult {
  workoutId: string;
  originalFormat: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  migrationResult?: MigrationResult<UnifiedWorkoutSession>;
}

export function runValidationTests(workouts: any[]): ValidationTestResult[] {
  return workouts.map((workout, index) => {
    const workoutId = workout.id || `workout-${index}`;
    const format = detectWorkoutFormat(workout);
    
    let migrationResult: MigrationResult<UnifiedWorkoutSession> | undefined;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      switch (format) {
        case 'strength':
          migrationResult = migrateStrengthWorkout(workout);
          break;
        case 'conditioning':
          migrationResult = migrateConditioningWorkout(workout);
          break;
        case 'hybrid':
          migrationResult = migrateHybridWorkout(workout);
          break;
        case 'agility':
          migrationResult = migrateAgilityWorkout(workout);
          break;
        default:
          errors.push(`Unknown format: ${format}`);
      }
      
      if (migrationResult) {
        errors.push(...migrationResult.errors.map(e => e.message));
        warnings.push(...migrationResult.warnings.map(w => w.message));
      }
    } catch (error) {
      errors.push(`Migration failed: ${error.message}`);
    }
    
    return {
      workoutId,
      originalFormat: format,
      isValid: errors.length === 0,
      errors,
      warnings,
      migrationResult
    };
  });
}

// Benchmark utilities
export interface BenchmarkOptions {
  iterations: number;
  warmupRuns: number;
  batchSizes: number[];
}

export async function runMigrationBenchmark(
  workouts: any[],
  options: BenchmarkOptions
): Promise<Map<number, PerformanceTestResult[]>> {
  const results = new Map<number, PerformanceTestResult[]>();
  
  for (const batchSize of options.batchSizes) {
    const batchResults: PerformanceTestResult[] = [];
    
    // Warmup runs
    for (let i = 0; i < options.warmupRuns; i++) {
      await batchMigrateWorkouts(workouts.slice(0, 10), { batchSize, validateBeforeMigration: false, stopOnError: false, preserveOriginal: false, dryRun: true });
    }
    
    // Actual benchmark runs
    for (let i = 0; i < options.iterations; i++) {
      const startTime = performance.now();
      
      try {
        await batchMigrateWorkouts(workouts, { 
          batchSize, 
          validateBeforeMigration: false, 
          stopOnError: false, 
          preserveOriginal: false, 
          dryRun: true 
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        batchResults.push({
          scenario: `Batch Size ${batchSize} - Run ${i + 1}`,
          totalWorkouts: workouts.length,
          duration,
          throughput: (workouts.length / duration) * 1000,
          averageTimePerWorkout: duration / workouts.length,
          memoryUsage: 0,
          success: true,
          errors: []
        });
      } catch (error) {
        batchResults.push({
          scenario: `Batch Size ${batchSize} - Run ${i + 1}`,
          totalWorkouts: workouts.length,
          duration: 0,
          throughput: 0,
          averageTimePerWorkout: 0,
          memoryUsage: 0,
          success: false,
          errors: [error.message]
        });
      }
    }
    
    results.set(batchSize, batchResults);
  }
  
  return results;
}

// Test report generation
export interface TestReport {
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    totalWorkouts: number;
    totalDuration: number;
    averageThroughput: number;
  };
  scenarioResults: PerformanceTestResult[];
  validationResults: ValidationTestResult[];
  recommendations: string[];
}

export function generateTestReport(
  performanceResults: PerformanceTestResult[],
  validationResults: ValidationTestResult[]
): TestReport {
  const totalDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0);
  const totalWorkouts = performanceResults.reduce((sum, r) => sum + r.totalWorkouts, 0);
  const averageThroughput = totalWorkouts > 0 ? (totalWorkouts / totalDuration) * 1000 : 0;
  
  const recommendations: string[] = [];
  
  // Generate recommendations based on results
  const failedValidations = validationResults.filter(r => !r.isValid).length;
  if (failedValidations > 0) {
    recommendations.push(`${failedValidations} workouts failed validation - review data quality`);
  }
  
  const slowScenarios = performanceResults.filter(r => r.throughput < 10); // Less than 10 workouts/second
  if (slowScenarios.length > 0) {
    recommendations.push('Performance is below optimal - consider increasing batch size');
  }
  
  const memoryIntensive = performanceResults.filter(r => r.memoryUsage > 50 * 1024 * 1024); // > 50MB
  if (memoryIntensive.length > 0) {
    recommendations.push('High memory usage detected - consider smaller batch sizes');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All tests passed - migration system is performing optimally');
  }
  
  return {
    summary: {
      totalScenarios: performanceResults.length,
      passedScenarios: performanceResults.filter(r => r.success).length,
      failedScenarios: performanceResults.filter(r => !r.success).length,
      totalWorkouts,
      totalDuration,
      averageThroughput
    },
    scenarioResults: performanceResults,
    validationResults,
    recommendations
  };
}

// Quick test runner for development
export async function runQuickMigrationTest(): Promise<TestReport> {
  console.log('Running quick migration test...');
  
  const scenarios = generateTestScenarios().slice(0, 3); // First 3 scenarios only
  const performanceResults: PerformanceTestResult[] = [];
  const allValidationResults: ValidationTestResult[] = [];
  
  for (const scenario of scenarios) {
    console.log(`Testing scenario: ${scenario.name}`);
    
    // Performance test
    const perfResult = await runPerformanceTest(scenario, {
      batchSize: 25,
      validateBeforeMigration: true,
      stopOnError: false,
      preserveOriginal: true,
      dryRun: true
    });
    performanceResults.push(perfResult);
    
    // Validation test
    const validationResults = runValidationTests(scenario.workouts);
    allValidationResults.push(...validationResults);
  }
  
  const report = generateTestReport(performanceResults, allValidationResults);
  console.log('Quick test completed:', report.summary);
  
  return report;
}