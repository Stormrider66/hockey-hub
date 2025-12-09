// Training session related WebSocket events

export interface SessionJoinEvent {
  sessionId: string;
  playerId: string;
  playerName: string;
  timestamp: Date;
}

export interface SessionLeaveEvent {
  sessionId: string;
  playerId: string;
  reason?: 'completed' | 'disconnected' | 'manual';
  timestamp: Date;
}

export interface PlayerMetricsUpdateEvent {
  sessionId: string;
  playerId: string;
  metrics: {
    heartRate?: number;
    heartRateZone?: number;
    power?: number;
    pace?: string;
    speed?: number;
    calories?: number;
    distance?: number;
    cadence?: number;
    compliance?: number;
  };
  timestamp: Date;
}

export interface ExerciseProgressEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  completed: boolean;
  timestamp: Date;
}

export interface IntervalProgressEvent {
  sessionId: string;
  playerId: string;
  intervalId: string;
  intervalType: 'work' | 'rest' | 'warmup' | 'cooldown';
  elapsed: number;
  remaining: number;
  targetMetrics?: {
    heartRateZone?: number;
    powerTarget?: number;
    paceTarget?: string;
  };
  actualMetrics?: {
    heartRate?: number;
    power?: number;
    pace?: string;
  };
  isInTargetZone: boolean;
  timestamp: Date;
}

export interface SessionControlEvent {
  sessionId: string;
  command: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop';
  trainerId: string;
  targetPlayers?: string[]; // If empty, applies to all
  reason?: string;
  timestamp: Date;
}

export interface SessionMessageEvent {
  sessionId: string;
  message: string;
  trainerId: string;
  targetPlayers?: string[];
  priority: 'info' | 'warning' | 'urgent';
  timestamp: Date;
}

// PHASE 3.3: Extended WebSocket Events for All Workout Types

// Type-Specific Progress Events
export interface StrengthSetCompletionEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  reps: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  rpe?: number; // Rate of Perceived Exertion 1-10
  formRating?: number; // 1-5 form quality
  restTimeRemaining?: number; // seconds
  tempo?: string; // e.g., "3-1-2-1"
  timestamp: Date;
}

export interface StrengthRestTimerEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  restDuration: number; // seconds
  timeRemaining: number;
  timerState: 'started' | 'paused' | 'completed' | 'skipped';
  nextExercise?: string;
  timestamp: Date;
}

export interface ConditioningIntervalTransitionEvent {
  sessionId: string;
  playerId: string;
  intervalId: string;
  fromInterval: {
    name: string;
    type: 'work' | 'rest' | 'warmup' | 'cooldown';
    intensity: number; // 1-10
  };
  toInterval: {
    name: string;
    type: 'work' | 'rest' | 'warmup' | 'cooldown';
    intensity: number;
    duration: number; // seconds
  };
  transitionType: 'automatic' | 'manual' | 'early_completion';
  timestamp: Date;
}

export interface ConditioningZoneComplianceEvent {
  sessionId: string;
  playerId: string;
  intervalId: string;
  currentHeartRate?: number;
  targetZone: {
    min: number;
    max: number;
    name: string; // 'Zone 1', 'Zone 2', etc.
  };
  actualZone?: string;
  compliancePercentage: number; // 0-100
  isInZone: boolean;
  zoneViolationDuration?: number; // seconds out of zone
  timestamp: Date;
}

export interface HybridBlockTransitionEvent {
  sessionId: string;
  playerId: string;
  fromBlock: {
    id: string;
    type: 'exercise' | 'interval' | 'transition';
    name: string;
    index: number;
  };
  toBlock: {
    id: string;
    type: 'exercise' | 'interval' | 'transition';
    name: string;
    index: number;
    estimatedDuration?: number;
  };
  totalBlocks: number;
  overallProgress: number; // 0-100
  timestamp: Date;
}

export interface HybridMixedMetricsEvent {
  sessionId: string;
  playerId: string;
  currentBlock: {
    id: string;
    type: 'exercise' | 'interval' | 'transition';
    name: string;
  };
  metrics: {
    // Strength metrics (if in exercise block)
    currentSet?: number;
    reps?: number;
    weight?: number;
    
    // Conditioning metrics (if in interval block)
    heartRate?: number;
    heartRateZone?: number;
    power?: number;
    pace?: string;
    
    // Universal metrics
    timeInBlock: number; // seconds
    rpe?: number;
    fatigue?: number; // 1-10
  };
  timestamp: Date;
}

export interface AgilityDrillCompletionEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  drillName: string;
  pattern: string; // 'T-drill', '5-10-5', 'Ladder', etc.
  attemptNumber: number;
  totalAttempts: number;
  completionTime: number; // milliseconds
  bestTime?: number;
  averageTime?: number;
  errors: number;
  errorTypes?: string[]; // 'cone_contact', 'false_start', 'incomplete', etc.
  performanceRating?: 'excellent' | 'good' | 'average' | 'needs_improvement';
  timestamp: Date;
}

export interface AgilityPatternProgressEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  currentPhase: 'setup' | 'execution' | 'recovery' | 'feedback';
  patternProgress: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    stepInstructions?: string;
  };
  visualCues: {
    conePositions?: { x: number; y: number; label: string }[];
    pathTrace?: { x: number; y: number }[];
    currentPosition?: { x: number; y: number };
  };
  audioInstructions?: string;
  timestamp: Date;
}

// PHASE 5.2: New Workout Type WebSocket Events

// Stability & Core Events
export interface StabilityCoreBalanceUpdateEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  balanceMetrics: {
    centerOfGravityX: number; // -100 to 100 (left to right)
    centerOfGravityY: number; // -100 to 100 (back to front)
    stabilityScore: number; // 0-100
    swayVelocity: number; // mm/s
    balanceConfidence: number; // 0-100
  };
  holdProgress: {
    currentHoldTime: number; // seconds
    targetHoldTime: number;
    holdNumber: number;
    totalHolds: number;
    isHolding: boolean;
  };
  surfaceType: 'stable' | 'foam' | 'bosu' | 'balance_board' | 'stability_ball';
  difficulty: 'eyes_open' | 'eyes_closed' | 'single_leg' | 'dynamic' | 'perturbation';
  timestamp: Date;
}

export interface StabilityCoreHoldCompletionEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  holdNumber: number;
  totalHolds: number;
  holdDuration: number; // seconds achieved
  targetDuration: number; // seconds required
  completionStatus: 'completed' | 'partial' | 'failed' | 'modified';
  performanceMetrics: {
    averageStability: number; // 0-100
    peakInstability: number; // 0-100
    recoveryTime: number; // seconds to regain balance
    qualityScore: number; // 1-5
  };
  progressionRecommendation?: {
    nextDifficulty?: string;
    holdTimeAdjustment?: number;
    surfaceProgression?: string;
  };
  restTimeRemaining?: number; // seconds
  timestamp: Date;
}

export interface StabilityCoreProgressionEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  progressionType: 'surface_change' | 'time_increase' | 'eyes_closed' | 'single_leg' | 'dynamic_add';
  fromLevel: {
    surface: string;
    difficulty: string;
    holdTime: number;
  };
  toLevel: {
    surface: string;
    difficulty: string;
    holdTime: number;
  };
  progressionReason: 'mastery_achieved' | 'safety_concern' | 'fatigue_management' | 'trainer_decision';
  performanceJustification: {
    stabilityTrend: 'improving' | 'declining' | 'stable';
    consistencyScore: number; // 0-100
    readinessIndicator: number; // 0-100
  };
  timestamp: Date;
}

// Plyometrics Events
export interface PlyometricsJumpMeasurementEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  jumpType: 'vertical' | 'broad' | 'lateral' | 'reactive' | 'depth' | 'box';
  jumpNumber: number;
  totalJumps: number;
  measurements: {
    height?: number; // cm for vertical jumps
    distance?: number; // cm for broad/lateral jumps
    contactTime: number; // milliseconds
    flightTime: number; // milliseconds
    reactiveStrengthIndex?: number; // flight time / contact time
    forceProduction?: number; // N (if force plate available)
    powerOutput?: number; // watts
    asymmetryIndex?: number; // % left vs right imbalance
  };
  techniqueAnalysis: {
    takeoffRating: number; // 1-5
    landingRating: number; // 1-5
    armSwingCoordination: number; // 1-5
    overallTechnique: number; // 1-5
  };
  performanceZone: 'peak' | 'maintenance' | 'declining' | 'fatigue_risk';
  timestamp: Date;
}

export interface PlyometricsLandingQualityEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  jumpNumber: number;
  landingAssessment: {
    bilateralLanding: boolean; // both feet simultaneous
    kneeValgusAngle: number; // degrees (0 = good, higher = poor)
    dorsifloexionAngle: number; // degrees
    trunkStability: number; // 1-5 rating
    soundLevel: 'silent' | 'quiet' | 'moderate' | 'loud'; // landing noise
    controlRating: number; // 1-5 overall landing control
  };
  injuryRiskIndicators: {
    riskLevel: 'low' | 'moderate' | 'high';
    riskFactors: string[]; // ['knee_valgus', 'asymmetric_landing', 'poor_control']
    recommendedAction: 'continue' | 'technique_focus' | 'reduce_intensity' | 'stop_exercise';
  };
  fatigueIndicators: {
    contactTimeIncrease: number; // % vs baseline
    techniqueDeterioration: number; // 1-5 scale
    compensationPatterns: string[];
  };
  timestamp: Date;
}

export interface PlyometricsSetCompletionEvent {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  jumpsCompleted: number;
  jumpsPlanned: number;
  setPerformanceSummary: {
    averageHeight?: number;
    averageDistance?: number;
    averageContactTime: number;
    averageRSI?: number;
    bestJump: {
      jumpNumber: number;
      measurement: number;
      unit: 'cm' | 'ms' | 'RSI';
    };
    consistencyScore: number; // 0-100, coefficient of variation
    fatigueIndex: number; // % performance drop from first to last jump
  };
  qualityMetrics: {
    averageLandingScore: number; // 1-5
    techniqueConsistency: number; // 1-5
    injuryRiskEvents: number; // count of high-risk landings
  };
  recoveryRecommendation: {
    restDuration: number; // seconds
    recoveryType: 'passive' | 'active' | 'neuromuscular_prep';
    readinessCheck: boolean; // require assessment before next set
  };
  timestamp: Date;
}

// Wrestling Events
export interface WrestlingRoundTransitionEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  drillName: string;
  roundNumber: number;
  totalRounds: number;
  roundType: 'drilling' | 'situational' | 'live_wrestling' | 'conditioning' | 'technique_review';
  transitionType: 'automatic' | 'manual' | 'injury_break' | 'technique_correction';
  roundDuration: number; // seconds completed
  plannedDuration: number; // seconds intended
  intensityRating: number; // 1-10 perceived intensity
  partnerInfo?: {
    partnerId?: string;
    partnerName?: string;
    weightDifference?: number; // kg
    skillLevelDifference?: string; // 'matched', 'higher', 'lower'
  };
  timestamp: Date;
}

export interface WrestlingTechniqueScoreEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  techniqueCategory: 'takedown' | 'escape' | 'reversal' | 'pin' | 'defense' | 'positioning';
  specificTechnique: string; // 'single_leg', 'double_leg', 'arm_drag', etc.
  attemptNumber: number;
  roundNumber: number;
  executionRating: {
    setup: number; // 1-5
    execution: number; // 1-5
    finishing: number; // 1-5
    timing: number; // 1-5
    overallScore: number; // 1-5
  };
  successOutcome: 'successful' | 'partially_successful' | 'defended' | 'countered';
  techniqueFeedback: {
    strengthAreas: string[];
    improvementAreas: string[];
    coachNotes?: string;
  };
  opponentResponse?: {
    defenseRating: number; // 1-5
    counterAttempts: number;
    adaptationLevel: string; // 'poor', 'good', 'excellent'
  };
  conditioningImpact: {
    heartRateSpike: number; // BPM increase
    breathingIntensity: number; // 1-5
    muscularFatigue: number; // 1-5
    mentalFocus: number; // 1-5
  };
  timestamp: Date;
}

export interface WrestlingPositionControlEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  position: 'neutral' | 'top' | 'bottom' | 'referee_position' | 'standing' | 'ground';
  controlStatus: 'controlling' | 'being_controlled' | 'scrambling' | 'transitioning';
  positionDuration: number; // seconds in this position
  controlQuality: {
    stability: number; // 1-5 how secure is position
    pressure: number; // 1-5 how much pressure applied
    advancement: number; // 1-5 working toward better position
    defensiveIntegrity: number; // 1-5 if defending
  };
  transitionAttempts: {
    initiated: number;
    successful: number;
    defended: number;
  };
  energyExpenditure: {
    currentIntensity: number; // 1-10
    cumulativeFatigue: number; // 1-10
    efficiency: number; // 1-5 energy conservation
  };
  tacticalElements: {
    aggression: number; // 1-5
    strategy: number; // 1-5
    adaptation: number; // 1-5
    mentalToughness: number; // 1-5
  };
  timestamp: Date;
}

export interface WrestlingConditioningMetricsEvent {
  sessionId: string;
  playerId: string;
  drillId: string;
  drillName: string;
  roundNumber: number;
  workRestRatio: string; // '2:1', '1:1', '3:1', etc.
  wrestlingSpecificMetrics: {
    explosiveMovements: number; // count per minute
    positionalChanges: number; // count per round
    grippingStrength: number; // 1-5 subjective or % of max
    coreEngagement: number; // 1-5 rating
    legDriveIntensity: number; // 1-5 rating
  };
  physiologicalMarkers: {
    heartRate: number;
    respiratoryRate?: number; // breaths per minute
    sweatRate: number; // 1-5 visual assessment
    muscularTension: number; // 1-5 overall body tension
  };
  performanceDecline: {
    speedDecline: number; // % from start of session
    powerDecline: number; // % from start of session
    techniqueDecline: number; // 1-5 rating vs start
    decisionMaking: number; // 1-5 mental clarity
  };
  recoveryIndicators: {
    breathingRecoveryTime: number; // seconds to normalize
    postRoundHR: number; // heart rate 30s after round
    mentalRecovery: number; // 1-5 readiness for next round
    physicalRecovery: number; // 1-5 body readiness
  };
  timestamp: Date;
}

// Bulk Session Events
export interface BulkSessionCreatedEvent {
  bundleId: string;
  bundleName: string;
  sessionIds: string[];
  workoutTypes: ('strength' | 'conditioning' | 'hybrid' | 'agility')[];
  totalParticipants: number;
  createdBy: string;
  createdAt: Date;
  scheduledStart: Date;
  estimatedDuration: number; // minutes
  facilitiesRequired: string[];
  equipmentRequired: string[];
  timestamp: Date;
}

export interface BulkSessionUpdateEvent {
  bundleId: string;
  updateType: 'status_change' | 'participant_move' | 'schedule_change' | 'configuration_change';
  affectedSessions: string[];
  changes: {
    status?: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
    participantMoves?: {
      playerId: string;
      fromSessionId: string;
      toSessionId: string;
      reason: 'rebalancing' | 'medical' | 'preference' | 'equipment';
    }[];
    scheduleChanges?: {
      newStartTime?: Date;
      newDuration?: number;
      facilityChange?: string;
    };
  };
  updatedBy: string;
  timestamp: Date;
}

export interface CrossSessionParticipantMoveEvent {
  bundleId: string;
  playerId: string;
  playerName: string;
  fromSession: {
    sessionId: string;
    workoutType: string;
    currentParticipants: number;
  };
  toSession: {
    sessionId: string;
    workoutType: string;
    currentParticipants: number;
  };
  moveReason: 'medical_restriction' | 'load_balancing' | 'equipment_availability' | 'player_request' | 'trainer_decision';
  medicalNotes?: string;
  preserveProgress: boolean;
  estimatedImpact: {
    delayMinutes: number;
    workoutModification: 'none' | 'minor' | 'major';
  };
  approvedBy: string;
  timestamp: Date;
}

export interface BulkOperationStatusEvent {
  bundleId: string;
  operation: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all';
  affectedSessions: string[];
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'partially_completed';
  progress: {
    completed: number;
    total: number;
    failed?: string[]; // session IDs that failed
    errors?: { sessionId: string; error: string }[];
  };
  executedBy: string;
  timestamp: Date;
}

export interface AggregateMetricsBroadcastEvent {
  bundleId: string;
  timestamp: Date;
  aggregatedMetrics: {
    totalParticipants: number;
    activeParticipants: number;
    completedParticipants: number;
    averageProgress: number; // 0-100
    averageHeartRate?: number;
    totalCaloriesBurned?: number;
    
    // Per workout type breakdown
    byWorkoutType: {
      [key in 'strength' | 'conditioning' | 'hybrid' | 'agility']: {
        participants: number;
        avgProgress: number;
        avgIntensity?: number;
        completionRate: number;
      }
    };
    
    // Performance indicators
    performanceAlerts: {
      type: 'high_fatigue' | 'low_compliance' | 'injury_risk' | 'equipment_issue';
      playerId: string;
      sessionId: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
    }[];
    
    // Resource utilization
    resourceUtilization: {
      facilities: { name: string; utilizationPercent: number }[];
      equipment: { type: string; inUse: number; available: number }[];
    };
  };
}

// Enhanced Error Events
export interface TypeSpecificErrorEvent {
  sessionId: string;
  playerId?: string;
  errorType: 'strength_error' | 'conditioning_error' | 'hybrid_error' | 'agility_error' | 'bulk_operation_error';
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  errorDetails: {
    code: string;
    message: string;
    context?: {
      // Strength context
      exerciseId?: string;
      setNumber?: number;
      
      // Conditioning context
      intervalId?: string;
      heartRateIssue?: boolean;
      equipmentMalfunction?: boolean;
      
      // Hybrid context
      blockId?: string;
      transitionError?: boolean;
      
      // Agility context
      drillId?: string;
      patternError?: boolean;
      timerMalfunction?: boolean;
      
      // Bulk operation context
      bundleId?: string;
      affectedSessions?: string[];
    };
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestedActions?: string[];
  automaticRecovery?: boolean;
  timestamp: Date;
}