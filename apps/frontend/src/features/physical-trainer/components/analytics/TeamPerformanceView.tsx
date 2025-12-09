'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Heart,
  AlertTriangle,
  Target,
  Calendar,
  Award,
  BarChart3,
  Eye,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { TeamPerformanceData } from '../../types/performance-analytics.types';

interface TeamPerformanceViewProps {
  teams: TeamPerformanceData[];
  isLoading: boolean;
  error: string | null;
  detailed?: boolean;
  selectedTeamIds?: string[];
  onTeamSelect?: (teamId: string) => void;
  onPlayerSelect?: (playerId: string) => void;
}

export const TeamPerformanceView = memo(function TeamPerformanceView({
  teams,
  isLoading,
  error,
  detailed = false,
  selectedTeamIds = [],
  onTeamSelect,
  onPlayerSelect
}: TeamPerformanceViewProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'comparison' | 'trends'>('cards');

  // Colors for charts
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

  // Handle team selection
  const handleTeamClick = useCallback((teamId: string) => {
    setSelectedTeam(teamId);
    onTeamSelect?.(teamId);
  }, [onTeamSelect]);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return teams.map(team => ({
      name: team.teamName,
      attendance: team.metrics.averageAttendance,
      completion: team.metrics.averageCompletionRate,
      wellness: team.metrics.averageWellness,
      readiness: team.metrics.teamReadiness
    }));
  }, [teams]);

  // Prepare workout distribution data
  const workoutDistributionData = useMemo(() => {
    if (!selectedTeam) return [];
    
    const team = teams.find(t => t.teamId === selectedTeam);
    if (!team) return [];

    return [
      { name: 'Strength', value: team.workoutDistribution.strength, color: '#3B82F6' },
      { name: 'Conditioning', value: team.workoutDistribution.conditioning, color: '#EF4444' },
      { name: 'Hybrid', value: team.workoutDistribution.hybrid, color: '#8B5CF6' },
      { name: 'Agility', value: team.workoutDistribution.agility, color: '#F59E0B' }
    ];
  }, [teams, selectedTeam]);

  // Prepare trends data
  const trendsData = useMemo(() => {
    if (!selectedTeam) return [];
    
    const team = teams.find(t => t.teamId === selectedTeam);
    if (!team) return [];

    // Combine all trend data by date
    const dateMap = new Map<string, any>();
    
    // Batch process all trend types to reduce iterations
    const trendTypes = [
      { key: 'strength', data: team.performanceTrends.strength },
      { key: 'conditioning', data: team.performanceTrends.conditioning },
      { key: 'agility', data: team.performanceTrends.agility },
      { key: 'attendance', data: team.performanceTrends.attendance }
    ];
    
    trendTypes.forEach(({ key, data }) => {
      data.forEach(point => {
        const existing = dateMap.get(point.date) || { date: point.date };
        existing[key] = point.average;
        dateMap.set(point.date, existing);
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [teams, selectedTeam]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size={48} className="mx-auto mb-4" />
              <p className="text-muted-foreground">{t('common:loading.loadingTeamData')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View mode selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t('physicalTrainer:analytics.teamPerformance.title')}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Users className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.teamPerformance.viewModes.cards')}
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('comparison')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.teamPerformance.viewModes.comparison')}
          </Button>
          <Button
            variant={viewMode === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('trends')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('physicalTrainer:analytics.teamPerformance.viewModes.trends')}
          </Button>
        </div>
      </div>

      {/* Team Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card 
              key={team.teamId}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTeamIds.includes(team.teamId) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleTeamClick(team.teamId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.teamName}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary">
                      {team.playerCount} players
                    </Badge>
                    {team.metrics.activeInjuries > 0 && (
                      <Badge variant="destructive">
                        {team.metrics.activeInjuries} injured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Team Readiness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center">
                      <Heart className="h-4 w-4 mr-1 text-red-500" />
                      {t('physicalTrainer:analytics.metrics.teamReadiness')}
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(team.metrics.teamReadiness)}%
                    </span>
                  </div>
                  <Progress value={team.metrics.teamReadiness} className="h-2" />
                </div>

                {/* Attendance Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                      {t('physicalTrainer:analytics.metrics.attendance')}
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(team.metrics.averageAttendance * 100)}%
                    </span>
                  </div>
                  <Progress value={team.metrics.averageAttendance * 100} className="h-2" />
                </div>

                {/* Completion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center">
                      <Target className="h-4 w-4 mr-1 text-green-500" />
                      {t('physicalTrainer:analytics.metrics.completion')}
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(team.metrics.averageCompletionRate * 100)}%
                    </span>
                  </div>
                  <Progress value={team.metrics.averageCompletionRate * 100} className="h-2" />
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {team.metrics.totalWorkouts}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('physicalTrainer:analytics.metrics.totalWorkouts')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(team.metrics.averageWellness * 10)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('physicalTrainer:analytics.metrics.avgWellness')}
                    </div>
                  </div>
                </div>

                {detailed && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTeam(team.teamId);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('physicalTrainer:analytics.actions.viewDetails')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Comparison View */}
      {viewMode === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('physicalTrainer:analytics.teamPerformance.comparison.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" fill="#3B82F6" name="Attendance %" />
                  <Bar dataKey="completion" fill="#10B981" name="Completion %" />
                  <Bar dataKey="wellness" fill="#F59E0B" name="Wellness Score" />
                  <Bar dataKey="readiness" fill="#EF4444" name="Readiness %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends View */}
      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Selector for Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('physicalTrainer:analytics.teamPerformance.trends.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {teams.map((team) => (
                  <Button
                    key={team.teamId}
                    variant={selectedTeam === team.teamId ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam(team.teamId)}
                  >
                    {team.teamName}
                  </Button>
                ))}
              </div>
              
              {selectedTeam && trendsData.length > 0 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="strength" 
                        stroke="#3B82F6" 
                        name="Strength"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="conditioning" 
                        stroke="#EF4444" 
                        name="Conditioning"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="agility" 
                        stroke="#F59E0B" 
                        name="Agility"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="#10B981" 
                        name="Attendance"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout Distribution */}
          {selectedTeam && workoutDistributionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('physicalTrainer:analytics.teamPerformance.workoutDistribution.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workoutDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workoutDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Radar Chart */}
          {selectedTeam && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('physicalTrainer:analytics.teamPerformance.radarChart.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      {
                        metric: 'Strength',
                        value: teams.find(t => t.teamId === selectedTeam)?.workoutDistribution.strength || 0
                      },
                      {
                        metric: 'Conditioning',
                        value: teams.find(t => t.teamId === selectedTeam)?.workoutDistribution.conditioning || 0
                      },
                      {
                        metric: 'Agility',
                        value: teams.find(t => t.teamId === selectedTeam)?.workoutDistribution.agility || 0
                      },
                      {
                        metric: 'Attendance',
                        value: (teams.find(t => t.teamId === selectedTeam)?.metrics.averageAttendance || 0) * 100
                      },
                      {
                        metric: 'Completion',
                        value: (teams.find(t => t.teamId === selectedTeam)?.metrics.averageCompletionRate || 0) * 100
                      },
                      {
                        metric: 'Wellness',
                        value: (teams.find(t => t.teamId === selectedTeam)?.metrics.averageWellness || 0) * 100
                      }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Team Performance"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {detailed && selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>{t('physicalTrainer:analytics.teamPerformance.quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                {t('physicalTrainer:analytics.actions.createWorkout')}
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {t('physicalTrainer:analytics.actions.scheduleSession')}
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {t('physicalTrainer:analytics.actions.viewPlayers')}
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('physicalTrainer:analytics.actions.exportReport')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});