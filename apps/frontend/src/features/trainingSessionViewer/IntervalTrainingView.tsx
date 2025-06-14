import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import IntervalDisplay from './IntervalDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Users, User } from 'lucide-react';

interface IntervalTrainingViewProps {
  teamName?: string;
  socket: Socket | null;
}

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: 'active' | 'rest' | 'completed';
  currentHR?: number;
  avgHR?: number;
  maxHR?: number;
}

// Mock team roster - in real app this would come from API
const mockRoster: Player[] = [
  { id: '1', name: 'Erik Andersson', number: 15, position: 'Forward', status: 'active', currentHR: 165, avgHR: 158, maxHR: 182 },
  { id: '2', name: 'Marcus Lindberg', number: 7, position: 'Defenseman', status: 'active', currentHR: 158, avgHR: 152, maxHR: 175 },
  { id: '3', name: 'Viktor Nilsson', number: 23, position: 'Goalie', status: 'rest', currentHR: 92, avgHR: 145, maxHR: 168 },
  { id: '4', name: 'Johan Bergström', number: 12, position: 'Forward', status: 'active', currentHR: 172, avgHR: 161, maxHR: 185 },
  { id: '5', name: 'Anders Johansson', number: 89, position: 'Forward', status: 'completed', avgHR: 159, maxHR: 181 },
  { id: '6', name: 'Niklas Pettersson', number: 4, position: 'Defenseman', status: 'active', currentHR: 168, avgHR: 157, maxHR: 178 },
  { id: '7', name: 'Oskar Svensson', number: 28, position: 'Forward', status: 'active', currentHR: 175, avgHR: 165, maxHR: 188 },
  { id: '8', name: 'Filip Gustafsson', number: 10, position: 'Forward', status: 'rest', currentHR: 88, avgHR: 148, maxHR: 172 },
  { id: '9', name: 'Carl Eriksson', number: 19, position: 'Defenseman', status: 'active', currentHR: 162, avgHR: 155, maxHR: 176 },
  { id: '10', name: 'Gustav Larsson', number: 31, position: 'Forward', status: 'active', currentHR: 169, avgHR: 160, maxHR: 183 },
  { id: '11', name: 'Emil Nordström', number: 27, position: 'Forward', status: 'rest', currentHR: 95, avgHR: 150, maxHR: 177 },
  { id: '12', name: 'Alexander Berg', number: 14, position: 'Defenseman', status: 'active', currentHR: 171, avgHR: 163, maxHR: 180 },
];

export default function IntervalTrainingView({ teamName = 'A-Team', socket }: IntervalTrainingViewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(mockRoster[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getHRZoneColor = (hr: number | undefined) => {
    if (!hr) return 'text-muted-foreground';
    if (hr < 120) return 'text-blue-500';
    if (hr < 140) return 'text-green-500';
    if (hr < 160) return 'text-yellow-500';
    if (hr < 175) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHRPercentage = (current: number | undefined, max: number | undefined) => {
    if (!current || !max) return null;
    return Math.round((current / max) * 100);
  };

  const getPercentageColor = (percentage: number | null) => {
    if (!percentage) return 'text-muted-foreground';
    if (percentage < 60) return 'text-blue-500';
    if (percentage < 70) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    if (percentage < 90) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: Player['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'rest':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Rest</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
    }
  };

  return (
    <div className="flex h-full">
      {/* Team Roster Sidebar */}
      <div className={cn(
        "border-r bg-muted/30 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 transition-opacity",
              sidebarCollapsed && "opacity-0"
            )}>
              <Users className="h-5 w-5" />
              <h2 className="font-semibold">{teamName} Roster</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-2 pb-4">
            {mockRoster.map((player) => (
              <Card
                key={player.id}
                className={cn(
                  "mb-2 cursor-pointer transition-all hover:shadow-md",
                  selectedPlayer.id === player.id && "ring-2 ring-primary",
                  player.status === 'completed' && "opacity-60"
                )}
                onClick={() => setSelectedPlayer(player)}
              >
                <CardContent className={cn("p-3", sidebarCollapsed && "p-2")}>
                  {sidebarCollapsed ? (
                    <div className="text-center">
                      <div className="font-bold text-lg">{player.number}</div>
                      {player.currentHR && (
                        <>
                          <div className={cn("text-xs font-medium", getHRZoneColor(player.currentHR))}>
                            {player.currentHR}
                          </div>
                          <div className={cn("text-xs", getPercentageColor(getHRPercentage(player.currentHR, player.maxHR)))}>
                            {getHRPercentage(player.currentHR, player.maxHR)}%
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">#{player.number}</span>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.position}</div>
                          </div>
                        </div>
                        {getStatusBadge(player.status)}
                      </div>
                      
                      {player.status !== 'completed' && player.currentHR && (
                        <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                          <div className="text-center">
                            <div className="text-muted-foreground">Current</div>
                            <div className={cn("font-bold text-lg", getHRZoneColor(player.currentHR))}>
                              {player.currentHR}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">% Max</div>
                            <div className={cn("font-bold text-lg", getPercentageColor(getHRPercentage(player.currentHR, player.maxHR)))}>
                              {getHRPercentage(player.currentHR, player.maxHR)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Avg</div>
                            <div className="font-medium text-base">{player.avgHR || '-'}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Max</div>
                            <div className="font-medium text-base">{player.maxHR || '-'}</div>
                          </div>
                        </div>
                      )}
                      
                      {player.status === 'completed' && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Session completed • Avg HR: {player.avgHR} • Max HR: {player.maxHR}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Interval Display */}
      <div className="flex-1 overflow-hidden">
        <IntervalDisplay socket={socket} />
      </div>
    </div>
  );
} 