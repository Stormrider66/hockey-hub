'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Clock,
  MapPin,
  Zap,
  Shield
} from 'lucide-react';

interface InjuryPattern {
  injuryType: string;
  bodyPart: string;
  frequency: number;
  averageSeverity: number;
  commonCauses: string[];
  recoveryTimeAvg: number;
  recurrenceRate: number;
  seasonalTrends: {
    month: string;
    occurrences: number;
  }[];
}

interface WorkloadCorrelation {
  factor: string;
  correlationStrength: number;
  significance: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  affectedPlayerCount: number;
  injuryTypes: string[];
}

interface InjuryHistoryAnalyzerProps {
  playerId?: string;
  teamId?: string;
  timeframe: 'week' | 'month' | 'quarter';
}

// Mock data for demonstration
const mockInjuryPatterns: InjuryPattern[] = [
  {
    injuryType: 'Muscle Strain',
    bodyPart: 'hamstring',
    frequency: 8,
    averageSeverity: 2.3,
    commonCauses: ['Overuse', 'Fatigue', 'Poor warm-up'],
    recoveryTimeAvg: 14,
    recurrenceRate: 25,
    seasonalTrends: [
      { month: 'September', occurrences: 1 },
      { month: 'October', occurrences: 3 },
      { month: 'November', occurrences: 2 },
      { month: 'December', occurrences: 2 }
    ]
  },
  {
    injuryType: 'Joint Sprain',
    bodyPart: 'ankle',
    frequency: 5,
    averageSeverity: 2.8,
    commonCauses: ['Contact', 'Landing mechanics', 'Surface conditions'],
    recoveryTimeAvg: 21,
    recurrenceRate: 15,
    seasonalTrends: [
      { month: 'September', occurrences: 1 },
      { month: 'October', occurrences: 2 },
      { month: 'November', occurrences: 1 },
      { month: 'December', occurrences: 1 }
    ]
  },
  {
    injuryType: 'Concussion',
    bodyPart: 'head',
    frequency: 3,
    averageSeverity: 3.5,
    commonCauses: ['Body contact', 'Board contact', 'Stick contact'],
    recoveryTimeAvg: 12,
    recurrenceRate: 35,
    seasonalTrends: [
      { month: 'September', occurrences: 0 },
      { month: 'October', occurrences: 1 },
      { month: 'November', occurrences: 1 },
      { month: 'December', occurrences: 1 }
    ]
  }
];

const mockWorkloadCorrelations: WorkloadCorrelation[] = [
  {
    factor: 'Acute:Chronic Workload Ratio',
    correlationStrength: 0.67,
    significance: 'high',
    description: 'Higher injury risk when ACR exceeds 1.5 or falls below 0.8',
    recommendation: 'Maintain ACR between 0.8-1.3 for optimal injury prevention',
    affectedPlayerCount: 15,
    injuryTypes: ['muscle strain', 'joint injury']
  },
  {
    factor: 'Training Monotony',
    correlationStrength: 0.45,
    significance: 'medium',
    description: 'Higher injury risk with repetitive training patterns',
    recommendation: 'Vary training intensity and type to reduce monotony',
    affectedPlayerCount: 8,
    injuryTypes: ['overuse injury', 'stress fracture']
  },
  {
    factor: 'Sleep Quality',
    correlationStrength: -0.52,
    significance: 'medium',
    description: 'Poor sleep quality correlates with increased injury risk',
    recommendation: 'Prioritize sleep hygiene and aim for 7-9 hours quality sleep',
    affectedPlayerCount: 12,
    injuryTypes: ['all types']
  },
  {
    factor: 'Fatigue Level',
    correlationStrength: 0.61,
    significance: 'high',
    description: 'High fatigue levels significantly increase injury likelihood',
    recommendation: 'Monitor fatigue daily and adjust training accordingly',
    affectedPlayerCount: 18,
    injuryTypes: ['muscle injury', 'ligament injury']
  }
];

export const InjuryHistoryAnalyzer: React.FC<InjuryHistoryAnalyzerProps> = ({
  playerId,
  teamId,
  timeframe
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedView, setSelectedView] = useState<'patterns' | 'correlations' | 'timeline'>('patterns');

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'destructive';
    if (severity >= 3) return 'warning';
    if (severity >= 2) return 'secondary';
    return 'default';
  };

  const getCorrelationStrengthBadge = (strength: number) => {
    const absStrength = Math.abs(strength);
    if (absStrength >= 0.7) return { variant: 'destructive' as const, label: 'Very Strong' };
    if (absStrength >= 0.5) return { variant: 'warning' as const, label: 'Strong' };
    if (absStrength >= 0.3) return { variant: 'secondary' as const, label: 'Moderate' };
    return { variant: 'default' as const, label: 'Weak' };
  };

  const renderInjuryPatterns = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Injuries</p>
                <p className="text-2xl font-bold">{mockInjuryPatterns.reduce((sum, p) => sum + p.frequency, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Severity</p>
                <p className="text-2xl font-bold">
                  {(mockInjuryPatterns.reduce((sum, p) => sum + p.averageSeverity, 0) / mockInjuryPatterns.length).toFixed(1)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Recovery</p>
                <p className="text-2xl font-bold">
                  {Math.round(mockInjuryPatterns.reduce((sum, p) => sum + p.recoveryTimeAvg, 0) / mockInjuryPatterns.length)}d
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recurrence Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(mockInjuryPatterns.reduce((sum, p) => sum + p.recurrenceRate, 0) / mockInjuryPatterns.length)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Injury Pattern Details */}
      <div className="space-y-4">
        {mockInjuryPatterns.map((pattern, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {pattern.injuryType} - {pattern.bodyPart}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(pattern.averageSeverity)}>
                    Severity: {pattern.averageSeverity.toFixed(1)}/5
                  </Badge>
                  <Badge variant="outline">
                    {pattern.frequency} cases
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Stats */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Recovery Time</span>
                      <span className="font-medium">{pattern.recoveryTimeAvg} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Recurrence Rate</span>
                      <span className="font-medium">{pattern.recurrenceRate}%</span>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Risk Level</span>
                        <span>{pattern.recurrenceRate}%</span>
                      </div>
                      <Progress value={pattern.recurrenceRate} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Common Causes */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Common Causes</h4>
                  <div className="space-y-2">
                    {pattern.commonCauses.map((cause, causeIndex) => (
                      <div key={causeIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{cause}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal Trends */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Seasonal Pattern</h4>
                  <div className="space-y-2">
                    {pattern.seasonalTrends.map((trend, trendIndex) => (
                      <div key={trendIndex} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{trend.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(trend.occurrences / Math.max(...pattern.seasonalTrends.map(t => t.occurrences))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-6">{trend.occurrences}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWorkloadCorrelations = () => (
    <div className="space-y-6">
      {/* Correlation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Workload-Injury Correlations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Analysis of training load factors and their correlation with injury occurrence.
            Strong correlations indicate key areas for injury prevention focus.
          </p>
          <div className="space-y-4">
            {mockWorkloadCorrelations.map((correlation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{correlation.factor}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={getCorrelationStrengthBadge(correlation.correlationStrength).variant}>
                      {getCorrelationStrengthBadge(correlation.correlationStrength).label}
                    </Badge>
                    <Badge variant="outline">
                      {correlation.correlationStrength > 0 ? '+' : ''}{(correlation.correlationStrength * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="secondary">
                      {correlation.affectedPlayerCount} players
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{correlation.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-1">Affected Injury Types</h5>
                    <div className="flex flex-wrap gap-1">
                      {correlation.injuryTypes.map((type, typeIndex) => (
                        <Badge key={typeIndex} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-1">Recommendation</h5>
                    <p className="text-sm text-muted-foreground">{correlation.recommendation}</p>
                  </div>
                </div>

                {/* Correlation Strength Visualization */}
                <div className="w-full">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Correlation Strength</span>
                    <span>{Math.abs(correlation.correlationStrength * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={Math.abs(correlation.correlationStrength) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Injury Timeline Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Interactive Timeline Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Detailed timeline visualization showing injury patterns, recovery periods, and correlations with training phases.
            </p>
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
          <h3 className="text-xl font-semibold">Injury History Analysis</h3>
          <p className="text-muted-foreground">
            {playerId ? 'Individual player' : 'Team-wide'} injury patterns and correlations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === 'patterns' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('patterns')}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Patterns
          </Button>
          <Button
            variant={selectedView === 'correlations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('correlations')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Correlations
          </Button>
          <Button
            variant={selectedView === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('timeline')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'patterns' && renderInjuryPatterns()}
      {selectedView === 'correlations' && renderWorkloadCorrelations()}
      {selectedView === 'timeline' && renderTimeline()}
    </div>
  );
};