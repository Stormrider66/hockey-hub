'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Brain,
  Heart,
  Zap,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  Info,
  Settings,
  Download,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';

export interface RiskFactor {
  factorId: string;
  name: string;
  category: 'workload' | 'medical_history' | 'biomechanical' | 'environmental' | 'psychological';
  currentValue: number;
  optimalRange: { min: number; max: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastAssessment: string;
  recommendations: string[];
}

export interface PlayerRiskProfile {
  playerId: string;
  playerName: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryConcerns: string[];
  riskFactors: RiskFactor[];
  predictedOutcomes: Array<{
    outcome: string;
    probability: number;
    timeframe: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  interventionPriority: 'immediate' | 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export interface TeamRiskOverview {
  totalPlayers: number;
  averageRiskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskFactors: Array<{
    factor: string;
    category: string;
    affectedPlayers: number;
    averageImpact: number;
  }>;
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    timeframe: string;
  };
}

export interface MedicalRiskAssessmentProps {
  teamId?: string;
  playerId?: string;
}

export const MedicalRiskAssessment: React.FC<MedicalRiskAssessmentProps> = ({
  teamId,
  playerId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Mock data - in real implementation, this would come from the medical analytics API
  const mockTeamOverview: TeamRiskOverview = {
    totalPlayers: 25,
    averageRiskScore: 42,
    riskDistribution: {
      low: 8,
      medium: 12,
      high: 4,
      critical: 1
    },
    topRiskFactors: [
      { factor: 'Training Load Spikes', category: 'workload', affectedPlayers: 15, averageImpact: 68 },
      { factor: 'Previous Injury History', category: 'medical_history', affectedPlayers: 8, averageImpact: 72 },
      { factor: 'Sleep Quality', category: 'environmental', affectedPlayers: 12, averageImpact: 45 },
      { factor: 'Recovery Time', category: 'workload', affectedPlayers: 18, averageImpact: 52 }
    ],
    trendAnalysis: {
      direction: 'improving',
      changePercentage: 8.5,
      timeframe: 'last 30 days'
    }
  };

  const mockPlayerProfiles: PlayerRiskProfile[] = [
    {
      playerId: 'player-1',
      playerName: 'Sidney Crosby',
      overallRiskScore: 78,
      riskLevel: 'high',
      primaryConcerns: ['Concussion History', 'Workload Accumulation'],
      riskFactors: [
        {
          factorId: 'workload-1',
          name: 'Weekly Training Load',
          category: 'workload',
          currentValue: 850,
          optimalRange: { min: 600, max: 750 },
          riskLevel: 'high',
          impact: 75,
          trend: 'declining',
          lastAssessment: '2025-01-14',
          recommendations: ['Reduce high-intensity sessions by 20%', 'Increase recovery periods']
        },
        {
          factorId: 'medical-1',
          name: 'Concussion History',
          category: 'medical_history',
          currentValue: 3,
          optimalRange: { min: 0, max: 1 },
          riskLevel: 'critical',
          impact: 85,
          trend: 'stable',
          lastAssessment: '2025-01-14',
          recommendations: ['Enhanced cognitive baseline testing', 'Implement return-to-play protocols']
        }
      ],
      predictedOutcomes: [
        { outcome: 'Overtraining Syndrome', probability: 35, timeframe: 'next 2 weeks', severity: 'high' },
        { outcome: 'Muscle Fatigue', probability: 65, timeframe: 'next week', severity: 'medium' }
      ],
      interventionPriority: 'immediate',
      lastUpdated: '2025-01-14T10:30:00Z'
    },
    {
      playerId: 'player-2',
      playerName: 'Nathan MacKinnon',
      overallRiskScore: 35,
      riskLevel: 'medium',
      primaryConcerns: ['Recovery Quality'],
      riskFactors: [
        {
          factorId: 'env-1',
          name: 'Sleep Quality Score',
          category: 'environmental',
          currentValue: 65,
          optimalRange: { min: 80, max: 95 },
          riskLevel: 'medium',
          impact: 45,
          trend: 'improving',
          lastAssessment: '2025-01-14',
          recommendations: ['Sleep hygiene education', 'Consider sleep monitoring devices']
        }
      ],
      predictedOutcomes: [
        { outcome: 'Performance Decline', probability: 25, timeframe: 'next month', severity: 'low' }
      ],
      interventionPriority: 'medium',
      lastUpdated: '2025-01-14T10:30:00Z'
    }
  ];

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workload': return <Activity className="h-4 w-4" />;
      case 'medical_history': return <Heart className="h-4 w-4" />;
      case 'biomechanical': return <Zap className="h-4 w-4" />;
      case 'environmental': return <Shield className="h-4 w-4" />;
      case 'psychological': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      workload: 'Training Load',
      medical_history: 'Medical History',
      biomechanical: 'Biomechanical',
      environmental: 'Environmental',
      psychological: 'Psychological'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const toggleFactorExpansion = (factorId: string) => {
    const newExpanded = new Set(expandedFactors);
    if (newExpanded.has(factorId)) {
      newExpanded.delete(factorId);
    } else {
      newExpanded.add(factorId);
    }
    setExpandedFactors(newExpanded);
  };

  const renderTeamOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{mockTeamOverview.totalPlayers}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                <p className="text-2xl font-bold">{mockTeamOverview.averageRiskScore}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockTeamOverview.riskDistribution.high + mockTeamOverview.riskDistribution.critical}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(mockTeamOverview.trendAnalysis.direction)}
                  <span className="text-sm font-medium">
                    {mockTeamOverview.trendAnalysis.changePercentage}%
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mockTeamOverview.riskDistribution.low}
                </div>
                <div className="text-sm text-muted-foreground">Low Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {mockTeamOverview.riskDistribution.medium}
                </div>
                <div className="text-sm text-muted-foreground">Medium Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {mockTeamOverview.riskDistribution.high}
                </div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {mockTeamOverview.riskDistribution.critical}
                </div>
                <div className="text-sm text-muted-foreground">Critical Risk</div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(mockTeamOverview.riskDistribution.low / mockTeamOverview.totalPlayers) * 100}%` }}
                />
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(mockTeamOverview.riskDistribution.medium / mockTeamOverview.totalPlayers) * 100}%` }}
                />
                <div 
                  className="bg-orange-500" 
                  style={{ width: `${(mockTeamOverview.riskDistribution.high / mockTeamOverview.totalPlayers) * 100}%` }}
                />
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(mockTeamOverview.riskDistribution.critical / mockTeamOverview.totalPlayers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTeamOverview.topRiskFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(factor.category)}
                  <div>
                    <h4 className="font-medium">{factor.factor}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryLabel(factor.category)} • {factor.affectedPlayers} players affected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">{factor.averageImpact}%</div>
                    <div className="text-xs text-muted-foreground">Impact</div>
                  </div>
                  <Progress value={factor.averageImpact} className="w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPlayerProfiles = () => (
    <div className="space-y-6">
      {mockPlayerProfiles.map((profile) => (
        <Card key={profile.playerId} className="overflow-hidden">
          <CardHeader className={`${getRiskLevelColor(profile.riskLevel)} border-b`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6" />
                <div>
                  <CardTitle className="text-lg">{profile.playerName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getRiskLevelBadgeVariant(profile.riskLevel)}>
                      {profile.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <span className="text-sm">Score: {profile.overallRiskScore}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="text-sm">{new Date(profile.lastUpdated).toLocaleDateString()}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Primary Concerns */}
            <div className="mb-6">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Primary Concerns
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.primaryConcerns.map((concern, index) => (
                  <Badge key={index} variant="outline">
                    {concern}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Risk Factors
              </h4>
              <div className="space-y-3">
                {profile.riskFactors.map((factor) => (
                  <div key={factor.factorId} className="border rounded-lg">
                    <div 
                      className="p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleFactorExpansion(factor.factorId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(factor.category)}
                          <div>
                            <h5 className="font-medium">{factor.name}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getRiskLevelBadgeVariant(factor.riskLevel)} className="text-xs">
                                {factor.riskLevel}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {getCategoryLabel(factor.category)}
                              </span>
                              {getTrendIcon(factor.trend)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">{factor.impact}%</div>
                            <div className="text-xs text-muted-foreground">Impact</div>
                          </div>
                          {expandedFactors.has(factor.factorId) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </div>
                    </div>

                    {expandedFactors.has(factor.factorId) && (
                      <div className="p-3 border-t bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-muted-foreground">Current Value:</span>
                            <span className="ml-2 font-medium">{factor.currentValue}</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Optimal Range:</span>
                            <span className="ml-2 font-medium">
                              {factor.optimalRange.min} - {factor.optimalRange.max}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h6 className="text-sm font-medium mb-2">Recommendations:</h6>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {factor.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Predicted Outcomes */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Predicted Outcomes
              </h4>
              <div className="space-y-2">
                {profile.predictedOutcomes.map((outcome, index) => (
                  <Alert key={index}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{outcome.outcome}</span>
                          <span className="text-muted-foreground ml-2">({outcome.timeframe})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={outcome.severity === 'high' ? 'destructive' : 'secondary'}>
                            {outcome.severity}
                          </Badge>
                          <span className="font-medium">{outcome.probability}%</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Medical Risk Assessment
          </h3>
          <p className="text-muted-foreground">
            Comprehensive injury risk analysis and prevention strategies
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'overview' | 'detailed') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                {mockPlayerProfiles.map((profile) => (
                  <SelectItem key={profile.playerId} value={profile.playerId}>
                    {profile.playerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Risk Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="workload">Training Load</SelectItem>
                <SelectItem value="medical_history">Medical History</SelectItem>
                <SelectItem value="biomechanical">Biomechanical</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="psychological">Psychological</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="team">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="team">Team Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          {renderTeamOverview()}
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {renderPlayerProfiles()}
        </TabsContent>
      </Tabs>
    </div>
  );
};