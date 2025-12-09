'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User,
  Activity,
  Heart,
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { 
  PlayerPerformanceData, 
  LoadManagementData, 
  RecoveryStatusData 
} from '../../types/analytics.types';
import { MetricCard } from './MetricCard';
// TODO: Create these components or use alternatives
// import { LoadManagementChart } from './LoadManagementChart';
// import { RecoveryChart } from './RecoveryChart';
// import { PlayerSelector } from './PlayerSelector';
import { LoadManagementPanel } from './LoadManagementPanel';

interface PlayerAnalyticsProps {
  players?: PlayerPerformanceData[];
  loadManagement?: LoadManagementData[];
  recovery?: RecoveryStatusData[];
  isLoading: boolean;
  error?: string | null;
  selectedPlayerIds: string[];
  onPlayerSelect: (playerIds: string[]) => void;
}

export function PlayerAnalytics({
  players = [],
  loadManagement = [],
  recovery = [],
  isLoading,
  error,
  selectedPlayerIds,
  onPlayerSelect
}: PlayerAnalyticsProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [view, setView] = useState<'single' | 'comparison'>('single');

  // Get selected players or default to first player
  const selectedPlayers = selectedPlayerIds.length > 0 
    ? players.filter(p => selectedPlayerIds.includes(p.playerId))
    : players.slice(0, 1);

  const currentPlayer = selectedPlayers[currentPlayerIndex];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="h-60 bg-muted mt-4" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t('physicalTrainer:analytics.noPlayerSelected')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data
  const radarData = [
    {
      metric: t('physicalTrainer:analytics.metrics.workload'),
      value: currentPlayer.metrics.workloadScore.value,
      fullMark: 100
    },
    {
      metric: t('physicalTrainer:analytics.metrics.performance'),
      value: currentPlayer.metrics.performanceIndex.value,
      fullMark: 100
    },
    {
      metric: t('physicalTrainer:analytics.metrics.recovery'),
      value: currentPlayer.metrics.recoveryScore.value,
      fullMark: 100
    },
    {
      metric: t('physicalTrainer:analytics.metrics.attendance'),
      value: currentPlayer.metrics.attendanceRate.value,
      fullMark: 100
    },
    {
      metric: t('physicalTrainer:analytics.metrics.improvement'),
      value: currentPlayer.metrics.improvementRate.value,
      fullMark: 100
    }
  ];

  // Prepare workout completion trend
  const workoutTrend = currentPlayer.recentExecutions.map((execution, index) => ({
    date: new Date(execution.startTime).toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    }),
    completion: execution.completionPercentage,
    rpe: execution.overallMetrics?.averageRpe || 0
  }));

  return (
    <div className="space-y-6">
      {/* Player Selection Header */}
      <div className="flex items-center justify-between">
        <Select value={selectedPlayerIds[0] || ''} onValueChange={(value) => onPlayerSelect([value])}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t('physicalTrainer:analytics.selectPlayer')} />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.playerId} value={player.playerId}>
                {player.playerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('single')}
          >
            {t('physicalTrainer:analytics.views.single')}
          </Button>
          <Button
            variant={view === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('comparison')}
          >
            {t('physicalTrainer:analytics.views.comparison')}
          </Button>
        </div>
      </div>

      {/* Navigation for single player view */}
      {view === 'single' && selectedPlayers.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPlayerIndex(Math.max(0, currentPlayerIndex - 1))}
            disabled={currentPlayerIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common:navigation.previous')}
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentPlayerIndex + 1} of {selectedPlayers.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPlayerIndex(Math.min(selectedPlayers.length - 1, currentPlayerIndex + 1))}
            disabled={currentPlayerIndex === selectedPlayers.length - 1}
          >
            {t('common:navigation.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {view === 'single' ? (
        // Single Player View
        <div className="space-y-6">
          {/* Player Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {currentPlayer.photo ? (
                  <img 
                    src={currentPlayer.photo}
                    alt={currentPlayer.playerName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{currentPlayer.playerName}</h3>
                  <p className="text-muted-foreground">{currentPlayer.position}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={currentPlayer.readiness.status === 'ready' ? 'default' : 'destructive'}
                    >
                      {currentPlayer.readiness.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Load: {currentPlayer.readiness.load}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {currentPlayer.metrics.performanceIndex.value}%
                  </div>
                  <p className="text-sm text-muted-foreground">Performance Index</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard metric={currentPlayer.metrics.workloadScore} icon={Activity} />
            <MetricCard metric={currentPlayer.metrics.attendanceRate} icon={Calendar} />
            <MetricCard metric={currentPlayer.metrics.performanceIndex} icon={Target} />
            <MetricCard metric={currentPlayer.metrics.recoveryScore} icon={Heart} />
            <MetricCard metric={currentPlayer.metrics.injuryRisk} icon={AlertTriangle} />
            <MetricCard metric={currentPlayer.metrics.improvementRate} icon={TrendingUp} />
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">
                {t('physicalTrainer:analytics.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="performance">
                {t('physicalTrainer:analytics.tabs.performance')}
              </TabsTrigger>
              <TabsTrigger value="load">
                {t('physicalTrainer:analytics.tabs.loadManagement')}
              </TabsTrigger>
              <TabsTrigger value="recovery">
                {t('physicalTrainer:analytics.tabs.recovery')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:analytics.charts.performanceRadar')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis 
                          angle={0} 
                          domain={[0, 100]}
                          tick={false}
                        />
                        <Radar 
                          name="Performance" 
                          dataKey="value" 
                          stroke="#6366f1" 
                          fill="#6366f1" 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Workout Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('physicalTrainer:analytics.charts.workoutStats')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {t('physicalTrainer:analytics.workouts.total')}
                        </span>
                        <span className="font-medium">{currentPlayer.workouts.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {t('physicalTrainer:analytics.workouts.completed')}
                        </span>
                        <span className="font-medium">{currentPlayer.workouts.completed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {t('physicalTrainer:analytics.workouts.missed')}
                        </span>
                        <span className="font-medium">{currentPlayer.workouts.missed}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">
                          {t('physicalTrainer:analytics.workouts.completionRate')}
                        </span>
                        <span className="font-bold text-lg">
                          {currentPlayer.workouts.completionRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:analytics.charts.performanceTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={workoutTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="completion" 
                        fill="#6366f1" 
                        name={t('physicalTrainer:analytics.metrics.completion')}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="rpe" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name={t('physicalTrainer:analytics.metrics.rpe')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load" className="mt-6">
              <LoadManagementPanel 
                players={[currentPlayer]}
                loadData={loadManagement.filter(l => l.playerId === currentPlayer.playerId)} 
                onPlayerSelect={(id) => onPlayerSelect([id])}
              />
            </TabsContent>

            <TabsContent value="recovery" className="mt-6">
              {/* Recovery Chart - TODO: Implement recovery visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:analytics.recovery.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('physicalTrainer:analytics.recovery.comingSoon')}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        // Comparison View
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('physicalTrainer:analytics.playerComparison')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={0} domain={[0, 100]} tick={false} />
                  {selectedPlayers.slice(0, 4).map((player, index) => (
                    <Radar
                      key={player.playerId}
                      name={player.playerName}
                      dataKey="value"
                      stroke={`hsl(${index * 90}, 70%, 50%)`}
                      fill={`hsl(${index * 90}, 70%, 50%)`}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      data={radarData}
                    />
                  ))}
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}