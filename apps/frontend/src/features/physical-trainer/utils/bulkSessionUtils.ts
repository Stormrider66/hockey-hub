/**
 * Bulk Session Utilities
 * 
 * Reusable utility functions for bulk session operations that can be used
 * across different workout types and components.
 */

import type { WorkoutEquipmentType } from '../types/conditioning.types';
import type { 
  BulkSessionConfig, 
  SessionConfiguration, 
  EquipmentAvailability 
} from '../hooks/useBulkSession';

// ===============================
// Session Duplication Logic
// ===============================

/**
 * Creates a deep copy of a workout session with new IDs and optional modifications
 */
export const duplicateSession = <TWorkout = any>(
  sourceSession: SessionConfiguration<TWorkout>,
  index: number,
  modifications: Partial<SessionConfiguration<TWorkout>> = {}
): SessionConfiguration<TWorkout> => {
  return {
    ...sourceSession,
    id: `${sourceSession.id}-copy-${index}-${Date.now()}`,
    name: `${sourceSession.name} (Copy ${index + 1})`,
    workoutData: sourceSession.workoutData ? 
      JSON.parse(JSON.stringify(sourceSession.workoutData)) : 
      undefined,
    ...modifications
  };
};

/**
 * Creates multiple duplicates of a base session
 */
export const createSessionDuplicates = <TWorkout = any>(
  baseSession: SessionConfiguration<TWorkout>,
  count: number,
  namePattern: string = '{name} {index}',
  customizations: ((session: SessionConfiguration<TWorkout>, index: number) => Partial<SessionConfiguration<TWorkout>>)[] = []
): SessionConfiguration<TWorkout>[] => {
  return Array.from({ length: count }, (_, index) => {
    const sessionName = namePattern
      .replace('{name}', baseSession.name)
      .replace('{index}', (index + 1).toString());

    const customization = customizations[index] || (() => ({}));
    
    return duplicateSession(baseSession, index, {
      name: sessionName,
      ...customization(baseSession, index)
    });
  });
};

// ===============================
// Equipment Allocation Logic
// ===============================

/**
 * Analyzes equipment usage across sessions and identifies conflicts
 */
export const analyzeEquipmentUsage = (
  sessions: SessionConfiguration[],
  availableEquipment: EquipmentAvailability[]
): {
  usage: Map<WorkoutEquipmentType, number>;
  conflicts: { equipment: WorkoutEquipmentType; needed: number; available: number }[];
  recommendations: string[];
} => {
  const usage = new Map<WorkoutEquipmentType, number>();
  const conflicts: { equipment: WorkoutEquipmentType; needed: number; available: number }[] = [];
  const recommendations: string[] = [];

  // Count equipment usage
  sessions.forEach(session => {
    session.equipment?.forEach(equipment => {
      usage.set(equipment, (usage.get(equipment) || 0) + 1);
    });
  });

  // Identify conflicts
  usage.forEach((needed, equipment) => {
    const available = availableEquipment.find(eq => eq.type === equipment)?.available || 0;
    if (needed > available) {
      conflicts.push({ equipment, needed, available });
    }
  });

  // Generate recommendations
  if (conflicts.length > 0) {
    recommendations.push('Consider staggering session start times to reduce equipment conflicts');
    recommendations.push('Ensure equipment reservations are updated before session start');
    
    if (conflicts.some(c => c.needed > c.available * 2)) {
      recommendations.push('Some equipment conflicts are severe - consider alternative exercises');
    }
  }

  return { usage, conflicts, recommendations };
};

/**
 * Automatically allocates equipment to minimize conflicts
 */
export const optimizeEquipmentAllocation = (
  sessions: SessionConfiguration[],
  availableEquipment: EquipmentAvailability[],
  priorityOrder: WorkoutEquipmentType[] = []
): SessionConfiguration[] => {
  const equipmentCounts = new Map<WorkoutEquipmentType, number>();
  const optimizedSessions = [...sessions];

  // Initialize equipment tracking
  availableEquipment.forEach(eq => {
    equipmentCounts.set(eq.type, eq.available);
  });

  // Sort sessions by priority (sessions with fewer equipment options first)
  optimizedSessions.sort((a, b) => {
    const aCount = a.equipment?.length || 0;
    const bCount = b.equipment?.length || 0;
    return aCount - bCount;
  });

  // Allocate equipment optimally
  optimizedSessions.forEach(session => {
    if (!session.equipment) return;

    const sortedEquipment = [...session.equipment].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a);
      const bPriority = priorityOrder.indexOf(b);
      const aCount = equipmentCounts.get(a) || 0;
      const bCount = equipmentCounts.get(b) || 0;

      // Prioritize by custom order first, then by availability
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      return bCount - aCount; // More available equipment first
    });

    // Update equipment counts
    sortedEquipment.forEach(equipment => {
      const current = equipmentCounts.get(equipment) || 0;
      equipmentCounts.set(equipment, Math.max(0, current - 1));
    });

    session.equipment = sortedEquipment;
  });

  return optimizedSessions;
};

// ===============================
// Player Distribution Logic
// ===============================

/**
 * Distributes players evenly across sessions
 */
export const distributePlayersEvenly = (
  sessions: SessionConfiguration[],
  allPlayerIds: string[],
  maxPlayersPerSession?: number
): SessionConfiguration[] => {
  const playersPerSession = maxPlayersPerSession || 
    Math.ceil(allPlayerIds.length / sessions.length);
  
  return sessions.map((session, index) => {
    const startIndex = index * playersPerSession;
    const endIndex = Math.min(startIndex + playersPerSession, allPlayerIds.length);
    
    return {
      ...session,
      playerIds: allPlayerIds.slice(startIndex, endIndex)
    };
  });
};

/**
 * Distributes players by team affiliation
 */
export const distributePlayersByTeam = (
  sessions: SessionConfiguration[],
  playersByTeam: Record<string, string[]>,
  strategy: 'keep-teams-together' | 'mix-teams' = 'keep-teams-together'
): SessionConfiguration[] => {
  const teams = Object.keys(playersByTeam);
  
  if (strategy === 'keep-teams-together') {
    // Assign entire teams to sessions
    return sessions.map((session, index) => {
      const assignedTeams = teams.filter((_, teamIndex) => 
        teamIndex % sessions.length === index
      );
      
      return {
        ...session,
        teamIds: assignedTeams,
        playerIds: assignedTeams.flatMap(teamId => playersByTeam[teamId] || [])
      };
    });
  } else {
    // Mix players from different teams
    const allPlayers = Object.values(playersByTeam).flat();
    return distributePlayersEvenly(sessions, allPlayers);
  }
};

/**
 * Balances sessions based on player skill levels or other criteria
 */
export const balanceSessionsByPlayerCriteria = <TCriteria = any>(
  sessions: SessionConfiguration[],
  playerCriteria: Record<string, TCriteria>,
  compareFn: (a: TCriteria, b: TCriteria) => number
): SessionConfiguration[] => {
  const allPlayerIds = sessions.flatMap(s => s.playerIds);
  
  // Sort players by criteria
  const sortedPlayers = allPlayerIds.sort((a, b) => {
    const aCriteria = playerCriteria[a];
    const bCriteria = playerCriteria[b];
    return compareFn(aCriteria, bCriteria);
  });

  // Distribute players in round-robin fashion for balance
  const balancedSessions = sessions.map(s => ({ ...s, playerIds: [] }));
  
  sortedPlayers.forEach((playerId, index) => {
    const sessionIndex = index % sessions.length;
    balancedSessions[sessionIndex].playerIds.push(playerId);
  });

  return balancedSessions;
};

// ===============================
// Time Management Logic
// ===============================

/**
 * Calculates staggered start times for sessions
 */
export const calculateStaggeredTimes = (
  baseTime: string,
  sessionCount: number,
  intervalMinutes: number
): string[] => {
  const [hours, minutes] = baseTime.split(':').map(Number);
  const baseMinutes = hours * 60 + minutes;

  return Array.from({ length: sessionCount }, (_, index) => {
    const totalMinutes = baseMinutes + (index * intervalMinutes);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  });
};

/**
 * Validates that all sessions fit within facility operating hours
 */
export const validateSessionTiming = (
  sessions: SessionConfiguration[],
  duration: number,
  facilityHours: { open: string; close: string }
): {
  valid: boolean;
  conflicts: { sessionId: string; reason: string }[];
  suggestions: string[];
} => {
  const conflicts: { sessionId: string; reason: string }[] = [];
  const suggestions: string[] = [];

  const [openHour, openMin] = facilityHours.open.split(':').map(Number);
  const [closeHour, closeMin] = facilityHours.close.split(':').map(Number);
  const facilityOpenMinutes = openHour * 60 + openMin;
  const facilityCloseMinutes = closeHour * 60 + closeMin;

  sessions.forEach(session => {
    const startTime = session.startTime || '00:00';
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + duration;

    if (startMinutes < facilityOpenMinutes) {
      conflicts.push({
        sessionId: session.id,
        reason: `Session starts before facility opens (${facilityHours.open})`
      });
    }

    if (endMinutes > facilityCloseMinutes) {
      conflicts.push({
        sessionId: session.id,
        reason: `Session ends after facility closes (${facilityHours.close})`
      });
    }
  });

  if (conflicts.length > 0) {
    suggestions.push('Adjust start times to fit within facility operating hours');
    suggestions.push('Consider reducing session duration');
    suggestions.push('Split sessions across multiple days');
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    suggestions
  };
};

// ===============================
// Configuration Validation
// ===============================

/**
 * Validates bulk session configuration for any workout type
 */
export const validateBulkConfiguration = <TWorkout = any>(
  config: BulkSessionConfig<TWorkout>,
  availableEquipment: EquipmentAvailability[] = [],
  facilityConstraints?: {
    maxCapacity: number;
    operatingHours: { open: string; close: string };
  }
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic validation
  if (config.numberOfSessions < 2) {
    errors.push('Minimum 2 sessions required for bulk operations');
  }

  if (config.numberOfSessions > 8) {
    errors.push('Maximum 8 sessions allowed');
  }

  if (config.duration < 15) {
    errors.push('Session duration must be at least 15 minutes');
  }

  if (config.duration > 180) {
    errors.push('Session duration cannot exceed 3 hours');
  }

  // Session-specific validation
  config.sessions.forEach((session, index) => {
    if (!session.name.trim()) {
      errors.push(`Session ${index + 1}: Name cannot be empty`);
    }

    if (session.playerIds.length === 0 && session.teamIds.length === 0) {
      errors.push(`Session ${index + 1}: Must have at least one participant`);
    }

    // Equipment validation for applicable workout types
    if (config.workoutType === 'conditioning' || config.workoutType === 'hybrid') {
      if (!session.equipment || session.equipment.length === 0) {
        errors.push(`Session ${index + 1}: Must select at least one equipment type`);
      }
    }
  });

  // Equipment conflict analysis
  if (!config.allowEquipmentConflicts && availableEquipment.length > 0) {
    const { conflicts } = analyzeEquipmentUsage(config.sessions, availableEquipment);
    conflicts.forEach(conflict => {
      errors.push(
        `${conflict.equipment}: ${conflict.needed} sessions require this equipment but only ${conflict.available} available`
      );
    });
  }

  // Facility constraints
  if (facilityConstraints) {
    const totalParticipants = config.sessions.reduce(
      (total, session) => total + session.playerIds.length, 0
    );

    if (totalParticipants > facilityConstraints.maxCapacity) {
      errors.push(
        `Total participants (${totalParticipants}) exceed facility capacity (${facilityConstraints.maxCapacity})`
      );
    }

    const timingValidation = validateSessionTiming(
      config.sessions,
      config.duration,
      facilityConstraints.operatingHours
    );

    if (!timingValidation.valid) {
      timingValidation.conflicts.forEach(conflict => {
        errors.push(conflict.reason);
      });
      suggestions.push(...timingValidation.suggestions);
    }
  }

  // Warnings and suggestions
  if (config.staggerStartTimes && config.staggerInterval < 10) {
    warnings.push('Short stagger intervals may not provide sufficient setup time between sessions');
  }

  const avgPlayersPerSession = config.sessions.reduce(
    (total, session) => total + session.playerIds.length, 0
  ) / config.sessions.length;

  if (avgPlayersPerSession > 10) {
    warnings.push('Large session sizes may require additional supervision');
  }

  if (config.sessions.some(session => session.playerIds.length === 0)) {
    suggestions.push('Consider using the auto-distribute feature to balance player assignments');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// ===============================
// Export Default Functions
// ===============================

export const bulkSessionUtils = {
  // Session management
  duplicateSession,
  createSessionDuplicates,
  
  // Equipment management
  analyzeEquipmentUsage,
  optimizeEquipmentAllocation,
  
  // Player management
  distributePlayersEvenly,
  distributePlayersByTeam,
  balanceSessionsByPlayerCriteria,
  
  // Time management
  calculateStaggeredTimes,
  validateSessionTiming,
  
  // Validation
  validateBulkConfiguration
};

export default bulkSessionUtils;