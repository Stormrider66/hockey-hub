'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutBuilderHeader } from './WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './PlayerTeamAssignment';
import { useBulkSession } from '../../hooks/useBulkSession';
import { BulkConfigurationPanel } from './BulkConfigurationPanel';
import { useTranslation } from 'react-i18next';
import { Copy, Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BulkModeDemoProps {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
}

export const BulkModeDemo: React.FC<BulkModeDemoProps> = ({ workoutType = 'conditioning' }) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(['player-1', 'player-2', 'player-3', 'player-4']);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['team-1']);
  const [activeTab, setActiveTab] = useState('header');
  
  // Mock workout data
  const mockWorkout = {
    id: 'demo-workout',
    name: `Sample ${workoutType} Workout`,
    type: workoutType,
    exercises: []
  };

  const {
    config,
    updateConfig,
    canProceed,
    totalParticipants
  } = useBulkSession({
    workoutType,
    baseWorkout: mockWorkout,
    onComplete: async (config) => {
      console.log('Bulk session configuration completed:', config);
    }
  });

  const handleSave = () => {
    if (bulkMode) {
      console.log('Saving bulk sessions:', config.numberOfSessions);
    } else {
      console.log('Saving single workout');
    }
  };

  const handleCancel = () => {
    setBulkMode(false);
    setSelectedPlayers([]);
    setSelectedTeams([]);
  };

  const handleBulkToggle = (enabled: boolean) => {
    setBulkMode(enabled);
    if (!enabled) {
      // Reset to single session mode
      console.log('Switched to single session mode');
    } else {
      console.log('Switched to bulk session mode');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Phase 1.2: Enhanced Shared Components</h2>
        <p className="text-muted-foreground">
          Demo showcasing bulk mode support in WorkoutBuilderHeader and PlayerTeamAssignment components
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant={bulkMode ? "default" : "secondary"}>
            {bulkMode ? "Bulk Mode Active" : "Single Mode"}
          </Badge>
          <Badge variant="outline">
            {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header">Enhanced Header</TabsTrigger>
          <TabsTrigger value="assignment">Player Assignment</TabsTrigger>
          <TabsTrigger value="configuration">Bulk Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Enhanced WorkoutBuilderHeader
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The WorkoutBuilderHeader now includes bulk mode toggle functionality with visual indicators.
              </p>
              
              <div className="border rounded-lg">
                <WorkoutBuilderHeader
                  title={`${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout Builder`}
                  workoutType={workoutType}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  supportsBulkMode={true}
                  bulkMode={bulkMode}
                  onBulkToggle={handleBulkToggle}
                  bulkConfig={config}
                  onBulkConfigChange={updateConfig}
                />
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Features Added:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bulk mode toggle switch with visual separator</li>
                  <li>• Session count badge when bulk mode is active</li>
                  <li>• Dynamic save button text based on mode</li>
                  <li>• Backward compatibility maintained</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enhanced PlayerTeamAssignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The PlayerTeamAssignment component now supports session distribution for bulk mode.
              </p>
              
              <PlayerTeamAssignment
                selectedPlayers={selectedPlayers}
                selectedTeams={selectedTeams}
                onPlayersChange={setSelectedPlayers}
                onTeamsChange={setSelectedTeams}
                bulkMode={bulkMode}
                bulkConfig={bulkMode ? config : undefined}
                onBulkConfigChange={bulkMode ? updateConfig : undefined}
                showSessionDistribution={true}
                title="Assignment with Bulk Support"
                description={bulkMode 
                  ? `Assign players across ${config.numberOfSessions} sessions` 
                  : "Select players and teams for single session"
                }
              />

              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Features Added:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Session distribution summary with visual indicators</li>
                  <li>• Auto-distribute functionality for players and teams</li>
                  <li>• Collapsible detailed session breakdown</li>
                  <li>• Real-time participant count per session</li>
                  <li>• Quick distribute button in filter bar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bulk Configuration Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                When bulk mode is active, the existing BulkConfigurationPanel provides comprehensive session setup.
              </p>
              
              {bulkMode ? (
                <BulkConfigurationPanel
                  workoutType={workoutType}
                  baseWorkout={mockWorkout}
                  onComplete={async (bulkConfig) => {
                    console.log('Bulk configuration completed:', bulkConfig);
                  }}
                  onCancel={() => setBulkMode(false)}
                  enablePlayerDistribution={true}
                  showAdvancedOptions={true}
                  maxSessions={6}
                  minSessions={2}
                />
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Enable bulk mode to see configuration options
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setBulkMode(true)}
                  >
                    Enable Bulk Mode
                  </Button>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Integration Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seamless integration with existing bulk session system</li>
                  <li>• Shared state management between components</li>
                  <li>• Consistent validation and error handling</li>
                  <li>• Unified user experience across all workout types</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {canProceed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Components Enhanced:</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  WorkoutBuilderHeader - Bulk mode toggle
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  PlayerTeamAssignment - Session distribution
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Type definitions extended
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Current Configuration:</h4>
              <ul className="text-sm space-y-1">
                <li>Mode: <Badge variant="secondary">{bulkMode ? 'Bulk' : 'Single'}</Badge></li>
                <li>Workout Type: <Badge variant="outline">{workoutType}</Badge></li>
                {bulkMode && (
                  <>
                    <li>Sessions: <Badge variant="secondary">{config.numberOfSessions}</Badge></li>
                    <li>Total Participants: <Badge variant="secondary">{totalParticipants}</Badge></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkModeDemo;