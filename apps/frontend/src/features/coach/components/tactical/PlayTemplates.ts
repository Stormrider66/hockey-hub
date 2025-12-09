/**
 * SHL/European Hockey Play Templates Library
 * 
 * Comprehensive collection of authentic Swedish Hockey League (SHL) and European
 * ice hockey tactical play templates. Designed for IIHF rink dimensions (60m x 30m).
 * 
 * Each template includes:
 * - Player positions with proper coordinates for IIHF rink
 * - Movement patterns and passing sequences
 * - Coverage zones and tactical formations
 * - Animation keyframes for dynamic play visualization
 * - Coaching notes and key tactical points
 * 
 * @module PlayTemplates
 * @version 1.0.0
 * @author Hockey Hub Tactical System
 */

import type { AnimationKeyframe } from './AnimationEngine';

// IIHF/SHL regulation rink dimensions (scaled for display)
const RINK_WIDTH = 800;  // 60m scaled
const RINK_HEIGHT = 400; // 30m scaled

/**
 * Player position interface for template definition
 */
export interface TemplatePlayer {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  number: number;
  position: 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';
  rotation?: number;
  action?: 'skating' | 'shooting' | 'passing' | 'checking' | 'goalkeeping';
}

/**
 * Arrow/movement indicator for plays
 */
export interface TemplateArrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'pass' | 'skate' | 'shot' | 'screen' | 'cycle';
  color: number;
  sequence?: number; // Order of execution
}

/**
 * Tactical zone coverage areas
 */
export interface TemplateZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha: number;
  label?: string;
  type?: 'coverage' | 'pressure' | 'support' | 'trap';
}

/**
 * Complete play template structure
 */
export interface PlayTemplate {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'breakout' | 'neutral-zone' | 'faceoff' | 'transition' | 'situational';
  subcategory?: string;
  situation: string;
  formation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Static elements
  players: TemplatePlayer[];
  puck?: { x: number; y: number; possessor?: string };
  arrows: TemplateArrow[];
  zones: TemplateZone[];
  
  // Animation data
  keyframes?: AnimationKeyframe[];
  duration?: number;
  
  // Metadata
  tags: string[];
  coachingNotes: string[];
  keyPoints: string[];
  variations?: string[];
  prerequisites?: string[];
  
  // Origin and authenticity
  origin: 'SHL' | 'Liiga' | 'KHL' | 'DEL' | 'Swiss-A' | 'IIHF' | 'European';
  source?: string; // Team or coach who uses this system
}

/**
 * Comprehensive library of SHL/European hockey play templates
 */
export const PLAY_TEMPLATES: PlayTemplate[] = [

  // ===========================================
  // OFFENSIVE SYSTEMS
  // ===========================================

  {
    id: 'shl-swedish-cycle',
    name: 'Swedish Low Cycle',
    description: 'Classic SHL low cycle emphasizing possession and patience in the offensive zone',
    category: 'offensive',
    subcategory: 'zone-play',
    situation: '5v5 Offensive Zone',
    formation: 'Low Cycle',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 680, y: 320, team: 'home', number: 9, position: 'C' }, // Behind net
      { id: 'h2', x: 640, y: 280, team: 'home', number: 17, position: 'LW' }, // Boards
      { id: 'h3', x: 600, y: 200, team: 'home', number: 14, position: 'RW' }, // Slot
      { id: 'h4', x: 560, y: 320, team: 'home', number: 7, position: 'LD' }, // Point
      { id: 'h5', x: 560, y: 80, team: 'home', number: 22, position: 'RD' }, // Point
      // Away defenders
      { id: 'a1', x: 620, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 660, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 660, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 600, y: 120, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 600, y: 280, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 680, y: 320, possessor: 'h1' },
    arrows: [
      { id: 'a1', startX: 680, startY: 320, endX: 640, endY: 280, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 640, startY: 280, endX: 600, endY: 200, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 600, startY: 200, endX: 560, endY: 320, type: 'pass', color: 0x00FF00, sequence: 3 },
      { id: 'a4', startX: 640, startY: 280, endX: 620, endY: 300, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 620, y: 280, width: 80, height: 80, color: 0xFFFF00, alpha: 0.2, label: 'Cycle Zone' },
    ],
    tags: ['cycle', 'possession', 'patience', 'swedish-style'],
    coachingNotes: [
      'Maintain puck possession at all costs',
      'Use boards for protection and angles',
      'Support player moves to open ice after pass',
      'Defensemen stay active and mobile on points'
    ],
    keyPoints: [
      'Patient buildup - no rushing',
      'Strong side support always available',
      'Weak side player provides outlet option',
      'Cycle until high-percentage shot develops'
    ],
    origin: 'SHL',
    source: 'Frölunda HC / Växjö Lakers',
    keyframes: [
      {
        time: 0,
        players: [
          { id: 'h1', x: 680, y: 320, hasPuck: true }, // Behind net with puck
          { id: 'h2', x: 640, y: 280 }, // Boards
          { id: 'h3', x: 600, y: 200 }, // Slot
          { id: 'h4', x: 560, y: 320 }, // Point
          { id: 'h5', x: 560, y: 80 }, // Point
          // Defenders
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 660, y: 160 }, // D-man
          { id: 'a3', x: 660, y: 240 }, // D-man
          { id: 'a4', x: 620, y: 200 }, // Center
          { id: 'a5', x: 600, y: 280 }, // Winger
        ],
        description: 'Center behind net starts cycle'
      },
      {
        time: 2000,
        players: [
          { id: 'h1', x: 670, y: 300 }, // Moves from behind net
          { id: 'h2', x: 640, y: 280, hasPuck: true }, // Receives pass on boards
          { id: 'h3', x: 620, y: 180 }, // Moves to high slot
          { id: 'h4', x: 560, y: 300 }, // Adjusts position
          { id: 'h5', x: 560, y: 100 }, // Stays high
          // Defenders react
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 650, y: 180 }, // Pressures
          { id: 'a3', x: 660, y: 260 }, // Shifts
          { id: 'a4', x: 630, y: 220 },
          { id: 'a5', x: 640, y: 290 }, // Challenges puck
        ],
        description: 'Pass to winger on boards'
      },
      {
        time: 4000,
        players: [
          { id: 'h1', x: 650, y: 320 }, // Cycles behind net
          { id: 'h2', x: 620, y: 260 }, // After pass
          { id: 'h3', x: 600, y: 200, hasPuck: true }, // Gets puck in slot
          { id: 'h4', x: 560, y: 280 }, // Pinches down
          { id: 'h5', x: 560, y: 120 }, // Covers point
          // Defenders scramble
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 640, y: 190 }, // Covers slot
          { id: 'a3', x: 640, y: 210 }, // Converges on puck
          { id: 'a4', x: 620, y: 200 },
          { id: 'a5', x: 610, y: 250 },
        ],
        description: 'Quick pass to slot'
      },
      {
        time: 6000,
        players: [
          { id: 'h1', x: 680, y: 320 }, // Back behind net
          { id: 'h2', x: 640, y: 280 }, // Back on boards
          { id: 'h3', x: 600, y: 200, isShooter: true, hasPuck: true }, // SHOOTS!
          { id: 'h4', x: 560, y: 320 }, // Point position
          { id: 'h5', x: 560, y: 80 }, // Point position
          // Defenders block
          { id: 'a1', x: 700, y: 200 }, // Goalie ready
          { id: 'a2', x: 660, y: 190 }, // Block shot
          { id: 'a3', x: 660, y: 210 }, // Block shot
          { id: 'a4', x: 640, y: 200 },
          { id: 'a5', x: 620, y: 240 },
        ],
        description: 'Shot from slot!'
      }
    ],
    duration: 6000
  },

  {
    id: 'euro-overload-attack',
    name: 'European Overload Attack',
    description: 'Aggressive overload system focusing on creating numerical advantage in key areas',
    category: 'offensive',
    subcategory: 'zone-play',
    situation: '5v5 Offensive Zone',
    formation: 'Strong Side Overload',
    difficulty: 'advanced',
    players: [
      { id: 'h1', x: 650, y: 200, team: 'home', number: 9, position: 'C' }, // Net front
      { id: 'h2', x: 620, y: 160, team: 'home', number: 17, position: 'LW' }, // Corner
      { id: 'h3', x: 580, y: 140, team: 'home', number: 14, position: 'RW' }, // Half-wall
      { id: 'h4', x: 520, y: 160, team: 'home', number: 7, position: 'LD' }, // Point
      { id: 'h5', x: 450, y: 200, team: 'home', number: 22, position: 'RD' }, // Weak side
      // Away defenders
      { id: 'a1', x: 640, y: 190, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 600, y: 140, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 580, y: 200, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 540, y: 170, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 480, y: 200, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 620, y: 160, possessor: 'h2' },
    arrows: [
      { id: 'a1', startX: 620, startY: 160, endX: 580, endY: 140, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 580, startY: 140, endX: 650, endY: 200, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 650, startY: 200, endX: 680, endY: 200, type: 'shot', color: 0xFF0000, sequence: 3 },
      { id: 'a4', startX: 450, startY: 200, endX: 500, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 580, y: 130, width: 100, height: 90, color: 0xFF6B00, alpha: 0.25, label: 'Overload Zone' },
      { id: 'z2', x: 640, y: 185, width: 50, height: 30, color: 0xFF0000, alpha: 0.2, label: 'Shooting Zone' },
    ],
    tags: ['overload', 'aggressive', 'european', 'numerical-advantage'],
    coachingNotes: [
      'Four players attack strong side to create overload',
      'Quick puck movement essential to maintain advantage',
      'Net-front presence crucial for screens and tips',
      'Weak side defenseman provides safety valve'
    ],
    keyPoints: [
      'Create 4v3 advantage on strong side',
      'Fast, decisive puck movement',
      'Multiple shooting lanes available',
      'Net-front traffic for rebounds'
    ],
    origin: 'European',
    source: 'Multiple European leagues',
    keyframes: [
      {
        time: 0,
        players: [
          { id: 'h1', x: 650, y: 200 }, // Net front
          { id: 'h2', x: 620, y: 160, hasPuck: true }, // Corner with puck
          { id: 'h3', x: 580, y: 140 }, // Half-wall
          { id: 'h4', x: 520, y: 160 }, // Point
          { id: 'h5', x: 450, y: 200 }, // Weak side
          // Defenders
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 640, y: 170 }, // D-man
          { id: 'a3', x: 640, y: 230 }, // D-man  
          { id: 'a4', x: 600, y: 160 }, // Forward
          { id: 'a5', x: 580, y: 200 }, // Forward
        ],
        description: 'Overload setup - corner has puck'
      },
      {
        time: 2000,
        players: [
          { id: 'h1', x: 660, y: 190 }, // Moves to screen
          { id: 'h2', x: 610, y: 150 }, // After pass
          { id: 'h3', x: 580, y: 140, hasPuck: true }, // Half-wall gets puck
          { id: 'h4', x: 530, y: 150 }, // Slides for shot
          { id: 'h5', x: 480, y: 180 }, // Creeps in
          // Defenders shift
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 620, y: 160 }, // Pressures half-wall
          { id: 'a3', x: 650, y: 210 }, // Covers net
          { id: 'a4', x: 590, y: 150 }, // Helps
          { id: 'a5', x: 560, y: 180 }, // Covers point
        ],
        description: 'Quick pass to half-wall'
      },
      {
        time: 4000,
        players: [
          { id: 'h1', x: 670, y: 200, hasPuck: true }, // Gets pass in front
          { id: 'h2', x: 630, y: 160 }, // Supports
          { id: 'h3', x: 590, y: 140 }, // After pass
          { id: 'h4', x: 540, y: 140 }, // Point option
          { id: 'h5', x: 500, y: 200 }, // Backdoor
          // Defenders collapse
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 660, y: 190 }, // Defends net front
          { id: 'a3', x: 660, y: 210 }, // Defends net front
          { id: 'a4', x: 630, y: 180 },
          { id: 'a5', x: 600, y: 200 },
        ],
        description: 'Pass to net front'
      },
      {
        time: 6000,
        players: [
          { id: 'h1', x: 680, y: 200, isShooter: true, hasPuck: true }, // SHOOTS!
          { id: 'h2', x: 640, y: 180 }, // Ready for rebound
          { id: 'h3', x: 600, y: 160 }, // Ready for rebound
          { id: 'h4', x: 520, y: 160 }, // Point coverage
          { id: 'h5', x: 480, y: 220 }, // Backdoor
          // Defenders block
          { id: 'a1', x: 700, y: 200 }, // Goalie saves
          { id: 'a2', x: 675, y: 195 }, // Blocks
          { id: 'a3', x: 675, y: 205 }, // Blocks
          { id: 'a4', x: 650, y: 190 },
          { id: 'a5', x: 620, y: 210 },
        ],
        description: 'Net front shot with traffic!'
      }
    ],
    duration: 6000
  },

  // ===========================================
  // DEFENSIVE SYSTEMS
  // ===========================================

  {
    id: 'swedish-1-2-2-trap',
    name: 'Swedish 1-2-2 Trap',
    description: 'Classic Swedish defensive trap system emphasizing neutral zone control',
    category: 'defensive',
    subcategory: 'neutral-zone',
    situation: '5v5 Neutral Zone',
    formation: '1-2-2 Trap',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 450, y: 200, team: 'home', number: 9, position: 'C' }, // High forward
      { id: 'h2', x: 380, y: 160, team: 'home', number: 17, position: 'LW' }, // Mid left
      { id: 'h3', x: 380, y: 240, team: 'home', number: 14, position: 'RW' }, // Mid right
      { id: 'h4', x: 320, y: 160, team: 'home', number: 7, position: 'LD' }, // Deep left
      { id: 'h5', x: 320, y: 240, team: 'home', number: 22, position: 'RD' }, // Deep right
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Away team in breakout
      { id: 'a1', x: 580, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 540, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 540, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 640, y: 160, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 640, y: 240, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 640, y: 160, possessor: 'a4' },
    arrows: [
      { id: 'a1', startX: 450, startY: 200, endX: 520, endY: 180, type: 'skate', color: 0xFF6600, sequence: 1 }, // Pressure
      { id: 'a2', startX: 380, startY: 160, endX: 400, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 }, // Support
      { id: 'a3', startX: 380, startY: 240, endX: 400, endY: 220, type: 'skate', color: 0x0000FF, sequence: 1 }, // Support
    ],
    zones: [
      { id: 'z1', x: 400, y: 150, width: 120, height: 100, color: 0xFF0000, alpha: 0.15, label: 'Trap Zone', type: 'trap' },
      { id: 'z2', x: 350, y: 140, width: 60, height: 120, color: 0x0000FF, alpha: 0.1, label: 'Support Zone' },
    ],
    tags: ['trap', 'neutral-zone', 'swedish', 'defensive'],
    coachingNotes: [
      'First forward applies pressure on puck carrier',
      'Wings collapse to support and clog passing lanes',
      'Defensemen stay in position - no chasing',
      'Force turnovers in neutral zone, not defensive zone'
    ],
    keyPoints: [
      'Discipline in positioning is crucial',
      'First forward dictates play direction',
      'Wings provide immediate support',
      'Create turnover, then quick transition'
    ],
    origin: 'SHL',
    source: 'Swedish National Team system',
    keyframes: [
      {
        time: 0,
        players: [
          { id: 'h1', x: 450, y: 200 }, // High forward
          { id: 'h2', x: 380, y: 160 }, // Mid left
          { id: 'h3', x: 380, y: 240 }, // Mid right
          { id: 'h4', x: 320, y: 160 }, // Deep left
          { id: 'h5', x: 320, y: 240 }, // Deep right
          // Opponents with puck
          { id: 'a1', x: 580, y: 200 },
          { id: 'a2', x: 540, y: 160 },
          { id: 'a3', x: 540, y: 240 },
          { id: 'a4', x: 640, y: 160, hasPuck: true }, // D-man has puck
          { id: 'a5', x: 640, y: 240 },
        ],
        description: '1-2-2 trap formation'
      },
      {
        time: 2000,
        players: [
          { id: 'h1', x: 520, y: 180 }, // Pressures puck
          { id: 'h2', x: 400, y: 170 }, // Supports
          { id: 'h3', x: 400, y: 230 }, // Supports
          { id: 'h4', x: 340, y: 165 }, // Holds position
          { id: 'h5', x: 340, y: 235 }, // Holds position
          // Opponents try to break out
          { id: 'a1', x: 560, y: 200 },
          { id: 'a2', x: 520, y: 150 },
          { id: 'a3', x: 520, y: 250 },
          { id: 'a4', x: 620, y: 170 }, // Moves with puck
          { id: 'a5', x: 640, y: 240, hasPuck: true }, // Gets pass
        ],
        description: 'Pressure forces pass'
      },
      {
        time: 4000,
        players: [
          { id: 'h1', x: 480, y: 220 }, // Backchecks
          { id: 'h2', x: 420, y: 180 }, // Closes gap
          { id: 'h3', x: 460, y: 240 }, // Pressures new puck carrier
          { id: 'h4', x: 360, y: 170 }, // Supports
          { id: 'h5', x: 380, y: 240 }, // Challenges
          // Turnover happens
          { id: 'a1', x: 540, y: 200 },
          { id: 'a2', x: 500, y: 140 },
          { id: 'a3', x: 500, y: 260 },
          { id: 'a4', x: 600, y: 180 },
          { id: 'a5', x: 600, y: 250 }, // Loses puck
          { id: 'h3', hasPuck: true }, // STEALS PUCK!
        ],
        description: 'Trap creates turnover!'
      },
      {
        time: 6000,
        players: [
          { id: 'h1', x: 600, y: 200 }, // Breaks out
          { id: 'h2', x: 580, y: 160, hasPuck: true, isShooter: true }, // Gets pass and SHOOTS
          { id: 'h3', x: 560, y: 240 }, // After steal
          { id: 'h4', x: 480, y: 180 }, // Joins rush
          { id: 'h5', x: 480, y: 220 }, // Joins rush
          // Opponents backcheck
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 520, y: 160 },
          { id: 'a3', x: 520, y: 240 },
          { id: 'a4', x: 560, y: 180 },
          { id: 'a5', x: 560, y: 220 },
        ],
        description: 'Quick counter-attack shot!'
      }
    ],
    duration: 6000
  },

  {
    id: 'european-aggressive-forecheck',
    name: 'European 2-1-2 Aggressive Forecheck',
    description: 'High-pressure forechecking system popular in European leagues',
    category: 'defensive',
    subcategory: 'forecheck',
    situation: '5v5 Defensive Zone Pressure',
    formation: '2-1-2 Aggressive',
    difficulty: 'advanced',
    players: [
      // Home team forechecking
      { id: 'h1', x: 680, y: 180, team: 'home', number: 9, position: 'C' }, // Primary pressure
      { id: 'h2', x: 650, y: 220, team: 'home', number: 17, position: 'LW' }, // Secondary pressure
      { id: 'h3', x: 600, y: 200, team: 'home', number: 14, position: 'RW' }, // Support
      { id: 'h4', x: 520, y: 180, team: 'home', number: 7, position: 'LD' }, // Active D
      { id: 'h5', x: 520, y: 220, team: 'home', number: 22, position: 'RD' }, // Active D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Away team under pressure
      { id: 'a1', x: 720, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 680, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 680, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 640, y: 180, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 640, y: 220, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 640, y: 180, possessor: 'a4' },
    keyframes: [
      {
        time: 0,
        players: [
          // Home team initial forecheck positions
          { id: 'h1', x: 680, y: 180 }, // F1 pressures puck
          { id: 'h2', x: 650, y: 220 }, // F2 supports
          { id: 'h3', x: 600, y: 200 }, // F3 covers middle
          { id: 'h4', x: 520, y: 180 }, // LD holds blue line
          { id: 'h5', x: 520, y: 220 }, // RD holds blue line
          { id: 'h6', x: 54, y: 200 },
          // Away team with puck
          { id: 'a1', x: 720, y: 200 },
          { id: 'a2', x: 680, y: 160 },
          { id: 'a3', x: 680, y: 240 },
          { id: 'a4', x: 640, y: 180, hasPuck: true }, // LD has puck
          { id: 'a5', x: 640, y: 220 },
        ],
        description: 'F1 pressures puck carrier'
      },
      {
        time: 2000,
        players: [
          // Home team aggressive pressure
          { id: 'h1', x: 660, y: 170 }, // F1 angles off pass
          { id: 'h2', x: 640, y: 210 }, // F2 pressures
          { id: 'h3', x: 590, y: 200 }, // F3 anticipates
          { id: 'h4', x: 540, y: 180 }, // LD pinches slightly
          { id: 'h5', x: 540, y: 220 }, // RD pinches slightly
          { id: 'h6', x: 54, y: 200 },
          // Away team attempts breakout
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 660, y: 150 },
          { id: 'a3', x: 660, y: 250 },
          { id: 'a4', x: 630, y: 170 }, // LD under pressure
          { id: 'a5', x: 640, y: 230, hasPuck: true }, // RD gets puck
        ],
        description: 'Pressure forces pass to RD'
      },
      {
        time: 4000,
        players: [
          // Home team forces turnover
          { id: 'h1', x: 640, y: 200 }, // F1 in position
          { id: 'h2', x: 630, y: 230, hasPuck: true }, // F2 STEALS PUCK!
          { id: 'h3', x: 600, y: 190 }, // F3 supports
          { id: 'h4', x: 560, y: 180 }, // LD moves up
          { id: 'h5', x: 560, y: 220 }, // RD moves up
          { id: 'h6', x: 54, y: 200 },
          // Away team scrambles
          { id: 'a1', x: 680, y: 200 },
          { id: 'a2', x: 650, y: 170 },
          { id: 'a3', x: 650, y: 230 },
          { id: 'a4', x: 620, y: 180 },
          { id: 'a5', x: 630, y: 240 }, // RD loses puck
        ],
        description: 'F2 forces turnover!'
      },
      {
        time: 6000,
        players: [
          // Home team quick strike
          { id: 'h1', x: 660, y: 200, hasPuck: true }, // F1 gets pass
          { id: 'h2', x: 640, y: 220 }, // F2 drives net
          { id: 'h3', x: 620, y: 180 }, // F3 crashes net
          { id: 'h4', x: 580, y: 170 }, // LD joins rush
          { id: 'h5', x: 580, y: 230 }, // RD joins rush
          { id: 'h6', x: 54, y: 200 },
          // Away team defense
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 670, y: 180 },
          { id: 'a3', x: 670, y: 220 },
          { id: 'a4', x: 650, y: 190 },
          { id: 'a5', x: 650, y: 210 },
        ],
        description: 'Quick pass to slot'
      },
      {
        time: 7000,
        players: [
          // Shot on goal!
          { id: 'h1', x: 660, y: 200, hasPuck: true, isShooter: true }, // F1 SHOOTS!
          { id: 'h2', x: 680, y: 220 }, // F2 net front
          { id: 'h3', x: 680, y: 180 }, // F3 net front
          { id: 'h4', x: 600, y: 170 }, // LD ready for rebound
          { id: 'h5', x: 600, y: 230 }, // RD ready for rebound
          { id: 'h6', x: 54, y: 200 },
          // Away team defense
          { id: 'a1', x: 700, y: 200 }, // Goalie saves
          { id: 'a2', x: 680, y: 190 },
          { id: 'a3', x: 680, y: 210 },
          { id: 'a4', x: 660, y: 195 },
          { id: 'a5', x: 660, y: 205 },
        ],
        description: 'Shot from turnover!'
      }
    ],
    duration: 7000,
    arrows: [
      { id: 'a1', startX: 680, startY: 180, endX: 650, endY: 170, type: 'skate', color: 0xFF0000, sequence: 1 }, // Pressure angle
      { id: 'a2', startX: 650, startY: 220, endX: 630, endY: 200, type: 'skate', color: 0xFF0000, sequence: 1 }, // Support pressure
      { id: 'a3', startX: 600, startY: 200, endX: 580, endY: 190, type: 'skate', color: 0x0000FF, sequence: 1 }, // Anticipate pass
      { id: 'a4', startX: 520, startY: 180, endX: 560, endY: 170, type: 'skate', color: 0x0000FF, sequence: 1 }, // Gap control
    ],
    zones: [
      { id: 'z1', x: 620, y: 160, width: 80, height: 80, color: 0xFF0000, alpha: 0.2, label: 'Pressure Zone', type: 'pressure' },
      { id: 'z2', x: 520, y: 160, width: 100, height: 80, color: 0x0000FF, alpha: 0.15, label: 'Support Zone', type: 'support' },
    ],
    tags: ['forecheck', 'aggressive', 'pressure', 'european', '2-1-2'],
    coachingNotes: [
      'Two forwards pressure puck carrier immediately',
      'Third forward reads play and supports',
      'Defensemen stay active and mobile',
      'Force quick decisions under pressure'
    ],
    keyPoints: [
      'Speed and intensity in pressure application',
      'Coordinate pressure with support positioning',
      'Active defensemen prevent easy outlets',
      'Quick transition after turnover'
    ],
    origin: 'European',
    source: 'KHL / Liiga systems'
  },

  // ===========================================
  // SPECIAL TEAMS - POWER PLAY
  // ===========================================

  {
    id: 'shl-umbrella-powerplay',
    name: 'SHL Umbrella Power Play',
    description: 'Classic umbrella formation with strong shooting presence from the point',
    category: 'special-teams',
    subcategory: 'power-play',
    situation: '5v4 Power Play',
    formation: 'Umbrella (1-3-1)',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 680, y: 200, team: 'home', number: 9, position: 'C' }, // Net front
      { id: 'h2', x: 620, y: 160, team: 'home', number: 17, position: 'LW' }, // Half-wall
      { id: 'h3', x: 620, y: 240, team: 'home', number: 14, position: 'RW' }, // Half-wall
      { id: 'h4', x: 520, y: 200, team: 'home', number: 7, position: 'LD' }, // Point (shooter)
      { id: 'h5', x: 560, y: 120, team: 'home', number: 22, position: 'RD' }, // Point support
      // Penalty killers
      { id: 'a1', x: 660, y: 190, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 600, y: 180, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 580, y: 220, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 540, y: 200, team: 'away', number: 44, position: 'LD' },
    ],
    puck: { x: 520, y: 200, possessor: 'h4' },
    arrows: [
      { id: 'a1', startX: 520, startY: 200, endX: 620, endY: 160, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 620, startY: 160, endX: 680, endY: 200, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 680, startY: 200, endX: 746, endY: 200, type: 'shot', color: 0xFF0000, sequence: 3 },
      { id: 'a4', startX: 620, startY: 240, endX: 640, endY: 220, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 600, y: 140, width: 120, height: 120, color: 0x00FF00, alpha: 0.15, label: 'Power Play Zone' },
      { id: 'z2', x: 670, y: 185, width: 30, height: 30, color: 0xFF0000, alpha: 0.3, label: 'Screen Zone' },
    ],
    tags: ['power-play', 'umbrella', 'shooting', 'shl', '5v4'],
    coachingNotes: [
      'Point man controls play tempo and shooting',
      'Half-wall players provide puck movement options',
      'Net-front player creates screens and tips',
      'Constant player movement to create seams'
    ],
    keyframes: [
      {
        time: 0,
        players: [
          { id: 'h1', x: 680, y: 200 }, // Net front
          { id: 'h2', x: 620, y: 160 }, // Half-wall left
          { id: 'h3', x: 620, y: 240 }, // Half-wall right
          { id: 'h4', x: 520, y: 200, hasPuck: true }, // Point center WITH PUCK
          { id: 'h5', x: 560, y: 120 }, // Point support
          // Defenders (5v4 penalty kill)
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 660, y: 170 }, // D-man left
          { id: 'a3', x: 660, y: 230 }, // D-man right
          { id: 'a4', x: 590, y: 200 }, // Center coverage
          { id: 'a5', x: 550, y: 160 }, // Left wing coverage
        ],
        description: 'Initial setup - Point has puck'
      },
      {
        time: 2000,
        players: [
          { id: 'h1', x: 690, y: 190 }, // Move to screen
          { id: 'h2', x: 640, y: 140, hasPuck: true }, // Rotate down - GETS PUCK
          { id: 'h3', x: 600, y: 260 }, // Drop lower
          { id: 'h4', x: 520, y: 180 }, // Adjust for shot lane
          { id: 'h5', x: 580, y: 140 }, // Move to support
          // Defenders adjust (5v4)
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 670, y: 160 }, // D-man pressures half-wall
          { id: 'a3', x: 650, y: 230 }, // D-man slides
          { id: 'a4', x: 620, y: 200 }, // Center supports
          { id: 'a5', x: 570, y: 170 }, // Wing rotates
        ],
        description: 'Pass to half-wall - Create shooting lane'
      },
      {
        time: 4000,
        players: [
          { id: 'h1', x: 685, y: 200 }, // Back to center
          { id: 'h2', x: 600, y: 160 }, // Cycle position
          { id: 'h3', x: 640, y: 240, hasPuck: true }, // Switch sides - GETS PUCK
          { id: 'h4', x: 540, y: 220 }, // Slide right
          { id: 'h5', x: 540, y: 100 }, // Move to left point
          // Defenders rotate (5v4)
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 650, y: 170 }, // D-man rotates
          { id: 'a3', x: 670, y: 240 }, // D-man pressures new puck carrier
          { id: 'a4', x: 610, y: 210 }, // Center shifts
          { id: 'a5', x: 560, y: 240 }, // Wing covers pass lane
        ],
        description: 'Pass across - Rotation and cycle'
      },
      {
        time: 6000,
        players: [
          { id: 'h1', x: 695, y: 200 }, // Strong screen
          { id: 'h2', x: 620, y: 180 }, // Back to half-wall
          { id: 'h3', x: 620, y: 220 }, // Balance formation
          { id: 'h4', x: 520, y: 200, hasPuck: true, isShooter: true }, // POINT SHOT!
          { id: 'h5', x: 560, y: 120 }, // Original support
          // Defenders box out (5v4 - shot block)
          { id: 'a1', x: 700, y: 200 }, // Goalie prepares
          { id: 'a2', x: 680, y: 180 }, // D-man boxes out
          { id: 'a3', x: 680, y: 220 }, // D-man boxes out
          { id: 'a4', x: 640, y: 200 }, // Center fronts shooter
          { id: 'a5', x: 580, y: 200 }, // Wing blocks shot lane
        ],
        description: 'Point shot through screen!'
      },
      {
        time: 8000,
        players: [
          { id: 'h1', x: 680, y: 200 }, // Return to start
          { id: 'h2', x: 620, y: 160 }, // Original position
          { id: 'h3', x: 620, y: 240 }, // Original position
          { id: 'h4', x: 520, y: 200, hasPuck: true }, // Original position - puck back
          { id: 'h5', x: 560, y: 120 }, // Original position
          // Defenders reset (5v4)
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 660, y: 170 }, // D-man left
          { id: 'a3', x: 660, y: 230 }, // D-man right
          { id: 'a4', x: 590, y: 200 }, // Center coverage
          { id: 'a5', x: 550, y: 160 }, // Left wing coverage
        ],
        description: 'Reset positions'
      }
    ],
    duration: 8000,
    keyPoints: [
      'Strong point shot threat opens up other options',
      'Quick puck movement around umbrella',
      'Net-front presence for deflections',
      'Patient buildup until shooting lane opens'
    ],
    origin: 'SHL',
    source: 'Djurgården IF / HV71'
  },

  {
    id: 'european-overload-powerplay',
    name: 'European Low Overload PP',
    description: 'Low overload power play emphasizing close-range scoring chances',
    category: 'special-teams',
    subcategory: 'power-play',
    situation: '5v4 Power Play',
    formation: 'Low Overload (2-2-1)',
    difficulty: 'advanced',
    players: [
      { id: 'h1', x: 680, y: 180, team: 'home', number: 9, position: 'C' }, // Net front
      { id: 'h2', x: 660, y: 140, team: 'home', number: 17, position: 'LW' }, // Corner
      { id: 'h3', x: 620, y: 160, team: 'home', number: 14, position: 'RW' }, // Half-wall
      { id: 'h4', x: 580, y: 180, team: 'home', number: 7, position: 'LD' }, // Point
      { id: 'h5', x: 680, y: 240, team: 'home', number: 22, position: 'RD' }, // Low
      // Penalty killers
      { id: 'a1', x: 650, y: 160, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 620, y: 140, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 640, y: 200, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 600, y: 180, team: 'away', number: 44, position: 'LD' },
    ],
    puck: { x: 660, y: 140, possessor: 'h2' },
    keyframes: [
      {
        time: 0,
        players: [
          // Home team power play setup
          { id: 'h1', x: 680, y: 180 }, // Net front
          { id: 'h2', x: 660, y: 140, hasPuck: true }, // Corner with puck
          { id: 'h3', x: 620, y: 160 }, // Half-wall
          { id: 'h4', x: 580, y: 180 }, // Point
          { id: 'h5', x: 680, y: 240 }, // Low opposite side
          // Penalty killers
          { id: 'a1', x: 700, y: 200 }, // Goalie
          { id: 'a2', x: 650, y: 160 }, // High pressure
          { id: 'a3', x: 640, y: 200 }, // Middle
          { id: 'a4', x: 600, y: 180 }, // Point coverage
        ],
        description: 'Low overload setup'
      },
      {
        time: 2000,
        players: [
          // Puck movement to half-wall
          { id: 'h1', x: 685, y: 185 }, // Shifts for screen
          { id: 'h2', x: 660, y: 140 }, // After pass
          { id: 'h3', x: 620, y: 160, hasPuck: true }, // Half-wall receives
          { id: 'h4', x: 580, y: 180 }, // Point stays
          { id: 'h5', x: 675, y: 235 }, // Adjusts low
          // PK adjusts
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 640, y: 160 }, // Pressures half-wall
          { id: 'a3', x: 650, y: 190 }, // Covers middle
          { id: 'a4', x: 600, y: 175 },
        ],
        description: 'Pass to half-wall'
      },
      {
        time: 4000,
        players: [
          // Quick pass to low player
          { id: 'h1', x: 690, y: 190 }, // Sets screen
          { id: 'h2', x: 665, y: 145 }, // Stays low
          { id: 'h3', x: 620, y: 160 }, // After pass
          { id: 'h4', x: 580, y: 180 }, // Point option
          { id: 'h5', x: 680, y: 240, hasPuck: true }, // Low receives puck
          // PK scrambles
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 650, y: 180 }, // Rotates
          { id: 'a3', x: 660, y: 210 }, // Covers low
          { id: 'a4', x: 610, y: 180 },
        ],
        description: 'Low pass behind net'
      },
      {
        time: 6000,
        players: [
          // Wraparound pass to net front
          { id: 'h1', x: 690, y: 195, hasPuck: true }, // Net front gets puck
          { id: 'h2', x: 670, y: 150 }, // Crashes net
          { id: 'h3', x: 640, y: 170 }, // Moves in
          { id: 'h4', x: 600, y: 180 }, // Point pinches
          { id: 'h5', x: 685, y: 230 }, // After pass
          // PK defense
          { id: 'a1', x: 700, y: 200 },
          { id: 'a2', x: 680, y: 185 }, // Net front defense
          { id: 'a3', x: 680, y: 215 }, // Net front defense
          { id: 'a4', x: 640, y: 190 },
        ],
        description: 'Wraparound to net front'
      },
      {
        time: 8000,
        players: [
          // Shot on goal!
          { id: 'h1', x: 690, y: 195, hasPuck: true, isShooter: true }, // SHOOTS!
          { id: 'h2', x: 685, y: 165 }, // Looks for rebound
          { id: 'h3', x: 685, y: 225 }, // Looks for rebound
          { id: 'h4', x: 620, y: 180 }, // Point coverage
          { id: 'h5', x: 680, y: 240 }, // Back door
          // PK defense
          { id: 'a1', x: 700, y: 200 }, // Goalie saves
          { id: 'a2', x: 685, y: 190 }, // Blocks shot
          { id: 'a3', x: 685, y: 210 }, // Blocks shot
          { id: 'a4', x: 650, y: 200 },
        ],
        description: 'Close range shot!'
      }
    ],
    duration: 8000,
    arrows: [
      { id: 'a1', startX: 660, startY: 140, endX: 620, endY: 160, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 620, startY: 160, endX: 680, endY: 240, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 680, startY: 240, endX: 690, endY: 200, type: 'pass', color: 0x00FF00, sequence: 3 },
      { id: 'a4', startX: 680, startY: 180, endX: 746, endY: 200, type: 'shot', color: 0xFF0000, sequence: 4 },
    ],
    zones: [
      { id: 'z1', x: 620, y: 130, width: 80, height: 120, color: 0x9900FF, alpha: 0.2, label: 'Overload Zone' },
      { id: 'z2', x: 670, y: 170, width: 30, height: 60, color: 0xFF0000, alpha: 0.25, label: 'Scoring Area' },
    ],
    tags: ['power-play', 'overload', 'low', 'european', 'close-range'],
    coachingNotes: [
      'Four players work in tight space below goal line',
      'Constant motion and pick plays to create openings',
      'Point player provides outlet and long-range threat',
      'Focus on high-percentage scoring chances'
    ],
    keyPoints: [
      'Create chaos in tight space around net',
      'Multiple passing options in overload zone',
      'Net-front traffic for screens and deflections',
      'Patient puck movement until opening appears'
    ],
    origin: 'European',
    source: 'Czech / Slovak systems'
  },

  // ===========================================
  // SPECIAL TEAMS - PENALTY KILL
  // ===========================================

  {
    id: 'swedish-box-plus-one',
    name: 'Swedish Box +1 PK',
    description: 'Aggressive penalty kill with one forward pressuring puck carrier',
    category: 'special-teams',
    subcategory: 'penalty-kill',
    situation: '4v5 Penalty Kill',
    formation: 'Box +1 Aggressive',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 540, y: 200, team: 'home', number: 9, position: 'C' }, // Aggressive forward
      { id: 'h2', x: 460, y: 160, team: 'home', number: 17, position: 'LW' }, // Box forward
      { id: 'h3', x: 460, y: 240, team: 'home', number: 14, position: 'LD' }, // Box D
      { id: 'h4', x: 400, y: 200, team: 'home', number: 7, position: 'RD' }, // Box D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Power play team
      { id: 'a1', x: 680, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 620, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 620, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 580, y: 200, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 560, y: 120, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 580, y: 200, possessor: 'a4' },
    arrows: [
      { id: 'a1', startX: 540, startY: 200, endX: 570, endY: 190, type: 'skate', color: 0xFF0000, sequence: 1 }, // Pressure
      { id: 'a2', startX: 460, startY: 160, endX: 480, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 }, // Collapse
      { id: 'a3', startX: 460, startY: 240, endX: 480, endY: 220, type: 'skate', color: 0x0000FF, sequence: 1 }, // Collapse
    ],
    zones: [
      { id: 'z1', x: 420, y: 150, width: 80, height: 100, color: 0x0000FF, alpha: 0.2, label: 'Box Formation' },
      { id: 'z2', x: 560, y: 180, width: 40, height: 40, color: 0xFF0000, alpha: 0.25, label: 'Pressure Zone' },
    ],
    tags: ['penalty-kill', 'box-plus-one', 'aggressive', 'swedish', '4v5'],
    coachingNotes: [
      'One forward pressures puck carrier aggressively',
      'Three remaining players form tight box',
      'Force play to outside, protect slot',
      'Quick clears when puck is recovered'
    ],
    keyPoints: [
      'Aggressive pressure on puck carrier',
      'Disciplined box formation behind pressure',
      'Force low-percentage shots from outside',
      'Clear puck immediately after recovery'
    ],
    origin: 'SHL',
    source: 'Swedish National Team'
  },

  {
    id: 'euro-diamond-pk',
    name: 'European Diamond PK',
    description: 'Diamond penalty kill formation emphasizing lane coverage',
    category: 'special-teams',
    subcategory: 'penalty-kill',
    situation: '4v5 Penalty Kill',
    formation: 'Diamond',
    difficulty: 'advanced',
    players: [
      { id: 'h1', x: 500, y: 200, team: 'home', number: 9, position: 'C' }, // Point of diamond
      { id: 'h2', x: 440, y: 160, team: 'home', number: 17, position: 'LW' }, // Left wing
      { id: 'h3', x: 440, y: 240, team: 'home', number: 14, position: 'RW' }, // Right wing
      { id: 'h4', x: 380, y: 200, team: 'home', number: 7, position: 'LD' }, // Back of diamond
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Power play team
      { id: 'a1', x: 680, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 620, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 620, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 580, y: 160, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 580, y: 240, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 580, y: 160, possessor: 'a4' },
    arrows: [
      { id: 'a1', startX: 500, startY: 200, endX: 520, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 }, // Adjust to play
      { id: 'a2', startX: 440, startY: 160, endX: 460, endY: 170, type: 'skate', color: 0x0000FF, sequence: 1 }, // Cover lane
      { id: 'a3', startX: 440, startY: 240, endX: 450, endY: 220, type: 'skate', color: 0x0000FF, sequence: 1 }, // Support
    ],
    zones: [
      { id: 'z1', x: 380, y: 150, width: 120, height: 100, color: 0x6600FF, alpha: 0.15, label: 'Diamond Formation' },
      { id: 'z2', x: 450, y: 180, width: 60, height: 40, color: 0xFF0000, alpha: 0.2, label: 'Slot Protection' },
    ],
    tags: ['penalty-kill', 'diamond', 'lane-coverage', 'european', '4v5'],
    coachingNotes: [
      'Diamond shape adjusts based on puck position',
      'All four players cover specific lanes',
      'Point player reads play and adjusts positioning',
      'Compact formation protects high-danger areas'
    ],
    keyPoints: [
      'Formation adjusts like accordion to puck movement',
      'Lane coverage prevents cross-ice passes',
      'Slot protection is absolute priority',
      'Patient positioning - let them make mistakes'
    ],
    origin: 'European',
    source: 'Finnish / German systems'
  },

  // ===========================================
  // BREAKOUT SYSTEMS
  // ===========================================

  {
    id: 'shl-strong-side-breakout',
    name: 'SHL Strong Side Breakout',
    description: 'Traditional Swedish strong side breakout with D-to-D option',
    category: 'breakout',
    situation: '5v5 Defensive Zone',
    formation: 'Strong Side',
    difficulty: 'beginner',
    players: [
      { id: 'h1', x: 240, y: 200, team: 'home', number: 9, position: 'C' }, // Center support
      { id: 'h2', x: 180, y: 120, team: 'home', number: 17, position: 'LW' }, // Strong side wing
      { id: 'h3', x: 320, y: 280, team: 'home', number: 14, position: 'RW' }, // Weak side wing
      { id: 'h4', x: 120, y: 160, team: 'home', number: 7, position: 'LD' }, // Puck-moving D
      { id: 'h5', x: 140, y: 240, team: 'home', number: 22, position: 'RD' }, // Support D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Forecheckers
      { id: 'a1', x: 180, y: 180, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 200, y: 140, team: 'away', number: 8, position: 'LW' },
    ],
    puck: { x: 120, y: 160, possessor: 'h4' },
    arrows: [
      { id: 'a1', startX: 120, startY: 160, endX: 180, endY: 120, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 180, startY: 120, endX: 240, endY: 200, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 140, startY: 240, endX: 160, endY: 200, type: 'skate', color: 0x0000FF, sequence: 1 },
      { id: 'a4', startX: 320, startY: 280, endX: 380, endY: 260, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 80, y: 100, width: 180, height: 200, color: 0x00FF00, alpha: 0.1, label: 'Breakout Zone' },
    ],
    tags: ['breakout', 'strong-side', 'traditional', 'shl', 'safe'],
    coachingNotes: [
      'D-man retrieves puck and reads pressure',
      'Strong side wing provides close support',
      'Center moves to support and create outlet',
      'Weak side wing stretches for long pass option'
    ],
    keyPoints: [
      'Simple, high-percentage first pass',
      'Multiple outlet options available',
      'Quick up-ice movement after clean breakout',
      'D-to-D pass available if pressured'
    ],
    origin: 'SHL',
    source: 'Traditional Swedish system'
  },

  {
    id: 'euro-reverse-breakout',
    name: 'European Reverse Breakout',
    description: 'Modern reverse breakout using goaltender as extra player',
    category: 'breakout',
    situation: '5v5 Defensive Zone',
    formation: 'Reverse/Stretch',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 280, y: 200, team: 'home', number: 9, position: 'C' }, // Center high
      { id: 'h2', x: 200, y: 80, team: 'home', number: 17, position: 'LW' }, // Stretch wing
      { id: 'h3', x: 180, y: 320, team: 'home', number: 14, position: 'RW' }, // Low wing
      { id: 'h4', x: 140, y: 160, team: 'home', number: 7, position: 'LD' }, // Puck D
      { id: 'h5', x: 160, y: 240, team: 'home', number: 22, position: 'RD' }, // Support D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' }, // Active goalie
      // Forecheckers
      { id: 'a1', x: 200, y: 180, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 180, y: 140, team: 'away', number: 8, position: 'LW' },
    ],
    puck: { x: 54, y: 200, possessor: 'h6' },
    arrows: [
      { id: 'a1', startX: 54, startY: 200, endX: 160, endY: 240, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 160, startY: 240, endX: 200, endY: 80, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 200, startY: 80, endX: 400, endY: 120, type: 'pass', color: 0x00FF00, sequence: 3 },
      { id: 'a4', startX: 280, startY: 200, endX: 350, endY: 200, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 40, y: 180, width: 40, height: 40, color: 0xFF6600, alpha: 0.3, label: 'Goalie Play Zone' },
      { id: 'z2', x: 180, y: 60, width: 60, height: 60, color: 0x9900FF, alpha: 0.2, label: 'Stretch Target' },
    ],
    tags: ['breakout', 'reverse', 'goalie-play', 'modern', 'stretch'],
    coachingNotes: [
      'Goaltender becomes sixth skater in breakout',
      'Quick reversal catches forecheckers out of position',
      'Stretch pass creates immediate offense',
      'High risk, high reward system'
    ],
    keyPoints: [
      'Goalie must be skilled puck handler',
      'Timing is critical for stretch pass',
      'Creates odd-man rushes when executed properly',
      'Requires excellent communication'
    ],
    origin: 'European',
    source: 'Modern European systems'
  },

  // ===========================================
  // NEUTRAL ZONE SYSTEMS
  // ===========================================

  {
    id: 'shl-left-wing-lock',
    name: 'SHL Left Wing Lock',
    description: 'Swedish adaptation of left wing lock for neutral zone control',
    category: 'neutral-zone',
    situation: '5v5 Neutral Zone',
    formation: 'Left Wing Lock',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 420, y: 200, team: 'home', number: 9, position: 'C' }, // Center
      { id: 'h2', x: 360, y: 120, team: 'home', number: 17, position: 'LW' }, // Left wing lock
      { id: 'h3', x: 380, y: 280, team: 'home', number: 14, position: 'RW' }, // Right wing
      { id: 'h4', x: 320, y: 160, team: 'home', number: 7, position: 'LD' }, // Left D
      { id: 'h5', x: 320, y: 240, team: 'home', number: 22, position: 'RD' }, // Right D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Attacking team
      { id: 'a1', x: 500, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 480, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 480, y: 240, team: 'away', number: 29, position: 'RW' },
    ],
    puck: { x: 500, y: 200, possessor: 'a1' },
    arrows: [
      { id: 'a1', startX: 360, startY: 120, endX: 380, endY: 160, type: 'skate', color: 0xFF6600, sequence: 1 }, // Lock position
      { id: 'a2', startX: 420, startY: 200, endX: 450, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 }, // Pressure
      { id: 'a3', startX: 380, startY: 280, endX: 400, endY: 250, type: 'skate', color: 0x0000FF, sequence: 1 }, // Support
    ],
    zones: [
      { id: 'z1', x: 350, y: 100, width: 50, height: 80, color: 0xFF6600, alpha: 0.2, label: 'Lock Zone' },
      { id: 'z2', x: 380, y: 160, width: 100, height: 80, color: 0x0000FF, alpha: 0.15, label: 'Pressure Zone' },
    ],
    tags: ['neutral-zone', 'left-wing-lock', 'defensive', 'shl', 'clogging'],
    coachingNotes: [
      'Left wing drops back to clog neutral zone',
      'Forces play to right side where support is available',
      'Center and right wing provide pressure',
      'Defensemen stay patient and read play'
    ],
    keyPoints: [
      'Left wing acts like third defenseman',
      'Create 4v3 defensive advantage in neutral zone',
      'Force turnovers in neutral zone',
      'Quick transition after turnover'
    ],
    origin: 'SHL',
    source: 'Swedish adaptation of NHL system'
  },

  // ===========================================
  // FACE-OFF PLAYS
  // ===========================================

  {
    id: 'shl-dzone-faceoff-win',
    name: 'SHL Defensive Zone Face-off Win',
    description: 'Standard SHL defensive zone face-off play for clean breakout',
    category: 'faceoff',
    subcategory: 'defensive-zone',
    situation: '5v5 Defensive Zone Face-off',
    formation: 'Standard Win',
    difficulty: 'beginner',
    players: [
      { id: 'h1', x: 136, y: 108, team: 'home', number: 9, position: 'C' }, // Face-off center
      { id: 'h2', x: 120, y: 90, team: 'home', number: 17, position: 'LW' }, // Wing support
      { id: 'h3', x: 200, y: 160, team: 'home', number: 14, position: 'RW' }, // Outlet wing
      { id: 'h4', x: 80, y: 140, team: 'home', number: 7, position: 'LD' }, // Point D
      { id: 'h5', x: 160, y: 180, team: 'home', number: 22, position: 'RD' }, // Strong side D
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Opposition
      { id: 'a1', x: 136, y: 112, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 120, y: 125, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 200, y: 140, team: 'away', number: 29, position: 'RW' },
    ],
    puck: { x: 136, y: 108 },
    arrows: [
      { id: 'a1', startX: 136, startY: 108, endX: 120, endY: 90, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 120, startY: 90, endX: 160, endY: 180, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 160, startY: 180, endX: 200, endY: 160, type: 'pass', color: 0x00FF00, sequence: 3 },
      { id: 'a4', startX: 200, startY: 160, endX: 300, endY: 200, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 100, y: 80, width: 120, height: 120, color: 0x00FF00, alpha: 0.1, label: 'Breakout Zone' },
    ],
    tags: ['faceoff', 'defensive-zone', 'breakout', 'shl', 'clean-win'],
    coachingNotes: [
      'Center wins puck back to wing',
      'Wing provides clean pickup and control',
      'Quick movement up ice after clean win',
      'D-men provide multiple outlet options'
    ],
    keyPoints: [
      'Clean face-off win is crucial',
      'Quick puck movement prevents pressure',
      'Multiple passing options available',
      'Speed through neutral zone after win'
    ],
    origin: 'SHL',
    source: 'Standard Swedish system'
  },

  {
    id: 'euro-ozone-faceoff-shot',
    name: 'European O-Zone Face-off Shot Play',
    description: 'Direct shot play from offensive zone face-off win',
    category: 'faceoff',
    subcategory: 'offensive-zone',
    situation: '5v5 Offensive Zone Face-off',
    formation: 'Direct Shot',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 664, y: 108, team: 'home', number: 9, position: 'C' }, // Face-off center
      { id: 'h2', x: 640, y: 90, team: 'home', number: 17, position: 'LW' }, // Screen/tip
      { id: 'h3', x: 680, y: 140, team: 'home', number: 14, position: 'RW' }, // Net front
      { id: 'h4', x: 580, y: 80, team: 'home', number: 7, position: 'LD' }, // Shooter
      { id: 'h5', x: 600, y: 160, team: 'home', number: 22, position: 'RD' }, // Point support
      // Opposition
      { id: 'a1', x: 664, y: 112, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 680, y: 125, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 640, y: 140, team: 'away', number: 29, position: 'RW' },
    ],
    puck: { x: 664, y: 108 },
    arrows: [
      { id: 'a1', startX: 664, startY: 108, endX: 580, endY: 80, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 580, startY: 80, endX: 746, endY: 200, type: 'shot', color: 0xFF0000, sequence: 2 },
      { id: 'a3', startX: 640, startY: 90, endX: 660, endY: 150, type: 'skate', color: 0x0000FF, sequence: 1 },
      { id: 'a4', startX: 680, startY: 140, endX: 690, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 660, y: 160, width: 40, height: 60, color: 0xFF0000, alpha: 0.25, label: 'Screen Zone' },
      { id: 'z2', x: 570, y: 70, width: 30, height: 30, color: 0x00FF00, alpha: 0.3, label: 'Shooting Zone' },
    ],
    tags: ['faceoff', 'offensive-zone', 'shot-play', 'european', 'direct'],
    coachingNotes: [
      'Center wins puck cleanly back to D-man',
      'Immediate shot while goalie is screened',
      'Wing and center create traffic in front',
      'Quick shot before defense can react'
    ],
    keyPoints: [
      'Clean face-off win essential',
      'Immediate shot - no hesitation',
      'Screen and tip opportunities available',
      'Rebounds likely with traffic in front'
    ],
    origin: 'European',
    source: 'Continental hockey systems'
  },

  // ===========================================
  // 3v3 OVERTIME STRATEGIES
  // ===========================================

  {
    id: 'shl-3v3-triangle',
    name: 'SHL 3v3 Triangle Control',
    description: 'Swedish 3v3 overtime strategy emphasizing possession and triangle support',
    category: 'situational',
    subcategory: '3v3-overtime',
    situation: '3v3 Overtime',
    formation: 'Triangle',
    difficulty: 'advanced',
    players: [
      { id: 'h1', x: 600, y: 200, team: 'home', number: 9, position: 'C' }, // High forward
      { id: 'h2', x: 520, y: 160, team: 'home', number: 14, position: 'RW' }, // Wide support
      { id: 'h4', x: 460, y: 240, team: 'home', number: 7, position: 'LD' }, // Defenseman
      { id: 'h6', x: 54, y: 200, team: 'home', number: 35, position: 'G' },
      // Opposition 3v3
      { id: 'a1', x: 450, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 380, y: 180, team: 'away', number: 8, position: 'LW' },
      { id: 'a4', x: 320, y: 220, team: 'away', number: 44, position: 'LD' },
    ],
    puck: { x: 520, y: 160, possessor: 'h2' },
    arrows: [
      { id: 'a1', startX: 520, startY: 160, endX: 600, endY: 200, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 600, startY: 200, endX: 460, endY: 240, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 460, startY: 240, endX: 520, endY: 160, type: 'pass', color: 0x00FF00, sequence: 3 },
      { id: 'a4', startX: 600, startY: 200, endX: 650, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 450, y: 150, width: 160, height: 100, color: 0x9900FF, alpha: 0.15, label: 'Triangle Formation' },
    ],
    tags: ['3v3', 'overtime', 'triangle', 'possession', 'shl'],
    coachingNotes: [
      'Maintain triangle shape for constant support',
      'Use speed and space to create odd-man situations',
      'Patient puck movement until opening appears',
      'Defenseman must be mobile and skilled'
    ],
    keyPoints: [
      'Constant motion and support angles',
      'Use full width and length of ice',
      'Create 2v1 situations with triangle',
      'Quick transitions between offense and defense'
    ],
    origin: 'SHL',
    source: 'Modern 3v3 systems'
  },

  // ===========================================
  // EMPTY NET / 6v5 SITUATIONS
  // ===========================================

  {
    id: 'euro-6v5-offensive',
    name: 'European 6v5 Empty Net Attack',
    description: 'Structured 6v5 attack with goalie pulled for extra attacker',
    category: 'situational',
    subcategory: 'empty-net',
    situation: '6v5 Empty Net Offense',
    formation: '1-2-2-1',
    difficulty: 'advanced',
    players: [
      { id: 'h1', x: 680, y: 200, team: 'home', number: 9, position: 'C' }, // Net front
      { id: 'h2', x: 640, y: 140, team: 'home', number: 17, position: 'LW' }, // Wing
      { id: 'h3', x: 640, y: 260, team: 'home', number: 14, position: 'RW' }, // Wing
      { id: 'h4', x: 580, y: 160, team: 'home', number: 7, position: 'LD' }, // Point
      { id: 'h5', x: 580, y: 240, team: 'home', number: 22, position: 'RD' }, // Point
      { id: 'h7', x: 520, y: 200, team: 'home', number: 35, position: 'G' }, // Extra attacker (goalie position)
      // 5 defenders
      { id: 'a1', x: 620, y: 190, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 600, y: 160, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 600, y: 240, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 560, y: 170, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 560, y: 230, team: 'away', number: 55, position: 'RD' },
    ],
    puck: { x: 580, y: 160, possessor: 'h4' },
    arrows: [
      { id: 'a1', startX: 580, startY: 160, endX: 640, endY: 140, type: 'pass', color: 0x00FF00, sequence: 1 },
      { id: 'a2', startX: 640, startY: 140, endX: 680, endY: 200, type: 'pass', color: 0x00FF00, sequence: 2 },
      { id: 'a3', startX: 680, startY: 200, endX: 746, endY: 200, type: 'shot', color: 0xFF0000, sequence: 3 },
      { id: 'a4', startX: 520, startY: 200, endX: 540, endY: 180, type: 'skate', color: 0x0000FF, sequence: 1 },
    ],
    zones: [
      { id: 'z1', x: 620, y: 120, width: 126, height: 160, color: 0xFF6600, alpha: 0.15, label: '6v5 Attack Zone' },
      { id: 'z2', x: 670, y: 185, width: 30, height: 30, color: 0xFF0000, alpha: 0.3, label: 'High Danger' },
    ],
    tags: ['6v5', 'empty-net', 'extra-attacker', 'european', 'desperate'],
    coachingNotes: [
      'Six attackers create multiple options and overloads',
      'Quick puck movement essential to prevent clears',
      'Net-front presence crucial for deflections',
      'Be ready for defensive transition if puck is lost'
    ],
    keyPoints: [
      'Numerical advantage must be maximized',
      'Patience balanced with urgency',
      'Multiple shooting lanes and options',
      'Protect against clear attempts'
    ],
    origin: 'European',
    source: 'Late-game desperation systems'
  },

  {
    id: 'shl-5v6-empty-net-defense',
    name: 'SHL 5v6 Empty Net Defense',
    description: 'Disciplined 5v6 defensive system to protect empty net',
    category: 'situational',
    subcategory: 'empty-net',
    situation: '5v6 Empty Net Defense',
    formation: 'Aggressive Clear',
    difficulty: 'intermediate',
    players: [
      { id: 'h1', x: 480, y: 200, team: 'home', number: 9, position: 'C' }, // Aggressive forward
      { id: 'h2', x: 420, y: 160, team: 'home', number: 17, position: 'LW' }, // Support forward
      { id: 'h3', x: 420, y: 240, team: 'home', number: 14, position: 'RW' }, // Support forward
      { id: 'h4', x: 360, y: 160, team: 'home', number: 7, position: 'LD' }, // Clearing D
      { id: 'h5', x: 360, y: 240, team: 'home', number: 22, position: 'RD' }, // Clearing D
      // 6 attackers
      { id: 'a1', x: 680, y: 200, team: 'away', number: 87, position: 'C' },
      { id: 'a2', x: 640, y: 140, team: 'away', number: 8, position: 'LW' },
      { id: 'a3', x: 640, y: 260, team: 'away', number: 29, position: 'RW' },
      { id: 'a4', x: 580, y: 160, team: 'away', number: 44, position: 'LD' },
      { id: 'a5', x: 580, y: 240, team: 'away', number: 55, position: 'RD' },
      { id: 'a6', x: 520, y: 200, team: 'away', number: 35, position: 'G' }, // Extra attacker
    ],
    puck: { x: 580, y: 160, possessor: 'a4' },
    arrows: [
      { id: 'a1', startX: 480, startY: 200, endX: 540, endY: 170, type: 'skate', color: 0xFF0000, sequence: 1 }, // Pressure
      { id: 'a2', startX: 420, startY: 160, endX: 450, endY: 150, type: 'skate', color: 0x0000FF, sequence: 1 }, // Support
      { id: 'a3', startX: 360, startY: 160, endX: 100, endY: 100, type: 'skate', color: 0x00FF00, sequence: 2 }, // Clear target
    ],
    zones: [
      { id: 'z1', x: 350, y: 150, width: 150, height: 100, color: 0xFF0000, alpha: 0.15, label: 'Pressure Zone' },
      { id: 'z2', x: 50, y: 50, width: 100, height: 100, color: 0x00FF00, alpha: 0.2, label: 'Clear Target' },
    ],
    tags: ['5v6', 'empty-net', 'defense', 'clearing', 'shl'],
    coachingNotes: [
      'Aggressive pressure on puck carrier',
      'Quick clears when puck is gained',
      'Protect slot and shooting lanes',
      'Communication crucial with no goalie'
    ],
    keyPoints: [
      'Force quick decisions under pressure',
      'Clear puck immediately when gained',
      'Protect most dangerous shooting areas',
      'Stay disciplined despite being outnumbered'
    ],
    origin: 'SHL',
    source: 'Swedish empty net systems'
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: PlayTemplate['category']): PlayTemplate[] {
  return PLAY_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get templates by difficulty level
 */
export function getTemplatesByDifficulty(difficulty: PlayTemplate['difficulty']): PlayTemplate[] {
  return PLAY_TEMPLATES.filter(template => template.difficulty === difficulty);
}

/**
 * Get templates by origin/league
 */
export function getTemplatesByOrigin(origin: PlayTemplate['origin']): PlayTemplate[] {
  return PLAY_TEMPLATES.filter(template => template.origin === origin);
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): PlayTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return PLAY_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.situation.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PlayTemplate | undefined {
  return PLAY_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return [...new Set(PLAY_TEMPLATES.map(template => template.category))];
}

/**
 * Get all available tags
 */
export function getAllTags(): string[] {
  const allTags = PLAY_TEMPLATES.flatMap(template => template.tags);
  return [...new Set(allTags)].sort();
}

/**
 * Template statistics
 */
export function getTemplateStats() {
  return {
    total: PLAY_TEMPLATES.length,
    byCategory: getAllCategories().reduce((acc, category) => {
      acc[category] = getTemplatesByCategory(category as PlayTemplate['category']).length;
      return acc;
    }, {} as Record<string, number>),
    byDifficulty: {
      beginner: getTemplatesByDifficulty('beginner').length,
      intermediate: getTemplatesByDifficulty('intermediate').length,
      advanced: getTemplatesByDifficulty('advanced').length
    },
    byOrigin: {
      SHL: getTemplatesByOrigin('SHL').length,
      European: getTemplatesByOrigin('European').length,
      Liiga: getTemplatesByOrigin('Liiga').length,
      KHL: getTemplatesByOrigin('KHL').length,
      DEL: getTemplatesByOrigin('DEL').length,
      'Swiss-A': getTemplatesByOrigin('Swiss-A').length,
      IIHF: getTemplatesByOrigin('IIHF').length
    }
  };
}

export default PLAY_TEMPLATES;