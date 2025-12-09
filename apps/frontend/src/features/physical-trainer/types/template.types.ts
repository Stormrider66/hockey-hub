// Template and Category Types for Physical Trainer

import { BaseEntity } from './base-types';
import { WorkoutType } from './session.types';

// Category system types
export interface TemplateCategory extends BaseEntity {
  name: string;
  slug: string; // URL-friendly version of name
  description?: string;
  icon?: string; // Icon name or emoji
  color?: string; // Hex color code
  parentId?: string | null; // For nested categories
  isSystem: boolean; // True for predefined categories
  isActive: boolean;
  sortOrder: number;
  
  // Usage tracking
  templateCount?: number;
  lastUsed?: string;
  
  // Permissions
  isPublic: boolean;
  organizationId?: string;
  createdBy: string;
  sharedWith?: string[]; // User IDs who can use this category
}

// Predefined category types
export enum CategoryType {
  // By workout type
  BY_TYPE = 'by_type',
  // By focus area
  BY_FOCUS = 'by_focus',
  // By difficulty level
  BY_LEVEL = 'by_level',
  // By duration
  BY_DURATION = 'by_duration',
  // By season
  BY_SEASON = 'by_season',
  // Custom user-defined
  CUSTOM = 'custom'
}

// Predefined categories structure
export interface PredefinedCategories {
  byType: {
    strength: TemplateCategory;
    conditioning: TemplateCategory;
    hybrid: TemplateCategory;
    agility: TemplateCategory;
  };
  byFocus: {
    upperBody: TemplateCategory;
    lowerBody: TemplateCategory;
    core: TemplateCategory;
    fullBody: TemplateCategory;
    cardio: TemplateCategory;
    mobility: TemplateCategory;
    recovery: TemplateCategory;
  };
  byLevel: {
    beginner: TemplateCategory;
    intermediate: TemplateCategory;
    advanced: TemplateCategory;
    elite: TemplateCategory;
  };
  byDuration: {
    quick: TemplateCategory; // 15-30 minutes
    standard: TemplateCategory; // 30-60 minutes
    extended: TemplateCategory; // 60+ minutes
  };
  bySeason: {
    preseason: TemplateCategory;
    inseason: TemplateCategory;
    offseason: TemplateCategory;
    playoffs: TemplateCategory;
  };
}

// Category hierarchy for nested structure
export interface CategoryHierarchy {
  category: TemplateCategory;
  children: CategoryHierarchy[];
  depth: number;
  path: string[]; // Path from root to this category
}

// Category filter options
export interface CategoryFilter {
  categoryIds?: string[];
  categoryTypes?: CategoryType[];
  includeChildren?: boolean;
  onlyActive?: boolean;
  onlyPublic?: boolean;
  searchTerm?: string;
  sortBy?: 'name' | 'templateCount' | 'lastUsed' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

// Template metadata with categories
export interface TemplateMetadata extends BaseEntity {
  name: string;
  description?: string;
  type: WorkoutType;
  
  // Categorization
  categoryIds: string[]; // Multiple categories allowed
  primaryCategoryId?: string; // Main category for display
  tags: string[]; // Additional tags
  
  // Template details
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  equipment: string[];
  targetMuscleGroups?: string[];
  
  // Usage and ratings
  usageCount: number;
  lastUsed?: string;
  averageRating?: number;
  ratingCount?: number;
  
  // Enhanced Analytics
  effectivenessScore?: number; // 0-100 composite effectiveness score
  popularityScore?: number; // 0-100 relative popularity score
  completionRate?: number; // 0-1 average completion rate
  modificationFrequency?: number; // 0-1 how often template is modified
  injuryRate?: number; // 0-1 injury incidents per session
  playerSatisfactionScore?: number; // 0-10 average player satisfaction
  
  // Performance Metrics
  performanceMetrics?: {
    totalSessions: number;
    totalMinutesUsed: number;
    averageSessionDuration: number;
    uniqueUsers: number;
    repeatUsageRate: number; // 0-1 how often users come back
    teamAdoptionRate: number; // 0-1 how many teams use this
  };
  
  // Seasonal Usage Patterns
  seasonalUsage?: {
    preseason: number; // 0-1 usage ratio
    inseason: number;
    playoffs: number;
    offseason: number;
    peakMonth: string;
    lowestMonth: string;
  };
  
  // Sharing and permissions
  isPublic: boolean;
  isOfficial?: boolean; // Official templates from the system
  organizationId?: string;
  createdBy: string;
  sharedWith?: string[]; // User IDs
  
  // Version control
  version: number;
  parentTemplateId?: string; // For template forks
  changelog?: string[];
  versionHistory?: TemplateVersionInfo[];
  
  // Search optimization
  keywords?: string[];
  searchableText?: string; // Combined text for search
  
  // AI/ML Features
  mlFeatures?: {
    intensityVector: number[]; // Normalized intensity features
    complexityScore: number; // 0-1 complexity rating
    similarityTags: string[]; // Auto-generated similarity tags
    recommendationScore: number; // Internal ML recommendation score
  };
}

// Template with full data
export interface WorkoutTemplate extends TemplateMetadata {
  workoutData: any; // Type-specific workout data (StrengthWorkout, IntervalProgram, etc.)
  
  // Additional metadata
  thumbnailUrl?: string;
  previewData?: any; // Simplified data for preview
  estimatedCalories?: number;
  targetHeartRateZones?: number[];
  
  // Related templates
  relatedTemplateIds?: string[];
  prerequisiteTemplateIds?: string[];
  progressionTemplateIds?: string[];
}

// Category assignment operation
export interface CategoryAssignment {
  templateIds: string[];
  categoryIds: string[];
  operation: 'add' | 'remove' | 'replace';
}

// Category statistics
export interface CategoryStats {
  categoryId: string;
  templateCount: number;
  totalUsage: number;
  averageRating: number;
  lastUsed?: string;
  topTemplates: {
    templateId: string;
    name: string;
    usageCount: number;
    rating: number;
  }[];
  subcategoryCount?: number;
}

// Template search and filter options
export interface TemplateSearchOptions {
  query?: string;
  type?: WorkoutType;
  categoryIds?: string[];
  tags?: string[];
  difficulty?: TemplateMetadata['difficulty'][];
  durationRange?: {
    min?: number;
    max?: number;
  };
  equipment?: string[];
  createdBy?: string;
  isPublic?: boolean;
  sortBy?: 'name' | 'usageCount' | 'rating' | 'lastUsed' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Import/Export formats
export interface CategoryExport {
  version: string;
  exportDate: string;
  categories: TemplateCategory[];
  hierarchy: CategoryHierarchy[];
}

export interface TemplateExport {
  version: string;
  exportDate: string;
  templates: WorkoutTemplate[];
  categories: TemplateCategory[];
  mappings: {
    templateId: string;
    categoryIds: string[];
  }[];
}

// Bulk operations
export interface BulkCategoryOperation {
  operation: 'create' | 'update' | 'delete' | 'merge';
  categories?: Partial<TemplateCategory>[];
  targetCategoryId?: string; // For merge operations
  updateFields?: Partial<TemplateCategory>; // For bulk updates
}

// Category creation/edit form
export interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  isPublic: boolean;
  sortOrder?: number;
}

// Template sharing types
export type TemplatePermission = 'owner' | 'collaborator' | 'viewer' | 'link_access';

export interface TemplateShareSettings {
  isPublic: boolean;
  allowPublicLink: boolean;
  publicLinkExpires?: Date;
  defaultPermission: TemplatePermission;
  notifyOnShare: boolean;
  trackUsage: boolean;
}

export interface SharedTemplateInfo {
  id: string;
  templateId: string;
  sharedBy: string;
  sharedWith: Array<{
    id: string;
    type: 'user' | 'team' | 'organization';
    name: string;
    permission: TemplatePermission;
  }>;
  permission: TemplatePermission;
  sharedAt: Date;
  expiresAt?: Date;
  publicLink?: string;
  message?: string;
  stats: {
    views: number;
    uses: number;
    lastAccessed?: Date;
  };
}

export interface TemplateCollaborator {
  userId: string;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;
  permission: TemplatePermission;
  addedAt: Date;
  addedBy: string;
  lastActivity?: Date;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  changes: string;
  createdBy: string;
  createdAt: Date;
  workoutData: any;
  isActive: boolean;
}

// Enhanced version tracking
export interface TemplateVersionInfo {
  version: number;
  changes: string;
  createdAt: string;
  createdBy: string;
  previousVersion?: number;
  metrics?: {
    usageCount: number;
    averageRating: number;
    completionRate: number;
  };
}

// Template analytics data structures
export interface TemplateAnalyticsData {
  templateId: string;
  effectivenessScore: number;
  popularityScore: number;
  usageMetrics: {
    totalUsage: number;
    uniqueUsers: number;
    averageRating: number;
    completionRate: number;
    modificationFrequency: number;
    injuryRate: number;
    playerSatisfactionScore: number;
  };
  performanceTrends: {
    metric: 'completion_rate' | 'satisfaction' | 'injury_rate' | 'intensity';
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number;
    timeframe: '7d' | '30d' | '90d';
  }[];
  seasonalPatterns: {
    preseason: number;
    inseason: number;
    playoffs: number;
    offseason: number;
    peakMonth: string;
    lowestMonth: string;
  };
  modificationPatterns: {
    type: 'exercise_added' | 'exercise_removed' | 'exercise_modified' | 'duration_changed' | 'intensity_changed';
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  lastUpdated: string;
}

// Template recommendation data
export interface TemplateRecommendation {
  templateId: string;
  score: number;
  confidence: number;
  reasons: {
    type: 'similar_users' | 'content_similarity' | 'seasonal_trend' | 'success_rate' | 'team_preference';
    weight: number;
    description: string;
  }[];
  contextFactors: {
    factor: 'time_of_season' | 'player_level' | 'available_equipment' | 'team_size' | 'recent_workouts';
    value: any;
    influence: number; // -1 to 1
  }[];
}

// Template marketplace data
export interface TemplateMarketplaceItem extends WorkoutTemplate {
  // Enhanced marketplace metadata
  downloadCount: number;
  reviewCount: number;
  averageStarRating: number; // 1-5 stars
  isPremium: boolean;
  price?: number;
  
  // Creator information
  creatorInfo: {
    name: string;
    avatar?: string;
    verified: boolean;
    totalTemplates: number;
    averageRating: number;
  };
  
  // Social proof
  socialMetrics: {
    likes: number;
    bookmarks: number;
    shares: number;
    comments: number;
  };
  
  // Quality indicators
  qualityScore: number; // 0-100 overall quality score
  certificationLevel?: 'basic' | 'professional' | 'expert';
  officialApproval?: boolean;
  
  // Preview data
  previewImages?: string[];
  videoPreview?: string;
  sampleExercises?: any[];
}

// Template rating and review system
export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  title?: string;
  review: string;
  pros?: string[];
  cons?: string[];
  difficultyRating: number; // 1-5
  effectivenessRating: number; // 1-5
  enjoymentRating: number; // 1-5
  wouldRecommend: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt?: string;
  verified: boolean; // User actually used the template
  usageContext?: {
    playerLevel: string;
    teamSize: number;
    equipment: string[];
    season: string;
  };
}

// Template comparison system
export interface TemplateComparison {
  templates: string[]; // Template IDs to compare
  criteria: {
    effectiveness: number[];
    difficulty: number[];
    duration: number[];
    equipment: string[][];
    popularity: number[];
    rating: number[];
  };
  recommendations: {
    bestFor: {
      beginners: string;
      advanced: string;
      quickSessions: string;
      effectiveness: string;
    };
    alternatives: string[];
  };
}

// Template curation and collections
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  curator: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  templateIds: string[];
  tags: string[];
  difficulty: 'mixed' | 'beginner' | 'intermediate' | 'advanced' | 'elite';
  estimatedWeeks: number; // For progressive collections
  isProgressive: boolean; // Templates build on each other
  followCount: number;
  likeCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Template achievement system
export interface TemplateAchievement {
  id: string;
  templateId: string;
  type: 'completion' | 'streak' | 'improvement' | 'mastery';
  name: string;
  description: string;
  icon: string;
  requirements: {
    completions?: number;
    streak?: number;
    improvementPercent?: number;
    timeFrame?: string;
  };
  reward?: {
    points: number;
    badge?: string;
    unlock?: string; // Unlock another template
  };
}

export interface TemplateShareNotification {
  id: string;
  recipientId: string;
  templateId: string;
  templateName: string;
  sharedBy: string;
  sharedByName: string;
  permission: TemplatePermission;
  message?: string;
  createdAt: Date;
  readAt?: Date;
  actionTaken?: 'accepted' | 'declined' | 'ignored';
}

export interface TemplateUsageTracking {
  templateId: string;
  userId: string;
  userName: string;
  action: 'viewed' | 'used' | 'duplicated' | 'shared';
  timestamp: Date;
  metadata?: {
    sessionId?: string;
    duration?: number;
    completed?: boolean;
  };
}

// Utility types
export type CategoryTree = CategoryHierarchy[];
export type CategoryMap = Map<string, TemplateCategory>;
export type TemplateMap = Map<string, WorkoutTemplate>;

// Constants
export const DEFAULT_CATEGORY_COLORS = {
  strength: '#FF6B6B',
  conditioning: '#4ECDC4',
  hybrid: '#9B59B6',
  agility: '#F39C12',
  upperBody: '#3498DB',
  lowerBody: '#2ECC71',
  core: '#E74C3C',
  fullBody: '#34495E',
  beginner: '#52C41A',
  intermediate: '#FAAD14',
  advanced: '#FA541C',
  elite: '#722ED1',
  quick: '#13C2C2',
  standard: '#1890FF',
  extended: '#2F54EB',
  preseason: '#EB2F96',
  inseason: '#52C41A',
  offseason: '#FADB14',
  playoffs: '#FA8C16'
};

export const DEFAULT_CATEGORY_ICONS = {
  strength: '💪',
  conditioning: '🏃',
  hybrid: '⚡',
  agility: '🎯',
  upperBody: '🦾',
  lowerBody: '🦵',
  core: '🎯',
  fullBody: '👤',
  beginner: '🌱',
  intermediate: '📈',
  advanced: '🔥',
  elite: '👑',
  quick: '⏱️',
  standard: '⏰',
  extended: '⏳',
  preseason: '🏁',
  inseason: '🏒',
  offseason: '🏖️',
  playoffs: '🏆'
};