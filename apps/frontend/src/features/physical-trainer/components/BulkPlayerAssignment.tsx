'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, Search, UserCheck, UserX, Shield, 
  Activity, TrendingUp, AlertCircle, Filter,
  ChevronRight, Check
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  number: number;
  team: string;
  position: string;
  status: 'ready' | 'caution' | 'rest';
  load: number;
  lastSession?: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface BulkPlayerAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  onAssign: (playerIds: string[]) => void;
  currentPlayerIds?: string[];
}

// Mock data - in production, this would come from an API
const MOCK_TEAMS: Team[] = [
  {
    id: 'a-team',
    name: 'A-Team',
    players: [
      { id: '1', name: 'Alex Ovechkin', number: 8, team: 'A-Team', position: 'RW', status: 'ready', load: 85 },
      { id: '2', name: 'Sidney Crosby', number: 87, team: 'A-Team', position: 'C', status: 'ready', load: 78 },
      { id: '3', name: 'Connor McDavid', number: 97, team: 'A-Team', position: 'C', status: 'caution', load: 92 },
      { id: '4', name: 'Nikita Kucherov', number: 86, team: 'A-Team', position: 'RW', status: 'ready', load: 80 },
      { id: '5', name: 'Cale Makar', number: 8, team: 'A-Team', position: 'D', status: 'ready', load: 75 },
      { id: '6', name: 'Victor Hedman', number: 77, team: 'A-Team', position: 'D', status: 'rest', load: 105 },
    ]
  },
  {
    id: 'j20',
    name: 'J20 Team',
    players: [
      { id: '7', name: 'Jack Hughes', number: 86, team: 'J20 Team', position: 'C', status: 'ready', load: 70 },
      { id: '8', name: 'Quinn Hughes', number: 43, team: 'J20 Team', position: 'D', status: 'ready', load: 72 },
      { id: '9', name: 'Trevor Zegras', number: 11, team: 'J20 Team', position: 'C', status: 'ready', load: 68 },
      { id: '10', name: 'Cole Caufield', number: 22, team: 'J20 Team', position: 'RW', status: 'caution', load: 88 },
    ]
  },
  {
    id: 'u18',
    name: 'U18 Team',
    players: [
      { id: '11', name: 'Connor Bedard', number: 98, team: 'U18 Team', position: 'C', status: 'ready', load: 65 },
      { id: '12', name: 'Adam Fantilli', number: 19, team: 'U18 Team', position: 'C', status: 'ready', load: 62 },
      { id: '13', name: 'Leo Carlsson', number: 48, team: 'U18 Team', position: 'C', status: 'ready', load: 60 },
    ]
  }
];

export default function BulkPlayerAssignment({
  open,
  onOpenChange,
  sessionId,
  onAssign,
  currentPlayerIds = []
}: BulkPlayerAssignmentProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(currentPlayerIds)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'caution' | 'rest'>('all');
  const [activeTab, setActiveTab] = useState('teams');

  // Get all players flattened
  const allPlayers = useMemo(() => 
    MOCK_TEAMS.flatMap(team => team.players),
    []
  );

  // Filter players based on search and status
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.number.toString().includes(searchQuery) ||
                          player.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || player.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allPlayers, searchQuery, filterStatus]);

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const toggleTeam = (teamId: string) => {
    const team = MOCK_TEAMS.find(t => t.id === teamId);
    if (!team) return;

    const newSelected = new Set(selectedPlayers);
    const teamPlayerIds = team.players.map(p => p.id);
    const allSelected = teamPlayerIds.every(id => newSelected.has(id));

    if (allSelected) {
      // Deselect all team players
      teamPlayerIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all team players
      teamPlayerIds.forEach(id => newSelected.add(id));
    }
    setSelectedPlayers(newSelected);
  };

  const selectByStatus = (status: 'ready' | 'caution' | 'rest') => {
    const newSelected = new Set(selectedPlayers);
    allPlayers
      .filter(p => p.status === status)
      .forEach(p => newSelected.add(p.id));
    setSelectedPlayers(newSelected);
  };

  const clearSelection = () => {
    setSelectedPlayers(new Set());
  };

  const handleAssign = () => {
    onAssign(Array.from(selectedPlayers));
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100';
      case 'caution': return 'text-amber-600 bg-amber-100';
      case 'rest': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLoadColor = (load: number) => {
    if (load >= 100) return 'text-red-600';
    if (load >= 90) return 'text-amber-600';
    if (load >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const renderTeamsTab = () => (
    <div className="space-y-4">
      {MOCK_TEAMS.map(team => {
        const teamPlayerIds = team.players.map(p => p.id);
        const selectedCount = teamPlayerIds.filter(id => selectedPlayers.has(id)).length;
        const allSelected = selectedCount === teamPlayerIds.length;
        const someSelected = selectedCount > 0 && selectedCount < teamPlayerIds.length;

        return (
          <Card key={team.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={() => toggleTeam(team.id)}
                  />
                  <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCount} of {team.players.length} selected
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {team.players.length} players
                </Badge>
              </div>
              
              <div className="space-y-2 ml-7">
                {team.players.map(player => (
                  <div 
                    key={player.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
                      selectedPlayers.has(player.id) && "bg-accent"
                    )}
                    onClick={() => togglePlayer(player.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPlayers.has(player.id)}
                        onCheckedChange={() => togglePlayer(player.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{player.number}
                        </span>
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {player.position}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(player.status))}>
                        {player.status}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Activity className="h-3 w-3" />
                        <span className={cn("font-medium", getLoadColor(player.load))}>
                          {player.load}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderPlayersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'ready' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('ready')}
        >
          Ready
        </Button>
        <Button
          variant={filterStatus === 'caution' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('caution')}
        >
          Caution
        </Button>
        <Button
          variant={filterStatus === 'rest' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('rest')}
        >
          Rest
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredPlayers.map(player => (
            <div 
              key={player.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer",
                selectedPlayers.has(player.id) && "bg-accent border-primary"
              )}
              onClick={() => togglePlayer(player.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedPlayers.has(player.id)}
                  onCheckedChange={() => togglePlayer(player.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    <Badge variant="outline" className="text-xs">
                      #{player.number}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {player.position}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{player.team}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(player.status))}>
                  {player.status}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Activity className="h-3 w-3" />
                  <span className={cn("font-medium", getLoadColor(player.load))}>
                    {player.load}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Player Assignment</DialogTitle>
          <DialogDescription>
            Select players to assign to this training session. {selectedPlayers.size} players selected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByStatus('ready')}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Select All Ready
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              Ready
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              Caution
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              Rest
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teams">By Team</TabsTrigger>
            <TabsTrigger value="players">All Players</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              {renderTeamsTab()}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            {renderPlayersTab()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedPlayers.size > 0 && (
                <span>
                  Selected: {Array.from(selectedPlayers).map(id => {
                    const player = allPlayers.find(p => p.id === id);
                    return player?.name;
                  }).filter(Boolean).slice(0, 3).join(', ')}
                  {selectedPlayers.size > 3 && ` and ${selectedPlayers.size - 3} more`}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={selectedPlayers.size === 0}
              >
                Assign {selectedPlayers.size} Players
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}