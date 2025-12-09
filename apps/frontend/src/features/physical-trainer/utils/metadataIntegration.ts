/**
 * Metadata Integration Utilities
 * Provides integration points for standardized metadata across the workout system
 */

import {
  StandardMetadata,
  WorkoutTypeMetadata,
  MetadataFilters,
  MetadataSortOptions,
  WorkoutDifficulty,
  SkillLevel,
  FocusArea,
  WorkoutStatus
} from '../types/metadata-standard.types';
import { WorkoutSession, SessionTemplate } from '../types/index.ts';
import { MetadataUtils, metadataOperations } from './metadataUtils';

// Integration interfaces
export interface UnifiedWorkoutData {
  session: WorkoutSession;
  template?: SessionTemplate;
  metadata: StandardMetadata;
  typeSpecificData?: any;
}

export interface SearchableWorkout {
  id: string;
  type: string;
  searchIndex: string[];
  metadata: StandardMetadata;
  data: WorkoutSession | SessionTemplate;
}

export interface WorkoutCollection {
  workouts: UnifiedWorkoutData[];
  totalCount: number;
  filteredCount: number;
  filters: MetadataFilters;
  sort: MetadataSortOptions;
  analytics: WorkoutAnalytics;
}

export interface WorkoutAnalytics {
  byType: Record<string, number>;
  byDifficulty: Record<WorkoutDifficulty, number>;
  byFocus: Record<FocusArea, number>;
  averageDuration: number;
  averageIntensity: number;
  popularTags: { tag: string; count: number }[];
  usageTrends: { date: string; count: number }[];
}

// Integration utility class
export class MetadataIntegration {
  /**
   * Convert WorkoutSession to unified format with metadata
   */
  static unifyWorkoutSession(
    session: WorkoutSession,
    options: {
      generateMetadataIfMissing?: boolean;
      organizationId?: string;
      createdBy?: string;
    } = {}
  ): UnifiedWorkoutData {
    let metadata = session.metadata;

    // Generate metadata if missing
    if (!metadata && options.generateMetadataIfMissing) {
      metadata = MetadataUtils.generateMetadata(
        {
          name: session.title,
          description: session.description,
          category: session.type,
          estimatedDuration: session.metadata?.estimatedDuration || 60,
          equipment: [], // Extract from exercises if needed
          teamId: session.teamId,
          status: this.mapSessionStatusToMetadataStatus(session.status)
        },
        options.createdBy || session.createdBy || 'unknown',
        options.organizationId || 'default'
      );
    }

    return {
      session,
      metadata: metadata!,
      typeSpecificData: {
        intervalProgram: session.intervalProgram,
        blocks: session.blocks,
        drillSequence: session.drillSequence
      }
    };
  }

  /**
   * Convert SessionTemplate to unified format with metadata
   */
  static unifySessionTemplate(
    template: SessionTemplate,
    options: {
      generateMetadataIfMissing?: boolean;
      organizationId?: string;
      createdBy?: string;
    } = {}
  ): UnifiedWorkoutData {
    let metadata = template.metadata;

    // Generate metadata if missing
    if (!metadata && options.generateMetadataIfMissing) {
      metadata = MetadataUtils.generateMetadata(
        {
          name: template.name,
          description: template.description,
          category: template.type,
          isTemplate: true,
          equipment: [], // Extract from exercises if needed
          status: WorkoutStatus.ACTIVE
        },
        options.createdBy || template.createdBy || 'unknown',
        options.organizationId || 'default'
      );
    }

    return {
      session: this.templateToSession(template),
      template,
      metadata: metadata!,
      typeSpecificData: {
        intervalProgram: template.intervalProgram,
        blocks: template.blocks,
        drillSequence: template.drillSequence
      }
    };
  }

  /**
   * Create searchable index for workouts
   */
  static createSearchableWorkouts(
    workouts: UnifiedWorkoutData[]
  ): SearchableWorkout[] {
    return workouts.map(workout => ({
      id: workout.metadata.id,
      type: workout.metadata.category,
      searchIndex: MetadataUtils.generateSearchIndex(workout.metadata),
      metadata: workout.metadata,
      data: workout.template || workout.session
    }));
  }

  /**
   * Search workouts by term
   */
  static searchWorkouts(
    searchableWorkouts: SearchableWorkout[],
    searchTerm: string
  ): SearchableWorkout[] {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) return searchableWorkouts;

    return searchableWorkouts.filter(workout => 
      workout.searchIndex.some(indexTerm => 
        indexTerm.toLowerCase().includes(term)
      )
    );
  }

  /**
   * Filter and sort workout collection
   */
  static filterAndSortWorkouts(
    workouts: UnifiedWorkoutData[],
    filters: MetadataFilters,
    sort: MetadataSortOptions
  ): WorkoutCollection {
    // Extract metadata for filtering
    const metadata = workouts.map(w => w.metadata);
    
    // Apply filters
    const filteredMetadata = MetadataUtils.filterMetadata(metadata, filters);
    const filteredIds = new Set(filteredMetadata.map(m => m.id));
    const filteredWorkouts = workouts.filter(w => filteredIds.has(w.metadata.id));
    
    // Apply sorting
    const sortedMetadata = MetadataUtils.sortMetadata(filteredMetadata, sort);
    const sortedWorkouts = sortedMetadata.map(meta => 
      filteredWorkouts.find(w => w.metadata.id === meta.id)!
    );

    // Generate analytics
    const analytics = this.generateWorkoutAnalytics(sortedWorkouts);

    return {
      workouts: sortedWorkouts,
      totalCount: workouts.length,
      filteredCount: sortedWorkouts.length,
      filters,
      sort,
      analytics
    };
  }

  /**
   * Generate analytics for workout collection
   */
  static generateWorkoutAnalytics(
    workouts: UnifiedWorkoutData[]
  ): WorkoutAnalytics {
    const metadata = workouts.map(w => w.metadata);
    const baseAnalytics = MetadataUtils.calculateAnalytics(metadata);

    // Type distribution
    const byType: Record<string, number> = {};
    metadata.forEach(meta => {
      byType[meta.category] = (byType[meta.category] || 0) + 1;
    });

    // Difficulty distribution
    const byDifficulty: Record<WorkoutDifficulty, number> = {} as any;
    metadata.forEach(meta => {
      byDifficulty[meta.difficulty] = (byDifficulty[meta.difficulty] || 0) + 1;
    });

    // Focus area distribution
    const byFocus: Record<FocusArea, number> = {} as any;
    metadata.forEach(meta => {
      meta.focus.forEach(focus => {
        byFocus[focus] = (byFocus[focus] || 0) + 1;
      });
    });

    // Usage trends (mock data - would need actual usage history)
    const usageTrends = this.generateMockUsageTrends(metadata);

    return {
      byType,
      byDifficulty,
      byFocus,
      averageDuration: baseAnalytics.averageDuration,
      averageIntensity: baseAnalytics.averageIntensity,
      popularTags: this.getPopularTags(metadata),
      usageTrends
    };
  }

  /**
   * Update workout metadata
   */
  static updateWorkoutMetadata(
    workout: UnifiedWorkoutData,
    updates: Partial<StandardMetadata>,
    updatedBy: string
  ): UnifiedWorkoutData {
    const updatedMetadata = MetadataUtils.updateMetadata(
      workout.metadata,
      updates,
      updatedBy
    );

    return {
      ...workout,
      metadata: updatedMetadata
    };
  }

  /**
   * Merge duplicate workouts based on metadata similarity
   */
  static findSimilarWorkouts(
    target: UnifiedWorkoutData,
    candidates: UnifiedWorkoutData[],
    threshold: number = 0.8
  ): UnifiedWorkoutData[] {
    return candidates.filter(candidate => {
      if (candidate.metadata.id === target.metadata.id) return false;
      
      const similarity = this.calculateMetadataSimilarity(
        target.metadata,
        candidate.metadata
      );
      
      return similarity >= threshold;
    });
  }

  /**
   * Calculate similarity between two metadata objects
   */
  static calculateMetadataSimilarity(
    meta1: StandardMetadata,
    meta2: StandardMetadata
  ): number {
    let score = 0;
    let maxScore = 0;

    // Name similarity (weighted 30%)
    const nameWeight = 0.3;
    const nameSimilarity = this.calculateStringSimilarity(meta1.name, meta2.name);
    score += nameSimilarity * nameWeight;
    maxScore += nameWeight;

    // Category exact match (weighted 20%)
    const categoryWeight = 0.2;
    if (meta1.category === meta2.category) {
      score += categoryWeight;
    }
    maxScore += categoryWeight;

    // Focus areas overlap (weighted 20%)
    const focusWeight = 0.2;
    const focusOverlap = this.calculateArrayOverlap(meta1.focus, meta2.focus);
    score += focusOverlap * focusWeight;
    maxScore += focusWeight;

    // Equipment overlap (weighted 15%)
    const equipmentWeight = 0.15;
    const equipmentOverlap = this.calculateArrayOverlap(meta1.equipment, meta2.equipment);
    score += equipmentOverlap * equipmentWeight;
    maxScore += equipmentWeight;

    // Duration similarity (weighted 10%)
    const durationWeight = 0.1;
    const durationDiff = Math.abs(meta1.estimatedDuration - meta2.estimatedDuration);
    const maxDuration = Math.max(meta1.estimatedDuration, meta2.estimatedDuration);
    const durationSimilarity = maxDuration > 0 ? 1 - (durationDiff / maxDuration) : 1;
    score += durationSimilarity * durationWeight;
    maxScore += durationWeight;

    // Tags overlap (weighted 5%)
    const tagsWeight = 0.05;
    const tagsOverlap = this.calculateArrayOverlap(meta1.tags, meta2.tags);
    score += tagsOverlap * tagsWeight;
    maxScore += tagsWeight;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Generate recommendations based on workout metadata
   */
  static generateRecommendations(
    target: UnifiedWorkoutData,
    available: UnifiedWorkoutData[],
    limit: number = 5
  ): UnifiedWorkoutData[] {
    const similarities = available
      .filter(workout => workout.metadata.id !== target.metadata.id)
      .map(workout => ({
        workout,
        similarity: this.calculateMetadataSimilarity(target.metadata, workout.metadata)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(item => item.workout);
  }

  /**
   * Validate workout collection for consistency
   */
  static validateWorkoutCollection(
    workouts: UnifiedWorkoutData[]
  ): {
    isValid: boolean;
    issues: string[];
    duplicateIds: string[];
    missingMetadata: string[];
  } {
    const issues: string[] = [];
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];
    const missingMetadata: string[] = [];

    workouts.forEach(workout => {
      // Check for duplicate IDs
      if (seenIds.has(workout.metadata.id)) {
        duplicateIds.push(workout.metadata.id);
      }
      seenIds.add(workout.metadata.id);

      // Check for missing metadata
      if (!workout.metadata.name) {
        missingMetadata.push(workout.metadata.id);
        issues.push(`Workout ${workout.metadata.id} has no name`);
      }

      if (!workout.metadata.category) {
        missingMetadata.push(workout.metadata.id);
        issues.push(`Workout ${workout.metadata.id} has no category`);
      }

      if (!workout.metadata.createdBy) {
        missingMetadata.push(workout.metadata.id);
        issues.push(`Workout ${workout.metadata.id} has no creator`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      duplicateIds,
      missingMetadata
    };
  }

  // Private helper methods
  private static mapSessionStatusToMetadataStatus(
    sessionStatus: string
  ): WorkoutStatus {
    const statusMap: Record<string, WorkoutStatus> = {
      'scheduled': WorkoutStatus.SCHEDULED,
      'active': WorkoutStatus.IN_PROGRESS,
      'completed': WorkoutStatus.COMPLETED,
      'cancelled': WorkoutStatus.CANCELLED
    };

    return statusMap[sessionStatus] || WorkoutStatus.DRAFT;
  }

  private static templateToSession(template: SessionTemplate): WorkoutSession {
    return {
      id: template.id,
      title: template.name,
      description: template.description,
      type: template.type as any,
      scheduledDate: new Date().toISOString(),
      location: 'TBD',
      teamId: template.metadata?.teamId || '',
      playerIds: [],
      exercises: template.exercises,
      status: 'scheduled',
      intensity: 'medium',
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
      metadata: template.metadata,
      intervalProgram: template.intervalProgram,
      blocks: template.blocks,
      drillSequence: template.drillSequence
    } as WorkoutSession;
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static calculateArrayOverlap<T>(arr1: T[], arr2: T[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private static getPopularTags(metadata: StandardMetadata[]): { tag: string; count: number }[] {
    const tagCounts: Record<string, number> = {};
    
    metadata.forEach(meta => {
      meta.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static generateMockUsageTrends(metadata: StandardMetadata[]): { date: string; count: number }[] {
    const trends: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Mock usage count based on metadata
      const count = Math.floor(Math.random() * 10) + metadata.length * 0.1;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.round(count)
      });
    }
    
    return trends;
  }
}

// Export common integration functions
export const {
  unifyWorkoutSession,
  unifySessionTemplate,
  createSearchableWorkouts,
  searchWorkouts,
  filterAndSortWorkouts,
  generateWorkoutAnalytics,
  updateWorkoutMetadata,
  findSimilarWorkouts,
  calculateMetadataSimilarity,
  generateRecommendations,
  validateWorkoutCollection
} = MetadataIntegration;

// Export utility functions for common operations
export const metadataIntegration = {
  unify: {
    session: MetadataIntegration.unifyWorkoutSession,
    template: MetadataIntegration.unifySessionTemplate
  },
  search: {
    create: MetadataIntegration.createSearchableWorkouts,
    query: MetadataIntegration.searchWorkouts
  },
  filter: MetadataIntegration.filterAndSortWorkouts,
  analyze: MetadataIntegration.generateWorkoutAnalytics,
  recommend: MetadataIntegration.generateRecommendations,
  validate: MetadataIntegration.validateWorkoutCollection,
  similarity: MetadataIntegration.calculateMetadataSimilarity
};