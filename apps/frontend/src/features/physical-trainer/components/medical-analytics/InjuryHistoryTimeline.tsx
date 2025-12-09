import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  AlertCircle,
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  InjuryWithAnalytics, 
  RecoveryTimelineData,
  WorkloadInjuryData,
  MedicalDataAccess,
} from '../../types/medical-analytics.types';
import { useGetPlayerMedicalOverviewQuery } from '@/store/api/medicalApi';
import { useGetPlayerWorkloadHistoryQuery } from '@/store/api/trainingApi';

interface InjuryHistoryTimelineProps {
  playerId: string;
  playerName: string;
  dateRange?: { start: Date; end: Date };
  showPrivateData?: boolean;
  onAccessLog?: (access: Partial<MedicalDataAccess>) => void;
}

export const InjuryHistoryTimeline: React.FC<InjuryHistoryTimelineProps> = ({
  playerId,
  playerName,
  dateRange,
  showPrivateData = false,
  onAccessLog,
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedView, setSelectedView] = useState<'timeline' | 'correlation' | 'details'>('timeline');
  const [selectedInjury, setSelectedInjury] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(!showPrivateData);

  // Fetch medical data
  const { data: medicalData, isLoading: medicalLoading } = useGetPlayerMedicalOverviewQuery(playerId);
  const { data: workloadData, isLoading: workloadLoading } = useGetPlayerWorkloadHistoryQuery({
    playerId,
    startDate: dateRange?.start.toISOString(),
    endDate: dateRange?.end.toISOString(),
  });

  // Log data access for HIPAA compliance
  const logAccess = (accessType: 'view' | 'export' | 'share') => {
    onAccessLog?.({
      userId: 'current-user-id', // Would come from auth context
      userName: 'Current User',
      role: 'physical-trainer',
      accessType,
      dataCategory: 'injury',
      timestamp: new Date().toISOString(),
    });
  };

  // Toggle privacy mode and log access
  const handlePrivacyToggle = () => {
    if (privacyMode) {
      logAccess('view');
    }
    setPrivacyMode(!privacyMode);
  };

  // Process injury timeline data
  const timelineData = useMemo(() => {
    if (!medicalData) return [];

    const allInjuries = [...(medicalData.current_injuries || []), ...(medicalData.injury_history || [])];
    
    return allInjuries.map(injury => {
      const startDate = new Date(injury.injury_date);
      const endDate = injury.expected_return_date ? new Date(injury.expected_return_date) : new Date();
      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: injury.id,
        type: injury.injury_type,
        startDate: injury.injury_date,
        endDate: injury.expected_return_date,
        duration,
        status: injury.recovery_status,
        severity: getSeverityFromDuration(duration),
        y: 1, // For timeline visualization
      };
    });
  }, [medicalData]);

  // Process workload correlation data
  const correlationData = useMemo(() => {
    if (!workloadData || !medicalData) return [];

    return workloadData.map((week: any) => {
      const injuryInWeek = timelineData.find(injury => {
        const injuryDate = new Date(injury.startDate);
        const weekDate = new Date(week.date);
        return Math.abs(injuryDate.getTime() - weekDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
      });

      return {
        week: week.date,
        workload: week.totalLoad,
        acuteChronicRatio: week.acuteChronicRatio || 1.0,
        injuryOccurred: !!injuryInWeek,
        injuryType: injuryInWeek?.type,
      };
    });
  }, [workloadData, medicalData, timelineData]);

  const getSeverityFromDuration = (days: number): 'minor' | 'moderate' | 'severe' => {
    if (days < 7) return 'minor';
    if (days < 30) return 'moderate';
    return 'severe';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-500';
      case 'moderate': return 'bg-orange-500';
      case 'severe': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'recovering': return 'text-yellow-600';
      case 'recovered': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (medicalLoading || workloadLoading) {
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('physicalTrainer:medical.injuryHistory')}
            {privacyMode && (
              <Badge variant="secondary" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                {t('physicalTrainer:medical.privacyMode')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrivacyToggle}
              className="flex items-center gap-1"
            >
              {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {privacyMode ? t('physicalTrainer:medical.showDetails') : t('physicalTrainer:medical.hideDetails')}
            </Button>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">{t('physicalTrainer:medical.timeline')}</SelectItem>
                <SelectItem value="correlation">{t('physicalTrainer:medical.workloadCorrelation')}</SelectItem>
                <SelectItem value="details">{t('physicalTrainer:medical.detailedView')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">{t('physicalTrainer:medical.timeline')}</TabsTrigger>
            <TabsTrigger value="correlation">{t('physicalTrainer:medical.correlation')}</TabsTrigger>
            <TabsTrigger value="details">{t('physicalTrainer:medical.details')}</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="startDate" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length || privacyMode) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{data.type}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(data.startDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm">{data.duration} days</p>
                          <Badge className={cn('mt-1', getSeverityColor(data.severity))}>
                            {data.severity}
                          </Badge>
                        </div>
                      );
                    }}
                  />
                  {timelineData.map((injury, index) => (
                    <ReferenceArea
                      key={injury.id}
                      x1={injury.startDate}
                      x2={injury.endDate || new Date().toISOString()}
                      y1={0}
                      y2={1}
                      fill={getSeverityColor(injury.severity).replace('bg-', '#').replace('500', '300')}
                      fillOpacity={0.3}
                      onClick={() => !privacyMode && setSelectedInjury(injury.id)}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Injury summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{timelineData.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {t('physicalTrainer:medical.totalInjuries')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {timelineData.filter(i => i.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('physicalTrainer:medical.activeInjuries')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Math.round(timelineData.reduce((acc, i) => acc + i.duration, 0) / timelineData.length) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('physicalTrainer:medical.avgRecoveryDays')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">
                            {format(new Date(data.week), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm">Workload: {data.workload}</p>
                          <p className="text-sm">A:C Ratio: {data.acuteChronicRatio.toFixed(2)}</p>
                          {data.injuryOccurred && !privacyMode && (
                            <Badge variant="destructive" className="mt-1">
                              Injury: {data.injuryType}
                            </Badge>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="workload"
                    stroke="#8884d8"
                    name={t('physicalTrainer:medical.workload')}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="acuteChronicRatio"
                    stroke="#82ca9d"
                    name={t('physicalTrainer:medical.acuteChronicRatio')}
                    strokeWidth={2}
                  />
                  <ReferenceLine
                    yAxisId="right"
                    y={1.5}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={t('physicalTrainer:medical.highRiskThreshold')}
                  />
                  {correlationData.filter(d => d.injuryOccurred).map((data, index) => (
                    <ReferenceLine
                      key={index}
                      x={data.week}
                      stroke="red"
                      strokeWidth={2}
                      label={privacyMode ? "" : data.injuryType}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Risk indicators */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-yellow-900">
                    {t('physicalTrainer:medical.workloadAnalysis')}
                  </p>
                  <p className="text-sm text-yellow-800">
                    {t('physicalTrainer:medical.correlationInsight')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {privacyMode ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t('physicalTrainer:medical.privacyModeActive')}
                </p>
                <Button onClick={handlePrivacyToggle} className="mt-4">
                  {t('physicalTrainer:medical.unlockDetails')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineData.map(injury => (
                  <Card key={injury.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{injury.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(injury.startDate), 'MMM dd, yyyy')} - 
                            {injury.endDate ? format(new Date(injury.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={cn(getSeverityColor(injury.severity))}>
                              {injury.severity}
                            </Badge>
                            <span className={cn('text-sm font-medium', getStatusColor(injury.status))}>
                              {injury.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{injury.duration}</p>
                          <p className="text-xs text-muted-foreground">days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};