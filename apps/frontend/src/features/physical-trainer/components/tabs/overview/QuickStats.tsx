'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp } from 'lucide-react';
import type { WorkoutSession, PlayerReadiness } from '../../../types';

interface QuickStatsProps {
  todaysSessions: (WorkoutSession & { time: string; players: number })[];
  playerReadiness: PlayerReadiness[];
}

export default function QuickStats({ todaysSessions, playerReadiness }: QuickStatsProps) {
  const { t } = useTranslation('physicalTrainer');

  // Calculate player readiness percentage
  const readyPlayers = playerReadiness.filter(p => p.status === 'ready').length;
  const readinessPercentage = playerReadiness.length > 0 
    ? Math.round((readyPlayers / playerReadiness.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('dashboard.quickStats.todaysSessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysSessions.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.quickStats.totalPlayers', { count: todaysSessions.reduce((acc, s) => acc + s.players, 0) })}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('dashboard.quickStats.activeNow')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaysSessions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.players, 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {todaysSessions.filter(s => s.status === 'active').length > 0 
              ? t('dashboard.quickStats.activeSessions', { count: todaysSessions.filter(s => s.status === 'active').length })
              : t('dashboard.quickStats.noActiveSession')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('dashboard.quickStats.playerReadiness')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{readinessPercentage}%</div>
            <Badge variant="outline" className="text-xs">
              <ArrowUp className="h-3 w-3 mr-1" />
              +5%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.quickStats.playersReady', { ready: readyPlayers, total: playerReadiness.length })}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('dashboard.quickStats.completedToday')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaysSessions.filter(s => s.status === 'completed').length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.quickStats.upcoming', { count: todaysSessions.filter(s => s.status === 'upcoming').length })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}