'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Video, Gamepad2 } from '@/components/icons';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import dynamic from 'next/dynamic';
import type { UpcomingGame, SpecialTeamsStats } from '../../types/coach-dashboard.types';
import { upcomingGames, specialTeamsStats } from '../../constants/mock-data';

// Dynamically import PlaySystemEditor to avoid SSR issues with Pixi.js
const PlaySystemEditor = dynamic(
  () => import('../tactical/PlaySystemEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tactical board..." />
      </div>
    ),
  }
);

interface GamesTabProps {
  selectedTeamId: string | null;
}

export function GamesTab({ selectedTeamId }: GamesTabProps) {
  return (
    <div className="space-y-6">
      {/* Upcoming Games */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Game Schedule & Preparation</CardTitle>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Full Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tactical Planning */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Tactical Board</CardTitle>
          <CardDescription>Draw plays and strategies for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <PlaySystemEditor teamId={selectedTeamId || undefined} />
        </CardContent>
      </Card>

      {/* Special Teams Analysis */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <SpecialTeamsCard stats={specialTeamsStats} />
      </div>
    </div>
  );
}

function GameCard({ game }: { game: UpcomingGame }) {
  const gameDate = new Date(game.date);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {gameDate.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-2xl font-bold">{gameDate.getDate()}</p>
              <p className="text-xs text-muted-foreground">
                {gameDate.toLocaleDateString('en-US', { month: 'short' })}
              </p>
            </div>
            <div className="h-16 w-0.5 bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{game.opponent}</h3>
                <Badge variant={game.importance === 'Playoff' ? 'destructive' : 'secondary'}>
                  {game.importance}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {game.location} • {game.venue} • {game.time}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recent form: {game.record} • Key player: {game.keyPlayer}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Scout Report
            </Button>
            <Button size="sm">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Game Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SpecialTeamsCard({ stats }: { stats: SpecialTeamsStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Teams Analysis</CardTitle>
        <CardDescription>Power play and penalty kill performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Power Play */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Power Play</h4>
              <Badge variant={stats.powerPlay.trend === 'up' ? 'default' : 'secondary'}>
                {stats.powerPlay.percentage}%
              </Badge>
            </div>
            <Progress value={stats.powerPlay.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.powerPlay.goals} goals on {stats.powerPlay.opportunities} opportunities
            </p>
          </div>

          {/* Penalty Kill */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Penalty Kill</h4>
              <Badge variant="secondary">{stats.penaltyKill.percentage}%</Badge>
            </div>
            <Progress value={stats.penaltyKill.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.penaltyKill.goalsAllowed} goals allowed on {stats.penaltyKill.timesShorthanded}{' '}
              times shorthanded
            </p>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">PP Rank</p>
              <p className="text-xl font-bold">8th</p>
              <p className="text-xs text-green-600">↑ 2 from last month</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">PK Rank</p>
              <p className="text-xl font-bold">14th</p>
              <p className="text-xs text-gray-600">— No change</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GamesTab;



