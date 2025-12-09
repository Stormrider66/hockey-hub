'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/OptimizedImage';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Activity,
  Heart,
  AlertCircle,
  Target,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

import { TeamPerformanceData, PlayerPerformanceData, TimePeriod } from '../../types/analytics.types';
import { MetricCard } from './MetricCard';
import { TeamHeatmap } from './TeamHeatmap';

interface TeamOverviewProps {
  data?: TeamPerformanceData;
  players?: PlayerPerformanceData[];
  isLoading: boolean;
  error?: string | null;
  period: TimePeriod;
  onPlayerSelect: (playerId: string) => void;
}

export function TeamOverview({ 
  data, 
  players = [], 
  isLoading, 
  error, 
  period,
  onPlayerSelect 
}: TeamOverviewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="h-40 bg-muted mt-4" />
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
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const readinessData = Object.entries(data.playerDistribution.byReadiness).map(([status, count]) => ({
    name: t(`physicalTrainer:analytics.readiness.${status}`),
    value: count,
    color: status === 'ready' ? '#10b981' : status === 'caution' ? '#f59e0b' : '#ef4444'
  }));

  const workloadData = Object.entries(data.playerDistribution.byWorkload).map(([level, count]) => ({
    name: t(`physicalTrainer:analytics.workload.${level}`),
    value: count,
    color: level === 'optimal' ? '#10b981' : level === 'high' ? '#f59e0b' : '#3b82f6'
  }));

  const positionData = Object.entries(data.playerDistribution.byPosition).map(([position, count]) => ({
    name: position,
    value: count
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard metric={data.metrics.averageAttendance} icon={Users} />
        <MetricCard metric={data.metrics.workloadBalance} icon={Activity} />
        <MetricCard metric={data.metrics.performanceConsistency} icon={Target} />
        <MetricCard metric={data.metrics.injuryRate} icon={Heart} />
        <MetricCard metric={data.metrics.readinessScore} icon={Calendar} />
        <MetricCard metric={data.metrics.progressRate} icon={TrendingUp} />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player Readiness Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {t('physicalTrainer:analytics.charts.readinessDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={readinessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {readinessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {readinessData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {t('physicalTrainer:analytics.charts.workloadDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={workloadData}>
                <RadialBar dataKey="value" fill="#8884d8">
                  {workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RadialBar>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {workloadData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Position Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {t('physicalTrainer:analytics.charts.positionDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={positionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            {t('physicalTrainer:analytics.charts.teamPerformanceHeatmap')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamHeatmap players={players} period={period} />
        </CardContent>
      </Card>

      {/* Top Performers and Needs Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {t('physicalTrainer:analytics.topPerformers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformers.slice(0, 5).map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                  onClick={() => onPlayerSelect(player.playerId)}
                >
                  <div className="flex items-center gap-3">
                    {player.photo ? (
                      <Avatar 
                        src={player.photo} 
                        alt={player.playerName}
                        size="md"
                        priority={false}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {player.playerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{player.playerName}</p>
                      <p className="text-sm text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">
                      {player.metrics.performanceIndex.value}%
                    </p>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {t('physicalTrainer:analytics.needsAttention')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.needsAttention.slice(0, 5).map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                  onClick={() => onPlayerSelect(player.playerId)}
                >
                  <div className="flex items-center gap-3">
                    {player.photo ? (
                      <Avatar 
                        src={player.photo} 
                        alt={player.playerName}
                        size="md"
                        priority={false}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {player.playerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{player.playerName}</p>
                      <p className="text-sm text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      {player.readiness.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {player.metrics.injuryRisk.value}% risk
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}