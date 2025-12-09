'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  User,
  Search,
  Filter,
  Shield,
  UserX,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building,
  UsersIcon
} from 'lucide-react';
import { useGetPlayersQuery } from '@/store/api/playerApi';
import { useGetTeamsQuery } from '@/store/api/userApi';

interface TargetSelection {
  type: 'organization' | 'team' | 'group' | 'individual';
  id?: string;
  name?: string;
  playerIds: string[];
}

interface PlayerSelectorProps {
  organizationId: string;
  targetSelection: TargetSelection;
  onSelectionChange: (selection: TargetSelection) => void;
  medicalRestrictions?: any[];
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  teamId: string;
  teamName: string;
  status: 'active' | 'injured' | 'suspended';
  lastWorkout?: string;
  photo?: string;
}

export default function PlayerSelector({
  organizationId,
  targetSelection,
  onSelectionChange,
  medicalRestrictions = []
}: PlayerSelectorProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);

  // API queries
  const { data: playersData, isLoading: playersLoading } = useGetPlayersQuery({
    organizationId,
    includeStats: false
  });
  const { data: teamsData } = useGetTeamsQuery({ organizationId });

  // Transform API data to our Player interface
  const players: Player[] = useMemo(() => {
    if (!playersData?.data) return [];
    
    return playersData.data.map((player: any) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      number: player.jerseyNumber || 'N/A',
      position: player.position || 'Unknown',
      teamId: player.teamId,
      teamName: player.teamName || 'No Team',
      status: medicalRestrictions.some(r => r.playerId === player.id) ? 'injured' : 'active',
      lastWorkout: player.lastWorkout,
      photo: player.profilePicture
    }));
  }, [playersData, medicalRestrictions]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Search filter
      if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !player.number.includes(searchQuery)) {
        return false;
      }

      // Position filter
      if (positionFilter !== 'all' && player.position !== positionFilter) {
        return false;
      }

      // Team filter
      if (teamFilter !== 'all' && player.teamId !== teamFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && player.status !== statusFilter) {
        return false;
      }

      // Target type filter
      if (targetSelection.type === 'team' && targetSelection.id && 
          player.teamId !== targetSelection.id) {
        return false;
      }

      return true;
    });
  }, [players, searchQuery, positionFilter, teamFilter, statusFilter, targetSelection]);

  // Get unique positions and teams for filters
  const positions = useMemo(() => {
    const uniquePositions = [...new Set(players.map(p => p.position))];
    return uniquePositions.filter(p => p && p !== 'Unknown');
  }, [players]);

  const teams = useMemo(() => {
    if (!teamsData?.data) return [];
    return teamsData.data;
  }, [teamsData]);

  // Handle selection changes
  const handleTargetTypeChange = (type: TargetSelection['type']) => {
    onSelectionChange({
      type,
      id: undefined,
      name: undefined,
      playerIds: []
    });
    setSelectedAll(false);
  };

  const handleTeamSelection = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const teamPlayers = players.filter(p => p.teamId === teamId);
    
    onSelectionChange({
      type: 'team',
      id: teamId,
      name: team?.name,
      playerIds: teamPlayers.map(p => p.id)
    });
  };

  const handlePlayerToggle = (playerId: string) => {
    const currentIds = targetSelection.playerIds;
    const newIds = currentIds.includes(playerId)
      ? currentIds.filter(id => id !== playerId)
      : [...currentIds, playerId];

    onSelectionChange({
      ...targetSelection,
      playerIds: newIds
    });
  };

  const handleSelectAll = () => {
    if (selectedAll) {
      onSelectionChange({
        ...targetSelection,
        playerIds: []
      });
      setSelectedAll(false);
    } else {
      onSelectionChange({
        ...targetSelection,
        playerIds: filteredPlayers.map(p => p.id)
      });
      setSelectedAll(true);
    }
  };

  // Update selectedAll when filters change
  useEffect(() => {
    const allSelected = filteredPlayers.length > 0 && 
      filteredPlayers.every(p => targetSelection.playerIds.includes(p.id));
    setSelectedAll(allSelected);
  }, [filteredPlayers, targetSelection.playerIds]);

  // Render player status badge
  const renderStatusBadge = (player: Player) => {
    const restriction = medicalRestrictions.find(r => r.playerId === player.id);
    
    if (restriction) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {restriction.injuries.length} {t('physicalTrainer:playerSelector.injuries')}
        </Badge>
      );
    }
    
    if (player.status === 'suspended') {
      return (
        <Badge variant="secondary" className="text-xs">
          <UserX className="h-3 w-3 mr-1" />
          {t('physicalTrainer:playerSelector.suspended')}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        <Shield className="h-3 w-3 mr-1" />
        {t('physicalTrainer:playerSelector.available')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Target Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:playerSelector.targetType')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={targetSelection.type} 
            onValueChange={(value) => handleTargetTypeChange(value as TargetSelection['type'])}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="organization" id="org" />
                <Label htmlFor="org" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{t('physicalTrainer:playerSelector.entireOrganization')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('physicalTrainer:playerSelector.orgDescription')}
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span>{t('physicalTrainer:playerSelector.specificTeam')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('physicalTrainer:playerSelector.teamDescription')}
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{t('physicalTrainer:playerSelector.customGroup')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('physicalTrainer:playerSelector.groupDescription')}
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t('physicalTrainer:playerSelector.individual')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('physicalTrainer:playerSelector.individualDescription')}
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Team Selection Dropdown */}
          {targetSelection.type === 'team' && (
            <div className="mt-4">
              <Select value={targetSelection.id} onValueChange={handleTeamSelection}>
                <SelectTrigger>
                  <SelectValue placeholder={t('physicalTrainer:playerSelector.selectTeam')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Selection */}
      {(targetSelection.type === 'group' || targetSelection.type === 'individual') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('physicalTrainer:playerSelector.selectPlayers')}</CardTitle>
              <Badge variant="secondary">
                {targetSelection.playerIds.length} {t('physicalTrainer:playerSelector.selected')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('physicalTrainer:playerSelector.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg">
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:playerSelector.allPositions')}</SelectItem>
                      {positions.map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:playerSelector.allTeams')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:playerSelector.allStatuses')}</SelectItem>
                      <SelectItem value="active">{t('physicalTrainer:playerSelector.active')}</SelectItem>
                      <SelectItem value="injured">{t('physicalTrainer:playerSelector.injured')}</SelectItem>
                      <SelectItem value="suspended">{t('physicalTrainer:playerSelector.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedAll}
                  onCheckedChange={handleSelectAll}
                />
                {t('physicalTrainer:playerSelector.selectAll', { count: filteredPlayers.length })}
              </Label>
            </div>

            {/* Player List */}
            <VirtualizedList
              items={filteredPlayers}
              height={400}
              itemHeight={76} // Height of each player row including gap
              loading={playersLoading}
              emptyMessage={t('physicalTrainer:playerSelector.noPlayers')}
              renderItem={({ item: player, style }) => (
                <div style={style} className="px-1 py-1">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors bg-background">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={targetSelection.playerIds.includes(player.id)}
                        onCheckedChange={() => handlePlayerToggle(player.id)}
                      />
                      <div className="flex items-center gap-3">
                        {player.photo ? (
                          <img 
                            src={player.photo} 
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            #{player.number} {player.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {player.position} • {player.teamName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(player)}
                    </div>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {targetSelection.playerIds.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {t('physicalTrainer:playerSelector.summary')}
                </p>
                <p className="text-2xl font-bold">
                  {targetSelection.playerIds.length} {t('physicalTrainer:playerSelector.playersSelected')}
                </p>
              </div>
              {medicalRestrictions.length > 0 && (
                <Badge variant="warning" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {medicalRestrictions.length} {t('physicalTrainer:playerSelector.withRestrictions')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}