/**
 * Strength Mode Configurations
 * 
 * Defines the characteristics and parameters for different strength training modes
 */

import { StrengthMode, StrengthModeConfig, ModeSpecificMetrics } from '../types/session-builder.types';

/**
 * Configuration for each strength training mode
 */
export const STRENGTH_MODE_CONFIGS: Record<StrengthMode, StrengthModeConfig> = {
  strength: {
    mode: 'strength',
    name: 'Strength',
    description: 'Traditional strength training focused on maximal force production',
    color: 'blue',
    icon: 'Zap',
    
    exerciseCategories: [
      'compound_movements',
      'multi_joint',
      'bilateral',
      'heavy_resistance',
      'barbell_exercises',
      'dumbbell_exercises'
    ],
    
    defaultRestPeriods: {
      betweenSets: 120, // 2 minutes
      betweenExercises: 180 // 3 minutes
    },
    
    defaultRepRange: {
      min: 3,
      max: 8,
      recommended: 5
    },
    
    defaultSetRange: {
      min: 3,
      max: 5,
      recommended: 4
    },
    
    intensityFocus: 'strength',
    
    loadCharacteristics: {
      usePercentage1RM: true,
      useVelocity: false,
      useTime: false,
      useBodyweight: false
    },
    
    availableMetrics: [],
    
    preferredEquipment: [
      'barbell',
      'squat_rack',
      'bench_press',
      'dumbbells',
      'weight_plates',
      'safety_bars'
    ],
    
    phaseEmphasis: {
      warmup: 15,
      main: 60,
      accessory: 15,
      core: 5,
      cooldown: 5
    }
  },

  power: {
    mode: 'power',
    name: 'Power',
    description: 'Explosive movement training with focus on velocity and power output',
    color: 'red',
    icon: 'Zap',
    
    exerciseCategories: [
      'olympic_lifts',
      'explosive_movements',
      'medicine_ball',
      'kettlebell_swings',
      'jump_training',
      'throwing_movements'
    ],
    
    defaultRestPeriods: {
      betweenSets: 180, // 3 minutes
      betweenExercises: 300 // 5 minutes
    },
    
    defaultRepRange: {
      min: 1,
      max: 5,
      recommended: 3
    },
    
    defaultSetRange: {
      min: 3,
      max: 6,
      recommended: 4
    },
    
    intensityFocus: 'power',
    
    loadCharacteristics: {
      usePercentage1RM: true,
      useVelocity: true,
      useTime: false,
      useBodyweight: false
    },
    
    availableMetrics: ['velocity', 'powerOutput', 'peakVelocity'],
    
    preferredEquipment: [
      'olympic_barbell',
      'bumper_plates',
      'platform',
      'medicine_ball',
      'kettlebells',
      'velocity_tracker'
    ],
    
    phaseEmphasis: {
      warmup: 20,
      main: 50,
      accessory: 20,
      core: 5,
      cooldown: 5
    }
  },

  stability_core: {
    mode: 'stability_core',
    name: 'Stability & Core',
    description: 'Core strengthening and stability training for injury prevention',
    color: 'green',
    icon: 'Target',
    
    exerciseCategories: [
      'core_exercises',
      'unilateral_movements',
      'balance_training',
      'anti_rotation',
      'anti_extension',
      'stabilization'
    ],
    
    defaultRestPeriods: {
      betweenSets: 30, // 30 seconds
      betweenExercises: 60 // 1 minute
    },
    
    defaultRepRange: {
      min: 8,
      max: 20,
      recommended: 12
    },
    
    defaultSetRange: {
      min: 2,
      max: 4,
      recommended: 3
    },
    
    intensityFocus: 'endurance',
    
    loadCharacteristics: {
      usePercentage1RM: false,
      useVelocity: false,
      useTime: true,
      useBodyweight: true
    },
    
    availableMetrics: ['holdTime', 'balanceDuration', 'stabilityScore'],
    
    preferredEquipment: [
      'stability_ball',
      'bosu_ball',
      'resistance_bands',
      'suspension_trainer',
      'balance_pads',
      'ab_wheel'
    ],
    
    phaseEmphasis: {
      warmup: 10,
      main: 40,
      accessory: 20,
      core: 25,
      cooldown: 5
    }
  },

  plyometrics: {
    mode: 'plyometrics',
    name: 'Plyometrics',
    description: 'Jump and explosive training for power development and athleticism',
    color: 'orange',
    icon: 'TrendingUp',
    
    exerciseCategories: [
      'jump_training',
      'bounding',
      'hopping',
      'depth_jumps',
      'reactive_training',
      'landing_mechanics'
    ],
    
    defaultRestPeriods: {
      betweenSets: 120, // 2 minutes
      betweenExercises: 180 // 3 minutes
    },
    
    defaultRepRange: {
      min: 3,
      max: 8,
      recommended: 5
    },
    
    defaultSetRange: {
      min: 3,
      max: 5,
      recommended: 3
    },
    
    intensityFocus: 'power',
    
    loadCharacteristics: {
      usePercentage1RM: false,
      useVelocity: false,
      useTime: false,
      useBodyweight: true
    },
    
    availableMetrics: [
      'jumpHeight',
      'contactTime',
      'reactiveStrengthIndex',
      'flightTime',
      'landingForce'
    ],
    
    preferredEquipment: [
      'plyo_boxes',
      'hurdles',
      'cones',
      'agility_ladder',
      'force_plates',
      'jump_mat'
    ],
    
    phaseEmphasis: {
      warmup: 25,
      main: 50,
      accessory: 15,
      core: 5,
      cooldown: 5
    }
  }
};

/**
 * Get configuration for a specific strength mode
 */
export const getStrengthModeConfig = (mode: StrengthMode): StrengthModeConfig => {
  return STRENGTH_MODE_CONFIGS[mode];
};

/**
 * Get all available strength modes
 */
export const getAvailableStrengthModes = (): StrengthMode[] => {
  return Object.keys(STRENGTH_MODE_CONFIGS) as StrengthMode[];
};

/**
 * Get mode-specific exercise categories for filtering
 */
export const getModeExerciseCategories = (mode: StrengthMode): string[] => {
  return STRENGTH_MODE_CONFIGS[mode].exerciseCategories;
};

/**
 * Calculate mode-specific defaults for exercise parameters
 */
export const getModeDefaults = (mode: StrengthMode) => {
  const config = STRENGTH_MODE_CONFIGS[mode];
  
  return {
    sets: config.defaultSetRange.recommended,
    reps: config.defaultRepRange.recommended,
    rest: config.defaultRestPeriods.betweenSets,
    restBetweenExercises: config.defaultRestPeriods.betweenExercises,
    loadCharacteristics: config.loadCharacteristics,
    availableMetrics: config.availableMetrics,
    preferredEquipment: config.preferredEquipment
  };
};

/**
 * Get mode-appropriate exercises from a list based on categories
 */
export const filterExercisesByMode = (exercises: any[], mode: StrengthMode): any[] => {
  const config = STRENGTH_MODE_CONFIGS[mode];
  
  return exercises.filter(exercise => {
    // Check if exercise category matches mode categories
    const exerciseCategories = exercise.category ? [exercise.category] : [];
    const exerciseTags = exercise.tags || [];
    const allExerciseIdentifiers = [...exerciseCategories, ...exerciseTags];
    
    return config.exerciseCategories.some(category => 
      allExerciseIdentifiers.includes(category)
    );
  });
};

/**
 * Validate if metrics are appropriate for the selected mode
 */
export const validateMetricsForMode = (
  metrics: Partial<ModeSpecificMetrics>, 
  mode: StrengthMode
): boolean => {
  const config = STRENGTH_MODE_CONFIGS[mode];
  const providedMetrics = Object.keys(metrics) as (keyof ModeSpecificMetrics)[];
  
  // Check if all provided metrics are valid for this mode
  return providedMetrics.every(metric => 
    config.availableMetrics.includes(metric)
  );
};

/**
 * Get recommended rest periods based on mode and exercise type
 */
export const getRecommendedRestPeriod = (
  mode: StrengthMode, 
  exerciseType: 'main' | 'accessory' | 'core' = 'main'
): number => {
  const config = STRENGTH_MODE_CONFIGS[mode];
  
  // Adjust rest based on exercise type
  const baseRest = config.defaultRestPeriods.betweenSets;
  
  switch (exerciseType) {
    case 'main':
      return baseRest;
    case 'accessory':
      return Math.max(30, baseRest * 0.6); // 60% of main rest, min 30s
    case 'core':
      return Math.max(20, baseRest * 0.4); // 40% of main rest, min 20s
    default:
      return baseRest;
  }
};