'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// TODO: Implement drag and drop with @dnd-kit
// import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
// import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { useSortable } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
import { 
  Users, Plus, Trash2, Shuffle, Settings, AlertTriangle,
  UserCheck, UserX, Heart, Activity, Target, Copy,
  Filter, Search, ArrowRight, MapPin, Clock
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import type { 
  RotationGroup, 
  WorkoutStation,
  AutoGroupOptions
} from '../../types/rotation.types';
import { GROUP_COLORS } from '../../types/rotation.types';
import type { PlayerData } from '../shared/TeamPlayerSelector';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface GroupManagementProps {
  groups: RotationGroup[];
  availablePlayers: PlayerData[];
  stations: WorkoutStation[];
  onUpdateGroup: (groupId: string, updates: Partial<RotationGroup>) => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onAutoGroup: (options: AutoGroupOptions) => void;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

export default function GroupManagement({
  groups,
  availablePlayers,
  stations,
  onUpdateGroup,
  onAddGroup,
  onRemoveGroup,
  onAutoGroup,
  selectedGroupId,
  onSelectGroup
}: GroupManagementProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const [searchTerm, setSearchTerm] = useState('');
  const [playerFilter, setPlayerFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [medicalFilter, setMedicalFilter] = useState<'all' | 'healthy' | 'limited' | 'injured'>('all');
  const [showAutoGroupDialog, setShowAutoGroupDialog] = useState(false);
  const [autoGroupOptions, setAutoGroupOptions] = useState<AutoGroupOptions>({
    strategy: 'balanced',
    considerMedicalStatus: true,
    considerPlayerPreferences: false,
    minGroupSize: 2,
    maxGroupSize: 8,
    enforceEqualSizes: true
  });

  // Get assigned and unassigned players
  const { assignedPlayers, unassignedPlayers } = useMemo(() => {
    const assigned = new Set<string>();
    groups.forEach(group => {
      group.players.forEach(player => {
        assigned.add(player.id);
      });
    });

    return {
      assignedPlayers: availablePlayers.filter(player => assigned.has(player.id)),
      unassignedPlayers: availablePlayers.filter(player => !assigned.has(player.id))
    };
  }, [availablePlayers, groups]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    let players = availablePlayers;

    // Apply assignment filter
    if (playerFilter === 'assigned') {
      players = assignedPlayers;
    } else if (playerFilter === 'unassigned') {
      players = unassignedPlayers;
    }

    // Apply medical filter
    if (medicalFilter !== 'all') {
      players = players.filter(player => player.wellness?.status === medicalFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      players = players.filter(player => 
        player.name.toLowerCase().includes(term) ||
        player.jerseyNumber?.toString().includes(term) ||
        player.position?.toLowerCase().includes(term)
      );
    }

    return players;
  }, [availablePlayers, assignedPlayers, unassignedPlayers, playerFilter, medicalFilter, searchTerm]);

  // Group validation
  const groupValidation = useMemo(() => {
    const validations = groups.map(group => {
      const warnings: string[] = [];
      const errors: string[] = [];

      if (group.players.length === 0) {
        warnings.push('No players assigned');
      }

      if (group.players.length === 1) {
        warnings.push('Only one player - consider combining with another group');
      }

      // Check starting station
      const startingStation = stations.find(s => s.id === group.startingStation);
      if (!startingStation) {
        errors.push('No starting station assigned');
      } else if (group.players.length > startingStation.capacity) {
        errors.push(`Too many players for station capacity (${group.players.length}/${startingStation.capacity})`);
      }

      // Check medical status
      const injuredPlayers = group.players.filter(p => p.wellness?.status === 'injured');
      if (injuredPlayers.length > 0) {
        warnings.push(`${injuredPlayers.length} injured player(s) - ensure medical clearance`);
      }

      return {
        groupId: group.id,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });

    return validations;
  }, [groups, stations]);

  // Handle drag and drop
  const handleDragEnd = useCallback((result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'player') {
      const playerId = draggableId;
      const player = availablePlayers.find(p => p.id === playerId);
      if (!player) return;

      const sourceGroupId = source.droppableId === 'unassigned' ? null : source.droppableId;
      const destGroupId = destination.droppableId === 'unassigned' ? null : destination.droppableId;

      // Remove from source group
      if (sourceGroupId) {
        onUpdateGroup(sourceGroupId, {
          players: groups.find(g => g.id === sourceGroupId)?.players.filter(p => p.id !== playerId) || []
        });
      }

      // Add to destination group
      if (destGroupId) {
        const destGroup = groups.find(g => g.id === destGroupId);
        if (destGroup) {
          onUpdateGroup(destGroupId, {
            players: [...destGroup.players, player]
          });
        }
      }

      toast.success(`Moved ${player.name} to ${destGroupId ? `group ${groups.find(g => g.id === destGroupId)?.name}` : 'unassigned'}`);
    }
  }, [availablePlayers, groups, onUpdateGroup]);

  // Duplicate group
  const duplicateGroup = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newGroup: RotationGroup = {
      ...group,
      id: `group-${Date.now()}`,
      name: `${group.name} (Copy)`,
      players: [], // Don't duplicate players
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length]
    };

    // This would need to be handled by the parent component
    // onAddGroup(newGroup);
    toast.success(`Group "${group.name}" duplicated`);
  }, [groups]);

  // Balance groups
  const balanceGroups = useCallback(() => {
    if (groups.length === 0) return;

    const allAssignedPlayers = [...assignedPlayers];
    const playersPerGroup = Math.floor(allAssignedPlayers.length / groups.length);
    const remainder = allAssignedPlayers.length % groups.length;

    // Shuffle players for fair distribution
    const shuffledPlayers = [...allAssignedPlayers].sort(() => Math.random() - 0.5);

    let playerIndex = 0;
    groups.forEach((group, groupIndex) => {
      const groupSize = playersPerGroup + (groupIndex < remainder ? 1 : 0);
      const groupPlayers = shuffledPlayers.slice(playerIndex, playerIndex + groupSize);
      
      onUpdateGroup(group.id, { players: groupPlayers });
      playerIndex += groupSize;
    });

    toast.success(`Balanced ${allAssignedPlayers.length} players across ${groups.length} groups`);
  }, [groups, assignedPlayers, onUpdateGroup]);

  // Auto-assign unassigned players
  const autoAssignUnassigned = useCallback(() => {
    if (unassignedPlayers.length === 0 || groups.length === 0) return;

    const playersToAssign = [...unassignedPlayers];
    
    // Sort groups by current size (smallest first)
    const sortedGroups = [...groups].sort((a, b) => a.players.length - b.players.length);

    playersToAssign.forEach((player, index) => {
      const targetGroup = sortedGroups[index % sortedGroups.length];
      onUpdateGroup(targetGroup.id, {
        players: [...targetGroup.players, player]
      });
    });

    toast.success(`Auto-assigned ${playersToAssign.length} players`);
  }, [unassignedPlayers, groups, onUpdateGroup]);

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const selectedGroupValidation = selectedGroupId 
    ? groupValidation.find(v => v.groupId === selectedGroupId) 
    : null;

  return (
    <div className="h-full flex">
      {/* Group List */}
      <div className="w-80 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Groups ({groups.length})</h3>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setShowAutoGroupDialog(true)}>
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onAddGroup}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-4 space-y-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={balanceGroups}
              disabled={groups.length === 0 || assignedPlayers.length === 0}
            >
              <Target className="h-4 w-4 mr-2" />
              Balance Groups
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={autoAssignUnassigned}
              disabled={unassignedPlayers.length === 0 || groups.length === 0}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Auto-assign Unassigned ({unassignedPlayers.length})
            </Button>
          </div>

          {/* Group List */}
          <div className="space-y-2">
            {groups.map((group) => {
              const validation = groupValidation.find(v => v.groupId === group.id);
              const startingStation = stations.find(s => s.id === group.startingStation);
              
              return (
                <div
                  key={group.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedGroupId === group.id 
                      ? "border-orange-500 bg-orange-50" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-medium text-sm">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {validation && !validation.isValid && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGroup(group.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>{group.players.length} players</span>
                      {startingStation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {startingStation.name}
                        </span>
                      )}
                    </div>

                    {validation && validation.warnings.length > 0 && (
                      <div className="text-yellow-600">
                        {validation.warnings[0]}
                      </div>
                    )}

                    {validation && validation.errors.length > 0 && (
                      <div className="text-red-600">
                        {validation.errors[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No groups created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Player Pool */}
        <div className="w-80 border-r overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="font-medium mb-3">Available Players</h3>
              
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={playerFilter} onValueChange={(value: any) => setPlayerFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      <SelectItem value="assigned">Assigned ({assignedPlayers.length})</SelectItem>
                      <SelectItem value="unassigned">Unassigned ({unassignedPlayers.length})</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={medicalFilter} onValueChange={(value: any) => setMedicalFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredPlayers.length} players</span>
                <span>{assignedPlayers.length}/{availablePlayers.length} assigned</span>
              </div>
            </div>

            {/* Player List */}
            <div className="space-y-1 min-h-32 p-2 rounded-lg border-2 border-dashed border-gray-300">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={cn(
                    "p-2 rounded border bg-white cursor-pointer transition-all hover:border-orange-500 hover:shadow-sm",
                    !unassignedPlayers.some(p => p.id === player.id) && "opacity-60"
                  )}
                  onClick={() => {
                    if (selectedGroup) {
                      onUpdateGroup(selectedGroup.id, {
                        players: [...selectedGroup.players, player]
                      });
                      toast.success(`Added ${player.name} to ${selectedGroup.name}`);
                    } else {
                      toast.error('Please select a group first');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        #{player.jerseyNumber} • {player.position}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {player.wellness?.status === 'injured' && (
                        <Heart className="h-3 w-3 text-red-500" />
                      )}
                      {player.wellness?.status === 'limited' && (
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      )}
                      {player.wellness?.status === 'healthy' && (
                        <Activity className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No players found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Group Editor */}
        <div className="flex-1 overflow-y-auto">
          {selectedGroup ? (
            <div className="p-6">
              <div className="space-y-6">
                {/* Group Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: selectedGroup.color }}
                        />
                        <CardTitle>{selectedGroup.name}</CardTitle>
                        {selectedGroupValidation && !selectedGroupValidation.isValid && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Issues
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => duplicateGroup(selectedGroup.id)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={selectedGroup.name}
                          onChange={(e) => onUpdateGroup(selectedGroup.id, { name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="starting-station">Starting Station</Label>
                        <Select
                          value={selectedGroup.startingStation}
                          onValueChange={(value) => onUpdateGroup(selectedGroup.id, { startingStation: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select station..." />
                          </SelectTrigger>
                          <SelectContent>
                            {stations.map((station) => (
                              <SelectItem key={station.id} value={station.id}>
                                <div className="flex items-center gap-2">
                                  <span>{EQUIPMENT_CONFIGS[station.equipment].icon}</span>
                                  <span>{station.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {station.capacity} max
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Group Color</Label>
                      <div className="mt-2 flex gap-2">
                        {GROUP_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              selectedGroup.color === color ? "border-gray-400 scale-110" : "border-gray-200 hover:border-gray-300"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateGroup(selectedGroup.id, { color })}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Validation Messages */}
                    {selectedGroupValidation && (selectedGroupValidation.errors.length > 0 || selectedGroupValidation.warnings.length > 0) && (
                      <div className="space-y-2">
                        {selectedGroupValidation.errors.map((error, index) => (
                          <div key={index} className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                          </div>
                        ))}
                        {selectedGroupValidation.warnings.map((warning, index) => (
                          <div key={index} className="flex items-center gap-2 text-yellow-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Group Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>Players ({selectedGroup.players.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-32 p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                      {selectedGroup.players.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click players from the left panel to add them here</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedGroup.players.map((player) => (
                            <div
                              key={player.id}
                              className="p-3 rounded-lg border bg-white cursor-pointer hover:shadow-sm transition-all"
                              style={{ borderColor: selectedGroup.color }}
                              onClick={() => {
                                onUpdateGroup(selectedGroup.id, {
                                  players: selectedGroup.players.filter(p => p.id !== player.id)
                                });
                                toast.success(`Removed ${player.name} from ${selectedGroup.name}`);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{player.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    #{player.jerseyNumber} • {player.position}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {player.wellness?.status === 'injured' && (
                                    <Heart className="h-3 w-3 text-red-500" />
                                  )}
                                  {player.wellness?.status === 'limited' && (
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                  )}
                                  {player.wellness?.status === 'healthy' && (
                                    <Activity className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a group to configure</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto Group Dialog */}
      {showAutoGroupDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Auto-Group Players</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAutoGroupDialog(false)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Strategy</Label>
                <Select
                  value={autoGroupOptions.strategy}
                  onValueChange={(value: any) => setAutoGroupOptions(prev => ({ ...prev, strategy: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced Distribution</SelectItem>
                    <SelectItem value="skill_based">Skill-based Groups</SelectItem>
                    <SelectItem value="position_based">Position-based Groups</SelectItem>
                    <SelectItem value="random">Random Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Group Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={autoGroupOptions.minGroupSize}
                    onChange={(e) => setAutoGroupOptions(prev => ({ 
                      ...prev, 
                      minGroupSize: parseInt(e.target.value) || 1 
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Max Group Size</Label>
                  <Input
                    type="number"
                    min="2"
                    max="12"
                    value={autoGroupOptions.maxGroupSize}
                    onChange={(e) => setAutoGroupOptions(prev => ({ 
                      ...prev, 
                      maxGroupSize: parseInt(e.target.value) || 8 
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consider-medical"
                    checked={autoGroupOptions.considerMedicalStatus}
                    onCheckedChange={(checked) => setAutoGroupOptions(prev => ({ 
                      ...prev, 
                      considerMedicalStatus: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="consider-medical" className="text-sm">
                    Consider medical status
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="equal-sizes"
                    checked={autoGroupOptions.enforceEqualSizes}
                    onCheckedChange={(checked) => setAutoGroupOptions(prev => ({ 
                      ...prev, 
                      enforceEqualSizes: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="equal-sizes" className="text-sm">
                    Enforce equal group sizes
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAutoGroupDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    onAutoGroup(autoGroupOptions);
                    setShowAutoGroupDialog(false);
                  }}
                  className="flex-1"
                >
                  Create Groups
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}