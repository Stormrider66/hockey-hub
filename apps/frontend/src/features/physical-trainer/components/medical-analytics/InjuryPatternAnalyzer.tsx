'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Download,
  Brain,
  Target,
  AlertTriangle,
  Calendar,
  Users,
  Activity,
  Zap,
  Shield,
  Clock,
  MapPin,
  Thermometer,
  Cloud,
  Sun
} from 'lucide-react';

// Types based on backend InjuryAnalyticsEngine
export interface InjuryPatternData {
  patternId: string;
  injuryType: string;
  bodyPart: string;
  totalOccurrences: number;
  incidenceRate: number;
  averageSeverity: number;
  averageRecoveryDays: number;
  recurrenceRate: number;
  
  demographicFactors: {
    ageGroups: Array<{ ageRange: string; incidence: number }>;
    positions: Array<{ position: string; incidence: number }>;
    experienceLevels: Array<{ level: string; incidence: number }>;
  };
  
  seasonalTrends: Array<{
    month: number;
    monthName: string;
    occurrences: number;
    severity: number;
    commonCauses: string[];
  }>;
  
  workloadCorrelations: Array<{
    workloadMetric: string;
    correlationCoefficient: number;
    significance: number;
    thresholdValue?: number;
    description: string;
  }>;
  
  environmentalFactors: Array<{
    factor: string;
    impact: number;
    occurrences: number;
    conditions: string[];
  }>;
  
  preventionInsights: {
    protectiveFactors: Array<{
      factor: string;
      riskReduction: number;
      evidence: string;
    }>;
    riskAmplifiers: Array<{
      factor: string;
      riskIncrease: number;
      evidence: string;
    }>;
    recommendedScreenings: string[];
    interventionStrategies: string[];
  };
}

export interface CorrelationInsight {
  correlationType: 'injury_workload' | 'injury_performance' | 'injury_environmental' | 'injury_psychological';
  primaryVariable: string;
  secondaryVariable: string;
  correlationStrength: number;
  significance: number;
  sampleSize: number;
  confidenceInterval: { lower: number; upper: number };
  
  practicalSignificance: {
    isSignificant: boolean;
    magnitude: 'small' | 'medium' | 'large';
    clinicalRelevance: string;
  };
  
  actionableInsights: Array<{
    insight: string;
    recommendation: string;
    evidence: string;
  }>;
}

export interface InjuryPatternAnalyzerProps {
  teamId?: string;
  playerId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    injuryTypes?: string[];
    bodyParts?: string[];
    severityLevels?: string[];
    positions?: string[];
  };
}

// Mock data generator
const generateMockPatternData = (): InjuryPatternData[] => {
  return [
    {
      patternId: 'muscle-strain-hamstring',
      injuryType: 'Muscle Strain',
      bodyPart: 'Hamstring',
      totalOccurrences: 15,
      incidenceRate: 8.2,
      averageSeverity: 2.3,
      averageRecoveryDays: 14,
      recurrenceRate: 18,
      
      demographicFactors: {
        ageGroups: [
          { ageRange: '18-22', incidence: 45 },
          { ageRange: '23-27', incidence: 35 },
          { ageRange: '28-32', incidence: 20 }
        ],
        positions: [
          { position: 'Forward', incidence: 60 },
          { position: 'Defense', incidence: 30 },
          { position: 'Goalie', incidence: 10 }
        ],
        experienceLevels: [
          { level: 'Junior', incidence: 50 },
          { level: 'Professional', incidence: 35 },
          { level: 'Veteran', incidence: 15 }
        ]
      },
      
      seasonalTrends: [
        { month: 9, monthName: 'September', occurrences: 4, severity: 2.5, commonCauses: ['Training camp intensity', 'Return from break'] },
        { month: 10, monthName: 'October', occurrences: 3, severity: 2.2, commonCauses: ['Game intensity', 'Fatigue'] },
        { month: 11, monthName: 'November', occurrences: 2, severity: 2.0, commonCauses: ['Accumulated fatigue'] },
        { month: 12, monthName: 'December', occurrences: 3, severity: 2.4, commonCauses: ['Holiday schedule', 'Travel'] },
        { month: 1, monthName: 'January', occurrences: 2, severity: 1.8, commonCauses: ['Cold weather'] },
        { month: 2, monthName: 'February', occurrences: 1, severity: 1.5, commonCauses: ['Late season'] }
      ],
      
      workloadCorrelations: [
        {
          workloadMetric: 'Acute:Chronic Load Ratio',
          correlationCoefficient: 0.72,
          significance: 0.001,
          thresholdValue: 1.5,
          description: 'Strong positive correlation between load spikes and hamstring strains'
        },
        {
          workloadMetric: 'Sprint Volume',
          correlationCoefficient: 0.58,
          significance: 0.01,
          description: 'Moderate correlation with high-speed running volume'
        },
        {
          workloadMetric: 'Recovery Time',
          correlationCoefficient: -0.45,
          significance: 0.05,
          description: 'Insufficient recovery increases strain risk'
        }
      ],
      
      environmentalFactors: [
        {
          factor: 'Playing Surface',
          impact: 25,
          occurrences: 8,
          conditions: ['Artificial turf', 'Hard ice conditions']
        },
        {
          factor: 'Temperature',
          impact: 15,
          occurrences: 5,
          conditions: ['Cold conditions', 'Inadequate warm-up']
        }
      ],
      
      preventionInsights: {
        protectiveFactors: [
          { factor: 'Proper warm-up (>15 minutes)', riskReduction: 35, evidence: 'Strong' },
          { factor: 'Nordic hamstring exercises', riskReduction: 28, evidence: 'Strong' },
          { factor: 'Load management', riskReduction: 22, evidence: 'Moderate' }
        ],
        riskAmplifiers: [
          { factor: 'Previous hamstring injury', riskIncrease: 65, evidence: 'Strong' },
          { factor: 'Workload spikes (>30%)', riskIncrease: 40, evidence: 'Strong' },
          { factor: 'Poor flexibility', riskIncrease: 25, evidence: 'Moderate' }
        ],
        recommendedScreenings: ['Hamstring flexibility test', 'Single leg bridge test', 'Sprint mechanics assessment'],
        interventionStrategies: ['Eccentric strengthening', 'Load progression protocols', 'Movement quality training']
      }
    },
    {
      patternId: 'concussion-head',
      injuryType: 'Concussion',
      bodyPart: 'Head',
      totalOccurrences: 8,
      incidenceRate: 4.5,
      averageSeverity: 3.2,
      averageRecoveryDays: 12,
      recurrenceRate: 25,
      
      demographicFactors: {
        ageGroups: [
          { ageRange: '18-22', incidence: 50 },
          { ageRange: '23-27', incidence: 30 },
          { ageRange: '28-32', incidence: 20 }
        ],
        positions: [
          { position: 'Forward', incidence: 50 },
          { position: 'Defense', incidence: 40 },
          { position: 'Goalie', incidence: 10 }
        ],
        experienceLevels: [
          { level: 'Junior', incidence: 60 },
          { level: 'Professional', incidence: 30 },
          { level: 'Veteran', incidence: 10 }
        ]
      },
      
      seasonalTrends: [
        { month: 9, monthName: 'September', occurrences: 1, severity: 3.0, commonCauses: ['Preseason intensity'] },
        { month: 10, monthName: 'October', occurrences: 2, severity: 3.2, commonCauses: ['Body contact', 'Aggressive play'] },
        { month: 11, monthName: 'November', occurrences: 2, severity: 3.5, commonCauses: ['Playoff push intensity'] },
        { month: 12, monthName: 'December', occurrences: 1, severity: 2.8, commonCauses: ['Holiday tournament'] },
        { month: 1, monthName: 'January', occurrences: 1, severity: 3.0, commonCauses: ['Mid-season intensity'] },
        { month: 2, monthName: 'February', occurrences: 1, severity: 2.5, commonCauses: ['Late season fatigue'] }
      ],
      
      workloadCorrelations: [
        {
          workloadMetric: 'Contact Exposure',
          correlationCoefficient: 0.68,
          significance: 0.01,
          description: 'Strong correlation with contact practice and game exposure'
        },
        {
          workloadMetric: 'Fatigue Level',
          correlationCoefficient: 0.42,
          significance: 0.05,
          description: 'Moderate correlation with accumulated fatigue'
        }
      ],
      
      environmentalFactors: [
        {
          factor: 'Game Situation',
          impact: 40,
          occurrences: 5,
          conditions: ['Power play', 'Physical gameplay', 'Playoff intensity']
        },
        {
          factor: 'Ice Conditions',
          impact: 15,
          occurrences: 2,
          conditions: ['Poor ice quality', 'Soft ice']
        }
      ],
      
      preventionInsights: {
        protectiveFactors: [
          { factor: 'Proper helmet fit', riskReduction: 45, evidence: 'Strong' },
          { factor: 'Neck strengthening', riskReduction: 20, evidence: 'Moderate' },
          { factor: 'Contact technique training', riskReduction: 30, evidence: 'Moderate' }
        ],
        riskAmplifiers: [
          { factor: 'Previous concussion history', riskIncrease: 80, evidence: 'Strong' },
          { factor: 'Playing style (aggressive)', riskIncrease: 35, evidence: 'Moderate' },
          { factor: 'Poor head position', riskIncrease: 25, evidence: 'Moderate' }
        ],
        recommendedScreenings: ['Baseline cognitive testing', 'Balance assessment', 'Neck strength evaluation'],
        interventionStrategies: ['Concussion education', 'Contact technique coaching', 'Progressive return protocols']
      }
    }
  ];
};

const generateMockCorrelations = (): CorrelationInsight[] => {
  return [
    {
      correlationType: 'injury_workload',
      primaryVariable: 'Acute:Chronic Load Ratio',
      secondaryVariable: 'Muscle Strain Injuries',
      correlationStrength: 0.74,
      significance: 0.001,
      sampleSize: 150,
      confidenceInterval: { lower: 0.62, upper: 0.83 },
      practicalSignificance: {
        isSignificant: true,
        magnitude: 'large',
        clinicalRelevance: 'High clinical significance for injury prevention protocols'
      },
      actionableInsights: [
        {
          insight: 'Load spikes above 1.5 ratio increase muscle strain risk by 65%',
          recommendation: 'Implement gradual load progression with max 10% weekly increases',
          evidence: 'Strong evidence from longitudinal cohort studies'
        },
        {
          insight: 'Players with consistent load management show 40% lower injury rates',
          recommendation: 'Establish individual load thresholds and monitoring protocols',
          evidence: 'Moderate evidence from intervention studies'
        }
      ]
    },
    {
      correlationType: 'injury_environmental',
      primaryVariable: 'Playing Surface Type',
      secondaryVariable: 'Lower Extremity Injuries',
      correlationStrength: 0.38,
      significance: 0.02,
      sampleSize: 200,
      confidenceInterval: { lower: 0.22, upper: 0.52 },
      practicalSignificance: {
        isSignificant: true,
        magnitude: 'medium',
        clinicalRelevance: 'Moderate significance for venue-specific preparation'
      },
      actionableInsights: [
        {
          insight: 'Artificial surfaces show 25% higher lower limb injury rates',
          recommendation: 'Implement surface-specific warm-up protocols',
          evidence: 'Moderate evidence from multiple venue studies'
        }
      ]
    }
  ];
};

export const InjuryPatternAnalyzer: React.FC<InjuryPatternAnalyzerProps> = ({
  teamId,
  playerId,
  dateRange,
  filters
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('patterns');
  const [patternData, setPatternData] = useState<InjuryPatternData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationInsight[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    injuryTypes: [] as string[],
    bodyParts: [] as string[],
    positions: [] as string[],
    severityRange: [1, 5] as [number, number]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');

  useEffect(() => {
    // Load pattern data
    setPatternData(generateMockPatternData());
    setCorrelationData(generateMockCorrelations());
  }, [teamId, playerId, dateRange, filters]);

  const getCorrelationStrengthColor = (strength: number) => {
    const abs = Math.abs(strength);
    if (abs >= 0.7) return 'text-red-600';
    if (abs >= 0.5) return 'text-orange-600';
    if (abs >= 0.3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getCorrelationStrengthLabel = (strength: number) => {
    const abs = Math.abs(strength);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Minimal';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'text-red-600';
    if (severity >= 3) return 'text-orange-600';
    if (severity >= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const renderPatternOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patterns</p>
                <p className="text-2xl font-bold">{patternData.length}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk Patterns</p>
                <p className="text-2xl font-bold text-red-600">
                  {patternData.filter(p => p.incidenceRate > 5).length}
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
                <p className="text-sm text-muted-foreground">Avg Recovery</p>
                <p className="text-2xl font-bold">
                  {Math.round(patternData.reduce((sum, p) => sum + p.averageRecoveryDays, 0) / patternData.length)} days
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
                <p className="text-sm text-muted-foreground">Recurrence Risk</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(patternData.reduce((sum, p) => sum + p.recurrenceRate, 0) / patternData.length)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patternData.map((pattern) => (
          <Card 
            key={pattern.patternId} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPattern === pattern.patternId ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPattern(pattern.patternId === selectedPattern ? null : pattern.patternId)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {pattern.injuryType} - {pattern.bodyPart}
                </span>
                <Badge variant={pattern.incidenceRate > 5 ? 'destructive' : 'secondary'}>
                  {pattern.incidenceRate.toFixed(1)} per 1000h
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Occurrences:</span>
                  <div className="font-semibold">{pattern.totalOccurrences}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Severity:</span>
                  <div className={`font-semibold ${getSeverityColor(pattern.averageSeverity)}`}>
                    {pattern.averageSeverity.toFixed(1)}/5
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recovery Time:</span>
                  <div className="font-semibold">{pattern.averageRecoveryDays} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Recurrence:</span>
                  <div className="font-semibold text-orange-600">{pattern.recurrenceRate}%</div>
                </div>
              </div>

              {/* Risk Factors Preview */}
              <div>
                <h4 className="text-sm font-medium mb-2">Top Risk Factors</h4>
                <div className="space-y-1">
                  {pattern.preventionInsights.riskAmplifiers.slice(0, 2).map((factor, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{factor.factor}</span>
                      <Badge variant="outline" className="text-red-600">
                        +{factor.riskIncrease}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal Trend Mini Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Seasonal Pattern</h4>
                <div className="flex items-end gap-1 h-8">
                  {pattern.seasonalTrends.map((month) => (
                    <div
                      key={month.month}
                      className="bg-blue-500 rounded-sm flex-1"
                      style={{ 
                        height: `${(month.occurrences / Math.max(...pattern.seasonalTrends.map(m => m.occurrences))) * 100}%`,
                        minHeight: month.occurrences > 0 ? '4px' : '1px'
                      }}
                      title={`${month.monthName}: ${month.occurrences} cases`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Sep</span>
                  <span>Feb</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Pattern View */}
      {selectedPattern && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const pattern = patternData.find(p => p.patternId === selectedPattern);
              if (!pattern) return null;

              return (
                <Tabs defaultValue="demographics">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="workload">Workload</TabsTrigger>
                    <TabsTrigger value="environmental">Environmental</TabsTrigger>
                    <TabsTrigger value="prevention">Prevention</TabsTrigger>
                    <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
                  </TabsList>

                  <TabsContent value="demographics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Age Distribution</h4>
                        {pattern.demographicFactors.ageGroups.map((group, index) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className="text-sm">{group.ageRange}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={group.incidence} className="w-16" />
                              <span className="text-sm font-medium w-8">{group.incidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Position Distribution</h4>
                        {pattern.demographicFactors.positions.map((pos, index) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className="text-sm">{pos.position}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={pos.incidence} className="w-16" />
                              <span className="text-sm font-medium w-8">{pos.incidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Experience Level</h4>
                        {pattern.demographicFactors.experienceLevels.map((exp, index) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className="text-sm">{exp.level}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={exp.incidence} className="w-16" />
                              <span className="text-sm font-medium w-8">{exp.incidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="workload" className="space-y-4">
                    <div className="space-y-4">
                      {pattern.workloadCorrelations.map((correlation, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{correlation.workloadMetric}</h4>
                              <Badge className={getCorrelationStrengthColor(correlation.correlationCoefficient)}>
                                {getCorrelationStrengthLabel(correlation.correlationCoefficient)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{correlation.description}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Correlation:</span>
                                <div className="font-semibold">{correlation.correlationCoefficient.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">P-value:</span>
                                <div className="font-semibold">{correlation.significance.toFixed(3)}</div>
                              </div>
                              {correlation.thresholdValue && (
                                <div>
                                  <span className="text-muted-foreground">Threshold:</span>
                                  <div className="font-semibold">{correlation.thresholdValue}</div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="environmental" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pattern.environmentalFactors.map((factor, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium flex items-center gap-2">
                                {factor.factor === 'Playing Surface' && <MapPin className="h-4 w-4" />}
                                {factor.factor === 'Temperature' && <Thermometer className="h-4 w-4" />}
                                {factor.factor === 'Weather' && <Cloud className="h-4 w-4" />}
                                {factor.factor}
                              </h4>
                              <Badge variant="outline">{factor.impact}% impact</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {factor.occurrences} occurrences
                            </p>
                            <div className="space-y-1">
                              {factor.conditions.map((condition, idx) => (
                                <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="prevention" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-600">
                            <Shield className="h-5 w-5" />
                            Protective Factors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {pattern.preventionInsights.protectiveFactors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div>
                                <p className="font-medium text-green-800">{factor.factor}</p>
                                <p className="text-sm text-green-600">Evidence: {factor.evidence}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                -{factor.riskReduction}%
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Risk Amplifiers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {pattern.preventionInsights.riskAmplifiers.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div>
                                <p className="font-medium text-red-800">{factor.factor}</p>
                                <p className="text-sm text-red-600">Evidence: {factor.evidence}</p>
                              </div>
                              <Badge className="bg-red-100 text-red-800">
                                +{factor.riskIncrease}%
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Recommended Screenings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {pattern.preventionInsights.recommendedScreenings.map((screening, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{screening}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Intervention Strategies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {pattern.preventionInsights.interventionStrategies.map((strategy, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                <Zap className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">{strategy}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="seasonal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Injury Pattern</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {pattern.seasonalTrends.map((month) => (
                            <div key={month.month} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{month.monthName}</h4>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">{month.occurrences} cases</Badge>
                                  <Badge variant="outline" className={getSeverityColor(month.severity)}>
                                    {month.severity.toFixed(1)} severity
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {month.commonCauses.map((cause, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {cause}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCorrelationAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {correlationData.map((correlation, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {correlation.primaryVariable} ↔ {correlation.secondaryVariable}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <div className={`text-lg font-bold ${getCorrelationStrengthColor(correlation.correlationStrength)}`}>
                        {correlation.correlationStrength.toFixed(3)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCorrelationStrengthLabel(correlation.correlationStrength)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Significance</span>
                      <div className="text-lg font-bold">p = {correlation.significance.toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground">
                        {correlation.significance < 0.001 ? 'Highly significant' :
                         correlation.significance < 0.01 ? 'Very significant' :
                         correlation.significance < 0.05 ? 'Significant' : 'Not significant'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Sample Size</span>
                      <div className="text-lg font-bold">{correlation.sampleSize}</div>
                      <div className="text-xs text-muted-foreground">observations</div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Magnitude</span>
                      <div className="text-lg font-bold">{correlation.practicalSignificance.magnitude}</div>
                      <div className="text-xs text-muted-foreground">effect size</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Clinical Relevance</h4>
                    <p className="text-sm text-muted-foreground">
                      {correlation.practicalSignificance.clinicalRelevance}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Actionable Insights</h4>
                    <div className="space-y-3">
                      {correlation.actionableInsights.map((insight, idx) => (
                        <Card key={idx} className="p-4">
                          <h5 className="font-medium mb-2">{insight.insight}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{insight.recommendation}</p>
                          <Badge variant="secondary">{insight.evidence}</Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-purple-600" />
            Injury Pattern Analysis
          </h3>
          <p className="text-muted-foreground">
            Advanced pattern recognition and correlation analysis for injury prevention
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="patterns" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="correlations" className="flex items-center gap-1">
            <LineChart className="h-4 w-4" />
            Correlations
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="patterns">
            {renderPatternOverview()}
          </TabsContent>

          <TabsContent value="correlations">
            {renderCorrelationAnalysis()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};