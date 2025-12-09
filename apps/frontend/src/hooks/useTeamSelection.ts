import { useState, useEffect } from 'react';
import { useGetTeamsQuery } from '@/store/api/userApi';
import type { Team } from '@/types/team.types';

interface UseTeamSelectionOptions {
  storageKey: string;
  defaultTeamId?: string;
  includeAllOption?: boolean;
  includePersonalOption?: boolean;
}

interface UseTeamSelectionReturn {
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  teams: Team[];
  teamsLoading: boolean;
  teamsError: any;
  isAllTeams: boolean;
  isPersonalView: boolean;
  selectedTeam: Team | undefined;
}

/**
 * Shared hook for team selection with localStorage persistence
 * Used across multiple dashboards for consistent team filtering
 */
export function useTeamSelection({
  storageKey,
  defaultTeamId,
  includeAllOption = true,
  includePersonalOption = false
}: UseTeamSelectionOptions): UseTeamSelectionReturn {
  // Fetch teams from API
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useGetTeamsQuery();
  
  // Handle the response structure { data: Team[] }
  // Ensure teams is always an array with defensive checks for various data structures
  let teams: Team[] = [];
  if (teamsData) {
    if (Array.isArray(teamsData)) {
      teams = teamsData;
    } else if (teamsData.data && Array.isArray(teamsData.data)) {
      teams = teamsData.data;
    } else if (teamsData.data && teamsData.data.data && Array.isArray(teamsData.data.data)) {
      // Handle double-nested data (shouldn't happen but defensive)
      teams = teamsData.data.data;
    }
  }

  // Initialize team selection from localStorage or default
  const [selectedTeamId, setSelectedTeamIdInternal] = useState<string | null>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    
    // Default selection logic
    if (defaultTeamId) {
      return defaultTeamId;
    }
    
    // If includeAllOption is true, default to 'all'
    if (includeAllOption) {
      return 'all';
    }
    
    // Can't use teams here as it's not available during initial render
    // Will be set by useEffect below
    return null;
  });

  // Update selectedTeamId when teams are loaded and current selection is invalid
  useEffect(() => {
    if (!teamsLoading && teams.length > 0 && selectedTeamId === null) {
      const newTeamId = defaultTeamId || (includeAllOption ? 'all' : teams[0].id);
      setSelectedTeamIdInternal(newTeamId);
    }
  }, [teams, teamsLoading, selectedTeamId, defaultTeamId, includeAllOption]);

  // Persist selection to localStorage
  const setSelectedTeamId = (teamId: string | null) => {
    setSelectedTeamIdInternal(teamId);
    if (teamId) {
      localStorage.setItem(storageKey, teamId);
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  // Helper getters
  const isAllTeams = selectedTeamId === 'all';
  const isPersonalView = selectedTeamId === 'personal';
  const selectedTeam = Array.isArray(teams) ? teams.find(team => team.id === selectedTeamId) : undefined;

  return {
    selectedTeamId,
    setSelectedTeamId,
    teams,
    teamsLoading,
    teamsError,
    isAllTeams,
    isPersonalView,
    selectedTeam
  };
}