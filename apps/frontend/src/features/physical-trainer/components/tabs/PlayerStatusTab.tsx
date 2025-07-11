'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Heart, Zap, Activity } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  status: 'ready' | 'caution' | 'rest';
  load: number;
  fatigue: string;
  trend: 'up' | 'down' | 'stable';
}

interface PlayerStatusTabProps {
  selectedTeamId: string | null;
  playerReadiness: Player[];
}

export default function PlayerStatusTab({ selectedTeamId, playerReadiness }: PlayerStatusTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:playerStatus.title')}</CardTitle>
          <CardDescription>{t('physicalTrainer:playerStatus.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerReadiness.map(player => (
              <Card key={player.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        player.status === 'ready' ? 'bg-green-100' : 
                        player.status === 'caution' ? 'bg-amber-100' : 'bg-red-100'
                      )}>
                        {player.status === 'ready' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : player.status === 'caution' ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('physicalTrainer:playerStatus.statusLabel')}: {t(`physicalTrainer:playerStatus.${player.status}`)} | {t('physicalTrainer:playerStatus.fatigueLabel')}: {player.fatigue}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      {t('common:actions.viewDetails')}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('physicalTrainer:playerStatus.trainingLoad')}</span>
                      <span className="font-medium">{player.load}%</span>
                    </div>
                    <Progress value={player.load} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.hrVariability')}</div>
                        <div className="text-sm font-medium">{t('physicalTrainer:playerStatus.normal')}</div>
                      </div>
                      <div className="text-center">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.powerOutput')}</div>
                        <div className="text-sm font-medium">95%</div>
                      </div>
                      <div className="text-center">
                        <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.recovery')}</div>
                        <div className="text-sm font-medium">{t('physicalTrainer:playerStatus.good')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}