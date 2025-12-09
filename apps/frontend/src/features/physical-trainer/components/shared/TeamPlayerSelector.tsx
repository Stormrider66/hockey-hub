import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  User, 
  Search, 
  Check, 
  X,
  Shield,
  AlertCircle,
  Heart,
  Filter,
  Info,
  RotateCcw,
  UserCheck,
  UserX
} from '@/components/icons';
import { useGetPlayersQuery, useGetTeamsQuery } from '@/store/api/playerApi';
import { MedicalReportButton } from '../SessionBuilder/MedicalReportButton';
import { MedicalReportModal } from '../SessionBuilder/MedicalReportModal';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import type { WorkoutEquipmentType } from '../../types/conditioning.types';
import { EquipmentCapacityBar } from './EquipmentCapacityBar';

// Types
export interface PlayerData {
  id: string;
  name: string;
  jerseyNumber?: string | number;
  position?: string;
  team?: string;
  teamId?: string;
  avatarUrl?: string;
  wellness?: {
    status: 'healthy' | 'injured' | 'limited' | 'unavailable';
  };
  medicalRestrictions?: any[];
}

export interface TeamData {
  id: string;
  name: string;
  category?: string;
  ageGroup?: string;
  level?: string;
  players?: PlayerData[];
  playerCount?: number;
}

export interface EquipmentCapacity {
  equipmentType: WorkoutEquipmentType;
  totalCapacity: number;
  availableCapacity: number;
  facilityId: string;
}

export interface TeamPlayerSelectorProps {
  // Required props  
  selectedPlayers: string[];
  selectedTeams: string[];
  onPlayersChange: (playerIds: string[]) => void;
  onTeamsChange: (teamIds: string[]) => void;
  
  // Equipment constraints
  equipmentCapacity?: EquipmentCapacity;
  
  // Optional feature toggles
  showTeams?: boolean;
  showMedical?: boolean;
  showFilters?: boolean;
  showSummary?: boolean;
  
  // Optional customization
  title?: string;
  description?: string;
  
  // Optional display settings
  inline?: boolean;
  maxHeight?: number;
  
  // Optional callbacks
  onPlayerClick?: (player: PlayerData) => void;
  onTeamClick?: (team: TeamData) => void;
  onCapacityExceeded?: (selectedCount: number, maxCapacity: number) => void;
  
  // Optional data overrides
  customPlayers?: PlayerData[];
  customTeams?: TeamData[];
}

interface PlayerItemProps {
  player: PlayerData;
  isSelected: boolean;
  onToggle: () => void;
  showMedical?: boolean;
  hasRestrictions?: boolean;
  onViewMedicalReport?: (playerId: string, playerName: string) => void;
  onClick?: (player: PlayerData) => void;
  disabled?: boolean;
  disabledReason?: string;
}

interface TeamItemProps {
  team: TeamData;
  isSelected: boolean;
  onToggle: () => void;
  playerCount: number;
  onClick?: (team: TeamData) => void;
  disabled?: boolean;
  disabledReason?: string;
}

interface RotationGroup {
  id: string;
  name: string;
  players: PlayerData[];
  startOrder: number;
}

interface RotationSuggestion {
  groups: RotationGroup[];
  rotationTime: number; // minutes per rotation
  totalTime: number; // total session time
  description: string;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ 
  player, 
  isSelected, 
  onToggle,
  showMedical = true,
  hasRestrictions,
  onViewMedicalReport,
  onClick,
  disabled = false,
  disabledReason
}) => {
  const getInjuryStatus = () => {
    if (player.wellness?.status === 'injured') return 'injured';
    if (player.wellness?.status === 'limited') return 'limited';
    return 'healthy';
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
        disabled 
          ? "bg-muted/30 cursor-not-allowed opacity-60" 
          : "hover:bg-muted/50"
      )}
      onClick={() => !disabled && onClick?.(player)}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={!disabled ? onToggle : undefined}
          id={`player-${player.id}`}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <Avatar className="h-8 w-8">
          <AvatarImage src={player.avatarUrl} />
          <AvatarFallback>
            {player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label 
            htmlFor={`player-${player.id}`} 
            className={cn(
              "font-medium cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          >
            {player.name}
          </Label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
            {player.jerseyNumber && player.position && <span>•</span>}
            {player.position && <span>{player.position}</span>}
            {player.team && (
              <>
                <span>•</span>
                <span>{player.team}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {disabled && disabledReason && (
          <Badge variant="outline" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {disabledReason}
          </Badge>
        )}
        
        {showMedical && (player.wellness?.status === 'injured' || player.wellness?.status === 'limited') && (
          <MedicalReportButton
            playerId={player.id}
            playerName={player.name}
            injuryStatus={getInjuryStatus() as 'injured' | 'limited'}
            onClick={() => onViewMedicalReport?.(player.id, player.name)}
          />
        )}
        
        {showMedical && hasRestrictions && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Restrictions
          </Badge>
        )}
        {showMedical && player.wellness?.status === 'injured' && (
          <Badge variant="destructive" className="text-xs">
            <Heart className="h-3 w-3 mr-1" />
            Injured
          </Badge>
        )}
        {showMedical && player.wellness?.status === 'limited' && (
          <Badge variant="warning" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Limited
          </Badge>
        )}
      </div>
    </div>
  );
};

const TeamItem: React.FC<TeamItemProps> = ({ 
  team, 
  isSelected, 
  onToggle,
  playerCount,
  onClick,
  disabled = false,
  disabledReason
}) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
        disabled 
          ? "bg-muted/30 cursor-not-allowed opacity-60" 
          : "hover:bg-muted/50"
      )}
      onClick={() => !disabled && onClick?.(team)}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={!disabled ? onToggle : undefined}
          id={`team-${team.id}`}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <Label 
            htmlFor={`team-${team.id}`} 
            className={cn(
              "font-medium cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          >
            {team.name}
          </Label>
          <p className="text-xs text-muted-foreground">
            {playerCount} players
            {team.ageGroup && ` • ${team.ageGroup}`}
            {team.level && ` • ${team.level}`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {disabled && disabledReason && (
          <Badge variant="outline" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {disabledReason}
          </Badge>
        )}
        {team.category && <Badge variant="secondary">{team.category}</Badge>}
      </div>
    </div>
  );
};

export const TeamPlayerSelector: React.FC<TeamPlayerSelectorProps> = ({ 
  selectedPlayers,
  selectedTeams,
  onPlayersChange,
  onTeamsChange,
  equipmentCapacity,
  showTeams = true,
  showMedical = true,
  showFilters = true,
  showSummary = true,
  title,
  description,
  inline = false,
  maxHeight = 400,
  onPlayerClick,
  onTeamClick,
  onCapacityExceeded,
  customPlayers,
  customTeams
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [showRotationSuggestion, setShowRotationSuggestion] = useState(false);

  // Fetch players and teams
  const { data: playersData, isLoading: playersLoading, error: playersError } = useGetPlayersQuery(undefined, {
    skip: !!customPlayers
  });
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useGetTeamsQuery(undefined, {
    skip: !!customTeams
  });

  const players = customPlayers || playersData?.players || playersData || [];
  const teams = customTeams || teamsData?.teams || teamsData?.data || teamsData || [];

  // Calculate current capacity usage
  const totalSelectedPlayers = useMemo(() => {
    let total = selectedPlayers.length;
    
    // Add players from selected teams
    selectedTeams.forEach(teamId => {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        total += team.players?.length || team.playerCount || 0;
      }
    });
    
    return total;
  }, [selectedPlayers, selectedTeams, teams]);

  // Check if capacity is exceeded
  const isCapacityExceeded = equipmentCapacity && totalSelectedPlayers > equipmentCapacity.availableCapacity;
  
  // Filter players based on selected team and search
  const filteredPlayers = useMemo(() => {
    let filtered = [...players];
    
    // Filter by selected team
    if (selectedTeamId !== 'all') {
      filtered = filtered.filter(player => player.teamId === selectedTeamId || player.team === selectedTeamId);
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(search) ||
        player.jerseyNumber?.toString().includes(search) ||
        player.position?.toLowerCase().includes(search)
      );
    }

    // Filter by availability
    if (showOnlyAvailable) {
      filtered = filtered.filter(player => 
        player.wellness?.status !== 'injured' &&
        player.wellness?.status !== 'unavailable'
      );
    }

    return filtered;
  }, [players, selectedTeamId, searchTerm, showOnlyAvailable]);

  // Generate rotation suggestion when capacity is exceeded
  const rotationSuggestion = useMemo((): RotationSuggestion | null => {
    if (!equipmentCapacity || totalSelectedPlayers <= equipmentCapacity.availableCapacity) {
      return null;
    }

    const allPlayers = [
      ...selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean) as PlayerData[],
      ...selectedTeams.flatMap(teamId => {
        const team = teams.find(t => t.id === teamId);
        return team?.players || [];
      })
    ];

    if (allPlayers.length === 0) return null;

    const playersPerGroup = equipmentCapacity.availableCapacity;
    const numberOfGroups = Math.ceil(allPlayers.length / playersPerGroup);
    const rotationTime = 20; // Default 20 minutes per rotation
    
    const groups: RotationGroup[] = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const startIndex = i * playersPerGroup;
      const endIndex = Math.min(startIndex + playersPerGroup, allPlayers.length);
      const groupPlayers = allPlayers.slice(startIndex, endIndex);
      
      groups.push({
        id: `group-${i + 1}`,
        name: `Group ${i + 1}`,
        players: groupPlayers,
        startOrder: i
      });
    }

    return {
      groups,
      rotationTime,
      totalTime: numberOfGroups * rotationTime,
      description: `${allPlayers.length} players will be divided into ${numberOfGroups} groups of ${playersPerGroup} players each`
    };
  }, [totalSelectedPlayers, equipmentCapacity, selectedPlayers, selectedTeams, players, teams]);

  // Handle team selection change
  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    
    if (teamId !== 'all') {
      // Auto-populate players from selected team
      const team = teams.find(t => t.id === teamId);
      if (team) {
        const teamPlayerIds = team.players?.map(p => p.id) || [];
        const availablePlayers = teamPlayerIds.filter(id => {
          const player = players.find(p => p.id === id);
          return player && player.wellness?.status !== 'injured' && player.wellness?.status !== 'unavailable';
        });
        
        // Check capacity constraints
        if (equipmentCapacity && availablePlayers.length > equipmentCapacity.availableCapacity) {
          // Show capacity warning but still select players
          onCapacityExceeded?.(availablePlayers.length, equipmentCapacity.availableCapacity);
          setShowRotationSuggestion(true);
        }
        
        onPlayersChange(availablePlayers);
      }
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    const newPlayers = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter(id => id !== playerId)
      : [...selectedPlayers, playerId];
    
    // Check capacity before adding
    if (!selectedPlayers.includes(playerId) && equipmentCapacity) {
      const newTotal = newPlayers.length + selectedTeams.reduce((sum, teamId) => {
        const team = teams.find(t => t.id === teamId);
        return sum + (team?.players?.length || team?.playerCount || 0);
      }, 0);
      
      if (newTotal > equipmentCapacity.availableCapacity) {
        onCapacityExceeded?.(newTotal, equipmentCapacity.availableCapacity);
        setShowRotationSuggestion(true);
      }
    }
    
    onPlayersChange(newPlayers);
  };

  const handleToggleTeam = (team: TeamData) => {
    const isCurrentlySelected = selectedTeams.includes(team.id);
    const newTeams = isCurrentlySelected
      ? selectedTeams.filter(id => id !== team.id)
      : [...selectedTeams, team.id];
    
    // Check capacity before adding
    if (!isCurrentlySelected && equipmentCapacity) {
      const teamPlayerCount = team.players?.length || team.playerCount || 0;
      const newTotal = selectedPlayers.length + newTeams.reduce((sum, teamId) => {
        const t = teams.find(t => t.id === teamId);
        return sum + (t?.players?.length || t?.playerCount || 0);
      }, 0);
      
      if (newTotal > equipmentCapacity.availableCapacity) {
        onCapacityExceeded?.(newTotal, equipmentCapacity.availableCapacity);
        setShowRotationSuggestion(true);
      }
    }
    
    onTeamsChange(newTeams);
  };

  const handleViewMedicalReport = (playerId: string, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
    setMedicalModalOpen(true);
  };

  const handleSelectAll = () => {
    if (equipmentCapacity && filteredPlayers.length > equipmentCapacity.availableCapacity) {
      onCapacityExceeded?.(filteredPlayers.length, equipmentCapacity.availableCapacity);
      setShowRotationSuggestion(true);
    }
    
    const availablePlayerIds = filteredPlayers
      .filter(p => p.wellness?.status !== 'injured')
      .map(p => p.id);
    onPlayersChange(availablePlayerIds);
  };

  const handleClearAll = () => {
    onPlayersChange([]);
    onTeamsChange([]);
    setShowRotationSuggestion(false);
  };

  // Render callbacks for virtualized lists
  const renderPlayerItem = useCallback(({ item: player, style }: { item: PlayerData; style: React.CSSProperties }) => {
    const isSelected = selectedPlayers.includes(player.id);
    const wouldExceedCapacity = equipmentCapacity && !isSelected && 
      totalSelectedPlayers >= equipmentCapacity.availableCapacity;
    
    return (
      <div style={style}>
        <PlayerItem
          player={player}
          isSelected={isSelected}
          onToggle={() => handleTogglePlayer(player.id)}
          showMedical={showMedical}
          hasRestrictions={player.medicalRestrictions?.length > 0}
          onViewMedicalReport={handleViewMedicalReport}
          onClick={onPlayerClick}
          disabled={wouldExceedCapacity}
          disabledReason={wouldExceedCapacity ? "Equipment capacity reached" : undefined}
        />
      </div>
    );
  }, [selectedPlayers, showMedical, onPlayerClick, equipmentCapacity, totalSelectedPlayers]);

  const renderTeamItem = useCallback(({ item: team, style }: { item: TeamData; style: React.CSSProperties }) => {
    const isSelected = selectedTeams.includes(team.id);
    const teamPlayerCount = team.players?.length || team.playerCount || 0;
    const wouldExceedCapacity = equipmentCapacity && !isSelected && 
      (totalSelectedPlayers + teamPlayerCount) > equipmentCapacity.availableCapacity;
    
    return (
      <div style={style}>
        <TeamItem
          team={team}
          isSelected={isSelected}
          onToggle={() => handleToggleTeam(team)}
          playerCount={teamPlayerCount}
          onClick={onTeamClick}
          disabled={wouldExceedCapacity}
          disabledReason={wouldExceedCapacity ? `Would exceed capacity by ${(totalSelectedPlayers + teamPlayerCount) - equipmentCapacity!.availableCapacity}` : undefined}
        />
      </div>
    );
  }, [selectedTeams, onTeamClick, equipmentCapacity, totalSelectedPlayers]);

  const content = (
    <div className="space-y-4">
      {/* Title and Description */}
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {/* Equipment Capacity Bar */}
      {equipmentCapacity && (
        <EquipmentCapacityBar
          equipmentType={equipmentCapacity.equipmentType}
          totalCapacity={equipmentCapacity.totalCapacity}
          usedCapacity={totalSelectedPlayers}
          availableCapacity={equipmentCapacity.availableCapacity}
          className="mb-4"
        />
      )}

      {/* Team Selector */}
      <div className="space-y-2">
        <Label htmlFor="team-select" className="text-sm font-medium">
          Select Team
        </Label>
        <Select value={selectedTeamId} onValueChange={handleTeamSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a team..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Teams
              </div>
            </SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{team.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {team.players?.length || team.playerCount || 0} players
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {showSummary && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Assignment Summary</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {totalSelectedPlayers} players selected
                {equipmentCapacity && ` (${equipmentCapacity.availableCapacity} max capacity)`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <User className="h-3 w-3 mr-1" />
                {selectedPlayers.length} individual
              </Badge>
              {showTeams && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedTeams.length} teams
                </Badge>
              )}
            </div>
          </div>
          
          {isCapacityExceeded && (
            <Alert variant="warning" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selected players ({totalSelectedPlayers}) exceed equipment capacity ({equipmentCapacity?.availableCapacity}). 
                Consider using rotation groups.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      {/* Rotation Suggestion */}
      {showRotationSuggestion && rotationSuggestion && (
        <Card className="p-4 border-orange-200 bg-orange-50/50">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 mb-1">
                Rotation Groups Suggested
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                {rotationSuggestion.description}
              </p>
              
              <div className="space-y-2">
                {rotationSuggestion.groups.map((group, index) => (
                  <div key={group.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-white">
                      {group.name}
                    </Badge>
                    <span className="text-orange-700">
                      {group.players.length} players • 
                      {rotationSuggestion.rotationTime} min • 
                      Starts at {index * rotationSuggestion.rotationTime}min
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowRotationSuggestion(false)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    // Could implement auto-grouping logic here
                    console.log('Apply rotation groups:', rotationSuggestion);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply Groups
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search and filters */}
      {showFilters && (
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={showOnlyAvailable}
                onCheckedChange={(checked) => setShowOnlyAvailable(checked as boolean)}
              />
              <Label htmlFor="available" className="text-sm cursor-pointer">
                Show only available players
              </Label>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                <UserCheck className="h-3 w-3 mr-1" />
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <UserX className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div>
        {playersLoading ? (
          <Card className="p-8">
            <LoadingSpinner size="lg" text="Loading players..." />
          </Card>
        ) : playersError ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-muted-foreground">Error loading players</p>
          </Card>
        ) : (
          <VirtualizedList
            items={filteredPlayers}
            height={maxHeight}
            itemHeight={72}
            renderItem={renderPlayerItem}
            emptyMessage={selectedTeamId === 'all' ? "No players found" : "No players found in selected team"}
            loading={playersLoading}
            overscan={5}
          />
        )}
      </div>

      {/* Warning for injured players */}
      {showMedical && selectedPlayers.some(id => {
        const player = players.find(p => p.id === id);
        return player?.wellness?.status === 'injured';
      }) && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some selected players have injury status. The session will be adapted based on their restrictions.
          </AlertDescription>
        </Alert>
      )}

      {/* Medical Report Modal */}
      {showMedical && selectedPlayer && (
        <MedicalReportModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          isOpen={medicalModalOpen}
          onClose={() => {
            setMedicalModalOpen(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );

  return inline ? content : <Card className="p-6">{content}</Card>;
};