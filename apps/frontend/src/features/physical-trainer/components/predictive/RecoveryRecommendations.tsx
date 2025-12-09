import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Clock, Target, TrendingUp, Activity, Zap, Moon, Utensils } from 'lucide-react';
import { LightweightAreaChart, LightweightLineChart } from '@/features/physical-trainer/components/charts';

interface RecoveryRecommendationsProps {
  playerId: string;
  recoveryInsight?: any;
  className?: string;
}

interface RecoveryData {
  currentRecoveryLevel: number;
  estimatedFullRecovery: Date;
  recoveryVelocity: number; // % per hour
  readinessScore: number;
  recoveryPhases: Array<{
    phase: string;
    duration: number; // hours
    activities: string[];
    intensity: 'rest' | 'light' | 'moderate' | 'normal';
    status: 'pending' | 'current' | 'completed';
  }>;
  recoveryFactors: {
    sleep: { score: number; impact: number; recommendations: string[] };
    nutrition: { score: number; impact: number; recommendations: string[] };
    hydration: { score: number; impact: number; recommendations: string[] };
    stress: { score: number; impact: number; recommendations: string[] };
  };
  monitoringMetrics: Array<{
    metric: string;
    current: number;
    target: number;
    trend: 'improving' | 'stable' | 'declining';
    unit: string;
  }>;
  progressTracking: Array<{
    timestamp: string;
    recovery: number;
    readiness: number;
    fatigue: number;
  }>;
}

export function RecoveryRecommendations({ 
  playerId, 
  recoveryInsight,
  className = '' 
}: RecoveryRecommendationsProps) {
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock recovery data
  const mockRecoveryData: RecoveryData = {
    currentRecoveryLevel: 72,
    estimatedFullRecovery: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
    recoveryVelocity: 3.8, // 3.8% per hour
    readinessScore: 68,
    recoveryPhases: [
      {
        phase: 'Immediate Recovery',
        duration: 6,
        activities: ['Complete rest', 'Hydration', 'Light nutrition'],
        intensity: 'rest',
        status: 'completed'
      },
      {
        phase: 'Active Recovery',
        duration: 8,
        activities: ['Light movement', 'Stretching', 'Mobility work'],
        intensity: 'light',
        status: 'current'
      },
      {
        phase: 'Preparation Phase',
        duration: 4,
        activities: ['Dynamic warm-up', 'Movement prep', 'Activation'],
        intensity: 'moderate',
        status: 'pending'
      }
    ],
    recoveryFactors: {
      sleep: {
        score: 78,
        impact: 35,
        recommendations: [
          'Aim for 8-9 hours tonight',
          'Maintain cool room temperature',
          'Avoid screens 1 hour before bed'
        ]
      },
      nutrition: {
        score: 65,
        impact: 25,
        recommendations: [
          'Increase protein intake to 2g/kg',
          'Focus on anti-inflammatory foods',
          'Time carbohydrates around training'
        ]
      },
      hydration: {
        score: 82,
        impact: 20,
        recommendations: [
          'Maintain current hydration levels',
          'Add electrolytes to next 2 drinks',
          'Monitor urine color'
        ]
      },
      stress: {
        score: 58,
        impact: 20,
        recommendations: [
          'Practice 10 minutes of meditation',
          'Limit external stressors today',
          'Consider massage or relaxation therapy'
        ]
      }
    },
    monitoringMetrics: [
      {
        metric: 'Heart Rate Variability',
        current: 42,
        target: 50,
        trend: 'improving',
        unit: 'ms'
      },
      {
        metric: 'Resting Heart Rate',
        current: 58,
        target: 55,
        trend: 'stable',
        unit: 'bpm'
      },
      {
        metric: 'Sleep Quality',
        current: 78,
        target: 85,
        trend: 'improving',
        unit: '%'
      },
      {
        metric: 'Perceived Recovery',
        current: 6.8,
        target: 8.0,
        trend: 'improving',
        unit: '/10'
      }
    ],
    progressTracking: [
      { timestamp: '12h ago', recovery: 45, readiness: 42, fatigue: 85 },
      { timestamp: '9h ago', recovery: 52, readiness: 48, fatigue: 78 },
      { timestamp: '6h ago', recovery: 58, readiness: 55, fatigue: 72 },
      { timestamp: '3h ago', recovery: 65, readiness: 62, fatigue: 65 },
      { timestamp: 'Now', recovery: 72, readiness: 68, fatigue: 58 }
    ]
  };

  useEffect(() => {
    const fetchRecoveryData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 700));
        setRecoveryData(mockRecoveryData);
      } catch (err) {
        setError('Failed to load recovery data');
        console.error('Error fetching recovery data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecoveryData();
  }, [playerId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recovery Optimization
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

  if (error || !recoveryData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Heart className="h-5 w-5" />
            Recovery Data Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No recovery data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'rest': return 'bg-gray-100 text-gray-800';
      case 'light': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recovery Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Recovery Level</span>
            </div>
            <div className="space-y-2">
              <span className="text-2xl font-bold">{recoveryData.currentRecoveryLevel}%</span>
              <Progress value={recoveryData.currentRecoveryLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Readiness Score</span>
            </div>
            <div className="space-y-2">
              <span className="text-2xl font-bold">{recoveryData.readinessScore}%</span>
              <Progress value={recoveryData.readinessScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Full Recovery</span>
            </div>
            <div className="space-y-1">
              <span className="text-lg font-bold">
                {Math.round((recoveryData.estimatedFullRecovery.getTime() - Date.now()) / (1000 * 60 * 60))}h
              </span>
              <div className="text-xs text-gray-600">
                {recoveryData.estimatedFullRecovery.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="space-y-4">
            {/* Recovery Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recovery Progress (Last 12 Hours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  {/* Recovery and Readiness as stacked areas */}
                  <div className="absolute inset-0">
                    <LightweightAreaChart
                      data={recoveryData.progressTracking.map(d => ({
                        x: d.timestamp,
                        y: d.recovery,
                        y2: d.recovery + d.readiness
                      }))}
                      height={256}
                      color="#10b981"
                      secondaryColor="#3b82f6"
                      opacity={0.3}
                      showGrid={true}
                      gradient={true}
                    />
                  </div>
                  {/* Fatigue as line overlay */}
                  <div className="absolute inset-0">
                    <LightweightLineChart
                      data={recoveryData.progressTracking.map(d => ({
                        x: d.timestamp,
                        y: d.fatigue
                      }))}
                      height={256}
                      color="#ef4444"
                      strokeWidth={2}
                      showGrid={false}
                      showDots={false}
                    />
                  </div>
                  {/* Legend */}
                  <div className="absolute top-2 right-2 flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Recovery %</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Readiness %</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Fatigue %</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Phase */}
            <Card>
              <CardHeader>
                <CardTitle>Current Recovery Phase</CardTitle>
              </CardHeader>
              <CardContent>
                {recoveryData.recoveryPhases
                  .filter(phase => phase.status === 'current')
                  .map((phase, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{phase.phase}</h3>
                        <Badge className={getIntensityColor(phase.intensity)}>
                          {phase.intensity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration: {phase.duration} hours
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recommended Activities:</span>
                        <ul className="space-y-1">
                          {phase.activities.map((activity, actIndex) => (
                            <li key={actIndex} className="flex items-start gap-2 text-sm">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recoveryData.recoveryPhases.map((phase, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(phase.status)}`}></div>
                      {index < recoveryData.recoveryPhases.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{phase.phase}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{phase.duration}h</Badge>
                          <Badge className={getIntensityColor(phase.intensity)}>
                            {phase.intensity}
                          </Badge>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {phase.activities.map((activity, actIndex) => (
                          <li key={actIndex} className="text-sm text-gray-600">
                            • {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(recoveryData.recoveryFactors).map(([factor, data]) => {
              const getFactorIcon = (factor: string) => {
                switch (factor) {
                  case 'sleep': return <Moon className="h-4 w-4" />;
                  case 'nutrition': return <Utensils className="h-4 w-4" />;
                  case 'hydration': return <Activity className="h-4 w-4" />;
                  case 'stress': return <Heart className="h-4 w-4" />;
                  default: return <Target className="h-4 w-4" />;
                }
              };

              return (
                <Card key={factor}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base capitalize">
                      {getFactorIcon(factor)}
                      {factor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{data.score}%</span>
                        <Badge variant="outline">{data.impact}% impact</Badge>
                      </div>
                      <Progress value={data.score} className="h-2" />
                      <div className="space-y-1">
                        {data.recommendations.map((rec, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Monitoring Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recoveryData.monitoringMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{metric.metric}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Target: {metric.target} {metric.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {metric.current} {metric.unit}
                      </div>
                      <div className={`text-sm ${
                        metric.current >= metric.target ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {metric.current >= metric.target ? 'On target' : 'Below target'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Recovery Model Version:</span>
              <span>v3.2.0</span>
            </div>
            <div className="flex justify-between">
              <span>Recovery Velocity:</span>
              <span>+{recoveryData.recoveryVelocity}% per hour</span>
            </div>
            <div className="flex justify-between">
              <span>Data Sources:</span>
              <span>HRV, sleep, nutrition, perceived exertion</span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}