'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualizedPlayerListSimple } from '@/features/physical-trainer/components/lists/VirtualizedPlayerListSimple';
import { Player, PlayerReadiness, MedicalRestriction } from '@/features/physical-trainer/types';
import { Search, Users, Activity, Heart } from '@/components/icons';

// Generate mock data for 500+ players
function generateMockPlayers(count: number): Player[] {
  const positions = ['Forward', 'Defense', 'Goalie'];
  const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon'];
  const statuses = ['active', 'injured', 'inactive'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    number: Math.floor(Math.random() * 99) + 1,
    position: positions[Math.floor(Math.random() * positions.length)],
    teamId: `team-${Math.floor(Math.random() * teams.length) + 1}`,
    teamIds: [`team-${Math.floor(Math.random() * teams.length) + 1}`],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    photo: i % 5 === 0 ? `https://i.pravatar.cc/150?img=${i}` : undefined,
    age: Math.floor(Math.random() * 15) + 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

// Generate mock readiness data
function generateMockReadiness(players: Player[]): Record<string, PlayerReadiness> {
  const readinessStates = ['ready', 'caution', 'rest'] as const;
  const fatigueStates = ['low', 'medium', 'high'] as const;
  const trends = ['up', 'down', 'stable'] as const;
  
  return players.reduce((acc, player) => {
    acc[player.id] = {
      id: `readiness-${player.id}`,
      playerId: player.id.toString(),
      name: player.name,
      status: readinessStates[Math.floor(Math.random() * readinessStates.length)],
      load: Math.floor(Math.random() * 100) + 20,
      fatigue: fatigueStates[Math.floor(Math.random() * fatigueStates.length)],
      trend: trends[Math.floor(Math.random() * trends.length)],
      lastUpdated: new Date().toISOString(),
      metrics: {
        hrv: Math.floor(Math.random() * 50) + 50,
        sleepQuality: Math.floor(Math.random() * 100),
        soreness: Math.floor(Math.random() * 10) + 1,
        energy: Math.floor(Math.random() * 100)
      }
    };
    return acc;
  }, {} as Record<string, PlayerReadiness>);
}

// Generate mock restrictions
function generateMockRestrictions(players: Player[]): Record<string, MedicalRestriction[]> {
  const restrictionTypes = ['injury', 'illness', 'precaution'] as const;
  const severities = ['minor', 'moderate', 'severe'] as const;
  
  return players.reduce((acc, player) => {
    // Only 15% of players have restrictions
    if (Math.random() < 0.15) {
      acc[player.id] = [{
        id: `restriction-${player.id}`,
        playerId: player.id.toString(),
        type: restrictionTypes[Math.floor(Math.random() * restrictionTypes.length)],
        description: 'Mock restriction description',
        restrictions: ['No contact', 'Limited running'],
        startDate: new Date().toISOString(),
        severity: severities[Math.floor(Math.random() * severities.length)]
      }];
    }
    return acc;
  }, {} as Record<string, MedicalRestriction[]>);
}

export default function VirtualizedTestPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playerCount, setPlayerCount] = useState(500);
  
  // Generate mock data
  const players = useMemo(() => generateMockPlayers(playerCount), [playerCount]);
  const readiness = useMemo(() => generateMockReadiness(players), [players]);
  const restrictions = useMemo(() => generateMockRestrictions(players), [players]);
  
  const handlePlayerSelect = (playerId: string) => {
    setSelectedIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };
  
  const stats = useMemo(() => {
    const injured = players.filter(p => p.status === 'injured').length;
    const withRestrictions = Object.keys(restrictions).length;
    const ready = Object.values(readiness).filter(r => r.status === 'ready').length;
    
    return { injured, withRestrictions, ready };
  }, [players, restrictions, readiness]);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Virtual Scrolling Test - Player List</CardTitle>
          <p className="text-muted-foreground">
            Testing performance with large datasets using virtual scrolling
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="playerCount" className="text-sm font-medium">
                Number of players:
              </label>
              <Input
                id="playerCount"
                type="number"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value) || 100)}
                className="w-24"
                min={100}
                max={5000}
                step={100}
              />
            </div>
            <Button 
              onClick={() => {
                setSelectedIds([]);
                setSearchTerm('');
              }}
              variant="outline"
            >
              Reset
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Players</p>
                    <p className="text-2xl font-bold">{players.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ready</p>
                    <p className="text-2xl font-bold">{stats.ready}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Restrictions</p>
                    <p className="text-2xl font-bold">{stats.withRestrictions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">
                    <p className="text-sm">Injured</p>
                  </Badge>
                  <p className="text-2xl font-bold">{stats.injured}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name, number, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Selection info */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <p className="font-medium">
                {selectedIds.length} player{selectedIds.length !== 1 ? 's' : ''} selected
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </Button>
            </div>
          )}
          
          {/* Virtualized Player List */}
          <VirtualizedPlayerListSimple
            players={players}
            readiness={readiness}
            restrictions={restrictions}
            selectedIds={selectedIds}
            onPlayerSelect={handlePlayerSelect}
            height={600}
            itemHeight={84}
            searchTerm={searchTerm}
          />
          
          {/* Performance Note */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Performance Note:</strong> This list uses virtual scrolling to efficiently render
              only the visible items. Try scrolling through {playerCount} players - the performance
              remains smooth regardless of the list size.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}