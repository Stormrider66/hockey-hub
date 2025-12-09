import { Player, Team } from '../types';
import { WorkoutSession, WorkoutType } from '../types/session.types';

// Assignment interfaces
export interface AssignmentSummary {
  totalPlayers: number;
  directAssignments: number;
  teamAssignments: number;
  teams: string[];
  playerNames: string[];
  hasConflicts: boolean;
  conflictDetails: ScheduleConflict[];
}

export interface ScheduleConflict {
  playerId: string;
  playerName: string;
  conflictType: 'game' | 'practice' | 'training' | 'medical';
  eventTitle: string;
  eventTime: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WorkoutDefaults {
  name: string;
  duration: number;
  description?: string;
  intensity: 'low' | 'medium' | 'high';
  equipment: string[];
}

// Player assignment calculation
export function calculateAffectedPlayers(
  assignedPlayers: Player[],
  assignedTeams: Team[],
  allPlayers: Player[]
): Player[] {
  const playerSet = new Set<string>();
  const result: Player[] = [];
  
  // Add directly assigned players
  assignedPlayers.forEach(player => {
    if (!playerSet.has(player.id)) {
      playerSet.add(player.id);
      result.push(player);
    }
  });
  
  // Add players from assigned teams
  assignedTeams.forEach(team => {
    const teamPlayers = allPlayers.filter(player => 
      player.teamIds?.includes(team.id)
    );
    
    teamPlayers.forEach(player => {
      if (!playerSet.has(player.id)) {
        playerSet.add(player.id);
        result.push(player);
      }
    });
  });
  
  return result;
}

export function formatPlayerSummary(
  assignedPlayers: Player[],
  assignedTeams: Team[],
  allPlayers: Player[]
): AssignmentSummary {
  const affectedPlayers = calculateAffectedPlayers(assignedPlayers, assignedTeams, allPlayers);
  
  // Get players only from teams (not directly assigned)
  const teamPlayerIds = new Set<string>();
  assignedTeams.forEach(team => {
    const teamPlayers = allPlayers.filter(player => 
      player.teamIds?.includes(team.id)
    );
    teamPlayers.forEach(player => teamPlayerIds.add(player.id));
  });
  
  const directPlayerIds = new Set(assignedPlayers.map(p => p.id));
  const onlyFromTeams = Array.from(teamPlayerIds).filter(id => !directPlayerIds.has(id));
  
  return {
    totalPlayers: affectedPlayers.length,
    directAssignments: assignedPlayers.length,
    teamAssignments: onlyFromTeams.length,
    teams: assignedTeams.map(team => team.name),
    playerNames: affectedPlayers.map(player => player.name).sort(),
    hasConflicts: false, // Will be updated by checkScheduleConflicts
    conflictDetails: []
  };
}

// Schedule conflict detection
export async function checkScheduleConflicts(
  players: Player[],
  sessionDate: Date,
  sessionDuration: number = 60,
  getPlayerSchedule?: (playerId: string, date: Date) => Promise<any[]>
): Promise<ScheduleConflict[]> {
  if (!getPlayerSchedule) return [];
  
  const conflicts: ScheduleConflict[] = [];
  const sessionStart = new Date(sessionDate);
  const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000);
  
  for (const player of players) {
    try {
      const schedule = await getPlayerSchedule(player.id, sessionDate);
      
      for (const event of schedule) {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Check for time overlap
        if (isTimeOverlap(sessionStart, sessionEnd, eventStart, eventEnd)) {
          conflicts.push({
            playerId: player.id,
            playerName: player.name,
            conflictType: mapEventTypeToConflictType(event.type),
            eventTitle: event.title,
            eventTime: formatEventTime(eventStart, eventEnd),
            severity: calculateConflictSeverity(event.type, event.priority)
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to check schedule for player ${player.name}:`, error);
    }
  }
  
  return conflicts;
}

// Workout defaults generation
export function generateWorkoutDefaults(
  type: WorkoutType,
  teamLevel?: 'youth' | 'junior' | 'senior' | 'professional',
  season?: 'preseason' | 'regular' | 'playoffs' | 'offseason'
): WorkoutDefaults {
  const baseDefaults = getBaseWorkoutDefaults(type);
  
  // Adjust for team level
  const levelAdjustments = getLevelAdjustments(teamLevel);
  
  // Adjust for season
  const seasonAdjustments = getSeasonAdjustments(season);
  
  return {
    ...baseDefaults,
    duration: Math.round(baseDefaults.duration * levelAdjustments.durationMultiplier * seasonAdjustments.durationMultiplier),
    intensity: adjustIntensity(baseDefaults.intensity, levelAdjustments.intensityModifier, seasonAdjustments.intensityModifier),
    equipment: [...baseDefaults.equipment, ...levelAdjustments.additionalEquipment, ...seasonAdjustments.additionalEquipment]
  };
}

export function generateSessionName(
  type: WorkoutType,
  date: Date,
  teamNames: string[] = [],
  customSuffix?: string
): string {
  const typeNames = {
    [WorkoutType.STRENGTH]: 'Strength Training',
    [WorkoutType.CONDITIONING]: 'Conditioning',
    [WorkoutType.HYBRID]: 'Hybrid Training',
    [WorkoutType.AGILITY]: 'Agility Training'
  };
  
  const baseName = typeNames[type];
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  let name = `${baseName} - ${dateStr}`;
  
  if (teamNames.length > 0) {
    if (teamNames.length === 1) {
      name += ` (${teamNames[0]})`;
    } else if (teamNames.length <= 3) {
      name += ` (${teamNames.join(', ')})`;
    } else {
      name += ` (${teamNames.length} teams)`;
    }
  }
  
  if (customSuffix) {
    name += ` - ${customSuffix}`;
  }
  
  return name;
}

// Player grouping utilities
export function groupPlayersByPosition(players: Player[]): Record<string, Player[]> {
  return players.reduce((groups, player) => {
    const position = player.position || 'Unknown';
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(player);
    return groups;
  }, {} as Record<string, Player[]>);
}

export function groupPlayersByTeam(players: Player[], teams: Team[]): Record<string, Player[]> {
  const teamMap = teams.reduce((map, team) => {
    map[team.id] = team.name;
    return map;
  }, {} as Record<string, string>);
  
  return players.reduce((groups, player) => {
    if (player.teamIds && player.teamIds.length > 0) {
      player.teamIds.forEach(teamId => {
        const teamName = teamMap[teamId] || 'Unknown Team';
        if (!groups[teamName]) {
          groups[teamName] = [];
        }
        groups[teamName].push(player);
      });
    } else {
      if (!groups['No Team']) {
        groups['No Team'] = [];
      }
      groups['No Team'].push(player);
    }
    return groups;
  }, {} as Record<string, Player[]>);
}

// Assignment validation helpers
export function validatePlayerEligibility(
  player: Player,
  workoutType: WorkoutType,
  medicalRestrictions?: any[]
): { eligible: boolean; reason?: string } {
  // Check age restrictions for certain workout types
  if (workoutType === WorkoutType.STRENGTH && player.age && player.age < 14) {
    return {
      eligible: false,
      reason: 'Player must be at least 14 years old for strength training'
    };
  }
  
  // Check medical restrictions
  if (medicalRestrictions && medicalRestrictions.length > 0) {
    const hasBlockingRestriction = medicalRestrictions.some(restriction => 
      restriction.severity === 'high' && isWorkoutTypeAffected(workoutType, restriction)
    );
    
    if (hasBlockingRestriction) {
      return {
        eligible: false,
        reason: 'Player has medical restrictions for this workout type'
      };
    }
  }
  
  return { eligible: true };
}

// Helper functions
function isTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

function mapEventTypeToConflictType(eventType: string): ScheduleConflict['conflictType'] {
  switch (eventType) {
    case 'game':
    case 'match':
      return 'game';
    case 'practice':
    case 'training':
      return 'practice';
    case 'physical-training':
    case 'workout':
      return 'training';
    case 'medical':
    case 'therapy':
      return 'medical';
    default:
      return 'practice';
  }
}

function formatEventTime(start: Date, end: Date): string {
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  const endTime = end.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  return `${startTime} - ${endTime}`;
}

function calculateConflictSeverity(
  eventType: string,
  priority?: 'low' | 'medium' | 'high'
): ScheduleConflict['severity'] {
  if (eventType === 'game' || eventType === 'match') return 'high';
  if (eventType === 'medical') return 'high';
  if (priority) return priority;
  return 'medium';
}

function getBaseWorkoutDefaults(type: WorkoutType): WorkoutDefaults {
  switch (type) {
    case WorkoutType.STRENGTH:
      return {
        name: 'Strength Training',
        duration: 60,
        description: 'Full body strength training session',
        intensity: 'medium',
        equipment: ['barbell', 'dumbbells', 'bench']
      };
    case WorkoutType.CONDITIONING:
      return {
        name: 'Conditioning Session',
        duration: 45,
        description: 'Cardiovascular conditioning workout',
        intensity: 'high',
        equipment: ['bike', 'treadmill']
      };
    case WorkoutType.HYBRID:
      return {
        name: 'Hybrid Training',
        duration: 75,
        description: 'Combined strength and conditioning',
        intensity: 'medium',
        equipment: ['dumbbells', 'bike', 'kettlebells']
      };
    case WorkoutType.AGILITY:
      return {
        name: 'Agility Training',
        duration: 30,
        description: 'Speed and agility drills',
        intensity: 'high',
        equipment: ['cones', 'ladder', 'hurdles']
      };
    default:
      return {
        name: 'Training Session',
        duration: 60,
        intensity: 'medium',
        equipment: []
      };
  }
}

function getLevelAdjustments(level?: string) {
  switch (level) {
    case 'youth':
      return {
        durationMultiplier: 0.7,
        intensityModifier: -1,
        additionalEquipment: ['resistance_bands']
      };
    case 'junior':
      return {
        durationMultiplier: 0.85,
        intensityModifier: 0,
        additionalEquipment: []
      };
    case 'senior':
      return {
        durationMultiplier: 1.0,
        intensityModifier: 0,
        additionalEquipment: []
      };
    case 'professional':
      return {
        durationMultiplier: 1.2,
        intensityModifier: 1,
        additionalEquipment: ['heart_rate_monitor', 'power_meter']
      };
    default:
      return {
        durationMultiplier: 1.0,
        intensityModifier: 0,
        additionalEquipment: []
      };
  }
}

function getSeasonAdjustments(season?: string) {
  switch (season) {
    case 'preseason':
      return {
        durationMultiplier: 1.1,
        intensityModifier: 1,
        additionalEquipment: ['foam_roller']
      };
    case 'regular':
      return {
        durationMultiplier: 1.0,
        intensityModifier: 0,
        additionalEquipment: []
      };
    case 'playoffs':
      return {
        durationMultiplier: 0.9,
        intensityModifier: -1,
        additionalEquipment: ['recovery_tools']
      };
    case 'offseason':
      return {
        durationMultiplier: 1.2,
        intensityModifier: 1,
        additionalEquipment: ['variety_equipment']
      };
    default:
      return {
        durationMultiplier: 1.0,
        intensityModifier: 0,
        additionalEquipment: []
      };
  }
}

function adjustIntensity(
  baseIntensity: 'low' | 'medium' | 'high',
  ...modifiers: number[]
): 'low' | 'medium' | 'high' {
  const intensityMap = { low: 1, medium: 2, high: 3 };
  const reverseMap = { 1: 'low', 2: 'medium', 3: 'high' } as const;
  
  let level = intensityMap[baseIntensity];
  modifiers.forEach(modifier => {
    level += modifier;
  });
  
  // Clamp to valid range
  level = Math.max(1, Math.min(3, level));
  
  return reverseMap[level as keyof typeof reverseMap];
}

function isWorkoutTypeAffected(
  workoutType: WorkoutType,
  restriction: any
): boolean {
  // Simplified mapping - in a real app, this would be more sophisticated
  switch (restriction.type) {
    case 'cardiovascular':
      return workoutType === WorkoutType.CONDITIONING;
    case 'strength':
      return workoutType === WorkoutType.STRENGTH;
    case 'mobility':
      return workoutType === WorkoutType.AGILITY;
    case 'intensity':
      return restriction.maxIntensity === 'low';
    default:
      return false;
  }
}