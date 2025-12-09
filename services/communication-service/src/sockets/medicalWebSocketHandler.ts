import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './authMiddleware';
import { logger } from '@hockey-hub/shared-lib';

// Medical-specific WebSocket event types
export enum MedicalSocketEvent {
  // Real-time compliance checking
  CHECK_EXERCISE_COMPLIANCE = 'medical:check_exercise_compliance',
  EXERCISE_COMPLIANCE_RESULT = 'medical:exercise_compliance_result',
  
  // Injury risk alerts
  INJURY_RISK_ALERT = 'medical:injury_risk_alert',
  RISK_ASSESSMENT_REQUEST = 'medical:risk_assessment_request',
  RISK_ASSESSMENT_RESULT = 'medical:risk_assessment_result',
  
  // Load management
  LOAD_MANAGEMENT_UPDATE = 'medical:load_management_update',
  LOAD_RECOMMENDATION = 'medical:load_recommendation',
  
  // Exercise substitutions
  EXERCISE_SUBSTITUTION_REQUEST = 'medical:exercise_substitution_request',
  EXERCISE_SUBSTITUTION_RESULT = 'medical:exercise_substitution_result',
  
  // Medical alerts
  MEDICAL_ALERT = 'medical:alert',
  MEDICAL_ALERT_ACK = 'medical:alert_ack',
  
  // Recovery protocol updates
  RECOVERY_PROTOCOL_UPDATE = 'medical:recovery_protocol_update',
  RECOVERY_MILESTONE_ACHIEVED = 'medical:recovery_milestone_achieved',
  
  // Wellness monitoring
  WELLNESS_THRESHOLD_EXCEEDED = 'medical:wellness_threshold_exceeded',
  WELLNESS_ALERT = 'medical:wellness_alert',
  
  // Medical clearance
  MEDICAL_CLEARANCE_CHANGED = 'medical:clearance_changed',
  CLEARANCE_REQUEST = 'medical:clearance_request',
  
  // Error handling
  MEDICAL_ERROR = 'medical:error'
}

export interface ExerciseComplianceRequest {
  sessionId: string;
  playerId: string;
  exercises: any[];
  workoutIntensity: number;
}

export interface ExerciseComplianceResponse {
  playerId: string;
  isCompliant: boolean;
  restrictions: any[];
  substitutions: any[];
  riskAlerts: any[];
  loadRecommendations: any[];
  medicalNotes: string[];
}

export interface InjuryRiskAlert {
  playerId: string;
  sessionId?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  immediateAction: boolean;
  timestamp: Date;
}

export interface LoadManagementUpdate {
  playerId: string;
  sessionId?: string;
  currentLoad: number;
  recommendedLoad: number;
  loadReduction: number;
  reason: string;
  modifications: string[];
  timestamp: Date;
}

export interface MedicalAlert {
  id: string;
  playerId: string;
  sessionId?: string;
  alertType: 'injury_risk' | 'load_management' | 'medical_emergency' | 'wellness_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendations: string[];
  requiresImmediateAction: boolean;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface RecoveryProtocolUpdate {
  playerId: string;
  injuryId: string;
  currentPhase: string;
  progress: number; // 0-100
  nextMilestone: string;
  estimatedCompletion: Date;
  restrictions: string[];
  modifications: string[];
}

export interface WellnessAlert {
  playerId: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'concern' | 'critical';
  recommendations: string[];
  timestamp: Date;
}

export class MedicalWebSocketHandler {
  private io: Server;
  private medicalAlerts: Map<string, MedicalAlert> = new Map();
  private alertCleanupInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startAlertCleanup();
  }

  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    logger.info(`Medical WebSocket handler connected for user: ${userId}`);

    // Register medical event handlers
    this.registerComplianceHandlers(socket);
    this.registerRiskAssessmentHandlers(socket);
    this.registerLoadManagementHandlers(socket);
    this.registerAlertHandlers(socket);
    this.registerRecoveryHandlers(socket);
    this.registerWellnessHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private registerComplianceHandlers(socket: AuthenticatedSocket) {
    // Real-time exercise compliance checking
    socket.on(MedicalSocketEvent.CHECK_EXERCISE_COMPLIANCE, async (payload: ExerciseComplianceRequest) => {
      try {
        const { sessionId, playerId, exercises, workoutIntensity } = payload;
        
        // Call Medical Service for compliance check
        const complianceResponse = await this.checkExerciseCompliance(playerId, exercises, workoutIntensity);
        
        const response: ExerciseComplianceResponse = {
          playerId,
          ...complianceResponse
        };

        // Send response back to requester
        socket.emit(MedicalSocketEvent.EXERCISE_COMPLIANCE_RESULT, response);

        // If non-compliant, broadcast alert to trainers
        if (!complianceResponse.isCompliant) {
          await this.broadcastComplianceAlert(sessionId, playerId, complianceResponse);
        }

        logger.info(`Exercise compliance checked for player ${playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.CHECK_EXERCISE_COMPLIANCE, error.message);
      }
    });

    // Exercise substitution requests
    socket.on(MedicalSocketEvent.EXERCISE_SUBSTITUTION_REQUEST, async (data: { playerId: string; exerciseName: string; restrictions: string[] }) => {
      try {
        const { playerId, exerciseName, restrictions } = data;
        
        // Get exercise substitutions from Medical Service
        const substitutions = await this.getExerciseSubstitutions(playerId, exerciseName, restrictions);
        
        socket.emit(MedicalSocketEvent.EXERCISE_SUBSTITUTION_RESULT, {
          playerId,
          originalExercise: exerciseName,
          substitutions
        });

        logger.info(`Exercise substitutions provided for player ${playerId}, exercise ${exerciseName}`);
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.EXERCISE_SUBSTITUTION_REQUEST, error.message);
      }
    });
  }

  private registerRiskAssessmentHandlers(socket: AuthenticatedSocket) {
    // Real-time injury risk assessment
    socket.on(MedicalSocketEvent.RISK_ASSESSMENT_REQUEST, async (data: { 
      playerId: string; 
      sessionId?: string;
      currentMetrics: any;
    }) => {
      try {
        const { playerId, sessionId, currentMetrics } = data;
        
        // Call Medical Service for risk assessment
        const riskAlert = await this.assessInjuryRisk(playerId, currentMetrics);
        
        if (riskAlert) {
          const alert: InjuryRiskAlert = {
            ...riskAlert,
            sessionId,
            timestamp: new Date()
          };

          // Send result to requester
          socket.emit(MedicalSocketEvent.RISK_ASSESSMENT_RESULT, alert);

          // Broadcast critical alerts immediately
          if (alert.riskLevel === 'critical' || alert.immediateAction) {
            await this.broadcastCriticalAlert(alert);
          }

          logger.info(`Injury risk assessed for player ${playerId}: ${alert.riskLevel} risk`);
        }
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.RISK_ASSESSMENT_REQUEST, error.message);
      }
    });
  }

  private registerLoadManagementHandlers(socket: AuthenticatedSocket) {
    // Load management updates
    socket.on(MedicalSocketEvent.LOAD_MANAGEMENT_UPDATE, async (update: LoadManagementUpdate) => {
      try {
        // Store load management data
        await this.updateLoadManagement(update.playerId, update);
        
        // Broadcast to relevant sessions and trainers
        this.broadcastLoadManagementUpdate(update);

        logger.info(`Load management updated for player ${update.playerId}: ${update.loadReduction}% reduction`);
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.LOAD_MANAGEMENT_UPDATE, error.message);
      }
    });
  }

  private registerAlertHandlers(socket: AuthenticatedSocket) {
    // Medical alert acknowledgment
    socket.on(MedicalSocketEvent.MEDICAL_ALERT_ACK, async (data: { alertId: string; userId: string }) => {
      try {
        const { alertId, userId } = data;
        const alert = this.medicalAlerts.get(alertId);
        
        if (alert) {
          alert.acknowledgedBy = userId;
          alert.acknowledgedAt = new Date();
          
          // Broadcast acknowledgment to all relevant parties
          this.io.emit(MedicalSocketEvent.MEDICAL_ALERT_ACK, {
            alertId,
            acknowledgedBy: userId,
            acknowledgedAt: alert.acknowledgedAt
          });

          logger.info(`Medical alert ${alertId} acknowledged by ${userId}`);
        }
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.MEDICAL_ALERT_ACK, error.message);
      }
    });
  }

  private registerRecoveryHandlers(socket: AuthenticatedSocket) {
    // Recovery protocol updates
    socket.on(MedicalSocketEvent.RECOVERY_PROTOCOL_UPDATE, async (update: RecoveryProtocolUpdate) => {
      try {
        // Update recovery protocol in Medical Service
        await this.updateRecoveryProtocol(update);
        
        // Broadcast to relevant users
        this.broadcastRecoveryUpdate(update);

        logger.info(`Recovery protocol updated for player ${update.playerId}, injury ${update.injuryId}`);
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.RECOVERY_PROTOCOL_UPDATE, error.message);
      }
    });
  }

  private registerWellnessHandlers(socket: AuthenticatedSocket) {
    // Wellness threshold monitoring
    socket.on(MedicalSocketEvent.WELLNESS_THRESHOLD_EXCEEDED, async (alert: WellnessAlert) => {
      try {
        // Process wellness alert
        await this.processWellnessAlert(alert);
        
        // Broadcast to medical staff and trainers
        this.broadcastWellnessAlert(alert);

        logger.info(`Wellness alert for player ${alert.playerId}: ${alert.metric} exceeded threshold`);
      } catch (error: any) {
        this.emitMedicalError(socket, MedicalSocketEvent.WELLNESS_THRESHOLD_EXCEEDED, error.message);
      }
    });
  }

  // Public broadcasting methods

  public async broadcastMedicalAlert(alert: MedicalAlert) {
    // Store alert
    this.medicalAlerts.set(alert.id, alert);
    
    // Broadcast to all medical staff and trainers
    this.io.emit(MedicalSocketEvent.MEDICAL_ALERT, alert);
    
    // If critical, also broadcast to specific session
    if (alert.severity === 'critical' && alert.sessionId) {
      this.io.to(`training-session-${alert.sessionId}`).emit(MedicalSocketEvent.MEDICAL_ALERT, alert);
    }

    logger.info(`Broadcasted medical alert: ${alert.alertType} for player ${alert.playerId}`);
  }

  public broadcastLoadManagementUpdate(update: LoadManagementUpdate) {
    // Broadcast to all trainers
    this.io.emit(MedicalSocketEvent.LOAD_MANAGEMENT_UPDATE, update);
    
    // Also broadcast to specific session if available
    if (update.sessionId) {
      this.io.to(`training-session-${update.sessionId}`).emit(MedicalSocketEvent.LOAD_RECOMMENDATION, update);
    }
  }

  public broadcastRecoveryUpdate(update: RecoveryProtocolUpdate) {
    // Broadcast to medical staff and relevant trainers
    this.io.emit(MedicalSocketEvent.RECOVERY_PROTOCOL_UPDATE, update);
    
    // Broadcast milestone achievements more broadly
    if (update.progress >= 100) {
      this.io.emit(MedicalSocketEvent.RECOVERY_MILESTONE_ACHIEVED, {
        playerId: update.playerId,
        injuryId: update.injuryId,
        milestone: 'recovery_complete',
        timestamp: new Date()
      });
    }
  }

  public broadcastWellnessAlert(alert: WellnessAlert) {
    // Broadcast to medical staff and trainers
    this.io.emit(MedicalSocketEvent.WELLNESS_ALERT, alert);
    
    logger.info(`Broadcasted wellness alert for player ${alert.playerId}: ${alert.metric}`);
  }

  // Private helper methods

  private async checkExerciseCompliance(playerId: string, exercises: any[], workoutIntensity: number) {
    // In production, this would call the Medical Service API
    // For now, return mock data
    return {
      isCompliant: exercises.length > 0, // Mock compliance check
      restrictions: [],
      substitutions: [],
      riskAlerts: [],
      loadRecommendations: [],
      medicalNotes: []
    };
  }

  private async getExerciseSubstitutions(playerId: string, exerciseName: string, restrictions: string[]) {
    // In production, this would call the Medical Service API
    return [
      {
        substitute: 'Modified version',
        modifications: ['Reduced intensity', 'Limited range of motion'],
        reason: 'Medical restriction'
      }
    ];
  }

  private async assessInjuryRisk(playerId: string, currentMetrics: any) {
    // In production, this would call the Medical Service API
    return null; // Mock - no risk detected
  }

  private async updateLoadManagement(playerId: string, update: LoadManagementUpdate) {
    // In production, this would call the Medical Service API
    logger.info(`Load management updated for player ${playerId}`);
  }

  private async updateRecoveryProtocol(update: RecoveryProtocolUpdate) {
    // In production, this would call the Medical Service API
    logger.info(`Recovery protocol updated for player ${update.playerId}`);
  }

  private async processWellnessAlert(alert: WellnessAlert) {
    // In production, this would call the Medical Service API
    logger.info(`Wellness alert processed for player ${alert.playerId}`);
  }

  private async broadcastComplianceAlert(sessionId: string, playerId: string, complianceResult: any) {
    const alert: MedicalAlert = {
      id: `compliance-${Date.now()}`,
      playerId,
      sessionId,
      alertType: 'injury_risk',
      severity: 'medium',
      message: `Player ${playerId} has exercise restrictions that may affect workout safety`,
      recommendations: complianceResult.medicalNotes || [],
      requiresImmediateAction: false,
      timestamp: new Date()
    };

    await this.broadcastMedicalAlert(alert);
  }

  private async broadcastCriticalAlert(riskAlert: InjuryRiskAlert) {
    const alert: MedicalAlert = {
      id: `risk-${Date.now()}`,
      playerId: riskAlert.playerId,
      sessionId: riskAlert.sessionId,
      alertType: 'injury_risk',
      severity: 'critical',
      message: `CRITICAL: High injury risk detected for player ${riskAlert.playerId}`,
      recommendations: riskAlert.recommendations,
      requiresImmediateAction: riskAlert.immediateAction,
      timestamp: riskAlert.timestamp
    };

    await this.broadcastMedicalAlert(alert);
  }

  private emitMedicalError(socket: Socket, event: string, message: string) {
    socket.emit(MedicalSocketEvent.MEDICAL_ERROR, {
      event,
      message,
      timestamp: new Date()
    });
    logger.error(`Medical WebSocket error: ${event} - ${message}`);
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    logger.info(`User ${userId} disconnected from medical events`);
  }

  private startAlertCleanup() {
    // Clean up acknowledged alerts every 10 minutes
    this.alertCleanupInterval = setInterval(() => {
      const now = Date.now();
      const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

      for (const [alertId, alert] of this.medicalAlerts.entries()) {
        if (alert.acknowledgedAt && (now - alert.acknowledgedAt.getTime()) > cleanupThreshold) {
          this.medicalAlerts.delete(alertId);
          logger.info(`Cleaned up acknowledged alert: ${alertId}`);
        }
      }
    }, 600000); // Every 10 minutes
  }

  public shutdown() {
    if (this.alertCleanupInterval) {
      clearInterval(this.alertCleanupInterval);
    }
    this.medicalAlerts.clear();
  }
}