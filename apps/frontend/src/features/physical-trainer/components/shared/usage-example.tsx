// This file demonstrates how to use the shared components
// This is for documentation purposes only

import React, { useState } from 'react';
import { PlayerTeamAssignment, PlayerTeamAssignmentProps } from './PlayerTeamAssignment';
import { WorkoutBuilderHeader } from './WorkoutBuilderHeader';

// ==================== PlayerTeamAssignment Examples ====================

// Example 1: Basic usage (similar to original PlayerAssignment)
const BasicUsageExample = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={selectedTeams}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={setSelectedTeams}
    />
  );
};

// Example 2: Players only (for agility/conditioning builders)
const PlayersOnlyExample = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={[]}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={() => {}} // No-op since teams are disabled
      showTeams={false}
      title="Select Players for Agility Session"
      description="Choose individual players who will participate in this agility training session."
      playerTabLabel="Available Players"
    />
  );
};

// Example 3: Inline usage without card wrapper
const InlineExample = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Custom Wrapper</h2>
      <PlayerTeamAssignment
        selectedPlayers={selectedPlayers}
        selectedTeams={selectedTeams}
        onPlayersChange={setSelectedPlayers}
        onTeamsChange={setSelectedTeams}
        inline={true}
        showSummary={false}
        maxHeight={300}
      />
    </div>
  );
};

// Example 4: With custom callbacks and no medical features
const SimplifiedExample = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={selectedTeams}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={setSelectedTeams}
      showMedical={false}
      showFilters={false}
      onPlayerClick={(player) => console.log('Player clicked:', player)}
      onTeamClick={(team) => console.log('Team clicked:', team)}
      title="Quick Assignment"
      description="Simple player and team selection"
    />
  );
};

// Example 5: With filtering and custom data
const FilteredExample = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  const customPlayers = [
    {
      id: '1',
      name: 'Connor McDavid',
      jerseyNumber: 97,
      position: 'Center',
      team: 'Edmonton Oilers',
      wellness: { status: 'healthy' as const }
    },
    {
      id: '2', 
      name: 'Sidney Crosby',
      jerseyNumber: 87,
      position: 'Center',
      team: 'Pittsburgh Penguins',
      wellness: { status: 'injured' as const }
    }
  ];

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={[]}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={() => {}}
      showTeams={false}
      customPlayers={customPlayers}
      filterInjured={true}
      filterByPosition={['Center', 'Winger']}
      title="Filtered Player Selection"
      description="Only showing healthy centers and wingers"
    />
  );
};

// ==================== WorkoutBuilderHeader Examples ====================

// Example showing how to update ConditioningWorkoutBuilder to use WorkoutBuilderHeader

// BEFORE (current implementation):
/*
<div className="flex flex-col h-full">
  <div className="flex items-center justify-between p-4 border-b">
    <div>
      <h2 className="text-2xl font-bold">{t('physicalTrainer:conditioning.builder.title')}</h2>
      <p className="text-muted-foreground">
        {t('physicalTrainer:conditioning.builder.subtitle')}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-lg px-3 py-1">
        <Clock className="h-4 w-4 mr-2" />
        {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
      </Badge>
      <Badge variant="outline" className="text-lg px-3 py-1">
        <Zap className="h-4 w-4 mr-2" />
        ~{Math.round(estimatedCalories)} cal
      </Badge>
      <Button variant="outline" onClick={onCancel}>
        <X className="h-4 w-4 mr-2" />
        {t('common:cancel')}
      </Button>
      <Button onClick={handleSave} disabled={!isValid || isLoading}>
        {isLoading ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t('common:saving')}
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {t('common:save')}
          </>
        )}
      </Button>
    </div>
  </div>
  ...rest of component
</div>
*/

// AFTER (using WorkoutBuilderHeader):

const ConditioningWorkoutBuilderExample = ({ onSave, onCancel }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // ... save logic
      setLastSaved(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <WorkoutBuilderHeader
        title="Conditioning Workout Builder"
        workoutType="conditioning"
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isLoading}
        showAutoSave={true}
        lastSaved={lastSaved}
      />
      
      {/* Additional info badges can go in a sub-header if needed */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
        {/* Custom badges specific to conditioning workouts */}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* ... rest of the component */}
      </div>
    </div>
  );
};

// Similar usage for other workout builders:

// AgilityWorkoutBuilder:
const AgilityBuilderExample = () => (
  <WorkoutBuilderHeader
    title="Agility Workout Builder"
    workoutType="agility"
    onSave={() => {}}
    onCancel={() => {}}
    isSaving={false}
  />
);

// HybridWorkoutBuilder:
const HybridBuilderExample = () => (
  <WorkoutBuilderHeader
    title="Hybrid Workout Builder"
    workoutType="hybrid"
    onSave={() => {}}
    onCancel={() => {}}
    isSaving={false}
    progress={75} // Optional progress indicator
  />
);

// SessionBuilder (strength training):
const SessionBuilderExample = () => (
  <WorkoutBuilderHeader
    title="Session Builder"
    workoutType="strength"
    onSave={() => {}}
    onCancel={() => {}}
    isSaving={false}
    showAutoSave={true}
    lastSaved={new Date()}
  />
);

// ==================== Integration Examples ====================

// How to update existing SessionBuilder to use PlayerTeamAssignment
const SessionBuilderWithNewPlayerAssignment = () => {
  const [session, setSession] = useState({
    targetPlayers: [],
    targetTeams: []
  });

  return (
    <div>
      {/* Replace the old PlayerAssignment component with: */}
      <PlayerTeamAssignment
        selectedPlayers={session.targetPlayers}
        selectedTeams={session.targetTeams}
        onPlayersChange={(players) => setSession(prev => ({ ...prev, targetPlayers: players }))}
        onTeamsChange={(teams) => setSession(prev => ({ ...prev, targetTeams: teams }))}
        title="Assign Session"
        description="Select players and teams for this training session"
      />
    </div>
  );
};

// How other builders can use the component with different configurations
const ConditioningBuilderPlayerAssignment = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={[]}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={() => {}}
      showTeams={false} // Conditioning might be more individual-focused
      showMedical={true} // Important for conditioning due to injury risk
      title="Select Players for Conditioning"
      description="Choose players who will participate in this conditioning session"
      filterInjured={true} // Automatically filter out injured players
    />
  );
};

const AgilityBuilderPlayerAssignment = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  return (
    <PlayerTeamAssignment
      selectedPlayers={selectedPlayers}
      selectedTeams={[]}
      onPlayersChange={setSelectedPlayers}
      onTeamsChange={() => {}}
      showTeams={false} // Agility is typically individual
      showMedical={true}
      maxHeight={300} // Smaller height for agility builder layout
      inline={true} // No card wrapper
      title="Player Selection"
      playerTabLabel="Available Athletes"
    />
  );
};