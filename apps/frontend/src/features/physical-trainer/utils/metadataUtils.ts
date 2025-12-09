/**
 * Metadata Utilities for Standardized Workout System
 * Provides utilities for metadata normalization, validation, and operations
 */

import {
  StandardMetadata,
  EnhancedMetadata,
  PartialMetadata,
  MetadataFilters,
  MetadataValidationRules,
  MetadataSortOptions,
  WorkoutDifficulty,
  SkillLevel,
  FocusArea,
  VisibilityLevel,
  WorkoutStatus,
  Season,
  DEFAULT_VALIDATION_RULES,
  METADATA_TEMPLATES,
  SORT_PRESETS
} from '../types/metadata-standard.types';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
  warnings: {
    field: string;
    message: string;
    code: string;
  }[];
}

// Metadata generation utilities
export class MetadataUtils {
  private static validationRules: MetadataValidationRules = DEFAULT_VALIDATION_RULES;

  /**
   * Generate a new metadata object with defaults
   */
  static generateMetadata(
    partialMetadata: Partial<StandardMetadata>,
    createdBy: string,
    organizationId: string
  ): StandardMetadata {
    const now = new Date().toISOString();
    const id = partialMetadata.id || this.generateId();

    return {
      // Core Identity
      id,
      name: partialMetadata.name || 'Untitled Workout',
      description: partialMetadata.description,
      tags: partialMetadata.tags || [],
      version: 1,

      // Classification
      category: partialMetadata.category || 'general',
      difficulty: partialMetadata.difficulty || WorkoutDifficulty.INTERMEDIATE,
      level: partialMetadata.level || SkillLevel.DEVELOPING,
      focus: partialMetadata.focus || [],
      season: partialMetadata.season,

      // Performance Metrics
      estimatedDuration: partialMetadata.estimatedDuration || 60,
      intensityScore: partialMetadata.intensityScore || 5,
      complexityScore: partialMetadata.complexityScore || 5,

      // Equipment & Resources
      equipment: partialMetadata.equipment || [],
      space: partialMetadata.space || 'gym',
      groupSize: partialMetadata.groupSize,

      // Usage & Analytics
      usageCount: 0,
      popularityScore: 0,

      // Timestamps
      createdAt: now,
      updatedAt: now,

      // Ownership & Permissions
      createdBy,
      organizationId,
      teamId: partialMetadata.teamId,
      visibility: partialMetadata.visibility || VisibilityLevel.PRIVATE,

      // Status & Workflow
      status: partialMetadata.status || WorkoutStatus.DRAFT,
      isTemplate: partialMetadata.isTemplate || false,

      ...partialMetadata
    };
  }

  /**
   * Generate a unique ID for metadata
   */
  static generateId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize existing metadata to standard format
   */
  static normalizeMetadata(
    legacyMetadata: any,
    workoutType: string
  ): StandardMetadata {
    const normalized: Partial<StandardMetadata> = {
      id: legacyMetadata.id || this.generateId(),
      name: legacyMetadata.name || legacyMetadata.title || 'Migrated Workout',
      description: legacyMetadata.description || legacyMetadata.notes,
      tags: this.normalizeTags(legacyMetadata.tags || legacyMetadata.labels || []),
      version: legacyMetadata.version || 1,

      category: this.normalizeCategory(legacyMetadata.category || workoutType),
      difficulty: this.normalizeDifficulty(legacyMetadata.difficulty || legacyMetadata.level),
      level: this.normalizeSkillLevel(legacyMetadata.skillLevel || legacyMetadata.level),
      focus: this.normalizeFocusAreas(legacyMetadata.focus || legacyMetadata.targets || []),

      estimatedDuration: this.normalizeDuration(legacyMetadata.duration || legacyMetadata.estimatedTime),
      intensityScore: this.normalizeScore(legacyMetadata.intensity || legacyMetadata.intensityLevel, 5),
      complexityScore: this.normalizeScore(legacyMetadata.complexity || legacyMetadata.difficultyScore, 5),

      equipment: this.normalizeEquipment(legacyMetadata.equipment || legacyMetadata.requiredEquipment || []),
      space: legacyMetadata.space || legacyMetadata.location || 'gym',

      usageCount: legacyMetadata.usageCount || legacyMetadata.timesUsed || 0,
      popularityScore: this.calculatePopularityScore(legacyMetadata),

      createdAt: legacyMetadata.createdAt || legacyMetadata.created || new Date().toISOString(),
      updatedAt: legacyMetadata.updatedAt || legacyMetadata.modified || new Date().toISOString(),

      createdBy: legacyMetadata.createdBy || legacyMetadata.authorId || 'unknown',
      organizationId: legacyMetadata.organizationId || legacyMetadata.orgId || 'default',
      teamId: legacyMetadata.teamId,
      visibility: this.normalizeVisibility(legacyMetadata.visibility || legacyMetadata.accessLevel),

      status: this.normalizeStatus(legacyMetadata.status || legacyMetadata.state),
      isTemplate: Boolean(legacyMetadata.isTemplate || legacyMetadata.template)
    };

    return this.generateMetadata(normalized, normalized.createdBy!, normalized.organizationId!);
  }

  /**
   * Validate metadata against rules
   */
  static validateMetadata(
    metadata: Partial<StandardMetadata>,
    rules: MetadataValidationRules = this.validationRules
  ): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Name validation
    if (rules.name.required && !metadata.name) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (metadata.name) {
      if (metadata.name.length < rules.name.minLength) {
        errors.push({
          field: 'name',
          message: `Name must be at least ${rules.name.minLength} characters`,
          code: 'MIN_LENGTH'
        });
      }

      if (metadata.name.length > rules.name.maxLength) {
        errors.push({
          field: 'name',
          message: `Name must not exceed ${rules.name.maxLength} characters`,
          code: 'MAX_LENGTH'
        });
      }

      if (rules.name.pattern && !rules.name.pattern.test(metadata.name)) {
        errors.push({
          field: 'name',
          message: 'Name contains invalid characters',
          code: 'INVALID_PATTERN'
        });
      }
    }

    // Description validation
    if (metadata.description && metadata.description.length > rules.description.maxLength) {
      errors.push({
        field: 'description',
        message: `Description must not exceed ${rules.description.maxLength} characters`,
        code: 'MAX_LENGTH'
      });
    }

    // Tags validation
    if (metadata.tags) {
      if (metadata.tags.length > rules.tags.maxCount) {
        warnings.push({
          field: 'tags',
          message: `Consider reducing tags to ${rules.tags.maxCount} or fewer`,
          code: 'MAX_COUNT'
        });
      }

      metadata.tags.forEach((tag, index) => {
        if (tag.length > rules.tags.maxLength) {
          errors.push({
            field: `tags[${index}]`,
            message: `Tag "${tag}" exceeds maximum length of ${rules.tags.maxLength}`,
            code: 'TAG_TOO_LONG'
          });
        }
      });
    }

    // Duration validation
    if (metadata.estimatedDuration !== undefined) {
      if (metadata.estimatedDuration < rules.duration.min) {
        errors.push({
          field: 'estimatedDuration',
          message: `Duration must be at least ${rules.duration.min} minutes`,
          code: 'MIN_VALUE'
        });
      }

      if (metadata.estimatedDuration > rules.duration.max) {
        warnings.push({
          field: 'estimatedDuration',
          message: `Duration of ${metadata.estimatedDuration} minutes is unusually long`,
          code: 'UNUSUAL_VALUE'
        });
      }
    }

    // Intensity validation
    if (metadata.intensityScore !== undefined) {
      if (metadata.intensityScore < rules.intensity.min || metadata.intensityScore > rules.intensity.max) {
        errors.push({
          field: 'intensityScore',
          message: `Intensity must be between ${rules.intensity.min} and ${rules.intensity.max}`,
          code: 'OUT_OF_RANGE'
        });
      }
    }

    // Complexity validation
    if (metadata.complexityScore !== undefined) {
      if (metadata.complexityScore < rules.complexity.min || metadata.complexityScore > rules.complexity.max) {
        errors.push({
          field: 'complexityScore',
          message: `Complexity must be between ${rules.complexity.min} and ${rules.complexity.max}`,
          code: 'OUT_OF_RANGE'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize metadata fields
   */
  static sanitizeMetadata(metadata: PartialMetadata): PartialMetadata {
    const sanitized = { ...metadata };

    // Trim string fields
    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }

    if (sanitized.description) {
      sanitized.description = sanitized.description.trim();
    }

    // Clean tags
    if (sanitized.tags) {
      sanitized.tags = sanitized.tags
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
    }

    // Clamp numeric values
    if (sanitized.intensityScore !== undefined) {
      sanitized.intensityScore = Math.max(1, Math.min(10, sanitized.intensityScore));
    }

    if (sanitized.complexityScore !== undefined) {
      sanitized.complexityScore = Math.max(1, Math.min(10, sanitized.complexityScore));
    }

    if (sanitized.estimatedDuration !== undefined) {
      sanitized.estimatedDuration = Math.max(5, sanitized.estimatedDuration);
    }

    return sanitized;
  }

  /**
   * Update metadata with tracking
   */
  static updateMetadata(
    currentMetadata: StandardMetadata,
    updates: PartialMetadata,
    updatedBy: string
  ): StandardMetadata {
    const sanitizedUpdates = this.sanitizeMetadata(updates);
    
    return {
      ...currentMetadata,
      ...sanitizedUpdates,
      version: currentMetadata.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
  }

  /**
   * Filter metadata based on criteria
   */
  static filterMetadata(
    metadataList: StandardMetadata[],
    filters: MetadataFilters
  ): StandardMetadata[] {
    return metadataList.filter(metadata => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(metadata.category)) return false;
      }

      // Difficulty filter
      if (filters.difficulties && filters.difficulties.length > 0) {
        if (!filters.difficulties.includes(metadata.difficulty)) return false;
      }

      // Level filter
      if (filters.levels && filters.levels.length > 0) {
        if (!filters.levels.includes(metadata.level)) return false;
      }

      // Focus areas filter
      if (filters.focusAreas && filters.focusAreas.length > 0) {
        const hasMatchingFocus = filters.focusAreas.some(focus => 
          metadata.focus.includes(focus)
        );
        if (!hasMatchingFocus) return false;
      }

      // Equipment filter
      if (filters.equipment && filters.equipment.length > 0) {
        const hasMatchingEquipment = filters.equipment.some(equipment => 
          metadata.equipment.includes(equipment)
        );
        if (!hasMatchingEquipment) return false;
      }

      // Duration filters
      if (filters.minDuration !== undefined && metadata.estimatedDuration < filters.minDuration) {
        return false;
      }
      if (filters.maxDuration !== undefined && metadata.estimatedDuration > filters.maxDuration) {
        return false;
      }

      // Intensity filters
      if (filters.minIntensity !== undefined && metadata.intensityScore < filters.minIntensity) {
        return false;
      }
      if (filters.maxIntensity !== undefined && metadata.intensityScore > filters.maxIntensity) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Creator filter
      if (filters.createdBy && metadata.createdBy !== filters.createdBy) {
        return false;
      }

      // Team filter
      if (filters.teamId && metadata.teamId !== filters.teamId) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(metadata.status)) return false;
      }

      // Season filter
      if (filters.season && filters.season.length > 0) {
        if (!metadata.season || !filters.season.includes(metadata.season)) return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableText = [
          metadata.name,
          metadata.description,
          ...metadata.tags,
          metadata.category,
          ...metadata.equipment
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    });
  }

  /**
   * Sort metadata by specified criteria
   */
  static sortMetadata(
    metadataList: StandardMetadata[],
    sortOptions: MetadataSortOptions
  ): StandardMetadata[] {
    return [...metadataList].sort((a, b) => {
      const aValue = a[sortOptions.field];
      const bValue = b[sortOptions.field];

      let comparison = 0;

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOptions.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Generate search index for metadata
   */
  static generateSearchIndex(metadata: StandardMetadata): string[] {
    return [
      metadata.name,
      metadata.description || '',
      ...metadata.tags,
      metadata.category,
      metadata.difficulty,
      metadata.level,
      ...metadata.focus,
      ...metadata.equipment,
      metadata.space,
      ...(metadata.keywords || [])
    ].filter(Boolean);
  }

  /**
   * Calculate analytics metrics
   */
  static calculateAnalytics(metadataList: StandardMetadata[]) {
    const total = metadataList.length;
    
    if (total === 0) {
      return {
        total: 0,
        averageDuration: 0,
        averageIntensity: 0,
        averageComplexity: 0,
        popularCategories: [],
        popularFocusAreas: [],
        popularEquipment: []
      };
    }

    const categoryCount: Record<string, number> = {};
    const focusCount: Record<string, number> = {};
    const equipmentCount: Record<string, number> = {};

    let totalDuration = 0;
    let totalIntensity = 0;
    let totalComplexity = 0;

    metadataList.forEach(metadata => {
      totalDuration += metadata.estimatedDuration;
      totalIntensity += metadata.intensityScore;
      totalComplexity += metadata.complexityScore;

      categoryCount[metadata.category] = (categoryCount[metadata.category] || 0) + 1;

      metadata.focus.forEach(focus => {
        focusCount[focus] = (focusCount[focus] || 0) + 1;
      });

      metadata.equipment.forEach(equipment => {
        equipmentCount[equipment] = (equipmentCount[equipment] || 0) + 1;
      });
    });

    return {
      total,
      averageDuration: Math.round(totalDuration / total),
      averageIntensity: Number((totalIntensity / total).toFixed(1)),
      averageComplexity: Number((totalComplexity / total).toFixed(1)),
      popularCategories: Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
      popularFocusAreas: Object.entries(focusCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([focus, count]) => ({ focus, count })),
      popularEquipment: Object.entries(equipmentCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([equipment, count]) => ({ equipment, count }))
    };
  }

  // Private helper methods
  private static normalizeTags(tags: any[]): string[] {
    return tags
      .map(tag => String(tag).trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  private static normalizeCategory(category: any): string {
    const categoryMap: Record<string, string> = {
      'weight': 'strength',
      'cardio': 'conditioning',
      'mixed': 'hybrid',
      'speed': 'agility',
      'flexibility': 'recovery'
    };

    const normalized = String(category).toLowerCase();
    return categoryMap[normalized] || normalized;
  }

  private static normalizeDifficulty(difficulty: any): WorkoutDifficulty {
    const difficultyMap: Record<string, WorkoutDifficulty> = {
      'easy': WorkoutDifficulty.BEGINNER,
      'medium': WorkoutDifficulty.INTERMEDIATE,
      'hard': WorkoutDifficulty.ADVANCED,
      'expert': WorkoutDifficulty.ELITE
    };

    const normalized = String(difficulty).toLowerCase();
    return difficultyMap[normalized] || WorkoutDifficulty.INTERMEDIATE;
  }

  private static normalizeSkillLevel(level: any): SkillLevel {
    const levelMap: Record<string, SkillLevel> = {
      'beginner': SkillLevel.NOVICE,
      'intermediate': SkillLevel.DEVELOPING,
      'advanced': SkillLevel.PROFICIENT,
      'expert': SkillLevel.EXPERT,
      'master': SkillLevel.MASTER
    };

    const normalized = String(level).toLowerCase();
    return levelMap[normalized] || SkillLevel.DEVELOPING;
  }

  private static normalizeFocusAreas(focus: any[]): FocusArea[] {
    const focusMap: Record<string, FocusArea> = {
      'upper': FocusArea.UPPER_BODY,
      'lower': FocusArea.LOWER_BODY,
      'fullbody': FocusArea.FULL_BODY,
      'cardio': FocusArea.ENDURANCE,
      'rehab': FocusArea.REHABILITATION
    };

    return focus
      .map(f => {
        const normalized = String(f).toLowerCase().replace(/[-_\s]/g, '');
        return focusMap[normalized] || Object.values(FocusArea).find(area => 
          area.toLowerCase().replace(/[-_]/g, '') === normalized
        );
      })
      .filter(Boolean) as FocusArea[];
  }

  private static normalizeEquipment(equipment: any[]): string[] {
    return equipment
      .map(eq => String(eq).trim().toLowerCase())
      .filter(eq => eq.length > 0);
  }

  private static normalizeDuration(duration: any): number {
    const parsed = parseInt(String(duration), 10);
    return isNaN(parsed) ? 60 : Math.max(5, parsed);
  }

  private static normalizeScore(score: any, defaultValue: number): number {
    const parsed = parseFloat(String(score));
    return isNaN(parsed) ? defaultValue : Math.max(1, Math.min(10, parsed));
  }

  private static normalizeVisibility(visibility: any): VisibilityLevel {
    const visibilityMap: Record<string, VisibilityLevel> = {
      'public': VisibilityLevel.PUBLIC,
      'private': VisibilityLevel.PRIVATE,
      'team': VisibilityLevel.TEAM,
      'org': VisibilityLevel.ORGANIZATION,
      'organization': VisibilityLevel.ORGANIZATION,
      'shared': VisibilityLevel.SHARED_LINK
    };

    const normalized = String(visibility).toLowerCase();
    return visibilityMap[normalized] || VisibilityLevel.PRIVATE;
  }

  private static normalizeStatus(status: any): WorkoutStatus {
    const statusMap: Record<string, WorkoutStatus> = {
      'active': WorkoutStatus.ACTIVE,
      'inactive': WorkoutStatus.ARCHIVED,
      'published': WorkoutStatus.ACTIVE,
      'unpublished': WorkoutStatus.DRAFT
    };

    const normalized = String(status).toLowerCase();
    return statusMap[normalized] || WorkoutStatus.DRAFT;
  }

  private static calculatePopularityScore(legacyMetadata: any): number {
    const usageCount = legacyMetadata.usageCount || legacyMetadata.timesUsed || 0;
    const rating = legacyMetadata.rating || legacyMetadata.averageRating || 0;
    const favorites = legacyMetadata.favorites || legacyMetadata.favoriteCount || 0;
    
    // Simple popularity calculation
    return Math.min(100, (usageCount * 2) + (rating * 10) + (favorites * 5));
  }
}

// Export utility functions
export const {
  generateMetadata,
  generateId,
  normalizeMetadata,
  validateMetadata,
  sanitizeMetadata,
  updateMetadata,
  filterMetadata,
  sortMetadata,
  generateSearchIndex,
  calculateAnalytics
} = MetadataUtils;

// Export common operations
export const metadataOperations = {
  create: MetadataUtils.generateMetadata,
  update: MetadataUtils.updateMetadata,
  validate: MetadataUtils.validateMetadata,
  sanitize: MetadataUtils.sanitizeMetadata,
  normalize: MetadataUtils.normalizeMetadata,
  filter: MetadataUtils.filterMetadata,
  sort: MetadataUtils.sortMetadata,
  search: MetadataUtils.generateSearchIndex,
  analytics: MetadataUtils.calculateAnalytics
};

// Export templates and presets
export { METADATA_TEMPLATES, SORT_PRESETS };