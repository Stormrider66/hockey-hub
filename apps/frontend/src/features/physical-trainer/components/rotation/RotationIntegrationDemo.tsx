'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EnhancedRotationExecutionView } from './EnhancedRotationExecutionView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RotateCcw, 
  Play, 
  Users, 
  Timer, 
  Zap,
  Info
} from '@/components/icons';
import type { 
  RotationSchedule, 
  WorkoutStation, 
  RotationGroup,
  StationWorkout
} from '../../types/rotation.types';
import { WorkoutEquipmentType } from '../../types/conditioning.types';
import { GROUP_COLORS, STATION_COLORS } from '../../types/rotation.types';

export const RotationIntegrationDemo: React.FC = () => {
  const { t } = useTranslation(['physicalTrainer']);
  const [showExecution, setShowExecution] = useState(false);

  // Create demo rotation schedule
  const demoSchedule: RotationSchedule = {
    id: 'demo-rotation-schedule',
    name: 'Elite Team Conditioning Circuit',
    stations: [
      {
        id: 'station-rowing',
        name: 'Rowing Station',
        equipment: WorkoutEquipmentType.ROWING,
        capacity: 6,
        duration: 15,
        color: STATION_COLORS[0],
        position: { x: 0, y: 0 },
        workout: {
          type: 'intervals',
          data: {
            id: 'rowing-intervals',
            name: 'Rowing Intervals',
            description: 'High-intensity rowing intervals',
            equipment: WorkoutEquipmentType.ROWING,
            intervals: [
              { phase: 'work', duration: 240, intensity: 80, targetHR: 160 },
              { phase: 'rest', duration: 120, intensity: 50, targetHR: 120 },
              { phase: 'work', duration: 240, intensity: 85, targetHR: 165 },
              { phase: 'rest', duration: 120, intensity: 50, targetHR: 120 },
              { phase: 'work', duration: 180, intensity: 90, targetHR: 170 }
            ],
            totalDuration: 900,
            estimatedCalories: 180,
            targetZones: {
              zone1: { min: 100, max: 130 },
              zone2: { min: 130, max: 150 },
              zone3: { min: 150, max: 170 },
              zone4: { min: 170, max: 185 },
              zone5: { min: 185, max: 200 }
            },
            tags: ['cardio', 'intervals'],
            difficulty: 'intermediate'
          }
        } as StationWorkout
      },
      {
        id: 'station-bike',
        name: 'Bike Erg Station',
        equipment: WorkoutEquipmentType.BIKE_ERG,
        capacity: 6,
        duration: 15,
        color: STATION_COLORS[1],
        position: { x: 1, y: 0 },
        workout: {
          type: 'intervals',
          data: {
            id: 'bike-intervals',
            name: 'Bike Erg Power',
            description: 'Power-based bike intervals',
            equipment: WorkoutEquipmentType.BIKE_ERG,
            intervals: [
              { phase: 'work', duration: 300, intensity: 75, targetWatts: 250 },
              { phase: 'rest', duration: 180, intensity: 40, targetWatts: 100 },
              { phase: 'work', duration: 300, intensity: 80, targetWatts: 275 },
              { phase: 'rest', duration: 120, intensity: 40, targetWatts: 100 }
            ],
            totalDuration: 900,
            estimatedCalories: 200,
            targetZones: {},
            tags: ['power', 'bike'],
            difficulty: 'hard'
          }
        } as StationWorkout
      },
      {
        id: 'station-skierg',
        name: 'Ski Erg Station',
        equipment: WorkoutEquipmentType.SKIERG,
        capacity: 4,
        duration: 15,
        color: STATION_COLORS[2],
        position: { x: 2, y: 0 },
        workout: {
          type: 'intervals',
          data: {
            id: 'ski-intervals',
            name: 'Ski Erg Endurance',
            description: 'Full-body ski erg workout',
            equipment: WorkoutEquipmentType.SKIERG,
            intervals: [
              { phase: 'work', duration: 420, intensity: 70, targetHR: 155 },
              { phase: 'rest', duration: 180, intensity: 45, targetHR: 115 },
              { phase: 'work', duration: 300, intensity: 85, targetHR: 170 }
            ],
            totalDuration: 900,
            estimatedCalories: 190,
            targetZones: {},
            tags: ['full-body', 'endurance'],
            difficulty: 'intermediate'
          }
        } as StationWorkout
      },
      {
        id: 'station-recovery',
        name: 'Active Recovery',
        equipment: WorkoutEquipmentType.ROPE_JUMP,
        capacity: 8,
        duration: 15,
        color: STATION_COLORS[3],
        position: { x: 3, y: 0 },
        workout: {
          type: 'rest',
          data: {
            id: 'active-recovery',
            name: 'Active Recovery',
            description: 'Light movement and stretching',
            duration: 900,
            type: 'active_recovery'
          }
        } as StationWorkout
      }
    ],
    groups: [
      {
        id: 'group-red',
        name: 'Red Group',
        players: [
          { id: 'player-1', name: 'Connor McDavid', number: 97, position: 'C' },
          { id: 'player-2', name: 'Leon Draisaitl', number: 29, position: 'C' },
          { id: 'player-3', name: 'Ryan Nugent-Hopkins', number: 93, position: 'C' },
          { id: 'player-4', name: 'Zach Hyman', number: 18, position: 'LW' },
          { id: 'player-5', name: 'Evander Kane', number: 91, position: 'LW' },
          { id: 'player-6', name: 'Ryan McLeod', number: 71, position: 'C' }
        ],
        color: GROUP_COLORS[0],
        startingStation: 'station-rowing',
        rotationOrder: ['station-rowing', 'station-bike', 'station-skierg', 'station-recovery']
      },
      {
        id: 'group-blue',
        name: 'Blue Group',
        players: [
          { id: 'player-7', name: 'Darnell Nurse', number: 25, position: 'D' },
          { id: 'player-8', name: 'Evan Bouchard', number: 2, position: 'D' },
          { id: 'player-9', name: 'Mattias Ekholm', number: 14, position: 'D' },
          { id: 'player-10', name: 'Brett Kulak', number: 27, position: 'D' },
          { id: 'player-11', name: 'Ty Emberson', number: 15, position: 'D' },
          { id: 'player-12', name: 'Troy Stecher', number: 3, position: 'D' }
        ],
        color: GROUP_COLORS[1],
        startingStation: 'station-bike',
        rotationOrder: ['station-bike', 'station-skierg', 'station-recovery', 'station-rowing']
      },
      {
        id: 'group-green',
        name: 'Green Group',
        players: [
          { id: 'player-13', name: 'Stuart Skinner', number: 74, position: 'G' },
          { id: 'player-14', name: 'Calvin Pickard', number: 30, position: 'G' },
          { id: 'player-15', name: 'Viktor Arvidsson', number: 33, position: 'RW' },
          { id: 'player-16', name: 'Jeff Skinner', number: 53, position: 'LW' },
          { id: 'player-17', name: 'Vasily Podkolzin', number: 92, position: 'RW' },
          { id: 'player-18', name: 'Corey Perry', number: 90, position: 'RW' }
        ],
        color: GROUP_COLORS[2],
        startingStation: 'station-skierg',
        rotationOrder: ['station-skierg', 'station-recovery', 'station-rowing', 'station-bike']
      },
      {
        id: 'group-yellow',
        name: 'Yellow Group',
        players: [
          { id: 'player-19', name: 'Adam Henrique', number: 14, position: 'C' },
          { id: 'player-20', name: 'Connor Brown', number: 28, position: 'RW' },
          { id: 'player-21', name: 'Derek Ryan', number: 10, position: 'C' },
          { id: 'player-22', name: 'Mattias Janmark', number: 13, position: 'LW' },
          { id: 'player-23', name: 'Sam Gagner', number: 89, position: 'C' },
          { id: 'player-24', name: 'Lane Pederson', number: 42, position: 'C' }
        ],
        color: GROUP_COLORS[3],
        startingStation: 'station-recovery',
        rotationOrder: ['station-recovery', 'station-rowing', 'station-bike', 'station-skierg']
      }
    ] as RotationGroup[],
    rotationDuration: 15, // 15 minutes per station
    transitionTime: 2, // 2 minutes between rotations
    totalDuration: 68, // 4 stations × 15 min + 3 transitions × 2 min
    rotationOrder: ['station-rowing', 'station-bike', 'station-skierg', 'station-recovery'],
    startTime: new Date(),
    strategy: 'sequential'
  };

  if (showExecution) {
    return (
      <EnhancedRotationExecutionView
        schedule={demoSchedule}
        onBack={() => setShowExecution(false)}
        onComplete={() => setShowExecution(false)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <RotateCcw className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">
            {t('physicalTrainer:rotation.integrationDemo')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('physicalTrainer:rotation.integrationDemoDescription')}
        </p>
      </div>

      {/* Integration Overview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration Architecture:</strong> The rotation system creates individual training sessions 
          for each station and uses the existing TrainingSessionViewer infrastructure for real-time monitoring. 
          No duplicate WebSocket code required!
        </AlertDescription>
      </Alert>

      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {demoSchedule.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoSchedule.stations.length}</div>
              <div className="text-sm text-muted-foreground">Stations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoSchedule.groups.length}</div>
              <div className="text-sm text-muted-foreground">Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {demoSchedule.groups.reduce((sum, group) => sum + group.players.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{demoSchedule.totalDuration}</div>
              <div className="text-sm text-muted-foreground">Total Minutes</div>
            </div>
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {demoSchedule.stations.map((station, index) => (
              <Card key={station.id} className="relative">
                <div 
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" 
                  style={{ backgroundColor: station.color }}
                />
                <CardHeader className="pb-2">
                  <div className="font-medium text-sm">{station.name}</div>
                  <Badge variant="outline" className="w-fit">
                    {station.equipment}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Capacity: {station.capacity} players</div>
                    <div>Duration: {station.duration} minutes</div>
                    <div>Type: {station.workout.type}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Groups */}
          <div className="space-y-3">
            <h4 className="font-medium">Player Groups</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoSchedule.groups.map(group => (
                <div key={group.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {group.players.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Starting at: {demoSchedule.stations.find(s => s.id === group.startingStation)?.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Players: {group.players.slice(0, 3).map(p => p.name).join(', ')}
                    {group.players.length > 3 && ` +${group.players.length - 3} more`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integration Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium">Reuses Existing Infrastructure</div>
                <div className="text-sm text-muted-foreground">
                  Leverages TrainingSessionViewer and WebSocket systems
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium">No Code Duplication</div>
                <div className="text-sm text-muted-foreground">
                  Single monitoring system for all workout types
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium">Rotation Context Aware</div>
                <div className="text-sm text-muted-foreground">
                  Shows station, group, and transition information
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <div className="font-medium">Seamless Transitions</div>
                <div className="text-sm text-muted-foreground">
                  Automatic session management during rotations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <div className="font-medium">RotationCoordinator</div>
                <div className="text-sm text-muted-foreground">
                  Creates individual training sessions for each station
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Session Integration</div>
                <div className="text-sm text-muted-foreground">
                  Converts station workouts to TrainingSessionViewer format
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Real-time Monitoring</div>
                <div className="text-sm text-muted-foregrounde">
                  Uses existing live session infrastructure
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <div className="font-medium">Transition Management</div>
                <div className="text-sm text-muted-foreground">
                  Coordinates group movements between stations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Launch Demo */}
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => setShowExecution(true)}
          className="flex items-center gap-2"
        >
          <Play className="h-5 w-5" />
          {t('physicalTrainer:rotation.launchDemo')}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Experience the full rotation execution with integrated monitoring
        </p>
      </div>
    </div>
  );
};