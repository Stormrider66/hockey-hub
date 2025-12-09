/**
 * WorkoutRecommendationEngine Service
 * 
 * Advanced recommendation system using collaborative filtering, content-based filtering,
 * and hybrid approaches for workout template recommendations.
 */

import WorkoutTemplateAnalytics, { 
  TemplateRecommendationData, 
  RecommendationReason, 
  ContextFactor 
} from './WorkoutTemplateAnalytics';

export interface UserProfile {
  userId: string;
  teamId?: string;
  position?: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  preferences: UserPreferences;
  workoutHistory: WorkoutHistoryItem[];
  medicalRestrictions: string[];
  availableEquipment: string[];
}

export interface UserPreferences {
  preferredTypes: WorkoutType[];
  preferredDuration: { min: number; max: number };
  preferredIntensity: 'low' | 'medium' | 'high';
  avoidedEquipment: string[];
  favoriteCategories: string[];
  timePreferences: TimePreferences;
}

export interface TimePreferences {
  preferredTimes: string[]; // ['morning', 'afternoon', 'evening']
  maxDuration: number;
  restDayPreferences: string[];
}

export interface WorkoutHistoryItem {
  templateId: string;
  sessionId: string;
  completedAt: string;
  rating?: number;
  modifications: string[];
  completionRate: number;
  notes?: string;
}

export interface WorkoutType {
  type: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
}

export interface TemplateFeatures {
  templateId: string;
  type: WorkoutType['type'];
  categories: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  duration: number;
  primaryMuscleGroups: string[];
  keywords: string[];
  tags: string[];
  intensityScore: number; // 0-1
  complexityScore: number; // 0-1
}

export interface SimilarityMatrix {
  templateId1: string;
  templateId2: string;
  similarity: number;
  factors: SimilarityFactor[];
}

export interface SimilarityFactor {
  factor: 'type' | 'equipment' | 'duration' | 'difficulty' | 'categories' | 'keywords';
  score: number;
  weight: number;
}

export interface CollaborativeFilteringData {
  userTemplateMatrix: Map<string, Map<string, number>>; // userId -> templateId -> rating
  templateSimilarities: Map<string, Map<string, number>>; // templateId -> templateId -> similarity
  userSimilarities: Map<string, Map<string, number>>; // userId -> userId -> similarity
}

export interface RecommendationContext {
  userId: string;
  teamId?: string;
  currentSeason: 'preseason' | 'inseason' | 'playoffs' | 'offseason';
  availableTime: number; // minutes
  availableEquipment: string[];
  recentWorkouts: string[]; // recent template IDs
  trainingGoals: string[];
  playerLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  medicalRestrictions: string[];
  teamPreferences?: TeamPreferences;
}

export interface TeamPreferences {
  focusAreas: string[];
  avoidedExercises: string[];
  preferredIntensity: number;
  sessionLengthPreference: number;
}

export interface RecommendationResult {
  recommendations: TemplateRecommendationData[];
  explanations: RecommendationExplanation[];
  alternativeOptions: TemplateRecommendationData[];
  metadata: RecommendationMetadata;
}

export interface RecommendationExplanation {
  templateId: string;
  primaryReason: string;
  supportingFactors: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface RecommendationMetadata {
  algorithm: 'collaborative' | 'content_based' | 'hybrid' | 'popularity';
  confidence: number;
  contextFactors: string[];
  filteringCriteria: string[];
  generatedAt: string;
}

class WorkoutRecommendationEngine {
  private static instance: WorkoutRecommendationEngine;
  private analytics: WorkoutTemplateAnalytics;
  private collaborativeData: CollaborativeFilteringData;
  private templateFeatures: Map<string, TemplateFeatures> = new Map();
  private similarityCache: Map<string, number> = new Map();

  // Algorithm weights
  private readonly ALGORITHM_WEIGHTS = {
    collaborative: 0.4,
    contentBased: 0.35,
    popularity: 0.15,
    contextual: 0.1
  };

  public static getInstance(): WorkoutRecommendationEngine {
    if (!WorkoutRecommendationEngine.instance) {
      WorkoutRecommendationEngine.instance = new WorkoutRecommendationEngine();
    }
    return WorkoutRecommendationEngine.instance;
  }

  constructor() {
    this.analytics = WorkoutTemplateAnalytics.getInstance();
    this.collaborativeData = {
      userTemplateMatrix: new Map(),
      templateSimilarities: new Map(),
      userSimilarities: new Map()
    };
    this.loadCachedData();
  }

  /**
   * Get personalized recommendations for a user
   */
  public getRecommendations(
    context: RecommendationContext,
    options: { limit?: number; includeAlternatives?: boolean } = {}
  ): RecommendationResult {
    const { limit = 10, includeAlternatives = true } = options;

    // Get recommendations from different algorithms
    const collaborativeRecs = this.getCollaborativeRecommendations(context, limit * 2);
    const contentBasedRecs = this.getContentBasedRecommendations(context, limit * 2);
    const popularityRecs = this.getPopularityRecommendations(context, limit);
    const contextualRecs = this.getContextualRecommendations(context, limit);

    // Combine and rank recommendations
    const combinedRecs = this.combineRecommendations([
      { source: 'collaborative', recs: collaborativeRecs, weight: this.ALGORITHM_WEIGHTS.collaborative },
      { source: 'content_based', recs: contentBasedRecs, weight: this.ALGORITHM_WEIGHTS.contentBased },
      { source: 'popularity', recs: popularityRecs, weight: this.ALGORITHM_WEIGHTS.popularity },
      { source: 'contextual', recs: contextualRecs, weight: this.ALGORITHM_WEIGHTS.contextual }
    ]);

    // Apply filtering and ranking
    const filteredRecs = this.applyContextualFiltering(combinedRecs, context);
    const rankedRecs = this.rankRecommendations(filteredRecs, context);

    // Generate final result
    const recommendations = rankedRecs.slice(0, limit);
    const alternatives = includeAlternatives ? rankedRecs.slice(limit, limit + 5) : [];

    return {
      recommendations,
      explanations: this.generateExplanations(recommendations, context),
      alternativeOptions: alternatives,
      metadata: {
        algorithm: 'hybrid',
        confidence: this.calculateOverallConfidence(recommendations),
        contextFactors: this.extractContextFactors(context),
        filteringCriteria: this.getFilteringCriteria(context),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Update user interaction data
   */
  public updateUserInteraction(
    userId: string,
    templateId: string,
    interactionType: 'viewed' | 'started' | 'completed' | 'rated' | 'skipped',
    rating?: number
  ): void {
    const userMatrix = this.collaborativeData.userTemplateMatrix.get(userId) || new Map();
    
    let score = userMatrix.get(templateId) || 0;
    
    // Update score based on interaction type
    switch (interactionType) {
      case 'viewed':
        score = Math.max(score, 0.1);
        break;
      case 'started':
        score = Math.max(score, 0.3);
        break;
      case 'completed':
        score = Math.max(score, 0.7);
        break;
      case 'rated':
        score = rating ? rating / 10 : score; // Normalize to 0-1
        break;
      case 'skipped':
        score = Math.min(score, -0.2);
        break;
    }
    
    userMatrix.set(templateId, score);
    this.collaborativeData.userTemplateMatrix.set(userId, userMatrix);
    
    // Invalidate similarity cache
    this.similarityCache.clear();
    
    // Update similarity matrices
    this.updateSimilarityMatrices();
    
    // Persist data
    this.persistData();
  }

  /**
   * Collaborative Filtering Recommendations
   */
  private getCollaborativeRecommendations(
    context: RecommendationContext,
    limit: number
  ): TemplateRecommendationData[] {
    const userMatrix = this.collaborativeData.userTemplateMatrix.get(context.userId);
    if (!userMatrix || userMatrix.size === 0) {
      return this.getFallbackRecommendations(context, limit);
    }

    // Find similar users
    const similarUsers = this.findSimilarUsers(context.userId, 10);
    
    // Get template recommendations from similar users
    const recommendations = new Map<string, { score: number; reasons: RecommendationReason[] }>();
    
    similarUsers.forEach((similarity, similarUserId) => {
      const similarUserMatrix = this.collaborativeData.userTemplateMatrix.get(similarUserId);
      if (!similarUserMatrix) return;
      
      similarUserMatrix.forEach((rating, templateId) => {
        if (userMatrix.has(templateId)) return; // Skip already interacted templates
        
        const existing = recommendations.get(templateId) || { score: 0, reasons: [] };
        const weightedScore = rating * similarity * this.ALGORITHM_WEIGHTS.collaborative;
        
        existing.score += weightedScore;
        existing.reasons.push({
          type: 'similar_users',
          weight: similarity,
          description: `Users with similar preferences rated this highly (${Math.round(rating * 10)}/10)`
        });
        
        recommendations.set(templateId, existing);
      });
    });

    // Convert to recommendation data
    const results: TemplateRecommendationData[] = Array.from(recommendations.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([templateId, data]) => ({
        templateId,
        score: Math.min(1, data.score),
        reasons: data.reasons,
        contextFactors: this.extractContextFactorsForTemplate(templateId, context),
        confidence: this.calculateCollaborativeConfidence(templateId, context)
      }));

    return results;
  }

  /**
   * Content-Based Filtering Recommendations
   */
  private getContentBasedRecommendations(
    context: RecommendationContext,
    limit: number
  ): TemplateRecommendationData[] {
    const userMatrix = this.collaborativeData.userTemplateMatrix.get(context.userId);
    if (!userMatrix || userMatrix.size === 0) {
      return this.getFallbackRecommendations(context, limit);
    }

    // Get liked templates by user
    const likedTemplates = Array.from(userMatrix.entries())
      .filter(([, rating]) => rating > 0.5)
      .map(([templateId]) => templateId);

    if (likedTemplates.length === 0) {
      return this.getFallbackRecommendations(context, limit);
    }

    // Find templates similar to liked ones
    const recommendations = new Map<string, { score: number; reasons: RecommendationReason[] }>();
    
    likedTemplates.forEach(likedTemplateId => {
      const similarities = this.collaborativeData.templateSimilarities.get(likedTemplateId);
      if (!similarities) return;
      
      similarities.forEach((similarity, candidateTemplateId) => {
        if (userMatrix.has(candidateTemplateId)) return; // Skip already interacted
        if (similarity < 0.3) return; // Skip low similarity
        
        const existing = recommendations.get(candidateTemplateId) || { score: 0, reasons: [] };
        const weightedScore = similarity * this.ALGORITHM_WEIGHTS.contentBased;
        
        existing.score += weightedScore;
        existing.reasons.push({
          type: 'content_similarity',
          weight: similarity,
          description: `Similar to templates you've enjoyed (${Math.round(similarity * 100)}% match)`
        });
        
        recommendations.set(candidateTemplateId, existing);
      });
    });

    // Convert to recommendation data
    const results: TemplateRecommendationData[] = Array.from(recommendations.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([templateId, data]) => ({
        templateId,
        score: Math.min(1, data.score),
        reasons: data.reasons,
        contextFactors: this.extractContextFactorsForTemplate(templateId, context),
        confidence: this.calculateContentBasedConfidence(templateId, context)
      }));

    return results;
  }

  /**
   * Popularity-Based Recommendations
   */
  private getPopularityRecommendations(
    context: RecommendationContext,
    limit: number
  ): TemplateRecommendationData[] {
    // Get popular templates from analytics
    const allTemplateIds = Array.from(this.templateFeatures.keys());
    const templateRankings = this.analytics.getTemplateRankings(allTemplateIds);
    
    return templateRankings
      .slice(0, limit)
      .map(({ templateId, score }) => ({
        templateId,
        score: score / 100, // Convert to 0-1 scale
        reasons: [{
          type: 'success_rate',
          weight: this.ALGORITHM_WEIGHTS.popularity,
          description: `Highly effective template with ${score}% success rate`
        }],
        contextFactors: this.extractContextFactorsForTemplate(templateId, context),
        confidence: 0.7 // Popularity is generally reliable
      }));
  }

  /**
   * Contextual Recommendations
   */
  private getContextualRecommendations(
    context: RecommendationContext,
    limit: number
  ): TemplateRecommendationData[] {
    const contextualCandidates: TemplateRecommendationData[] = [];
    
    // Season-based recommendations
    const seasonalTemplates = this.getSeasonalRecommendations(context.currentSeason, limit);
    
    // Equipment-based filtering
    const equipmentFiltered = this.filterByAvailableEquipment(seasonalTemplates, context.availableEquipment);
    
    // Duration-based filtering
    const durationFiltered = this.filterByDuration(equipmentFiltered, context.availableTime);
    
    return durationFiltered.map(template => ({
      ...template,
      reasons: [
        ...template.reasons,
        {
          type: 'seasonal_trend',
          weight: this.ALGORITHM_WEIGHTS.contextual,
          description: `Optimized for ${context.currentSeason} training phase`
        }
      ]
    }));
  }

  /**
   * Combine recommendations from multiple algorithms
   */
  private combineRecommendations(
    sources: Array<{ source: string; recs: TemplateRecommendationData[]; weight: number }>
  ): TemplateRecommendationData[] {
    const combined = new Map<string, TemplateRecommendationData>();
    
    sources.forEach(({ recs, weight }) => {
      recs.forEach(rec => {
        const existing = combined.get(rec.templateId);
        if (existing) {
          // Merge recommendations
          existing.score = Math.max(existing.score, rec.score * weight);
          existing.reasons = [...existing.reasons, ...rec.reasons];
          existing.confidence = (existing.confidence + rec.confidence) / 2;
        } else {
          combined.set(rec.templateId, {
            ...rec,
            score: rec.score * weight
          });
        }
      });
    });
    
    return Array.from(combined.values());
  }

  /**
   * Apply contextual filtering to recommendations
   */
  private applyContextualFiltering(
    recommendations: TemplateRecommendationData[],
    context: RecommendationContext
  ): TemplateRecommendationData[] {
    return recommendations.filter(rec => {
      const features = this.templateFeatures.get(rec.templateId);
      if (!features) return false;
      
      // Filter by medical restrictions
      if (context.medicalRestrictions.length > 0) {
        const hasRestrictedEquipment = features.equipment.some(eq => 
          context.medicalRestrictions.some(restriction => 
            eq.toLowerCase().includes(restriction.toLowerCase())
          )
        );
        if (hasRestrictedEquipment) return false;
      }
      
      // Filter by available equipment
      if (context.availableEquipment.length > 0) {
        const hasRequiredEquipment = features.equipment.every(eq => 
          context.availableEquipment.includes(eq)
        );
        if (!hasRequiredEquipment) return false;
      }
      
      // Filter by duration
      if (context.availableTime > 0 && features.duration > context.availableTime * 1.2) {
        return false;
      }
      
      // Filter by difficulty level
      const levelOrder = ['beginner', 'intermediate', 'advanced', 'elite'];
      const userLevelIndex = levelOrder.indexOf(context.playerLevel);
      const templateLevelIndex = levelOrder.indexOf(features.difficulty);
      
      // Allow templates within ±1 difficulty level
      if (Math.abs(userLevelIndex - templateLevelIndex) > 1) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Rank recommendations using hybrid scoring
   */
  private rankRecommendations(
    recommendations: TemplateRecommendationData[],
    context: RecommendationContext
  ): TemplateRecommendationData[] {
    return recommendations
      .map(rec => ({
        ...rec,
        score: this.calculateFinalScore(rec, context)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate final hybrid score for a recommendation
   */
  private calculateFinalScore(
    recommendation: TemplateRecommendationData,
    context: RecommendationContext
  ): number {
    const features = this.templateFeatures.get(recommendation.templateId);
    if (!features) return recommendation.score;
    
    let finalScore = recommendation.score;
    
    // Apply contextual boosts
    const analytics = this.analytics.getTemplateAnalytics(recommendation.templateId);
    
    // Effectiveness boost
    finalScore *= (1 + analytics.effectivenessScore / 100);
    
    // Recency boost (prefer recently used templates by others)
    const daysSinceUsed = this.getDaysSinceLastUsed(recommendation.templateId);
    if (daysSinceUsed < 7) {
      finalScore *= 1.1;
    }
    
    // Diversity penalty (avoid too many similar recommendations)
    const diversityPenalty = this.calculateDiversityPenalty(recommendation.templateId, context);
    finalScore *= (1 - diversityPenalty);
    
    // Confidence adjustment
    finalScore *= recommendation.confidence;
    
    return Math.max(0, Math.min(1, finalScore));
  }

  // Helper methods

  private findSimilarUsers(userId: string, limit: number): Map<string, number> {
    const similarities = this.collaborativeData.userSimilarities.get(userId) || new Map();
    
    return new Map(
      Array.from(similarities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
    );
  }

  private updateSimilarityMatrices(): void {
    // Update template similarities using cosine similarity
    this.updateTemplateSimilarities();
    
    // Update user similarities using Pearson correlation
    this.updateUserSimilarities();
  }

  private updateTemplateSimilarities(): void {
    const templateIds = Array.from(this.templateFeatures.keys());
    
    for (let i = 0; i < templateIds.length; i++) {
      for (let j = i + 1; j < templateIds.length; j++) {
        const template1 = templateIds[i];
        const template2 = templateIds[j];
        
        const similarity = this.calculateTemplateSimilarity(template1, template2);
        
        // Store bidirectional similarity
        let similarities1 = this.collaborativeData.templateSimilarities.get(template1) || new Map();
        let similarities2 = this.collaborativeData.templateSimilarities.get(template2) || new Map();
        
        similarities1.set(template2, similarity);
        similarities2.set(template1, similarity);
        
        this.collaborativeData.templateSimilarities.set(template1, similarities1);
        this.collaborativeData.templateSimilarities.set(template2, similarities2);
      }
    }
  }

  private updateUserSimilarities(): void {
    const userIds = Array.from(this.collaborativeData.userTemplateMatrix.keys());
    
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const user1 = userIds[i];
        const user2 = userIds[j];
        
        const similarity = this.calculateUserSimilarity(user1, user2);
        
        if (similarity > 0.1) { // Only store significant similarities
          let similarities1 = this.collaborativeData.userSimilarities.get(user1) || new Map();
          let similarities2 = this.collaborativeData.userSimilarities.get(user2) || new Map();
          
          similarities1.set(user2, similarity);
          similarities2.set(user1, similarity);
          
          this.collaborativeData.userSimilarities.set(user1, similarities1);
          this.collaborativeData.userSimilarities.set(user2, similarities2);
        }
      }
    }
  }

  private calculateTemplateSimilarity(templateId1: string, templateId2: string): number {
    const features1 = this.templateFeatures.get(templateId1);
    const features2 = this.templateFeatures.get(templateId2);
    
    if (!features1 || !features2) return 0;
    
    // Calculate feature similarities
    const typeMatch = features1.type === features2.type ? 1 : 0;
    const difficultyMatch = features1.difficulty === features2.difficulty ? 1 : 0;
    
    // Equipment similarity (Jaccard coefficient)
    const equipmentSimilarity = this.calculateJaccardSimilarity(
      features1.equipment,
      features2.equipment
    );
    
    // Category similarity
    const categorySimilarity = this.calculateJaccardSimilarity(
      features1.categories,
      features2.categories
    );
    
    // Duration similarity (normalized difference)
    const durationSimilarity = 1 - Math.abs(features1.duration - features2.duration) / 
      Math.max(features1.duration, features2.duration);
    
    // Keyword similarity using TF-IDF cosine similarity
    const keywordSimilarity = this.calculateTFIDFSimilarity(
      features1.keywords,
      features2.keywords
    );
    
    // Weighted combination
    const weights = {
      type: 0.25,
      difficulty: 0.15,
      equipment: 0.20,
      category: 0.15,
      duration: 0.10,
      keywords: 0.15
    };
    
    return (
      typeMatch * weights.type +
      difficultyMatch * weights.difficulty +
      equipmentSimilarity * weights.equipment +
      categorySimilarity * weights.category +
      durationSimilarity * weights.duration +
      keywordSimilarity * weights.keywords
    );
  }

  private calculateUserSimilarity(userId1: string, userId2: string): number {
    const matrix1 = this.collaborativeData.userTemplateMatrix.get(userId1);
    const matrix2 = this.collaborativeData.userTemplateMatrix.get(userId2);
    
    if (!matrix1 || !matrix2) return 0;
    
    // Find common templates
    const commonTemplates = Array.from(matrix1.keys()).filter(templateId => 
      matrix2.has(templateId)
    );
    
    if (commonTemplates.length < 2) return 0;
    
    // Calculate Pearson correlation
    const ratings1 = commonTemplates.map(templateId => matrix1.get(templateId)!);
    const ratings2 = commonTemplates.map(templateId => matrix2.get(templateId)!);
    
    const mean1 = ratings1.reduce((sum, r) => sum + r, 0) / ratings1.length;
    const mean2 = ratings2.reduce((sum, r) => sum + r, 0) / ratings2.length;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < ratings1.length; i++) {
      const diff1 = ratings1[i] - mean1;
      const diff2 = ratings2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateJaccardSimilarity(set1: string[], set2: string[]): number {
    const setA = new Set(set1);
    const setB = new Set(set2);
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private calculateTFIDFSimilarity(keywords1: string[], keywords2: string[]): number {
    // Simple TF-IDF implementation
    const allKeywords = Array.from(new Set([...keywords1, ...keywords2]));
    
    if (allKeywords.length === 0) return 0;
    
    // Calculate TF for each document
    const tf1 = this.calculateTF(keywords1, allKeywords);
    const tf2 = this.calculateTF(keywords2, allKeywords);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < allKeywords.length; i++) {
      dotProduct += tf1[i] * tf2[i];
      norm1 += tf1[i] * tf1[i];
      norm2 += tf2[i] * tf2[i];
    }
    
    const normProduct = Math.sqrt(norm1) * Math.sqrt(norm2);
    return normProduct === 0 ? 0 : dotProduct / normProduct;
  }

  private calculateTF(keywords: string[], vocabulary: string[]): number[] {
    const tf = new Array(vocabulary.length).fill(0);
    
    keywords.forEach(keyword => {
      const index = vocabulary.indexOf(keyword);
      if (index !== -1) {
        tf[index]++;
      }
    });
    
    // Normalize by document length
    const docLength = keywords.length;
    return tf.map(freq => docLength > 0 ? freq / docLength : 0);
  }

  private getFallbackRecommendations(
    context: RecommendationContext,
    limit: number
  ): TemplateRecommendationData[] {
    // Fallback to popular templates when no user data is available
    return this.getPopularityRecommendations(context, limit);
  }

  private extractContextFactors(context: RecommendationContext): string[] {
    const factors: string[] = [];
    
    factors.push(`Season: ${context.currentSeason}`);
    factors.push(`Available time: ${context.availableTime} minutes`);
    factors.push(`Player level: ${context.playerLevel}`);
    
    if (context.availableEquipment.length > 0) {
      factors.push(`Equipment: ${context.availableEquipment.slice(0, 3).join(', ')}`);
    }
    
    if (context.medicalRestrictions.length > 0) {
      factors.push(`Restrictions: ${context.medicalRestrictions.length} active`);
    }
    
    return factors;
  }

  private extractContextFactorsForTemplate(
    templateId: string,
    context: RecommendationContext
  ): ContextFactor[] {
    const features = this.templateFeatures.get(templateId);
    const factors: ContextFactor[] = [];
    
    if (features) {
      factors.push({
        factor: 'time_of_season',
        value: context.currentSeason,
        influence: this.getSeasonalInfluence(features.type, context.currentSeason)
      });
      
      factors.push({
        factor: 'player_level',
        value: context.playerLevel,
        influence: this.getLevelMatch(features.difficulty, context.playerLevel)
      });
      
      if (context.availableEquipment.length > 0) {
        factors.push({
          factor: 'available_equipment',
          value: context.availableEquipment,
          influence: this.getEquipmentMatch(features.equipment, context.availableEquipment)
        });
      }
    }
    
    return factors;
  }

  private getSeasonalInfluence(type: WorkoutType['type'], season: string): number {
    const influences: Record<string, Record<string, number>> = {
      'preseason': { 'CONDITIONING': 0.8, 'STRENGTH': 0.9, 'HYBRID': 0.7, 'AGILITY': 0.6 },
      'inseason': { 'CONDITIONING': 0.6, 'STRENGTH': 0.5, 'HYBRID': 0.8, 'AGILITY': 0.9 },
      'playoffs': { 'CONDITIONING': 0.7, 'STRENGTH': 0.4, 'HYBRID': 0.6, 'AGILITY': 0.9 },
      'offseason': { 'CONDITIONING': 0.5, 'STRENGTH': 1.0, 'HYBRID': 0.8, 'AGILITY': 0.3 }
    };
    
    return influences[season]?.[type] || 0.5;
  }

  private getLevelMatch(templateLevel: string, userLevel: string): number {
    const levels = ['beginner', 'intermediate', 'advanced', 'elite'];
    const templateIndex = levels.indexOf(templateLevel);
    const userIndex = levels.indexOf(userLevel);
    
    const difference = Math.abs(templateIndex - userIndex);
    return Math.max(0, 1 - difference * 0.3);
  }

  private getEquipmentMatch(templateEquipment: string[], availableEquipment: string[]): number {
    const requiredCount = templateEquipment.length;
    const availableCount = templateEquipment.filter(eq => availableEquipment.includes(eq)).length;
    
    return requiredCount > 0 ? availableCount / requiredCount : 1;
  }

  private getFilteringCriteria(context: RecommendationContext): string[] {
    const criteria: string[] = [];
    
    if (context.availableTime > 0) {
      criteria.push(`Duration ≤ ${context.availableTime} minutes`);
    }
    
    if (context.medicalRestrictions.length > 0) {
      criteria.push(`Medical restrictions applied`);
    }
    
    if (context.availableEquipment.length > 0) {
      criteria.push(`Equipment availability filtered`);
    }
    
    criteria.push(`Difficulty level: ${context.playerLevel}`);
    
    return criteria;
  }

  private generateExplanations(
    recommendations: TemplateRecommendationData[],
    context: RecommendationContext
  ): RecommendationExplanation[] {
    return recommendations.map(rec => {
      const primaryReason = this.getPrimaryReason(rec);
      const supportingFactors = this.getSupportingFactors(rec, context);
      const confidenceLevel = this.getConfidenceLevel(rec.confidence);
      
      return {
        templateId: rec.templateId,
        primaryReason,
        supportingFactors,
        confidenceLevel
      };
    });
  }

  private getPrimaryReason(rec: TemplateRecommendationData): string {
    if (rec.reasons.length === 0) return 'Popular choice among users';
    
    // Find the reason with highest weight
    const primaryReason = rec.reasons.reduce((max, reason) => 
      reason.weight > max.weight ? reason : max
    );
    
    return primaryReason.description;
  }

  private getSupportingFactors(
    rec: TemplateRecommendationData,
    context: RecommendationContext
  ): string[] {
    const factors: string[] = [];
    
    // Add context-based factors
    rec.contextFactors.forEach(factor => {
      if (factor.influence > 0.5) {
        factors.push(`Good fit for ${factor.factor.replace('_', ' ')}`);
      }
    });
    
    // Add analytics-based factors
    const analytics = this.analytics.getTemplateAnalytics(rec.templateId);
    
    if (analytics.effectivenessScore > 75) {
      factors.push(`High effectiveness score (${analytics.effectivenessScore}%)`);
    }
    
    if (analytics.averageRating > 0.7) {
      factors.push(`Highly rated by users (${Math.round(analytics.averageRating * 10)}/10)`);
    }
    
    return factors;
  }

  private getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence > 0.7) return 'high';
    if (confidence > 0.4) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(recommendations: TemplateRecommendationData[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private calculateCollaborativeConfidence(templateId: string, context: RecommendationContext): number {
    const userMatrix = this.collaborativeData.userTemplateMatrix.get(context.userId);
    if (!userMatrix || userMatrix.size === 0) return 0.3;
    
    const similarUsers = this.findSimilarUsers(context.userId, 5);
    const avgSimilarity = Array.from(similarUsers.values()).reduce((sum, sim) => sum + sim, 0) / similarUsers.size;
    
    return Math.min(1, 0.5 + avgSimilarity);
  }

  private calculateContentBasedConfidence(templateId: string, context: RecommendationContext): number {
    const features = this.templateFeatures.get(templateId);
    if (!features) return 0.3;
    
    // Base confidence on feature completeness
    const featureCompleteness = [
      features.equipment.length > 0,
      features.categories.length > 0,
      features.keywords.length > 0,
      features.primaryMuscleGroups.length > 0
    ].filter(Boolean).length / 4;
    
    return 0.4 + featureCompleteness * 0.4;
  }

  private getDaysSinceLastUsed(templateId: string): number {
    const analytics = this.analytics.getTemplateAnalytics(templateId);
    if (!analytics.performanceTrends.length) return 999;
    
    // This is a simplified calculation - in reality, you'd track actual usage timestamps
    return 1; // Mock value
  }

  private calculateDiversityPenalty(templateId: string, context: RecommendationContext): number {
    // Simplified diversity calculation - penalize similar template types
    const features = this.templateFeatures.get(templateId);
    if (!features) return 0;
    
    // This would be more sophisticated in a real implementation
    return 0; // No penalty for now
  }

  private getSeasonalRecommendations(season: string, limit: number): TemplateRecommendationData[] {
    // Mock seasonal recommendations based on template analytics
    const allTemplateIds = Array.from(this.templateFeatures.keys());
    
    return allTemplateIds.slice(0, limit).map(templateId => {
      const features = this.templateFeatures.get(templateId)!;
      const seasonalInfluence = this.getSeasonalInfluence(features.type, season);
      
      return {
        templateId,
        score: seasonalInfluence,
        reasons: [{
          type: 'seasonal_trend',
          weight: seasonalInfluence,
          description: `Optimized for ${season} training`
        }],
        contextFactors: [],
        confidence: 0.6
      };
    });
  }

  private filterByAvailableEquipment(
    templates: TemplateRecommendationData[],
    availableEquipment: string[]
  ): TemplateRecommendationData[] {
    if (availableEquipment.length === 0) return templates;
    
    return templates.filter(template => {
      const features = this.templateFeatures.get(template.templateId);
      if (!features) return false;
      
      return features.equipment.every(eq => availableEquipment.includes(eq));
    });
  }

  private filterByDuration(
    templates: TemplateRecommendationData[],
    availableTime: number
  ): TemplateRecommendationData[] {
    if (availableTime <= 0) return templates;
    
    return templates.filter(template => {
      const features = this.templateFeatures.get(template.templateId);
      if (!features) return false;
      
      return features.duration <= availableTime * 1.2; // Allow 20% buffer
    });
  }

  // Data persistence methods
  private persistData(): void {
    try {
      const data = {
        userTemplateMatrix: Array.from(this.collaborativeData.userTemplateMatrix.entries()),
        templateSimilarities: Array.from(this.collaborativeData.templateSimilarities.entries()),
        userSimilarities: Array.from(this.collaborativeData.userSimilarities.entries()),
        templateFeatures: Array.from(this.templateFeatures.entries())
      };
      
      localStorage.setItem('workout_recommendation_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist recommendation data:', error);
    }
  }

  private loadCachedData(): void {
    try {
      const cached = localStorage.getItem('workout_recommendation_data');
      if (cached) {
        const data = JSON.parse(cached);
        
        this.collaborativeData.userTemplateMatrix = new Map(data.userTemplateMatrix || []);
        this.collaborativeData.templateSimilarities = new Map(data.templateSimilarities || []);
        this.collaborativeData.userSimilarities = new Map(data.userSimilarities || []);
        this.templateFeatures = new Map(data.templateFeatures || []);
      }
    } catch (error) {
      console.error('Failed to load cached recommendation data:', error);
    }
  }

  /**
   * Initialize template features for recommendation engine
   */
  public initializeTemplateFeatures(templates: any[]): void {
    templates.forEach(template => {
      const features: TemplateFeatures = {
        templateId: template.id,
        type: template.type,
        categories: template.categoryIds || [template.category],
        equipment: template.equipment || [],
        difficulty: template.difficulty || 'intermediate',
        duration: template.duration || 60,
        primaryMuscleGroups: this.extractMuscleGroups(template),
        keywords: this.extractKeywords(template),
        tags: template.tags || [],
        intensityScore: this.calculateIntensityScore(template),
        complexityScore: this.calculateComplexityScore(template)
      };
      
      this.templateFeatures.set(template.id, features);
    });
    
    // Update similarity matrices after initializing features
    this.updateSimilarityMatrices();
    this.persistData();
  }

  private extractMuscleGroups(template: any): string[] {
    // Extract muscle groups from template exercises (simplified)
    if (template.exercises && Array.isArray(template.exercises)) {
      return template.exercises
        .flatMap((exercise: any) => exercise.muscleGroups || [])
        .filter((group: string, index: number, arr: string[]) => arr.indexOf(group) === index);
    }
    return [];
  }

  private extractKeywords(template: any): string[] {
    const keywords: string[] = [];
    
    // Extract from name and description
    const text = `${template.name} ${template.description || ''}`.toLowerCase();
    const words = text.split(/\W+/).filter(word => word.length > 2);
    
    // Add exercise names
    if (template.exercises) {
      template.exercises.forEach((exercise: any) => {
        if (exercise.name) {
          keywords.push(...exercise.name.toLowerCase().split(/\W+/));
        }
      });
    }
    
    // Remove duplicates and common words
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return Array.from(new Set(keywords.filter(word => !stopWords.has(word))));
  }

  private calculateIntensityScore(template: any): number {
    // Calculate intensity based on template characteristics (0-1 scale)
    let intensity = 0.5; // Default medium intensity
    
    if (template.type === 'CONDITIONING') intensity += 0.2;
    if (template.type === 'AGILITY') intensity += 0.1;
    if (template.difficulty === 'advanced' || template.difficulty === 'elite') intensity += 0.2;
    if (template.duration > 60) intensity += 0.1;
    
    return Math.min(1, intensity);
  }

  private calculateComplexityScore(template: any): number {
    // Calculate complexity based on template characteristics (0-1 scale)
    let complexity = 0.5;
    
    if (template.exercises && template.exercises.length > 8) complexity += 0.2;
    if (template.equipment && template.equipment.length > 5) complexity += 0.1;
    if (template.type === 'HYBRID') complexity += 0.2;
    if (template.difficulty === 'advanced' || template.difficulty === 'elite') complexity += 0.1;
    
    return Math.min(1, complexity);
  }
}

export default WorkoutRecommendationEngine;