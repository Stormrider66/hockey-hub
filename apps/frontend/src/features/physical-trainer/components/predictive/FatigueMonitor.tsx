import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Heart, Clock } from 'lucide-react';
import { LightweightLineChart } from '../charts';

interface FatigueMonitorProps {
  playerId: string;
  organizationId: string;
  fatigueInsight?: any;
  className?: string;
}

interface FatigueData {
  currentFatigueLevel: number;
  fatigueVelocity: number;
  projectedPeakFatigue: Date;
  recoveryRecommendations: string[];
  warningThresholds: {
    yellow: number;
    red: number;
  };
  trendData: Array<{
    timestamp: string;
    fatigue: number;
    confidence: number;
  }>;
}

export function FatigueMonitor({ 
  playerId, 
  organizationId, 
  fatigueInsight,
  className = '' 
}: FatigueMonitorProps) {
  const [fatigueData, setFatigueData] = useState<FatigueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeMode, setRealTimeMode] = useState(false);

  // Mock real-time fatigue data
  const mockFatigueData: FatigueData = {
    currentFatigueLevel: fatigueInsight?.riskScore || 68,
    fatigueVelocity: 3.2, // Increasing at 3.2 points per day
    projectedPeakFatigue: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
    recoveryRecommendations: [
      'Active recovery sessions only',
      'Reduce training intensity by 50%',
      'Increase nutrition focus',
      'Monitor fatigue progression closely'
    ],
    warningThresholds: {
      yellow: 65,
      red: 80
    },
    trendData: [
      { timestamp: '6h ago', fatigue: 52, confidence: 92 },
      { timestamp: '5h ago', fatigue: 55, confidence: 90 },
      { timestamp: '4h ago', fatigue: 58, confidence: 89 },
      { timestamp: '3h ago', fatigue: 62, confidence: 88 },
      { timestamp: '2h ago', fatigue: 65, confidence: 87 },
      { timestamp: '1h ago', fatigue: 67, confidence: 87 },
      { timestamp: 'Now', fatigue: 68, confidence: 87 }
    ]
  };

  useEffect(() => {
    const fetchFatigueData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await fetch(`/api/predictive/fatigue/${playerId}/monitoring?organizationId=${organizationId}`);
        // const data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setFatigueData(mockFatigueData);
      } catch (err) {
        setError('Failed to load fatigue monitoring data');
        console.error('Error fetching fatigue data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFatigueData();
  }, [playerId, organizationId]);

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeMode || !fatigueData) return;

    const interval = setInterval(() => {
      setFatigueData(prev => {
        if (!prev) return prev;
        
        const newLevel = Math.min(100, Math.max(0, 
          prev.currentFatigueLevel + (Math.random() - 0.5) * 2
        ));
        
        return {
          ...prev,
          currentFatigueLevel: newLevel,
          trendData: [
            ...prev.trendData.slice(1),
            {
              timestamp: 'Now',
              fatigue: newLevel,
              confidence: 87 + Math.random() * 5
            }
          ]
        };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [realTimeMode, fatigueData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fatigue Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !fatigueData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Fatigue Monitor Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error || 'No fatigue data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getFatigueStatus = (level: number) => {
    if (level >= fatigueData.warningThresholds.red) return { status: 'critical', color: 'bg-red-500', text: 'Critical' };
    if (level >= fatigueData.warningThresholds.yellow) return { status: 'warning', color: 'bg-yellow-500', text: 'Elevated' };
    if (level >= 40) return { status: 'moderate', color: 'bg-blue-500', text: 'Moderate' };
    return { status: 'good', color: 'bg-green-500', text: 'Low' };
  };

  const getVelocityIcon = (velocity: number) => {
    if (velocity > 2) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (velocity > 0) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    if (velocity < -2) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-blue-500" />;
  };

  const currentStatus = getFatigueStatus(fatigueData.currentFatigueLevel);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Status Alert */}
      {currentStatus.status === 'critical' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>CRITICAL FATIGUE ALERT:</strong> Immediate intervention required. 
            Consider complete rest for 24-48 hours.
          </AlertDescription>
        </Alert>
      )}

      {currentStatus.status === 'warning' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>ELEVATED FATIGUE:</strong> Reduce training intensity and monitor closely.
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Fatigue Gauge */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Fatigue Level
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setRealTimeMode(!realTimeMode)}
                variant={realTimeMode ? "default" : "outline"}
                size="sm"
              >
                {realTimeMode ? "Live" : "Static"}
              </Button>
              <Badge className={`${currentStatus.color} text-white border-0`}>
                {currentStatus.text}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Fatigue Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Level</span>
                <span className="text-2xl font-bold">{Math.round(fatigueData.currentFatigueLevel)}%</span>
              </div>
              <Progress 
                value={fatigueData.currentFatigueLevel} 
                className="h-3"
                style={{
                  background: fatigueData.currentFatigueLevel >= fatigueData.warningThresholds.red ? 
                    'linear-gradient(to right, #10b981 0%, #f59e0b 65%, #ef4444 80%)' : 
                    'linear-gradient(to right, #10b981 0%, #f59e0b 65%)'
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0% (Rested)</span>
                <span className="text-yellow-600">{fatigueData.warningThresholds.yellow}%</span>
                <span className="text-red-600">{fatigueData.warningThresholds.red}%</span>
                <span>100% (Exhausted)</span>
              </div>
            </div>

            {/* Velocity and Projection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {getVelocityIcon(fatigueData.fatigueVelocity)}
                  <span className="text-sm font-medium">Fatigue Velocity</span>
                </div>
                <span className="text-lg font-bold">
                  {fatigueData.fatigueVelocity > 0 ? '+' : ''}{fatigueData.fatigueVelocity.toFixed(1)}%/day
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Peak Projected</span>
                </div>
                <span className="text-sm font-bold">
                  {fatigueData.projectedPeakFatigue.toLocaleDateString()} {fatigueData.projectedPeakFatigue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatigue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fatigue Trend (Last 6 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            <LightweightLineChart
              data={fatigueData.trendData}
              dataKey="fatigue"
              secondaryDataKey="confidence"
              showGrid={true}
              height={256}
              strokeColor="#3b82f6"
              secondaryStrokeColor="#10b981"
              strokeWidth={3}
              showDots={true}
              yDomain={[0, 100]}
            />
            {/* Custom reference lines */}
            <div 
              className="absolute left-12 right-0 border-t-2 border-dashed border-yellow-500 opacity-60"
              style={{ 
                top: `${256 - (fatigueData.warningThresholds.yellow / 100) * 256}px`
              }}
            >
              <span className="absolute -top-3 right-2 text-xs text-yellow-600 bg-white px-1">Warning</span>
            </div>
            <div 
              className="absolute left-12 right-0 border-t-2 border-dashed border-red-500 opacity-60"
              style={{ 
                top: `${256 - (fatigueData.warningThresholds.red / 100) * 256}px`
              }}
            >
              <span className="absolute -top-3 right-2 text-xs text-red-600 bg-white px-1">Critical</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recovery Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fatigueData.recoveryRecommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm">{recommendation}</span>
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
              <span>Fatigue Prediction v1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span>Prediction Confidence:</span>
              <span>{fatigueInsight?.confidence || 87}%</span>
            </div>
            <div className="flex justify-between">
              <span>Data Points:</span>
              <span>{fatigueData.trendData.length} measurements</span>
            </div>
            <div className="flex justify-between">
              <span>Update Frequency:</span>
              <span>{realTimeMode ? 'Real-time (3s)' : 'Manual refresh'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}