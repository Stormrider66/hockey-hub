/**
 * Default player positions for hockey tactical board
 */

export interface Player {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  number: number;
  position: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
  rotation?: number;
  speed?: number;
}

/**
 * Create default players for home team in standard formation
 * Positions are based on ice rink dimensions (800x400)
 */
export const createDefaultHomePlayers = (): Player[] => [
  {
    id: 'home-c',
    x: 400,  // Center ice
    y: 200,  // Middle
    team: 'home',
    number: 11,
    position: 'C',
    rotation: 0,
    speed: 0
  },
  {
    id: 'home-lw',
    x: 300,  // Left wing
    y: 150,
    team: 'home',
    number: 17,
    position: 'LW',
    rotation: 0,
    speed: 0
  },
  {
    id: 'home-rw',
    x: 300,  // Right wing
    y: 250,
    team: 'home',
    number: 21,
    position: 'RW',
    rotation: 0,
    speed: 0
  },
  {
    id: 'home-ld',
    x: 200,  // Left defense
    y: 130,
    team: 'home',
    number: 44,
    position: 'LD',
    rotation: 0,
    speed: 0
  },
  {
    id: 'home-rd',
    x: 200,  // Right defense
    y: 270,
    team: 'home',
    number: 55,
    position: 'RD',
    rotation: 0,
    speed: 0
  },
  {
    id: 'home-g',
    x: 50,   // Goalie
    y: 200,
    team: 'home',
    number: 30,
    position: 'G',
    rotation: 0,
    speed: 0
  }
];

/**
 * Create default players for away team in standard formation
 * Positions are mirrored from home team
 */
export const createDefaultAwayPlayers = (): Player[] => [
  {
    id: 'away-c',
    x: 400,  // Center ice
    y: 200,  // Middle
    team: 'away',
    number: 19,
    position: 'C',
    rotation: 180,
    speed: 0
  },
  {
    id: 'away-lw',
    x: 500,  // Left wing (from away perspective)
    y: 250,
    team: 'away',
    number: 9,
    position: 'LW',
    rotation: 180,
    speed: 0
  },
  {
    id: 'away-rw',
    x: 500,  // Right wing (from away perspective)
    y: 150,
    team: 'away',
    number: 23,
    position: 'RW',
    rotation: 180,
    speed: 0
  },
  {
    id: 'away-ld',
    x: 600,  // Left defense (from away perspective)
    y: 270,
    team: 'away',
    number: 5,
    position: 'LD',
    rotation: 180,
    speed: 0
  },
  {
    id: 'away-rd',
    x: 600,  // Right defense (from away perspective)
    y: 130,
    team: 'away',
    number: 27,
    position: 'RD',
    rotation: 180,
    speed: 0
  },
  {
    id: 'away-g',
    x: 750,  // Goalie
    y: 200,
    team: 'away',
    number: 1,
    position: 'G',
    rotation: 180,
    speed: 0
  }
];

/**
 * Get all default players for both teams
 */
export const getDefaultPlayers = (): Player[] => {
  return [...createDefaultHomePlayers(), ...createDefaultAwayPlayers()];
};

/**
 * Get players for a specific formation
 */
export const getFormationPlayers = (formation: string, team: 'home' | 'away' = 'home'): Player[] => {
  // Add more formations as needed
  switch (formation) {
    case '2-1-2':
      return get212Formation(team);
    case '1-2-2':
      return get122Formation(team);
    case '2-3':
      return get23Formation(team);
    default:
      return team === 'home' ? createDefaultHomePlayers() : createDefaultAwayPlayers();
  }
};

// Formation: 2-1-2 (Two forwards, one center, two defensemen)
const get212Formation = (team: 'home' | 'away'): Player[] => {
  const isHome = team === 'home';
  const xMultiplier = isHome ? 1 : -1;
  const xOffset = isHome ? 0 : 800;
  
  return [
    {
      id: `${team}-lw`,
      x: xOffset + (xMultiplier * 250),
      y: 140,
      team,
      number: isHome ? 17 : 9,
      position: 'LW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-c`,
      x: xOffset + (xMultiplier * 300),
      y: 200,
      team,
      number: isHome ? 11 : 19,
      position: 'C',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rw`,
      x: xOffset + (xMultiplier * 250),
      y: 260,
      team,
      number: isHome ? 21 : 23,
      position: 'RW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-ld`,
      x: xOffset + (xMultiplier * 150),
      y: 130,
      team,
      number: isHome ? 44 : 5,
      position: 'LD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rd`,
      x: xOffset + (xMultiplier * 150),
      y: 270,
      team,
      number: isHome ? 55 : 27,
      position: 'RD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-g`,
      x: xOffset + (xMultiplier * 50),
      y: 200,
      team,
      number: isHome ? 30 : 1,
      position: 'G',
      rotation: isHome ? 0 : 180,
      speed: 0
    }
  ];
};

// Formation: 1-2-2 (One forward, two centers, two defensemen)
const get122Formation = (team: 'home' | 'away'): Player[] => {
  const isHome = team === 'home';
  const xMultiplier = isHome ? 1 : -1;
  const xOffset = isHome ? 0 : 800;
  
  return [
    {
      id: `${team}-c`,
      x: xOffset + (xMultiplier * 350),
      y: 200,
      team,
      number: isHome ? 11 : 19,
      position: 'C',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-lw`,
      x: xOffset + (xMultiplier * 280),
      y: 140,
      team,
      number: isHome ? 17 : 9,
      position: 'LW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rw`,
      x: xOffset + (xMultiplier * 280),
      y: 260,
      team,
      number: isHome ? 21 : 23,
      position: 'RW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-ld`,
      x: xOffset + (xMultiplier * 180),
      y: 120,
      team,
      number: isHome ? 44 : 5,
      position: 'LD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rd`,
      x: xOffset + (xMultiplier * 180),
      y: 280,
      team,
      number: isHome ? 55 : 27,
      position: 'RD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-g`,
      x: xOffset + (xMultiplier * 50),
      y: 200,
      team,
      number: isHome ? 30 : 1,
      position: 'G',
      rotation: isHome ? 0 : 180,
      speed: 0
    }
  ];
};

// Formation: 2-3 (Two forwards, three defensemen)
const get23Formation = (team: 'home' | 'away'): Player[] => {
  const isHome = team === 'home';
  const xMultiplier = isHome ? 1 : -1;
  const xOffset = isHome ? 0 : 800;
  
  return [
    {
      id: `${team}-lw`,
      x: xOffset + (xMultiplier * 320),
      y: 140,
      team,
      number: isHome ? 17 : 9,
      position: 'LW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rw`,
      x: xOffset + (xMultiplier * 320),
      y: 260,
      team,
      number: isHome ? 21 : 23,
      position: 'RW',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-c`,
      x: xOffset + (xMultiplier * 220),
      y: 200,
      team,
      number: isHome ? 11 : 19,
      position: 'C',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-ld`,
      x: xOffset + (xMultiplier * 150),
      y: 110,
      team,
      number: isHome ? 44 : 5,
      position: 'LD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-rd`,
      x: xOffset + (xMultiplier * 150),
      y: 290,
      team,
      number: isHome ? 55 : 27,
      position: 'RD',
      rotation: isHome ? 0 : 180,
      speed: 0
    },
    {
      id: `${team}-g`,
      x: xOffset + (xMultiplier * 50),
      y: 200,
      team,
      number: isHome ? 30 : 1,
      position: 'G',
      rotation: isHome ? 0 : 180,
      speed: 0
    }
  ];
};