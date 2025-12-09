// Medical related WebSocket events

export interface MedicalAlertEvent {
  playerId: string;
  sessionId?: string;
  alertType: 'restriction_violation' | 'high_risk' | 'injury_risk' | 'recovery_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation?: string;
  timestamp: Date;
}

export interface ExerciseSubstitutionEvent {
  playerId: string;
  sessionId: string;
  originalExerciseId: string;
  originalExerciseName: string;
  substitutionId: string;
  substitutionName: string;
  reason: string;
  restrictions: string[];
  timestamp: Date;
}

export interface LoadAdjustmentEvent {
  playerId: string;
  sessionId: string;
  adjustmentType: 'intensity' | 'volume' | 'rest';
  originalValue: number;
  adjustedValue: number;
  reason: string;
  medicalFactors: {
    injuryStatus?: string;
    wellnessScore?: number;
    recoveryStatus?: string;
  };
  timestamp: Date;
}

export interface RecoveryProtocolEvent {
  playerId: string;
  protocolId: string;
  protocolName: string;
  milestone: string;
  status: 'started' | 'completed' | 'skipped' | 'modified';
  adherenceScore?: number;
  notes?: string;
  timestamp: Date;
}

export interface MedicalComplianceEvent {
  playerId: string;
  sessionId: string;
  exerciseId: string;
  complianceStatus: 'compliant' | 'modified' | 'skipped' | 'risky';
  restrictions?: string[];
  alternatives?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  timestamp: Date;
}