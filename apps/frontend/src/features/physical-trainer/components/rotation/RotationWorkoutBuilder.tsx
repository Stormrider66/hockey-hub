'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from './dnd-utils';
import { 
  Plus, Trash2, Settings, Users, Clock, RotateCw, 
  Save, X, Eye, Layout, AlertTriangle, CheckCircle,
  Copy, Download, Printer, Timer, MapPin
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  RotationSchedule, 
  WorkoutStation, 
  RotationGroup, 
  RotationPreset,
  RotationValidation,
  RotationVisualization,
  AutoGroupOptions
} from '../../types/rotation.types';
import { ROTATION_PRESETS, GROUP_COLORS, STATION_COLORS } from '../../types/rotation.types';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../../types/conditioning.types';
import type { PlayerData } from '../shared/TeamPlayerSelector';

import WorkoutStation from './WorkoutStation';
import RotationScheduler from './RotationScheduler';
import GroupManagement from './GroupManagement';
import RotationExecutionView from './RotationExecutionView';

interface RotationWorkoutBuilderProps {
  onSave: (schedule: RotationSchedule) => void;
  onCancel: () => void;
  initialData?: RotationSchedule;
  availablePlayers: PlayerData[];
  isLoading?: boolean;
}

export default function RotationWorkoutBuilder({
  onSave,
  onCancel,
  initialData,
  availablePlayers = [],
  isLoading = false
}: RotationWorkoutBuilderProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Main Schedule State
  const [schedule, setSchedule] = useState<RotationSchedule>(
    initialData || {
      id: `rotation-${Date.now()}`,
      name: 'Multi-Station Workout',
      stations: [],
      groups: [],
      rotationDuration: 15,
      transitionTime: 2,
      totalDuration: 0,
      rotationOrder: [],
      startTime: new Date(),
      strategy: 'sequential'
    }
  );

  // UI State
  const [activeTab, setActiveTab] = useState<'stations' | 'groups' | 'schedule' | 'preview' | 'execution'>('stations');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [visualization, setVisualization] = useState<RotationVisualization>({
    layout: 'grid',
    showPlayerNames: true,
    showTimers: true,
    showProgress: true,
    colorScheme: 'default',
    animateTransitions: true,
    soundEnabled: true,
    alertVolume: 70
  });

  // Validation
  const validation = useMemo<RotationValidation>(() => {
    const errors: any[] = [];
    const warnings: any[] = [];
    const recommendations: any[] = [];

    // Basic validation
    if (!schedule.name.trim()) {
      errors.push({ field: 'name', message: 'Schedule name is required', severity: 'error' });
    }

    if (schedule.stations.length < 2) {
      errors.push({ field: 'stations', message: 'At least 2 stations are required for rotation', severity: 'error' });
    }

    if (schedule.groups.length === 0) {
      errors.push({ field: 'groups', message: 'At least one group is required', severity: 'error' });
    }

    // Station validation
    schedule.stations.forEach((station, index) => {
      if (!station.name.trim()) {
        errors.push({ field: `station-${index}`, message: `Station ${index + 1} name is required`, severity: 'error' });
      }
      if (station.capacity <= 0) {
        errors.push({ field: `station-${index}`, message: `Station ${index + 1} must have capacity > 0`, severity: 'error' });
      }
    });

    // Group validation
    schedule.groups.forEach((group, index) => {
      if (group.players.length === 0) {
        warnings.push({ field: `group-${index}`, message: `Group ${index + 1} has no players assigned` });
      }
      if (group.players.length === 1) {
        warnings.push({ field: `group-${index}`, message: `Group ${index + 1} has only one player - consider combining groups` });
      }
    });

    // Capacity validation
    const totalStationCapacity = schedule.stations.reduce((sum, station) => sum + station.capacity, 0);
    const totalPlayers = schedule.groups.reduce((sum, group) => sum + group.players.length, 0);
    
    if (totalPlayers > totalStationCapacity) {
      warnings.push({ 
        field: 'capacity', 
        message: `Total players (${totalPlayers}) exceed total station capacity (${totalStationCapacity})` 
      });
    }

    // Balance recommendations
    if (schedule.stations.length > 0 && schedule.groups.length > 0) {
      const avgPlayersPerGroup = totalPlayers / schedule.groups.length;
      const avgStationCapacity = totalStationCapacity / schedule.stations.length;
      
      if (Math.abs(avgPlayersPerGroup - avgStationCapacity) > 2) {
        recommendations.push({
          type: 'optimization',
          message: 'Consider balancing group sizes with station capacities for optimal flow',
          action: 'Auto-balance groups'
        });
      }
    }

    // Duration recommendations
    if (schedule.rotationDuration > 20) {
      recommendations.push({
        type: 'engagement',
        message: 'Consider shorter rotations (15-20 min) to maintain player engagement',
        action: 'Reduce rotation duration'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }, [schedule]);

  // Calculate total duration
  React.useEffect(() => {
    const rotations = schedule.stations.length > 0 ? schedule.stations.length : 1;
    const workoutTime = rotations * schedule.rotationDuration;
    const transitionTime = (rotations - 1) * schedule.transitionTime;
    const setupTime = 5; // Setup buffer
    
    setSchedule(prev => ({
      ...prev,
      totalDuration: workoutTime + transitionTime + setupTime
    }));
  }, [schedule.rotationDuration, schedule.transitionTime, schedule.stations.length]);

  // Station Management
  const addStation = useCallback(() => {
    const newStation: WorkoutStation = {
      id: `station-${Date.now()}`,
      name: `Station ${schedule.stations.length + 1}`,
      equipment: WorkoutEquipmentType.ROWING,
      capacity: 6,
      workout: {
        type: 'intervals',
        data: {
          id: `workout-${Date.now()}`,
          name: 'Default Conditioning',
          description: 'Basic interval workout',
          equipment: WorkoutEquipmentType.ROWING,
          intervals: [],
          totalDuration: schedule.rotationDuration * 60,
          tags: ['conditioning'],
          difficulty: 'intermediate'
        }
      },
      duration: schedule.rotationDuration,
      color: STATION_COLORS[schedule.stations.length % STATION_COLORS.length],
      position: { x: 0, y: 0 }
    };

    setSchedule(prev => ({
      ...prev,
      stations: [...prev.stations, newStation],
      rotationOrder: [...prev.rotationOrder, newStation.id]
    }));

    setSelectedStationId(newStation.id);
  }, [schedule.stations.length, schedule.rotationDuration]);

  const updateStation = useCallback((stationId: string, updates: Partial<WorkoutStation>) => {
    setSchedule(prev => ({
      ...prev,
      stations: prev.stations.map(station =>
        station.id === stationId ? { ...station, ...updates } : station
      )
    }));
  }, []);

  const removeStation = useCallback((stationId: string) => {
    setSchedule(prev => ({
      ...prev,
      stations: prev.stations.filter(station => station.id !== stationId),
      rotationOrder: prev.rotationOrder.filter(id => id !== stationId),
      groups: prev.groups.map(group => ({
        ...group,
        startingStation: group.startingStation === stationId ? '' : group.startingStation,
        rotationOrder: group.rotationOrder.filter(id => id !== stationId)
      }))
    }));

    if (selectedStationId === stationId) {
      setSelectedStationId(null);
    }
  }, [selectedStationId]);

  // Group Management
  const addGroup = useCallback(() => {
    const newGroup: RotationGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${schedule.groups.length + 1}`,
      players: [],
      color: GROUP_COLORS[schedule.groups.length % GROUP_COLORS.length],
      startingStation: schedule.stations[0]?.id || '',
      rotationOrder: schedule.rotationOrder
    };

    setSchedule(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));

    setSelectedGroupId(newGroup.id);
  }, [schedule.groups.length, schedule.stations, schedule.rotationOrder]);

  const updateGroup = useCallback((groupId: string, updates: Partial<RotationGroup>) => {
    setSchedule(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    }));
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setSchedule(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId)
    }));

    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  }, [selectedGroupId]);

  // Auto-group players
  const autoGroupPlayers = useCallback((options: AutoGroupOptions) => {
    const { strategy, minGroupSize, maxGroupSize, enforceEqualSizes } = options;
    const allPlayers = [...availablePlayers];
    
    // Filter based on medical status if required
    const filteredPlayers = options.considerMedicalStatus 
      ? allPlayers.filter(player => player.wellness?.status !== 'injured')
      : allPlayers;

    const targetGroupCount = Math.max(1, Math.ceil(filteredPlayers.length / maxGroupSize));
    const newGroups: RotationGroup[] = [];

    // Create empty groups
    for (let i = 0; i < targetGroupCount; i++) {
      newGroups.push({
        id: `group-${Date.now()}-${i}`,
        name: `Group ${i + 1}`,
        players: [],
        color: GROUP_COLORS[i % GROUP_COLORS.length],
        startingStation: schedule.stations[i % schedule.stations.length]?.id || '',
        rotationOrder: schedule.rotationOrder
      });
    }

    // Distribute players based on strategy
    switch (strategy) {
      case 'balanced':
        filteredPlayers.forEach((player, index) => {
          const groupIndex = index % targetGroupCount;
          newGroups[groupIndex].players.push(player);
        });
        break;

      case 'skill_based':
        // Sort by wellness status and distribute
        const sortedPlayers = [...filteredPlayers].sort((a, b) => {
          const statusOrder = { healthy: 3, limited: 2, injured: 1, unavailable: 0 };
          const aStatus = statusOrder[a.wellness?.status as keyof typeof statusOrder] || 3;
          const bStatus = statusOrder[b.wellness?.status as keyof typeof statusOrder] || 3;
          return bStatus - aStatus;
        });
        sortedPlayers.forEach((player, index) => {
          const groupIndex = index % targetGroupCount;
          newGroups[groupIndex].players.push(player);
        });
        break;

      case 'position_based':
        // Group by position
        const positions = ['Forward', 'Defense', 'Goalie'];
        const playersByPosition = positions.reduce((acc, pos) => {
          acc[pos] = filteredPlayers.filter(p => p.position?.includes(pos));
          return acc;
        }, {} as Record<string, PlayerData[]>);

        // Distribute positions evenly
        positions.forEach(position => {
          const positionPlayers = playersByPosition[position];
          positionPlayers.forEach((player, index) => {
            const groupIndex = index % targetGroupCount;
            newGroups[groupIndex].players.push(player);
          });
        });
        break;

      case 'random':
        const shuffled = [...filteredPlayers].sort(() => Math.random() - 0.5);
        shuffled.forEach((player, index) => {
          const groupIndex = index % targetGroupCount;
          newGroups[groupIndex].players.push(player);
        });
        break;
    }

    // Filter out empty groups
    const validGroups = newGroups.filter(group => group.players.length >= minGroupSize);

    setSchedule(prev => ({
      ...prev,
      groups: validGroups
    }));

    toast.success(`Created ${validGroups.length} groups using ${strategy} strategy`);
  }, [availablePlayers, schedule.stations, schedule.rotationOrder]);

  // Preset Management
  const applyPreset = useCallback((preset: RotationPreset) => {
    // Create stations based on preset
    const newStations: WorkoutStation[] = preset.equipmentTypes.slice(0, preset.stationCount).map((equipment, index) => ({
      id: `station-${Date.now()}-${index}`,
      name: `${EQUIPMENT_CONFIGS[equipment].label} Station`,
      equipment,
      capacity: Math.ceil(24 / preset.stationCount), // Assume 24 players max
      workout: {
        type: 'intervals',
        data: {
          id: `workout-${Date.now()}-${index}`,
          name: `${EQUIPMENT_CONFIGS[equipment].label} Intervals`,
          description: `${preset.rotationDuration}-minute ${EQUIPMENT_CONFIGS[equipment].label.toLowerCase()} workout`,
          equipment,
          intervals: [],
          totalDuration: preset.rotationDuration * 60,
          tags: ['conditioning', equipment.toLowerCase()],
          difficulty: 'intermediate'
        }
      },
      duration: preset.rotationDuration,
      color: STATION_COLORS[index % STATION_COLORS.length],
      position: { x: index * 200, y: 0 }
    }));

    setSchedule(prev => ({
      ...prev,
      name: preset.name,
      stations: newStations,
      groups: [], // Clear existing groups
      rotationDuration: preset.rotationDuration,
      transitionTime: preset.transitionTime,
      rotationOrder: newStations.map(s => s.id),
      strategy: preset.strategy
    }));

    setShowPresets(false);
    toast.success(`Applied "${preset.name}" preset`);
  }, []);

  // Save Handler
  const handleSave = useCallback(() => {
    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Final validation
    if (schedule.groups.length === 0) {
      toast.error('At least one group is required');
      return;
    }

    if (schedule.stations.length < 2) {
      toast.error('At least 2 stations are required for rotation');
      return;
    }

    onSave(schedule);
  }, [schedule, validation.isValid, onSave]);

  // Drag and Drop Handler
  const handleDragEnd = useCallback((result: any) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (type === 'station') {
      // Reorder stations
      const newStations = Array.from(schedule.stations);
      const [reorderedStation] = newStations.splice(source.index, 1);
      newStations.splice(destination.index, 0, reorderedStation);

      setSchedule(prev => ({
        ...prev,
        stations: newStations,
        rotationOrder: newStations.map(s => s.id)
      }));
    }
  }, [schedule.stations]);

  const selectedStation = selectedStationId ? schedule.stations.find(s => s.id === selectedStationId) : null;
  const selectedGroup = selectedGroupId ? schedule.groups.find(g => g.id === selectedGroupId) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-orange-600" />
              <h1 className="text-xl font-semibold">Multi-Station Rotation Builder</h1>
            </div>
            <Badge variant={validation.isValid ? "default" : "destructive"}>
              {validation.errors.length} errors, {validation.warnings.length} warnings
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPresets(true)}>
              <Layout className="h-4 w-4 mr-2" />
              Presets
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!validation.isValid || isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Label htmlFor="schedule-name">Schedule Name</Label>
            <Input
              id="schedule-name"
              value={schedule.name}
              onChange={(e) => setSchedule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter schedule name..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="rotation-duration">Rotation Duration (min)</Label>
            <Input
              id="rotation-duration"
              type="number"
              min="5"
              max="30"
              value={schedule.rotationDuration}
              onChange={(e) => setSchedule(prev => ({ ...prev, rotationDuration: parseInt(e.target.value) || 15 }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="transition-time">Transition Time (min)</Label>
            <Input
              id="transition-time"
              type="number"
              min="1"
              max="10"
              value={schedule.transitionTime}
              onChange={(e) => setSchedule(prev => ({ ...prev, transitionTime: parseInt(e.target.value) || 2 }))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{schedule.stations.length} stations</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{schedule.groups.reduce((sum, g) => sum + g.players.length, 0)} players in {schedule.groups.length} groups</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{schedule.totalDuration} min total</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            <span>{schedule.rotationDuration} min per station</span>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="border-b bg-yellow-50 p-4">
          {validation.errors.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                Errors ({validation.errors.length})
              </div>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                Warnings ({validation.warnings.length})
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
          <TabsList className="border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="stations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Stations ({schedule.stations.length})
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Groups ({schedule.groups.length})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Preview
            </TabsTrigger>
            <TabsTrigger value="execution" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500">
              Execution
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="stations" className="mt-0 h-full">
              <div className="h-full flex">
                {/* Station List */}
                <div className="w-80 border-r bg-gray-50 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Stations</h3>
                      <Button size="sm" onClick={addStation}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="stations" type="station">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {schedule.stations.map((station, index) => (
                              <Draggable key={station.id} draggableId={station.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "p-3 rounded-lg border cursor-pointer transition-all",
                                      selectedStationId === station.id 
                                        ? "border-orange-500 bg-orange-50" 
                                        : "border-gray-200 bg-white hover:border-gray-300",
                                      snapshot.isDragging && "shadow-lg"
                                    )}
                                    onClick={() => setSelectedStationId(station.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: station.color }}
                                        />
                                        <span className="font-medium text-sm">{station.name}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeStation(station.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <span>{EQUIPMENT_CONFIGS[station.equipment].icon}</span>
                                        <span>{EQUIPMENT_CONFIGS[station.equipment].label}</span>
                                      </div>
                                      <div className="mt-1">
                                        Capacity: {station.capacity} • {station.duration}min
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>

                {/* Station Editor */}
                <div className="flex-1 overflow-y-auto">
                  {selectedStation ? (
                    <WorkoutStation
                      station={selectedStation}
                      onUpdate={(updates) => updateStation(selectedStation.id, updates)}
                      onClose={() => setSelectedStationId(null)}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a station to configure</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-0 h-full">
              <GroupManagement
                groups={schedule.groups}
                availablePlayers={availablePlayers}
                stations={schedule.stations}
                onUpdateGroup={updateGroup}
                onAddGroup={addGroup}
                onRemoveGroup={removeGroup}
                onAutoGroup={autoGroupPlayers}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 h-full">
              <RotationScheduler
                schedule={schedule}
                onUpdateSchedule={setSchedule}
                visualization={visualization}
                onUpdateVisualization={setVisualization}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0 h-full overflow-y-auto">
              <div className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{schedule.name}</h2>
                    <p className="text-muted-foreground mt-2">
                      {schedule.totalDuration} minute rotation workout with {schedule.stations.length} stations
                    </p>
                  </div>

                  {schedule.stations.map((station, index) => (
                    <Card key={station.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: station.color }}
                            />
                            <CardTitle className="text-lg">{station.name}</CardTitle>
                            <Badge variant="secondary">
                              {EQUIPMENT_CONFIGS[station.equipment].icon} {EQUIPMENT_CONFIGS[station.equipment].label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {station.duration} minutes • {station.capacity} players max
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {station.workout.type === 'intervals' && 'Interval training workout'}
                          {station.workout.type === 'strength' && 'Strength training workout'}
                          {station.workout.type === 'freeform' && 'Freeform workout'}
                          {station.workout.type === 'rest' && 'Active recovery station'}
                        </div>
                        {station.notes && (
                          <p className="mt-2 text-sm">{station.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Group Assignments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {schedule.groups.map((group) => (
                        <Card key={group.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: group.color }}
                              />
                              <CardTitle className="text-base">{group.name}</CardTitle>
                              <Badge variant="outline">{group.players.length} players</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {group.players.map((player) => (
                                <div key={player.id} className="flex items-center justify-between text-sm">
                                  <span>{player.name}</span>
                                  <span className="text-muted-foreground">#{player.jerseyNumber}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="execution" className="mt-0 h-full">
              <RotationExecutionView
                schedule={schedule}
                visualization={visualization}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rotation Presets</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPresets(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROTATION_PRESETS.map((preset) => (
                  <Card key={preset.id} className="cursor-pointer hover:bg-gray-50" onClick={() => applyPreset(preset)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <Badge variant="outline">{preset.stationCount} stations</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{preset.rotationDuration}min per station</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Groups:</span>
                          <span>{preset.groupCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Strategy:</span>
                          <span className="capitalize">{preset.strategy}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {preset.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}