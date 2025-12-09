/**
 * WorkoutTemplateAnalytics Service
 * 
 * Tracks template usage frequency, success rates, and effectiveness based on player performance.
 * Provides analytics for template optimization and recommendation engine.
 */

export interface TemplateUsageEvent {
  templateId: string;
  userId: string;
  teamId?: string;
  sessionId: string;
  timestamp: string;
  sessionType: 'scheduled' | 'adhoc' | 'repeated';
  modifications?: TemplateModification[];
}

export interface TemplateModification {
  type: 'exercise_added' | 'exercise_removed' | 'exercise_modified' | 'duration_changed' | 'intensity_changed';
  originalValue: any;
  newValue: any;
  exerciseId?: string;
  reason?: string;
}

export interface TemplatePerformanceData {
  templateId: string;
  sessionId: string;
  playerMetrics: PlayerPerformanceMetrics[];
  completionRate: number;
  averageIntensity: number;
  playerSatisfaction?: number; // 1-10 rating
  injuryIncidents: number;
  modifications: TemplateModification[];
  sessionDuration: number; // actual vs planned
  timestamp: string;
}

export interface PlayerPerformanceMetrics {
  playerId: string;
  exerciseCompletionRate: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averagePower?: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  recoveryTime: number; // minutes
  injuryRisk: number; // 0-1 score
}

export interface TemplateAnalytics {
  templateId: string;
  totalUsage: number;
  uniqueUsers: number;
  averageRating: number;
  completionRate: number;
  effectivenessScore: number; // 0-100 composite score
  popularityScore: number; // 0-100 relative to other templates
  modificationFrequency: number; // 0-1, how often template is modified
  commonModifications: ModificationPattern[];
  performanceTrends: PerformanceTrend[];
  seasonalUsage: SeasonalUsagePattern;
  playerFeedback: PlayerFeedbackSummary;
  lastUpdated: string;
}

export interface ModificationPattern {
  type: TemplateModification['type'];
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  suggestedAction?: string;
}

export interface PerformanceTrend {
  metric: 'completion_rate' | 'satisfaction' | 'injury_rate' | 'intensity';
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
  timeframe: '7d' | '30d' | '90d';
}

export interface SeasonalUsagePattern {
  preseason: number;
  inseason: number;
  playoffs: number;
  offseason: number;
  peakMonth: string;
  lowestMonth: string;
}

export interface PlayerFeedbackSummary {
  averageRating: number;
  totalResponses: number;
  sentimentScore: number; // -1 to 1
  commonPraise: string[];
  commonComplaints: string[];
  recommendationRate: number; // 0-1
}

export interface TemplateRecommendationData {
  templateId: string;
  score: number;
  reasons: RecommendationReason[];
  contextFactors: ContextFactor[];
  confidence: number; // 0-1
}

export interface RecommendationReason {
  type: 'similar_users' | 'content_similarity' | 'seasonal_trend' | 'success_rate' | 'team_preference';
  weight: number;
  description: string;
}

export interface ContextFactor {
  factor: 'time_of_season' | 'player_level' | 'available_equipment' | 'team_size' | 'recent_workouts';
  value: any;
  influence: number; // -1 to 1
}

class WorkoutTemplateAnalytics {
  private static instance: WorkoutTemplateAnalytics;
  private usageEvents: Map<string, TemplateUsageEvent[]> = new Map();
  private performanceData: Map<string, TemplatePerformanceData[]> = new Map();
  private analyticsCache: Map<string, TemplateAnalytics> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  public static getInstance(): WorkoutTemplateAnalytics {
    if (!WorkoutTemplateAnalytics.instance) {
      WorkoutTemplateAnalytics.instance = new WorkoutTemplateAnalytics();
    }
    return WorkoutTemplateAnalytics.instance;
  }

  /**
   * Track template usage event
   */
  public trackUsage(event: TemplateUsageEvent): void {
    const events = this.usageEvents.get(event.templateId) || [];
    events.push(event);
    this.usageEvents.set(event.templateId, events);
    
    // Invalidate cache
    this.invalidateCache(event.templateId);
    
    // Store in localStorage for persistence
    this.persistUsageData();
  }

  /**
   * Record template performance data
   */
  public recordPerformance(data: TemplatePerformanceData): void {
    const performances = this.performanceData.get(data.templateId) || [];
    performances.push(data);
    this.performanceData.set(data.templateId, performances);
    
    // Invalidate cache
    this.invalidateCache(data.templateId);
    
    // Store in localStorage for persistence
    this.persistPerformanceData();
  }

  /**
   * Get comprehensive analytics for a template
   */
  public getTemplateAnalytics(templateId: string): TemplateAnalytics {
    // Check cache first
    const cached = this.getCachedAnalytics(templateId);
    if (cached) {
      return cached;
    }

    // Generate new analytics
    const analytics = this.calculateAnalytics(templateId);
    
    // Cache the result
    this.analyticsCache.set(templateId, analytics);
    this.cacheExpiry.set(templateId, Date.now() + this.CACHE_DURATION);
    
    return analytics;
  }

  /**
   * Get analytics for multiple templates
   */
  public getBulkAnalytics(templateIds: string[]): Map<string, TemplateAnalytics> {
    const results = new Map<string, TemplateAnalytics>();
    
    templateIds.forEach(id => {
      results.set(id, this.getTemplateAnalytics(id));
    });
    
    return results;
  }

  /**
   * Calculate effectiveness score based on multiple factors
   */
  public calculateEffectivenessScore(templateId: string): number {
    const performances = this.performanceData.get(templateId) || [];
    const usages = this.usageEvents.get(templateId) || [];
    
    if (performances.length === 0) return 0;

    // Factor weights
    const weights = {
      completionRate: 0.25,
      satisfaction: 0.20,
      injuryRate: 0.20,
      modificationRate: 0.15,
      repeatUsage: 0.10,
      playerProgress: 0.10
    };

    // Calculate individual scores
    const avgCompletionRate = this.calculateAverageMetric(performances, 'completionRate');
    const avgSatisfaction = this.calculateAverageMetric(performances, 'playerSatisfaction') / 10;
    const injuryRate = this.calculateInjuryRate(performances);
    const modificationRate = this.calculateModificationRate(templateId);
    const repeatUsage = this.calculateRepeatUsageRate(templateId);
    const playerProgress = this.calculatePlayerProgressScore(templateId);

    // Weighted composite score
    const effectivenessScore = (
      (avgCompletionRate * weights.completionRate) +
      (avgSatisfaction * weights.satisfaction) +
      ((1 - injuryRate) * weights.injuryRate) + // Inverse injury rate
      ((1 - modificationRate) * weights.modificationRate) + // Less modifications = better
      (repeatUsage * weights.repeatUsage) +
      (playerProgress * weights.playerProgress)
    ) * 100;

    return Math.round(Math.max(0, Math.min(100, effectivenessScore)));
  }

  /**
   * Calculate popularity score relative to other templates
   */
  public calculatePopularityScore(templateId: string): number {
    const allTemplateIds = Array.from(this.usageEvents.keys());
    const usageCounts = allTemplateIds.map(id => this.usageEvents.get(id)?.length || 0);
    const currentUsage = this.usageEvents.get(templateId)?.length || 0;
    
    if (usageCounts.length === 0) return 0;
    
    const maxUsage = Math.max(...usageCounts);
    const minUsage = Math.min(...usageCounts);
    
    if (maxUsage === minUsage) return 50; // All templates have same usage
    
    const normalizedScore = (currentUsage - minUsage) / (maxUsage - minUsage);
    return Math.round(normalizedScore * 100);
  }

  /**
   * Identify common modification patterns
   */
  public getModificationPatterns(templateId: string): ModificationPattern[] {
    const usages = this.usageEvents.get(templateId) || [];
    const performances = this.performanceData.get(templateId) || [];
    
    const modificationMap = new Map<string, { count: number; impacts: number[] }>();
    
    // Collect all modifications
    [...usages, ...performances].forEach(event => {
      const modifications = event.modifications || [];
      modifications.forEach(mod => {
        const key = mod.type;
        const existing = modificationMap.get(key) || { count: 0, impacts: [] };
        existing.count++;
        
        // Estimate impact based on subsequent performance
        if ('completionRate' in event) {
          existing.impacts.push((event as TemplatePerformanceData).completionRate);
        }
        
        modificationMap.set(key, existing);
      });
    });
    
    // Convert to patterns
    const patterns: ModificationPattern[] = [];
    modificationMap.forEach((data, type) => {
      const frequency = data.count / Math.max(usages.length, 1);
      const avgImpact = data.impacts.length > 0 
        ? data.impacts.reduce((sum, impact) => sum + impact, 0) / data.impacts.length 
        : 0.5;
      
      patterns.push({
        type: type as TemplateModification['type'],
        frequency,
        impact: avgImpact > 0.7 ? 'positive' : avgImpact < 0.5 ? 'negative' : 'neutral',
        description: this.getModificationDescription(type as TemplateModification['type']),
        suggestedAction: this.getSuggestedAction(type as TemplateModification['type'], avgImpact)
      });
    });
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate performance trends over time
   */
  public getPerformanceTrends(templateId: string): PerformanceTrend[] {
    const performances = this.performanceData.get(templateId) || [];
    if (performances.length === 0) return [];
    
    const now = new Date();
    const timeframes = [
      { key: '7d' as const, days: 7 },
      { key: '30d' as const, days: 30 },
      { key: '90d' as const, days: 90 }
    ];
    
    const trends: PerformanceTrend[] = [];
    
    timeframes.forEach(({ key, days }) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const recentData = performances.filter(p => new Date(p.timestamp) >= cutoff);
      
      if (recentData.length < 2) return;
      
      // Calculate trends for key metrics
      const metrics = [
        { key: 'completion_rate' as const, getter: (p: TemplatePerformanceData) => p.completionRate },
        { key: 'satisfaction' as const, getter: (p: TemplatePerformanceData) => p.playerSatisfaction || 5 },
        { key: 'injury_rate' as const, getter: (p: TemplatePerformanceData) => p.injuryIncidents },
        { key: 'intensity' as const, getter: (p: TemplatePerformanceData) => p.averageIntensity }
      ];
      
      metrics.forEach(metric => {
        const trend = this.calculateTrend(recentData, metric.getter);
        trends.push({
          metric: metric.key,
          trend: trend.direction,
          changePercent: trend.changePercent,
          timeframe: key
        });
      });
    });
    
    return trends;
  }

  /**
   * Get seasonal usage patterns
   */
  public getSeasonalUsage(templateId: string): SeasonalUsagePattern {
    const usages = this.usageEvents.get(templateId) || [];
    
    const seasonCounts = {
      preseason: 0,
      inseason: 0,
      playoffs: 0,
      offseason: 0
    };
    
    const monthlyCounts = new Array(12).fill(0);
    
    usages.forEach(usage => {
      const date = new Date(usage.timestamp);
      const month = date.getMonth();
      monthlyCounts[month]++;
      
      // Determine season (hockey calendar)
      const season = this.determineSeason(month);
      seasonCounts[season]++;
    });
    
    const totalUsage = usages.length || 1;
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const maxMonthIndex = monthlyCounts.indexOf(Math.max(...monthlyCounts));
    const minMonthIndex = monthlyCounts.indexOf(Math.min(...monthlyCounts));
    
    return {
      preseason: seasonCounts.preseason / totalUsage,
      inseason: seasonCounts.inseason / totalUsage,
      playoffs: seasonCounts.playoffs / totalUsage,
      offseason: seasonCounts.offseason / totalUsage,
      peakMonth: monthNames[maxMonthIndex],
      lowestMonth: monthNames[minMonthIndex]
    };
  }

  /**
   * Generate player feedback summary
   */
  public getPlayerFeedbackSummary(templateId: string): PlayerFeedbackSummary {
    const performances = this.performanceData.get(templateId) || [];
    
    const ratings = performances
      .map(p => p.playerSatisfaction)
      .filter(rating => rating !== undefined) as number[];
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    // Simple sentiment analysis based on ratings and completion rates
    const sentimentScore = this.calculateSentimentScore(performances);
    
    // Mock feedback data - in real implementation, this would come from actual player feedback
    const commonPraise = this.generateCommonPraise(performances);
    const commonComplaints = this.generateCommonComplaints(performances);
    
    const recommendationRate = ratings.filter(r => r >= 7).length / Math.max(ratings.length, 1);
    
    return {
      averageRating,
      totalResponses: ratings.length,
      sentimentScore,
      commonPraise,
      commonComplaints,
      recommendationRate
    };
  }

  /**
   * Get template ranking by effectiveness
   */
  public getTemplateRankings(templateIds: string[]): Array<{ templateId: string; rank: number; score: number }> {
    const scores = templateIds.map(id => ({
      templateId: id,
      score: this.calculateEffectivenessScore(id)
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  /**
   * Export analytics data for reporting
   */
  public exportAnalytics(templateId: string): string {
    const analytics = this.getTemplateAnalytics(templateId);
    const usages = this.usageEvents.get(templateId) || [];
    const performances = this.performanceData.get(templateId) || [];
    
    const exportData = {
      templateId,
      analytics,
      rawData: {
        usageEvents: usages.length,
        performanceRecords: performances.length,
        dateRange: {
          start: usages.length > 0 ? usages[0].timestamp : null,
          end: usages.length > 0 ? usages[usages.length - 1].timestamp : null
        }
      },
      generatedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Private helper methods

  private getCachedAnalytics(templateId: string): TemplateAnalytics | null {
    const cached = this.analyticsCache.get(templateId);
    const expiry = this.cacheExpiry.get(templateId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  private invalidateCache(templateId: string): void {
    this.analyticsCache.delete(templateId);
    this.cacheExpiry.delete(templateId);
  }

  private calculateAnalytics(templateId: string): TemplateAnalytics {
    const usages = this.usageEvents.get(templateId) || [];
    const performances = this.performanceData.get(templateId) || [];
    
    const uniqueUsers = new Set(usages.map(u => u.userId)).size;
    const avgRating = this.calculateAverageMetric(performances, 'playerSatisfaction');
    const completionRate = this.calculateAverageMetric(performances, 'completionRate');
    
    return {
      templateId,
      totalUsage: usages.length,
      uniqueUsers,
      averageRating: avgRating / 10, // Convert to 0-1 scale
      completionRate,
      effectivenessScore: this.calculateEffectivenessScore(templateId),
      popularityScore: this.calculatePopularityScore(templateId),
      modificationFrequency: this.calculateModificationRate(templateId),
      commonModifications: this.getModificationPatterns(templateId),
      performanceTrends: this.getPerformanceTrends(templateId),
      seasonalUsage: this.getSeasonalUsage(templateId),
      playerFeedback: this.getPlayerFeedbackSummary(templateId),
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateAverageMetric(
    performances: TemplatePerformanceData[], 
    metric: keyof TemplatePerformanceData
  ): number {
    const values = performances
      .map(p => p[metric])
      .filter(val => typeof val === 'number') as number[];
    
    return values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0;
  }

  private calculateInjuryRate(performances: TemplatePerformanceData[]): number {
    const totalIncidents = performances.reduce((sum, p) => sum + p.injuryIncidents, 0);
    const totalSessions = performances.length;
    return totalSessions > 0 ? totalIncidents / totalSessions : 0;
  }

  private calculateModificationRate(templateId: string): number {
    const usages = this.usageEvents.get(templateId) || [];
    const modifiedSessions = usages.filter(u => u.modifications && u.modifications.length > 0).length;
    return usages.length > 0 ? modifiedSessions / usages.length : 0;
  }

  private calculateRepeatUsageRate(templateId: string): number {
    const usages = this.usageEvents.get(templateId) || [];
    const repeatUsers = new Map<string, number>();
    
    usages.forEach(usage => {
      const count = repeatUsers.get(usage.userId) || 0;
      repeatUsers.set(usage.userId, count + 1);
    });
    
    const totalRepeats = Array.from(repeatUsers.values()).filter(count => count > 1).length;
    const totalUsers = repeatUsers.size;
    
    return totalUsers > 0 ? totalRepeats / totalUsers : 0;
  }

  private calculatePlayerProgressScore(templateId: string): number {
    const performances = this.performanceData.get(templateId) || [];
    if (performances.length < 2) return 0.5;
    
    // Group by player and calculate improvement
    const playerProgress = new Map<string, number[]>();
    
    performances.forEach(perf => {
      perf.playerMetrics.forEach(metric => {
        const scores = playerProgress.get(metric.playerId) || [];
        scores.push(metric.exerciseCompletionRate);
        playerProgress.set(metric.playerId, scores);
      });
    });
    
    let totalImprovement = 0;
    let playerCount = 0;
    
    playerProgress.forEach(scores => {
      if (scores.length >= 2) {
        const improvement = scores[scores.length - 1] - scores[0];
        totalImprovement += improvement;
        playerCount++;
      }
    });
    
    return playerCount > 0 ? Math.max(0, Math.min(1, (totalImprovement / playerCount) + 0.5)) : 0.5;
  }

  private calculateTrend(
    data: TemplatePerformanceData[], 
    getter: (p: TemplatePerformanceData) => number
  ): { direction: 'improving' | 'declining' | 'stable'; changePercent: number } {
    if (data.length < 2) return { direction: 'stable', changePercent: 0 };
    
    const values = data.map(getter);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const threshold = 5; // 5% threshold for determining trend
    
    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(changePercent) < threshold) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }
    
    return { direction, changePercent: Math.round(changePercent) };
  }

  private determineSeason(month: number): keyof SeasonalUsagePattern {
    // Hockey season calendar
    if (month >= 6 && month <= 8) return 'offseason'; // Jul-Sep
    if (month >= 9 && month <= 10) return 'preseason'; // Oct-Nov
    if (month >= 11 || month <= 2) return 'inseason'; // Dec-Mar
    return 'playoffs'; // Apr-Jun
  }

  private calculateSentimentScore(performances: TemplatePerformanceData[]): number {
    const avgSatisfaction = this.calculateAverageMetric(performances, 'playerSatisfaction');
    const avgCompletion = this.calculateAverageMetric(performances, 'completionRate');
    const injuryRate = this.calculateInjuryRate(performances);
    
    // Convert to -1 to 1 scale
    const satisfactionScore = (avgSatisfaction - 5) / 5; // 0-10 scale to -1 to 1
    const completionScore = (avgCompletion - 0.5) * 2; // 0-1 scale to -1 to 1
    const injuryScore = -(injuryRate * 2); // Injuries are negative sentiment
    
    const sentiment = (satisfactionScore + completionScore + injuryScore) / 3;
    return Math.max(-1, Math.min(1, sentiment));
  }

  private generateCommonPraise(performances: TemplatePerformanceData[]): string[] {
    const avgCompletion = this.calculateAverageMetric(performances, 'completionRate');
    const avgSatisfaction = this.calculateAverageMetric(performances, 'playerSatisfaction');
    
    const praise: string[] = [];
    
    if (avgCompletion > 0.8) praise.push('Well-structured and achievable');
    if (avgSatisfaction > 7) praise.push('Engaging and motivating');
    if (this.calculateInjuryRate(performances) < 0.1) praise.push('Safe and well-designed');
    if (this.calculateModificationRate(performances[0]?.templateId) < 0.2) praise.push('Perfect as designed');
    
    return praise;
  }

  private generateCommonComplaints(performances: TemplatePerformanceData[]): string[] {
    const avgCompletion = this.calculateAverageMetric(performances, 'completionRate');
    const avgSatisfaction = this.calculateAverageMetric(performances, 'playerSatisfaction');
    const injuryRate = this.calculateInjuryRate(performances);
    
    const complaints: string[] = [];
    
    if (avgCompletion < 0.6) complaints.push('Too challenging or time-consuming');
    if (avgSatisfaction < 5) complaints.push('Not engaging or poorly structured');
    if (injuryRate > 0.2) complaints.push('Risk of injury too high');
    if (this.calculateModificationRate(performances[0]?.templateId) > 0.5) complaints.push('Needs frequent adjustments');
    
    return complaints;
  }

  private getModificationDescription(type: TemplateModification['type']): string {
    const descriptions: Record<TemplateModification['type'], string> = {
      'exercise_added': 'Trainers frequently add exercises to this template',
      'exercise_removed': 'Some exercises are often skipped or removed',
      'exercise_modified': 'Exercise parameters are commonly adjusted',
      'duration_changed': 'Session duration is frequently modified',
      'intensity_changed': 'Intensity levels are often adjusted'
    };
    
    return descriptions[type] || 'Template is commonly modified';
  }

  private getSuggestedAction(type: TemplateModification['type'], impact: number): string {
    if (impact > 0.7) {
      return 'Consider incorporating common modifications into the base template';
    } else if (impact < 0.5) {
      return 'Review why this modification is needed and consider template redesign';
    } else {
      return 'Monitor this modification pattern for optimization opportunities';
    }
  }

  private persistUsageData(): void {
    try {
      const data = Array.from(this.usageEvents.entries());
      localStorage.setItem('workout_template_usage', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist usage data:', error);
    }
  }

  private persistPerformanceData(): void {
    try {
      const data = Array.from(this.performanceData.entries());
      localStorage.setItem('workout_template_performance', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist performance data:', error);
    }
  }

  public loadPersistedData(): void {
    try {
      // Load usage data
      const usageData = localStorage.getItem('workout_template_usage');
      if (usageData) {
        const entries = JSON.parse(usageData);
        this.usageEvents = new Map(entries);
      }
      
      // Load performance data
      const performanceData = localStorage.getItem('workout_template_performance');
      if (performanceData) {
        const entries = JSON.parse(performanceData);
        this.performanceData = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  }
}

export default WorkoutTemplateAnalytics;