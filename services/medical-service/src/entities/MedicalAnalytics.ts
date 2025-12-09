import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

@Entity('injury_correlations')
@Index(['playerId', 'injuryType'])
@Index(['trainingPhase', 'workloadIntensity'])
export class InjuryCorrelation extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_id', type: 'uuid' })
  injuryId: string;

  @Column({ name: 'injury_type', length: 255 })
  injuryType: string;

  @Column({ name: 'injury_date', type: 'timestamp' })
  injuryDate: Date;

  @Column({ name: 'training_phase', length: 100, nullable: true })
  trainingPhase?: string; // 'preseason', 'regular_season', 'playoffs', 'offseason'

  @Column({ name: 'workload_7_days_prior', type: 'jsonb' })
  workload7DaysPrior: {
    totalMinutes: number;
    highIntensityMinutes: number;
    strengthSessions: number;
    conditioningSessions: number;
    gameMinutes: number;
    practiceMinutes: number;
    loadScore: number;
  };

  @Column({ name: 'workload_14_days_prior', type: 'jsonb' })
  workload14DaysPrior: {
    totalMinutes: number;
    averageDailyLoad: number;
    peakLoadDay: number;
    lowLoadDays: number;
    loadVariability: number;
  };

  @Column({ name: 'workload_28_days_prior', type: 'jsonb' })
  workload28DaysPrior: {
    totalMinutes: number;
    chronicLoad: number;
    acuteChronicRatio: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  };

  @Column({ name: 'workload_intensity', type: 'decimal', precision: 5, scale: 2 })
  workloadIntensity: number; // Average intensity 0-100

  @Column({ name: 'sleep_quality_avg', type: 'decimal', precision: 3, scale: 1, nullable: true })
  sleepQualityAvg?: number; // 1-10 scale, 7 days prior

  @Column({ name: 'stress_level_avg', type: 'decimal', precision: 3, scale: 1, nullable: true })
  stressLevelAvg?: number; // 1-10 scale, 7 days prior

  @Column({ name: 'fatigue_level_avg', type: 'decimal', precision: 3, scale: 1, nullable: true })
  fatigueLevelAvg?: number; // 1-10 scale, 7 days prior

  @Column({ name: 'previous_injuries_count', type: 'int', default: 0 })
  previousInjuriesCount: number;

  @Column({ name: 'days_since_last_injury', type: 'int', nullable: true })
  daysSinceLastInjury?: number;

  @Column({ name: 'environmental_factors', type: 'jsonb', nullable: true })
  environmentalFactors?: {
    temperature?: number;
    humidity?: number;
    playing_surface?: string;
    weather_conditions?: string;
    venue_type?: 'home' | 'away';
  };

  @Column({ name: 'game_situation', type: 'jsonb', nullable: true })
  gameSituation?: {
    game_time_remaining?: number;
    score_differential?: number;
    period?: number;
    situation_type?: 'even_strength' | 'power_play' | 'penalty_kill' | 'empty_net';
  };

  @Column({ name: 'biomechanical_factors', type: 'jsonb', nullable: true })
  biomechanicalFactors?: {
    movement_pattern?: string;
    contact_type?: 'contact' | 'non_contact';
    body_position?: string;
    speed_at_injury?: number;
  };

  @Column({ name: 'risk_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskScore?: number; // AI-calculated risk score at time of injury

  @Column({ name: 'preventable_classification', type: 'boolean', nullable: true })
  preventableClassification?: boolean;

  @Column({ name: 'correlation_analysis', type: 'jsonb', nullable: true })
  correlationAnalysis?: {
    primary_factors: string[];
    contributing_factors: string[];
    protective_factors: string[];
    similar_injury_patterns: string[];
  };
}

@Entity('recovery_tracking')
@Index(['playerId', 'injuryId'])
@Index(['recoveryPhase', 'weekNumber'])
export class RecoveryTracking extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_id', type: 'uuid' })
  injuryId: string;

  @Column({ name: 'protocol_id', type: 'uuid', nullable: true })
  protocolId?: string;

  @Column({ name: 'recovery_phase', length: 100 })
  recoveryPhase: string; // 'acute', 'subacute', 'chronic', 'return_to_play'

  @Column({ name: 'week_number', type: 'int' })
  weekNumber: number; // Week since injury

  @Column({ name: 'assessment_date', type: 'timestamp' })
  assessmentDate: Date;

  @Column({ name: 'pain_level', type: 'int' })
  painLevel: number; // 0-10 scale

  @Column({ name: 'function_level', type: 'int' })
  functionLevel: number; // 0-100 percentage

  @Column({ name: 'range_of_motion', type: 'jsonb', nullable: true })
  rangeOfMotion?: {
    joint: string;
    movement: string;
    degrees: number;
    percentage_of_normal: number;
  }[];

  @Column({ name: 'strength_measurements', type: 'jsonb', nullable: true })
  strengthMeasurements?: {
    muscle_group: string;
    test_type: string;
    measurement: number;
    unit: string;
    percentage_of_baseline: number;
  }[];

  @Column({ name: 'performance_tests', type: 'jsonb', nullable: true })
  performanceTests?: {
    test_name: string;
    result: number;
    unit: string;
    pass_threshold: number;
    status: 'pass' | 'fail' | 'improving';
  }[];

  @Column({ name: 'activity_modifications', type: 'jsonb' })
  activityModifications: {
    restricted_activities: string[];
    modified_activities: string[];
    cleared_activities: string[];
    load_restrictions: {
      activity: string;
      max_intensity: number;
      max_duration: number;
    }[];
  };

  @Column({ name: 'treatment_compliance', type: 'decimal', precision: 5, scale: 2 })
  treatmentCompliance: number; // 0-100 percentage

  @Column({ name: 'psychological_readiness', type: 'int', nullable: true })
  psychologicalReadiness?: number; // 0-100 scale

  @Column({ name: 'return_to_play_confidence', type: 'int', nullable: true })
  returnToPlayConfidence?: number; // 0-100 scale

  @Column({ name: 'expected_recovery_timeline', type: 'jsonb' })
  expectedRecoveryTimeline: {
    phase: string;
    start_week: number;
    end_week: number;
    key_milestones: string[];
  }[];

  @Column({ name: 'actual_progress_vs_expected', type: 'decimal', precision: 5, scale: 2 })
  actualProgressVsExpected: number; // Percentage ahead/behind schedule

  @Column({ name: 'setbacks_documented', type: 'jsonb', nullable: true })
  setbacksDocumented?: {
    date: string;
    type: string;
    severity: 'minor' | 'moderate' | 'major';
    cause: string;
    impact_on_timeline: number; // days added
  }[];

  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  clinicalNotes?: string;

  @Column({ name: 'next_assessment_date', type: 'timestamp' })
  nextAssessmentDate: Date;
}

@Entity('medical_performance_correlations')
@Index(['playerId', 'correlationDate'])
export class MedicalPerformanceCorrelation extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'correlation_date', type: 'timestamp' })
  correlationDate: Date;

  @Column({ name: 'analysis_period_days', type: 'int' })
  analysisPeriodDays: number;

  @Column({ name: 'medical_status', length: 100 })
  medicalStatus: string; // 'healthy', 'injured', 'recovering', 'limited'

  @Column({ name: 'active_injuries_count', type: 'int', default: 0 })
  activeInjuriesCount: number;

  @Column({ name: 'chronic_conditions_count', type: 'int', default: 0 })
  chronicConditionsCount: number;

  @Column({ name: 'performance_metrics', type: 'jsonb' })
  performanceMetrics: {
    speed_avg: number;
    power_avg: number;
    endurance_score: number;
    agility_score: number;
    strength_index: number;
    skill_rating: number;
  };

  @Column({ name: 'performance_decline_indicators', type: 'jsonb', nullable: true })
  performanceDeclineIndicators?: {
    metric: string;
    baseline_value: number;
    current_value: number;
    percentage_change: number;
    significance: 'low' | 'medium' | 'high';
  }[];

  @Column({ name: 'wellness_indicators', type: 'jsonb' })
  wellnessIndicators: {
    sleep_quality_avg: number;
    stress_level_avg: number;
    fatigue_level_avg: number;
    motivation_level_avg: number;
    hydration_status_avg: number;
  };

  @Column({ name: 'load_tolerance', type: 'jsonb' })
  loadTolerance: {
    training_load_capacity: number;
    recovery_efficiency: number;
    load_adaptation_rate: number;
    injury_resilience_score: number;
  };

  @Column({ name: 'predictive_insights', type: 'jsonb', nullable: true })
  predictiveInsights?: {
    injury_risk_score: number;
    performance_trend: 'improving' | 'declining' | 'stable';
    recommended_interventions: string[];
    monitoring_priorities: string[];
  };

  @Column({ name: 'medical_interventions_effective', type: 'jsonb', nullable: true })
  medicalInterventionsEffective?: {
    intervention_type: string;
    effectiveness_score: number;
    performance_impact: number;
    recommended_continuation: boolean;
  }[];
}