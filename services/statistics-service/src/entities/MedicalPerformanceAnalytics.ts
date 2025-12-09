import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

@Entity('medical_performance_analytics')
@Index(['playerId', 'analysisDate'])
@Index(['teamId', 'analysisDate'])
@Index(['injuryRiskScore'])
export class MedicalPerformanceAnalytics extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'team_id', type: 'uuid', nullable: true })
  teamId?: string;

  @Column({ name: 'analysis_date', type: 'timestamp' })
  analysisDate: Date;

  @Column({ name: 'analysis_period_days', type: 'int' })
  analysisPeriodDays: number;

  // Medical Status
  @Column({ name: 'medical_status', length: 100 })
  medicalStatus: string; // 'healthy', 'injured', 'recovering', 'limited'

  @Column({ name: 'active_injuries_count', type: 'int', default: 0 })
  activeInjuriesCount: number;

  @Column({ name: 'injury_history_score', type: 'decimal', precision: 5, scale: 2 })
  injuryHistoryScore: number; // 0-100 based on injury frequency and recurrence

  @Column({ name: 'return_to_play_protocols_active', type: 'int', default: 0 })
  returnToPlayProtocolsActive: number;

  // Performance Metrics with Medical Context
  @Column({ name: 'performance_baseline', type: 'jsonb' })
  performanceBaseline: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    strength: number;
    skill_rating: number;
  };

  @Column({ name: 'current_performance', type: 'jsonb' })
  currentPerformance: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    strength: number;
    skill_rating: number;
  };

  @Column({ name: 'performance_delta', type: 'jsonb' })
  performanceDelta: {
    speed_change: number;
    power_change: number;
    endurance_change: number;
    agility_change: number;
    strength_change: number;
    skill_change: number;
    overall_trend: 'improving' | 'declining' | 'stable';
  };

  // Load Management and Injury Correlation
  @Column({ name: 'training_load_metrics', type: 'jsonb' })
  trainingLoadMetrics: {
    acute_load: number;
    chronic_load: number;
    acute_chronic_ratio: number;
    training_strain: number;
    training_monotony: number;
    weekly_hours: number;
    high_intensity_percentage: number;
  };

  @Column({ name: 'injury_risk_score', type: 'decimal', precision: 5, scale: 2 })
  injuryRiskScore: number; // 0-100 calculated risk score

  @Column({ name: 'risk_factors', type: 'jsonb' })
  riskFactors: {
    workload_spikes: boolean;
    poor_recovery: boolean;
    previous_injuries: boolean;
    fatigue_accumulation: boolean;
    psychological_stress: boolean;
    biomechanical_issues: boolean;
  };

  // Wellness and Recovery Correlation
  @Column({ name: 'wellness_metrics', type: 'jsonb' })
  wellnessMetrics: {
    sleep_quality_avg: number;
    stress_level_avg: number;
    fatigue_level_avg: number;
    motivation_level_avg: number;
    soreness_level_avg: number;
    hydration_status_avg: number;
  };

  @Column({ name: 'recovery_efficiency', type: 'decimal', precision: 5, scale: 2 })
  recoveryEfficiency: number; // How well the player recovers from training loads

  // Medical Intervention Effectiveness
  @Column({ name: 'medical_interventions', type: 'jsonb', nullable: true })
  medicalInterventions?: {
    intervention_type: string;
    start_date: string;
    effectiveness_score: number;
    performance_impact: number;
    compliance_rate: number;
  }[];

  @Column({ name: 'return_to_play_success_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  returnToPlaySuccessRate?: number;

  // Predictive Analytics
  @Column({ name: 'predicted_performance_trend', type: 'jsonb' })
  predictedPerformanceTrend: {
    next_week: {
      expected_performance: number;
      confidence_level: number;
      risk_factors: string[];
    };
    next_month: {
      expected_performance: number;
      confidence_level: number;
      risk_factors: string[];
    };
    season_outlook: {
      expected_availability: number;
      injury_risk_projection: number;
      performance_projection: number;
    };
  };

  // Comparative Analytics
  @Column({ name: 'peer_comparison', type: 'jsonb' })
  peerComparison: {
    position_percentile: number;
    age_group_percentile: number;
    team_rank: number;
    league_percentile: number;
    similar_injury_history_comparison: number;
  };

  // Recommendations
  @Column({ name: 'recommendations', type: 'jsonb' })
  recommendations: {
    load_management: {
      suggested_load_adjustment: number; // percentage
      focus_areas: string[];
      rest_recommendations: string[];
    };
    medical_monitoring: {
      monitoring_frequency: string;
      key_metrics: string[];
      alert_thresholds: Record<string, number>;
    };
    performance_optimization: {
      strength_focus: string[];
      skill_development: string[];
      conditioning_priorities: string[];
    };
    injury_prevention: {
      high_risk_areas: string[];
      preventive_exercises: string[];
      biomechanical_corrections: string[];
    };
  };

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number; // 0-100 confidence in the analysis

  @Column({ name: 'data_quality_score', type: 'decimal', precision: 5, scale: 2 })
  dataQualityScore: number; // 0-100 based on data completeness and accuracy

  @Column({ name: 'next_analysis_date', type: 'timestamp' })
  nextAnalysisDate: Date;
}

@Entity('injury_performance_correlations')
@Index(['injuryType', 'bodyPart'])
@Index(['performanceMetric', 'correlationStrength'])
export class InjuryPerformanceCorrelation extends AuditableEntity {
  @Column({ name: 'injury_type', length: 255 })
  injuryType: string;

  @Column({ name: 'body_part', length: 100 })
  bodyPart: string;

  @Column({ name: 'performance_metric', length: 100 })
  performanceMetric: string; // 'speed', 'power', 'endurance', etc.

  @Column({ name: 'correlation_strength', type: 'decimal', precision: 5, scale: 3 })
  correlationStrength: number; // -1 to 1

  @Column({ name: 'correlation_type', length: 50 })
  correlationType: string; // 'positive', 'negative', 'neutral'

  @Column({ name: 'significance_level', type: 'decimal', precision: 5, scale: 3 })
  significanceLevel: number; // Statistical significance

  @Column({ name: 'sample_size', type: 'int' })
  sampleSize: number;

  @Column({ name: 'time_to_impact_days', type: 'int' })
  timeToImpactDays: number; // How many days before performance impact is seen

  @Column({ name: 'recovery_impact_duration_days', type: 'int' })
  recoveryImpactDurationDays: number; // How long performance is affected

  @Column({ name: 'performance_degradation_percentage', type: 'decimal', precision: 5, scale: 2 })
  performanceDegradationPercentage: number;

  @Column({ name: 'analysis_metadata', type: 'jsonb' })
  analysisMetadata: {
    analysis_date: string;
    data_period: {
      start_date: string;
      end_date: string;
    };
    player_demographics: {
      age_range: string;
      position_groups: string[];
      experience_levels: string[];
    };
    statistical_methods: string[];
    control_variables: string[];
  };
}

@Entity('load_injury_patterns')
@Index(['loadPattern', 'injuryRisk'])
@Index(['playerPosition', 'seasonPhase'])
export class LoadInjuryPattern extends AuditableEntity {
  @Column({ name: 'pattern_id', length: 100, unique: true })
  patternId: string;

  @Column({ name: 'pattern_name', length: 255 })
  patternName: string;

  @Column({ name: 'load_pattern', type: 'jsonb' })
  loadPattern: {
    acute_chronic_ratio_range: { min: number; max: number };
    training_monotony_range: { min: number; max: number };
    strain_range: { min: number; max: number };
    weekly_hours_range: { min: number; max: number };
    high_intensity_percentage_range: { min: number; max: number };
  };

  @Column({ name: 'injury_risk', type: 'decimal', precision: 5, scale: 2 })
  injuryRisk: number; // 0-100 percentage

  @Column({ name: 'most_common_injuries', type: 'jsonb' })
  mostCommonInjuries: {
    injury_type: string;
    body_part: string;
    frequency: number;
    severity_avg: number;
  }[];

  @Column({ name: 'player_position', length: 100, nullable: true })
  playerPosition?: string;

  @Column({ name: 'season_phase', length: 100, nullable: true })
  seasonPhase?: string; // 'preseason', 'regular', 'playoffs', 'offseason'

  @Column({ name: 'age_group', length: 50, nullable: true })
  ageGroup?: string;

  @Column({ name: 'protective_factors', type: 'jsonb' })
  protectiveFactors: {
    factor: string;
    impact_reduction: number; // percentage reduction in injury risk
    implementation_difficulty: 'easy' | 'moderate' | 'difficult';
  }[];

  @Column({ name: 'warning_indicators', type: 'jsonb' })
  warningIndicators: {
    indicator: string;
    threshold_value: number;
    early_warning_days: number;
    intervention_success_rate: number;
  }[];

  @Column({ name: 'sample_size', type: 'int' })
  sampleSize: number;

  @Column({ name: 'confidence_interval', type: 'jsonb' })
  confidenceInterval: {
    lower_bound: number;
    upper_bound: number;
    confidence_level: number;
  };

  @Column({ name: 'last_updated', type: 'timestamp' })
  lastUpdated: Date;
}

@Entity('recovery_performance_tracking')
@Index(['playerId', 'injuryId'])
@Index(['recoveryPhase', 'performanceReturnRate'])
export class RecoveryPerformanceTracking extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_id', type: 'uuid' })
  injuryId: string;

  @Column({ name: 'recovery_phase', length: 100 })
  recoveryPhase: string;

  @Column({ name: 'days_since_injury', type: 'int' })
  daysSinceInjury: number;

  @Column({ name: 'performance_baseline', type: 'jsonb' })
  performanceBaseline: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    strength: number;
  };

  @Column({ name: 'current_performance', type: 'jsonb' })
  currentPerformance: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    strength: number;
  };

  @Column({ name: 'performance_return_rate', type: 'jsonb' })
  performanceReturnRate: {
    speed_percentage: number;
    power_percentage: number;
    endurance_percentage: number;
    agility_percentage: number;
    strength_percentage: number;
    overall_percentage: number;
  };

  @Column({ name: 'functional_movement_scores', type: 'jsonb', nullable: true })
  functionalMovementScores?: {
    score_date: string;
    total_score: number;
    component_scores: {
      overhead_squat: number;
      hurdle_step: number;
      in_line_lunge: number;
      shoulder_mobility: number;
      active_straight_leg: number;
      trunk_stability: number;
      rotary_stability: number;
    };
    asymmetries: string[];
  }[];

  @Column({ name: 'sport_specific_tests', type: 'jsonb', nullable: true })
  sportSpecificTests?: {
    test_name: string;
    baseline_score: number;
    current_score: number;
    percentage_of_baseline: number;
    pass_threshold: number;
    status: 'pass' | 'fail' | 'improving';
  }[];

  @Column({ name: 'psychological_factors', type: 'jsonb' })
  psychologicalFactors: {
    confidence_level: number; // 0-100
    fear_of_reinjury: number; // 0-100
    motivation_level: number; // 0-100
    return_to_play_readiness: number; // 0-100
  };

  @Column({ name: 'load_tolerance', type: 'jsonb' })
  loadTolerance: {
    current_training_capacity: number; // percentage of pre-injury
    pain_response_to_load: number; // 0-10 scale
    fatigue_accumulation_rate: number;
    recovery_time_multiplier: number; // compared to baseline
  };

  @Column({ name: 'return_prediction', type: 'jsonb' })
  returnPrediction: {
    estimated_days_to_full_performance: number;
    confidence_level: number;
    key_limiting_factors: string[];
    accelerating_factors: string[];
    risk_of_reinjury: number; // 0-100 percentage
  };

  @Column({ name: 'intervention_effectiveness', type: 'jsonb', nullable: true })
  interventionEffectiveness?: {
    intervention_type: string;
    start_date: string;
    performance_impact: number; // percentage improvement
    compliance_rate: number;
    side_effects: string[];
  }[];

  @Column({ name: 'milestone_achievements', type: 'jsonb' })
  milestoneAchievements: {
    milestone_name: string;
    target_date: string;
    actual_date?: string;
    status: 'achieved' | 'missed' | 'in_progress';
    performance_at_milestone: number;
    notes?: string;
  }[];
}