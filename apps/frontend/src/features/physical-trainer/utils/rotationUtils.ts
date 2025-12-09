import type { PlayerData, TeamData } from '../components/shared/TeamPlayerSelector';
import type { WorkoutEquipmentType } from '../types/conditioning.types';

export interface RotationGroup {
  id: string;
  name: string;
  players: PlayerData[];
  startTime: number; // Minutes from session start
  duration: number; // Minutes
  equipment: WorkoutEquipmentType[];
}

export interface RotationSchedule {
  groups: RotationGroup[];
  totalDuration: number;
  rotationsPerGroup: number;
  restBetweenRotations: number;
  strategy: 'parallel' | 'sequential' | 'mixed';
  equipmentUtilization: number; // Percentage
}

export interface RotationOptions {
  maxPlayersPerGroup?: number;
  minPlayersPerGroup?: number;
  rotationDuration?: number; // Minutes per rotation
  restBetweenRotations?: number; // Minutes
  strategy?: 'balance_groups' | 'minimize_time' | 'maximize_equipment_use';
  considerPlayerFitness?: boolean;
  considerPlayerPosition?: boolean;
}

/**
 * Creates rotation groups when player count exceeds equipment capacity
 */
export function createRotationGroups(
  players: PlayerData[],
  teams: TeamData[],
  selectedPlayerIds: string[],
  selectedTeamIds: string[],
  equipmentCapacity: number,
  equipmentType: WorkoutEquipmentType,
  options: RotationOptions = {}
): RotationSchedule {
  const {
    rotationDuration = 20,
    restBetweenRotations = 2,
    strategy = 'balance_groups',
    considerPlayerFitness = true,
    considerPlayerPosition = false
  } = options;

  // Collect all selected players
  const allSelectedPlayers: PlayerData[] = [
    ...selectedPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as PlayerData[],
    ...selectedTeamIds.flatMap(teamId => {
      const team = teams.find(t => t.id === teamId);
      return team?.players || [];
    })
  ];

  // Remove duplicates (in case a player is selected both individually and through team)
  const uniquePlayers = allSelectedPlayers.filter((player, index, array) => 
    array.findIndex(p => p.id === player.id) === index
  );

  if (uniquePlayers.length <= equipmentCapacity) {
    // No rotation needed
    return {
      groups: [{
        id: 'group-1',
        name: 'All Players',
        players: uniquePlayers,
        startTime: 0,
        duration: rotationDuration,
        equipment: [equipmentType]
      }],
      totalDuration: rotationDuration,
      rotationsPerGroup: 1,
      restBetweenRotations,
      strategy: 'parallel',
      equipmentUtilization: (uniquePlayers.length / equipmentCapacity) * 100
    };
  }

  // Create groups based on strategy
  const groups = createGroupsByStrategy(
    uniquePlayers,
    equipmentCapacity,
    strategy,
    considerPlayerFitness,
    considerPlayerPosition
  );

  // Calculate timing for sequential rotations
  const rotationGroups: RotationGroup[] = groups.map((group, index) => ({
    id: `group-${index + 1}`,
    name: `Group ${index + 1}`,
    players: group,
    startTime: index * (rotationDuration + restBetweenRotations),
    duration: rotationDuration,
    equipment: [equipmentType]
  }));

  const totalDuration = groups.length * rotationDuration + (groups.length - 1) * restBetweenRotations;

  return {
    groups: rotationGroups,
    totalDuration,
    rotationsPerGroup: 1,
    restBetweenRotations,
    strategy: 'sequential',
    equipmentUtilization: 100 // Full utilization since we're rotating
  };
}

/**
 * Creates player groups based on the selected strategy
 */
function createGroupsByStrategy(
  players: PlayerData[],
  groupSize: number,
  strategy: RotationOptions['strategy'],
  considerFitness: boolean,
  considerPosition: boolean
): PlayerData[][] {
  const groups: PlayerData[][] = [];
  const sortedPlayers = [...players];

  // Sort players based on considerations
  if (considerFitness) {
    // Sort by fitness level (injured players last, limited players in middle)
    sortedPlayers.sort((a, b) => {
      const getStatusPriority = (status?: string) => {
        switch (status) {
          case 'healthy': return 3;
          case 'limited': return 2;
          case 'injured': return 1;
          case 'unavailable': return 0;
          default: return 3;
        }
      };
      return getStatusPriority(b.wellness?.status) - getStatusPriority(a.wellness?.status);
    });
  }

  if (considerPosition) {
    // Try to balance positions across groups
    const positions = ['Forward', 'Defense', 'Goalie'];
    const playersByPosition = positions.reduce((acc, pos) => {
      acc[pos] = sortedPlayers.filter(p => p.position?.includes(pos));
      return acc;
    }, {} as Record<string, PlayerData[]>);

    // Create balanced groups
    const totalGroups = Math.ceil(sortedPlayers.length / groupSize);
    for (let i = 0; i < totalGroups; i++) {
      groups.push([]);
    }

    // Distribute players by position
    positions.forEach(position => {
      const positionPlayers = playersByPosition[position];
      positionPlayers.forEach((player, index) => {
        const groupIndex = index % totalGroups;
        if (groups[groupIndex].length < groupSize) {
          groups[groupIndex].push(player);
        }
      });
    });

    return groups.filter(group => group.length > 0);
  }

  // Default strategy: simple round-robin distribution
  switch (strategy) {
    case 'minimize_time':
      // Create fewer, larger groups (up to equipment capacity)
      for (let i = 0; i < sortedPlayers.length; i += groupSize) {
        groups.push(sortedPlayers.slice(i, i + groupSize));
      }
      break;

    case 'maximize_equipment_use':
      // Ensure each group uses full equipment capacity
      for (let i = 0; i < sortedPlayers.length; i += groupSize) {
        const group = sortedPlayers.slice(i, i + groupSize);
        if (group.length === groupSize || i + groupSize >= sortedPlayers.length) {
          groups.push(group);
        }
      }
      break;

    case 'balance_groups':
    default:
      // Balance group sizes as evenly as possible
      const totalGroups = Math.ceil(sortedPlayers.length / groupSize);
      const baseSize = Math.floor(sortedPlayers.length / totalGroups);
      const remainder = sortedPlayers.length % totalGroups;

      let playerIndex = 0;
      for (let i = 0; i < totalGroups; i++) {
        const currentGroupSize = baseSize + (i < remainder ? 1 : 0);
        groups.push(sortedPlayers.slice(playerIndex, playerIndex + currentGroupSize));
        playerIndex += currentGroupSize;
      }
      break;
  }

  return groups.filter(group => group.length > 0);
}

/**
 * Calculates optimized session timing including rotations
 */
export function calculateRotationTiming(
  rotationSchedule: RotationSchedule,
  baseWorkoutDuration: number
): {
  totalSessionTime: number;
  workoutTime: number;
  rotationTime: number;
  setupTime: number;
  buffer: number;
} {
  const setupTimePerGroup = 3; // Minutes for equipment setup between groups
  const bufferTime = 5; // Minutes buffer for transitions
  
  const workoutTime = baseWorkoutDuration;
  const rotationTime = rotationSchedule.totalDuration;
  const setupTime = (rotationSchedule.groups.length - 1) * setupTimePerGroup;
  
  return {
    totalSessionTime: workoutTime + rotationTime + setupTime + bufferTime,
    workoutTime,
    rotationTime,
    setupTime,
    buffer: bufferTime
  };
}

/**
 * Generates rotation summary text for display
 */
export function generateRotationSummary(
  rotationSchedule: RotationSchedule,
  timing: ReturnType<typeof calculateRotationTiming>
): string {
  const { groups } = rotationSchedule;
  const totalPlayers = groups.reduce((sum, group) => sum + group.players.length, 0);
  
  if (groups.length === 1) {
    return `${totalPlayers} players • Single session • ${timing.totalSessionTime} minutes total`;
  }

  return `${totalPlayers} players • ${groups.length} rotation groups • ${timing.totalSessionTime} minutes total`;
}

/**
 * Validates rotation configuration
 */
export function validateRotationConfig(
  rotationSchedule: RotationSchedule,
  maxSessionTime: number = 120
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check session time limits
  if (rotationSchedule.totalDuration > maxSessionTime) {
    errors.push(`Total session time (${rotationSchedule.totalDuration}min) exceeds maximum (${maxSessionTime}min)`);
  }

  // Check group sizes
  rotationSchedule.groups.forEach((group, index) => {
    if (group.players.length === 0) {
      errors.push(`Group ${index + 1} has no players assigned`);
    }
    if (group.players.length === 1) {
      warnings.push(`Group ${index + 1} has only one player - consider combining groups`);
    }
  });

  // Check for injured players
  const injuredPlayers = rotationSchedule.groups.flatMap(group => 
    group.players.filter(player => player.wellness?.status === 'injured')
  );
  if (injuredPlayers.length > 0) {
    warnings.push(`${injuredPlayers.length} injured player(s) included - ensure medical clearance`);
  }

  // Check equipment utilization
  if (rotationSchedule.equipmentUtilization < 70) {
    warnings.push(`Low equipment utilization (${rotationSchedule.equipmentUtilization.toFixed(0)}%) - consider larger groups`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Exports rotation schedule to different formats
 */
export function exportRotationSchedule(
  rotationSchedule: RotationSchedule,
  format: 'text' | 'csv' | 'json' = 'text'
): string {
  switch (format) {
    case 'csv':
      const csvRows = [
        'Group,Player Name,Jersey Number,Position,Start Time,Duration',
        ...rotationSchedule.groups.flatMap(group =>
          group.players.map(player =>
            `${group.name},"${player.name}",${player.jerseyNumber || ''},${player.position || ''},${group.startTime},${group.duration}`
          )
        )
      ];
      return csvRows.join('\n');

    case 'json':
      return JSON.stringify(rotationSchedule, null, 2);

    case 'text':
    default:
      return rotationSchedule.groups.map(group => 
        `${group.name} (${group.startTime}min - ${group.startTime + group.duration}min):\n` +
        group.players.map(player => 
          `  • ${player.name}${player.jerseyNumber ? ` (#${player.jerseyNumber})` : ''}${player.position ? ` - ${player.position}` : ''}`
        ).join('\n')
      ).join('\n\n');
  }
}