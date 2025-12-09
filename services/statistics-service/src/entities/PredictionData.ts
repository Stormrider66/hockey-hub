import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

export enum PredictionType {
  PERFORMANCE = 'performance',
  INJURY_RISK = 'injury_risk',
  FATIGUE = 'fatigue',
  READINESS = 'readiness',
  GAME_OUTCOME = 'game_outcome',
  DEVELOPMENT = 'development',
  WORKLOAD = 'workload'
}

export enum PredictionTimeframe {
  NEXT_SESSION = 'next_session',
  NEXT_GAME = 'next_game',
  NEXT_WEEK = 'next_week',
  NEXT_MONTH = 'next_month',
  NEXT_SEASON = 'next_season'
}

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  RANDOM_FOREST = 'random_forest',
  NEURAL_NETWORK = 'neural_network',
  TIME_SERIES = 'time_series',
  ENSEMBLE = 'ensemble'
}

@Entity('prediction_data')
@Index(['entityId', 'entityType', 'predictionType'])
@Index(['predictionType', 'timeframe', 'createdAt'])
@Index(['confidence', 'accuracy'])
@Index(['organizationId', 'isActive'])
export class PredictionData extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  entityId!: string; // Player, team, or other entity ID

  @Column('varchar', { length: 50 })
  @Index()
  entityType!: string; // 'player', 'team', 'organization'

  @Column('uuid')
  @Index()
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: PredictionType
  })
  @Index()
  predictionType!: PredictionType;

  @Column({
    type: 'enum',
    enum: PredictionTimeframe
  })
  @Index()
  timeframe!: PredictionTimeframe;

  @Column({
    type: 'enum',
    enum: ModelType
  })
  modelType!: ModelType;

  @Column('varchar', { length: 100 })
  modelVersion!: string;

  // Prediction Details
  @Column('jsonb')
  prediction!: {
    // Core Prediction
    value: number | string | boolean;
    unit?: string;
    category?: string;
    
    // Range Predictions
    range?: {
      min: number;
      max: number;
      mostLikely: number;
    };
    
    // Probability Distributions
    probabilities?: Array<{
      outcome: string;
      probability: number;
    }>;
    
    // Time Series Predictions
    timeSeries?: Array<{
      timestamp: Date;
      value: number;
      confidence: number;
    }>;
    
    // Multi-factor Predictions
    factors?: Record<string, number>;
  };

  // Model Confidence & Accuracy
  @Column('decimal', { precision: 5, scale: 2 })
  @Index()
  confidence!: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @Index()
  accuracy?: number; // Historical accuracy of this model

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  uncertainty?: number; // Prediction uncertainty

  // Input Features
  @Column('jsonb')
  features!: {
    // Performance Features
    recentPerformance?: number[];
    historicalTrend?: number;
    variability?: number;
    
    // Physical Features
    fitnessMetrics?: Record<string, number>;
    workloadMetrics?: Record<string, number>;
    recoveryMetrics?: Record<string, number>;
    
    // Environmental Features
    scheduleIntensity?: number;
    travelLoad?: number;
    restDays?: number;
    
    // Historical Features
    injuryHistory?: any[];
    performanceHistory?: any[];
    
    // Feature Importance
    featureImportance?: Record<string, number>;
  };

  // Risk Factors
  @Column('jsonb', { nullable: true })
  riskFactors?: {
    identified: Array<{
      factor: string;
      impact: number; // 0-100
      description: string;
    }>;
    mitigations: string[];
    riskScore: number; // Overall risk 0-100
  };

  // Recommendations
  @Column('jsonb', { nullable: true })
  recommendations?: {
    primary: string[];
    secondary: string[];
    actions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      effort: string;
    }>;
  };

  // Explanations
  @Column('jsonb', { nullable: true })
  explanations?: {
    reasoning: string;
    keyFactors: string[];
    methodology: string;
    limitations: string[];
    assumptions: string[];
  };

  // Validation & Tracking
  @Column('timestamptz', { nullable: true })
  validUntil?: Date;

  @Column('boolean', { default: true })
  @Index()
  isActive!: boolean;

  @Column('timestamptz', { nullable: true })
  actualOutcomeDate?: Date;

  @Column('jsonb', { nullable: true })
  actualOutcome?: {
    value: any;
    accuracy: number;
    error: number;
    notes: string;
  };

  // Model Metadata
  @Column('jsonb', { nullable: true })
  modelMetadata?: {
    trainingDate?: Date;
    dataPoints?: number;
    features?: string[];
    hyperparameters?: Record<string, any>;
    performance?: {
      rmse?: number;
      mae?: number;
      r2?: number;
      crossValidation?: number;
    };
  };

  // Context
  @Column('jsonb', { nullable: true })
  context?: {
    season?: string;
    phase?: string; // 'preseason', 'regular', 'playoffs'
    competitionLevel?: string;
    teamContext?: any;
    externalFactors?: any;
  };

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: {
    source?: string;
    requestedBy?: string;
    purpose?: string;
    tags?: string[];
    notes?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}