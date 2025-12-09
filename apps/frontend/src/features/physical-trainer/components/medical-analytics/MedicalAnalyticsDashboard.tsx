'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'; // TODO: Component needs to be created
import {
  Activity,
  AlertTriangle,
  Heart,
  Shield,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Target,
  Clock,
  AlertCircle,
  Download,
  Settings,
  Filter,
  Brain,
  Zap
} from '@/components/icons';

// Import additional icons from lucide-react that aren't in the custom icon system yet
import {
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Award,
  RefreshCw,
  Stethoscope,
  Clipboard,
  LineChart
} from 'lucide-react';

import { InjuryPatternAnalyzer } from './InjuryPatternAnalyzer';
import { RecoveryProgressMonitor } from './RecoveryProgressMonitor';
import { ReturnToPlayDashboard } from './ReturnToPlayDashboard';
import { MedicalRiskAssessment } from './MedicalRiskAssessment';
import { MedicalAlertPanel } from './MedicalAlertPanel';
import { RehabilitationTracker } from './RehabilitationTracker';

// Types based on backend services
export interface MedicalAnalyticsData {
  teamMedicalOverview: {
    totalPlayers: number;
    healthyPlayers: number;
    injuredPlayers: number;
    recoveringPlayers: number;
    limitedPlayers: number;
    averageInjuryRisk: number;
    totalActiveInjuries: number;
    playerSummaries: Array<{
      playerId: string;
      playerName: string;
      activeInjuries: number;
      recoveryProtocols: number;
      injuryRiskScore: number;
      medicalStatus: 'healthy' | 'injured' | 'recovering' | 'limited';
      clearanceLevel: 'full' | 'limited' | 'restricted' | 'no_clearance';
      performanceImpact: number;
    }>;
  };
  
  injuryTrendAnalysis: {
    totalInjuries: number;
    injuryRate: number;
    commonInjuryTypes: Array<{
      type: string;
      bodyPart: string;
      count: number;
      averageSeverity: number;
      averageRecoveryDays: number;
    }>;
    seasonalPatterns: Array<{
      month: number;
      injuryCount: number;
      severity: number;
    }>;
    workloadCorrelations: Array<{
      loadPattern: string;
      injuryRisk: number;
      correlationStrength: number;
    }>;
  };
  
  recoveryAnalytics: {
    averageRecoveryTime: number;
    recoverySuccessRate: number;
    protocolCompliance: number;
    phaseBreakdown: Array<{
      phase: string;
      averageDays: number;
      successRate: number;
      commonSetbacks: string[];
    }>;
    performanceReturnRates: {
      speed: number;
      power: number;
      endurance: number;
      agility: number;
      strength: number;
      overall: number;
    };
    psychologicalReadiness: number;
    reinjuryRate: number;
  };
  
  medicalAlerts: Array<{
    alertId: string;
    playerId: string;
    alertType: 'injury_risk' | 'recovery_setback' | 'clearance_needed' | 'compliance_issue' | 'performance_decline';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    recommendedAction: string;
    createdAt: Date;
    isResolved: boolean;
  }>;
  
  performanceCorrelations: Array<{
    factor: string;
    performanceCorrelation: number;
    significance: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
}

export interface MedicalAnalyticsDashboardProps {
  teamId?: string;
  playerId?: string;
  initialDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  viewMode?: 'team' | 'individual';
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

// Mock data generator based on backend service interfaces
const generateMockAnalyticsData = (teamId?: string, playerId?: string): MedicalAnalyticsData => {
  return {
    teamMedicalOverview: {
      totalPlayers: 25,
      healthyPlayers: 18,
      injuredPlayers: 3,
      recoveringPlayers: 2,
      limitedPlayers: 2,
      averageInjuryRisk: 35,
      totalActiveInjuries: 5,
      playerSummaries: [
        {
          playerId: 'player-1',
          playerName: 'Sidney Crosby',
          activeInjuries: 1,
          recoveryProtocols: 1,
          injuryRiskScore: 78,
          medicalStatus: 'injured',
          clearanceLevel: 'restricted',
          performanceImpact: 15
        },
        {
          playerId: 'player-2',
          playerName: 'Nathan MacKinnon',
          activeInjuries: 0,
          recoveryProtocols: 1,
          injuryRiskScore: 45,
          medicalStatus: 'limited',
          clearanceLevel: 'limited',
          performanceImpact: 8
        },
        {
          playerId: 'player-3',
          playerName: 'Connor McDavid',
          activeInjuries: 0,
          recoveryProtocols: 0,
          injuryRiskScore: 25,
          medicalStatus: 'healthy',
          clearanceLevel: 'full',
          performanceImpact: 0
        }
      ]
    },
    
    injuryTrendAnalysis: {
      totalInjuries: 42,
      injuryRate: 12.5,
      commonInjuryTypes: [
        { type: 'Muscle Strain', bodyPart: 'Hamstring', count: 8, averageSeverity: 2.3, averageRecoveryDays: 14 },
        { type: 'Joint Sprain', bodyPart: 'Ankle', count: 6, averageSeverity: 2.8, averageRecoveryDays: 21 },
        { type: 'Concussion', bodyPart: 'Head', count: 5, averageSeverity: 3.2, averageRecoveryDays: 10 },
        { type: 'Shoulder Injury', bodyPart: 'Shoulder', count: 4, averageSeverity: 2.5, averageRecoveryDays: 28 }
      ],
      seasonalPatterns: [
        { month: 9, injuryCount: 8, severity: 2.1 },
        { month: 10, injuryCount: 12, severity: 2.4 },
        { month: 11, injuryCount: 10, severity: 2.2 },
        { month: 12, injuryCount: 6, severity: 1.8 },
        { month: 1, injuryCount: 4, severity: 1.9 },
        { month: 2, injuryCount: 2, severity: 1.5 }
      ],
      workloadCorrelations: [
        { loadPattern: 'High intensity spikes', injuryRisk: 85, correlationStrength: 0.73 },
        { loadPattern: 'Insufficient recovery', injuryRisk: 78, correlationStrength: 0.68 },
        { loadPattern: 'Training monotony', injuryRisk: 62, correlationStrength: 0.54 },
        { loadPattern: 'Acute load increase', injuryRisk: 71, correlationStrength: 0.61 }
      ]
    },
    
    recoveryAnalytics: {
      averageRecoveryTime: 18.5,
      recoverySuccessRate: 87,
      protocolCompliance: 82,
      phaseBreakdown: [
        { phase: 'Acute', averageDays: 5, successRate: 95, commonSetbacks: ['Pain flare-up', 'Swelling'] },
        { phase: 'Subacute', averageDays: 8, successRate: 88, commonSetbacks: ['Range of motion loss', 'Strength deficits'] },
        { phase: 'Recovery', averageDays: 12, successRate: 82, commonSetbacks: ['Psychological barriers', 'Function plateaus'] },
        { phase: 'Return to Play', averageDays: 6, successRate: 90, commonSetbacks: ['Confidence issues', 'Performance anxiety'] }
      ],
      performanceReturnRates: {
        speed: 92,
        power: 89,
        endurance: 94,
        agility: 87,
        strength: 91,
        overall: 90
      },
      psychologicalReadiness: 78,
      reinjuryRate: 12
    },
    
    medicalAlerts: [
      {
        alertId: 'alert-1',
        playerId: 'player-1',
        alertType: 'injury_risk',
        severity: 'critical',
        title: 'Critical Injury Risk Detected',
        description: 'Player showing 85% injury risk score with multiple risk factors',
        recommendedAction: 'Immediate medical evaluation and workload reduction',
        createdAt: new Date(),
        isResolved: false
      },
      {
        alertId: 'alert-2',
        playerId: 'player-2',
        alertType: 'recovery_setback',
        severity: 'medium',
        title: 'Recovery Progress Plateauing',
        description: 'Function level has not improved in past 2 weeks',
        recommendedAction: 'Reassess rehabilitation protocol and consider modifications',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isResolved: false
      },
      {
        alertId: 'alert-3',
        playerId: 'player-3',
        alertType: 'compliance_issue',
        severity: 'medium',
        title: 'Low Treatment Compliance',
        description: 'Compliance rate dropped to 65% in past week',
        recommendedAction: 'Patient education session and treatment plan review',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isResolved: false
      }
    ],
    
    performanceCorrelations: [
      {
        factor: 'Sleep Quality',
        performanceCorrelation: 0.67,
        significance: 'high',
        recommendation: 'Implement team sleep hygiene program'
      },
      {
        factor: 'Training Load Management',
        performanceCorrelation: -0.45,
        significance: 'medium',
        recommendation: 'Monitor acute:chronic ratios more closely'
      },
      {
        factor: 'Recovery Time',
        performanceCorrelation: 0.52,
        significance: 'medium',
        recommendation: 'Optimize recovery protocols between sessions'
      },
      {
        factor: 'Injury History',
        performanceCorrelation: -0.34,
        significance: 'medium',
        recommendation: 'Enhanced injury prevention for at-risk players'
      }
    ]
  };
};

export const MedicalAnalyticsDashboard: React.FC<MedicalAnalyticsDashboardProps> = ({
  teamId,
  playerId,
  initialDateRange,
  viewMode = 'team',
  autoRefresh = false,
  refreshInterval = 300
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(initialDateRange || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<MedicalAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    injuryTypes: [] as string[],
    bodyParts: [] as string[],
    severityLevels: [] as string[],
    recoveryPhases: [] as string[]
  });
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        setRefreshCounter(prev => prev + 1);
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // In practice, this would call the backend services
        // const response = await medicalAnalyticsAPI.getTeamAnalytics(teamId, dateRange);
        const mockData = generateMockAnalyticsData(teamId, playerId);
        setAnalyticsData(mockData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [teamId, playerId, dateRange, refreshCounter]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'recovering': return 'bg-blue-100 text-blue-800';
      case 'injured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
      case 'increasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleExportData = () => {
    // In practice, this would call the export API
    console.log('Exporting medical analytics data...');
  };

  const renderOverview = () => {
    if (!analyticsData) return null;

    const { teamMedicalOverview, medicalAlerts } = analyticsData;
    const criticalAlerts = medicalAlerts.filter(alert => alert.severity === 'critical').length;
    const highAlerts = medicalAlerts.filter(alert => alert.severity === 'high').length;

    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{teamMedicalOverview.totalPlayers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{teamMedicalOverview.healthyPlayers}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((teamMedicalOverview.healthyPlayers / teamMedicalOverview.totalPlayers) * 100)}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Injured</p>
                  <p className="text-2xl font-bold text-red-600">{teamMedicalOverview.injuredPlayers}</p>
                  <p className="text-xs text-muted-foreground">Active cases</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recovering</p>
                  <p className="text-2xl font-bold text-blue-600">{teamMedicalOverview.recoveringPlayers}</p>
                  <p className="text-xs text-muted-foreground">In protocols</p>
                </div>
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Limited</p>
                  <p className="text-2xl font-bold text-yellow-600">{teamMedicalOverview.limitedPlayers}</p>
                  <p className="text-xs text-muted-foreground">Restrictions</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Risk</p>
                  <p className="text-2xl font-bold">{teamMedicalOverview.averageInjuryRisk}%</p>
                  <Progress value={teamMedicalOverview.averageInjuryRisk} className="mt-1" />
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
                  <p className="text-xs text-muted-foreground">{highAlerts} high priority</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Section */}
        {medicalAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Priority Medical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medicalAlerts
                  .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
                  .slice(0, 5)
                  .map((alert) => (
                    <Alert key={alert.alertId} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">{alert.description}</div>
                            <div className="text-sm font-medium mt-2">Action: {alert.recommendedAction}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {alert.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Player Medical Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMedicalOverview.playerSummaries.map((player) => (
                <div
                  key={player.playerId}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{player.playerName}</h4>
                    <Badge className={getStatusColor(player.medicalStatus)}>
                      {player.medicalStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Injury Risk:</span>
                      <span className={`font-medium ${player.injuryRiskScore > 70 ? 'text-red-600' : 
                                                     player.injuryRiskScore > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {player.injuryRiskScore}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Injuries:</span>
                      <span className="font-medium">{player.activeInjuries}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clearance:</span>
                      <Badge variant="outline" className="text-xs">
                        {player.clearanceLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {player.performanceImpact > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performance Impact:</span>
                        <span className="font-medium text-red-600">-{player.performanceImpact}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Injury Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Injuries (Period)</span>
                  <span className="text-lg font-semibold">{analyticsData.injuryTrendAnalysis.totalInjuries}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Injury Rate</span>
                  <span className="text-lg font-semibold">{analyticsData.injuryTrendAnalysis.injuryRate}%</span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Most Common Injuries</h4>
                  {analyticsData.injuryTrendAnalysis.commonInjuryTypes.slice(0, 3).map((injury, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{injury.type} ({injury.bodyPart})</span>
                      <Badge variant="outline">{injury.count} cases</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Recovery Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Recovery Time</span>
                  <span className="text-lg font-semibold">{analyticsData.recoveryAnalytics.averageRecoveryTime} days</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-lg font-semibold text-green-600">{analyticsData.recoveryAnalytics.recoverySuccessRate}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Protocol Compliance</span>
                  <span className="text-lg font-semibold">{analyticsData.recoveryAnalytics.protocolCompliance}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reinjury Rate</span>
                  <span className="text-lg font-semibold text-orange-600">{analyticsData.recoveryAnalytics.reinjuryRate}%</span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Performance Return Rate</h4>
                  <Progress value={analyticsData.recoveryAnalytics.performanceReturnRates.overall} className="w-full" />
                  <span className="text-xs text-muted-foreground">
                    {analyticsData.recoveryAnalytics.performanceReturnRates.overall}% overall return to baseline
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading medical analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            Medical Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive medical data integration and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          
          <TabsTrigger value="injury-patterns" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          
          <TabsTrigger value="recovery" className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Recovery</span>
          </TabsTrigger>
          
          <TabsTrigger value="return-to-play" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">RTP</span>
          </TabsTrigger>
          
          <TabsTrigger value="risk-assessment" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          
          <TabsTrigger value="rehabilitation" className="flex items-center gap-1">
            <Clipboard className="h-4 w-4" />
            <span className="hidden sm:inline">Rehab</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="injury-patterns">
            <InjuryPatternAnalyzer 
              teamId={teamId}
              playerId={playerId}
              dateRange={dateRange}
              filters={selectedFilters}
            />
          </TabsContent>

          <TabsContent value="recovery">
            <RecoveryProgressMonitor 
              teamId={teamId}
              playerId={playerId}
              dateRange={dateRange}
            />
          </TabsContent>

          <TabsContent value="return-to-play">
            <ReturnToPlayDashboard 
              teamId={teamId}
              playerId={playerId}
            />
          </TabsContent>

          <TabsContent value="risk-assessment">
            <MedicalRiskAssessment 
              teamId={teamId}
              playerId={playerId}
              timeframe={selectedTimeframe}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <MedicalAlertPanel 
              teamId={teamId}
              playerId={playerId}
              alerts={analyticsData?.medicalAlerts || []}
            />
          </TabsContent>

          <TabsContent value="rehabilitation">
            <RehabilitationTracker 
              teamId={teamId}
              playerId={playerId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};