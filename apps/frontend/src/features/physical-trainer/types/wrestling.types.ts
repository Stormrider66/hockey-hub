/**
 * Wrestling Workout Types
 * 
 * Type definitions for wrestling-specific workouts with round-based structure,
 * partner assignments, and technique-focused training.
 */

import { BaseEntity, Player } from './index';

// Core wrestling workout types
export type TechniqueType = 
  | 'takedown'
  | 'escape'
  | 'reversal'
  | 'pin'
  | 'groundControl'
  | 'conditioning'
  | 'warmup'
  | 'cooldown';

export type IntensityLevel = 
  | 'technique'    // 50% - focus on form and technique
  | 'drilling'     // 70% - controlled repetition
  | 'live'         // 90% - full-speed sparring
  | 'competition'; // 100% - match simulation

export type WeightClass = 
  | 'below_57'     // Below 57kg
  | '57_61'        // 57-61kg
  | '61_65'        // 61-65kg
  | '65_70'        // 65-70kg
  | '70_74'        // 70-74kg
  | '74_79'        // 74-79kg
  | '79_86'        // 79-86kg
  | '86_92'        // 86-92kg
  | '92_97'        // 92-97kg
  | '97_125'       // 97-125kg
  | 'above_125';   // Above 125kg

export interface WrestlingTechnique {
  id: string;
  name: string;
  type: TechniqueType;
  category: 'standing' | 'ground' | 'transition';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  keyPoints: string[];
  commonMistakes: string[];
  variations: string[];
  videoUrl?: string;
  prerequisites?: string[];
  safetyNotes: string[];
  partnerRequirements: {
    minExperience: 'beginner' | 'intermediate' | 'advanced';
    weightDifference: number; // Max kg difference
    skillLevel: 'same' | 'higher' | 'lower' | 'any';
  };
}

export interface WrestlingRound {
  id: string;
  name: string;
  type: 'warmup' | 'technique' | 'drilling' | 'live' | 'conditioning' | 'cooldown';
  duration: number; // in seconds
  restPeriod: number; // in seconds
  intensity: IntensityLevel;
  techniques: WrestlingTechnique[];
  instructions: string;
  partnerRotation: boolean;
  scoring: {
    trackAttempts: boolean;
    trackSuccesses: boolean;
    trackTechnique: boolean; // 1-10 scale
  };
  safetyProtocol: {
    tapOutAllowed: boolean;
    timeLimit: boolean;
    supervision: 'coach' | 'experienced_wrestler' | 'none';
  };
  equipment: string[];
  matSpace: 'full' | 'half' | 'quarter'; // Mat area required
}

export interface PartnerPairing {
  id: string;
  player1: Player;
  player2: Player;
  weightDifference: number;
  experienceMatch: 'perfect' | 'good' | 'acceptable' | 'challenging';
  compatibility: number; // 0-100%
  notes?: string;
  restrictions?: string[];
}

export interface WrestlingProgram {
  id: string;
  name: string;
  description: string;
  focus: 'technique' | 'conditioning' | 'competition' | 'mixed';
  totalDuration: number; // in minutes
  rounds: WrestlingRound[];
  partnerPairings: PartnerPairing[];
  matRequirements: {
    mats: number;
    size: 'competition' | 'practice' | 'mini';
    spacing: number; // meters between mats
  };
  safetyChecklist: string[];
  progressionNotes: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface WrestlingWorkoutSession extends BaseEntity {
  id: string;
  title: string;
  type: 'wrestling';
  program: WrestlingProgram;
  scheduledDate: string;
  duration: number;
  location: string;
  teamId?: string;
  playerIds: string[];
  coachId: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  intensity: IntensityLevel;
  partnerPairings: PartnerPairing[];
  equipment: string[];
  notes?: string;
  safetyBriefing: string;
  weightClassGroups?: {
    [weightClass: string]: string[]; // weight class -> player IDs
  };
}

export interface WrestlingExecution extends BaseEntity {
  workoutSessionId: string;
  playerId: string;
  partnerId?: string;
  currentRound: number;
  completedRounds: number;
  roundExecutions: RoundExecution[];
  overallPerformance: {
    technicalScore: number; // 1-10
    intensity: number; // 1-10
    endurance: number; // 1-10
    attitude: number; // 1-10
  };
  injuryReports: InjuryReport[];
  coachFeedback?: string;
}

export interface RoundExecution extends BaseEntity {
  roundId: string;
  roundName: string;
  startTime: string;
  endTime?: string;
  partnerId?: string;
  techniques: TechniqueExecution[];
  performance: {
    attempts: number;
    successes: number;
    technicalScore?: number; // 1-10
    intensity?: number; // 1-10
  };
  notes?: string;
  tapOuts: number;
  safetyIncidents: SafetyIncident[];
}

export interface TechniqueExecution {
  techniqueId: string;
  techniqueName: string;
  attempts: number;
  successes: number;
  quality: number; // 1-10
  notes?: string;
  videoClips?: string[]; // URLs to recorded clips
}

export interface SafetyIncident {
  id: string;
  type: 'minor' | 'moderate' | 'serious';
  description: string;
  playersInvolved: string[];
  timestamp: string;
  actionTaken: string;
  reportedBy: string;
}

export interface InjuryReport {
  id: string;
  playerId: string;
  type: 'strain' | 'sprain' | 'cut' | 'bruise' | 'other';
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'serious';
  description: string;
  timestamp: string;
  treatmentGiven: string;
  returnToActivity: boolean;
  medicalFollowupRequired: boolean;
}

// Wrestling technique library
export interface WrestlingTechniqueLibrary {
  categories: {
    [category: string]: WrestlingTechnique[];
  };
  progressions: {
    [level: string]: string[]; // technique IDs for each level
  };
  combinations: TechniqueCombination[];
}

export interface TechniqueCombination {
  id: string;
  name: string;
  techniques: string[]; // technique IDs in sequence
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  timing: number[]; // seconds for each technique
}

// Partner assignment algorithms
export interface PartnerAssignmentConfig {
  strategy: 'weight_based' | 'skill_based' | 'mixed' | 'random';
  maxWeightDifference: number;
  allowSkillMismatch: boolean;
  rotationFrequency: number; // rounds between rotations
  avoidRepeats: boolean;
}

export interface WeightClassGroup {
  weightClass: WeightClass;
  players: Player[];
  averageWeight: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Bulk mode support
export interface BulkWrestlingSession {
  matAssignments: MatAssignment[];
  totalMats: number;
  simultaneousSessions: number;
  sharedEquipment: string[];
  coachAssignments: CoachAssignment[];
  rotationSchedule: RotationSchedule;
}

export interface MatAssignment {
  matNumber: number;
  sessionId: string;
  playerIds: string[];
  coachId: string;
  program: WrestlingProgram;
  startTime: string;
  estimatedEndTime: string;
}

export interface CoachAssignment {
  coachId: string;
  coachName: string;
  mats: number[];
  maxConcurrentSessions: number;
  specializations: TechniqueType[];
  safetyTraining: boolean;
}

export interface RotationSchedule {
  intervals: RotationInterval[];
  totalDuration: number;
  restPeriods: number[];
}

export interface RotationInterval {
  startTime: number; // minutes from session start
  duration: number; // minutes
  action: 'rotate_partners' | 'rotate_mats' | 'technique_change' | 'rest';
  description: string;
}

// Wrestling workout templates
export interface WrestlingTemplate extends BaseEntity {
  name: string;
  description: string;
  program: WrestlingProgram;
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  targetAge: 'youth' | 'junior' | 'senior' | 'all';
  estimatedDuration: number;
  requiredEquipment: string[];
  matRequirements: number;
  maxParticipants: number;
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  reviews: TemplateReview[];
}

export interface TemplateReview {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  helpful: number; // number of helpful votes
}

// Analytics and reporting
export interface WrestlingAnalytics {
  playerId: string;
  sessionId: string;
  technicalGrowth: {
    [techniqueType: string]: {
      successRate: number;
      improvement: number;
      attempts: number;
    };
  };
  physicalPerformance: {
    endurance: number;
    strength: number;
    flexibility: number;
    speed: number;
  };
  mentalAttributes: {
    aggression: number;
    technique: number;
    strategy: number;
    composure: number;
  };
  matchSimulation: {
    wins: number;
    losses: number;
    draws: number;
    averageMatchLength: number;
  };
}

// Equipment and facility requirements
export const WRESTLING_EQUIPMENT = {
  REQUIRED: [
    'Wrestling mats',
    'Mat sanitizer',
    'First aid kit',
    'Timer/stopwatch',
    'Whistle'
  ],
  OPTIONAL: [
    'Wrestling shoes',
    'Headgear',
    'Knee pads',
    'Video camera',
    'Scoreboard',
    'Mat tape',
    'Towels'
  ],
  SAFETY: [
    'Mouth guards',
    'Athletic tape',
    'Ice packs',
    'Stretcher',
    'Emergency contact list'
  ]
} as const;

export const TECHNIQUE_LIBRARY: WrestlingTechniqueLibrary = {
  categories: {
    standing: [
      {
        id: 'single_leg',
        name: 'Single Leg Takedown',
        type: 'takedown',
        category: 'standing',
        difficulty: 'intermediate',
        description: 'Basic single leg attack from neutral position',
        keyPoints: ['Level change', 'Head placement', 'Drive through'],
        commonMistakes: ['Head too high', 'No follow-through', 'Poor timing'],
        variations: ['High single', 'Low single', 'Single leg sweep'],
        safetyNotes: ['Control descent', 'Protect partner\'s knee'],
        partnerRequirements: {
          minExperience: 'beginner',
          weightDifference: 15,
          skillLevel: 'any'
        }
      },
      {
        id: 'double_leg',
        name: 'Double Leg Takedown',
        type: 'takedown',
        category: 'standing',
        difficulty: 'beginner',
        description: 'Classic double leg attack with proper setup',
        keyPoints: ['Penetration step', 'Head positioning', 'Lift and drive'],
        commonMistakes: ['Reaching', 'No setup', 'Poor head position'],
        variations: ['Blast double', 'High double', 'Low double'],
        safetyNotes: ['Control the fall', 'Don\'t spike partner'],
        partnerRequirements: {
          minExperience: 'beginner',
          weightDifference: 20,
          skillLevel: 'any'
        }
      }
    ],
    ground: [
      {
        id: 'half_nelson',
        name: 'Half Nelson',
        type: 'pin',
        category: 'ground',
        difficulty: 'beginner',
        description: 'Basic pinning combination from top position',
        keyPoints: ['Deep underhook', 'Head control', 'Hip pressure'],
        commonMistakes: ['Shallow underhook', 'No hip pressure', 'Wrong angle'],
        variations: ['Near side', 'Far side', 'Power half'],
        safetyNotes: ['Don\'t crank neck', 'Allow tap outs'],
        partnerRequirements: {
          minExperience: 'beginner',
          weightDifference: 10,
          skillLevel: 'any'
        }
      }
    ],
    transition: [
      {
        id: 'switch',
        name: 'Switch Escape',
        type: 'escape',
        category: 'transition',
        difficulty: 'intermediate',
        description: 'Basic escape from bottom position using switch technique',
        keyPoints: ['Hip movement', 'Hand placement', 'Timing'],
        commonMistakes: ['No hip', 'Poor hand position', 'Too slow'],
        variations: ['Traditional switch', 'Sit-out switch'],
        safetyNotes: ['Control opponent\'s weight', 'Don\'t force'],
        partnerRequirements: {
          minExperience: 'intermediate',
          weightDifference: 15,
          skillLevel: 'same'
        }
      }
    ]
  },
  progressions: {
    beginner: ['double_leg', 'half_nelson'],
    intermediate: ['single_leg', 'switch'],
    advanced: ['single_leg', 'switch', 'half_nelson']
  },
  combinations: [
    {
      id: 'setup_single_leg',
      name: 'Setup to Single Leg',
      techniques: ['fake_shot', 'single_leg'],
      difficulty: 'intermediate',
      description: 'Use fake shot to set up single leg attack',
      timing: [2, 3] // seconds for each technique
    }
  ]
};

// Types are already exported individually above
// Constants can be imported directly by name