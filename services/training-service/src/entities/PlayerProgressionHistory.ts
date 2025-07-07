import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';

export enum ProgressionPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEASONAL = 'seasonal',
  YEARLY = 'yearly'
}

export enum PerformanceCategory {
  STRENGTH = 'strength',
  SPEED = 'speed',
  ENDURANCE = 'endurance',
  POWER = 'power',
  FLEXIBILITY = 'flexibility',
  SKILL = 'skill',
  RECOVERY = 'recovery',
  OVERALL = 'overall'
}

@Entity('player_progression_history')
@Unique(['playerId', 'periodType', 'periodStart'])
@Index('idx_progression_player_date', ['playerId', 'periodStart', 'periodEnd'])
@Index('idx_progression_organization_season', ['organizationId', 'seasonId'])
@Index('idx_progression_team_category', ['teamId', 'category'])
@Index('idx_progression_age_position', ['ageAtPeriod', 'position'])
export class PlayerProgressionHistory extends BaseEntity {
  
  @Column({ type: 'uuid' })
  @Index('idx_progression_player')
  playerId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  teamId: string;

  @Column({ type: 'uuid', nullable: true })
  seasonId: string;

  @Column({ type: 'enum', enum: ProgressionPeriod })
  periodType: ProgressionPeriod;

  @Column({ type: 'date' })
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'enum', enum: PerformanceCategory })
  category: PerformanceCategory;

  @Column({ type: 'int' })
  ageAtPeriod: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  position: string;

  @Column({ type: 'jsonb' })
  workoutMetrics: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    totalVolume: number;
    averageIntensity: number;
    
    sessionBreakdown: {
      strength: number;
      cardio: number;
      skill: number;
      recovery: number;
      mixed: number;
    };
    
    loadProgression: Array<{
      week: number;
      averageLoad: number;
      peakLoad: number;
      totalVolume: number;
    }>;
    
    adherenceMetrics: {
      onTimeRate: number;
      modificationRate: number;
      missedSessions: number;
      makeupSessions: number;
    };
  };

  @Column({ type: 'jsonb' })
  performanceMetrics: {
    // Base fitness metrics
    maxStrength?: {
      squat?: number;
      bench?: number;
      deadlift?: number;
      customExercises?: Record<string, number>;
    };
    
    speedMetrics?: {
      sprint10m?: number;
      sprint30m?: number;
      acceleration?: number;
      maxVelocity?: number;
    };
    
    enduranceMetrics?: {
      vo2Max?: number;
      lactateThreshold?: number;
      cooperTest?: number;
      beepTest?: number;
    };
    
    powerMetrics?: {
      verticalJump?: number;
      broadJump?: number;
      medicineballThrow?: number;
      peakPower?: number;
    };
    
    // Sport-specific metrics
    onIceMetrics?: {
      blueLineToBlueTime?: number;
      stopsAndStarts?: number;
      edgeWork?: number;
      shotVelocity?: number;
    };
    
    // Relative improvements
    improvements: Record<string, {
      startValue: number;
      endValue: number;
      percentChange: number;
      percentileRank?: number;
    }>;
  };

  @Column({ type: 'jsonb' })
  comparisonMetrics: {
    peerComparison: {
      ageGroup: {
        percentile: number;
        totalPeers: number;
        metrics: Record<string, number>;
      };
      position: {
        percentile: number;
        totalPeers: number;
        metrics: Record<string, number>;
      };
      team: {
        rank: number;
        totalPlayers: number;
        metrics: Record<string, number>;
      };
    };
    
    historicalComparison: {
      previousPeriod?: {
        percentChange: number;
        keyImprovements: string[];
        areasOfDecline: string[];
      };
      yearOverYear?: {
        percentChange: number;
        trendDirection: 'improving' | 'stable' | 'declining';
      };
    };
    
    benchmarks: {
      eliteLevel: Record<string, number>;
      currentLevel: Record<string, number>;
      gapToElite: Record<string, number>;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  healthMetrics: {
    injuryDays: number;
    illnessDays: number;
    modifiedTrainingDays: number;
    
    injuryHistory: Array<{
      date: Date;
      type: string;
      severity: string;
      recoveryDays: number;
      affectedTraining: string[];
    }>;
    
    wellnessScores: {
      averageSleep: number;
      averageStress: number;
      averageRecovery: number;
      averageNutrition: number;
    };
    
    loadManagement: {
      acuteChronicRatio: number[];
      highLoadDays: number;
      recoveryDays: number;
      optimalLoadDays: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  coachingNotes: Array<{
    date: Date;
    coachId: string;
    category: string;
    note: string;
    actionItems?: string[];
  }>;

  @Column({ type: 'jsonb' })
  goals: {
    periodGoals: Array<{
      goalId: string;
      description: string;
      targetValue: number;
      achievedValue?: number;
      status: 'achieved' | 'partial' | 'missed';
      notes?: string;
    }>;
    
    nextPeriodGoals: Array<{
      goalId: string;
      description: string;
      targetValue: number;
      priority: 'high' | 'medium' | 'low';
      strategy?: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  externalData: {
    wearableData?: {
      source: string;
      metrics: Record<string, any>;
      lastSyncDate: Date;
    };
    
    gamePerformance?: {
      gamesPlayed: number;
      averageMinutes: number;
      performanceRating: number;
      keyStats: Record<string, number>;
    };
    
    nutritionData?: {
      complianceRate: number;
      averageCalories: number;
      macroBreakdown: Record<string, number>;
    };
  };

  @Column({ type: 'float' })
  overallProgressionScore: number;

  @Column({ type: 'varchar', length: 50 })
  progressionTrend: 'rapid' | 'steady' | 'slow' | 'plateau' | 'declining';

  @Column({ type: 'jsonb', nullable: true })
  recommendations: {
    focusAreas: string[];
    suggestedWorkouts: string[];
    loadAdjustments: string;
    recoveryProtocol?: string;
    nutritionGuidance?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    calculatedAt: Date;
    dataQuality: 'complete' | 'partial' | 'estimated';
    missingDataPoints?: string[];
    dataSource: string[];
    tags?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  eventBusMetadata: {
    lastPublishedAt?: Date;
    publishedReports?: string[];
    sharedWithStaff?: string[];
    exportedFormats?: string[];
  };

  @Column({ type: 'int', default: 0 })
  version: number;
}