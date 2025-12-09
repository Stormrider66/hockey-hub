import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users } from 'lucide-react';
import { PlayerTeamAssignment } from '../components/shared/PlayerTeamAssignment';
import { usePlayerAssignment } from '../hooks/usePlayerAssignment';
import { WorkoutType } from '../types/session.types';

/**
 * Example component showing how to use the usePlayerAssignment hook
 * with the PlayerTeamAssignment component for a unified experience
 */
export function PlayerAssignmentExample() {
  // Initialize the hook with configuration
  const {
    selectedPlayers,
    selectedTeams,
    totalAffectedPlayers,
    isValid,
    togglePlayer,
    toggleTeam,
    clearAll,
    selectAll,
    medicalWarnings,
    medicalErrors,
    errors,
    warnings,
    validate,
    formatSummary,
    isLoading,
    playersData,
    teamsData
  } = usePlayerAssignment({
    teamId: 'team-1', // Optional: filter by team
    requireAssignment: true, // Require at least one assignment
    enableMedicalChecks: true, // Enable medical compliance
    workoutType: WorkoutType.STRENGTH, // For medical checks
    exercises: [] // Pass actual exercises for detailed compliance
  });

  const handleSubmit = () => {
    if (validate()) {
      console.log('Valid assignment:', {
        players: selectedPlayers,
        teams: selectedTeams,
        total: totalAffectedPlayers,
        summary: formatSummary()
      });
    } else {
      console.error('Invalid assignment:', errors);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Player Assignment</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatSummary()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isValid ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {totalAffectedPlayers} players
            </Badge>
          </div>
        </div>
      </Card>

      {/* Validation errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Medical warnings */}
      {medicalWarnings.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Medical Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {medicalWarnings.map((warning, index) => (
                <li key={index}>
                  {warning.message}
                  {warning.restrictions && (
                    <span className="text-xs ml-2">
                      ({warning.restrictions.join(', ')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Player/Team Assignment Component */}
      <PlayerTeamAssignment
        selectedPlayers={selectedPlayers}
        selectedTeams={selectedTeams}
        onPlayersChange={(playerIds) => {
          // Use the hook's toggle methods to maintain state
          const currentSet = new Set(selectedPlayers);
          const newSet = new Set(playerIds);
          
          // Find added/removed players
          playerIds.forEach(id => {
            if (!currentSet.has(id)) togglePlayer(id);
          });
          selectedPlayers.forEach(id => {
            if (!newSet.has(id)) togglePlayer(id);
          });
        }}
        onTeamsChange={(teamIds) => {
          // Use the hook's toggle methods to maintain state
          const currentSet = new Set(selectedTeams);
          const newSet = new Set(teamIds);
          
          // Find added/removed teams
          teamIds.forEach(id => {
            if (!currentSet.has(id)) toggleTeam(id);
          });
          selectedTeams.forEach(id => {
            if (!newSet.has(id)) toggleTeam(id);
          });
        }}
        showMedical={true}
        showSummary={false} // We show our own summary
        title="Assign Players and Teams"
        description="Select individual players or entire teams for this workout session"
        customPlayers={isLoading ? [] : playersData} // Use data from hook
        customTeams={isLoading ? [] : teamsData} // Use data from hook
      />

      {/* Action buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => selectAll()}
            disabled={isLoading}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            onClick={clearAll}
            disabled={selectedPlayers.length === 0 && selectedTeams.length === 0}
          >
            Clear All
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
        >
          Confirm Assignment ({totalAffectedPlayers} players)
        </Button>
      </div>
    </div>
  );
}

/**
 * Alternative usage: Minimal example
 */
export function MinimalAssignmentExample() {
  const assignment = usePlayerAssignment({
    requireAssignment: true
  });

  return (
    <PlayerTeamAssignment
      selectedPlayers={assignment.selectedPlayers}
      selectedTeams={assignment.selectedTeams}
      onPlayersChange={(ids) => {
        // Simple replacement
        ids.forEach(id => {
          if (!assignment.selectedPlayers.includes(id)) {
            assignment.addPlayer(id);
          }
        });
        assignment.selectedPlayers.forEach(id => {
          if (!ids.includes(id)) {
            assignment.removePlayer(id);
          }
        });
      }}
      onTeamsChange={(ids) => {
        // Simple replacement
        ids.forEach(id => {
          if (!assignment.selectedTeams.includes(id)) {
            assignment.addTeam(id);
          }
        });
        assignment.selectedTeams.forEach(id => {
          if (!ids.includes(id)) {
            assignment.removeTeam(id);
          }
        });
      }}
    />
  );
}