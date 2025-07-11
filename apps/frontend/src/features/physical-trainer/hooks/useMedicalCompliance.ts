import { useState, useEffect, useMemo } from 'react';
import { useGetPlayerMedicalDataQuery } from '@/store/api/medicalApi';
import type { Player } from '@/types';
import type { Exercise, WorkoutSession } from '@/features/physical-trainer/types';
import {
  checkExerciseCompliance,
  getRestrictionSeverity,
  calculateLoadAdjustment,
  mapExerciseToRestrictions,
  findSafeAlternatives,
  type ComplianceResult,
  type MedicalRestriction,
  type ComplianceViolation,
  type ExerciseAlternative
} from '../utils/medicalCompliance';

interface UseMedicalComplianceParams {
  session: WorkoutSession | null;
  selectedPlayers: Player[];
}

interface MedicalComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  playerCompliance: Map<string, PlayerComplianceInfo>;
  overallSeverity: 'low' | 'medium' | 'high' | 'critical';
  getAlternatives: (exerciseId: string, playerId: string) => ExerciseAlternative[];
  getLoadAdjustment: (exerciseId: string, playerId: string) => number;
  refreshCompliance: () => void;
  isLoading: boolean;
  error: any;
}

interface PlayerComplianceInfo {
  playerId: string;
  playerName: string;
  restrictions: MedicalRestriction[];
  violations: ComplianceViolation[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function useMedicalCompliance({
  session,
  selectedPlayers
}: UseMedicalComplianceParams): MedicalComplianceResult {
  const [playerMedicalData, setPlayerMedicalData] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch medical data for all selected players
  const playerIds = selectedPlayers.map(p => p.id);
  
  // Using skip pattern for conditional queries
  const medicalQueries = playerIds.map(playerId => 
    useGetPlayerMedicalDataQuery(playerId, {
      skip: !playerId || !session
    })
  );

  useEffect(() => {
    const loading = medicalQueries.some(query => query.isLoading);
    const hasError = medicalQueries.find(query => query.error);
    
    setIsLoading(loading);
    setError(hasError?.error || null);

    // Update medical data map
    const newMedicalData = new Map<string, any>();
    medicalQueries.forEach((query, index) => {
      if (query.data) {
        newMedicalData.set(playerIds[index], query.data);
      }
    });
    setPlayerMedicalData(newMedicalData);
  }, [medicalQueries, playerIds]);

  const complianceAnalysis = useMemo(() => {
    if (!session || selectedPlayers.length === 0) {
      return {
        isCompliant: true,
        violations: [],
        playerCompliance: new Map(),
        overallSeverity: 'low' as const
      };
    }

    const allViolations: ComplianceViolation[] = [];
    const playerComplianceMap = new Map<string, PlayerComplianceInfo>();
    let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Analyze each player's compliance
    selectedPlayers.forEach(player => {
      const medicalData = playerMedicalData.get(player.id);
      if (!medicalData) return;

      const restrictions = extractRestrictions(medicalData);
      const playerViolations: ComplianceViolation[] = [];

      // Check each exercise in the session
      session.exercises?.forEach((exercise: Exercise) => {
        const complianceResult = checkExerciseCompliance(
          exercise,
          restrictions,
          player.id
        );

        if (!complianceResult.isCompliant && complianceResult.violations) {
          playerViolations.push(...complianceResult.violations);
          allViolations.push(...complianceResult.violations);
        }
      });

      // Calculate player's overall severity
      const playerSeverity = playerViolations.reduce((max, violation) => {
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        return severityOrder.indexOf(violation.severity) > severityOrder.indexOf(max)
          ? violation.severity
          : max;
      }, 'low' as 'low' | 'medium' | 'high' | 'critical');

      if (severityOrder.indexOf(playerSeverity) > severityOrder.indexOf(highestSeverity)) {
        highestSeverity = playerSeverity;
      }

      playerComplianceMap.set(player.id, {
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        restrictions,
        violations: playerViolations,
        severity: playerSeverity
      });
    });

    return {
      isCompliant: allViolations.length === 0,
      violations: allViolations,
      playerCompliance: playerComplianceMap,
      overallSeverity: highestSeverity
    };
  }, [session, selectedPlayers, playerMedicalData]);

  const getAlternatives = (exerciseId: string, playerId: string): ExerciseAlternative[] => {
    const exercise = session?.exercises?.find(e => e.id === exerciseId);
    if (!exercise) return [];

    const medicalData = playerMedicalData.get(playerId);
    if (!medicalData) return [];

    const restrictions = extractRestrictions(medicalData);
    return findSafeAlternatives(exercise, restrictions);
  };

  const getLoadAdjustment = (exerciseId: string, playerId: string): number => {
    const exercise = session?.exercises?.find(e => e.id === exerciseId);
    if (!exercise) return 1.0;

    const medicalData = playerMedicalData.get(playerId);
    if (!medicalData) return 1.0;

    const restrictions = extractRestrictions(medicalData);
    return calculateLoadAdjustment(exercise, restrictions);
  };

  const refreshCompliance = () => {
    // Trigger refetch for all queries
    medicalQueries.forEach(query => query.refetch());
  };

  return {
    ...complianceAnalysis,
    getAlternatives,
    getLoadAdjustment,
    refreshCompliance,
    isLoading,
    error
  };
}

// Helper function to extract restrictions from medical data
function extractRestrictions(medicalData: any): MedicalRestriction[] {
  const restrictions: MedicalRestriction[] = [];

  // Extract from health conditions
  if (medicalData.healthConditions) {
    medicalData.healthConditions.forEach((condition: any) => {
      if (condition.restrictions) {
        restrictions.push(...condition.restrictions.map((r: string) => ({
          id: `condition-${condition.id}-${r}`,
          type: r,
          severity: getRestrictionSeverity(r),
          source: 'condition',
          expiryDate: condition.endDate
        })));
      }
    });
  }

  // Extract from injuries
  if (medicalData.injuries) {
    medicalData.injuries
      .filter((injury: any) => injury.status === 'active')
      .forEach((injury: any) => {
        if (injury.restrictions) {
          restrictions.push(...injury.restrictions.map((r: string) => ({
            id: `injury-${injury.id}-${r}`,
            type: r,
            severity: injury.severity || 'medium',
            source: 'injury',
            expiryDate: injury.expectedRecovery
          })));
        }
      });
  }

  // Extract from recovery protocols
  if (medicalData.recoveryProtocols) {
    medicalData.recoveryProtocols
      .filter((protocol: any) => protocol.isActive)
      .forEach((protocol: any) => {
        if (protocol.restrictions) {
          restrictions.push(...protocol.restrictions.map((r: string) => ({
            id: `protocol-${protocol.id}-${r}`,
            type: r,
            severity: 'medium',
            source: 'recovery',
            expiryDate: protocol.endDate
          })));
        }
      });
  }

  return restrictions;
}

const severityOrder = ['low', 'medium', 'high', 'critical'];

// Hook for exercise alternatives
interface UseExerciseAlternativesParams {
  playerId: string;
  exerciseId: string;
  session?: WorkoutSession | null;
}

export function useExerciseAlternatives({
  playerId,
  exerciseId,
  session
}: UseExerciseAlternativesParams) {
  const { data: medicalData, isLoading, error } = useGetPlayerMedicalDataQuery(playerId, {
    skip: !playerId
  });

  const alternatives = useMemo(() => {
    if (!medicalData || !session) return [];

    const exercise = session.exercises?.find(e => e.id === exerciseId);
    if (!exercise) return [];

    const restrictions = extractRestrictions(medicalData);
    const safeAlternatives = findSafeAlternatives(exercise, restrictions);

    // Sort alternatives by recommendation score
    return safeAlternatives.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }, [medicalData, exerciseId, session]);

  const loadMultiplier = useMemo(() => {
    if (!medicalData || !session) return 1.0;

    const exercise = session.exercises?.find(e => e.id === exerciseId);
    if (!exercise) return 1.0;

    const restrictions = extractRestrictions(medicalData);
    return calculateLoadAdjustment(exercise, restrictions);
  }, [medicalData, exerciseId, session]);

  const restMultiplier = useMemo(() => {
    // Calculate rest multiplier based on restrictions
    if (!medicalData) return 1.0;

    const restrictions = extractRestrictions(medicalData);
    const hasCardioRestrictions = restrictions.some(r => 
      r.type.toLowerCase().includes('cardio') || 
      r.type.toLowerCase().includes('endurance')
    );
    
    const hasRecoveryNeeds = restrictions.some(r =>
      r.source === 'recovery' || r.source === 'injury'
    );

    if (hasCardioRestrictions) return 1.5;
    if (hasRecoveryNeeds) return 1.3;
    return 1.0;
  }, [medicalData]);

  return {
    alternatives,
    loadMultiplier,
    restMultiplier,
    isLoading,
    error
  };
}