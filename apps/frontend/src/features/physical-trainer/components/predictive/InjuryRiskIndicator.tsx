import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, TrendingUp, Activity, Clock, Target } from 'lucide-react';
import { LightweightPieChart, LightweightBarChart } from '../charts';

interface InjuryRiskIndicatorProps {
  playerId: string;
  organizationId: string;
  injuryInsight?: any;
  className?: string;
}

interface InjuryRiskData {
  overallRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  bodyPartRisks: Array<{
    bodyPart: string;
    risk: number;
    injuryTypes: string[];
    preventionPriority: 'low' | 'medium' | 'high';
  }>;
  riskFactors: Array<{
    factor: string;
    impact: number;
    modifiable: boolean;
    description: string;
  }>;
  preventionRecommendations: Array<{
    category: string;
    actions: string[];
    timeframe: string;
    effectiveness: number;
  }>;
  historicalTrend: Array<{
    date: string;
    risk: number;
    injuries: number;
  }>;
}

export function InjuryRiskIndicator({ 
  playerId, 
  organizationId, 
  injuryInsight,
  className = '' 
}: InjuryRiskIndicatorProps) {
  const [riskData, setRiskData] = useState<InjuryRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  // Mock injury risk data
  const mockRiskData: InjuryRiskData = {
    overallRisk: injuryInsight?.riskScore || 42,
    riskCategory: injuryInsight?.riskScore >= 70 ? 'high' : 
                  injuryInsight?.riskScore >= 50 ? 'moderate' : 'low',
    confidence: injuryInsight?.confidence || 82,
    bodyPartRisks: [
      {
        bodyPart: 'Groin',
        risk: 15,
        injuryTypes: ['Muscle strain', 'Pull'],
        preventionPriority: 'high'
      },
      {
        bodyPart: 'Knee',
        risk: 12,
        injuryTypes: ['ACL', 'MCL', 'Meniscus'],
        preventionPriority: 'high'
      },
      {
        bodyPart: 'Shoulder',
        risk: 8,
        injuryTypes: ['Impingement', 'Dislocation'],
        preventionPriority: 'medium'
      },
      {
        bodyPart: 'Ankle',
        risk: 7,
        injuryTypes: ['Sprain', 'Strain'],
        preventionPriority: 'medium'
      },
      {
        bodyPart: 'Back',
        risk: 5,
        injuryTypes: ['Strain', 'Disc'],
        preventionPriority: 'low'
      }
    ],
    riskFactors: [
      {
        factor: 'Recent Injury History',
        impact: 20,
        modifiable: false,
        description: '1 injury in the last 6 months increases risk'
      },
      {
        factor: 'Biomechanical Asymmetries',
        impact: 16,
        modifiable: true,
        description: '18% asymmetry between limbs detected'
      },
      {
        factor: 'High Training Load',
        impact: 12,
        modifiable: true,
        description: 'Current load 15% above seasonal average'
      },
      {
        factor: 'Poor Movement Quality',
        impact: 10,
        modifiable: true,
        description: 'FMS score of 12/21 indicates dysfunction'
      }
    ],
    preventionRecommendations: [
      {
        category: 'Movement Preparation',
        actions: [
          'Dynamic warm-up focusing on hip mobility',
          'Groin-specific activation exercises',
          'Movement pattern reinforcement'
        ],
        timeframe: 'Pre-session (daily)',
        effectiveness: 85
      },
      {
        category: 'Strength Training',
        actions: [
          'Eccentric strengthening for groin',
          'Single-leg stability exercises',
          'Core stability progression'
        ],
        timeframe: '3x per week',
        effectiveness: 78
      },
      {
        category: 'Load Management',
        actions: [
          'Reduce high-intensity work by 20%',
          'Implement recovery protocols',
          'Monitor fatigue markers closely'
        ],
        timeframe: 'Next 2 weeks',
        effectiveness: 72
      }
    ],
    historicalTrend: [
      { date: '4 weeks ago', risk: 25, injuries: 0 },
      { date: '3 weeks ago', risk: 32, injuries: 0 },
      { date: '2 weeks ago', risk: 38, injuries: 1 },
      { date: '1 week ago', risk: 44, injuries: 0 },
      { date: 'Now', risk: 42, injuries: 0 }
    ]
  };

  useEffect(() => {
    const fetchRiskData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 600));
        setRiskData(mockRiskData);
      } catch (err) {
        setError('Failed to load injury risk data');
        console.error('Error fetching injury risk data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [playerId, organizationId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Injury Risk Assessment
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

  if (error || !riskData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Injury Risk Assessment Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No injury risk data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-100';
    if (risk >= 50) return 'text-orange-600 bg-orange-100';
    if (risk >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const pieChartData = riskData.bodyPartRisks.map(part => ({
    name: part.bodyPart,
    value: part.risk,
    color: part.risk >= 12 ? '#ef4444' : part.risk >= 8 ? '#f59e0b' : '#10b981'
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Risk Level Alert */}
      {riskData.riskCategory === 'high' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>HIGH INJURY RISK:</strong> Immediate prevention protocols recommended.
          </AlertDescription>
        </Alert>
      )}

      {riskData.riskCategory === 'moderate' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>MODERATE INJURY RISK:</strong> Enhanced monitoring and prevention needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Injury Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{riskData.overallRisk}%</span>
              <Badge className={getRiskColor(riskData.overallRisk)}>
                {riskData.riskCategory.toUpperCase()}
              </Badge>
            </div>
            <Progress value={riskData.overallRisk} className="h-3" />
            <div className="text-sm text-gray-600">
              Model confidence: {riskData.confidence}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Part Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk by Body Part
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <LightweightPieChart
                data={pieChartData}
                innerRadius={0.5}
                showLabels={false}
                height={192}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {riskData.bodyPartRisks.slice(0, 4).map((part) => (
                <div 
                  key={part.bodyPart}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <span>{part.bodyPart}</span>
                  <span className="font-bold">{part.risk}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskData.riskFactors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{factor.impact}%</span>
                      {factor.modifiable && (
                        <Badge variant="outline" className="text-xs">
                          Modifiable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={factor.impact} className="h-2" />
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Risk Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Trend (Last 4 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <LightweightBarChart
              data={riskData.historicalTrend}
              dataKey="risk"
              secondaryDataKey="injuries"
              showGrid={true}
              height={192}
              barColor="#3b82f6"
              secondaryBarColor="#ef4444"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prevention Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Prevention Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskData.preventionRecommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{rec.category}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rec.timeframe}</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {rec.effectiveness}% effective
                    </Badge>
                  </div>
                </div>
                <ul className="space-y-1">
                  {rec.actions.map((action, actionIndex) => (
                    <li key={actionIndex} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Model Version:</span>
              <span>Injury Risk Assessment v2.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Data Sources:</span>
              <span>Training load, biomechanics, history</span>
            </div>
            <div className="flex justify-between">
              <span>Prediction Horizon:</span>
              <span>Next 4 weeks</span>
            </div>
            <div className="flex justify-between">
              <span>Last Assessment:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}