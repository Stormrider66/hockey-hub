/**
 * Utilities for converting rotation configurations to training sessions
 * and coordinating with the existing TrainingSessionViewer infrastructure
 */

import type {
  RotationSchedule,
  RotationTrainingSession,
  StationWorkout,
  RotationSessionContext,
  RotationGroup,
  WorkoutStation
} from '../types/rotation.types';

import type {
  IntervalProgram,
  WorkoutEquipmentType
} from '../types/conditioning.types';

export interface TrainingSessionData {
  id: string;
  title: string;
  type: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY' | 'ROTATION';
  scheduledDate: Date;
  location: string;
  teamId: string;
  playerIds: string[];
  createdBy: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  duration?: number;
  
  // Rotation-specific fields
  rotationContext?: RotationSessionContext;
  
  // Workout-specific data based on station type
  intervalProgram?: IntervalProgram;
  hybridProgram?: any;
  agilityProgram?: any;
  strengthProgram?: any;
}

/**
 * Convert a station workout to a TrainingSessionViewer-compatible session
 */
export const stationWorkoutToTrainingSession = (
  rotationSession: RotationTrainingSession,
  station: WorkoutStation,
  location: string = 'Training Center',
  createdBy: string = 'system'
): TrainingSessionData => {
  const baseSession: TrainingSessionData = {
    id: rotationSession.id,
    title: `${station.name} - Station ${station.name}`,
    type: 'ROTATION',
    scheduledDate: rotationSession.startTime || new Date(),
    location,
    teamId: `rotation-${rotationSession.rotationContext.rotationScheduleId}`,
    playerIds: rotationSession.assignedPlayers,
    createdBy,
    status: rotationSession.status,
    duration: rotationSession.duration,
    rotationContext: rotationSession.rotationContext
  };

  // Convert station workout based on its type
  switch (rotationSession.stationWorkout.type) {
    case 'intervals':
      const intervalData = rotationSession.stationWorkout.data as IntervalProgram;
      return {
        ...baseSession,
        type: 'CONDITIONING',
        intervalProgram: intervalData
      };

    case 'strength':
      const strengthData = rotationSession.stationWorkout.data;
      return {
        ...baseSession,
        type: 'STRENGTH',
        strengthProgram: strengthData
      };

    case 'freeform':
      const freeformData = rotationSession.stationWorkout.data;
      return {
        ...baseSession,
        type: 'HYBRID', // Treat freeform as hybrid for flexibility
        hybridProgram: {
          id: `freeform-${rotationSession.id}`,
          name: freeformData.name,
          description: freeformData.description,
          blocks: [{
            id: `block-${rotationSession.id}`,
            type: 'freeform',
            name: freeformData.name,
            duration: freeformData.duration,
            instructions: freeformData.instructions,
            position: 0
          }],
          totalDuration: freeformData.duration,
          totalExercises: 0,
          totalIntervals: 0,
          estimatedCalories: 0,
          equipment: [station.equipment]
        }
      };

    case 'rest':
      const restData = rotationSession.stationWorkout.data;
      return {
        ...baseSession,
        type: 'HYBRID',
        hybridProgram: {
          id: `rest-${rotationSession.id}`,
          name: restData.name,
          description: restData.description,
          blocks: [{
            id: `rest-block-${rotationSession.id}`,
            type: 'rest',
            name: restData.name,
            duration: restData.duration,
            instructions: [restData.description],
            position: 0
          }],
          totalDuration: restData.duration,
          totalExercises: 0,
          totalIntervals: 0,
          estimatedCalories: 0,
          equipment: []
        }
      };

    default:
      return baseSession;
  }
};

/**
 * Create multiple training sessions from a rotation schedule for a specific rotation index
 */
export const createRotationTrainingSessions = (
  schedule: RotationSchedule,
  rotationIndex: number,
  location: string = 'Training Center',
  createdBy: string = 'system'
): TrainingSessionData[] => {
  const sessions: TrainingSessionData[] = [];

  schedule.groups.forEach(group => {
    // Calculate which station this group should be at for this rotation
    const stationIndex = (group.rotationOrder.indexOf(group.startingStation!) + rotationIndex) % group.rotationOrder.length;
    const currentStationId = group.rotationOrder[stationIndex];
    const station = schedule.stations.find(s => s.id === currentStationId);

    if (!station) return;

    // Create rotation training session
    const rotationSession: RotationTrainingSession = {
      id: `rotation-${schedule.id}-${rotationIndex}-${group.id}-${currentStationId}`,
      rotationContext: {
        rotationScheduleId: schedule.id,
        stationId: currentStationId,
        groupId: group.id,
        rotationIndex,
        isRotationSession: true,
        nextStation: group.rotationOrder[(stationIndex + 1) % group.rotationOrder.length],
        previousStation: group.rotationOrder[stationIndex === 0 ? group.rotationOrder.length - 1 : stationIndex - 1],
        timeUntilRotation: schedule.rotationDuration * 60
      },
      stationWorkout: station.workout,
      assignedPlayers: group.players.map(p => p.id),
      status: 'pending',
      duration: schedule.rotationDuration * 60
    };

    // Convert to training session
    const trainingSession = stationWorkoutToTrainingSession(
      rotationSession,
      station,
      location,
      createdBy
    );

    sessions.push(trainingSession);
  });

  return sessions;
};

/**
 * Calculate transition timing for rotation schedule
 */
export const calculateRotationTiming = (schedule: RotationSchedule) => {
  const totalRotations = schedule.rotationOrder.length;
  const rotationDurationMs = schedule.rotationDuration * 60 * 1000;
  const transitionDurationMs = schedule.transitionTime * 60 * 1000;
  
  const rotationTimes: Array<{ start: Date; end: Date; transitionEnd: Date }> = [];
  let currentTime = schedule.startTime;

  for (let i = 0; i < totalRotations; i++) {
    const rotationStart = new Date(currentTime);
    const rotationEnd = new Date(currentTime.getTime() + rotationDurationMs);
    const transitionEnd = new Date(rotationEnd.getTime() + transitionDurationMs);

    rotationTimes.push({
      start: rotationStart,
      end: rotationEnd,
      transitionEnd
    });

    currentTime = transitionEnd;
  }

  return {
    rotationTimes,
    totalDuration: rotationTimes[rotationTimes.length - 1].transitionEnd.getTime() - schedule.startTime.getTime(),
    estimatedEndTime: rotationTimes[rotationTimes.length - 1].transitionEnd
  };
};

/**
 * Get group movements for a rotation transition
 */
export const calculateGroupMovements = (
  schedule: RotationSchedule,
  fromRotation: number,
  toRotation: number
): Array<{
  groupId: string;
  groupName: string;
  fromStation: string;
  toStation: string;
  fromStationName: string;
  toStationName: string;
}> => {
  const movements: Array<{
    groupId: string;
    groupName: string;
    fromStation: string;
    toStation: string;
    fromStationName: string;
    toStationName: string;
  }> = [];

  schedule.groups.forEach(group => {
    const fromIndex = (group.rotationOrder.indexOf(group.startingStation!) + fromRotation) % group.rotationOrder.length;
    const toIndex = (group.rotationOrder.indexOf(group.startingStation!) + toRotation) % group.rotationOrder.length;
    
    const fromStationId = group.rotationOrder[fromIndex];
    const toStationId = group.rotationOrder[toIndex];
    
    const fromStation = schedule.stations.find(s => s.id === fromStationId);
    const toStation = schedule.stations.find(s => s.id === toStationId);

    if (fromStation && toStation) {
      movements.push({
        groupId: group.id,
        groupName: group.name,
        fromStation: fromStationId,
        toStation: toStationId,
        fromStationName: fromStation.name,
        toStationName: toStation.name
      });
    }
  });

  return movements;
};

/**
 * Validate that a rotation schedule can be properly converted to training sessions
 */
export const validateRotationSchedule = (schedule: RotationSchedule): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that all groups have valid starting stations
  schedule.groups.forEach(group => {   
    if (!group.startingStation) {
      errors.push(`Group "${group.name}" has no starting station assigned`);
    } else if (!schedule.stations.find(s => s.id === group.startingStation)) {
      errors.push(`Group "${group.name}" starting station "${group.startingStation}" not found in stations`);
    }

    // Check rotation order
    if (group.rotationOrder.length === 0) {
      errors.push(`Group "${group.name}" has no rotation order defined`);
    } else {
      group.rotationOrder.forEach(stationId => {
        if (!schedule.stations.find(s => s.id === stationId)) {
          errors.push(`Group "${group.name}" rotation order references unknown station "${stationId}"`);
        }
      });
    }

    // Check for empty groups
    if (group.players.length === 0) {
      warnings.push(`Group "${group.name}" has no players assigned`);
    }
  });

  // Check that all stations have valid workouts
  schedule.stations.forEach(station => {
    if (!station.workout) {
      errors.push(`Station "${station.name}" has no workout defined`);
    } else {
      // Validate workout data based on type
      switch (station.workout.type) {
        case 'intervals':
          if (!station.workout.data || !Array.isArray((station.workout.data as any).intervals)) {
            errors.push(`Station "${station.name}" has invalid interval program`);
          }
          break;
        case 'strength':
          if (!station.workout.data || !Array.isArray((station.workout.data as any).exercises)) {
            errors.push(`Station "${station.name}" has invalid strength program`);
          }
          break;
        case 'freeform':
          if (!station.workout.data || !(station.workout.data as any).name) {
            errors.push(`Station "${station.name}" has invalid freeform workout`);
          }
          break;
        case 'rest':
          if (!station.workout.data || !(station.workout.data as any).type) {
            errors.push(`Station "${station.name}" has invalid rest activity`);
          }
          break;
      }
    }

    // Check capacity vs group sizes
    const groupsUsingStation = schedule.groups.filter(g => 
      g.rotationOrder.includes(station.id)
    );
    
    groupsUsingStation.forEach(group => {
      if (group.players.length > station.capacity) {
        warnings.push(`Station "${station.name}" capacity (${station.capacity}) is less than group "${group.name}" size (${group.players.length})`);
      }
    });
  });

  // Check timing
  if (schedule.rotationDuration <= 0) {
    errors.push('Rotation duration must be greater than 0');
  }

  if (schedule.transitionTime < 0) {
    errors.push('Transition time cannot be negative');
  }

  if (schedule.transitionTime > schedule.rotationDuration) {
    warnings.push('Transition time is longer than rotation duration');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Create mock training session data for testing rotation integration
 */
export const createMockRotationSessions = (): TrainingSessionData[] => {
  return [
    {
      id: 'rotation-demo-1',
      title: 'Station 1: Rowing Intervals',
      type: 'CONDITIONING',
      scheduledDate: new Date(),
      location: 'Training Center',
      teamId: 'rotation-demo',
      playerIds: ['player-1', 'player-2', 'player-3'],
      createdBy: 'trainer-1',
      status: 'active',
      duration: 900, // 15 minutes
      rotationContext: {
        rotationScheduleId: 'demo-rotation',
        stationId: 'station-1',
        groupId: 'group-1',
        rotationIndex: 0,
        isRotationSession: true,
        nextStation: 'station-2',
        timeUntilRotation: 900
      },
      intervalProgram: {
        id: 'rowing-intervals',
        name: 'Rowing Station',
        description: '15-minute rowing intervals',
        equipment: 'rowing' as WorkoutEquipmentType,
        intervals: [
          { phase: 'work', duration: 240, intensity: 80, targetHR: 160 },
          { phase: 'rest', duration: 120, intensity: 50, targetHR: 120 },
          { phase: 'work', duration: 240, intensity: 85, targetHR: 165 },
          { phase: 'rest', duration: 120, intensity: 50, targetHR: 120 },
          { phase: 'work', duration: 180, intensity: 90, targetHR: 170 }
        ],
        totalDuration: 900,
        estimatedCalories: 180,
        targetZones: {
          zone1: { min: 100, max: 130 },
          zone2: { min: 130, max: 150 },
          zone3: { min: 150, max: 170 },
          zone4: { min: 170, max: 185 },
          zone5: { min: 185, max: 200 }
        },
        tags: ['cardio', 'intervals', 'rotation'],
        difficulty: 'intermediate'
      }
    },
    {
      id: 'rotation-demo-2',
      title: 'Station 2: Bike Erg Endurance',
      type: 'CONDITIONING',
      scheduledDate: new Date(),
      location: 'Training Center',
      teamId: 'rotation-demo',
      playerIds: ['player-4', 'player-5', 'player-6'],
      createdBy: 'trainer-1',
      status: 'active',
      duration: 900,
      rotationContext: {
        rotationScheduleId: 'demo-rotation',
        stationId: 'station-2',
        groupId: 'group-2',
        rotationIndex: 0,
        isRotationSession: true,
        nextStation: 'station-3',
        timeUntilRotation: 900
      },
      intervalProgram: {
        id: 'bike-endurance',
        name: 'Bike Erg Station',
        description: '15-minute bike endurance',
        equipment: 'bike_erg' as WorkoutEquipmentType,
        intervals: [
          { phase: 'work', duration: 900, intensity: 70, targetHR: 150, targetWatts: 200 }
        ],
        totalDuration: 900,
        estimatedCalories: 200,
        targetZones: {
          zone1: { min: 100, max: 130 },
          zone2: { min: 130, max: 150 },
          zone3: { min: 150, max: 170 },
          zone4: { min: 170, max: 185 },
          zone5: { min: 185, max: 200 }
        },
        tags: ['cardio', 'endurance', 'rotation'],
        difficulty: 'intermediate'
      }
    }
  ];
};