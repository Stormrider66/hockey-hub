'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarEvent } from '@/store/api/calendarApi';

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  status: 'available' | 'unavailable' | 'limited';
  reason?: string;
  limitations?: string[];
  lastTrainingDate?: string;
  weeklyLoad?: number;
}

interface PlayerAvailabilityOverlayProps {
  selectedDate: Date;
  teamId?: string;
  events: CalendarEvent[];
  onPlayerSelect?: (playerId: string) => void;
}

// Mock player availability data - would come from API
const mockPlayerAvailability: PlayerAvailability[] = [
  {
    playerId: '1',
    playerName: 'Connor McDavid',
    status: 'available',
    lastTrainingDate: new Date().toISOString(),
    weeklyLoad: 65,
  },
  {
    playerId: '2',
    playerName: 'Leon Draisaitl',
    status: 'limited',
    reason: 'Minor knee discomfort',
    limitations: ['No high-intensity drills', 'Max 60 minutes'],
    lastTrainingDate: new Date(Date.now() - 86400000).toISOString(),
    weeklyLoad: 45,
  },
  {
    playerId: '3',
    playerName: 'Darnell Nurse',
    status: 'unavailable',
    reason: 'Recovery day - High load yesterday',
    lastTrainingDate: new Date(Date.now() - 86400000).toISOString(),
    weeklyLoad: 85,
  },
  {
    playerId: '4',
    playerName: 'Ryan Nugent-Hopkins',
    status: 'available',
    lastTrainingDate: new Date(Date.now() - 172800000).toISOString(),
    weeklyLoad: 55,
  },
];

export const PlayerAvailabilityOverlay: React.FC<PlayerAvailabilityOverlayProps> = ({
  selectedDate,
  teamId,
  events,
  onPlayerSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'available' | 'limited' | 'unavailable'>('all');

  // Filter players based on selected tab
  const filteredPlayers = mockPlayerAvailability.filter(player => {
    if (selectedTab === 'all') return true;
    return player.status === selectedTab;
  });

  // Count players by status
  const statusCounts = {
    available: mockPlayerAvailability.filter(p => p.status === 'available').length,
    limited: mockPlayerAvailability.filter(p => p.status === 'limited').length,
    unavailable: mockPlayerAvailability.filter(p => p.status === 'unavailable').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'limited':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'limited':
        return 'secondary';
      case 'unavailable':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLoadColor = (load?: number) => {
    if (!load) return 'text-muted-foreground';
    if (load > 80) return 'text-red-500';
    if (load > 60) return 'text-orange-500';
    if (load > 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="p-4 w-full">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Player Availability
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{statusCounts.available}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{statusCounts.limited}</div>
            <div className="text-xs text-muted-foreground">Limited</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{statusCounts.unavailable}</div>
            <div className="text-xs text-muted-foreground">Unavailable</div>
          </Card>
        </div>

        {/* Player List */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({mockPlayerAvailability.length})</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="limited">Limited</TabsTrigger>
            <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.playerId}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onPlayerSelect?.(player.playerId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/api/placeholder/40/40`} />
                          <AvatarFallback>
                            {player.playerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{player.playerName}</span>
                            {getStatusIcon(player.status)}
                          </div>
                          {player.reason && (
                            <p className="text-xs text-muted-foreground">{player.reason}</p>
                          )}
                          {player.limitations && player.limitations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {player.limitations.map((limitation, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {limitation}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={getStatusBadgeVariant(player.status)}>
                          {player.status}
                        </Badge>
                        <div className="space-y-1 mt-2">
                          {player.lastTrainingDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {isSameDay(parseISO(player.lastTrainingDate), new Date()) 
                                ? 'Today' 
                                : format(parseISO(player.lastTrainingDate), 'MMM d')}
                            </div>
                          )}
                          {player.weeklyLoad !== undefined && (
                            <div className="flex items-center text-xs">
                              <Activity className="w-3 h-3 mr-1" />
                              <span className={getLoadColor(player.weeklyLoad)}>
                                {player.weeklyLoad}% load
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Note */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Click on a player to view detailed information
        </div>
      </div>
    </Card>
  );
};

export default PlayerAvailabilityOverlay;