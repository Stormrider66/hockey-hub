'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Clock,
  Zap,
  Heart,
  CheckCircle,
  XCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  Shield
} from '@/components/icons';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area
} from 'recharts';

import { 
  WorkoutEffectivenessData,
  AnalyticsDashboardFilters,
  WorkoutType,
  ExerciseEffectiveness
} from '../../types/performance-analytics.types';

interface WorkoutEffectivenessMetricsProps {
  data: WorkoutEffectivenessData[];
  filters: AnalyticsDashboardFilters;
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filters: Partial<AnalyticsDashboardFilters>) => void;
}

export function WorkoutEffectivenessMetrics({
  data,
  filters,
  isLoading,
  error,
  onFilterChange
}: WorkoutEffectivenessMetricsProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison' | 'exercises'>('overview');
  const [sortBy, setSortBy] = useState<'effectiveness' | 'improvement' | 'sessions' | 'retention'>('effectiveness');

  // Colors for different workout types
  const workoutColors = {
    strength: '#3B82F6',
    conditioning: '#EF4444',
    hybrid: '#8B5CF6',
    agility: '#F59E0B'
  };

  // Filter data based on selected workout type
  const filteredData = useMemo(() => {
    if (selectedWorkoutType === 'all') return data;
    return data.filter(item => item.workoutType === selectedWorkoutType);
  }, [data, selectedWorkoutType]);

  // Prepare overview comparison data
  const overviewData = useMemo(() => {
    return data.map(item => ({
      type: item.workoutType,
      effectiveness: item.effectiveness.overall,
      improvement: item.improvementRate,
      retention: item.retentionRate,
      sessions: item.totalSessions,
      completion: item.averageCompletion,
      rpe: item.averageRPE,
      intensity: item.averageIntensity
    }));
  }, [data]);

  // Prepare effectiveness breakdown data
  const effectivenessBreakdown = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    const avgEffectiveness = filteredData.reduce((acc, item) => ({
      strength: acc.strength + item.effectiveness.strength,
      conditioning: acc.conditioning + item.effectiveness.conditioning,
      engagement: acc.engagement + item.effectiveness.engagement,
      safety: acc.safety + item.effectiveness.safety,
      progression: acc.progression + item.effectiveness.progression
    }), { strength: 0, conditioning: 0, engagement: 0, safety: 0, progression: 0 });

    const count = filteredData.length;
    
    return [
      { metric: 'Strength', value: avgEffectiveness.strength / count },
      { metric: 'Conditioning', value: avgEffectiveness.conditioning / count },
      { metric: 'Engagement', value: avgEffectiveness.engagement / count },
      { metric: 'Safety', value: avgEffectiveness.safety / count },
      { metric: 'Progression', value: avgEffectiveness.progression / count }
    ];
  }, [filteredData]);

  // Get all exercises from filtered data
  const allExercises = useMemo(() => {
    const exercises = filteredData.flatMap(item => item.topExercises);
    
    // Sort exercises based on selected criteria
    return exercises.sort((a, b) => {
      switch (sortBy) {
        case 'effectiveness':
          return b.playerFeedback - a.playerFeedback;
        case 'improvement':
          return b.averageImprovement - a.averageImprovement;
        case 'sessions':
          return b.frequency - a.frequency;
        case 'retention':
          return b.progressionRate - a.progressionRate;
        default:
          return 0;
      }
    });
  }, [filteredData, sortBy]);

  // Get effectiveness rating
  const getEffectivenessRating = (rating: number) => {
    if (rating >= 8) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (rating >= 7) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (rating >= 6) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (rating >= 5) return { label: 'Below Average', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  // Get improvement trend icon
  const getImprovementIcon = (rate: number) => {
    if (rate > 15) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate > 5) return <Target className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common:loading.loadingWorkoutData')}</p>
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
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {t('physicalTrainer:analytics.workoutEffectiveness.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('physicalTrainer:analytics.workoutEffectiveness.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedWorkoutType} onValueChange={(value: WorkoutType | 'all') => setSelectedWorkoutType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('physicalTrainer:analytics.filters.workoutType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common:filters.allTypes')}</SelectItem>
              <SelectItem value="strength">{t('physicalTrainer:workoutTypes.strength')}</SelectItem>
              <SelectItem value="conditioning">{t('physicalTrainer:workoutTypes.conditioning')}</SelectItem>
              <SelectItem value="hybrid">{t('physicalTrainer:workoutTypes.hybrid')}</SelectItem>
              <SelectItem value="agility">{t('physicalTrainer:workoutTypes.agility')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('physicalTrainer:analytics.viewModes.overview')}
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('detailed')}
            >
              <LineChart className="h-4 w-4 mr-2" />
              {t('physicalTrainer:analytics.viewModes.detailed')}
            </Button>
            <Button
              variant={viewMode === 'exercises' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('exercises')}
            >
              <Activity className="h-4 w-4 mr-2" />
              {t('physicalTrainer:analytics.viewModes.exercises')}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      {viewMode === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {filteredData.map((item) => {
              const effectiveness = getEffectivenessRating(item.effectiveness.overall);
              
              return (
                <Card key={item.workoutType} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: workoutColors[item.workoutType] }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        {t(`physicalTrainer:workoutTypes.${item.workoutType}`)}
                      </CardTitle>
                      <Activity 
                        className="h-5 w-5" 
                        style={{ color: workoutColors[item.workoutType] }}
                      />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Overall Effectiveness */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {t('physicalTrainer:analytics.metrics.effectiveness')}
                        </span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${effectiveness.bgColor} ${effectiveness.color}`}>
                          {effectiveness.label}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>{item.effectiveness.overall.toFixed(1)}/10</span>
                        {getImprovementIcon(item.improvementRate)}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {item.totalSessions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('physicalTrainer:analytics.metrics.sessions')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(item.improvementRate)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('physicalTrainer:analytics.metrics.improvement')}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{t('physicalTrainer:analytics.metrics.completion')}</span>
                          <span>{Math.round(item.averageCompletion)}%</span>
                        </div>
                        <Progress value={item.averageCompletion} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{t('physicalTrainer:analytics.metrics.retention')}</span>
                          <span>{Math.round(item.retentionRate)}%</span>
                        </div>
                        <Progress value={item.retentionRate} className="h-1" />
                      </div>
                    </div>

                    {/* RPE and Intensity */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-semibold">RPE</div>
                        <div className={`${item.averageRPE > 8 ? 'text-red-600' : item.averageRPE > 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.averageRPE.toFixed(1)}/10
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{t('physicalTrainer:analytics.metrics.intensity')}</div>
                        <div className="text-blue-600">
                          {Math.round(item.averageIntensity)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>{t('physicalTrainer:analytics.workoutEffectiveness.comparison.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="effectiveness" fill="#3B82F6" name="Effectiveness" />
                      <Bar dataKey="improvement" fill="#10B981" name="Improvement %" />
                      <Bar dataKey="retention" fill="#F59E0B" name="Retention %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Effectiveness Breakdown */}
            {effectivenessBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('physicalTrainer:analytics.workoutEffectiveness.breakdown.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={effectivenessBreakdown}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis domain={[0, 10]} />
                        <Radar
                          name="Effectiveness"
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
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="trends">{t('physicalTrainer:analytics.detailed.trends')}</TabsTrigger>
            <TabsTrigger value="breakdown">{t('physicalTrainer:analytics.detailed.breakdown')}</TabsTrigger>
            <TabsTrigger value="feedback">{t('physicalTrainer:analytics.detailed.feedback')}</TabsTrigger>
            <TabsTrigger value="recommendations">{t('physicalTrainer:analytics.detailed.recommendations')}</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('physicalTrainer:analytics.trends.effectiveness.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={overviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="sessions" fill="#E5E7EB" name="Sessions" />
                      <Line yAxisId="right" type="monotone" dataKey="effectiveness" stroke="#3B82F6" name="Effectiveness" strokeWidth={3} />
                      <Line yAxisId="right" type="monotone" dataKey="improvement" stroke="#10B981" name="Improvement" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredData.map((item) => (
                <Card key={item.workoutType}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {t(`physicalTrainer:workoutTypes.${item.workoutType}`)} {t('physicalTrainer:analytics.breakdown.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { key: 'strength', value: item.effectiveness.strength, color: '#3B82F6' },
                        { key: 'conditioning', value: item.effectiveness.conditioning, color: '#EF4444' },
                        { key: 'engagement', value: item.effectiveness.engagement, color: '#10B981' },
                        { key: 'safety', value: item.effectiveness.safety, color: '#F59E0B' },
                        { key: 'progression', value: item.effectiveness.progression, color: '#8B5CF6' }
                      ].map((metric) => (
                        <div key={metric.key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{t(`physicalTrainer:analytics.metrics.${metric.key}`)}</span>
                            <span className="font-medium">{metric.value.toFixed(1)}/10</span>
                          </div>
                          <Progress value={metric.value * 10} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredData.map((item) => (
                <Card key={item.workoutType}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center justify-between">
                      {t(`physicalTrainer:workoutTypes.${item.workoutType}`)}
                      <div className="flex items-center space-x-1">
                        {item.averageRPE <= 6 && <ThumbsUp className="h-4 w-4 text-green-600" />}
                        {item.averageRPE > 8 && <ThumbsDown className="h-4 w-4 text-red-600" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t('physicalTrainer:analytics.metrics.avgRPE')}</span>
                        <Badge variant={item.averageRPE > 8 ? 'destructive' : item.averageRPE > 6 ? 'secondary' : 'default'}>
                          {item.averageRPE.toFixed(1)}/10
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t('physicalTrainer:analytics.metrics.completion')}</span>
                        <span className="font-medium">{Math.round(item.averageCompletion)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t('physicalTrainer:analytics.metrics.intensity')}</span>
                        <span className="font-medium">{Math.round(item.averageIntensity)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {filteredData.map((item) => (
                <Card key={item.workoutType}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {t(`physicalTrainer:workoutTypes.${item.workoutType}`)} {t('physicalTrainer:analytics.recommendations.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {item.recommendedAdjustments.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Exercise Analysis */}
      {viewMode === 'exercises' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">
              {t('physicalTrainer:analytics.exercises.title')}
            </h4>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('physicalTrainer:analytics.sorting.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="effectiveness">{t('physicalTrainer:analytics.sorting.effectiveness')}</SelectItem>
                <SelectItem value="improvement">{t('physicalTrainer:analytics.sorting.improvement')}</SelectItem>
                <SelectItem value="sessions">{t('physicalTrainer:analytics.sorting.frequency')}</SelectItem>
                <SelectItem value="retention">{t('physicalTrainer:analytics.sorting.progression')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allExercises.slice(0, 12).map((exercise, index) => (
              <Card key={exercise.exerciseId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{exercise.exerciseName}</CardTitle>
                    <div className="flex items-center space-x-1">
                      {exercise.playerFeedback >= 4 && <Star className="h-4 w-4 text-yellow-500" />}
                      {exercise.injuryRate < 0.05 && <Shield className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {exercise.frequency}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('physicalTrainer:analytics.metrics.uses')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {exercise.averageImprovement.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('physicalTrainer:analytics.metrics.improvement')}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('physicalTrainer:analytics.metrics.feedback')}</span>
                      <span>{exercise.playerFeedback.toFixed(1)}/5</span>
                    </div>
                    <Progress value={exercise.playerFeedback * 20} className="h-2" />
                  </div>

                  {/* Progression Rate */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('physicalTrainer:analytics.metrics.progression')}</span>
                      <span>{Math.round(exercise.progressionRate)}%</span>
                    </div>
                    <Progress value={exercise.progressionRate} className="h-2" />
                  </div>

                  {/* Injury Rate */}
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('physicalTrainer:analytics.metrics.injuryRate')}</span>
                    <Badge variant={exercise.injuryRate > 0.1 ? 'destructive' : exercise.injuryRate > 0.05 ? 'secondary' : 'default'}>
                      {(exercise.injuryRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}