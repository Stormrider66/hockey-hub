'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from './dnd-utils';
import { 
  Clock, Users, ArrowRight, RotateCw, Layout, Eye, 
  Download, Printer, Settings, Play, Pause, Volume2,
  VolumeX, Zap, Timer, MapPin, AlertTriangle
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  RotationSchedule, 
  RotationGroup, 
  WorkoutStation,
  RotationVisualization,
  RotationStrategy,
  RotationPrintConfig
} from '../../types/rotation.types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface RotationSchedulerProps {
  schedule: RotationSchedule;
  onUpdateSchedule: (updates: Partial<RotationSchedule> | ((prev: RotationSchedule) => RotationSchedule)) => void;
  visualization: RotationVisualization;
  onUpdateVisualization: (updates: Partial<RotationVisualization>) => void;
}

interface TimelineEntry {
  time: number; // Minutes from start
  groups: { group: RotationGroup; station: WorkoutStation }[];
  type: 'rotation' | 'transition' | 'start' | 'end';
  description: string;
}

export default function RotationScheduler({ 
  schedule, 
  onUpdateSchedule, 
  visualization, 
  onUpdateVisualization 
}: RotationSchedulerProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const [selectedLayout, setSelectedLayout] = useState<'timeline' | 'grid' | 'flow'>(visualization.layout === 'grid' ? 'grid' : 'timeline');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Generate timeline entries
  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    const { stations, groups, rotationDuration, transitionTime } = schedule;

    if (stations.length === 0 || groups.length === 0) return entries;

    // Start entry
    entries.push({
      time: 0,
      groups: groups.map(group => ({
        group,
        station: stations.find(s => s.id === group.startingStation) || stations[0]
      })),
      type: 'start',
      description: 'Session begins - Groups at starting stations'
    });

    // Generate rotations
    for (let rotation = 0; rotation < stations.length; rotation++) {
      const rotationStartTime = rotation * (rotationDuration + transitionTime);
      
      if (rotation > 0) {
        // Transition
        entries.push({
          time: rotationStartTime - transitionTime,
          groups: groups.map(group => {
            const currentStationIndex = stations.findIndex(s => s.id === group.startingStation);
            const nextStationIndex = (currentStationIndex + rotation) % stations.length;
            return {
              group,
              station: stations[nextStationIndex]
            };
          }),
          type: 'transition',
          description: `Transition to rotation ${rotation + 1}`
        });
      }

      // Rotation start
      entries.push({
        time: rotationStartTime + (rotation > 0 ? transitionTime : 0),
        groups: groups.map(group => {
          const currentStationIndex = stations.findIndex(s => s.id === group.startingStation);
          const nextStationIndex = (currentStationIndex + rotation) % stations.length;
          return {
            group,
            station: stations[nextStationIndex]
          };
        }),
        type: 'rotation',
        description: `Rotation ${rotation + 1} begins`
      });
    }

    // End entry
    const totalTime = (stations.length * rotationDuration) + ((stations.length - 1) * transitionTime);
    entries.push({
      time: totalTime,
      groups: [],
      type: 'end',
      description: 'Session complete'
    });

    return entries;
  }, [schedule]);

  // Current simulation state
  const currentEntry = useMemo(() => {
    if (!isSimulating) return null;
    return timeline.find((entry, index) => {
      const nextEntry = timeline[index + 1];
      return simulationTime >= entry.time && (!nextEntry || simulationTime < nextEntry.time);
    });
  }, [timeline, simulationTime, isSimulating]);

  // Handle drag and drop for group assignment
  const handleDragEnd = useCallback((result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'group-assignment') {
      // Moving group to different starting station
      const groupId = draggableId;
      const newStartingStation = destination.droppableId;

      onUpdateSchedule(prev => ({
        ...prev,
        groups: prev.groups.map(group =>
          group.id === groupId 
            ? { ...group, startingStation: newStartingStation }
            : group
        )
      }));

      toast.success('Group starting position updated');
    }
  }, [onUpdateSchedule]);

  // Strategy change handler
  const handleStrategyChange = useCallback((strategy: RotationStrategy) => {
    onUpdateSchedule({ strategy });
    
    // Automatically adjust group starting positions based on strategy
    if (strategy === 'sequential') {
      // Stagger groups across stations
      onUpdateSchedule(prev => ({
        ...prev,
        groups: prev.groups.map((group, index) => ({
          ...group,
          startingStation: prev.stations[index % prev.stations.length]?.id || prev.stations[0]?.id || ''
        }))
      }));
    } else if (strategy === 'staggered') {
      // Distribute groups more evenly
      onUpdateSchedule(prev => ({
        ...prev,
        groups: prev.groups.map((group, index) => {
          const stationIndex = Math.floor((index * prev.stations.length) / prev.groups.length);
          return {
            ...group,
            startingStation: prev.stations[stationIndex]?.id || prev.stations[0]?.id || ''
          };
        })
      }));
    }
  }, [onUpdateSchedule]);

  // Simulation controls
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationTime(0);
    
    const interval = setInterval(() => {
      setSimulationTime(prev => {
        const totalDuration = schedule.totalDuration;
        if (prev >= totalDuration) {
          setIsSimulating(false);
          clearInterval(interval);
          return totalDuration;
        }
        return prev + 0.1; // Increment by 0.1 minutes (6 seconds)
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [schedule.totalDuration]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulationTime(0);
  }, []);

  // Print/Export handlers
  const handlePrint = useCallback(() => {
    const printConfig: RotationPrintConfig = {
      includePlayerNames: true,
      includeInstructions: true,
      includeTimeline: true,
      includeNotes: true,
      groupByStation: false,
      groupByTime: true,
      format: 'schedule',
      orientation: 'landscape',
      fontSize: 'medium'
    };

    // Generate print content
    let printContent = `
      <html>
        <head>
          <title>${schedule.name} - Rotation Schedule</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .timeline { margin-bottom: 30px; }
            .timeline-entry { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
            .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .group { border: 1px solid #ddd; padding: 15px; }
            .station { background-color: #f5f5f5; padding: 10px; margin: 5px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schedule.name}</h1>
            <p>Total Duration: ${schedule.totalDuration} minutes | ${schedule.stations.length} stations | ${schedule.groups.length} groups</p>
          </div>
          
          <div class="timeline">
            <h2>Schedule Timeline</h2>
            ${timeline.map(entry => `
              <div class="timeline-entry">
                <h3>${Math.floor(entry.time)}:${String(Math.round((entry.time % 1) * 60)).padStart(2, '0')} - ${entry.description}</h3>
                ${entry.groups.length > 0 ? `
                  <div class="groups">
                    ${entry.groups.map(({ group, station }) => `
                      <div class="group">
                        <h4>${group.name} (${group.players.length} players)</h4>
                        <div class="station">${station.name} - ${EQUIPMENT_CONFIGS[station.equipment].label}</div>
                        ${printConfig.includePlayerNames ? `
                          <ul>
                            ${group.players.map(player => `<li>${player.name} #${player.jerseyNumber}</li>`).join('')}
                          </ul>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="groups">
            <h2>Station Details</h2>
            ${schedule.stations.map(station => `
              <div class="group">
                <h3>${station.name}</h3>
                <p><strong>Equipment:</strong> ${EQUIPMENT_CONFIGS[station.equipment].label}</p>
                <p><strong>Capacity:</strong> ${station.capacity} players</p>
                <p><strong>Duration:</strong> ${station.duration} minutes</p>
                ${station.notes ? `<p><strong>Notes:</strong> ${station.notes}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [schedule, timeline]);

  const formatTime = useCallback((minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes % 1) * 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  if (schedule.stations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Add stations to create a rotation schedule</p>
        </div>
      </div>
    );
  }

  if (schedule.groups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Add groups to create a rotation schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Strategy</label>
              <Select value={schedule.strategy} onValueChange={handleStrategyChange}>
                <SelectTrigger className="w-40 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Sequential
                    </div>
                  </SelectItem>
                  <SelectItem value="staggered">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Staggered
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Custom
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">View</label>
              <Select value={selectedLayout} onValueChange={(value: any) => setSelectedLayout(value)}>
                <SelectTrigger className="w-32 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="flow">Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={visualization.soundEnabled ? "default" : "outline"}
                onClick={() => onUpdateVisualization({ soundEnabled: !visualization.soundEnabled })}
              >
                {visualization.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateVisualization({ animateTransitions: !visualization.animateTransitions })}
              >
                <Layout className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            {!isSimulating ? (
              <Button size="sm" onClick={startSimulation}>
                <Play className="h-4 w-4 mr-1" />
                Simulate
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={stopSimulation}>
                <Pause className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Schedule Summary */}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{schedule.totalDuration} min total</span>
          </div>
          <div className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            <span>{schedule.rotationDuration} min per rotation</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="h-4 w-4" />
            <span>{schedule.transitionTime} min transitions</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCw className="h-4 w-4" />
            <span>{schedule.stations.length} rotations</span>
          </div>
        </div>

        {/* Simulation Progress */}
        {isSimulating && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                Simulation: {formatTime(simulationTime)} / {formatTime(schedule.totalDuration)}
              </span>
              <span className="text-sm text-blue-600">
                {Math.round((simulationTime / schedule.totalDuration) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min((simulationTime / schedule.totalDuration) * 100, 100)}%` }}
              />
            </div>
            {currentEntry && (
              <p className="text-sm text-blue-600 mt-2">{currentEntry.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
          {selectedLayout === 'timeline' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6 space-y-6">
                {timeline.map((entry, index) => (
                  <Card 
                    key={index}
                    className={cn(
                      "transition-all",
                      isSimulating && currentEntry === entry && "ring-2 ring-blue-500 bg-blue-50"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={entry.type === 'rotation' ? 'default' : 'secondary'}
                            className={cn(
                              entry.type === 'start' && "bg-green-100 text-green-700",
                              entry.type === 'end' && "bg-red-100 text-red-700",
                              entry.type === 'transition' && "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(entry.time)}
                          </Badge>
                          <CardTitle className="text-base">{entry.description}</CardTitle>
                        </div>
                        {entry.type === 'rotation' && (
                          <Badge variant="outline">
                            {entry.groups.length} groups active
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    {entry.groups.length > 0 && (
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {entry.groups.map(({ group, station }) => (
                            <Droppable key={`${group.id}-${station.id}`} droppableId={station.id} type="group-assignment">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all",
                                    snapshot.isDraggingOver 
                                      ? "border-orange-500 bg-orange-50" 
                                      : "border-gray-200 bg-gray-50"
                                  )}
                                  style={{ backgroundColor: station.color }}
                                >
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        {station.name}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {EQUIPMENT_CONFIGS[station.equipment].icon}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {station.capacity} capacity • {station.duration}min
                                    </p>
                                  </div>

                                  <Draggable draggableId={group.id} index={0} type="group-assignment">
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "p-3 rounded-lg border bg-white transition-all cursor-move",
                                          snapshot.isDragging && "shadow-lg rotate-2"
                                        )}
                                        style={{ 
                                          ...provided.draggableProps.style,
                                          borderColor: group.color
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-3 h-3 rounded-full" 
                                              style={{ backgroundColor: group.color }}
                                            />
                                            <span className="font-medium text-sm">{group.name}</span>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            <Users className="h-3 w-3 mr-1" />
                                            {group.players.length}
                                          </Badge>
                                        </div>
                                        
                                        {visualization.showPlayerNames && group.players.length <= 6 && (
                                          <div className="text-xs text-gray-600 space-y-1">
                                            {group.players.slice(0, 4).map(player => (
                                              <div key={player.id} className="flex items-center justify-between">
                                                <span>{player.name}</span>
                                                <span>#{player.jerseyNumber}</span>
                                              </div>
                                            ))}
                                            {group.players.length > 4 && (
                                              <div className="text-center text-gray-400">
                                                +{group.players.length - 4} more
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedLayout === 'grid' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {schedule.stations.map((station) => (
                  <Card key={station.id} style={{ backgroundColor: station.color }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{station.name}</CardTitle>
                        <Badge variant="secondary">
                          {EQUIPMENT_CONFIGS[station.equipment].icon}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {station.capacity} capacity • {station.duration}min
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId={station.id} type="group-assignment">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "min-h-32 p-3 rounded-lg border-2 border-dashed transition-all",
                              snapshot.isDraggingOver 
                                ? "border-orange-500 bg-orange-50" 
                                : "border-gray-300 bg-white/50"
                            )}
                          >
                            {schedule.groups
                              .filter(group => group.startingStation === station.id)
                              .map((group, index) => (
                                <Draggable key={group.id} draggableId={group.id} index={index} type="group-assignment">
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={cn(
                                        "mb-2 p-2 rounded bg-white border transition-all cursor-move",
                                        snapshot.isDragging && "shadow-lg"
                                      )}
                                      style={{ 
                                        ...provided.draggableProps.style,
                                        borderColor: group.color
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-2 h-2 rounded-full" 
                                            style={{ backgroundColor: group.color }}
                                          />
                                          <span className="text-sm font-medium">{group.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {group.players.length}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                            
                            {schedule.groups.filter(group => group.startingStation === station.id).length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-4">
                                Drag groups here
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedLayout === 'flow' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="space-y-8">
                  {schedule.groups.map((group, groupIndex) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: group.color }}
                          />
                          <CardTitle>{group.name}</CardTitle>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {group.players.length} players
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {schedule.stations.map((station, stationIndex) => {
                            const isActive = isSimulating && currentEntry?.groups.some(
                              ({ group: g, station: s }) => g.id === group.id && s.id === station.id
                            );
                            
                            return (
                              <React.Fragment key={station.id}>
                                <div 
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all min-w-32 text-center",
                                    isActive 
                                      ? "border-blue-500 bg-blue-50 scale-105" 
                                      : "border-gray-200 bg-gray-50"
                                  )}
                                  style={{ backgroundColor: isActive ? undefined : station.color }}
                                >
                                  <div className="text-sm font-medium mb-1">{station.name}</div>
                                  <div className="text-xs text-gray-600">
                                    {EQUIPMENT_CONFIGS[station.equipment].icon} {station.duration}min
                                  </div>
                                  {isActive && (
                                    <Badge className="mt-2 text-xs">Current</Badge>
                                  )}
                                </div>
                                {stationIndex < schedule.stations.length - 1 && (
                                  <ArrowRight className="h-5 w-5 text-gray-400" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}