import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

// Import icons from the project's icon system
import { 
  Activity,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Download,
  Heart,
  Settings,
  Target,
  Timer,
  Users,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Dumbbell,
  Play,
  X
} from '@/components/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  WorkoutSession, 
  Player, 
  PlayerAnalytics, 
  TestResult,
  PlayerReadiness 
} from '../../types';
import { 
  PerformancePrediction, 
  PerformancePredictionService 
} from '../../services/PerformancePrediction.service';
import { AISuggestionEngine, AISuggestion } from '../../services/AISuggestionEngine';

interface PerformanceAnalyticsDashboardProps {
  players: Player[];
  workoutHistory: Map<string, WorkoutSession[]>;
  testResults: Map<string, TestResult[]>;
  playerAnalytics: Map<string, PlayerAnalytics>;
  playerReadiness: Map<string, PlayerReadiness>;
  onExportReport?: (data: any) => void;
  onScheduleAssessment?: (playerId: string, testType: string) => void;
}

interface DashboardMetrics {
  teamPerformance: number;
  improvementRate: number;
  injuryRisk: number;
  complianceRate: number;
  topPerformers: Player[];
  needsAttention: Player[];
}

export const PerformanceAnalyticsDashboard: React.FC<PerformanceAnalyticsDashboardProps> = ({
  players,
  workoutHistory,
  testResults,
  playerAnalytics,
  playerReadiness,
  onExportReport,
  onScheduleAssessment,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedPlayer, setSelectedPlayer] = useState<string | 'team'>('team');
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'strength' | 'endurance' | 'speed' | 'agility'>('overall');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('month');
  const [activeTab, setActiveTab] = useState(0);
  const [predictions, setPredictions] = useState<Map<string, PerformancePrediction>>(new Map());
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const predictionService = useMemo(() => new PerformancePredictionService(), []);
  const aiEngine = useMemo(() => new AISuggestionEngine(), []);

  // Load predictions
  useEffect(() => {
    const loadPredictions = async () => {
      setIsLoading(true);
      try {
        const predictionsMap = await predictionService.predictTeamPerformance(
          players.map(p => p.id.toString()),
          workoutHistory,
          testResults,
          playerAnalytics
        );
        setPredictions(predictionsMap);
      } catch (error) {
        console.error('Failed to load predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPredictions();
  }, [players, workoutHistory, testResults, playerAnalytics, predictionService]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const metrics: DashboardMetrics = {
      teamPerformance: 0,
      improvementRate: 0,
      injuryRisk: 0,
      complianceRate: 0,
      topPerformers: [],
      needsAttention: [],
    };

    let totalPerformance = 0;
    let totalImprovement = 0;
    let highRiskCount = 0;
    let totalSessions = 0;
    let completedSessions = 0;

    players.forEach(player => {
      const playerId = player.id.toString();
      const prediction = predictions.get(playerId);
      const analytics = playerAnalytics.get(playerId);
      const readiness = playerReadiness.get(playerId);

      if (prediction) {
        totalPerformance += prediction.predictions.overall.currentLevel;
        totalImprovement += prediction.predictions.overall.predictedLevel - prediction.predictions.overall.currentLevel;
        
        if (prediction.injuryRisk.level === 'high') highRiskCount++;
      }

      if (analytics) {
        totalSessions += analytics.totalSessions;
        completedSessions += analytics.completedSessions;
      }

      // Identify top performers and those needing attention
      if (readiness && readiness.trend === 'up' && readiness.load > 80) {
        metrics.topPerformers.push(player);
      }
      if (readiness && (readiness.status === 'rest' || readiness.fatigue === 'high')) {
        metrics.needsAttention.push(player);
      }
    });

    metrics.teamPerformance = players.length > 0 ? totalPerformance / players.length : 0;
    metrics.improvementRate = players.length > 0 ? totalImprovement / players.length : 0;
    metrics.injuryRisk = players.length > 0 ? (highRiskCount / players.length) * 100 : 0;
    metrics.complianceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return metrics;
  }, [players, predictions, playerAnalytics, playerReadiness]);

  // Get performance trend data
  const getPerformanceTrendData = () => {
    if (selectedPlayer === 'team') {
      // Team average trends
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      return dates.map(date => {
        let totalLoad = 0;
        let playerCount = 0;

        players.forEach(player => {
          const analytics = playerAnalytics.get(player.id.toString());
          if (analytics && analytics.workloadTrend.length > 0) {
            // Simulate daily load (in real app, this would come from actual data)
            totalLoad += 60 + Math.random() * 40;
            playerCount++;
          }
        });

        return {
          date,
          load: playerCount > 0 ? totalLoad / playerCount : 0,
          optimal: 75,
        };
      });
    } else {
      // Individual player trends
      const analytics = playerAnalytics.get(selectedPlayer);
      if (!analytics) return [];

      return analytics.workloadTrend.map((load, index) => ({
        date: `Day ${index + 1}`,
        load,
        optimal: 75,
      }));
    }
  };

  // Get performance radar data
  const getPerformanceRadarData = () => {
    if (selectedPlayer === 'team') {
      // Team average
      const areas = ['strength', 'endurance', 'speed', 'agility', 'recovery'];
      return areas.map(area => {
        let total = 0;
        let count = 0;

        predictions.forEach(prediction => {
          if (prediction.predictions[area]) {
            total += prediction.predictions[area].currentLevel;
            count++;
          }
        });

        return {
          area: t(`metrics.${area}`),
          current: count > 0 ? total / count : 0,
          target: 85,
        };
      });
    } else {
      // Individual player
      const prediction = predictions.get(selectedPlayer);
      if (!prediction) return [];

      return Object.entries(prediction.predictions)
        .filter(([key]) => key !== 'overall')
        .map(([area, data]) => ({
          area: t(`metrics.${area}`),
          current: data.currentLevel,
          predicted: data.predictedLevel,
          target: 85,
        }));
    }
  };

  // Get injury risk distribution
  const getInjuryRiskData = () => {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    predictions.forEach(prediction => {
      distribution[prediction.injuryRisk.level]++;
    });

    return [
      { name: t('risk.low'), value: distribution.low, color: '#10b981' },
      { name: t('risk.medium'), value: distribution.medium, color: '#f59e0b' },
      { name: t('risk.high'), value: distribution.high, color: '#ef4444' },
    ];
  };

  // Render metric card
  const renderMetricCard = (
    title: string, 
    value: number | string, 
    trend?: 'up' | 'down' | 'flat',
    color?: string,
    icon?: React.ReactNode
  ) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold" style={{ color }}>
              {typeof value === 'number' ? value.toFixed(1) : value}
              {title.includes('%') ? '%' : ''}
            </p>
          </div>
          <div className="flex flex-col items-end">
            {icon}
            {trend && (
              trend === 'up' ? <ChevronUp className="w-5 h-5 text-green-500" /> :
              trend === 'down' ? <ChevronDown className="w-5 h-5 text-red-500" /> :
              <Activity className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render prediction insights
  const renderPredictionInsights = () => {
    if (selectedPlayer === 'team') return null;

    const prediction = predictions.get(selectedPlayer);
    if (!prediction) return null;

    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('analytics.predictions')}</h3>
            <Badge 
              variant={prediction.confidence > 80 ? 'default' : 'secondary'}
              className={cn(
                prediction.confidence > 80 ? 'bg-green-500' : 'bg-yellow-500'
              )}
            >
              {prediction.confidence}% {t('analytics.confidence')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(prediction.predictions)
              .filter(([key]) => key !== 'overall')
              .map(([area, data]) => (
                <div key={area} className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {t(`metrics.${area}`)}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={data.currentLevel} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Current: {data.currentLevel.toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex-1">
                      <Progress value={data.predictedLevel} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Predicted: {data.predictedLevel.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {data.trend === 'improving' && (
                      <Badge variant="default" className="bg-green-500">
                        {t('analytics.improving')}
                      </Badge>
                    )}
                    {data.trend === 'declining' && (
                      <Badge variant="destructive">
                        {t('analytics.declining')}
                      </Badge>
                    )}
                    {data.trend === 'maintaining' && (
                      <Badge variant="secondary">
                        {t('analytics.maintaining')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Next milestone */}
          {prediction.nextMilestone && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {t('analytics.nextMilestone')}
              </p>
              <p className="text-lg font-semibold text-primary">
                {prediction.nextMilestone.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('analytics.targetDate')}: {new Date(prediction.nextMilestone.targetDate).toLocaleDateString()}
              </p>
              <Progress 
                value={prediction.nextMilestone.probability} 
                className="h-2 mt-2"
              />
              <p className="text-xs mt-1">
                {prediction.nextMilestone.probability}% {t('analytics.probability')}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {prediction.recommendations.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">
                {t('analytics.recommendations')}
              </p>
              <div className="space-y-2">
                {prediction.recommendations.slice(0, 3).map((rec, index) => (
                  <Alert
                    key={index}
                    className={cn(
                      "flex items-start gap-2",
                      rec.priority === 'high' ? 'border-yellow-500' : 'border-blue-500'
                    )}
                  >
                    <Zap className="w-4 h-4 mt-0.5" />
                    <p className="text-sm">{rec.description}</p>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('analytics.performanceDashboard')}</h2>
        
        <div className="flex gap-4">
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('analytics.selectPlayer')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('analytics.teamOverview')}
                </div>
              </SelectItem>
              {players.map(player => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.name} (#{player.number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('analytics.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('analytics.week')}</SelectItem>
              <SelectItem value="month">{t('analytics.month')}</SelectItem>
              <SelectItem value="season">{t('analytics.season')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => onExportReport?.({ metrics: dashboardMetrics, predictions })}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.export')}
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {renderMetricCard(
          t('analytics.teamPerformance'),
          dashboardMetrics.teamPerformance,
          dashboardMetrics.improvementRate > 0 ? 'up' : 'down',
          '#3b82f6',
          <BarChart3 className="w-5 h-5 text-blue-500" />
        )}
        {renderMetricCard(
          t('analytics.improvementRate'),
          dashboardMetrics.improvementRate,
          dashboardMetrics.improvementRate > 0 ? 'up' : 'down',
          '#10b981',
          <ChevronUp className="w-5 h-5 text-green-500" />
        )}
        {renderMetricCard(
          t('analytics.injuryRisk'),
          dashboardMetrics.injuryRisk,
          dashboardMetrics.injuryRisk > 20 ? 'up' : 'down',
          dashboardMetrics.injuryRisk > 20 ? '#ef4444' : '#10b981',
          <AlertCircle className={cn(
            "w-5 h-5",
            dashboardMetrics.injuryRisk > 20 ? 'text-red-500' : 'text-green-500'
          )} />
        )}
        {renderMetricCard(
          t('analytics.compliance'),
          dashboardMetrics.complianceRate,
          dashboardMetrics.complianceRate > 85 ? 'up' : 'down',
          dashboardMetrics.complianceRate > 85 ? '#10b981' : '#f59e0b',
          <CheckCircle2 className={cn(
            "w-5 h-5",
            dashboardMetrics.complianceRate > 85 ? 'text-green-500' : 'text-yellow-500'
          )} />
        )}
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab.toString()} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="0" onClick={() => setActiveTab(0)}>
            {t('analytics.performance')}
          </TabsTrigger>
          <TabsTrigger value="1" onClick={() => setActiveTab(1)}>
            {t('analytics.predictions')}
          </TabsTrigger>
          <TabsTrigger value="2" onClick={() => setActiveTab(2)}>
            {t('analytics.riskAssessment')}
          </TabsTrigger>
          <TabsTrigger value="3" onClick={() => setActiveTab(3)}>
            {t('analytics.teamComparison')}
          </TabsTrigger>
        </TabsList>

        {/* Tab content */}
        <TabsContent value="0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance trend */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.performanceTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="load"
                        stroke="#3b82f6"
                        name={t('analytics.trainingLoad')}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="optimal"
                        stroke="#10b981"
                        name={t('analytics.optimal')}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance radar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.performanceRadar')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getPerformanceRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="area" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name={t('analytics.current')}
                        dataKey="current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name={t('analytics.target')}
                        dataKey="target"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top performers and needs attention */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.topPerformers')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardMetrics.topPerformers.slice(0, 5).map(player => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-green-500">
                            <span className="text-white font-bold">{player.number}</span>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">{player.position}</p>
                          </div>
                        </div>
                        <ChevronUp className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.needsAttention')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardMetrics.needsAttention.slice(0, 5).map(player => {
                      const readiness = playerReadiness.get(player.id.toString());
                      return (
                        <div key={player.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-yellow-500">
                              <span className="text-white font-bold">{player.number}</span>
                            </Avatar>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {readiness?.status === 'rest' ? t('status.needsRest') : t('status.highFatigue')}
                              </p>
                            </div>
                          </div>
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="1">
          {renderPredictionInsights()}
        </TabsContent>

        <TabsContent value="2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Injury risk distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.injuryRiskDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getInjuryRiskData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getInjuryRiskData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk factors table */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.riskFactors')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('analytics.player')}</TableHead>
                      <TableHead>{t('analytics.riskLevel')}</TableHead>
                      <TableHead>{t('analytics.primaryFactor')}</TableHead>
                      <TableHead>{t('analytics.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(predictions.entries())
                      .filter(([_, pred]) => pred.injuryRisk.level !== 'low')
                      .slice(0, 5)
                      .map(([playerId, prediction]) => {
                        const player = players.find(p => p.id.toString() === playerId);
                        return (
                          <TableRow key={playerId}>
                            <TableCell>{player?.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={prediction.injuryRisk.level === 'high' ? 'destructive' : 'secondary'}
                                className={cn(
                                  prediction.injuryRisk.level === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                )}
                              >
                                {prediction.injuryRisk.level}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {prediction.injuryRisk.factors[0]?.name || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onScheduleAssessment?.(playerId, 'medical')}
                              >
                                {t('analytics.assess')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="3">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.teamComparison')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('analytics.comingSoon')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};