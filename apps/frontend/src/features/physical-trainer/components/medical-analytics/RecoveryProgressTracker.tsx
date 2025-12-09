import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays } from 'date-fns';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Brain,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  RecoveryTimelineData,
  RecoveryMetrics,
  RecoveryMilestone,
  AssessmentResult,
} from '../../types/medical-analytics.types';
import { useGetPlayerRecoveryDataQuery } from '@/store/api/medicalApi';
import { useGetPlayerTestResultsQuery } from '@/store/api/trainingApi';

interface RecoveryProgressTrackerProps {
  playerId: string;
  injuryId: string;
  baselineData?: RecoveryMetrics;
  targetDate?: Date;
  onMilestoneComplete?: (milestone: RecoveryMilestone) => void;
}

export const RecoveryProgressTracker: React.FC<RecoveryProgressTrackerProps> = ({
  playerId,
  injuryId,
  baselineData,
  targetDate,
  onMilestoneComplete,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedMetric, setSelectedMetric] = useState<keyof RecoveryMetrics>('functionalScore');
  const [showProjections, setShowProjections] = useState(true);

  // Fetch recovery data
  const { data: recoveryData, isLoading } = useGetPlayerRecoveryDataQuery({
    playerId,
    injuryId,
  });
  const { data: testResults } = useGetPlayerTestResultsQuery(playerId);

  // Calculate current recovery status
  const currentStatus = useMemo(() => {
    if (!recoveryData?.timeline?.length) return null;
    
    const latest = recoveryData.timeline[recoveryData.timeline.length - 1];
    const daysElapsed = differenceInDays(new Date(), new Date(recoveryData.timeline[0].date));
    const targetDays = targetDate ? differenceInDays(targetDate, new Date(recoveryData.timeline[0].date)) : 90;
    const progressPercentage = Math.min((daysElapsed / targetDays) * 100, 100);

    return {
      current: latest,
      daysElapsed,
      targetDays,
      progressPercentage,
      onTrack: progressPercentage >= latest.progressPercentage,
    };
  }, [recoveryData, targetDate]);

  // Process recovery metrics for radar chart
  const radarData = useMemo(() => {
    if (!currentStatus?.current?.metrics) return [];

    const current = currentStatus.current.metrics;
    const baseline = baselineData || {
      painLevel: 10,
      mobilityScore: 0,
      strengthScore: 0,
      functionalScore: 0,
      confidenceLevel: 0,
    };

    return [
      {
        metric: t('physicalTrainer:medical.painLevel'),
        current: 10 - current.painLevel, // Invert pain scale
        baseline: 10 - baseline.painLevel,
        target: 9,
      },
      {
        metric: t('physicalTrainer:medical.mobility'),
        current: current.mobilityScore,
        baseline: baseline.mobilityScore,
        target: 95,
      },
      {
        metric: t('physicalTrainer:medical.strength'),
        current: current.strengthScore,
        baseline: baseline.strengthScore,
        target: 90,
      },
      {
        metric: t('physicalTrainer:medical.functional'),
        current: current.functionalScore,
        baseline: baseline.functionalScore,
        target: 95,
      },
      {
        metric: t('physicalTrainer:medical.confidence'),
        current: current.confidenceLevel,
        baseline: baseline.confidenceLevel,
        target: 90,
      },
    ];
  }, [currentStatus, baselineData, t]);

  // Process timeline data for line chart
  const timelineChartData = useMemo(() => {
    if (!recoveryData?.timeline) return [];

    return recoveryData.timeline.map((data: RecoveryTimelineData) => ({
      date: format(new Date(data.date), 'MMM dd'),
      ...data.metrics,
      overall: data.progressPercentage,
    }));
  }, [recoveryData]);

  // Get milestone status
  const getMilestoneStatus = (milestone: RecoveryMilestone) => {
    if (milestone.status === 'completed') return 'completed';
    if (milestone.status === 'in-progress') return 'active';
    if (new Date(milestone.targetDate) < new Date()) return 'overdue';
    return 'pending';
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMetricIcon = (metric: keyof RecoveryMetrics) => {
    switch (metric) {
      case 'painLevel': return <Heart className="h-4 w-4" />;
      case 'mobilityScore': return <Activity className="h-4 w-4" />;
      case 'strengthScore': return <Zap className="h-4 w-4" />;
      case 'functionalScore': return <Target className="h-4 w-4" />;
      case 'confidenceLevel': return <Brain className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">{t('physicalTrainer:medical.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('physicalTrainer:medical.recoveryProgress')}
            </span>
            {currentStatus?.onTrack ? (
              <Badge variant="default" className="bg-green-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('physicalTrainer:medical.onTrack')}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <TrendingDown className="h-3 w-3 mr-1" />
                {t('physicalTrainer:medical.delayed')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Overview */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t('physicalTrainer:medical.overallProgress')}</span>
                <span className="font-medium">{currentStatus?.progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={currentStatus?.progressPercentage || 0} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{t('physicalTrainer:medical.daysElapsed', { days: currentStatus?.daysElapsed })}</span>
                <span>{t('physicalTrainer:medical.targetDays', { days: currentStatus?.targetDays })}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(currentStatus?.current?.metrics || {}).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {getMetricIcon(key as keyof RecoveryMetrics)}
                  </div>
                  <div className="text-2xl font-bold">
                    {key === 'painLevel' ? 10 - value : value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(`physicalTrainer:medical.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:medical.detailedAnalytics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comparison" className="space-y-4">
            <TabsList>
              <TabsTrigger value="comparison">{t('physicalTrainer:medical.comparison')}</TabsTrigger>
              <TabsTrigger value="timeline">{t('physicalTrainer:medical.timeline')}</TabsTrigger>
              <TabsTrigger value="milestones">{t('physicalTrainer:medical.milestones')}</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name={t('physicalTrainer:medical.baseline')}
                      dataKey="baseline"
                      stroke="#e11d48"
                      fill="#e11d48"
                      fillOpacity={0.1}
                    />
                    <Radar
                      name={t('physicalTrainer:medical.current')}
                      dataKey="current"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name={t('physicalTrainer:medical.target')}
                      dataKey="target"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Insights */}
              <Alert>
                <AlertDescription className="space-y-2">
                  <p className="font-medium">{t('physicalTrainer:medical.recoveryInsights')}</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {radarData.filter(d => d.current < d.target * 0.8).map(d => (
                      <li key={d.metric}>
                        {t('physicalTrainer:medical.needsImprovement', { metric: d.metric })}
                      </li>
                    ))}
                    {radarData.filter(d => d.current >= d.target * 0.9).map(d => (
                      <li key={d.metric} className="text-green-600">
                        {t('physicalTrainer:medical.nearTarget', { metric: d.metric })}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {Object.keys(currentStatus?.current?.metrics || {}).map(metric => (
                    <Button
                      key={metric}
                      variant={selectedMetric === metric ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(metric as keyof RecoveryMetrics)}
                      className="flex items-center gap-1"
                    >
                      {getMetricIcon(metric as keyof RecoveryMetrics)}
                      {t(`physicalTrainer:medical.${metric}`)}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjections(!showProjections)}
                >
                  {showProjections ? t('physicalTrainer:medical.hideProjections') : t('physicalTrainer:medical.showProjections')}
                </Button>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name={t(`physicalTrainer:medical.${selectedMetric}`)}
                    />
                    {showProjections && (
                      <Area
                        type="monotone"
                        dataKey="overall"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.1}
                        strokeDasharray="5 5"
                        name={t('physicalTrainer:medical.projectedProgress')}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              {recoveryData?.milestones?.map((milestone: RecoveryMilestone) => {
                const status = getMilestoneStatus(milestone);
                return (
                  <Card key={milestone.id} className={cn(
                    'border-l-4',
                    status === 'completed' && 'border-l-green-500',
                    status === 'active' && 'border-l-blue-500',
                    status === 'overdue' && 'border-l-red-500',
                    status === 'pending' && 'border-l-gray-300'
                  )}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getMilestoneIcon(status)}
                            <h4 className="font-semibold">{milestone.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('physicalTrainer:medical.targetDate')}: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                          </p>
                          {milestone.criteria && (
                            <div className="space-y-1">
                              {milestone.criteria.map((criterion, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <div className={cn(
                                    'h-2 w-2 rounded-full',
                                    criterion.met ? 'bg-green-500' : 'bg-gray-300'
                                  )} />
                                  <span className={cn(
                                    criterion.met && 'line-through text-muted-foreground'
                                  )}>
                                    {criterion.criterion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => onMilestoneComplete?.(milestone)}
                          >
                            {t('physicalTrainer:medical.markComplete')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};