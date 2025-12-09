import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Clock, 
  Activity, 
  RotateCcw, 
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  SkipForward
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { TeamPlayerSelector } from '../shared/TeamPlayerSelector';
import { EquipmentCapacityBar } from '../shared/EquipmentCapacityBar';
import { createRotationGroups, generateRotationSummary } from '../../utils/rotationUtils';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

// Mock data for demo
const MOCK_PLAYERS = [
  { id: '1', name: 'Sidney Crosby', jerseyNumber: 87, position: 'Center', team: 'Pittsburgh Penguins', teamId: 'pit', wellness: { status: 'injured' as const } },
  { id: '2', name: 'Nathan MacKinnon', jerseyNumber: 29, position: 'Center', team: 'Colorado Avalanche', teamId: 'col', wellness: { status: 'limited' as const } },
  { id: '3', name: 'Connor McDavid', jerseyNumber: 97, position: 'Center', team: 'Edmonton Oilers', teamId: 'edm', wellness: { status: 'healthy' as const } },
  { id: '4', name: 'Leon Draisaitl', jerseyNumber: 25, position: 'Center', team: 'Edmonton Oilers', teamId: 'edm', wellness: { status: 'healthy' as const } },
  { id: '5', name: 'Auston Matthews', jerseyNumber: 34, position: 'Center', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '6', name: 'Mitch Marner', jerseyNumber: 16, position: 'Right Wing', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '7', name: 'William Nylander', jerseyNumber: 88, position: 'Right Wing', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '8', name: 'John Tavares', jerseyNumber: 91, position: 'Center', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '9', name: 'Morgan Rielly', jerseyNumber: 44, position: 'Defense', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '10', name: 'TJ Brodie', jerseyNumber: 78, position: 'Defense', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '11', name: 'Jake Muzzin', jerseyNumber: 8, position: 'Defense', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'limited' as const } },
  { id: '12', name: 'Timothy Liljegren', jerseyNumber: 37, position: 'Defense', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '13', name: 'David Kampf', jerseyNumber: 64, position: 'Center', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '14', name: 'Alexander Kerfoot', jerseyNumber: 15, position: 'Center', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '15', name: 'Pierre Engvall', jerseyNumber: 47, position: 'Center', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '16', name: 'Nick Robertson', jerseyNumber: 89, position: 'Left Wing', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '17', name: 'Ondrej Kase', jerseyNumber: 25, position: 'Right Wing', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '18', name: 'Michael Bunting', jerseyNumber: 58, position: 'Left Wing', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '19', name: 'Ilya Samsonov', jerseyNumber: 35, position: 'Goalie', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '20', name: 'Matt Murray', jerseyNumber: 30, position: 'Goalie', team: 'Toronto Maple Leafs', teamId: 'tor', wellness: { status: 'healthy' as const } },
  { id: '21', name: 'Cale Makar', jerseyNumber: 8, position: 'Defense', team: 'Colorado Avalanche', teamId: 'col', wellness: { status: 'healthy' as const } },
  { id: '22', name: 'Mikko Rantanen', jerseyNumber: 96, position: 'Right Wing', team: 'Colorado Avalanche', teamId: 'col', wellness: { status: 'healthy' as const } },
  { id: '23', name: 'Gabriel Landeskog', jerseyNumber: 92, position: 'Left Wing', team: 'Colorado Avalanche', teamId: 'col', wellness: { status: 'healthy' as const } },
  { id: '24', name: 'Devon Toews', jerseyNumber: 7, position: 'Defense', team: 'Colorado Avalanche', teamId: 'col', wellness: { status: 'healthy' as const } }
];

const MOCK_TEAMS = [
  { id: 'tor', name: 'Toronto Maple Leafs', players: MOCK_PLAYERS.filter(p => p.teamId === 'tor'), playerCount: 16 },
  { id: 'col', name: 'Colorado Avalanche', players: MOCK_PLAYERS.filter(p => p.teamId === 'col'), playerCount: 4 },
  { id: 'edm', name: 'Edmonton Oilers', players: MOCK_PLAYERS.filter(p => p.teamId === 'edm'), playerCount: 2 },
  { id: 'pit', name: 'Pittsburgh Penguins', players: MOCK_PLAYERS.filter(p => p.teamId === 'pit'), playerCount: 1 }
];

export const EquipmentRotationDemo: React.FC = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [equipmentType, setEquipmentType] = useState<WorkoutEquipmentType>(WorkoutEquipmentType.ROWING);
  const [equipmentCapacity, setEquipmentCapacity] = useState(6);
  const [simulationStep, setSimulationStep] = useState(0);
  
  // Calculate total selected players
  const totalSelectedPlayers = selectedPlayers.length + 
    selectedTeams.reduce((sum, teamId) => {
      const team = MOCK_TEAMS.find(t => t.id === teamId);
      return sum + (team?.playerCount || 0);
    }, 0);

  // Calculate rotation schedule
  const rotationSchedule = totalSelectedPlayers > equipmentCapacity 
    ? createRotationGroups(
        MOCK_PLAYERS,
        MOCK_TEAMS,
        selectedPlayers,
        selectedTeams,
        equipmentCapacity,
        equipmentType,
        {
          rotationDuration: 20,
          restBetweenRotations: 2,
          strategy: 'balance_groups',
          considerPlayerFitness: true
        }
      )
    : null;

  const handleCapacityExceeded = (selectedCount: number, maxCapacity: number) => {
    console.log(`Capacity exceeded: ${selectedCount} > ${maxCapacity}`);
  };

  const handleQuickSelect = (scenario: string) => {
    switch (scenario) {
      case 'small-team':
        setSelectedPlayers(['3', '4', '5', '6']);
        setSelectedTeams([]);
        break;
      case 'full-team':
        setSelectedPlayers([]);
        setSelectedTeams(['tor']);
        break;
      case 'multi-team':
        setSelectedPlayers([]);
        setSelectedTeams(['tor', 'col']);
        break;
      case 'mixed':
        setSelectedPlayers(['1', '2', '3']);
        setSelectedTeams(['edm']);
        break;
      default:
        setSelectedPlayers([]);
        setSelectedTeams([]);
    }
    setSimulationStep(0);
  };

  const renderRotationSimulation = () => {
    if (!rotationSchedule) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Rotation Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simulation Controls */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSimulationStep(Math.max(0, simulationStep - 1))}
              disabled={simulationStep === 0}
            >
              <Pause className="h-3 w-3 mr-1" />
              Previous
            </Button>
            <Button 
              size="sm"
              onClick={() => setSimulationStep(Math.min(rotationSchedule.groups.length - 1, simulationStep + 1))}
              disabled={simulationStep >= rotationSchedule.groups.length - 1}
            >
              <Play className="h-3 w-3 mr-1" />
              Next Group
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSimulationStep(rotationSchedule.groups.length - 1)}
            >
              <SkipForward className="h-3 w-3 mr-1" />
              End
            </Button>
            <Badge variant="secondary" className="ml-auto">
              Group {simulationStep + 1} of {rotationSchedule.groups.length}
            </Badge>
          </div>

          {/* Current Group Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {rotationSchedule.groups[simulationStep]?.name || 'Group'}
              </h4>
              <div className="space-y-2">
                {rotationSchedule.groups[simulationStep]?.players.map(player => (
                  <div key={player.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-8 h-6 text-xs">
                      #{player.jerseyNumber}
                    </Badge>
                    <span>{player.name}</span>
                    <span className="text-muted-foreground">- {player.position}</span>
                    {player.wellness?.status !== 'healthy' && (
                      <Badge variant={player.wellness?.status === 'injured' ? 'destructive' : 'warning'} className="text-xs">
                        {player.wellness?.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timing
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Start Time:</span>
                  <span>{rotationSchedule.groups[simulationStep]?.startTime || 0} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{rotationSchedule.groups[simulationStep]?.duration || 20} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>End Time:</span>
                  <span>{(rotationSchedule.groups[simulationStep]?.startTime || 0) + (rotationSchedule.groups[simulationStep]?.duration || 20)} minutes</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Session:</span>
                  <span>{rotationSchedule.totalDuration} minutes</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium">Session Timeline</h4>
            <div className="relative">
              <div className="flex h-8 rounded-lg overflow-hidden border">
                {rotationSchedule.groups.map((group, index) => (
                  <div
                    key={group.id}
                    className={cn(
                      "flex items-center justify-center text-xs font-medium transition-all",
                      index === simulationStep
                        ? "bg-blue-500 text-white"
                        : index < simulationStep
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    )}
                    style={{ width: `${(group.duration / rotationSchedule.totalDuration) * 100}%` }}
                  >
                    {group.name}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 min</span>
                <span>{rotationSchedule.totalDuration} min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Equipment Rotation System Demo</h1>
        <p className="text-muted-foreground">
          Demonstrates how the system automatically handles equipment capacity constraints through intelligent rotation groups.
        </p>
      </div>

      {/* Quick Scenario Buttons */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Quick Demo Scenarios</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => handleQuickSelect('small-team')}>
            Small Group (4 players)
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleQuickSelect('full-team')}>
            Full Team (16 players)
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleQuickSelect('multi-team')}>
            Multi-Team (20 players)
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleQuickSelect('mixed')}>
            Mixed Selection (5 players)
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleQuickSelect('clear')}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Equipment Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-medium mb-3">Equipment Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Equipment Type</label>
              <Select value={equipmentType} onValueChange={(value) => setEquipmentType(value as WorkoutEquipmentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Available Equipment</label>
              <Select value={equipmentCapacity.toString()} onValueChange={(value) => setEquipmentCapacity(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 4, 6, 8, 10, 12].map(capacity => (
                    <SelectItem key={capacity} value={capacity.toString()}>
                      {capacity} units
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-3">Current Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Selected Players:</span>
              <Badge variant="secondary">{totalSelectedPlayers}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Equipment Capacity:</span>
              <Badge variant="secondary">{equipmentCapacity}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              {totalSelectedPlayers <= equipmentCapacity ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  No Rotation Needed
                </Badge>
              ) : (
                <Badge variant="default" className="bg-orange-100 text-orange-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {Math.ceil(totalSelectedPlayers / equipmentCapacity)} Groups Required
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Equipment Capacity Bar */}
      <EquipmentCapacityBar
        equipmentType={equipmentType}
        totalCapacity={equipmentCapacity}
        usedCapacity={totalSelectedPlayers}
        availableCapacity={equipmentCapacity}
        variant="detailed"
        facilityName="Training Facility Demo"
      />

      {/* Player Selection */}
      <TeamPlayerSelector
        selectedPlayers={selectedPlayers}
        selectedTeams={selectedTeams}
        onPlayersChange={setSelectedPlayers}
        onTeamsChange={setSelectedTeams}
        equipmentCapacity={{
          equipmentType,
          totalCapacity: equipmentCapacity,
          availableCapacity: equipmentCapacity,
          facilityId: 'demo-facility'
        }}
        onCapacityExceeded={handleCapacityExceeded}
        customPlayers={MOCK_PLAYERS}
        customTeams={MOCK_TEAMS}
        showTeams={true}
        showMedical={true}
        showFilters={true}
        showSummary={true}
        title="Player & Team Selection"
        description="Select players or teams to see how the rotation system manages equipment constraints"
        inline={true}
        maxHeight={300}
      />

      {/* Rotation Schedule */}
      {rotationSchedule && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Rotation Required:</strong> {generateRotationSummary(rotationSchedule, {
              totalSessionTime: rotationSchedule.totalDuration + 5,
              workoutTime: 20,
              rotationTime: rotationSchedule.totalDuration,
              setupTime: 3,
              buffer: 2
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Rotation Simulation */}
      {renderRotationSimulation()}

      {/* Key Features */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Key Features Demonstrated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic capacity constraint detection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Intelligent group balancing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Medical status consideration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Visual capacity indicators</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Team-to-player flow enhancement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Real-time rotation suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Session timing calculations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Interactive rotation simulation</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};