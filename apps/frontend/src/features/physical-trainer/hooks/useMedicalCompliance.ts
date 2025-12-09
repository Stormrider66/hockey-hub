'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetPlayerMedicalDataQuery } from '@/store/api/userApi';
import type { WorkoutType } from '../types/session.types';

// Types
interface MedicalRestriction {
  type: 'exercise' | 'load' | 'intensity' | 'movement';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  affectedBodyParts: string[];
  alternatives?: string[];
  loadReduction?: number; // Percentage reduction
}

interface PlayerMedicalStatus {
  playerId: string;
  status: 'healthy' | 'injured' | 'limited';
  restrictions: MedicalRestriction[];
  lastUpdated: string;
}

interface ComplianceCheck {
  playerId: string;
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
  recommendedAlternatives: string[];
  loadAdjustments: { [key: string]: number };
}

interface UseMedicalComplianceProps {
  playerIds: string[];
  workoutType: WorkoutType;
  workoutContent?: any;
  enableRealTimeChecks?: boolean;
  autoApplyRestrictions?: boolean;
}

interface UseMedicalComplianceReturn {
  // State
  medicalData: PlayerMedicalStatus[];
  isLoading: boolean;
  hasRestrictions: boolean;
  complianceStatus: 'compliant' | 'warnings' | 'violations' | 'unknown';
  
  // Checks
  checkPlayerCompliance: (playerId: string) => ComplianceCheck | null;
  checkExerciseCompliance: (exerciseId: string) => ComplianceCheck[];
  validateWorkout: () => Promise<ComplianceCheck[]>;
  
  // Restrictions
  getRestrictions: (playerId: string) => MedicalRestriction[];
  getAlternatives: (exerciseId: string, playerId: string) => string[];
  getLoadAdjustments: (playerId: string) => { [key: string]: number };
  
  // Actions
  applyRestrictions: () => void;
  generateReport: () => string;
  acknowledgeRisk: (playerId: string, riskType: string) => void;
  
  // Summary
  getSummary: () => {
    totalPlayers: number;
    healthyPlayers: number;
    injuredPlayers: number;
    limitedPlayers: number;
    totalRestrictions: number;
  };
}

export const useMedicalCompliance = ({
  playerIds,
  workoutType,
  workoutContent,
  enableRealTimeChecks = true,
  autoApplyRestrictions = false
}: UseMedicalComplianceProps): UseMedicalComplianceReturn => {
  const [acknowledgedRisks, setAcknowledgedRisks] = useState<Map<string, Set<string>>>(new Map());
  
  // Fetch medical data for all players
  const { data: medicalData, isLoading, error } = useGetPlayerMedicalDataQuery(
    { playerIds },
    { skip: playerIds.length === 0 }
  );

  // Process medical data into our format
  const processedMedicalData = useMemo((): PlayerMedicalStatus[] => {
    if (!medicalData) return [];
    
    return playerIds.map(playerId => {
      const playerData = medicalData.find((p: any) => p.id === playerId || p.playerId === playerId);
      if (!playerData) {
        return {
          playerId,
          status: 'healthy' as const,
          restrictions: [],
          lastUpdated: new Date().toISOString()
        };
      }

      // Convert API data to our restriction format
      const restrictions: MedicalRestriction[] = [];
      
      // Handle both formats: playerData.restrictions directly or playerData.medicalStatus.injuries
      const restrictionsData = playerData.restrictions || playerData.medicalStatus?.injuries || [];
      
      if (Array.isArray(restrictionsData)) {
        restrictionsData.forEach((restriction: any) => {
          restrictions.push({
            type: restriction.type || 'exercise',
            severity: restriction.severity || 'moderate',
            description: restriction.description || restriction.notes || restriction.type || 'Unknown restriction',
            affectedBodyParts: [restriction.bodyPart || 'unknown'],
            alternatives: restriction.alternatives || [],
            loadReduction: restriction.loadReduction || restriction.maxLoad 
              ? (100 - (restriction.maxLoad || 100))
              : (restriction.severity === 'severe' ? 50 : 25)
          });
        });
      }

      return {
        playerId,
        status: playerData.status || playerData.currentStatus || playerData.medicalStatus?.status || 'healthy',
        restrictions,
        lastUpdated: playerData.lastAssessment || playerData.medicalStatus?.lastUpdated || new Date().toISOString()
      };
    });
  }, [medicalData, playerIds]);

  // Calculate overall compliance status
  const complianceStatus = useMemo((): 'compliant' | 'warnings' | 'violations' | 'unknown' => {
    if (isLoading || !processedMedicalData) return 'unknown';
    
    const hasViolations = processedMedicalData.some(player => 
      player.status === 'injured' && player.restrictions.some(r => r.severity === 'severe')
    );
    
    const hasWarnings = processedMedicalData.some(player => 
      player.status === 'limited' || player.restrictions.length > 0
    );

    if (hasViolations) return 'violations';
    if (hasWarnings) return 'warnings';
    return 'compliant';
  }, [processedMedicalData, isLoading]);

  // Check if any players have medical restrictions
  const hasRestrictions = useMemo(() => 
    processedMedicalData.some(player => player.restrictions.length > 0),
    [processedMedicalData]
  );

  // Check compliance for a specific player
  const checkPlayerCompliance = useCallback((playerId: string): ComplianceCheck | null => {
    const playerData = processedMedicalData.find(p => p.playerId === playerId);
    if (!playerData) return null;

    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendedAlternatives: string[] = [];
    const loadAdjustments: { [key: string]: number } = {};

    playerData.restrictions.forEach(restriction => {
      if (restriction.severity === 'severe') {
        violations.push(`Severe ${restriction.type} restriction: ${restriction.description}`);
      } else {
        warnings.push(`${restriction.severity} ${restriction.type} restriction: ${restriction.description}`);
      }

      if (restriction.alternatives) {
        recommendedAlternatives.push(...restriction.alternatives);
      }

      if (restriction.loadReduction) {
        loadAdjustments['general'] = restriction.loadReduction;
      }
    });

    return {
      playerId,
      isCompliant: violations.length === 0,
      violations,
      warnings,
      recommendedAlternatives,
      loadAdjustments
    };
  }, [processedMedicalData]);

  // Check compliance for a specific exercise
  const checkExerciseCompliance = useCallback((exerciseId: string): ComplianceCheck[] => {
    return processedMedicalData.map(player => {
      const compliance = checkPlayerCompliance(player.playerId);
      return compliance || {
        playerId: player.playerId,
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendedAlternatives: [],
        loadAdjustments: {}
      };
    });
  }, [processedMedicalData, checkPlayerCompliance]);

  // Validate entire workout
  const validateWorkout = useCallback(async (): Promise<ComplianceCheck[]> => {
    const results: ComplianceCheck[] = [];
    
    for (const player of processedMedicalData) {
      const compliance = checkPlayerCompliance(player.playerId);
      if (compliance) {
        results.push(compliance);
      }
    }

    return results;
  }, [processedMedicalData, checkPlayerCompliance]);

  // Get restrictions for a player
  const getRestrictions = useCallback((playerId: string): MedicalRestriction[] => {
    const playerData = processedMedicalData.find(p => p.playerId === playerId);
    return playerData?.restrictions || [];
  }, [processedMedicalData]);

  // Get exercise alternatives for a player
  const getAlternatives = useCallback((exerciseId: string, playerId: string): string[] => {
    const restrictions = getRestrictions(playerId);
    const alternatives: string[] = [];
    
    restrictions.forEach(restriction => {
      if (restriction.alternatives) {
        alternatives.push(...restriction.alternatives);
      }
    });

    return [...new Set(alternatives)]; // Remove duplicates
  }, [getRestrictions]);

  // Get load adjustments for a player
  const getLoadAdjustments = useCallback((playerId: string): { [key: string]: number } => {
    const restrictions = getRestrictions(playerId);
    const adjustments: { [key: string]: number } = {};
    
    restrictions.forEach(restriction => {
      if (restriction.loadReduction) {
        adjustments[restriction.type] = Math.max(
          adjustments[restriction.type] || 0,
          restriction.loadReduction
        );
      }
    });

    return adjustments;
  }, [getRestrictions]);

  // Apply restrictions automatically
  const applyRestrictions = useCallback(() => {
    // This would modify the workout content based on restrictions
    // Implementation depends on the specific workout builder
    console.log('Applying medical restrictions to workout...');
  }, []);

  // Generate compliance report
  const generateReport = useCallback((): string => {
    const summary = getSummary();
    let report = `Medical Compliance Report\n`;
    report += `========================\n\n`;
    report += `Total Players: ${summary.totalPlayers}\n`;
    report += `Healthy: ${summary.healthyPlayers}\n`;
    report += `Injured: ${summary.injuredPlayers}\n`;
    report += `Limited: ${summary.limitedPlayers}\n`;
    report += `Total Restrictions: ${summary.totalRestrictions}\n\n`;

    processedMedicalData.forEach(player => {
      if (player.restrictions.length > 0) {
        report += `Player ${player.playerId}:\n`;
        player.restrictions.forEach(restriction => {
          report += `  - ${restriction.severity} ${restriction.type}: ${restriction.description}\n`;
        });
        report += '\n';
      }
    });

    return report;
  }, [processedMedicalData]);

  // Acknowledge a risk for a player
  const acknowledgeRisk = useCallback((playerId: string, riskType: string) => {
    setAcknowledgedRisks(prev => {
      const newMap = new Map(prev);
      const playerRisks = newMap.get(playerId) || new Set();
      playerRisks.add(riskType);
      newMap.set(playerId, playerRisks);
      return newMap;
    });
  }, []);

  // Get summary statistics
  const getSummary = useCallback(() => {
    const totalPlayers = processedMedicalData.length;
    const healthyPlayers = processedMedicalData.filter(p => p.status === 'healthy').length;
    const injuredPlayers = processedMedicalData.filter(p => p.status === 'injured').length;
    const limitedPlayers = processedMedicalData.filter(p => p.status === 'limited').length;
    const totalRestrictions = processedMedicalData.reduce((sum, p) => sum + p.restrictions.length, 0);

    return {
      totalPlayers,
      healthyPlayers,
      injuredPlayers,
      limitedPlayers,
      totalRestrictions
    };
  }, [processedMedicalData]);

  return {
    // State
    medicalData: processedMedicalData,
    isLoading,
    hasRestrictions,
    complianceStatus,
    
    // Checks
    checkPlayerCompliance,
    checkExerciseCompliance,
    validateWorkout,
    
    // Restrictions
    getRestrictions,
    getAlternatives,
    getLoadAdjustments,
    
    // Actions
    applyRestrictions,
    generateReport,
    acknowledgeRisk,
    
    // Summary
    getSummary
  };
};