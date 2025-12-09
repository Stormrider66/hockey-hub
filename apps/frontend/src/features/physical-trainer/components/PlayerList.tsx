'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  User, Heart, Zap, Activity, Timer, 
  ArrowLeft, Play, BarChart3 
} from '@/components/icons';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: 'active' | 'rest' | 'injured';
  heartRate?: number;
  watts?: number;
  heartRateZone?: 1 | 2 | 3 | 4 | 5;
}

interface PlayerListProps {
  teamName: string;
  players: Player[];
  metricType: 'heartRate' | 'watts';
  onSelectPlayer: (playerId: string) => void;
  onBack: () => void;
  onStartInterval: () => void;
  onViewMetrics: () => void;
  className?: string;
}

const ZONE_COLORS = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

const ZONE_NAMES = {
  1: 'Recovery',
  2: 'Aerobic',
  3: 'Threshold',
  4: 'Anaerobic',
  5: 'Max',
};

export default function PlayerList({
  teamName,
  players,
  metricType,
  onSelectPlayer,
  onBack,
  onStartInterval,
  onViewMetrics,
  className
}: PlayerListProps) {
  const MetricIcon = metricType === 'heartRate' ? Heart : Zap;
  
  const getMetricValue = (player: Player) => {
    if (metricType === 'heartRate') {
      return player.heartRate ? `${player.heartRate} bpm` : '--';
    }
    return player.watts ? `${player.watts} W` : '--';
  };

  const sortedPlayers = [...players].sort((a, b) => a.number - b.number);

  return (
    <div className={cn("h-full flex flex-col p-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{teamName}</h1>
            <p className="text-xl text-muted-foreground">Select a player or start group activity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={onViewMetrics}
            className="h-14"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Team Metrics
          </Button>
          <Button
            size="lg"
            onClick={onStartInterval}
            className="h-14"
          >
            <Timer className="h-5 w-5 mr-2" />
            Start Interval Timer
          </Button>
        </div>
      </div>

      {/* Player Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedPlayers.map(player => (
            <Card
              key={player.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                player.status === 'injured' && "opacity-60"
              )}
              onClick={() => player.status !== 'injured' && onSelectPlayer(player.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Player Number */}
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold">{player.number}</span>
                  </div>
                  
                  {/* Player Name */}
                  <h3 className="text-xl font-semibold mb-1">{player.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{player.position}</p>
                  
                  {/* Status */}
                  {player.status === 'injured' ? (
                    <Badge variant="destructive" className="mb-4">Injured</Badge>
                  ) : player.status === 'rest' ? (
                    <Badge variant="secondary" className="mb-4">Resting</Badge>
                  ) : null}
                  
                  {/* Metrics */}
                  {player.status === 'active' && (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <MetricIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-medium">{getMetricValue(player)}</span>
                      </div>
                      
                      {player.heartRateZone && metricType === 'heartRate' && (
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            ZONE_COLORS[player.heartRateZone]
                          )} />
                          <span className="text-sm text-muted-foreground">
                            {ZONE_NAMES[player.heartRateZone]}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}