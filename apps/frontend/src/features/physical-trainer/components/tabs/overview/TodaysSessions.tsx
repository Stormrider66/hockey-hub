'use client';

import React from 'react';
import { useTranslation } from '@hockey-hub/translations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Users, CheckCircle2 } from 'lucide-react';
import LaunchSessionButton from '../../LaunchSessionButton';
import type { TodaySession } from '../../../types';

interface TodaysSessionsProps {
  sessions: TodaySession[];
  onCreateNew: () => void;
  onLaunchSession: (session: TodaySession) => void;
}

export default function TodaysSessions({ sessions, onCreateNew, onLaunchSession }: TodaysSessionsProps) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('physicalTrainer:dashboard.todaySessions')}</CardTitle>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            {t('physicalTrainer:sessions.newSession')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">{session.time}</div>
                  <div className="text-xs text-muted-foreground">{session.location}</div>
                </div>
                <div className={cn(
                  "h-12 w-1 rounded-full",
                  session.status === 'active' ? 'bg-green-500' : 
                  session.status === 'completed' ? 'bg-gray-500' : 'bg-gray-300'
                )} />
                <div>
                  <div className="font-medium">{session.type}</div>
                  <div className="text-sm text-muted-foreground">{session.team}</div>
                  {session.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{session.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={
                  session.intensity === 'high' ? 'destructive' : 
                  session.intensity === 'medium' ? 'default' : 'secondary'
                }>
                  {t('physicalTrainer:sessions.intensity', { level: t(`physicalTrainer:training.intensity.${session.intensity}`) })}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {session.players}
                </div>
                {session.status === 'completed' ? (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t('physicalTrainer:sessions.status.completed')}
                  </Badge>
                ) : session.status === 'active' ? (
                  <LaunchSessionButton
                    sessionType="team"
                    teamId={session.id.toString()}
                    teamName={session.team}
                    sessionCategory={session.type}
                    size="sm"
                    onLaunch={() => onLaunchSession(session)}
                  />
                ) : (
                  <LaunchSessionButton
                    sessionType="team"
                    teamId={session.id.toString()}
                    teamName={session.team}
                    sessionCategory={session.type}
                    size="sm"
                    variant="outline"
                    onLaunch={() => onLaunchSession(session)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}