import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Shield, Heart, Activity, Eye, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import existing components
import { MedicalAlertPanel } from './MedicalAlertPanel';
import { ExerciseSubstitutionModal } from './ExerciseSubstitutionModal';
import { LoadManagementPanel } from './LoadManagementPanel';

// Import medical compliance hook
import { useMedicalComplianceIntegration } from '../../hooks/useMedicalComplianceIntegration';

// Import types
import type {
  MedicalAlert,
  ExerciseSubstitution,
  ExerciseRestriction,
  LoadManagementRecommendation
} from './index';

interface MedicalIntegratedWorkoutViewerProps {
  sessionId: string;
  workoutData: {
    id: string;
    type: 'strength' | 'conditioning' | 'hybrid' | 'agility';
    exercises: any[];
    intensity: number;
    duration: number;
  };
  playersData: Array<{
    id: string;
    name: string;
    metrics?: {
      heartRate?: number;
      powerOutput?: number;
      pace?: number;
      rpe?: number;
    };
  }>;
  onWorkoutUpdate: (updatedWorkout: any) => void;
  onPlayerAlert: (playerId: string, alert: any) => void;
  className?: string;
}

export const MedicalIntegratedWorkoutViewer: React.FC<MedicalIntegratedWorkoutViewerProps> = ({
  sessionId,
  workoutData,
  playersData,
  onWorkoutUpdate,
  onPlayerAlert,
  className = ''
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Medical compliance integration
  const {
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
  } = useMedicalComplianceIntegration();

  // UI state
  const [showMedicalPanel, setShowMedicalPanel] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [substitutionModal, setSubstitutionModal] = useState<{
    isOpen: boolean;
    playerId: string;
    playerName: string;
    exerciseName: string;
    substitutions: ExerciseSubstitution[];
    restrictions: ExerciseRestriction[];
  } | null>(null);
  const [loadRecommendations, setLoadRecommendations] = useState<LoadManagementRecommendation[]>([]);

  // Connect to medical events on mount
  useEffect(() => {
    connectToMedicalEvents(sessionId);
    return () => disconnectFromMedicalEvents();
  }, [sessionId, connectToMedicalEvents, disconnectFromMedicalEvents]);

  // Real-time compliance checking
  const performComplianceCheck = useCallback(async (playerId: string, exercises?: any[]) => {
    const exerciseList = exercises || workoutData.exercises;
    const intensity = workoutData.intensity || 100;

    try {
      const result = await checkWorkoutCompliance(playerId, exerciseList, intensity);
      
      // Update load recommendations
      if (result.loadRecommendations.length > 0) {
        setLoadRecommendations(prev => {
          const updated = [...prev];
          result.loadRecommendations.forEach(rec => {
            const existingIndex = updated.findIndex(r => r.playerId === rec.playerId);
            if (existingIndex >= 0) {
              updated[existingIndex] = rec;
            } else {
              updated.push(rec);
            }
          });
          return updated;
        });
      }

      return result;
    } catch (error) {
      console.error('Compliance check failed:', error);
      return null;
    }
  }, [workoutData, checkWorkoutCompliance]);

  // Real-time risk monitoring
  const monitorPlayerRisk = useCallback(async (playerId: string, metrics: any) => {
    try {
      await checkRealTimeRisk(playerId, metrics);
    } catch (error) {
      console.error('Risk monitoring failed:', error);
    }
  }, [checkRealTimeRisk]);

  // Handle exercise substitution request
  const handleSubstitutionRequest = useCallback(async (playerId: string, exerciseName: string) => {
    const player = playersData.find(p => p.id === playerId);
    if (!player) return;

    // Get compliance result for this specific exercise
    const exerciseToCheck = workoutData.exercises.find(e => e.name === exerciseName);
    if (!exerciseToCheck) return;

    const complianceResult = await performComplianceCheck(playerId, [exerciseToCheck]);
    if (!complianceResult) return;

    // Filter substitutions for this exercise
    const relevantSubstitutions = complianceResult.substitutions.filter(
      sub => sub.originalExercise === exerciseName
    );

    setSubstitutionModal({
      isOpen: true,
      playerId,
      playerName: player.name,
      exerciseName,
      substitutions: relevantSubstitutions,
      restrictions: complianceResult.restrictions
    });
  }, [playersData, workoutData.exercises, performComplianceCheck]);

  // Handle substitution application
  const handleApplySubstitution = useCallback((substitution: ExerciseSubstitution) => {
    // Update workout data
    const updatedExercises = workoutData.exercises.map(exercise => {
      if (exercise.name === substitution.originalExercise) {
        return {
          ...exercise,
          name: substitution.substituteExercise,
          modifications: substitution.modifications,
          medicalReason: substitution.reason,
          isSubstituted: true,
          originalExercise: substitution.originalExercise
        };
      }
      return exercise;
    });

    const updatedWorkout = {
      ...workoutData,
      exercises: updatedExercises
    };

    onWorkoutUpdate(updatedWorkout);
    applySubstitution(substitution, substitution.originalExercise);
    setSubstitutionModal(null);
  }, [workoutData, onWorkoutUpdate, applySubstitution]);

  // Handle load recommendation application
  const handleApplyLoadRecommendation = useCallback((playerId: string, newLoad: number) => {
    // Update workout intensity for specific player
    const updatedWorkout = {
      ...workoutData,
      playerSpecificSettings: {
        ...workoutData.playerSpecificSettings,
        [playerId]: {
          intensity: newLoad,
          reason: 'Medical load management'
        }
      }
    };

    onWorkoutUpdate(updatedWorkout);
    applyLoadRecommendation(playerId, newLoad);

    // Remove applied recommendation
    setLoadRecommendations(prev => prev.filter(rec => rec.playerId !== playerId));
  }, [workoutData, onWorkoutUpdate, applyLoadRecommendation]);

  // Monitor player metrics in real-time
  useEffect(() => {
    const monitoringInterval = setInterval(() => {
      playersData.forEach(player => {
        if (player.metrics) {
          monitorPlayerRisk(player.id, player.metrics);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(monitoringInterval);
  }, [playersData, monitorPlayerRisk]);

  // Auto-check compliance when workout changes
  useEffect(() => {
    if (playersData.length > 0 && workoutData.exercises.length > 0) {
      playersData.forEach(player => {
        performComplianceCheck(player.id);
      });
    }
  }, [workoutData.exercises, playersData, performComplianceCheck]);

  // Critical alerts count
  const criticalAlertsCount = alerts.filter(
    alert => alert.severity === 'critical' || alert.requiresImmediateAction
  ).length;

  // High-risk players count
  const highRiskPlayersCount = loadRecommendations.filter(
    rec => rec.riskLevel === 'high' || rec.riskLevel === 'critical'
  ).length;

  return (
    <div className={`medical-integrated-workout-viewer ${className}`}>
      {/* Medical Status Bar */}
      <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                criticalAlertsCount > 0 ? 'bg-red-500 animate-pulse' : 
                alerts.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium">
                {criticalAlertsCount > 0 ? t('medical.criticalAlerts') :
                 alerts.length > 0 ? t('medical.activeAlerts') :
                 t('medical.allClear')}
              </span>
              {alerts.length > 0 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${
                highRiskPlayersCount > 0 ? 'text-orange-500' : 'text-green-500'
              }`} />
              <span className="text-sm">
                {highRiskPlayersCount > 0 
                  ? t('medical.playersUnderLoadManagement', { count: highRiskPlayersCount })
                  : t('medical.noLoadRestrictions')
                }
              </span>
            </div>

            {isCheckingCompliance && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs text-gray-600">{t('medical.checkingCompliance')}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMedicalPanel(!showMedicalPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showMedicalPanel 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showMedicalPanel ? t('medical.hideMedicalPanel') : t('medical.showMedicalPanel')}
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                playersData.forEach(player => performComplianceCheck(player.id));
                toast.success(t('medical.complianceRefreshed'));
              }}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title={t('medical.refreshCompliance')}
            >
              <Activity className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Medical Panel */}
      {showMedicalPanel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Medical Alerts */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {t('medical.medicalAlerts')}
              </h3>
            </div>
            <div className="p-4">
              <MedicalAlertPanel
                alerts={alerts}
                onAcknowledgeAlert={acknowledgeAlert}
                onDismissAlert={dismissAlert}
              />
            </div>
          </div>

          {/* Load Management */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                {t('medical.loadManagement')}
              </h3>
            </div>
            <div className="p-4">
              <LoadManagementPanel
                recommendations={loadRecommendations}
                onApplyRecommendation={handleApplyLoadRecommendation}
                onCustomizeLoad={(playerId, customLoad, reason) => {
                  handleApplyLoadRecommendation(playerId, customLoad);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Exercise List with Medical Integration */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {t('medical.exerciseListWithCompliance')}
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {workoutData.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  exercise.isSubstituted 
                    ? 'border-yellow-200 bg-yellow-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {exercise.name}
                      {exercise.isSubstituted && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          {t('medical.substituted')}
                        </span>
                      )}
                    </h4>
                    
                    {exercise.medicalReason && (
                      <p className="text-sm text-yellow-700 mt-1">
                        {t('medical.reason')}: {exercise.medicalReason}
                      </p>
                    )}
                    
                    {exercise.modifications && exercise.modifications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">{t('medical.modifications')}:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {exercise.modifications.map((mod: string, modIndex: number) => (
                            <li key={modIndex} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Exercise Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSubstitutionRequest(selectedPlayer || playersData[0]?.id, exercise.name)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('medical.findSubstitution')}
                      disabled={!selectedPlayer && playersData.length === 0}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player Selection for Single-Player Actions */}
      {playersData.length > 1 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('medical.selectPlayerForActions')}:
          </label>
          <select
            value={selectedPlayer || ''}
            onChange={(e) => setSelectedPlayer(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('common.selectPlayer')}</option>
            {playersData.map(player => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Exercise Substitution Modal */}
      {substitutionModal && (
        <ExerciseSubstitutionModal
          isOpen={substitutionModal.isOpen}
          onClose={() => setSubstitutionModal(null)}
          playerId={substitutionModal.playerId}
          playerName={substitutionModal.playerName}
          originalExercise={substitutionModal.exerciseName}
          substitutions={substitutionModal.substitutions}
          restrictions={substitutionModal.restrictions}
          onApplySubstitution={handleApplySubstitution}
          onRequestAlternatives={() => {
            toast.info(t('medical.requestingAlternatives'));
            // In a real implementation, this would fetch more alternatives
          }}
        />
      )}
    </div>
  );
};

export default MedicalIntegratedWorkoutViewer;