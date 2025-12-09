import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGetPlayersQuery, useGetTeamsQuery } from '@/store/api/playerApi';
import { useGetPlayerMedicalDataQuery } from '@/store/api/medicalApi';
import { 
  calculateAffectedPlayers, 
  formatPlayerSummary,
  validatePlayerEligibility,
  type AssignmentSummary,
  type ScheduleConflict
} from '../utils/assignmentHelpers';
import {
  checkExerciseCompliance,
  type MedicalRestriction,
  type ComplianceViolation
} from '../utils/medicalCompliance';
import type { Player, Team, Exercise } from '../types';
import type { WorkoutType } from '../types/session.types';

// Types
export interface UsePlayerAssignmentParams {
  teamId?: string;
  initialPlayers?: string[];
  initialTeams?: string[];
  requireAssignment?: boolean;
  enableMedicalChecks?: boolean;
  workoutType?: WorkoutType;
  exercises?: Exercise[];
}

export interface MedicalWarning {
  playerId: string;
  playerName: string;
  type: 'injured' | 'limited' | 'restriction';
  message: string;
  severity: 'low' | 'medium' | 'high';
  restrictions?: string[];
}

export interface MedicalError {
  playerId: string;
  playerName: string;
  message: string;
  violations: ComplianceViolation[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface UsePlayerAssignmentReturn {
  // State
  selectedPlayers: string[];
  selectedTeams: string[];
  totalAffectedPlayers: number;
  isValid: boolean;
  
  // Actions
  addPlayer: (playerId: string) => void;
  removePlayer: (playerId: string) => void;
  addTeam: (teamId: string) => void;
  removeTeam: (teamId: string) => void;
  clearAll: () => void;
  selectAll: (type?: 'players' | 'teams') => void;
  togglePlayer: (playerId: string) => void;
  toggleTeam: (teamId: string) => void;
  
  // Medical
  medicalWarnings: MedicalWarning[];
  medicalErrors: MedicalError[];
  checkCompliance: () => Promise<boolean>;
  getPlayerMedicalStatus: (playerId: string) => 'healthy' | 'injured' | 'limited' | 'restricted';
  
  // Validation
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validate: () => boolean;
  
  // Summary
  getAssignmentSummary: () => AssignmentSummary;
  formatSummary: () => string;
  
  // Loading states
  isLoading: boolean;
  playersData: Player[];
  teamsData: Team[];
}

export function usePlayerAssignment({
  teamId,
  initialPlayers = [],
  initialTeams = [],
  requireAssignment = false,
  enableMedicalChecks = true,
  workoutType,
  exercises = []
}: UsePlayerAssignmentParams = {}): UsePlayerAssignmentReturn {
  // State
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(initialPlayers);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(initialTeams);
  const [medicalDataCache, setMedicalDataCache] = useState<Map<string, any>>(new Map());
  
  // Fetch players and teams
  const { 
    data: playersResponse, 
    isLoading: playersLoading 
  } = useGetPlayersQuery(teamId);
  
  const { 
    data: teamsResponse, 
    isLoading: teamsLoading 
  } = useGetTeamsQuery(teamId);
  
  const playersData = useMemo(() => 
    playersResponse?.players || playersResponse || [], 
    [playersResponse]
  );
  
  const teamsData = useMemo(() => 
    teamsResponse?.teams || teamsResponse?.data || teamsResponse || [], 
    [teamsResponse]
  );
  
  // Actions
  const addPlayer = useCallback((playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) ? prev : [...prev, playerId]
    );
  }, []);
  
  const removePlayer = useCallback((playerId: string) => {
    setSelectedPlayers(prev => prev.filter(id => id !== playerId));
  }, []);
  
  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  }, []);
  
  const addTeam = useCallback((teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) ? prev : [...prev, teamId]
    );
  }, []);
  
  const removeTeam = useCallback((teamId: string) => {
    setSelectedTeams(prev => prev.filter(id => id !== teamId));
  }, []);
  
  const toggleTeam = useCallback((teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  }, []);
  
  const clearAll = useCallback(() => {
    setSelectedPlayers([]);
    setSelectedTeams([]);
  }, []);
  
  const selectAll = useCallback((type?: 'players' | 'teams') => {
    if (!type || type === 'players') {
      const allPlayerIds = playersData
        .filter(p => !enableMedicalChecks || p.wellness?.status !== 'unavailable')
        .map(p => p.id);
      setSelectedPlayers(allPlayerIds);
    }
    
    if (!type || type === 'teams') {
      const allTeamIds = teamsData.map(t => t.id);
      setSelectedTeams(allTeamIds);
    }
  }, [playersData, teamsData, enableMedicalChecks]);
  
  // Calculate affected players
  const affectedPlayers = useMemo(() => {
    const selectedPlayerObjects = playersData.filter(p => 
      selectedPlayers.includes(p.id)
    );
    const selectedTeamObjects = teamsData.filter(t => 
      selectedTeams.includes(t.id)
    );
    
    return calculateAffectedPlayers(
      selectedPlayerObjects,
      selectedTeamObjects,
      playersData
    );
  }, [selectedPlayers, selectedTeams, playersData, teamsData]);
  
  const totalAffectedPlayers = affectedPlayers.length;
  
  // Medical checks
  const medicalWarnings = useMemo<MedicalWarning[]>(() => {
    if (!enableMedicalChecks) return [];
    
    const warnings: MedicalWarning[] = [];
    
    affectedPlayers.forEach(player => {
      // Check wellness status
      if (player.wellness?.status === 'injured') {
        warnings.push({
          playerId: player.id,
          playerName: player.name,
          type: 'injured',
          message: `${player.name} is currently injured`,
          severity: 'high'
        });
      } else if (player.wellness?.status === 'limited') {
        warnings.push({
          playerId: player.id,
          playerName: player.name,
          type: 'limited',
          message: `${player.name} has limited participation status`,
          severity: 'medium'
        });
      }
      
      // Check medical restrictions from cache
      const medicalData = medicalDataCache.get(player.id);
      if (medicalData?.restrictions?.length > 0) {
        warnings.push({
          playerId: player.id,
          playerName: player.name,
          type: 'restriction',
          message: `${player.name} has ${medicalData.restrictions.length} medical restrictions`,
          severity: 'medium',
          restrictions: medicalData.restrictions.map((r: any) => r.type)
        });
      }
    });
    
    return warnings;
  }, [affectedPlayers, enableMedicalChecks, medicalDataCache]);
  
  const medicalErrors = useMemo<MedicalError[]>(() => {
    if (!enableMedicalChecks || !workoutType || exercises.length === 0) return [];
    
    const errors: MedicalError[] = [];
    
    affectedPlayers.forEach(player => {
      const eligibility = validatePlayerEligibility(player, workoutType);
      if (!eligibility.eligible) {
        errors.push({
          playerId: player.id,
          playerName: player.name,
          message: eligibility.reason || 'Player is not eligible for this workout',
          violations: []
        });
      }
    });
    
    return errors;
  }, [affectedPlayers, enableMedicalChecks, workoutType, exercises]);
  
  // Validation
  const errors = useMemo<ValidationError[]>(() => {
    const validationErrors: ValidationError[] = [];
    
    if (requireAssignment && totalAffectedPlayers === 0) {
      validationErrors.push({
        field: 'assignment',
        message: 'At least one player or team must be assigned',
        code: 'ASSIGNMENT_REQUIRED'
      });
    }
    
    // Add medical errors as validation errors
    medicalErrors.forEach(error => {
      validationErrors.push({
        field: 'medical',
        message: error.message,
        code: 'MEDICAL_RESTRICTION'
      });
    });
    
    return validationErrors;
  }, [requireAssignment, totalAffectedPlayers, medicalErrors]);
  
  const warnings = useMemo<ValidationWarning[]>(() => {
    const validationWarnings: ValidationWarning[] = [];
    
    // Convert medical warnings to validation warnings
    medicalWarnings.forEach(warning => {
      validationWarnings.push({
        field: 'medical',
        message: warning.message,
        code: `MEDICAL_${warning.type.toUpperCase()}`
      });
    });
    
    // Add warning for large group size
    if (totalAffectedPlayers > 30) {
      validationWarnings.push({
        field: 'size',
        message: `Large group size (${totalAffectedPlayers} players) may impact session quality`,
        code: 'LARGE_GROUP'
      });
    }
    
    return validationWarnings;
  }, [medicalWarnings, totalAffectedPlayers]);
  
  const isValid = errors.length === 0;
  
  const validate = useCallback(() => {
    return isValid;
  }, [isValid]);
  
  // Medical status helper
  const getPlayerMedicalStatus = useCallback((playerId: string): 'healthy' | 'injured' | 'limited' | 'restricted' => {
    const player = playersData.find(p => p.id === playerId);
    if (!player) return 'healthy';
    
    if (player.wellness?.status === 'injured') return 'injured';
    if (player.wellness?.status === 'limited') return 'limited';
    
    const medicalData = medicalDataCache.get(playerId);
    if (medicalData?.restrictions?.length > 0) return 'restricted';
    
    return 'healthy';
  }, [playersData, medicalDataCache]);
  
  // Compliance check
  const checkCompliance = useCallback(async () => {
    if (!enableMedicalChecks) return true;
    
    // In a real implementation, this would fetch fresh medical data
    // For now, we'll use the cached data and current state
    return medicalErrors.length === 0;
  }, [enableMedicalChecks, medicalErrors]);
  
  // Summary helpers
  const getAssignmentSummary = useCallback((): AssignmentSummary => {
    const selectedPlayerObjects = playersData.filter(p => 
      selectedPlayers.includes(p.id)
    );
    const selectedTeamObjects = teamsData.filter(t => 
      selectedTeams.includes(t.id)
    );
    
    return formatPlayerSummary(
      selectedPlayerObjects,
      selectedTeamObjects,
      playersData
    );
  }, [selectedPlayers, selectedTeams, playersData, teamsData]);
  
  const formatSummary = useCallback((): string => {
    const summary = getAssignmentSummary();
    
    if (summary.totalPlayers === 0) {
      return 'No players assigned';
    }
    
    const parts: string[] = [];
    
    if (summary.directAssignments > 0) {
      parts.push(`${summary.directAssignments} player${summary.directAssignments !== 1 ? 's' : ''}`);
    }
    
    if (summary.teams.length > 0) {
      parts.push(`${summary.teams.length} team${summary.teams.length !== 1 ? 's' : ''}`);
    }
    
    const mainText = parts.join(' and ');
    const totalText = `(${summary.totalPlayers} total)`;
    
    return `${mainText} ${totalText}`;
  }, [getAssignmentSummary]);
  
  // Fetch medical data for affected players
  useEffect(() => {
    if (!enableMedicalChecks) return;
    
    // In a real implementation, we would fetch medical data here
    // For now, we'll simulate it with the wellness status
    const newCache = new Map<string, any>();
    
    affectedPlayers.forEach(player => {
      if (player.wellness?.status === 'injured' || player.wellness?.status === 'limited') {
        newCache.set(player.id, {
          restrictions: [
            { type: 'high-impact', severity: 'medium' },
            { type: 'heavy-lifting', severity: 'high' }
          ]
        });
      }
    });
    
    setMedicalDataCache(newCache);
  }, [affectedPlayers, enableMedicalChecks]);
  
  return {
    // State
    selectedPlayers,
    selectedTeams,
    affectedPlayers,
    totalAffectedPlayers,
    isValid,
    
    // Actions
    addPlayer,
    removePlayer,
    addTeam,
    removeTeam,
    clearAll,
    selectAll,
    togglePlayer,
    toggleTeam,
    
    // Medical
    medicalWarnings,
    medicalErrors,
    checkCompliance,
    getPlayerMedicalStatus,
    
    // Validation
    errors,
    warnings,
    validate,
    
    // Summary
    getAssignmentSummary,
    formatSummary,
    
    // Loading states
    isLoading: playersLoading || teamsLoading,
    playersData,
    teamsData
  };
}