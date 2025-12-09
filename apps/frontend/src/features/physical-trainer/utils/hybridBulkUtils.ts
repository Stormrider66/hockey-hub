import type { HybridProgram, HybridWorkoutBlock } from '../types/hybrid.types';
import type { BulkSessionConfig, SessionConfiguration } from '../hooks/useBulkSession';
import { WorkoutEquipmentType } from '../types/conditioning.types';

export interface HybridBulkOptions {
  rotationStrategy: 'none' | 'sequential' | 'balanced' | 'strength_focus' | 'cardio_focus';
  blockVariation: boolean;
  equipmentConflictResolution: 'stagger' | 'share' | 'allocate';
  transitionPadding: number; // Extra time for equipment changes
}

export interface EquipmentAllocation {
  sessionId: string;
  strengthEquipment: string[];
  cardioEquipment: WorkoutEquipmentType[];
  conflicts: EquipmentConflict[];
}

export interface EquipmentConflict {
  equipment: WorkoutEquipmentType;
  requiredSessions: string[];
  availableCount: number;
  conflictType: 'shortage' | 'timing' | 'location';
}

// Default hybrid bulk options
export const DEFAULT_HYBRID_BULK_OPTIONS: HybridBulkOptions = {
  rotationStrategy: 'balanced',
  blockVariation: true,
  equipmentConflictResolution: 'stagger',
  transitionPadding: 30 // 30 seconds extra for equipment changes
};

/**
 * Analyzes a hybrid program to determine equipment requirements
 */
export const analyzeHybridEquipmentNeeds = (program: HybridProgram) => {
  const strengthEquipment = new Set<string>();
  const cardioEquipment = new Set<WorkoutEquipmentType>();
  let hasTransitions = false;
  let blockTransitions = 0;

  program.blocks.forEach((block, index) => {
    if (block.type === 'exercise') {
      block.exercises?.forEach(exercise => {
        exercise.equipment?.forEach(eq => strengthEquipment.add(eq));
      });
    } else if (block.type === 'interval') {
      cardioEquipment.add(block.equipment as WorkoutEquipmentType);
    } else if (block.type === 'transition') {
      hasTransitions = true;
    }

    // Count equipment transitions
    if (index > 0) {
      const prevBlock = program.blocks[index - 1];
      if (prevBlock.type !== block.type) {
        blockTransitions++;
      }
    }
  });

  return {
    strengthEquipment: Array.from(strengthEquipment),
    cardioEquipment: Array.from(cardioEquipment),
    hasTransitions,
    blockTransitions,
    mixedRequirements: strengthEquipment.size > 0 && cardioEquipment.size > 0,
    complexityScore: strengthEquipment.size + cardioEquipment.size + blockTransitions
  };
};

/**
 * Generates equipment allocation strategy for hybrid bulk sessions
 */
export const generateHybridEquipmentAllocation = (
  config: BulkSessionConfig<HybridProgram>,
  options: HybridBulkOptions = DEFAULT_HYBRID_BULK_OPTIONS
): EquipmentAllocation[] => {
  const baseProgram = config.baseWorkout;
  if (!baseProgram) return [];

  const equipmentAnalysis = analyzeHybridEquipmentNeeds(baseProgram);
  const availableCardioEquipment: WorkoutEquipmentType[] = [
    WorkoutEquipmentType.ROWING,
    WorkoutEquipmentType.BIKE_ERG,
    WorkoutEquipmentType.TREADMILL,
    WorkoutEquipmentType.AIRBIKE,
    WorkoutEquipmentType.SKIERG,
    WorkoutEquipmentType.WATTBIKE,
    WorkoutEquipmentType.ROPE_JUMP
  ];

  return config.sessions.map((session, sessionIndex): EquipmentAllocation => {
    let cardioAllocation: WorkoutEquipmentType[] = [];
    
    switch (options.rotationStrategy) {
      case 'sequential':
        // Rotate through equipment sequentially
        cardioAllocation = [availableCardioEquipment[sessionIndex % availableCardioEquipment.length]];
        break;
        
      case 'balanced':
        // Distribute equipment evenly across sessions
        const itemsPerSession = Math.ceil(availableCardioEquipment.length / config.numberOfSessions);
        const startIndex = (sessionIndex * itemsPerSession) % availableCardioEquipment.length;
        cardioAllocation = availableCardioEquipment.slice(startIndex, startIndex + itemsPerSession);
        if (cardioAllocation.length === 0) {
          cardioAllocation = [availableCardioEquipment[0]];
        }
        break;
        
      case 'strength_focus':
        // Alternate sessions: strength-heavy (minimal cardio) vs balanced
        if (sessionIndex % 2 === 0) {
          cardioAllocation = availableCardioEquipment.slice(0, 1); // Minimal cardio variety
        } else {
          cardioAllocation = availableCardioEquipment.slice(0, 3); // More cardio variety
        }
        break;
        
      case 'cardio_focus':
        // Alternate sessions: cardio-heavy vs minimal cardio
        if (sessionIndex % 2 === 0) {
          cardioAllocation = availableCardioEquipment.slice(0, 4); // High cardio variety
        } else {
          cardioAllocation = availableCardioEquipment.slice(0, 2); // Moderate variety
        }
        break;
        
      case 'none':
      default:
        // Use all available equipment for each session
        cardioAllocation = equipmentAnalysis.cardioEquipment as WorkoutEquipmentType[];
        break;
    }

    return {
      sessionId: session.id,
      strengthEquipment: equipmentAnalysis.strengthEquipment,
      cardioEquipment: cardioAllocation,
      conflicts: [] // Will be populated by conflict detection
    };
  });
};

/**
 * Detects equipment conflicts across bulk sessions
 */
export const detectHybridEquipmentConflicts = (
  allocations: EquipmentAllocation[],
  facilityCapacity: Record<WorkoutEquipmentType, number> = {}
): EquipmentConflict[] => {
  const conflicts: EquipmentConflict[] = [];
  const equipmentUsage = new Map<WorkoutEquipmentType, string[]>();

  // Count usage across all sessions
  allocations.forEach(allocation => {
    allocation.cardioEquipment.forEach(equipment => {
      if (!equipmentUsage.has(equipment)) {
        equipmentUsage.set(equipment, []);
      }
      equipmentUsage.get(equipment)!.push(allocation.sessionId);
    });
  });

  // Check for conflicts
  equipmentUsage.forEach((sessions, equipment) => {
    const capacity = facilityCapacity[equipment] || getDefaultEquipmentCapacity(equipment);
    
    if (sessions.length > capacity) {
      conflicts.push({
        equipment,
        requiredSessions: sessions,
        availableCount: capacity,
        conflictType: 'shortage'
      });
    }
  });

  return conflicts;
};

/**
 * Applies block variations for hybrid bulk sessions
 */
export const generateHybridBlockVariations = (
  baseProgram: HybridProgram,
  sessionIndex: number,
  options: HybridBulkOptions = DEFAULT_HYBRID_BULK_OPTIONS
): HybridWorkoutBlock[] => {
  if (!options.blockVariation) {
    return baseProgram.blocks;
  }

  return baseProgram.blocks.map((block, blockIndex) => {
    const variation = { ...block };
    const variationFactor = sessionIndex + 1;

    switch (block.type) {
      case 'exercise':
        // Vary exercise block duration and rest periods
        const exerciseDurationVariation = (variationFactor * 15) % 60; // 0-45 second variation
        variation.duration = Math.max(180, block.duration + exerciseDurationVariation);
        
        // Optionally vary exercise order (by modifying the order within the block)
        if (variationFactor % 3 === 0 && block.exercises && block.exercises.length > 1) {
          const shuffledExercises = [...block.exercises];
          // Simple rotation: move first exercise to end
          const firstExercise = shuffledExercises.shift();
          if (firstExercise) {
            shuffledExercises.push(firstExercise);
          }
          variation.exercises = shuffledExercises;
        }
        break;

      case 'interval':
        // Vary interval duration and intensity patterns
        const intervalDurationVariation = (variationFactor * 10) % 30; // 0-20 second variation
        variation.duration = Math.max(60, block.duration + intervalDurationVariation);
        
        // Rotate equipment if multiple options available
        if (sessionIndex > 0 && block.intervals && block.intervals.length > 0) {
          const equipmentOptions: WorkoutEquipmentType[] = [
            WorkoutEquipmentType.ROWING,
            WorkoutEquipmentType.BIKE_ERG,
            WorkoutEquipmentType.AIRBIKE
          ];
          const equipmentIndex = (sessionIndex + blockIndex) % equipmentOptions.length;
          variation.equipment = equipmentOptions[equipmentIndex];
        }
        break;

      case 'transition':
        // Add padding for equipment changes in mixed programs
        const baseTransition = block.duration;
        const equipmentChangePadding = options.transitionPadding;
        
        // Add extra time if transitioning between different equipment types
        const prevBlock = blockIndex > 0 ? baseProgram.blocks[blockIndex - 1] : null;
        const nextBlock = blockIndex < baseProgram.blocks.length - 1 ? baseProgram.blocks[blockIndex + 1] : null;
        
        let additionalTime = 0;
        if (prevBlock && nextBlock && prevBlock.type !== nextBlock.type) {
          additionalTime = equipmentChangePadding;
        }
        
        variation.duration = baseTransition + additionalTime + (variationFactor * 5); // Small session-specific variation
        break;
    }

    return variation;
  });
};

/**
 * Resolves equipment conflicts using the specified strategy
 */
export const resolveHybridEquipmentConflicts = (
  config: BulkSessionConfig<HybridProgram>,
  conflicts: EquipmentConflict[],
  resolution: 'stagger' | 'share' | 'allocate'
): BulkSessionConfig<HybridProgram> => {
  if (conflicts.length === 0) return config;

  const updatedConfig = { ...config };

  switch (resolution) {
    case 'stagger':
      // Implement staggered start times to avoid equipment conflicts
      updatedConfig.staggerStartTimes = true;
      updatedConfig.staggerInterval = Math.max(15, config.duration / 4); // Stagger by 25% of session duration
      break;

    case 'share':
      // Allow equipment conflicts but mark them as shared
      updatedConfig.allowEquipmentConflicts = true;
      break;

    case 'allocate':
      // Redistribute equipment to minimize conflicts
      const newAllocations = redistributeEquipment(conflicts, config.sessions);
      updatedConfig.sessions = updatedConfig.sessions.map((session, index) => ({
        ...session,
        equipment: newAllocations[index] || session.equipment
      }));
      break;
  }

  return updatedConfig;
};

/**
 * Redistributes equipment to minimize conflicts
 */
const redistributeEquipment = (
  conflicts: EquipmentConflict[],
  sessions: SessionConfiguration<HybridProgram>[]
): WorkoutEquipmentType[][] => {
  const availableEquipment: WorkoutEquipmentType[] = [
    WorkoutEquipmentType.ROWING,
    WorkoutEquipmentType.BIKE_ERG,
    WorkoutEquipmentType.TREADMILL,
    WorkoutEquipmentType.AIRBIKE,
    WorkoutEquipmentType.SKIERG,
    WorkoutEquipmentType.WATTBIKE,
    WorkoutEquipmentType.ROPE_JUMP
  ];

  return sessions.map((session, index) => {
    // Distribute equipment evenly, avoiding conflicts
    const equipmentPerSession = Math.ceil(availableEquipment.length / sessions.length);
    const startIndex = (index * equipmentPerSession) % availableEquipment.length;
    return availableEquipment.slice(startIndex, startIndex + equipmentPerSession);
  });
};

/**
 * Gets default equipment capacity for facilities
 */
const getDefaultEquipmentCapacity = (equipment: WorkoutEquipmentType): number => {
  const capacityMap: Record<WorkoutEquipmentType, number> = {
    [WorkoutEquipmentType.ROWING]: 8,
    [WorkoutEquipmentType.BIKE_ERG]: 12,
    [WorkoutEquipmentType.TREADMILL]: 6,
    [WorkoutEquipmentType.AIRBIKE]: 6,
    [WorkoutEquipmentType.SKIERG]: 4,
    [WorkoutEquipmentType.WATTBIKE]: 8,
    [WorkoutEquipmentType.ROPE_JUMP]: 20,
    [WorkoutEquipmentType.RUNNING]: 50 // Outdoor/track running
  };

  return capacityMap[equipment] || 4;
};

/**
 * Calculates the total duration for a hybrid program with variations
 */
export const calculateHybridSessionDuration = (
  program: HybridProgram,
  sessionIndex: number,
  options: HybridBulkOptions = DEFAULT_HYBRID_BULK_OPTIONS
): number => {
  const variatedBlocks = generateHybridBlockVariations(program, sessionIndex, options);
  return variatedBlocks.reduce((total, block) => total + block.duration, 0);
};

/**
 * Validates hybrid bulk session configuration
 */
export const validateHybridBulkConfig = (
  config: BulkSessionConfig<HybridProgram>
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check base program
  if (!config.baseWorkout) {
    errors.push('Base hybrid program is required');
  } else {
    const analysis = analyzeHybridEquipmentNeeds(config.baseWorkout);
    
    if (analysis.complexityScore > 10) {
      warnings.push('High complexity program may require additional setup time');
    }

    if (analysis.mixedRequirements && !config.staggerStartTimes) {
      warnings.push('Mixed equipment requirements may benefit from staggered start times');
    }
  }

  // Check session assignments
  config.sessions.forEach((session, index) => {
    if (session.playerIds.length === 0 && session.teamIds.length === 0) {
      errors.push(`Session ${index + 1}: No players or teams assigned`);
    }

    if (!session.equipment || session.equipment.length === 0) {
      warnings.push(`Session ${index + 1}: No equipment specified for cardio intervals`);
    }
  });

  // Check facility capacity
  if (config.numberOfSessions > 8) {
    warnings.push('Large number of sessions may strain facility resources');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};