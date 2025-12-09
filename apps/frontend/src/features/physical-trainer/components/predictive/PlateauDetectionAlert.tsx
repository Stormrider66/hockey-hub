import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingDown, TrendingUp, AlertTriangle, Target, Zap, BarChart3, Brain } from 'lucide-react';
import { LightweightLineChart } from '@/features/physical-trainer/components/charts';

interface PlateauDetectionAlertProps {
  playerId: string;
  performanceInsight?: any;
  className?: string;
}

interface PlateauData {
  plateauDetected: boolean;
  plateauDuration: number; // days
  plateauConfidence: number;
  plateauMetrics: Array<{
    metric: string;
    stagnationPeriod: number; // days
    lastImprovement: Date;
    currentValue: number;
    expectedValue: number;
    unit: string;
  }>;
  breakoutProbability: number;
  recommendations: Array<{
    strategy: string;
    category: 'training' | 'recovery' | 'nutrition' | 'psychology';
    expectedImpact: number;
    timeToEffect: number; // days
    difficulty: 'low' | 'medium' | 'high';
    description: string;
  }>;
  performanceTrend: Array<{
    date: string;
    overall: number;
    strength: number;
    endurance: number;
    skill: number;
    target: number;
  }>;
  adaptationCycle: {
    currentPhase: 'adaptation' | 'plateau' | 'supercompensation' | 'detraining';
    phaseDay: number;
    expectedDuration: number;
    nextPhaseDate: Date;
  };
}

export function PlateauDetectionAlert({ 
  playerId, 
  performanceInsight,
  className = '' 
}: PlateauDetectionAlertProps) {
  const [plateauData, setPlateauData] = useState<PlateauData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');

  // Mock plateau detection data
  const mockPlateauData: PlateauData = {
    plateauDetected: true,
    plateauDuration: 18,
    plateauConfidence: 84,
    plateauMetrics: [
      {
        metric: 'Power Output',
        stagnationPeriod: 15,
        lastImprovement: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentValue: 285,
        expectedValue: 295,
        unit: 'W'
      },
      {
        metric: 'VO2 Max',
        stagnationPeriod: 22,
        lastImprovement: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        currentValue: 58.2,
        expectedValue: 60.1,
        unit: 'ml/kg/min'
      },
      {
        metric: 'Speed',
        stagnationPeriod: 12,
        lastImprovement: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        currentValue: 8.8,
        expectedValue: 9.2,
        unit: 'm/s'
      },
      {
        metric: 'Agility Score',
        stagnationPeriod: 8,
        lastImprovement: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        currentValue: 92,
        expectedValue: 96,
        unit: 'points'
      }
    ],
    breakoutProbability: 73,
    recommendations: [
      {
        strategy: 'Periodization Reset',
        category: 'training',
        expectedImpact: 85,
        timeToEffect: 14,
        difficulty: 'medium',
        description: 'Implement 2-week deload followed by progressive overload cycle'
      },
      {
        strategy: 'Movement Variability',
        category: 'training',
        expectedImpact: 72,
        timeToEffect: 7,
        difficulty: 'low',
        description: 'Introduce new movement patterns and exercise variations'
      },
      {
        strategy: 'Recovery Optimization',
        category: 'recovery',
        expectedImpact: 68,
        timeToEffect: 10,
        difficulty: 'low',
        description: 'Enhanced sleep protocols and stress management techniques'
      },
      {
        strategy: 'Nutritional Periodization',
        category: 'nutrition',
        expectedImpact: 58,
        timeToEffect: 21,
        difficulty: 'medium',
        description: 'Adjust macronutrient timing around training phases'
      },
      {
        strategy: 'Mental Performance Training',
        category: 'psychology',
        expectedImpact: 65,
        timeToEffect: 28,
        difficulty: 'high',
        description: 'Visualization and goal-setting interventions'
      }
    ],
    performanceTrend: [
      { date: '8 weeks ago', overall: 78, strength: 82, endurance: 75, skill: 77, target: 80 },
      { date: '7 weeks ago', overall: 82, strength: 84, endurance: 78, skill: 84, target: 82 },
      { date: '6 weeks ago', overall: 85, strength: 87, endurance: 82, skill: 86, target: 84 },
      { date: '5 weeks ago', overall: 88, strength: 89, endurance: 85, skill: 90, target: 86 },
      { date: '4 weeks ago', overall: 89, strength: 90, endurance: 86, skill: 91, target: 88 },
      { date: '3 weeks ago', overall: 90, strength: 90, endurance: 87, skill: 93, target: 90 },
      { date: '2 weeks ago', overall: 89, strength: 89, endurance: 86, skill: 92, target: 92 },
      { date: '1 week ago', overall: 90, strength: 90, endurance: 87, skill: 93, target: 94 },
      { date: 'Now', overall: 89, strength: 89, endurance: 86, skill: 92, target: 96 }
    ],
    adaptationCycle: {
      currentPhase: 'plateau',
      phaseDay: 18,
      expectedDuration: 28,
      nextPhaseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    }
  };

  useEffect(() => {
    const fetchPlateauData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setPlateauData(mockPlateauData);
      } catch (err) {
        setError('Failed to load plateau detection data');
        console.error('Error fetching plateau data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlateauData();
  }, [playerId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Plateau Detection
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

  if (error || !plateauData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Plateau Detection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No plateau detection data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return <Zap className="h-4 w-4" />;
      case 'recovery': return <Target className="h-4 w-4" />;
      case 'nutrition': return <TrendingUp className="h-4 w-4" />;
      case 'psychology': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'adaptation': return 'bg-green-500';
      case 'plateau': return 'bg-yellow-500';
      case 'supercompensation': return 'bg-blue-500';
      case 'detraining': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Plateau Alert */}
      {plateauData.plateauDetected && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>PERFORMANCE PLATEAU DETECTED:</strong> Progress has stagnated for {plateauData.plateauDuration} days. 
            Intervention recommended to break through current limitations.
          </AlertDescription>
        </Alert>
      )}

      {/* Plateau Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Plateau Duration</span>
            </div>
            <span className="text-2xl font-bold">{plateauData.plateauDuration} days</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <span className="text-2xl font-bold">{plateauData.plateauConfidence}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Breakout Probability</span>
            </div>
            <span className="text-2xl font-bold">{plateauData.breakoutProbability}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-4 h-4 rounded-full ${getPhaseColor(plateauData.adaptationCycle.currentPhase)}`}></div>
              <span className="text-sm font-medium">Current Phase</span>
            </div>
            <span className="text-lg font-bold capitalize">{plateauData.adaptationCycle.currentPhase}</span>
            <div className="text-xs text-gray-600">
              Day {plateauData.adaptationCycle.phaseDay} of {plateauData.adaptationCycle.expectedDuration}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trend (8 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {/* Overall Performance */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={plateauData.performanceTrend.map(d => ({
                  x: d.date,
                  y: d.overall
                }))}
                height={256}
                color="#3b82f6"
                strokeWidth={3}
                showGrid={true}
                showDots={true}
              />
            </div>
            {/* Strength */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={plateauData.performanceTrend.map(d => ({
                  x: d.date,
                  y: d.strength
                }))}
                height={256}
                color="#ef4444"
                strokeWidth={2}
                showGrid={false}
                showDots={false}
              />
            </div>
            {/* Endurance */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={plateauData.performanceTrend.map(d => ({
                  x: d.date,
                  y: d.endurance
                }))}
                height={256}
                color="#10b981"
                strokeWidth={2}
                showGrid={false}
                showDots={false}
              />
            </div>
            {/* Skill */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={plateauData.performanceTrend.map(d => ({
                  x: d.date,
                  y: d.skill
                }))}
                height={256}
                color="#8b5cf6"
                strokeWidth={2}
                showGrid={false}
                showDots={false}
              />
            </div>
            {/* Target line (dashed) */}
            <div className="absolute inset-0">
              <LightweightLineChart
                data={plateauData.performanceTrend.map(d => ({
                  x: d.date,
                  y: d.target
                }))}
                height={256}
                color="#6b7280"
                strokeWidth={2}
                showGrid={false}
                showDots={false}
                className="[&_polyline]:stroke-dasharray-[5,5]"
              />
            </div>
            {/* Plateau threshold reference line */}
            <div className="absolute w-full" style={{ top: `${100 - ((90 - 60) / 40) * 100}%` }}>
              <div className="border-t-2 border-dashed border-yellow-500 w-full"></div>
              <span className="absolute right-2 -top-3 text-xs bg-white px-1 text-yellow-600">
                Plateau Threshold
              </span>
            </div>
            {/* Legend */}
            <div className="absolute top-2 right-2 flex flex-wrap gap-3 text-xs max-w-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Overall</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Strength</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Endurance</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Skill</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-gray-500"></div>
                <span>Target</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stagnant Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Stagnant Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plateauData.plateauMetrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{metric.metric}</h3>
                  <Badge variant="outline" className="text-red-600">
                    {metric.stagnationPeriod} days stagnant
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current:</span>
                    <div className="font-bold">{metric.currentValue} {metric.unit}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Expected:</span>
                    <div className="font-bold">{metric.expectedValue} {metric.unit}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Improvement:</span>
                    <div className="font-bold">{metric.lastImprovement.toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(metric.currentValue / metric.expectedValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breakthrough Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Breakthrough Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plateauData.recommendations
              .sort((a, b) => b.expectedImpact - a.expectedImpact)
              .map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(rec.category)}
                      <h3 className="font-semibold">{rec.strategy}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        {rec.expectedImpact}% impact
                      </Badge>
                      <Badge className={getDifficultyColor(rec.difficulty)}>
                        {rec.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Time to effect: {rec.timeToEffect} days</span>
                    <span>Category: {rec.category}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Adaptation Cycle */}
      <Card>
        <CardHeader>
          <CardTitle>Training Adaptation Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold capitalize">{plateauData.adaptationCycle.currentPhase} Phase</div>
                <div className="text-sm text-gray-600">
                  Day {plateauData.adaptationCycle.phaseDay} of {plateauData.adaptationCycle.expectedDuration}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Next phase expected:</div>
                <div className="font-semibold">
                  {plateauData.adaptationCycle.nextPhaseDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Cycle Progress */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs">Adaptation</span>
                <span className="text-xs">Plateau</span>
                <span className="text-xs">Supercompensation</span>
                <span className="text-xs">Recovery</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getPhaseColor(plateauData.adaptationCycle.currentPhase)}`}
                  style={{ width: `${(plateauData.adaptationCycle.phaseDay / plateauData.adaptationCycle.expectedDuration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Plateau Detection Model:</span>
              <span>v2.3.0</span>
            </div>
            <div className="flex justify-between">
              <span>Analysis Period:</span>
              <span>8 weeks</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence Threshold:</span>
              <span>80%</span>
            </div>
            <div className="flex justify-between">
              <span>Last Analysis:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}