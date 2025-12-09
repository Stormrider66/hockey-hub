'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  player: {
    id: number;
    name: string;
    status: 'ready' | 'caution' | 'rest';
    load: number;
    fatigue: string;
    trend: 'up' | 'down' | 'stable';
  };
  medicalStatus?: 'healthy' | 'limited' | 'injured';
  restrictions?: string[];
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  open,
  onClose,
  player,
  medicalStatus = 'healthy',
  restrictions = []
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  const trendIcon = useMemo(() => {
    switch (player.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  }, [player.trend]);

  // Mock data for demonstration
  const mockStats = {
    lastWorkout: '2 days ago',
    weeklyVolume: 85,
    monthlyProgress: 12,
    nextScheduled: 'Tomorrow, 10:00 AM',
    avgHeartRate: 145,
    maxPower: 320,
    vo2Max: 58.5,
    recentTests: [
      { test: 'Vertical Jump', value: '65.5 cm', date: '2024-08-15', change: '+5.6%' },
      { test: 'Bench Press 1RM', value: '120 kg', date: '2024-08-15', change: '+4.3%' },
      { test: 'Sprint 30m', value: '4.12 s', date: '2024-11-20', change: '-1.4%' }
    ],
    workoutHistory: [
      { date: '2024-01-20', type: 'Strength', duration: '45 min', completion: 100 },
      { date: '2024-01-18', type: 'Conditioning', duration: '30 min', completion: 95 },
      { date: '2024-01-16', type: 'Recovery', duration: '20 min', completion: 100 }
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{player.name}</span>
            <Badge 
              variant={player.status === 'ready' ? 'success' : player.status === 'caution' ? 'warning' : 'destructive'}
            >
              {t(`physicalTrainer:playerStatus.${player.status}`)}
            </Badge>
            {medicalStatus !== 'healthy' && (
              <Badge 
                variant={medicalStatus === 'injured' ? 'destructive' : 'warning'}
                className="flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {t(`physicalTrainer:medical.status.${medicalStatus}`)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t('physicalTrainer:playerDetails.lastUpdated', { time: 'Just now' })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('physicalTrainer:playerDetails.overview')}</TabsTrigger>
            <TabsTrigger value="performance">{t('physicalTrainer:playerDetails.performance')}</TabsTrigger>
            <TabsTrigger value="history">{t('physicalTrainer:playerDetails.history')}</TabsTrigger>
            <TabsTrigger value="schedule">{t('physicalTrainer:playerDetails.schedule')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Current Status Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerStatus.trainingLoad')}</p>
                      <p className="text-2xl font-bold">{player.load}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Progress value={player.load} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerStatus.fatigue')}</p>
                      <p className="text-2xl font-bold capitalize">{player.fatigue}</p>
                    </div>
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">{t('physicalTrainer:playerDetails.trend')}:</span>
                    {trendIcon}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerDetails.weeklyVolume')}</p>
                      <p className="text-2xl font-bold">{mockStats.weeklyVolume}%</p>
                    </div>
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('physicalTrainer:playerDetails.monthlyProgress', { value: mockStats.monthlyProgress })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Medical Restrictions */}
            {restrictions.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    {t('physicalTrainer:medical.activeRestrictions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {restrictions.map((restriction, index) => (
                      <li key={index} className="text-sm">• {restriction}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('physicalTrainer:playerDetails.keyMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerDetails.avgHeartRate')}</p>
                    <p className="text-xl font-semibold">{mockStats.avgHeartRate} bpm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerDetails.maxPower')}</p>
                    <p className="text-xl font-semibold">{mockStats.maxPower} W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:playerDetails.vo2Max')}</p>
                    <p className="text-xl font-semibold">{mockStats.vo2Max}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('physicalTrainer:playerDetails.recentTests')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStats.recentTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{test.test}</p>
                        <p className="text-sm text-muted-foreground">{test.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{test.value}</p>
                        <p className={cn(
                          "text-sm",
                          test.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        )}>
                          {test.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('physicalTrainer:playerDetails.workoutHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStats.workoutHistory.map((workout, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{workout.type}</p>
                          <p className="text-sm text-muted-foreground">{workout.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{workout.duration}</span>
                        <Badge variant={workout.completion === 100 ? 'success' : 'warning'}>
                          {workout.completion}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('physicalTrainer:playerDetails.upcomingSchedule')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{t('physicalTrainer:playerDetails.nextWorkout')}</p>
                    <p className="text-sm text-muted-foreground">{mockStats.nextScheduled}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {t('physicalTrainer:playerDetails.lastWorkout', { time: mockStats.lastWorkout })}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('common:actions.close')}
          </Button>
          <Button>
            {t('physicalTrainer:playerDetails.createWorkout')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};