// Agility Workout Types and Interfaces

export type AgilityDrillCategory = 
  | 'cone_drills' 
  | 'ladder_drills' 
  | 'reaction_drills' 
  | 'change_of_direction' 
  | 'balance_coordination'
  | 'sport_specific'
  | 'conditioning_drills'
  | 'full_body_drills'
  | 'footwork_drills'
  | 'power_drills'
  | 'speed_drills'
  | 'agility_drills'
  | 'rest';

export type AgilityEquipmentType = 
  | 'cones' 
  | 'ladder' 
  | 'hurdles' 
  | 'reaction_ball' 
  | 'poles'
  | 'markers'
  | 'lights'
  | 'none'
  | 'battle_ropes'
  | 'resistance_bands'
  | 'medicine_ball'
  | 'plyo_box'
  // Hockey-specific equipment
  | 'hockey_stick'
  | 'pucks'
  | 'shooting_targets'
  | 'passing_targets'
  | 'shooting_board'
  | 'synthetic_ice'
  | 'hockey_net'
  | 'hockey_pads'
  | 'hockey_pylons';

export type DrillPattern = 
  | 't_drill'
  | 'l_drill'
  | '5_10_5'
  | 'box_drill'
  | 'zig_zag'
  | 'figure_8'
  | 'star_drill'
  | 'hexagon'
  | 'custom'
  // Hockey-specific patterns
  | 'hockey_stop_start'
  | 'breakout_pattern'
  | 'shooting_drill'
  | 'passing_drill'
  | 'deke_pattern'
  | 'edge_work_pattern';

export interface ConePosition {
  id: string;
  x: number; // percentage of grid width
  y: number; // percentage of grid height
  label?: string; // e.g., "A", "B", "C" or "Start", "End"
  color?: string;
}

export interface DrillPath {
  from: string; // cone/position id
  to: string; // cone/position id
  type: 'sprint' | 'shuffle' | 'backpedal' | 'carioca' | 'hop' | 'hockey_stride' | 'crossover' | 'transition' | 'edge_work';
  order: number;
  // Hockey-specific path properties
  withPuck?: boolean;
  action?: 'shoot' | 'pass' | 'deke' | 'receive';
  target?: string; // target position id
}

export interface AgilityDrill {
  id: string;
  name: string;
  category: AgilityDrillCategory;
  pattern: DrillPattern;
  equipment: AgilityEquipmentType[];
  duration?: number; // seconds per rep
  targetTime?: number; // goal completion time
  restBetweenReps: number; // seconds
  reps: number;
  sets?: number;
  description: string;
  instructions: string[];
  coachingCues: string[];
  commonErrors?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  // Visual pattern data
  patternData?: {
    cones: ConePosition[];
    paths: DrillPath[];
    gridSize: { width: number; height: number; unit: 'meters' | 'feet' };
  };
  // Metrics
  metrics: {
    time: boolean;
    accuracy: boolean;
    touches?: boolean;
    heartRate?: boolean;
    // Hockey-specific metrics
    shotSpeed?: boolean; // mph/kph
    shotAccuracy?: boolean; // percentage
    passCompletionRate?: boolean;
    passSpeed?: boolean;
    puckControlTime?: boolean;
    dekeSuccessRate?: boolean;
    decisionMakingTime?: boolean;
    edgeQuality?: boolean;
    transitionSpeed?: boolean;
  };
  videoUrl?: string;
  thumbnailUrl?: string;
}

export type AgilityMode = 'agility' | 'sport_specific';

export interface AgilityProgram {
  id: string;
  name: string;
  description?: string;
  drills: AgilityDrill[];
  warmupDuration: number; // seconds
  cooldownDuration: number; // seconds
  totalDuration: number; // calculated
  equipmentNeeded: AgilityEquipmentType[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  focusAreas: string[]; // e.g., ['acceleration', 'deceleration', 'lateral movement']
  tags?: string[];
  mode?: AgilityMode; // 'agility' (default) or 'sport_specific' for hockey
  metadata?: {
    sessionId: string | number;
    sessionType: string;
    sessionDate: string;
    sessionTime: string;
    sessionLocation: string;
  };
}

export interface AgilityTemplate {
  id: string;
  name: string;
  description: string;
  category: 'speed' | 'reaction' | 'footwork' | 'game_simulation' | 'test';
  program: Omit<AgilityProgram, 'id'>;
  recommendedFor?: string[];
  sportSpecific?: string[];
  createdBy?: string;
  isPublic: boolean;
}

export interface DrillExecution {
  drillId: string;
  playerId: string;
  attemptNumber: number;
  completionTime: number; // seconds
  errors: number;
  touches?: number;
  heartRate?: {
    start: number;
    end: number;
    max: number;
    avg: number;
  };
  notes?: string;
  videoUrl?: string;
}

export interface AgilitySessionExecution {
  id: string;
  sessionId: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  drillExecutions: DrillExecution[];
  overallMetrics: {
    totalTime: number;
    avgCompletionTime: number;
    bestTime: number;
    totalErrors: number;
    successRate: number; // percentage
    improvementRate?: number; // percentage vs previous session
    fatigueIndex?: number; // performance drop over session
  };
  feedback?: {
    perceivedDifficulty: 1 | 2 | 3 | 4 | 5;
    notes?: string;
  };
}

// Preset drill patterns
export const DRILL_PATTERNS: Record<DrillPattern, Partial<AgilityDrill['patternData']>> = {
  t_drill: {
    cones: [
      { id: 'start', x: 50, y: 90, label: 'Start' },
      { id: 'a', x: 50, y: 60, label: 'A' },
      { id: 'b', x: 20, y: 30, label: 'B' },
      { id: 'c', x: 50, y: 30, label: 'C' },
      { id: 'd', x: 80, y: 30, label: 'D' }
    ],
    paths: [
      { from: 'start', to: 'a', type: 'sprint', order: 1 },
      { from: 'a', to: 'b', type: 'shuffle', order: 2 },
      { from: 'b', to: 'c', type: 'shuffle', order: 3 },
      { from: 'c', to: 'd', type: 'shuffle', order: 4 },
      { from: 'd', to: 'a', type: 'backpedal', order: 5 },
      { from: 'a', to: 'start', type: 'backpedal', order: 6 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  l_drill: {
    cones: [
      { id: 'start', x: 20, y: 80, label: 'Start' },
      { id: 'a', x: 20, y: 50, label: 'A' },
      { id: 'b', x: 20, y: 20, label: 'B' },
      { id: 'c', x: 50, y: 20, label: 'C' }
    ],
    paths: [
      { from: 'start', to: 'a', type: 'sprint', order: 1 },
      { from: 'a', to: 'b', type: 'sprint', order: 2 },
      { from: 'b', to: 'c', type: 'sprint', order: 3 },
      { from: 'c', to: 'b', type: 'backpedal', order: 4 },
      { from: 'b', to: 'a', type: 'backpedal', order: 5 },
      { from: 'a', to: 'start', type: 'backpedal', order: 6 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  '5_10_5': {
    cones: [
      { id: 'center', x: 50, y: 50, label: 'Start' },
      { id: 'left', x: 20, y: 50, label: 'L' },
      { id: 'right', x: 80, y: 50, label: 'R' }
    ],
    paths: [
      { from: 'center', to: 'right', type: 'sprint', order: 1 },
      { from: 'right', to: 'left', type: 'sprint', order: 2 },
      { from: 'left', to: 'center', type: 'sprint', order: 3 }
    ],
    gridSize: { width: 10, height: 5, unit: 'meters' }
  },
  box_drill: {
    cones: [
      { id: '1', x: 20, y: 20, label: '1' },
      { id: '2', x: 80, y: 20, label: '2' },
      { id: '3', x: 80, y: 80, label: '3' },
      { id: '4', x: 20, y: 80, label: '4' }
    ],
    paths: [
      { from: '1', to: '2', type: 'sprint', order: 1 },
      { from: '2', to: '3', type: 'shuffle', order: 2 },
      { from: '3', to: '4', type: 'backpedal', order: 3 },
      { from: '4', to: '1', type: 'carioca', order: 4 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  zig_zag: {
    cones: [
      { id: 'start', x: 50, y: 90, label: 'Start' },
      { id: 'c1', x: 50, y: 75, label: '1' },
      { id: 'c2', x: 50, y: 60, label: '2' },
      { id: 'c3', x: 50, y: 45, label: '3' },
      { id: 'c4', x: 50, y: 30, label: '4' },
      { id: 'c5', x: 50, y: 15, label: '5' },
      // Path markers (invisible, just for routing)
      { id: 'p1-left', x: 35, y: 75, label: '', color: 'transparent' },
      { id: 'p2-right', x: 65, y: 60, label: '', color: 'transparent' },
      { id: 'p3-left', x: 35, y: 45, label: '', color: 'transparent' },
      { id: 'p4-right', x: 65, y: 30, label: '', color: 'transparent' },
      { id: 'p5-left', x: 35, y: 15, label: '', color: 'transparent' }
    ],
    paths: [
      { from: 'start', to: 'p1-left', type: 'sprint', order: 1 },
      { from: 'p1-left', to: 'p2-right', type: 'sprint', order: 2 },
      { from: 'p2-right', to: 'p3-left', type: 'sprint', order: 3 },
      { from: 'p3-left', to: 'p4-right', type: 'sprint', order: 4 },
      { from: 'p4-right', to: 'p5-left', type: 'sprint', order: 5 },
      { from: 'p5-left', to: 'c5', type: 'sprint', order: 6 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  figure_8: {
    cones: [
      { id: 'left', x: 35, y: 50, label: 'A' },
      { id: 'right', x: 65, y: 50, label: 'B' },
      // Path markers for figure 8
      { id: 'start', x: 50, y: 70, label: 'Start' },
      { id: 'p1', x: 25, y: 60, label: '', color: 'transparent' },
      { id: 'p2', x: 25, y: 40, label: '', color: 'transparent' },
      { id: 'p3', x: 50, y: 30, label: '', color: 'transparent' },
      { id: 'p4', x: 75, y: 40, label: '', color: 'transparent' },
      { id: 'p5', x: 75, y: 60, label: '', color: 'transparent' }
    ],
    paths: [
      { from: 'start', to: 'p1', type: 'sprint', order: 1 },
      { from: 'p1', to: 'p2', type: 'sprint', order: 2 },
      { from: 'p2', to: 'p3', type: 'sprint', order: 3 },
      { from: 'p3', to: 'p4', type: 'sprint', order: 4 },
      { from: 'p4', to: 'p5', type: 'sprint', order: 5 },
      { from: 'p5', to: 'start', type: 'sprint', order: 6 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  star_drill: {
    cones: [
      { id: 'center', x: 50, y: 50, label: 'C', color: '#ef4444' },
      { id: 'north', x: 50, y: 20, label: 'N' },
      { id: 'northeast', x: 75, y: 30, label: 'NE' },
      { id: 'east', x: 80, y: 50, label: 'E' },
      { id: 'southeast', x: 75, y: 70, label: 'SE' },
      { id: 'south', x: 50, y: 80, label: 'S' },
      { id: 'southwest', x: 25, y: 70, label: 'SW' },
      { id: 'west', x: 20, y: 50, label: 'W' },
      { id: 'northwest', x: 25, y: 30, label: 'NW' }
    ],
    paths: [
      { from: 'center', to: 'north', type: 'sprint', order: 1 },
      { from: 'north', to: 'center', type: 'backpedal', order: 2 },
      { from: 'center', to: 'northeast', type: 'sprint', order: 3 },
      { from: 'northeast', to: 'center', type: 'backpedal', order: 4 },
      { from: 'center', to: 'east', type: 'shuffle', order: 5 },
      { from: 'east', to: 'center', type: 'shuffle', order: 6 },
      { from: 'center', to: 'southeast', type: 'sprint', order: 7 },
      { from: 'southeast', to: 'center', type: 'backpedal', order: 8 }
    ],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  hexagon: {
    cones: [
      // Hexagon corners
      { id: 'top', x: 50, y: 20, label: '1' },
      { id: 'topright', x: 70, y: 35, label: '2' },
      { id: 'bottomright', x: 70, y: 65, label: '3' },
      { id: 'bottom', x: 50, y: 80, label: '4' },
      { id: 'bottomleft', x: 30, y: 65, label: '5' },
      { id: 'topleft', x: 30, y: 35, label: '6' },
      // Center position
      { id: 'center', x: 50, y: 50, label: 'Start', color: '#3b82f6' }
    ],
    paths: [
      // Jump out and in pattern clockwise
      { from: 'center', to: 'top', type: 'hop', order: 1 },
      { from: 'top', to: 'center', type: 'hop', order: 2 },
      { from: 'center', to: 'topright', type: 'hop', order: 3 },
      { from: 'topright', to: 'center', type: 'hop', order: 4 },
      { from: 'center', to: 'bottomright', type: 'hop', order: 5 },
      { from: 'bottomright', to: 'center', type: 'hop', order: 6 },
      { from: 'center', to: 'bottom', type: 'hop', order: 7 },
      { from: 'bottom', to: 'center', type: 'hop', order: 8 },
      { from: 'center', to: 'bottomleft', type: 'hop', order: 9 },
      { from: 'bottomleft', to: 'center', type: 'hop', order: 10 },
      { from: 'center', to: 'topleft', type: 'hop', order: 11 },
      { from: 'topleft', to: 'center', type: 'hop', order: 12 }
    ],
    gridSize: { width: 6, height: 6, unit: 'meters' }
  },
  custom: {
    cones: [],
    paths: [],
    gridSize: { width: 20, height: 20, unit: 'meters' }
  },
  // Hockey-specific patterns
  hockey_stop_start: {
    cones: [
      { id: 'start', x: 50, y: 80, label: 'Start' },
      { id: 'stop1', x: 50, y: 50, label: 'Stop 1' },
      { id: 'stop2', x: 30, y: 20, label: 'Stop 2' },
      { id: 'stop3', x: 70, y: 20, label: 'Stop 3' }
    ],
    paths: [
      { from: 'start', to: 'stop1', type: 'hockey_stride', order: 1 },
      { from: 'stop1', to: 'stop2', type: 'hockey_stride', order: 2 },
      { from: 'stop2', to: 'stop3', type: 'crossover', order: 3 },
      { from: 'stop3', to: 'start', type: 'transition', order: 4 }
    ],
    gridSize: { width: 15, height: 15, unit: 'meters' }
  },
  breakout_pattern: {
    cones: [
      { id: 'net', x: 50, y: 10, label: 'Net', color: '#ef4444' },
      { id: 'defense1', x: 30, y: 30, label: 'D1' },
      { id: 'defense2', x: 70, y: 30, label: 'D2' },
      { id: 'wing1', x: 20, y: 60, label: 'LW' },
      { id: 'center', x: 50, y: 65, label: 'C' },
      { id: 'wing2', x: 80, y: 60, label: 'RW' }
    ],
    paths: [
      { from: 'net', to: 'defense1', type: 'hockey_stride', order: 1, action: 'pass' },
      { from: 'defense1', to: 'wing1', type: 'hockey_stride', order: 2, action: 'pass' },
      { from: 'wing1', to: 'center', type: 'hockey_stride', order: 3, action: 'pass' },
      { from: 'center', to: 'wing2', type: 'crossover', order: 4, action: 'pass' }
    ],
    gridSize: { width: 25, height: 20, unit: 'meters' }
  },
  shooting_drill: {
    cones: [
      { id: 'puck_start', x: 50, y: 80, label: 'Puck', color: '#000000' },
      { id: 'shot_position', x: 50, y: 60, label: 'Shot' },
      { id: 'net', x: 50, y: 20, label: 'Net', color: '#ef4444' },
      { id: 'target_top_left', x: 40, y: 15, label: 'TL', color: '#fbbf24' },
      { id: 'target_top_right', x: 60, y: 15, label: 'TR', color: '#fbbf24' },
      { id: 'target_bottom_left', x: 40, y: 25, label: 'BL', color: '#fbbf24' },
      { id: 'target_bottom_right', x: 60, y: 25, label: 'BR', color: '#fbbf24' }
    ],
    paths: [
      { from: 'puck_start', to: 'shot_position', type: 'hockey_stride', order: 1, withPuck: true },
      { from: 'shot_position', to: 'target_top_left', type: 'hockey_stride', order: 2, action: 'shoot', target: 'target_top_left' }
    ],
    gridSize: { width: 20, height: 20, unit: 'meters' }
  },
  passing_drill: {
    cones: [
      { id: 'passer', x: 20, y: 50, label: 'Passer' },
      { id: 'receiver1', x: 50, y: 30, label: 'R1' },
      { id: 'receiver2', x: 80, y: 50, label: 'R2' },
      { id: 'receiver3', x: 50, y: 70, label: 'R3' },
      { id: 'target1', x: 50, y: 25, label: 'T1', color: '#fbbf24' },
      { id: 'target2', x: 85, y: 50, label: 'T2', color: '#fbbf24' },
      { id: 'target3', x: 50, y: 75, label: 'T3', color: '#fbbf24' }
    ],
    paths: [
      { from: 'passer', to: 'target1', type: 'hockey_stride', order: 1, action: 'pass', target: 'target1' },
      { from: 'passer', to: 'target2', type: 'hockey_stride', order: 2, action: 'pass', target: 'target2' },
      { from: 'passer', to: 'target3', type: 'hockey_stride', order: 3, action: 'pass', target: 'target3' }
    ],
    gridSize: { width: 25, height: 20, unit: 'meters' }
  },
  deke_pattern: {
    cones: [
      { id: 'start', x: 20, y: 80, label: 'Start' },
      { id: 'defender1', x: 40, y: 65, label: 'D1' },
      { id: 'defender2', x: 60, y: 50, label: 'D2' },
      { id: 'defender3', x: 40, y: 35, label: 'D3' },
      { id: 'net', x: 50, y: 15, label: 'Net', color: '#ef4444' }
    ],
    paths: [
      { from: 'start', to: 'defender1', type: 'hockey_stride', order: 1, withPuck: true },
      { from: 'defender1', to: 'defender2', type: 'hockey_stride', order: 2, action: 'deke', withPuck: true },
      { from: 'defender2', to: 'defender3', type: 'hockey_stride', order: 3, action: 'deke', withPuck: true },
      { from: 'defender3', to: 'net', type: 'hockey_stride', order: 4, action: 'shoot', withPuck: true }
    ],
    gridSize: { width: 20, height: 20, unit: 'meters' }
  },
  edge_work_pattern: {
    cones: [
      { id: 'center', x: 50, y: 50, label: 'C' },
      { id: 'inside1', x: 35, y: 35, label: 'I1' },
      { id: 'inside2', x: 65, y: 35, label: 'I2' },
      { id: 'inside3', x: 65, y: 65, label: 'I3' },
      { id: 'inside4', x: 35, y: 65, label: 'I4' },
      { id: 'outside1', x: 25, y: 25, label: 'O1' },
      { id: 'outside2', x: 75, y: 25, label: 'O2' },
      { id: 'outside3', x: 75, y: 75, label: 'O3' },
      { id: 'outside4', x: 25, y: 75, label: 'O4' }
    ],
    paths: [
      { from: 'center', to: 'inside1', type: 'edge_work', order: 1 },
      { from: 'inside1', to: 'outside1', type: 'crossover', order: 2 },
      { from: 'outside1', to: 'inside2', type: 'edge_work', order: 3 },
      { from: 'inside2', to: 'outside2', type: 'crossover', order: 4 },
      { from: 'outside2', to: 'center', type: 'transition', order: 5 }
    ],
    gridSize: { width: 15, height: 15, unit: 'meters' }
  }
};

// Common agility drills library
export const AGILITY_DRILL_LIBRARY: Partial<AgilityDrill>[] = [
  {
    name: 'T-Drill',
    category: 'cone_drills',
    pattern: 't_drill',
    equipment: ['cones'],
    targetTime: 10,
    restBetweenReps: 30,
    reps: 3,
    sets: 2,
    description: 'Classic agility drill for lateral movement and direction changes',
    instructions: [
      'Start at the base cone',
      'Sprint forward to the middle cone',
      'Shuffle left to the left cone',
      'Shuffle right across to the right cone',
      'Shuffle back to the middle cone',
      'Backpedal to the start'
    ],
    coachingCues: [
      'Stay low in athletic position',
      'Keep eyes up',
      'Quick feet on shuffles',
      'Drive knees on backpedal'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true }
  },
  {
    name: 'Ladder - High Knees',
    category: 'ladder_drills',
    pattern: 'custom',
    equipment: ['ladder'],
    restBetweenReps: 15,
    reps: 4,
    description: 'Fast footwork drill for coordination',
    instructions: [
      'Run through ladder with high knees',
      'One foot in each box',
      'Focus on speed and height'
    ],
    coachingCues: [
      'Drive knees to chest',
      'Stay on balls of feet',
      'Pump arms'
    ],
    difficulty: 'beginner',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'Reaction Ball Drill',
    category: 'reaction_drills',
    pattern: 'custom',
    equipment: ['reaction_ball'],
    duration: 30,
    restBetweenReps: 30,
    reps: 5,
    description: 'Reaction and hand-eye coordination training',
    instructions: [
      'Drop reaction ball from shoulder height',
      'React and catch after first bounce',
      'Vary starting positions'
    ],
    coachingCues: [
      'Stay in ready position',
      'React with whole body',
      'Track ball with eyes'
    ],
    difficulty: 'intermediate',
    metrics: { time: false, accuracy: true }
  },
  // Swedish Conditioning Drills - Workout 1
  {
    name: 'Snake Rope with Side Shuffles',
    category: 'conditioning_drills',
    pattern: 'custom',
    equipment: ['battle_ropes'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Battle rope exercise with constant lateral movement',
    instructions: [
      'Hold rope ends in each hand',
      'Create snake/wave pattern with ropes',
      'Continuously shuffle side to side while maintaining rope movement',
      'Keep core engaged throughout'
    ],
    coachingCues: [
      'Stay low in athletic stance',
      'Maintain consistent rope rhythm',
      'Quick feet on shuffles',
      'Keep chest up'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'Bear Crawl with Resistance (Forward)',
    category: 'full_body_drills',
    pattern: 'custom',
    equipment: ['resistance_bands'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Bear crawl movement with added resistance band',
    instructions: [
      'Attach resistance band around waist',
      'Start in bear crawl position (hands and feet)',
      'Crawl forward maintaining resistance',
      'Keep hips low and core tight'
    ],
    coachingCues: [
      'Opposite hand and foot move together',
      'Keep back flat',
      'Resist the pull of the band',
      'Control the movement'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'T-Skipping Pattern',
    category: 'footwork_drills',
    pattern: 't_drill',
    equipment: ['cones'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'High knee skipping in T-pattern formation',
    instructions: [
      'Set up cones in T formation',
      'Skip with high knees from start to top',
      'Skip laterally across the top',
      'Return to center and back to start',
      'Maintain high knee drive throughout'
    ],
    coachingCues: [
      'Drive knees to chest',
      'Land on balls of feet',
      'Pump arms vigorously',
      'Stay tall through torso'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'Burpee + Medicine Ball + Hockey Jump',
    category: 'power_drills',
    pattern: 'custom',
    equipment: ['medicine_ball'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Complex movement combining burpee, ball throw, and lateral jump',
    instructions: [
      'Perform a full burpee',
      'Grab medicine ball and throw overhead',
      'Immediately perform hockey stop jump (lateral jump with stop)',
      'Reset and repeat'
    ],
    coachingCues: [
      'Explosive movements throughout',
      'Full hip extension on throw',
      'Land softly on jumps',
      'Maintain quick pace'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true }
  },
  {
    name: 'Progressive Distance Sprints (5-10-15-20m)',
    category: 'speed_drills',
    pattern: 'custom',
    equipment: ['cones'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Progressive distance sprints with quick returns',
    instructions: [
      'Place cones at 5m, 10m, 15m, and 20m',
      'Sprint to 5m cone and back',
      'Sprint to 10m cone and back',
      'Sprint to 15m cone and back',
      'Sprint to 20m cone and back'
    ],
    coachingCues: [
      'Maximum effort on each sprint',
      'Quick deceleration and turn',
      'Stay low on direction changes',
      'Drive arms powerfully'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: false }
  },
  // Swedish Conditioning Drills - Workout 2
  {
    name: 'Snake Rope with Lunges',
    category: 'conditioning_drills',
    pattern: 'custom',
    equipment: ['battle_ropes'],
    targetTime: 25,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Battle rope waves while performing alternating lunges',
    instructions: [
      'Hold rope ends in each hand',
      'Create snake/wave pattern with ropes',
      'Perform alternating forward lunges',
      'Maintain rope movement throughout lunges'
    ],
    coachingCues: [
      'Keep rope moving continuously',
      'Deep lunges - knee to 90 degrees',
      'Maintain upright torso',
      'Control the descent'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'Bear Crawl with Resistance (Backwards)',
    category: 'full_body_drills',
    pattern: 'custom',
    equipment: ['resistance_bands'],
    targetTime: 25,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Reverse bear crawl with resistance band',
    instructions: [
      'Attach resistance band around waist',
      'Start in bear crawl position',
      'Crawl backwards against resistance',
      'Maintain control throughout movement'
    ],
    coachingCues: [
      'Look where you\'re going',
      'Small controlled steps',
      'Keep core engaged',
      'Resist the band pull'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: false }
  },
  {
    name: 'Step-up Box Jumps',
    category: 'power_drills',
    pattern: 'custom',
    equipment: ['plyo_box'],
    targetTime: 25,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Explosive step-ups transitioning to jumps',
    instructions: [
      'Step up onto box with right foot',
      'Drive up explosively and jump',
      'Land softly on box',
      'Step down and repeat with left foot'
    ],
    coachingCues: [
      'Drive through heel of lead leg',
      'Full hip extension at top',
      'Land softly with bent knees',
      'Control the descent'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true }
  },
  {
    name: 'Four Point Cone Touch',
    category: 'agility_drills',
    pattern: 'box_drill',
    equipment: ['cones'],
    targetTime: 25,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Quick direction changes touching cones in square pattern',
    instructions: [
      'Set up 4 cones in square pattern',
      'Start in center',
      'Sprint to touch each cone',
      'Return to center after each touch'
    ],
    coachingCues: [
      'Stay low throughout',
      'Quick touches - don\'t stop',
      'Explosive direction changes',
      'Keep eyes up'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true }
  },
  {
    name: 'Ladder Arm Hops + Burpee',
    category: 'conditioning_drills',
    pattern: 'custom',
    equipment: ['ladder'],
    targetTime: 25,
    restBetweenReps: 40,
    reps: 3,
    sets: 1,
    description: 'Agility ladder arm patterns followed by burpee',
    instructions: [
      'Start in plank position at ladder',
      'Perform arm hops through ladder boxes',
      'At end of ladder, perform full burpee',
      'Return to start and repeat'
    ],
    coachingCues: [
      'Quick hand movements',
      'Keep hips stable in plank',
      'Explosive burpee',
      'Maintain rhythm'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: false }
  }
];

// Hockey-specific drill library
export const HOCKEY_DRILL_LIBRARY: Partial<AgilityDrill>[] = [
  // Shooting drills
  {
    name: 'Wrist Shot Accuracy',
    category: 'sport_specific',
    pattern: 'shooting_drill',
    equipment: ['hockey_stick', 'pucks', 'shooting_targets', 'hockey_net'],
    targetTime: 30,
    restBetweenReps: 60,
    reps: 10,
    sets: 3,
    description: 'Quick release wrist shots targeting all four corners',
    instructions: [
      'Start with puck at shooting position',
      'Take quick wrist shot at designated target',
      'Focus on accuracy over power',
      'Vary target location each shot',
      'Follow through toward target'
    ],
    coachingCues: [
      'Quick release - don\'t wind up',
      'Eyes on target until puck leaves stick',
      'Weight transfer from back to front',
      'Snap wrists through shot',
      'Stay balanced throughout'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, shotSpeed: true, shotAccuracy: true }
  },
  {
    name: 'One-Timer Practice',
    category: 'sport_specific',
    pattern: 'shooting_drill',
    equipment: ['hockey_stick', 'pucks', 'shooting_targets', 'hockey_net', 'passing_targets'],
    targetTime: 45,
    restBetweenReps: 90,
    reps: 8,
    sets: 2,
    description: 'Receive pass and immediately shoot in one motion',
    instructions: [
      'Position at shooting spot',
      'Receive pass from coach/partner',
      'Shoot immediately without stopping puck',
      'Aim for specific target areas',
      'Reset quickly for next rep'
    ],
    coachingCues: [
      'Stick blade square to passer',
      'Time the shot with pass arrival',
      'Keep head up to see target',
      'Full follow-through',
      'Quick reset between shots'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, shotSpeed: true, shotAccuracy: true, decisionMakingTime: true }
  },
  {
    name: 'Quick Release Drill',
    category: 'sport_specific',
    pattern: 'custom',
    equipment: ['hockey_stick', 'pucks', 'hockey_net'],
    targetTime: 20,
    restBetweenReps: 40,
    reps: 12,
    sets: 3,
    description: 'Rapid-fire shooting focusing on quick release technique',
    instructions: [
      'Line up 5 pucks in front of shooting position',
      'Shoot each puck as quickly as possible',
      'Focus on quick release over power',
      'Maintain accuracy while increasing speed',
      'Count successful shots on target'
    ],
    coachingCues: [
      'Minimal stick movement',
      'Snap release - don\'t wind up',
      'Stay in shooting position',
      'Quick hands, quiet feet',
      'Accuracy first, speed second'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, shotSpeed: true, shotAccuracy: true }
  },
  // Passing drills
  {
    name: 'Saucer Pass Accuracy',
    category: 'sport_specific',
    pattern: 'passing_drill',
    equipment: ['hockey_stick', 'pucks', 'passing_targets', 'hockey_pylons'],
    targetTime: 60,
    restBetweenReps: 90,
    reps: 15,
    sets: 2,
    description: 'Lift puck over obstacles to hit targets accurately',
    instructions: [
      'Set up obstacles between passer and targets',
      'Use saucer pass technique to clear obstacles',
      'Land puck flat at target location',
      'Vary target distance and angle',
      'Focus on consistent lift and landing'
    ],
    coachingCues: [
      'Scoop under the puck',
      'Smooth follow-through upward',
      'Control the height and distance',
      'Land puck flat for receiver',
      'Practice both forehand and backhand'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, passCompletionRate: true, passSpeed: true }
  },
  {
    name: 'Tape-to-Tape Passing',
    category: 'sport_specific',
    pattern: 'passing_drill',
    equipment: ['hockey_stick', 'pucks', 'passing_targets'],
    targetTime: 45,
    restBetweenReps: 60,
    reps: 20,
    sets: 3,
    description: 'Precise passing to specific target locations',
    instructions: [
      'Pass puck to designated target markers',
      'Focus on hitting target precisely',
      'Use proper weight and timing',
      'Vary passing angles and distances',
      'Count successful tape-to-tape passes'
    ],
    coachingCues: [
      'Eyes up to see target',
      'Firm wrists for accurate pass',
      'Follow through toward target',
      'Weight of pass matches distance',
      'Stay balanced throughout'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, passCompletionRate: true, passSpeed: true }
  },
  {
    name: 'Breakout Pattern Passing',
    category: 'sport_specific',
    pattern: 'breakout_pattern',
    equipment: ['hockey_stick', 'pucks', 'hockey_pylons'],
    targetTime: 90,
    restBetweenReps: 120,
    reps: 8,
    sets: 2,
    description: 'Execute full breakout sequence with accurate passes',
    instructions: [
      'Start behind net with puck',
      'Pass to defenseman at board',
      'Defenseman passes to winger',
      'Winger passes to center',
      'Center passes to opposite winger',
      'Execute full ice breakout pattern'
    ],
    coachingCues: [
      'Quick decision making',
      'Lead receiver with pass',
      'Support puck carrier',
      'Communicate throughout',
      'Maintain speed through pattern'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, passCompletionRate: true, decisionMakingTime: true }
  },
  // Skating drills
  {
    name: 'Edge Work - Inside/Outside',
    category: 'sport_specific',
    pattern: 'edge_work_pattern',
    equipment: ['hockey_pylons', 'cones'],
    targetTime: 60,
    restBetweenReps: 90,
    reps: 6,
    sets: 2,
    description: 'Develop precise edge control for tight turns and balance',
    instructions: [
      'Skate figure-8 pattern around cones',
      'Focus on deep edge engagement',
      'Maintain speed through turns',
      'Alternate inside and outside edges',
      'Keep low center of gravity'
    ],
    coachingCues: [
      'Deep knee bend in turns',
      'Pressure on inside edge',
      'Lean into the turn',
      'Quick edge transitions',
      'Stay balanced throughout'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, edgeQuality: true, transitionSpeed: true }
  },
  {
    name: 'Crossover Acceleration',
    category: 'sport_specific',
    pattern: 'custom',
    equipment: ['cones', 'hockey_pylons'],
    targetTime: 45,
    restBetweenReps: 75,
    reps: 8,
    sets: 3,
    description: 'Powerful crossover technique for lateral acceleration',
    instructions: [
      'Start in ready position at cone',
      'Use crossover steps to accelerate laterally',
      'Maintain low stance throughout',
      'Drive with outside leg over inside',
      'Finish with forward stride'
    ],
    coachingCues: [
      'Stay low in crossovers',
      'Drive with outside leg',
      'Keep shoulders square',
      'Push off with inside edge',
      'Explosive first three steps'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, transitionSpeed: true }
  },
  {
    name: 'Transition Skating',
    category: 'sport_specific',
    pattern: 'custom',
    equipment: ['cones'],
    targetTime: 30,
    restBetweenReps: 60,
    reps: 10,
    sets: 2,
    description: 'Quick transitions between forward and backward skating',
    instructions: [
      'Start skating forward to first cone',
      'Transition to backward skating',
      'Skate backward to second cone',
      'Transition back to forward',
      'Maintain speed through transitions'
    ],
    coachingCues: [
      'Quick pivot on inside edges',
      'Stay low during transition',
      'Keep head up throughout',
      'Maintain speed and control',
      'Practice both directions'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, transitionSpeed: true }
  },
  // Puck handling drills
  {
    name: 'Tight Turns with Puck',
    category: 'sport_specific',
    pattern: 'figure_8',
    equipment: ['hockey_stick', 'pucks', 'hockey_pylons'],
    targetTime: 45,
    restBetweenReps: 60,
    reps: 6,
    sets: 2,
    description: 'Maintain puck control through tight turning sequences',
    instructions: [
      'Dribble puck through figure-8 pattern',
      'Keep puck close to stick blade',
      'Maintain control through tight turns',
      'Use both forehand and backhand',
      'Keep head up when possible'
    ],
    coachingCues: [
      'Soft hands on stick',
      'Puck stays in contact with blade',
      'Use body to protect puck',
      'Small, controlled touches',
      'Stay balanced in turns'
    ],
    difficulty: 'intermediate',
    metrics: { time: true, accuracy: true, puckControlTime: true }
  },
  {
    name: 'Toe Drag Technique',
    category: 'sport_specific',
    pattern: 'deke_pattern',
    equipment: ['hockey_stick', 'pucks', 'hockey_pylons'],
    targetTime: 30,
    restBetweenReps: 45,
    reps: 8,
    sets: 3,
    description: 'Practice toe drag deke around defenders',
    instructions: [
      'Approach cone/defender with speed',
      'Use toe of blade to drag puck laterally',
      'Quickly pull puck to opposite side',
      'Accelerate past the cone',
      'Maintain puck control throughout'
    ],
    coachingCues: [
      'Sell the initial direction',
      'Quick toe drag motion',
      'Explosive acceleration after deke',
      'Keep puck close during move',
      'Practice both sides equally'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, dekeSuccessRate: true, puckControlTime: true }
  },
  {
    name: 'Between-the-Legs Deke',
    category: 'sport_specific',
    pattern: 'deke_pattern',
    equipment: ['hockey_stick', 'pucks', 'hockey_pylons'],
    targetTime: 35,
    restBetweenReps: 60,
    reps: 6,
    sets: 2,
    description: 'Advanced dekeing move through the legs',
    instructions: [
      'Approach cone with puck on forehand',
      'Push puck between legs to backhand',
      'Retrieve puck on opposite side',
      'Continue around cone',
      'Maintain speed throughout move'
    ],
    coachingCues: [
      'Commit to the move fully',
      'Quick hands through legs',
      'Stay low during execution',
      'Accelerate out of the move',
      'Practice until automatic'
    ],
    difficulty: 'advanced',
    metrics: { time: true, accuracy: true, dekeSuccessRate: true, puckControlTime: true }
  }
];

// Utility functions
export const calculateAgilityMetrics = (executions: DrillExecution[]): AgilitySessionExecution['overallMetrics'] => {
  if (executions.length === 0) {
    return {
      totalTime: 0,
      avgCompletionTime: 0,
      bestTime: 0,
      totalErrors: 0,
      successRate: 0
    };
  }

  const times = executions.map(e => e.completionTime);
  const errors = executions.reduce((sum, e) => sum + e.errors, 0);
  
  return {
    totalTime: times.reduce((sum, t) => sum + t, 0),
    avgCompletionTime: times.reduce((sum, t) => sum + t, 0) / times.length,
    bestTime: Math.min(...times),
    totalErrors: errors,
    successRate: ((executions.length - errors) / executions.length) * 100
  };
};

export const estimateAgilityDuration = (program: AgilityProgram): number => {
  let duration = program.warmupDuration + program.cooldownDuration;
  
  program.drills.forEach(drill => {
    const drillTime = drill.duration || drill.targetTime || 15; // default 15 seconds
    const totalReps = drill.reps * (drill.sets || 1);
    const restTime = drill.restBetweenReps * (totalReps - 1);
    const betweenSetsRest = drill.sets ? (drill.sets - 1) * 60 : 0; // 60s between sets
    
    duration += (drillTime * totalReps) + restTime + betweenSetsRest;
  });
  
  return duration;
};