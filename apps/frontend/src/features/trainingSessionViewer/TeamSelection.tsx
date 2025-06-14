'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTeam } from './trainingSessionViewerSlice';
import { useGetTeamsQuery } from './trainingSessionApi';

import { Label } from '@/components/ui/label';

export default function TeamSelection() {
  const dispatch = useAppDispatch();
  const selectedTeamId = useAppSelector((state) => state.trainingSessionViewer.selectedTeamId);
  const { data: teams = [], isLoading, error } = useGetTeamsQuery();

  // Temporary fallback when backend returns no teams
  const effectiveTeams = teams.length > 0 ? teams : [{ id: 'skelleftea-aik', name: 'Skellefteå AIK' }];

  const showBackendError = !!error;

  function handleChange(value: string) {
    dispatch(setTeam(value || undefined));
  }

  if (isLoading) {
    return (
      <div className="space-y-2 max-w-xs">
        <Label>Select Team</Label>
        <div className="h-10 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-xs">
      <Label>Select Team</Label>
      <select
        value={selectedTeamId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 block w-full rounded-md border bg-transparent px-3 py-2"
      >
        <option value="" disabled>
          -- choose --
        </option>
        {effectiveTeams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      {showBackendError && (
        <div className="p-2 text-red-500 text-sm">Backend unavailable. Showing demo team.</div>
      )}
    </div>
  );
} 