/**
 * Animated Play Templates - Pre-built tactical animations
 * Converts key hockey plays into dynamic animations with realistic movements
 */

import { 
  AnimatedPlay, 
  AnimationKeyframe, 
  PlayerMovement, 
  PuckMovement, 
  PlayPhase 
} from './types/animation.types';

// Animation utility functions
export const createPlayerMovement = (
  playerId: string,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  duration: number,
  speed: 'slow' | 'medium' | 'fast' | 'sprint' = 'medium'
): PlayerMovement => ({
  playerId,
  startPosition: startPos,
  endPosition: endPos,
  duration,
  speed,
  skatingStyle: speed === 'sprint' ? 'forward-sprint' : 'forward-stride'
});

export const createPuckMovement = (
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  type: 'pass' | 'shot' | 'carry' | 'dump',
  duration: number
): PuckMovement => ({
  startPosition: fromPos,
  endPosition: toPos,
  type,
  duration,
  speed: type === 'shot' ? 'fast' : type === 'pass' ? 'medium' : 'slow'
});

export const createKeyframe = (
  timestamp: number,
  playerMovements: PlayerMovement[],
  puckMovement?: PuckMovement,
  annotation?: string
): AnimationKeyframe => ({
  timestamp,
  playerMovements,
  puckMovement,
  annotation
});

// 1. Swedish 1-2-2 Trap
export const swedish122Trap: AnimatedPlay = {
  id: 'swedish-122-trap',
  name: 'Swedish 1-2-2 Trap',
  category: 'defensive',
  description: 'Classic Swedish neutral zone trap with aggressive forecheckers and structured support',
  duration: 12000, // 12 seconds
  phases: [
    {
      name: 'Setup',
      startTime: 0,
      endTime: 3000,
      description: 'Team sets neutral zone trap formation'
    },
    {
      name: 'Pressure',
      startTime: 3000,
      endTime: 8000,
      description: 'F1 pressures, F2 supports, trap activates'
    },
    {
      name: 'Turnover',
      startTime: 8000,
      endTime: 12000,
      description: 'Force turnover and transition to offense'
    }
  ],
  keyframes: [
    // Initial setup
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 100, y: 150 }, { x: 120, y: 150 }, 2000, 'medium'),
      createPlayerMovement('F2', { x: 80, y: 200 }, { x: 100, y: 180 }, 2000, 'medium'),
      createPlayerMovement('F3', { x: 80, y: 100 }, { x: 100, y: 120 }, 2000, 'medium'),
      createPlayerMovement('D1', { x: 50, y: 180 }, { x: 70, y: 180 }, 2000, 'slow'),
      createPlayerMovement('D2', { x: 50, y: 120 }, { x: 70, y: 120 }, 2000, 'slow')
    ], undefined, 'Setting 1-2-2 trap formation in neutral zone'),

    // F1 pressure
    createKeyframe(3000, [
      createPlayerMovement('F1', { x: 120, y: 150 }, { x: 160, y: 150 }, 2000, 'fast')
    ], undefined, 'F1 pressures puck carrier aggressively'),

    // Puck carrier forced to side
    createKeyframe(4500, [
      createPlayerMovement('F2', { x: 100, y: 180 }, { x: 140, y: 170 }, 1500, 'fast')
    ], createPuckMovement({ x: 160, y: 150 }, { x: 180, y: 130 }, 'carry', 1500), 
    'F2 cuts off escape route, forces to boards'),

    // Trap closes
    createKeyframe(6000, [
      createPlayerMovement('F3', { x: 100, y: 120 }, { x: 150, y: 140 }, 1500, 'fast'),
      createPlayerMovement('D1', { x: 70, y: 180 }, { x: 110, y: 175 }, 1500, 'medium'),
      createPlayerMovement('D2', { x: 70, y: 120 }, { x: 110, y: 125 }, 1500, 'medium')
    ], undefined, 'All five players collapse on puck carrier'),

    // Turnover and transition
    createKeyframe(8000, [
      createPlayerMovement('F1', { x: 160, y: 150 }, { x: 200, y: 150 }, 2000, 'sprint')
    ], createPuckMovement({ x: 180, y: 130 }, { x: 220, y: 150 }, 'pass', 1000), 
    'Force turnover, F1 leads breakout'),

    // Quick transition
    createKeyframe(10000, [
      createPlayerMovement('F2', { x: 140, y: 170 }, { x: 200, y: 180 }, 2000, 'sprint'),
      createPlayerMovement('F3', { x: 150, y: 140 }, { x: 200, y: 120 }, 2000, 'sprint')
    ], createPuckMovement({ x: 220, y: 150 }, { x: 260, y: 150 }, 'pass', 1000), 
    'Quick 3-man attack off turnover')
  ]
};

// 2. SHL Power Play Umbrella
export const shlPowerPlayUmbrella: AnimatedPlay = {
  id: 'shl-pp-umbrella',
  name: 'SHL Power Play Umbrella',
  category: 'special-teams',
  description: 'Swedish Hockey League power play with umbrella formation and continuous puck movement',
  duration: 15000,
  phases: [
    {
      name: 'Entry',
      startTime: 0,
      endTime: 4000,
      description: 'Clean zone entry and setup'
    },
    {
      name: 'Umbrella Formation',
      startTime: 4000,
      endTime: 10000,
      description: 'Establish umbrella, move puck around'
    },
    {
      name: 'Shot Generation',
      startTime: 10000,
      endTime: 15000,
      description: 'Create shooting lane and execute'
    }
  ],
  keyframes: [
    // Zone entry
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 120, y: 150 }, { x: 160, y: 150 }, 3000, 'medium'),
      createPlayerMovement('F2', { x: 100, y: 120 }, { x: 140, y: 130 }, 3000, 'medium'),
      createPlayerMovement('F3', { x: 100, y: 180 }, { x: 140, y: 170 }, 3000, 'medium'),
      createPlayerMovement('D1', { x: 60, y: 150 }, { x: 120, y: 150 }, 3000, 'medium')
    ], createPuckMovement({ x: 120, y: 150 }, { x: 160, y: 150 }, 'carry', 3000),
    'Clean power play entry with speed'),

    // Umbrella setup
    createKeyframe(4000, [
      createPlayerMovement('F1', { x: 160, y: 150 }, { x: 200, y: 80 }, 2000, 'medium'),
      createPlayerMovement('F2', { x: 140, y: 130 }, { x: 180, y: 120 }, 2000, 'medium'),
      createPlayerMovement('F3', { x: 140, y: 170 }, { x: 220, y: 150 }, 2000, 'medium'),
      createPlayerMovement('D1', { x: 120, y: 150 }, { x: 160, y: 200 }, 2000, 'slow'),
      createPlayerMovement('D2', { x: 80, y: 150 }, { x: 140, y: 200 }, 2000, 'slow')
    ], createPuckMovement({ x: 160, y: 150 }, { x: 160, y: 200 }, 'pass', 1000),
    'Form umbrella - three forwards up high, two D at point'),

    // Puck movement - D to D
    createKeyframe(6000, [
      createPlayerMovement('D2', { x: 140, y: 200 }, { x: 140, y: 190 }, 500, 'slow')
    ], createPuckMovement({ x: 160, y: 200 }, { x: 140, y: 200 }, 'pass', 800),
    'D to D pass to change angle'),

    // Puck to high forward
    createKeyframe(7500, [
      createPlayerMovement('F2', { x: 180, y: 120 }, { x: 185, y: 125 }, 1000, 'slow')
    ], createPuckMovement({ x: 140, y: 200 }, { x: 180, y: 120 }, 'pass', 1200),
    'Quick pass to high forward'),

    // Player rotation
    createKeyframe(9000, [
      createPlayerMovement('F1', { x: 200, y: 80 }, { x: 210, y: 90 }, 1500, 'medium'),
      createPlayerMovement('F3', { x: 220, y: 150 }, { x: 230, y: 140 }, 1500, 'medium')
    ], createPuckMovement({ x: 180, y: 120 }, { x: 200, y: 80 }, 'pass', 1000),
    'Rotate to create new passing lanes'),

    // Shot setup
    createKeyframe(11000, [
      createPlayerMovement('F3', { x: 230, y: 140 }, { x: 240, y: 120 }, 1500, 'fast')
    ], createPuckMovement({ x: 200, y: 80 }, { x: 230, y: 140 }, 'pass', 1200),
    'Quick pass to set up one-timer'),

    // One-timer shot
    createKeyframe(13000, [], 
    createPuckMovement({ x: 230, y: 140 }, { x: 280, y: 150 }, 'shot', 500),
    'One-timer from slot - high danger chance')
  ]
};

// 3. Breakout Strong Side
export const breakoutStrongSide: AnimatedPlay = {
  id: 'breakout-strong-side',
  name: 'Breakout Strong Side',
  category: 'breakout',
  description: 'Classic D to D pass, strong side breakout up the boards',
  duration: 8000,
  phases: [
    {
      name: 'D Zone Recovery',
      startTime: 0,
      endTime: 2500,
      description: 'Defenseman retrieves puck behind net'
    },
    {
      name: 'D to D Pass',
      startTime: 2500,
      endTime: 4500,
      description: 'Cross-ice pass to partner'
    },
    {
      name: 'Breakout Execution',
      startTime: 4500,
      endTime: 8000,
      description: 'Strong side winger support and breakout'
    }
  ],
  keyframes: [
    // D retrieves puck
    createKeyframe(0, [
      createPlayerMovement('D1', { x: 30, y: 150 }, { x: 20, y: 150 }, 2000, 'medium'),
      createPlayerMovement('F1', { x: 60, y: 100 }, { x: 80, y: 120 }, 2000, 'medium'),
      createPlayerMovement('F2', { x: 60, y: 200 }, { x: 80, y: 180 }, 2000, 'medium'),
      createPlayerMovement('F3', { x: 100, y: 150 }, { x: 120, y: 150 }, 2000, 'medium')
    ], createPuckMovement({ x: 15, y: 150 }, { x: 20, y: 150 }, 'carry', 2000),
    'D1 retrieves puck behind net, forwards provide support'),

    // D to D pass
    createKeyframe(2500, [
      createPlayerMovement('D2', { x: 30, y: 120 }, { x: 40, y: 100 }, 1500, 'medium')
    ], createPuckMovement({ x: 20, y: 150 }, { x: 40, y: 100 }, 'pass', 1200),
    'D to D pass to switch side of ice'),

    // Strong side winger support
    createKeyframe(4000, [
      createPlayerMovement('F1', { x: 80, y: 120 }, { x: 70, y: 140 }, 1000, 'fast'),
      createPlayerMovement('F2', { x: 80, y: 180 }, { x: 100, y: 200 }, 1500, 'medium')
    ], undefined, 'F1 provides strong side support, F2 stretches weak side'),

    // Breakout pass
    createKeyframe(5000, [
      createPlayerMovement('F1', { x: 70, y: 140 }, { x: 110, y: 140 }, 2000, 'fast')
    ], createPuckMovement({ x: 40, y: 100 }, { x: 70, y: 140 }, 'pass', 1000),
    'Pass to strong side winger for breakout'),

    // Up the boards
    createKeyframe(6500, [
      createPlayerMovement('F1', { x: 110, y: 140 }, { x: 160, y: 130 }, 1500, 'fast'),
      createPlayerMovement('F3', { x: 120, y: 150 }, { x: 180, y: 150 }, 1500, 'fast'),
      createPlayerMovement('F2', { x: 100, y: 200 }, { x: 160, y: 180 }, 1500, 'fast')
    ], createPuckMovement({ x: 110, y: 140 }, { x: 160, y: 130 }, 'carry', 1500),
    'Strong side breakout - all three forwards in support')
  ]
};

// 4. 3v3 Overtime Triangle
export const overtime3v3Triangle: AnimatedPlay = {
  id: '3v3-overtime-triangle',
  name: '3v3 Overtime Triangle',
  category: 'special-situations',
  description: 'Continuous movement in 3v3 overtime maintaining triangle spacing',
  duration: 10000,
  phases: [
    {
      name: 'Initial Triangle',
      startTime: 0,
      endTime: 3000,
      description: 'Establish triangle formation'
    },
    {
      name: 'Rotation',
      startTime: 3000,
      endTime: 7000,
      description: 'Continuous player rotation'
    },
    {
      name: 'Attack',
      startTime: 7000,
      endTime: 10000,
      description: 'Create scoring chance'
    }
  ],
  keyframes: [
    // Initial triangle setup
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 120, y: 150 }, { x: 150, y: 130 }, 2500, 'medium'),
      createPlayerMovement('F2', { x: 100, y: 120 }, { x: 130, y: 180 }, 2500, 'medium'),
      createPlayerMovement('D1', { x: 80, y: 150 }, { x: 110, y: 150 }, 2500, 'medium')
    ], createPuckMovement({ x: 120, y: 150 }, { x: 150, y: 130 }, 'carry', 2500),
    'Form triangle - maintain spacing, F1 carries puck'),

    // First rotation
    createKeyframe(3000, [
      createPlayerMovement('F1', { x: 150, y: 130 }, { x: 170, y: 160 }, 2000, 'medium'),
      createPlayerMovement('F2', { x: 130, y: 180 }, { x: 160, y: 140 }, 2000, 'medium'),
      createPlayerMovement('D1', { x: 110, y: 150 }, { x: 140, y: 190 }, 2000, 'medium')
    ], createPuckMovement({ x: 150, y: 130 }, { x: 130, y: 180 }, 'pass', 1000),
    'Rotate positions - pass to F2, D1 supports high'),

    // Continue rotation
    createKeyframe(5000, [
      createPlayerMovement('F2', { x: 160, y: 140 }, { x: 190, y: 150 }, 1500, 'medium'),
      createPlayerMovement('D1', { x: 140, y: 190 }, { x: 170, y: 170 }, 1500, 'fast'),
      createPlayerMovement('F1', { x: 170, y: 160 }, { x: 150, y: 200 }, 1500, 'medium')
    ], createPuckMovement({ x: 160, y: 140 }, { x: 140, y: 190 }, 'pass', 800),
    'D1 jumps into play, maintains triangle'),

    // Attack phase
    createKeyframe(7000, [
      createPlayerMovement('D1', { x: 170, y: 170 }, { x: 210, y: 160 }, 1500, 'fast'),
      createPlayerMovement('F2', { x: 190, y: 150 }, { x: 220, y: 130 }, 1500, 'fast')
    ], createPuckMovement({ x: 170, y: 170 }, { x: 210, y: 160 }, 'carry', 1500),
    'D1 drives wide, F2 supports - 2v1 developing'),

    // Finish play
    createKeyframe(8500, [
      createPlayerMovement('F2', { x: 220, y: 130 }, { x: 240, y: 140 }, 1000, 'sprint')
    ], createPuckMovement({ x: 210, y: 160 }, { x: 220, y: 130 }, 'pass', 800),
    'Cross-ice pass to open F2'),

    createKeyframe(9500, [], 
    createPuckMovement({ x: 220, y: 130 }, { x: 280, y: 150 }, 'shot', 500),
    'Shot from slot - high danger 3v3 chance')
  ]
};

// 5. Penalty Kill Box+1
export const penaltyKillBox1: AnimatedPlay = {
  id: 'pk-box-plus-one',
  name: 'Penalty Kill Box+1',
  category: 'special-teams',
  description: 'Four-man penalty kill with box formation and aggressive forechecker',
  duration: 12000,
  phases: [
    {
      name: 'Setup',
      startTime: 0,
      endTime: 3000,
      description: 'Establish box+1 formation'
    },
    {
      name: 'Pressure',
      startTime: 3000,
      endTime: 8000,
      description: 'Aggressive pressure and rotations'
    },
    {
      name: 'Clear',
      startTime: 8000,
      endTime: 12000,
      description: 'Force turnover and clear zone'
    }
  ],
  keyframes: [
    // Box+1 setup
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 180, y: 150 }, { x: 200, y: 150 }, 2500, 'medium'),
      createPlayerMovement('F2', { x: 160, y: 120 }, { x: 180, y: 130 }, 2500, 'medium'),
      createPlayerMovement('D1', { x: 140, y: 130 }, { x: 160, y: 140 }, 2500, 'slow'),
      createPlayerMovement('D2', { x: 140, y: 170 }, { x: 160, y: 160 }, 2500, 'slow')
    ], undefined, 'Form box+1: F1 pressures, others in tight box'),

    // Aggressive pressure
    createKeyframe(3000, [
      createPlayerMovement('F1', { x: 200, y: 150 }, { x: 220, y: 140 }, 2000, 'fast')
    ], undefined, 'F1 pressures point man aggressively'),

    // Box rotation on pass
    createKeyframe(4500, [
      createPlayerMovement('F2', { x: 180, y: 130 }, { x: 200, y: 120 }, 1500, 'fast'),
      createPlayerMovement('D1', { x: 160, y: 140 }, { x: 180, y: 135 }, 1500, 'medium')
    ], undefined, 'Box rotates to pressure, maintain gaps'),

    // Seal off passing lanes
    createKeyframe(6000, [
      createPlayerMovement('D2', { x: 160, y: 160 }, { x: 190, y: 155 }, 1500, 'medium'),
      createPlayerMovement('F1', { x: 220, y: 140 }, { x: 210, y: 160 }, 1500, 'fast')
    ], undefined, 'Close passing lanes, force bad decision'),

    // Force turnover
    createKeyframe(7500, [
      createPlayerMovement('F2', { x: 200, y: 120 }, { x: 180, y: 130 }, 1000, 'sprint')
    ], createPuckMovement({ x: 210, y: 140 }, { x: 180, y: 130 }, 'pass', 800),
    'Force bad pass, F2 intercepts'),

    // Breakout clear
    createKeyframe(8500, [
      createPlayerMovement('F2', { x: 180, y: 130 }, { x: 120, y: 150 }, 2000, 'sprint'),
      createPlayerMovement('F1', { x: 210, y: 160 }, { x: 140, y: 170 }, 2000, 'fast')
    ], createPuckMovement({ x: 180, y: 130 }, { x: 80, y: 150 }, 'pass', 1500),
    'Quick clear up ice - PK breakout'),

    // Support clear
    createKeyframe(10500, [
      createPlayerMovement('D1', { x: 180, y: 135 }, { x: 100, y: 140 }, 1500, 'fast'),
      createPlayerMovement('D2', { x: 190, y: 155 }, { x: 100, y: 160 }, 1500, 'fast')
    ], createPuckMovement({ x: 80, y: 150 }, { x: 40, y: 150 }, 'pass', 1000),
    'All four support - safe clear to neutral zone')
  ]
};

// 6. Offensive Zone Cycle
export const offensiveZoneCycle: AnimatedPlay = {
  id: 'offensive-zone-cycle',
  name: 'Offensive Zone Cycle',
  category: 'offensive',
  description: 'Low cycle with board play and rotating support',
  duration: 14000,
  phases: [
    {
      name: 'Entry',
      startTime: 0,
      endTime: 3000,
      description: 'Enter zone and establish cycle'
    },
    {
      name: 'Cycle Low',
      startTime: 3000,
      endTime: 10000,
      description: 'Board play and player rotation'
    },
    {
      name: 'Finish',
      startTime: 10000,
      endTime: 14000,
      description: 'Create scoring chance'
    }
  ],
  keyframes: [
    // Zone entry
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 160, y: 150 }, { x: 200, y: 180 }, 2500, 'medium'),
      createPlayerMovement('F2', { x: 140, y: 130 }, { x: 180, y: 120 }, 2500, 'medium'),
      createPlayerMovement('F3', { x: 140, y: 170 }, { x: 220, y: 150 }, 2500, 'medium'),
      createPlayerMovement('D1', { x: 120, y: 150 }, { x: 160, y: 190 }, 2500, 'slow')
    ], createPuckMovement({ x: 160, y: 150 }, { x: 200, y: 180 }, 'carry', 2500),
    'F1 carries below goal line, establish cycle'),

    // Board play
    createKeyframe(3500, [
      createPlayerMovement('F2', { x: 180, y: 120 }, { x: 210, y: 140 }, 1500, 'medium'),
      createPlayerMovement('F1', { x: 200, y: 180 }, { x: 220, y: 170 }, 1500, 'slow')
    ], undefined, 'F2 provides support, F1 protects puck on boards'),

    // Cycle pass
    createKeyframe(5000, [
      createPlayerMovement('F2', { x: 210, y: 140 }, { x: 230, y: 160 }, 1500, 'medium')
    ], createPuckMovement({ x: 220, y: 170 }, { x: 210, y: 140 }, 'pass', 1000),
    'Wall pass to F2 in support'),

    // Player rotation
    createKeyframe(6500, [
      createPlayerMovement('F3', { x: 220, y: 150 }, { x: 200, y: 170 }, 1500, 'medium'),
      createPlayerMovement('F1', { x: 220, y: 170 }, { x: 240, y: 140 }, 1500, 'fast')
    ], createPuckMovement({ x: 210, y: 140 }, { x: 220, y: 150 }, 'pass', 1200),
    'Continue cycle - F3 takes boards, F1 rotates high'),

    // D joins cycle
    createKeyframe(8000, [
      createPlayerMovement('D1', { x: 160, y: 190 }, { x: 190, y: 170 }, 1500, 'medium'),
      createPlayerMovement('F2', { x: 230, y: 160 }, { x: 250, y: 130 }, 1500, 'medium')
    ], createPuckMovement({ x: 220, y: 150 }, { x: 190, y: 170 }, 'pass', 1000),
    'D1 joins cycle low, F2 goes to net front'),

    // Scoring chance setup
    createKeyframe(10000, [
      createPlayerMovement('F1', { x: 240, y: 140 }, { x: 220, y: 120 }, 1500, 'fast')
    ], createPuckMovement({ x: 190, y: 170 }, { x: 240, y: 140 }, 'pass', 1200),
    'Quick pass to F1 for shot attempt'),

    // Shot
    createKeyframe(12000, [], 
    createPuckMovement({ x: 220, y: 120 }, { x: 280, y: 150 }, 'shot', 800),
    'Shot from high slot - cycle creates opportunity')
  ]
};

// 7. Neutral Zone Regroup
export const neutralZoneRegroup: AnimatedPlay = {
  id: 'neutral-zone-regroup',
  name: 'Neutral Zone Regroup',
  category: 'transition',
  description: 'Back pass regroup for controlled zone entry with speed',
  duration: 9000,
  phases: [
    {
      name: 'Initial Pressure',
      startTime: 0,
      endTime: 2500,
      description: 'Meet pressure at red line'
    },
    {
      name: 'Regroup',
      startTime: 2500,
      endTime: 5500,
      description: 'Back pass and reset'
    },
    {
      name: 'Attack',
      startTime: 5500,
      endTime: 9000,
      description: 'Speed entry with numbers'
    }
  ],
  keyframes: [
    // Meet pressure
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 100, y: 150 }, { x: 120, y: 150 }, 2000, 'medium'),
      createPlayerMovement('F2', { x: 80, y: 120 }, { x: 100, y: 130 }, 2000, 'medium'),
      createPlayerMovement('F3', { x: 80, y: 180 }, { x: 100, y: 170 }, 2000, 'medium'),
      createPlayerMovement('D1', { x: 60, y: 140 }, { x: 80, y: 140 }, 2000, 'slow')
    ], createPuckMovement({ x: 100, y: 150 }, { x: 120, y: 150 }, 'carry', 2000),
    'F1 carries to red line, meets defensive pressure'),

    // Regroup decision
    createKeyframe(2500, [
      createPlayerMovement('F1', { x: 120, y: 150 }, { x: 90, y: 150 }, 1500, 'medium'),
      createPlayerMovement('D1', { x: 80, y: 140 }, { x: 100, y: 145 }, 1500, 'medium')
    ], createPuckMovement({ x: 120, y: 150 }, { x: 80, y: 140 }, 'pass', 1000),
    'Back pass to D1 - regroup for speed entry'),

    // Wings stretch
    createKeyframe(4000, [
      createPlayerMovement('F2', { x: 100, y: 130 }, { x: 140, y: 110 }, 2000, 'fast'),
      createPlayerMovement('F3', { x: 100, y: 170 }, { x: 140, y: 190 }, 2000, 'fast'),
      createPlayerMovement('F1', { x: 90, y: 150 }, { x: 130, y: 150 }, 2000, 'fast')
    ], createPuckMovement({ x: 100, y: 145 }, { x: 140, y: 110 }, 'pass', 1500),
    'Wings stretch wide, D finds F2 with speed'),

    // Speed entry
    createKeyframe(6000, [
      createPlayerMovement('F2', { x: 140, y: 110 }, { x: 180, y: 120 }, 1500, 'sprint'),
      createPlayerMovement('F1', { x: 130, y: 150 }, { x: 170, y: 150 }, 1500, 'sprint'),
      createPlayerMovement('F3', { x: 140, y: 190 }, { x: 180, y: 180 }, 1500, 'sprint')
    ], createPuckMovement({ x: 140, y: 110 }, { x: 180, y: 120 }, 'carry', 1500),
    'Three forwards enter with speed - numbers advantage'),

    // Attack formation
    createKeyframe(7500, [
      createPlayerMovement('F1', { x: 170, y: 150 }, { x: 210, y: 140 }, 1500, 'sprint'),
      createPlayerMovement('F3', { x: 180, y: 180 }, { x: 220, y: 160 }, 1500, 'sprint')
    ], createPuckMovement({ x: 180, y: 120 }, { x: 210, y: 140 }, 'pass', 1000),
    '3-on-2 attack off regroup - quality scoring chance')
  ]
};

// 8. Face-off Win Play
export const faceoffWinPlay: AnimatedPlay = {
  id: 'faceoff-win-play',
  name: 'Face-off Win Play',
  category: 'special-situations',
  description: 'Offensive zone face-off win to quick shot',
  duration: 6000,
  phases: [
    {
      name: 'Setup',
      startTime: 0,
      endTime: 1000,
      description: 'Face-off formation'
    },
    {
      name: 'Win',
      startTime: 1000,
      endTime: 2500,
      description: 'Clean face-off win'
    },
    {
      name: 'Execute',
      startTime: 2500,
      endTime: 6000,
      description: 'Quick shot play'
    }
  ],
  keyframes: [
    // Face-off setup
    createKeyframe(0, [
      createPlayerMovement('C', { x: 220, y: 150 }, { x: 220, y: 150 }, 500, 'slow'),
      createPlayerMovement('LW', { x: 200, y: 130 }, { x: 200, y: 130 }, 500, 'slow'),
      createPlayerMovement('RW', { x: 200, y: 170 }, { x: 200, y: 170 }, 500, 'slow'),
      createPlayerMovement('D1', { x: 180, y: 140 }, { x: 180, y: 140 }, 500, 'slow'),
      createPlayerMovement('D2', { x: 180, y: 160 }, { x: 180, y: 160 }, 500, 'slow')
    ], undefined, 'Set formation - C ready, wingers in position'),

    // Face-off win
    createKeyframe(1000, [
      createPlayerMovement('C', { x: 220, y: 150 }, { x: 215, y: 155 }, 1000, 'fast')
    ], createPuckMovement({ x: 220, y: 150 }, { x: 200, y: 130 }, 'pass', 800),
    'Clean face-off win back to LW'),

    // Quick shot setup
    createKeyframe(2000, [
      createPlayerMovement('LW', { x: 200, y: 130 }, { x: 190, y: 135 }, 1000, 'medium'),
      createPlayerMovement('RW', { x: 200, y: 170 }, { x: 240, y: 160 }, 1500, 'fast'),
      createPlayerMovement('D1', { x: 180, y: 140 }, { x: 185, y: 145 }, 1000, 'slow')
    ], createPuckMovement({ x: 200, y: 130 }, { x: 180, y: 140 }, 'pass', 800),
    'LW to D1, RW drives net for screen'),

    // One-timer attempt
    createKeyframe(3500, [
      createPlayerMovement('D1', { x: 185, y: 145 }, { x: 190, y: 148 }, 500, 'medium')
    ], createPuckMovement({ x: 185, y: 145 }, { x: 280, y: 150 }, 'shot', 800),
    'D1 one-timer from point through screen'),

    // Follow rebound
    createKeyframe(4500, [
      createPlayerMovement('C', { x: 215, y: 155 }, { x: 250, y: 150 }, 1000, 'sprint'),
      createPlayerMovement('RW', { x: 240, y: 160 }, { x: 260, y: 155 }, 1000, 'sprint')
    ], undefined, 'C and RW crash net for rebound opportunity')
  ]
};

// 9. 6v5 Empty Net Attack
export const emptyNetAttack6v5: AnimatedPlay = {
  id: '6v5-empty-net-attack',
  name: '6v5 Empty Net Attack',
  category: 'special-situations',
  description: 'Six attacker formation with goalie pulled',
  duration: 15000,
  phases: [
    {
      name: 'Setup',
      startTime: 0,
      endTime: 4000,
      description: 'Establish 6v5 formation'
    },
    {
      name: 'Cycle',
      startTime: 4000,
      endTime: 11000,
      description: 'Maintain possession and pressure'
    },
    {
      name: 'Score',
      startTime: 11000,
      endTime: 15000,
      description: 'Create and finish chance'
    }
  ],
  keyframes: [
    // 6v5 setup
    createKeyframe(0, [
      createPlayerMovement('F1', { x: 160, y: 150 }, { x: 200, y: 120 }, 3000, 'medium'),
      createPlayerMovement('F2', { x: 140, y: 130 }, { x: 180, y: 110 }, 3000, 'medium'),
      createPlayerMovement('F3', { x: 140, y: 170 }, { x: 220, y: 150 }, 3000, 'medium'),
      createPlayerMovement('D1', { x: 120, y: 140 }, { x: 160, y: 180 }, 3000, 'slow'),
      createPlayerMovement('D2', { x: 120, y: 160 }, { x: 140, y: 180 }, 3000, 'slow'),
      createPlayerMovement('C', { x: 100, y: 150 }, { x: 180, y: 140 }, 3000, 'medium')
    ], createPuckMovement({ x: 160, y: 150 }, { x: 160, y: 180 }, 'pass', 2000),
    'Six attackers setup - spread formation, D1 controls'),

    // Puck movement
    createKeyframe(4000, [
      createPlayerMovement('D1', { x: 160, y: 180 }, { x: 155, y: 175 }, 1000, 'slow')
    ], createPuckMovement({ x: 160, y: 180 }, { x: 140, y: 180 }, 'pass', 1000),
    'D to D pass - keep puck moving'),

    // Cycle to maintain possession
    createKeyframe(5500, [
      createPlayerMovement('F2', { x: 180, y: 110 }, { x: 160, y: 130 }, 1500, 'medium')
    ], createPuckMovement({ x: 140, y: 180 }, { x: 180, y: 110 }, 'pass', 1200),
    'Pass to F2 high - maintain possession'),

    // Player rotation
    createKeyframe(7000, [
      createPlayerMovement('C', { x: 180, y: 140 }, { x: 210, y: 160 }, 1500, 'medium'),
      createPlayerMovement('F3', { x: 220, y: 150 }, { x: 240, y: 140 }, 1500, 'medium')
    ], createPuckMovement({ x: 180, y: 110 }, { x: 180, y: 140 }, 'pass', 1000),
    'Rotate players - C takes middle, F3 goes wide'),

    // Build pressure
    createKeyframe(8500, [
      createPlayerMovement('F1', { x: 200, y: 120 }, { x: 230, y: 130 }, 1500, 'fast'),
      createPlayerMovement('D1', { x: 155, y: 175 }, { x: 190, y: 170 }, 1500, 'medium')
    ], createPuckMovement({ x: 180, y: 140 }, { x: 200, y: 120 }, 'pass', 1000),
    'F1 in slot, D1 supports - building attack'),

    // Screen and shot
    createKeyframe(10500, [
      createPlayerMovement('C', { x: 210, y: 160 }, { x: 240, y: 155 }, 1000, 'fast')
    ], undefined, 'C provides screen front of empty net'),

    // Final shot
    createKeyframe(11500, [], 
    createPuckMovement({ x: 200, y: 120 }, { x: 280, y: 150 }, 'shot', 1000),
    'Shot through screen at empty net'),

    // Follow up
    createKeyframe(13000, [
      createPlayerMovement('F2', { x: 160, y: 130 }, { x: 250, y: 140 }, 1500, 'sprint'),
      createPlayerMovement('F3', { x: 240, y: 140 }, { x: 270, y: 150 }, 1500, 'sprint')
    ], undefined, 'Crash net for any rebound - 6v5 advantage')
  ]
};

// 10. Transition Counter-Attack
export const transitionCounterAttack: AnimatedPlay = {
  id: 'transition-counter-attack',
  name: 'Transition Counter-Attack',
  category: 'transition',
  description: 'Quick transition from defense to odd-man rush attack',
  duration: 8000,
  phases: [
    {
      name: 'Turnover',
      startTime: 0,
      endTime: 2000,
      description: 'Force turnover in defensive zone'
    },
    {
      name: 'Breakout',
      startTime: 2000,
      endTime: 4500,
      description: 'Quick first pass and support'
    },
    {
      name: 'Attack',
      startTime: 4500,
      endTime: 8000,
      description: '3v2 rush and finish'
    }
  ],
  keyframes: [
    // Defensive turnover
    createKeyframe(0, [
      createPlayerMovement('D1', { x: 40, y: 150 }, { x: 60, y: 140 }, 1500, 'fast'),
      createPlayerMovement('F1', { x: 60, y: 130 }, { x: 80, y: 130 }, 1500, 'medium'),
      createPlayerMovement('F2', { x: 60, y: 170 }, { x: 80, y: 170 }, 1500, 'medium'),
      createPlayerMovement('F3', { x: 80, y: 150 }, { x: 100, y: 150 }, 1500, 'medium')
    ], createPuckMovement({ x: 50, y: 160 }, { x: 60, y: 140 }, 'pass', 1000),
    'D1 forces turnover, quick outlet available'),

    // First pass breakout
    createKeyframe(2000, [
      createPlayerMovement('F1', { x: 80, y: 130 }, { x: 120, y: 130 }, 1500, 'fast'),
      createPlayerMovement('F2', { x: 80, y: 170 }, { x: 110, y: 180 }, 1500, 'fast'),
      createPlayerMovement('F3', { x: 100, y: 150 }, { x: 140, y: 150 }, 1500, 'fast')
    ], createPuckMovement({ x: 60, y: 140 }, { x: 80, y: 130 }, 'pass', 1000),
    'Quick outlet to F1 - all forwards with speed'),

    // Support and numbers
    createKeyframe(3500, [
      createPlayerMovement('F1', { x: 120, y: 130 }, { x: 160, y: 130 }, 1500, 'sprint'),
      createPlayerMovement('F2', { x: 110, y: 180 }, { x: 150, y: 180 }, 1500, 'sprint'),
      createPlayerMovement('F3', { x: 140, y: 150 }, { x: 180, y: 150 }, 1500, 'sprint')
    ], createPuckMovement({ x: 120, y: 130 }, { x: 160, y: 130 }, 'carry', 1500),
    'F1 carries with speed, support on both sides'),

    // 3v2 attack
    createKeyframe(5000, [
      createPlayerMovement('F1', { x: 160, y: 130 }, { x: 200, y: 140 }, 1500, 'sprint'),
      createPlayerMovement('F3', { x: 180, y: 150 }, { x: 220, y: 150 }, 1500, 'sprint')
    ], createPuckMovement({ x: 160, y: 130 }, { x: 180, y: 150 }, 'pass', 1000),
    '3v2 developing - pass to F3 in middle'),

    // Attack finish
    createKeyframe(6500, [
      createPlayerMovement('F2', { x: 150, y: 180 }, { x: 240, y: 165 }, 1500, 'sprint')
    ], createPuckMovement({ x: 180, y: 150 }, { x: 220, y: 150 }, 'carry', 1000),
    'F3 drives middle, F2 late trailer for 3v2'),

    // Finish play
    createKeyframe(7500, [], 
    createPuckMovement({ x: 220, y: 150 }, { x: 280, y: 150 }, 'shot', 500),
    'Shot from slot - counter-attack goal opportunity')
  ]
};

// Utility function to convert static play to animated
export const convertStaticToAnimated = (
  staticPlay: any,
  timeline: { timestamp: number; action: string; players: string[] }[]
): AnimatedPlay => {
  const keyframes: AnimationKeyframe[] = timeline.map((timepoint, index) => {
    const playerMovements: PlayerMovement[] = timepoint.players.map(playerId => {
      // Generate movement based on action type
      const basePos = { x: 100 + (index * 20), y: 150 + (Math.random() - 0.5) * 40 };
      const endPos = { x: basePos.x + 40, y: basePos.y + (Math.random() - 0.5) * 30 };
      
      return createPlayerMovement(
        playerId,
        basePos,
        endPos,
        1500,
        timepoint.action.includes('sprint') ? 'sprint' : 'medium'
      );
    });

    return createKeyframe(
      timepoint.timestamp,
      playerMovements,
      undefined,
      timepoint.action
    );
  });

  return {
    id: `animated-${staticPlay.id}`,
    name: `Animated ${staticPlay.name}`,
    category: staticPlay.category || 'custom',
    description: `Animated version of ${staticPlay.name}`,
    duration: timeline[timeline.length - 1]?.timestamp || 10000,
    phases: [
      {
        name: 'Execution',
        startTime: 0,
        endTime: timeline[timeline.length - 1]?.timestamp || 10000,
        description: 'Animated play execution'
      }
    ],
    keyframes
  };
};

// Generate animation timeline from positions
export const generateTimelineFromPositions = (
  positions: { playerId: string; x: number; y: number }[],
  duration: number = 10000
): AnimationKeyframe[] => {
  const frameCount = 10;
  const frameInterval = duration / frameCount;
  
  return Array.from({ length: frameCount }, (_, index) => {
    const timestamp = index * frameInterval;
    const progress = index / (frameCount - 1);
    
    const playerMovements: PlayerMovement[] = positions.map(pos => {
      const startPos = { x: pos.x - 40 * progress, y: pos.y - 20 * progress };
      const endPos = { x: pos.x, y: pos.y };
      
      return createPlayerMovement(
        pos.playerId,
        startPos,
        endPos,
        frameInterval,
        'medium'
      );
    });

    return createKeyframe(timestamp, playerMovements);
  });
};

// Add standard movement patterns
export const addMovementPattern = (
  baseKeyframes: AnimationKeyframe[],
  pattern: 'cycle' | 'rush' | 'forecheck' | 'backcheck',
  playerIds: string[]
): AnimationKeyframe[] => {
  const patternModifiers = {
    cycle: { speedBoost: 0, directionVariance: 0.3 },
    rush: { speedBoost: 0.5, directionVariance: 0.1 },
    forecheck: { speedBoost: 0.3, directionVariance: 0.4 },
    backcheck: { speedBoost: 0.4, directionVariance: 0.2 }
  };

  const modifier = patternModifiers[pattern];
  
  return baseKeyframes.map(keyframe => ({
    ...keyframe,
    playerMovements: keyframe.playerMovements.map(movement => {
      if (playerIds.includes(movement.playerId)) {
        const newSpeed = movement.speed === 'slow' ? 'medium' : 
                        movement.speed === 'medium' ? 'fast' : 'sprint';
        
        return {
          ...movement,
          speed: modifier.speedBoost > 0.3 ? newSpeed : movement.speed,
          duration: movement.duration * (1 - modifier.speedBoost * 0.3)
        };
      }
      return movement;
    })
  }));
};

// Create coaching breakpoints
export const createCoachingBreakpoints = (
  animatedPlay: AnimatedPlay,
  breakpointTypes: ('setup' | 'execution' | 'finish' | 'error')[]
): AnimationKeyframe[] => {
  const breakpoints: AnimationKeyframe[] = [];
  
  breakpointTypes.forEach((type, index) => {
    const timestamp = (animatedPlay.duration / breakpointTypes.length) * (index + 0.5);
    const phase = animatedPlay.phases.find(p => 
      timestamp >= p.startTime && timestamp <= p.endTime
    );
    
    const annotations = {
      setup: `Key coaching point: ${phase?.description || 'Formation setup'}`,
      execution: `Watch: Player positioning and timing in this phase`,
      finish: `Result: How the play should conclude successfully`,
      error: `Common mistake: What to avoid in this situation`
    };
    
    breakpoints.push(createKeyframe(
      timestamp,
      [],
      undefined,
      annotations[type]
    ));
  });
  
  return breakpoints;
};

// Export all animated plays
export const ANIMATED_PLAY_TEMPLATES: AnimatedPlay[] = [
  swedish122Trap,
  shlPowerPlayUmbrella,
  breakoutStrongSide,
  overtime3v3Triangle,
  penaltyKillBox1,
  offensiveZoneCycle,
  neutralZoneRegroup,
  faceoffWinPlay,
  emptyNetAttack6v5,
  transitionCounterAttack
];

// Template categories for organization
export const TEMPLATE_CATEGORIES = {
  defensive: [swedish122Trap, penaltyKillBox1],
  offensive: [offensiveZoneCycle, emptyNetAttack6v5],
  'special-teams': [shlPowerPlayUmbrella, penaltyKillBox1, emptyNetAttack6v5],
  'special-situations': [overtime3v3Triangle, faceoffWinPlay],
  transition: [neutralZoneRegroup, transitionCounterAttack],
  breakout: [breakoutStrongSide]
};

// Quick access to popular templates
export const POPULAR_TEMPLATES = [
  swedish122Trap,
  shlPowerPlayUmbrella,
  overtime3v3Triangle,
  offensiveZoneCycle,
  transitionCounterAttack
];

export default ANIMATED_PLAY_TEMPLATES;