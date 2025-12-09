'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  Heart,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

import { InjuryHistoryAnalyzer } from './InjuryHistoryAnalyzer';
import { RecoveryProgressMonitor } from './RecoveryProgressMonitor';
import { ReturnToPlayWidget } from './ReturnToPlayWidget';
import { MedicalRiskAssessment } from './MedicalRiskAssessment';

interface MedicalPerformanceInsight {
  playerId: string;
  playerName: string;
  overallHealthScore: number;
  injuryRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  performanceImpact: {
    currentPerformance: number;
    baselinePerformance: number;
    performanceChange: number;
    medicalFactorImpact: number;
  };
  keyFindings: {
    finding: string;
    category: 'positive' | 'concerning' | 'critical';
    recommendation: string;
  }[];
  trendAnalysis: {
    performanceTrend: 'improving' | 'declining' | 'stable';
    medicalTrend: 'improving' | 'declining' | 'stable';
    riskTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

interface TeamMedicalDashboard {
  teamId: string;
  overviewMetrics: {
    totalPlayers: number;
    healthyPlayers: number;
    playersWithRestrictions: number;
    playersInRecovery: number;
    highRiskPlayers: number;
    averageHealthScore: number;
  };
  injuryAnalytics: {
    currentInjuryRate: number;
    injuryTrend: 'improving' | 'worsening' | 'stable';
    commonInjuryTypes: {
      type: string;
      count: number;
      averageRecoveryDays: number;
      performanceImpact: number;
    }[];
    seasonalPatterns: {
      month: string;
      injuryCount: number;
      severity: number;
    }[];
  };
  performanceCorrelations: {
    medicalFactorImpact: {
      factor: string;
      performanceCorrelation: number;
      significance: string;
      recommendation: string;
    }[];
  };
  riskAssessment: {
    highRiskPlayers: {
      playerId: string;
      playerName: string;
      riskScore: number;
      primaryRiskFactors: string[];
      recommendedActions: string[];
    }[];
    teamRiskFactors: {
      factor: string;
      prevalence: number;
      impact: number;
      mitigation: string;
    }[];
  };
}

interface MedicalPerformanceDashboardProps {
  teamId?: string;
  playerId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// Mock data for demonstration
const mockTeamDashboard: TeamMedicalDashboard = {
  teamId: 'team-1',
  overviewMetrics: {
    totalPlayers: 25,
    healthyPlayers: 18,
    playersWithRestrictions: 4,
    playersInRecovery: 2,
    highRiskPlayers: 1,
    averageHealthScore: 82
  },
  injuryAnalytics: {
    currentInjuryRate: 8,
    injuryTrend: 'improving',
    commonInjuryTypes: [
      { type: 'Muscle Strain', count: 5, averageRecoveryDays: 14, performanceImpact: 15 },
      { type: 'Joint Sprain', count: 3, averageRecoveryDays: 21, performanceImpact: 20 },
      { type: 'Concussion', count: 2, averageRecoveryDays: 10, performanceImpact: 25 }
    ],
    seasonalPatterns: [
      { month: 'September', injuryCount: 8, severity: 2.1 },
      { month: 'October', injuryCount: 12, severity: 2.4 },
      { month: 'November', injuryCount: 10, severity: 2.2 },
      { month: 'December', injuryCount: 6, severity: 1.8 }
    ]
  },
  performanceCorrelations: {
    medicalFactorImpact: [
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
        factor: 'Injury History',
        performanceCorrelation: -0.34,
        significance: 'medium',
        recommendation: 'Enhanced injury prevention for at-risk players'
      }
    ]
  },
  riskAssessment: {
    highRiskPlayers: [
      {
        playerId: 'player-1',
        playerName: 'John Smith',
        riskScore: 78,
        primaryRiskFactors: ['High workload', 'Previous injury', 'Poor sleep'],
        recommendedActions: ['Reduce training volume', 'Medical evaluation']
      }
    ],
    teamRiskFactors: [
      { factor: 'High Training Loads', prevalence: 35, impact: 25, mitigation: 'Implement load management protocols' },
      { factor: 'Poor Sleep Quality', prevalence: 20, impact: 20, mitigation: 'Team sleep education program' },
      { factor: 'Previous Injuries', prevalence: 40, impact: 30, mitigation: 'Enhanced screening and prevention' }
    ]
  }
};

const mockPlayerInsight: MedicalPerformanceInsight = {
  playerId: 'player-1',
  playerName: 'John Smith',
  overallHealthScore: 72,
  injuryRiskLevel: 'high',
  performanceImpact: {
    currentPerformance: 78,
    baselinePerformance: 85,
    performanceChange: -8.2,
    medicalFactorImpact: -12
  },
  keyFindings: [
    {
      finding: 'Elevated injury risk detected',
      category: 'concerning',
      recommendation: 'Implement injury prevention protocols immediately'
    },
    {
      finding: 'Performance decline trend',
      category: 'concerning',
      recommendation: 'Review training load and recovery protocols'
    },
    {
      finding: 'Good treatment compliance',
      category: 'positive',
      recommendation: 'Continue current rehabilitation approach'
    }
  ],
  trendAnalysis: {
    performanceTrend: 'declining',
    medicalTrend: 'stable',
    riskTrend: 'increasing'
  }
};

export const MedicalPerformanceDashboard: React.FC<MedicalPerformanceDashboardProps> = ({
  teamId,
  playerId,
  dateRange
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'positive':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'concerning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const renderTeamOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{mockTeamDashboard.overviewMetrics.totalPlayers}</p>
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
                <p className="text-2xl font-bold text-green-600">{mockTeamDashboard.overviewMetrics.healthyPlayers}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restricted</p>
                <p className="text-2xl font-bold text-yellow-600">{mockTeamDashboard.overviewMetrics.playersWithRestrictions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovering</p>
                <p className="text-2xl font-bold text-blue-600">{mockTeamDashboard.overviewMetrics.playersInRecovery}</p>
              </div>
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{mockTeamDashboard.overviewMetrics.highRiskPlayers}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{mockTeamDashboard.overviewMetrics.averageHealthScore}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={mockTeamDashboard.overviewMetrics.averageHealthScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Injury Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Injury Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Injury Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{mockTeamDashboard.injuryAnalytics.currentInjuryRate}%</span>
                {getTrendIcon(mockTeamDashboard.injuryAnalytics.injuryTrend)}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Common Injury Types</h4>
              {mockTeamDashboard.injuryAnalytics.commonInjuryTypes.map((injury, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{injury.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {injury.count} cases • {injury.averageRecoveryDays} days avg recovery
                    </p>
                  </div>
                  <Badge variant="outline">
                    -{injury.performanceImpact}% performance
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Performance Correlations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTeamDashboard.performanceCorrelations.medicalFactorImpact.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{factor.factor}</span>
                  <Badge variant={factor.significance === 'high' ? 'default' : 'secondary'}>
                    {Math.abs(factor.performanceCorrelation * 100).toFixed(0)}% correlation
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{factor.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* High Risk Players */}
      {mockTeamDashboard.riskAssessment.highRiskPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              High Risk Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTeamDashboard.riskAssessment.highRiskPlayers.map((player, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{player.playerName}</span>
                        <Badge variant="destructive">Risk: {player.riskScore}%</Badge>
                      </div>
                      <div>
                        <p className="text-sm">Risk Factors: {player.primaryRiskFactors.join(', ')}</p>
                        <p className="text-sm mt-1">Actions: {player.recommendedActions.join(', ')}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPlayerInsight = () => (
    <div className="space-y-6">
      {/* Player Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {mockPlayerInsight.playerName} - Health Overview
            </span>
            <Badge variant={getRiskLevelColor(mockPlayerInsight.injuryRiskLevel)}>
              {mockPlayerInsight.injuryRiskLevel.toUpperCase()} RISK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Overall Health Score</h4>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{mockPlayerInsight.overallHealthScore}%</div>
                <Progress value={mockPlayerInsight.overallHealthScore} className="w-full" />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Performance Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Baseline</span>
                  <span className="font-medium">{mockPlayerInsight.performanceImpact.baselinePerformance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current</span>
                  <span className="font-medium">{mockPlayerInsight.performanceImpact.currentPerformance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Change</span>
                  <span className={`font-medium ${mockPlayerInsight.performanceImpact.performanceChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {mockPlayerInsight.performanceImpact.performanceChange > 0 ? '+' : ''}{mockPlayerInsight.performanceImpact.performanceChange}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Medical Impact</span>
                  <span className="font-medium text-red-600">{mockPlayerInsight.performanceImpact.medicalFactorImpact}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trends */}
          <div>
            <h4 className="font-medium mb-3">Trend Analysis</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getTrendIcon(mockPlayerInsight.trendAnalysis.performanceTrend)}
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <span className="text-xs text-muted-foreground">{mockPlayerInsight.trendAnalysis.performanceTrend}</span>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getTrendIcon(mockPlayerInsight.trendAnalysis.medicalTrend)}
                  <span className="text-sm font-medium">Medical</span>
                </div>
                <span className="text-xs text-muted-foreground">{mockPlayerInsight.trendAnalysis.medicalTrend}</span>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getTrendIcon(mockPlayerInsight.trendAnalysis.riskTrend)}
                  <span className="text-sm font-medium">Risk</span>
                </div>
                <span className="text-xs text-muted-foreground">{mockPlayerInsight.trendAnalysis.riskTrend}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Key Findings & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPlayerInsight.keyFindings.map((finding, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                {getCategoryIcon(finding.category)}
                <div className="flex-1">
                  <p className="font-medium">{finding.finding}</p>
                  <p className="text-sm text-muted-foreground mt-1">{finding.recommendation}</p>
                </div>
                <Badge variant={finding.category === 'positive' ? 'secondary' : 
                              finding.category === 'concerning' ? 'warning' : 'destructive'}>
                  {finding.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical Performance Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive medical and performance correlation analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </Button>
          <Button
            variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </Button>
          <Button
            variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="injury-history" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Injury History</span>
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Recovery</span>
          </TabsTrigger>
          <TabsTrigger value="return-to-play" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Return to Play</span>
          </TabsTrigger>
          <TabsTrigger value="risk-assessment" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Risk Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            {playerId ? renderPlayerInsight() : renderTeamOverview()}
          </TabsContent>

          <TabsContent value="injury-history">
            <InjuryHistoryAnalyzer 
              playerId={playerId}
              teamId={teamId}
              timeframe={selectedTimeframe}
            />
          </TabsContent>

          <TabsContent value="recovery">
            <RecoveryProgressMonitor 
              playerId={playerId}
              teamId={teamId}
            />
          </TabsContent>

          <TabsContent value="return-to-play">
            <ReturnToPlayWidget 
              playerId={playerId}
              teamId={teamId}
            />
          </TabsContent>

          <TabsContent value="risk-assessment">
            <MedicalRiskAssessment 
              playerId={playerId}
              teamId={teamId}
              timeframe={selectedTimeframe}
            />
          </TabsContent>

          <TabsContent value="insights">
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Insights Coming Soon</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Machine learning powered insights and predictive analytics for medical performance optimization.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};