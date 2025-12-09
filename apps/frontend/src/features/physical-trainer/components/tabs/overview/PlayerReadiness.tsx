'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  status: 'ready' | 'caution' | 'rest';
  load: number;
  fatigue: string;
  trend: 'up' | 'down' | 'stable';
}

interface PlayerReadinessProps {
  players: Player[];
  onViewAll?: () => void;
}

export default function PlayerReadiness({ players, onViewAll }: PlayerReadinessProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Player Readiness Status</CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.slice(0, 5).map(player => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  player.status === 'ready' ? 'bg-green-100' : 
                  player.status === 'caution' ? 'bg-amber-100' : 'bg-red-100'
                )}>
                  {player.status === 'ready' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : player.status === 'caution' ? (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Training load: {player.load}% | Fatigue: {player.fatigue}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {player.trend === 'up' ? (
                    <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : player.trend === 'down' ? (
                    <ArrowDown className="h-3 w-3 mr-1 text-red-600" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {player.trend}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}