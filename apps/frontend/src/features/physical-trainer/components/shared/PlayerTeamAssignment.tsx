import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
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
  UsersIcon,
  Copy,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Brain,
  Zap
} from '@/components/icons';
import { useGetPlayersQuery, useGetTeamsQuery } from '@/store/api/playerApi';
import { MedicalReportButton } from '../SessionBuilder/MedicalReportButton';
import { MedicalReportModal } from '../SessionBuilder/MedicalReportModal';
import { LoadingSpinner } from '@/components/ui/loading';
import type { BulkSessionConfig, SessionConfiguration } from '../../hooks/useBulkSession';
import { PlayerDistributionPanel, FatigueIndicator } from '../ai';
import type { PlayerGroup } from '../ai';

// Types
export interface PlayerData {
  id: string;
  name: string;
  jerseyNumber?: string | number;
  position?: string;
  team?: string;
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
}

export interface PlayerTeamAssignmentProps {
  // Required props
  selectedPlayers: string[];
  selectedTeams: string[];
  onPlayersChange: (playerIds: string[]) => void;
  onTeamsChange: (teamIds: string[]) => void;
  
  // Optional feature toggles
  showTeams?: boolean;
  showGroups?: boolean;
  showMedical?: boolean;
  showFilters?: boolean;
  showSummary?: boolean;
  
  // Optional customization
  title?: string;
  description?: string;
  playerTabLabel?: string;
  teamTabLabel?: string;
  
  // Optional display settings
  inline?: boolean; // If true, removes Card wrapper
  maxHeight?: number; // Max height for scroll area
  
  // Optional callbacks
  onPlayerClick?: (player: PlayerData) => void;
  onTeamClick?: (team: TeamData) => void;
  
  // Optional data overrides (if you want to provide custom data)
  customPlayers?: PlayerData[];
  customTeams?: TeamData[];
  
  // Optional filters
  filterInjured?: boolean;
  filterByTeam?: string[];
  filterByPosition?: string[];
  
  // Bulk mode support
  bulkMode?: boolean;
  bulkConfig?: BulkSessionConfig;
  onBulkConfigChange?: (config: BulkSessionConfig) => void;
  showSessionDistribution?: boolean;
  
  // AI Distribution support
  showAIDistribution?: boolean;
  onAIDistributionApply?: (groups: PlayerGroup[]) => void;
}

// Sub-components
interface PlayerItemProps {
  player: PlayerData;
  isSelected: boolean;
  onToggle: () => void;
  showMedical?: boolean;
  hasRestrictions?: boolean;
  onViewMedicalReport?: (playerId: string, playerName: string) => void;
  onClick?: (player: PlayerData) => void;
}

interface TeamItemProps {
  team: TeamData;
  isSelected: boolean;
  onToggle: () => void;
  playerCount: number;
  onClick?: (team: TeamData) => void;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ 
  player, 
  isSelected, 
  onToggle,
  showMedical = true,
  hasRestrictions,
  onViewMedicalReport,
  onClick
}) => {
  // Determine injury status based on wellness status
  const getInjuryStatus = () => {
    if (player.wellness?.status === 'injured') return 'injured';
    if (player.wellness?.status === 'limited') return 'limited';
    return 'healthy';
  };

  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
      onClick={() => onClick?.(player)}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          id={`player-${player.id}`}
          onClick={(e) => e.stopPropagation()}
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
            className="font-medium cursor-pointer"
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
        {/* Medical Report Button */}
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
        
        {/* Fatigue Indicator - simulate fatigue based on wellness status */}
        {showMedical && (
          <FatigueIndicator
            fatigue={
              player.wellness?.status === 'injured' ? 85 :
              player.wellness?.status === 'limited' ? 65 :
              Math.random() * 60 + 20 // Simulate 20-80% fatigue for healthy players
            }
            variant="minimal"
            size="sm"
            showValue={false}
          />
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
  onClick
}) => {
  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
      onClick={() => onClick?.(team)}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          id={`team-${team.id}`}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <Label 
            htmlFor={`team-${team.id}`} 
            className="font-medium cursor-pointer"
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
      
      {team.category && <Badge variant="secondary">{team.category}</Badge>}
    </div>
  );
};

export const PlayerTeamAssignment: React.FC<PlayerTeamAssignmentProps> = ({ 
  selectedPlayers,
  selectedTeams,
  onPlayersChange,
  onTeamsChange,
  showTeams = true,
  showGroups = false,
  showMedical = true,
  showFilters = true,
  showSummary = true,
  title,
  description,
  playerTabLabel = "Individual Players",
  teamTabLabel = "Teams",
  inline = false,
  maxHeight = 400,
  onPlayerClick,
  onTeamClick,
  customPlayers,
  customTeams,
  filterInjured = false,
  filterByTeam = [],
  filterByPosition = [],
  bulkMode = false,
  bulkConfig,
  onBulkConfigChange,
  showSessionDistribution = true,
  showAIDistribution = false,
  onAIDistributionApply
}) => {
  const [activeTab, setActiveTab] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [showDistributionDetails, setShowDistributionDetails] = useState(false);
  const [showAIDistributionPanel, setShowAIDistributionPanel] = useState(false);

  // Fetch players and teams (or use custom data)
  const { data: playersData, isLoading: playersLoading, error: playersError } = useGetPlayersQuery(undefined, {
    skip: !!customPlayers
  });
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useGetTeamsQuery(undefined, {
    skip: !!customTeams
  });

  const players = customPlayers || playersData?.players || playersData || [];
  const teams = customTeams || teamsData?.teams || teamsData?.data || teamsData || [];

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    let filtered = [...players];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(search) ||
        player.jerseyNumber?.toString().includes(search) ||
        player.position?.toLowerCase().includes(search)
      );
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(player => 
        player.wellness?.status !== 'injured' &&
        player.wellness?.status !== 'unavailable'
      );
    }

    if (filterInjured) {
      filtered = filtered.filter(player => player.wellness?.status !== 'injured');
    }

    if (filterByTeam.length > 0) {
      filtered = filtered.filter(player => 
        player.team && filterByTeam.includes(player.team)
      );
    }

    if (filterByPosition.length > 0) {
      filtered = filtered.filter(player => 
        player.position && filterByPosition.includes(player.position)
      );
    }

    return filtered;
  }, [players, searchTerm, showOnlyAvailable, filterInjured, filterByTeam, filterByPosition]);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    
    const search = searchTerm.toLowerCase();
    return teams.filter(team => 
      team.name.toLowerCase().includes(search) ||
      team.category?.toLowerCase().includes(search)
    );
  }, [teams, searchTerm]);

  const handleTogglePlayer = (playerId: string) => {
    const newPlayers = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter(id => id !== playerId)
      : [...selectedPlayers, playerId];
    
    onPlayersChange(newPlayers);
  };

  const handleToggleTeam = (teamId: string) => {
    const newTeams = selectedTeams.includes(teamId)
      ? selectedTeams.filter(id => id !== teamId)
      : [...selectedTeams, teamId];
    
    onTeamsChange(newTeams);
  };

  const handleSelectAll = () => {
    if (activeTab === 'players') {
      const availablePlayerIds = filteredPlayers
        .filter(p => p.wellness?.status !== 'injured' || !filterInjured)
        .map(p => p.id);
      onPlayersChange(availablePlayerIds);
    } else if (showTeams) {
      const allTeamIds = filteredTeams.map(t => t.id);
      onTeamsChange(allTeamIds);
    }
  };

  const handleClearAll = () => {
    if (activeTab === 'players') {
      onPlayersChange([]);
    } else if (showTeams) {
      onTeamsChange([]);
    }
  };

  const selectedPlayersCount = selectedPlayers.length;
  const selectedTeamsCount = selectedTeams.length;
  
  // Calculate total affected players
  const totalAffectedPlayers = useMemo(() => {
    let total = selectedPlayersCount;
    
    // Add players from selected teams
    selectedTeams.forEach(teamId => {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        total += team.players?.length || 0;
      }
    });
    
    return total;
  }, [selectedPlayersCount, selectedTeamsCount, teams, selectedTeams]);

  const handleViewMedicalReport = (playerId: string, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
    setMedicalModalOpen(true);
  };

  // Bulk mode helper functions
  const handleAutoDistributePlayers = useCallback(() => {
    if (!bulkConfig || !onBulkConfigChange) return;

    const allPlayerIds = [...selectedPlayers];
    const sessionCount = bulkConfig.numberOfSessions;
    const playersPerSession = Math.ceil(allPlayerIds.length / sessionCount);
    
    // Distribute players evenly across sessions
    const updatedSessions = bulkConfig.sessions.map((session, index) => {
      const startIndex = index * playersPerSession;
      const endIndex = Math.min(startIndex + playersPerSession, allPlayerIds.length);
      const sessionPlayerIds = allPlayerIds.slice(startIndex, endIndex);
      
      return {
        ...session,
        playerIds: sessionPlayerIds,
        teamIds: [] // Clear team assignments when auto-distributing players
      };
    });
    
    onBulkConfigChange({
      ...bulkConfig,
      sessions: updatedSessions
    });
  }, [bulkConfig, onBulkConfigChange, selectedPlayers]);

  const handleAutoDistributeTeams = useCallback(() => {
    if (!bulkConfig || !onBulkConfigChange) return;

    const allTeamIds = [...selectedTeams];
    const sessionCount = bulkConfig.numberOfSessions;
    const teamsPerSession = Math.ceil(allTeamIds.length / sessionCount);
    
    // Distribute teams evenly across sessions
    const updatedSessions = bulkConfig.sessions.map((session, index) => {
      const startIndex = index * teamsPerSession;
      const endIndex = Math.min(startIndex + teamsPerSession, allTeamIds.length);
      const sessionTeamIds = allTeamIds.slice(startIndex, endIndex);
      
      return {
        ...session,
        teamIds: sessionTeamIds,
        playerIds: [] // Clear individual player assignments when auto-distributing teams
      };
    });
    
    onBulkConfigChange({
      ...bulkConfig,
      sessions: updatedSessions
    });
  }, [bulkConfig, onBulkConfigChange, selectedTeams]);

  // Calculate session distribution summary for bulk mode
  const sessionDistributionSummary = useMemo(() => {
    if (!bulkMode || !bulkConfig) return null;
    
    return bulkConfig.sessions.map((session, index) => {
      const sessionPlayerCount = session.playerIds?.length || 0;
      const sessionTeamCount = session.teamIds?.length || 0;
      
      // Calculate total players including those from teams
      let totalPlayersInSession = sessionPlayerCount;
      session.teamIds?.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
          totalPlayersInSession += team.players?.length || 0;
        }
      });
      
      return {
        sessionIndex: index,
        sessionName: session.name || `Session ${index + 1}`,
        playerCount: sessionPlayerCount,
        teamCount: sessionTeamCount,
        totalPlayers: totalPlayersInSession,
        playerIds: session.playerIds || [],
        teamIds: session.teamIds || []
      };
    });
  }, [bulkMode, bulkConfig, teams]);

  // Render callbacks for virtualized lists
  const renderPlayerItem = useCallback(({ item: player, style }: { item: PlayerData; style: React.CSSProperties }) => {
    return (
      <div style={style}>
        <PlayerItem
          player={player}
          isSelected={selectedPlayers.includes(player.id)}
          onToggle={() => handleTogglePlayer(player.id)}
          showMedical={showMedical}
          hasRestrictions={player.medicalRestrictions?.length > 0}
          onViewMedicalReport={handleViewMedicalReport}
          onClick={onPlayerClick}
        />
      </div>
    );
  }, [selectedPlayers, showMedical, onPlayerClick]);

  const renderTeamItem = useCallback(({ item: team, style }: { item: TeamData; style: React.CSSProperties }) => {
    return (
      <div style={style}>
        <TeamItem
          team={team}
          isSelected={selectedTeams.includes(team.id)}
          onToggle={() => handleToggleTeam(team.id)}
          playerCount={team.players?.length || 0}
          onClick={onTeamClick}
        />
      </div>
    );
  }, [selectedTeams, onTeamClick]);

  const content = (
    <div className="space-y-4">
      {/* Title and Description */}
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {/* Summary */}
      {showSummary && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Assignment Summary</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {bulkMode ? `${totalAffectedPlayers} total players across ${bulkConfig?.numberOfSessions || 1} sessions` : `${totalAffectedPlayers} total players will be assigned`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <User className="h-3 w-3 mr-1" />
                {selectedPlayersCount} players
              </Badge>
              {showTeams && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedTeamsCount} teams
                </Badge>
              )}
              {bulkMode && bulkConfig && (
                <Badge variant="outline">
                  <Copy className="h-3 w-3 mr-1" />
                  {bulkConfig.numberOfSessions} sessions
                </Badge>
              )}
            </div>
          </div>
          
          {/* Bulk mode distribution controls */}
          {bulkMode && showSessionDistribution && (selectedPlayers.length > 0 || selectedTeams.length > 0) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Session Distribution</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedPlayers.length > 0 ? handleAutoDistributePlayers : handleAutoDistributeTeams}
                    disabled={selectedPlayers.length === 0 && selectedTeams.length === 0}
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    Auto Distribute
                  </Button>
                  {showAIDistribution && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIDistributionPanel(!showAIDistributionPanel)}
                      disabled={selectedPlayers.length === 0 && selectedTeams.length === 0}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      AI Optimize
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDistributionDetails(!showDistributionDetails)}
                  >
                    {showDistributionDetails ? (
                      <>
                        Hide Details <ChevronUp className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      <>
                        Show Details <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Quick distribution summary */}
              {sessionDistributionSummary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                  {sessionDistributionSummary.map((summary) => (
                    <div key={summary.sessionIndex} className="text-center p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">{summary.sessionName}</div>
                      <div className="text-sm font-medium">{summary.totalPlayers} players</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Detailed distribution */}
              <Collapsible open={showDistributionDetails} onOpenChange={setShowDistributionDetails}>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {sessionDistributionSummary?.map((summary) => (
                      <Card key={summary.sessionIndex} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{summary.sessionName}</h5>
                          <Badge variant="secondary" className="text-xs">
                            {summary.totalPlayers} total players
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Individual:</span> {summary.playerCount} players
                            {summary.playerIds.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {summary.playerIds.slice(0, 3).map(playerId => {
                                  const player = players.find(p => p.id === playerId);
                                  return player ? (
                                    <div key={playerId} className="text-xs text-muted-foreground">
                                      • {player.name}
                                    </div>
                                  ) : null;
                                })}
                                {summary.playerIds.length > 3 && (
                                  <div className="text-xs text-muted-foreground">• +{summary.playerIds.length - 3} more...</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Teams:</span> {summary.teamCount} teams
                            {summary.teamIds.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {summary.teamIds.slice(0, 2).map(teamId => {
                                  const team = teams.find(t => t.id === teamId);
                                  return team ? (
                                    <div key={teamId} className="text-xs text-muted-foreground">
                                      • {team.name} ({team.players?.length || 0})
                                    </div>
                                  ) : null;
                                })}
                                {summary.teamIds.length > 2 && (
                                  <div className="text-xs text-muted-foreground">• +{summary.teamIds.length - 2} more...</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </Card>
      )}

      {/* Search and filters */}
      {showFilters && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={showTeams ? "Search players or teams..." : "Search players..."}
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
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
              {bulkMode && (selectedPlayers.length > 0 || selectedTeams.length > 0) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectedPlayers.length > 0 ? handleAutoDistributePlayers : handleAutoDistributeTeams}
                >
                  <Shuffle className="h-3 w-3 mr-1" />
                  Distribute
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for players and teams */}
      {showTeams ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="players" className="flex-1">
              <User className="h-4 w-4 mr-2" />
              {playerTabLabel} ({filteredPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              {teamTabLabel} ({filteredTeams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-4">
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
                emptyMessage="No players found"
                loading={playersLoading}
                overscan={5}
              />
            )}
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            <VirtualizedList
              items={filteredTeams}
              height={maxHeight}
              itemHeight={72}
              renderItem={renderTeamItem}
              emptyMessage="No teams found"
              loading={teamsLoading}
              overscan={5}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // Players only view
        <div>
          {playersLoading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading players...</p>
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
              emptyMessage="No players found"
              loading={playersLoading}
              overscan={5}
            />
          )}
        </div>
      )}

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

      {/* AI Distribution Panel */}
      {showAIDistribution && showAIDistributionPanel && (selectedPlayers.length > 0 || selectedTeams.length > 0) && (
        <Card className="mt-6">
          <PlayerDistributionPanel
            players={
              selectedPlayers.length > 0 
                ? players.filter(p => selectedPlayers.includes(p.id))
                : selectedTeams.flatMap(teamId => {
                    const team = teams.find(t => t.id === teamId);
                    return team?.players || [];
                  })
            }
            sessionCount={bulkConfig?.numberOfSessions || 2}
            onDistributionApply={(groups) => {
              if (onAIDistributionApply) {
                onAIDistributionApply(groups);
              }
              setShowAIDistributionPanel(false);
            }}
            onPlayersSelect={(playerIds) => {
              onPlayersChange(playerIds);
            }}
          />
        </Card>
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