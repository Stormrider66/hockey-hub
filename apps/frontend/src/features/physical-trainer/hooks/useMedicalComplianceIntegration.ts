import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { 
  MedicalAlert,
  ExerciseSubstitution,
  ExerciseRestriction,
  LoadManagementRecommendation
} from '../components/medical';

export interface ComplianceCheckResult {
  isCompliant: boolean;
  restrictions: ExerciseRestriction[];
  substitutions: ExerciseSubstitution[];
  riskAlerts: any[];
  loadRecommendations: LoadManagementRecommendation[];
  medicalNotes: string[];
}

export interface MedicalComplianceHook {
  // State
  alerts: MedicalAlert[];
  isCheckingCompliance: boolean;
  
  // Methods
  checkWorkoutCompliance: (playerId: string, exercises: any[], intensity?: number) => Promise<ComplianceCheckResult>;
  checkRealTimeRisk: (playerId: string, metrics: any) => Promise<void>;
  applySubstitution: (substitution: ExerciseSubstitution, exerciseId: string) => void;
  applyLoadRecommendation: (playerId: string, newLoad: number) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  
  // WebSocket integration
  connectToMedicalEvents: (sessionId?: string) => void;
  disconnectFromMedicalEvents: () => void;
}

export const useMedicalComplianceIntegration = (): MedicalComplianceHook => {
  const { t } = useTranslation(['physicalTrainer']);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Medical Service API base URL
  const MEDICAL_API_BASE = process.env.NEXT_PUBLIC_MEDICAL_SERVICE_URL || 'http://localhost:3005';

  // Initialize WebSocket connection for real-time medical events
  const connectToMedicalEvents = useCallback((sessionId?: string) => {
    if (typeof window === 'undefined') return;

    try {
      // In a real implementation, this would connect to Socket.IO
      // For now, we'll use a mock WebSocket connection
      console.log('Connecting to medical events WebSocket...');
      
      // Mock WebSocket connection
      const mockSocket = {
        on: (event: string, callback: (data: any) => void) => {
          console.log(`Listening for medical event: ${event}`);
        },
        emit: (event: string, data: any) => {
          console.log(`Emitting medical event: ${event}`, data);
        },
        disconnect: () => {
          console.log('Disconnecting from medical events');
        }
      };

      setSocket(mockSocket);

      // Listen for medical alerts
      mockSocket.on('medical:alert', (alert: MedicalAlert) => {
        setAlerts(prev => [...prev, alert]);
        
        // Show toast notification for critical alerts
        if (alert.severity === 'critical' || alert.requiresImmediateAction) {
          toast.error(`CRITICAL: ${alert.message}`, {
            duration: 10000,
            position: 'top-center'
          });
        }
      });

      // Listen for load management updates
      mockSocket.on('medical:load_management_update', (update: any) => {
        toast.info(t('medical.loadManagementUpdated', { player: update.playerName }));
      });

    } catch (error) {
      console.error('Failed to connect to medical events:', error);
    }
  }, [t]);

  const disconnectFromMedicalEvents = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  // Check workout compliance with Medical Service
  const checkWorkoutCompliance = useCallback(async (
    playerId: string, 
    exercises: any[], 
    intensity: number = 100
  ): Promise<ComplianceCheckResult> => {
    setIsCheckingCompliance(true);
    
    try {
      const response = await fetch(`${MEDICAL_API_BASE}/api/v1/compliance/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          exercises,
          workoutIntensity: intensity
        })
      });

      if (!response.ok) {
        throw new Error(`Medical service error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Compliance check failed');
      }

      const complianceResult = result.data as ComplianceCheckResult;

      // Generate alerts for non-compliant results
      if (!complianceResult.isCompliant) {
        const alert: MedicalAlert = {
          id: `compliance-${Date.now()}`,
          playerId,
          playerName: `Player ${playerId}`, // In production, get from player data
          alertType: 'injury_risk',
          severity: complianceResult.restrictions.some(r => r.restrictionType === 'prohibited') ? 'high' : 'medium',
          message: t('medical.workoutComplianceIssue'),
          recommendations: complianceResult.medicalNotes,
          requiresImmediateAction: complianceResult.restrictions.some(r => r.restrictionType === 'prohibited'),
          timestamp: new Date()
        };

        setAlerts(prev => [...prev, alert]);
      }

      return complianceResult;

    } catch (error: any) {
      console.error('Compliance check failed:', error);
      toast.error(t('medical.complianceCheckFailed'));
      
      // Return safe default
      return {
        isCompliant: false,
        restrictions: [],
        substitutions: [],
        riskAlerts: [],
        loadRecommendations: [],
        medicalNotes: [t('medical.complianceCheckError')]
      };
    } finally {
      setIsCheckingCompliance(false);
    }
  }, [MEDICAL_API_BASE, t]);

  // Real-time injury risk assessment
  const checkRealTimeRisk = useCallback(async (playerId: string, metrics: any) => {
    try {
      const response = await fetch(`${MEDICAL_API_BASE}/api/v1/compliance/risk-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          currentMetrics: metrics
        })
      });

      if (!response.ok) {
        throw new Error(`Risk assessment error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const riskAlert = result.data;
        
        // Generate alert if risk detected
        if (riskAlert.riskLevel === 'high' || riskAlert.riskLevel === 'critical') {
          const alert: MedicalAlert = {
            id: `risk-${Date.now()}`,
            playerId,
            playerName: `Player ${playerId}`,
            alertType: 'injury_risk',
            severity: riskAlert.riskLevel,
            message: `${riskAlert.riskLevel.toUpperCase()} injury risk detected`,
            recommendations: riskAlert.recommendations,
            requiresImmediateAction: riskAlert.immediateAction,
            timestamp: new Date()
          };

          setAlerts(prev => [...prev, alert]);

          if (riskAlert.immediateAction) {
            toast.error(t('medical.immediateActionRequired'), {
              duration: 10000,
              position: 'top-center'
            });
          }
        }
      }

    } catch (error: any) {
      console.error('Risk assessment failed:', error);
    }
  }, [MEDICAL_API_BASE, t]);

  // Apply exercise substitution
  const applySubstitution = useCallback((substitution: ExerciseSubstitution, exerciseId: string) => {
    // In a real implementation, this would update the workout
    console.log('Applying substitution:', substitution, 'for exercise:', exerciseId);
    
    toast.success(
      t('medical.substitutionApplied', { 
        original: substitution.originalExercise,
        substitute: substitution.substituteExercise
      })
    );
  }, [t]);

  // Apply load management recommendation
  const applyLoadRecommendation = useCallback((playerId: string, newLoad: number) => {
    // In a real implementation, this would update the workout intensity
    console.log('Applying load recommendation:', playerId, newLoad);
    
    toast.success(
      t('medical.loadRecommendationApplied', { 
        player: playerId,
        load: newLoad
      })
    );
  }, [t]);

  // Acknowledge medical alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledgedAt: new Date(), acknowledgedBy: 'current-user' }
          : alert
      )
    );

    // Send acknowledgment to backend
    if (socket) {
      socket.emit('medical:alert_ack', { alertId, userId: 'current-user' });
    }

    toast.success(t('medical.alertAcknowledged'));
  }, [socket, t]);

  // Dismiss medical alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.info(t('medical.alertDismissed'));
  }, [t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromMedicalEvents();
    };
  }, [disconnectFromMedicalEvents]);

  return {
    alerts,
    isCheckingCompliance,
    checkWorkoutCompliance,
    checkRealTimeRisk,
    applySubstitution,
    applyLoadRecommendation,
    acknowledgeAlert,
    dismissAlert,
    connectToMedicalEvents,
    disconnectFromMedicalEvents
  };
};