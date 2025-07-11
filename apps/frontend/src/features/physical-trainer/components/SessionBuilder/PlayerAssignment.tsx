import React, { useState, useMemo } from 'react';
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
import { 
  Users, 
  User, 
  Search, 
  Check, 
  X,
  Shield,
  AlertCircle,
  Heart,
  Filter
} from 'lucide-react';
import { SessionTemplate } from '../../types/session-builder.types';
import { useGetPlayersQuery, useGetTeamsQuery } from '@/store/api/playerApi';
import { MedicalReportButton } from './MedicalReportButton';
import { MedicalReportModal } from './MedicalReportModal';

interface PlayerAssignmentProps {
  session: SessionTemplate;
  onUpdate: (session: SessionTemplate) => void;
}

interface PlayerItemProps {
  player: any;
  isSelected: boolean;
  onToggle: () => void;
  hasRestrictions?: boolean;
  onViewMedicalReport?: (playerId: string, playerName: string) => void;
}

interface TeamItemProps {
  team: any;
  isSelected: boolean;
  onToggle: () => void;
  playerCount: number;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ 
  player, 
  isSelected, 
  onToggle,
  hasRestrictions,
  onViewMedicalReport
}) => {
  // Determine injury status based on wellness status
  const getInjuryStatus = () => {
    if (player.wellness?.status === 'injured') return 'injured';
    if (player.wellness?.status === 'limited') return 'limited';
    return 'healthy';
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          id={`player-${player.id}`}
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
            <span>#{player.jerseyNumber}</span>
            <span>•</span>
            <span>{player.position}</span>
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
        {(player.wellness?.status === 'injured' || player.wellness?.status === 'limited') && (
          <MedicalReportButton
            playerId={player.id}
            playerName={player.name}
            injuryStatus={getInjuryStatus() as 'injured' | 'limited'}
            onClick={() => onViewMedicalReport?.(player.id, player.name)}
          />
        )}
        
        {hasRestrictions && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Restrictions
          </Badge>
        )}
        {player.wellness?.status === 'injured' && (
          <Badge variant="destructive" className="text-xs">
            <Heart className="h-3 w-3 mr-1" />
            Injured
          </Badge>
        )}
        {player.wellness?.status === 'limited' && (
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
  playerCount 
}) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          id={`team-${team.id}`}
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
            {playerCount} players • {team.ageGroup} • {team.level}
          </p>
        </div>
      </div>
      
      <Badge variant="secondary">{team.category}</Badge>
    </div>
  );
};

export const PlayerAssignment: React.FC<PlayerAssignmentProps> = ({ 
  session, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);

  // Fetch players and teams
  const { data: playersData, isLoading: playersLoading, error: playersError } = useGetPlayersQuery();
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useGetTeamsQuery();

  // Debug logging
  console.log('PlayerAssignment - playersData:', playersData);
  console.log('PlayerAssignment - teamsData:', teamsData);
  console.log('PlayerAssignment - playersError:', playersError);
  console.log('PlayerAssignment - teamsError:', teamsError);

  const players = playersData?.players || playersData || [];
  const teams = teamsData?.teams || teamsData?.data || teamsData || [];

  // Filter players based on search
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

    return filtered;
  }, [players, searchTerm, showOnlyAvailable]);

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
    const currentPlayers = session.targetPlayers || [];
    const newPlayers = currentPlayers.includes(playerId)
      ? currentPlayers.filter(id => id !== playerId)
      : [...currentPlayers, playerId];
    
    onUpdate({
      ...session,
      targetPlayers: newPlayers
    });
  };

  const handleToggleTeam = (teamId: string) => {
    const currentTeams = session.targetTeams || [];
    const newTeams = currentTeams.includes(teamId)
      ? currentTeams.filter(id => id !== teamId)
      : [...currentTeams, teamId];
    
    onUpdate({
      ...session,
      targetTeams: newTeams
    });
  };

  const handleSelectAll = () => {
    if (activeTab === 'players') {
      const availablePlayerIds = filteredPlayers
        .filter(p => p.wellness?.status !== 'injured')
        .map(p => p.id);
      onUpdate({
        ...session,
        targetPlayers: availablePlayerIds
      });
    } else {
      const allTeamIds = filteredTeams.map(t => t.id);
      onUpdate({
        ...session,
        targetTeams: allTeamIds
      });
    }
  };

  const handleClearAll = () => {
    if (activeTab === 'players') {
      onUpdate({
        ...session,
        targetPlayers: []
      });
    } else {
      onUpdate({
        ...session,
        targetTeams: []
      });
    }
  };

  const selectedPlayersCount = session.targetPlayers?.length || 0;
  const selectedTeamsCount = session.targetTeams?.length || 0;
  
  // Calculate total affected players
  const totalAffectedPlayers = useMemo(() => {
    let total = selectedPlayersCount;
    
    // Add players from selected teams
    session.targetTeams?.forEach(teamId => {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        total += team.players?.length || 0;
      }
    });
    
    return total;
  }, [selectedPlayersCount, selectedTeamsCount, teams, session.targetTeams]);

  const handleViewMedicalReport = (playerId: string, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
    setMedicalModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Assignment Summary</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {totalAffectedPlayers} total players will receive this session
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              {selectedPlayersCount} players
            </Badge>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {selectedTeamsCount} teams
            </Badge>
          </div>
        </div>
      </Card>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players or teams..."
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
          </div>
        </div>
      </div>

      {/* Tabs for players and teams */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="players" className="flex-1">
            <User className="h-4 w-4 mr-2" />
            Individual Players ({filteredPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Teams ({filteredTeams.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 pr-4">
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
              ) : filteredPlayers.length === 0 ? (
                <Card className="p-8 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No players found</p>
                </Card>
              ) : (
                filteredPlayers.map(player => (
                  <PlayerItem
                    key={player.id}
                    player={player}
                    isSelected={session.targetPlayers?.includes(player.id) || false}
                    onToggle={() => handleTogglePlayer(player.id)}
                    hasRestrictions={player.medicalRestrictions?.length > 0}
                    onViewMedicalReport={handleViewMedicalReport}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 pr-4">
              {filteredTeams.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No teams found</p>
                </Card>
              ) : (
                filteredTeams.map(team => (
                  <TeamItem
                    key={team.id}
                    team={team}
                    isSelected={session.targetTeams?.includes(team.id) || false}
                    onToggle={() => handleToggleTeam(team.id)}
                    playerCount={team.players?.length || 0}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Warning for injured players */}
      {session.targetPlayers?.some(id => {
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
      {selectedPlayer && (
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
};