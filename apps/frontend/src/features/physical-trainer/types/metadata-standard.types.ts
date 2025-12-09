/**
 * Standard Metadata Types for Unified Workout System
 * Provides consistent metadata structure across all workout types
 */

// Enums for standardized values
export enum WorkoutDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ELITE = 'elite',
  CUSTOM = 'custom'
}

export enum SkillLevel {
  NOVICE = 'novice',
  DEVELOPING = 'developing',
  PROFICIENT = 'proficient',
  EXPERT = 'expert',
  MASTER = 'master'
}

export enum FocusArea {
  // Physical
  STRENGTH = 'strength',
  POWER = 'power',
  ENDURANCE = 'endurance',
  SPEED = 'speed',
  AGILITY = 'agility',
  FLEXIBILITY = 'flexibility',
  BALANCE = 'balance',
  COORDINATION = 'coordination',
  
  // Body Parts
  UPPER_BODY = 'upper_body',
  LOWER_BODY = 'lower_body',
  CORE = 'core',
  FULL_BODY = 'full_body',
  
  // Sport Specific
  SKATING = 'skating',
  SHOOTING = 'shooting',
  PASSING = 'passing',
  CHECKING = 'checking',
  GOALTENDING = 'goaltending',
  
  // Tactical
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  TRANSITION = 'transition',
  
  // Recovery
  RECOVERY = 'recovery',
  INJURY_PREVENTION = 'injury_prevention',
  REHABILITATION = 'rehabilitation'
}

export enum VisibilityLevel {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public',
  SHARED_LINK = 'shared_link'
}

export enum WorkoutStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum Season {
  PRE_SEASON = 'pre_season',
  IN_SEASON = 'in_season',
  POST_SEASON = 'post_season',
  OFF_SEASON = 'off_season',
  YEAR_ROUND = 'year_round'
}

// Core metadata interface
export interface StandardMetadata {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  tags: string[];
  version: number;
  
  // Classification
  category: string;
  difficulty: WorkoutDifficulty;
  level: SkillLevel;
  focus: FocusArea[];
  season?: Season;
  
  // Performance Metrics
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  intensityScore: number; // 1-10
  complexityScore: number; // 1-10
  fatigueRating?: number; // 1-10
  
  // Equipment & Resources
  equipment: string[];
  space: string; // e.g., 'gym', 'field', 'ice', 'home'
  groupSize?: {
    min: number;
    max: number;
    optimal: number;
  };
  
  // Usage & Analytics
  usageCount: number;
  popularityScore: number; // 0-100
  averageRating?: number; // 1-5
  completionRate?: number; // 0-100%
  lastUsed?: string; // ISO date
  favoriteCount?: number;
  
  // Timestamps
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  publishedAt?: string; // ISO date
  scheduledFor?: string; // ISO date
  expiresAt?: string; // ISO date
  
  // Ownership & Permissions
  createdBy: string; // user ID
  updatedBy?: string; // user ID
  organizationId: string;
  teamId?: string;
  visibility: VisibilityLevel;
  sharedWith?: string[]; // user/team IDs
  
  // Status & Workflow
  status: WorkoutStatus;
  approvedBy?: string; // user ID
  approvalDate?: string; // ISO date
  
  // Search & Discovery
  keywords?: string[];
  relatedWorkouts?: string[]; // workout IDs
  prerequisites?: string[]; // workout IDs
  progression?: {
    previous?: string; // workout ID
    next?: string; // workout ID
  };
  
  // Customization
  isTemplate: boolean;
  templateId?: string;
  customFields?: Record<string, any>;
  
  // Compliance & Safety
  medicalClearanceRequired?: boolean;
  ageRestrictions?: {
    min?: number;
    max?: number;
  };
  warnings?: string[];
  contraindications?: string[];
}

// Extended metadata for specific contexts
export interface EnhancedMetadata extends StandardMetadata {
  // Performance Tracking
  personalRecords?: {
    userId: string;
    value: number;
    unit: string;
    date: string;
  }[];
  
  // Feedback & Reviews
  reviews?: {
    userId: string;
    rating: number;
    comment?: string;
    date: string;
  }[];
  
  // Modification History
  history?: {
    version: number;
    changedBy: string;
    changeDate: string;
    changeDescription: string;
    previousValues?: Partial<StandardMetadata>;
  }[];
  
  // Scheduling & Recurrence
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    exceptions?: string[]; // dates to skip
  };
  
  // Integration
  externalReferences?: {
    system: string;
    id: string;
    url?: string;
  }[];
  
  // Analytics
  analytics?: {
    avgCompletionTime?: number;
    avgHeartRate?: number;
    avgCaloriesBurned?: number;
    commonModifications?: string[];
    dropoffPoints?: {
      time: number;
      percentage: number;
    }[];
  };
}

// Partial metadata for updates
export type PartialMetadata = Partial<StandardMetadata>;

// Metadata for different workout types
export interface WorkoutTypeMetadata<T = any> extends StandardMetadata {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'recovery' | 'assessment';
  typeSpecificData?: T;
}

// Search and filter metadata
export interface MetadataFilters {
  categories?: string[];
  difficulties?: WorkoutDifficulty[];
  levels?: SkillLevel[];
  focusAreas?: FocusArea[];
  equipment?: string[];
  minDuration?: number;
  maxDuration?: number;
  minIntensity?: number;
  maxIntensity?: number;
  tags?: string[];
  createdBy?: string;
  teamId?: string;
  status?: WorkoutStatus[];
  season?: Season[];
  searchTerm?: string;
}

// Metadata validation rules
export interface MetadataValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: RegExp;
  };
  description: {
    maxLength: number;
  };
  tags: {
    maxCount: number;
    maxLength: number;
  };
  duration: {
    min: number;
    max: number;
  };
  intensity: {
    min: number;
    max: number;
  };
  complexity: {
    min: number;
    max: number;
  };
}

// Default validation rules
export const DEFAULT_VALIDATION_RULES: MetadataValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/
  },
  description: {
    maxLength: 500
  },
  tags: {
    maxCount: 10,
    maxLength: 30
  },
  duration: {
    min: 5,
    max: 480 // 8 hours
  },
  intensity: {
    min: 1,
    max: 10
  },
  complexity: {
    min: 1,
    max: 10
  }
};

// Metadata templates for quick creation
export interface MetadataTemplate {
  id: string;
  name: string;
  description: string;
  metadata: Partial<StandardMetadata>;
}

// Common metadata templates
export const METADATA_TEMPLATES: Record<string, MetadataTemplate> = {
  beginnerStrength: {
    id: 'beginner-strength',
    name: 'Beginner Strength',
    description: 'Template for beginner strength workouts',
    metadata: {
      category: 'strength',
      difficulty: WorkoutDifficulty.BEGINNER,
      level: SkillLevel.NOVICE,
      focus: [FocusArea.STRENGTH, FocusArea.FULL_BODY],
      intensityScore: 5,
      complexityScore: 3,
      space: 'gym'
    }
  },
  eliteConditioning: {
    id: 'elite-conditioning',
    name: 'Elite Conditioning',
    description: 'Template for elite conditioning workouts',
    metadata: {
      category: 'conditioning',
      difficulty: WorkoutDifficulty.ELITE,
      level: SkillLevel.EXPERT,
      focus: [FocusArea.ENDURANCE, FocusArea.SPEED],
      intensityScore: 9,
      complexityScore: 7,
      space: 'field'
    }
  },
  recoverySession: {
    id: 'recovery-session',
    name: 'Recovery Session',
    description: 'Template for recovery workouts',
    metadata: {
      category: 'recovery',
      difficulty: WorkoutDifficulty.BEGINNER,
      level: SkillLevel.NOVICE,
      focus: [FocusArea.RECOVERY, FocusArea.FLEXIBILITY],
      intensityScore: 3,
      complexityScore: 2,
      space: 'any'
    }
  }
};

// Metadata sorting options
export interface MetadataSortOptions {
  field: keyof StandardMetadata;
  direction: 'asc' | 'desc';
}

// Common sort presets
export const SORT_PRESETS: Record<string, MetadataSortOptions> = {
  newest: { field: 'createdAt', direction: 'desc' },
  oldest: { field: 'createdAt', direction: 'asc' },
  mostUsed: { field: 'usageCount', direction: 'desc' },
  leastUsed: { field: 'usageCount', direction: 'asc' },
  highestRated: { field: 'averageRating', direction: 'desc' },
  lowestRated: { field: 'averageRating', direction: 'asc' },
  mostPopular: { field: 'popularityScore', direction: 'desc' },
  leastPopular: { field: 'popularityScore', direction: 'asc' },
  longestDuration: { field: 'estimatedDuration', direction: 'desc' },
  shortestDuration: { field: 'estimatedDuration', direction: 'asc' },
  highestIntensity: { field: 'intensityScore', direction: 'desc' },
  lowestIntensity: { field: 'intensityScore', direction: 'asc' }
};