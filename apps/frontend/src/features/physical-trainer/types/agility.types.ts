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
  | 'plyo_box';

export type DrillPattern = 
  | 't_drill'
  | 'l_drill'
  | '5_10_5'
  | 'box_drill'
  | 'zig_zag'
  | 'figure_8'
  | 'star_drill'
  | 'hexagon'
  | 'custom';

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
  type: 'sprint' | 'shuffle' | 'backpedal' | 'carioca' | 'hop';
  order: number;
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
  };
  videoUrl?: string;
  thumbnailUrl?: string;
}

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
    cones: [],
    paths: [],
    gridSize: { width: 15, height: 10, unit: 'meters' }
  },
  figure_8: {
    cones: [],
    paths: [],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  star_drill: {
    cones: [],
    paths: [],
    gridSize: { width: 10, height: 10, unit: 'meters' }
  },
  hexagon: {
    cones: [],
    paths: [],
    gridSize: { width: 6, height: 6, unit: 'meters' }
  },
  custom: {
    cones: [],
    paths: [],
    gridSize: { width: 20, height: 20, unit: 'meters' }
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