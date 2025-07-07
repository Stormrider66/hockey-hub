'use client';

import React from 'react';
import { useTranslation } from '@hockey-hub/translations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp } from 'lucide-react';
import type { WorkoutSession } from '../../../types';

interface QuickStatsProps {
  todaysSessions: (WorkoutSession & { time: string; players: number })[];
}

export default function QuickStats({ todaysSessions }: QuickStatsProps) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('physicalTrainer:dashboard.quickStats.todaysSessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysSessions.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('physicalTrainer:dashboard.quickStats.totalPlayers', { count: todaysSessions.reduce((acc, s) => acc + s.players, 0) })}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('physicalTrainer:dashboard.quickStats.activeNow')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaysSessions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.players, 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {todaysSessions.find(s => s.status === 'active')?.team || t('physicalTrainer:dashboard.quickStats.noActiveSession')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('physicalTrainer:dashboard.quickStats.playerReadiness')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">78%</div>
            <Badge variant="outline" className="text-xs">
              <ArrowUp className="h-3 w-3 mr-1" />
              +5%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('physicalTrainer:dashboard.quickStats.teamAverage')}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('physicalTrainer:dashboard.quickStats.completedToday')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaysSessions.filter(s => s.status === 'completed').length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('physicalTrainer:dashboard.quickStats.upcoming', { count: todaysSessions.filter(s => s.status === 'upcoming').length })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}