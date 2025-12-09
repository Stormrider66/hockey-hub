import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Brain, Heart, TrendingDown, TrendingUp, Activity, Clock } from 'lucide-react';
import { FatigueMonitor } from './FatigueMonitor';
import { InjuryRiskIndicator } from './InjuryRiskIndicator';
import { RecoveryRecommendations } from './RecoveryRecommendations';
import { PlateauDetectionAlert } from './PlateauDetectionAlert';
import { RiskFactorsBreakdown } from './RiskFactorsBreakdown';

interface PredictiveInsight {
  id: string;
  playerId: string;
  type: 'fatigue' | 'injury_risk' | 'performance' | 'readiness';
  riskScore: number;
  confidence: number;
  predictions: any;
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  validUntil: Date;
  metadata: any;
}

interface PredictiveInsightsPanelProps {
  playerId: string;
  organizationId: string;
  className?: string;
}

export function PredictiveInsightsPanel({ 
  playerId, 
  organizationId, 
  className = '' 
}: PredictiveInsightsPanelProps) {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<string>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for development
  const mockInsights: PredictiveInsight[] = [
    {
      id: 'fatigue_001',
      playerId,
      type: 'fatigue',
      riskScore: 68,
      confidence: 87,
      predictions: {
        value: 68,
        category: 'Elevated',
        timeSeries: [
          { timestamp: new Date(), value: 68, confidence: 87 },
          { timestamp: new Date(Date.now() + 24*60*60*1000), value: 62, confidence: 82 },
          { timestamp: new Date(Date.now() + 48*60*60*1000), value: 55, confidence: 78 }
        ]
      },
      recommendations: [
        'Reduce training intensity by 30-40%',
        'Focus on active recovery activities',
        'Prioritize sleep quality and duration'
      ],
      riskFactors: [
        {
          factor: 'High Training Load',
          impact: 25,
          description: 'Training load of 950 is significantly elevated'
        },
        {
          factor: 'Poor Sleep Quality',
          impact: 18,
          description: 'Sleep quality score of 62% indicates insufficient recovery'
        }
      ],
      validUntil: new Date(Date.now() + 8*60*60*1000),
      metadata: { modelVersion: '1.2.0', accuracy: 0.87 }
    },
    {
      id: 'injury_002',
      playerId,
      type: 'injury_risk',
      riskScore: 42,
      confidence: 82,
      predictions: {
        value: 42,
        category: 'Moderate',
        probabilities: [
          { outcome: 'GROIN', probability: 15 },
          { outcome: 'KNEE', probability: 12 },
          { outcome: 'SHOULDER', probability: 8 }
        ]
      },
      recommendations: [
        'Implement targeted prevention exercises',
        'Monitor workload progression carefully',
        'Address biomechanical inefficiencies'
      ],
      riskFactors: [
        {
          factor: 'Recent Injury History',
          impact: 20,
          description: '1 injury(ies) in the last 6 months'
        },
        {
          factor: 'Biomechanical Asymmetries',
          impact: 16,
          description: '18% asymmetry between limbs'
        }
      ],
      validUntil: new Date(Date.now() + 24*60*60*1000),
      metadata: { modelVersion: '2.1.0', accuracy: 0.82 }
    }
  ];

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch(`/api/predictive/insights/${playerId}?organizationId=${organizationId}`);
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setInsights(mockInsights);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load predictive insights');
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [playerId, organizationId]);

  const refreshInsights = async () => {
    await fetchInsights();
  };

  const getOverallRiskLevel = () => {
    if (insights.length === 0) return { level: 'unknown', score: 0 };
    
    const avgRisk = insights.reduce((sum, insight) => sum + insight.riskScore, 0) / insights.length;
    
    if (avgRisk >= 80) return { level: 'critical', score: avgRisk };
    if (avgRisk >= 60) return { level: 'high', score: avgRisk };
    if (avgRisk >= 40) return { level: 'moderate', score: avgRisk };
    return { level: 'low', score: avgRisk };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'fatigue': return <Activity className="h-4 w-4" />;
      case 'injury_risk': return <AlertTriangle className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'readiness': return <Heart className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshInsights} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overallRisk = getOverallRiskLevel();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getRiskLevelColor(overallRisk.level)} text-white border-0`}
            >
              {overallRisk.level.toUpperCase()} RISK ({Math.round(overallRisk.score)}%)
            </Badge>
            <Button 
              onClick={refreshInsights} 
              variant="ghost" 
              size="sm"
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedInsight} onValueChange={setSelectedInsight} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fatigue">Fatigue</TabsTrigger>
            <TabsTrigger value="injury">Injury</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getInsightIcon(insight.type)}
                      <span className="text-sm font-medium capitalize">
                        {insight.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{insight.riskScore}%</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          insight.riskScore >= 70 ? 'bg-red-100 text-red-800' :
                          insight.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {insight.confidence}% conf.
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Top Recommendations */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Priority Recommendations
                </h3>
                <ul className="space-y-2">
                  {insights
                    .flatMap(i => i.recommendations)
                    .slice(0, 5)
                    .map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                </ul>
              </Card>

              {/* Risk Factors Summary */}
              <RiskFactorsBreakdown 
                riskFactors={insights.flatMap(i => i.riskFactors)}
                compact={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="fatigue" className="mt-4">
            <FatigueMonitor 
              playerId={playerId}
              organizationId={organizationId}
              fatigueInsight={insights.find(i => i.type === 'fatigue')}
            />
          </TabsContent>

          <TabsContent value="injury" className="mt-4">
            <InjuryRiskIndicator 
              playerId={playerId}
              organizationId={organizationId}
              injuryInsight={insights.find(i => i.type === 'injury_risk')}
            />
          </TabsContent>

          <TabsContent value="recovery" className="mt-4">
            <RecoveryRecommendations 
              playerId={playerId}
              recoveryInsight={insights.find(i => i.type === 'readiness')}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <PlateauDetectionAlert 
              playerId={playerId}
              performanceInsight={insights.find(i => i.type === 'performance')}
            />
          </TabsContent>
        </Tabs>

        {/* Model Information */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>AI Models: Fatigue v1.2.0, Injury v2.1.0</span>
            <span>Avg. Accuracy: {Math.round((insights.reduce((sum, i) => sum + (i.metadata.accuracy || 0.8), 0) / insights.length) * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}