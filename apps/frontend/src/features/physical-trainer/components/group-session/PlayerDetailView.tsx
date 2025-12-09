'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  Settings,
  Play,
  Pause,
  StopCircle,
  MessageSquare,
  Flag,
  Shield,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RealTimePlayerMetrics {
  playerId: string;
  playerName: string;
  heartRate: number;
  watts?: number;
  rpm?: number;
  pace?: string;
  speed?: number;
  calories: number;
  distance?: number;
  timestamp: Date;
  connectionStatus: 'connected' | 'disconnected' | 'poor';
  currentInterval?: string;
  intervalProgress?: number;
  zoneCompliance?: number;
  targetAchievement?: number;
}

interface HistoricalDataPoint {
  timestamp: Date;
  heartRate: number;
  watts?: number;
  zoneCompliance: number;
}

interface PlayerDetailViewProps {
  playerId: string;
  playerName: string;
  currentMetrics: RealTimePlayerMetrics;
  historicalData: HistoricalDataPoint[];
  medicalRestrictions?: string[];
  targetZones?: {
    heartRate?: { min: number; max: number; };
    power?: { min: number; max: number; };
  };
  onPlayerControl?: (action: 'pause' | 'resume' | 'modify_target' | 'send_message') => void;
  onClose?: () => void;
}

export default function PlayerDetailView({
  playerId,
  playerName,
  currentMetrics,
  historicalData,
  medicalRestrictions = [],
  targetZones,
  onPlayerControl,
  onClose
}: PlayerDetailViewProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'5m' | '15m' | '30m' | 'session'>('15m');
  
  // Calculate zone status
  const zoneStatus = useMemo(() => {
    const statuses = [];
    
    // Heart Rate Zone
    if (targetZones?.heartRate) {
      const { min, max } = targetZones.heartRate;
      const isInZone = currentMetrics.heartRate >= min && currentMetrics.heartRate <= max;
      const deviation = isInZone ? 0 : 
        currentMetrics.heartRate < min ? min - currentMetrics.heartRate :
        currentMetrics.heartRate - max;
        
      statuses.push({
        type: 'Heart Rate',
        current: currentMetrics.heartRate,
        target: `${min}-${max} BPM`,
        inZone: isInZone,
        deviation,
        color: isInZone ? 'text-green-600' : 'text-red-600',
        icon: Heart
      });
    }
    
    // Power Zone
    if (targetZones?.power && currentMetrics.watts) {
      const { min, max } = targetZones.power;
      const isInZone = currentMetrics.watts >= min && currentMetrics.watts <= max;
      const deviation = isInZone ? 0 :
        currentMetrics.watts < min ? min - currentMetrics.watts :
        currentMetrics.watts - max;
        
      statuses.push({
        type: 'Power',
        current: currentMetrics.watts,
        target: `${min}-${max} W`,
        inZone: isInZone,
        deviation,
        color: isInZone ? 'text-green-600' : 'text-red-600',
        icon: Zap
      });
    }
    
    return statuses;
  }, [currentMetrics, targetZones]);
  
  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (historicalData.length < 2) return null;
    
    const recentData = historicalData.slice(-10); // Last 10 data points
    const avgHR = recentData.reduce((sum, d) => sum + d.heartRate, 0) / recentData.length;
    const avgWatts = recentData.filter(d => d.watts).length > 0 ?
      recentData.reduce((sum, d) => sum + (d.watts || 0), 0) / recentData.filter(d => d.watts).length : null;
    const avgCompliance = recentData.reduce((sum, d) => sum + d.zoneCompliance, 0) / recentData.length;
    
    // Trends (comparing last 5 vs previous 5)
    const lastHalf = recentData.slice(-5);
    const firstHalf = recentData.slice(0, 5);
    
    const hrTrend = lastHalf.reduce((sum, d) => sum + d.heartRate, 0) / lastHalf.length -
                   firstHalf.reduce((sum, d) => sum + d.heartRate, 0) / firstHalf.length;
    
    const complianceTrend = lastHalf.reduce((sum, d) => sum + d.zoneCompliance, 0) / lastHalf.length -
                           firstHalf.reduce((sum, d) => sum + d.zoneCompliance, 0) / firstHalf.length;
    
    return {
      avgHeartRate: Math.round(avgHR),
      avgWatts: avgWatts ? Math.round(avgWatts) : null,
      avgCompliance: Math.round(avgCompliance),
      hrTrend: Math.round(hrTrend),
      complianceTrend: Math.round(complianceTrend)
    };
  }, [historicalData]);
  
  // Get alert level
  const getAlertLevel = () => {
    if (currentMetrics.connectionStatus !== 'connected') return 'connection';
    if ((currentMetrics.zoneCompliance || 0) < 50) return 'critical';
    if ((currentMetrics.zoneCompliance || 0) < 70) return 'warning';
    if (currentMetrics.heartRate > 185 || currentMetrics.heartRate < 60) return 'medical';
    return 'normal';
  };
  
  const alertLevel = getAlertLevel();
  
  // Format time for historical data
  const formatTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    return minutes === 0 ? 'now' : `${minutes}m ago`;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold">{playerName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={cn(
                "w-2 h-2 rounded-full",
                currentMetrics.connectionStatus === 'connected' ? 'bg-green-500' :
                currentMetrics.connectionStatus === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span className="capitalize">{currentMetrics.connectionStatus}</span>
              <span>•</span>
              <span>Updated {formatTimeAgo(currentMetrics.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onPlayerControl && (
            <>
              <Button variant="outline" size="sm" onClick={() => onPlayerControl('send_message')}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPlayerControl('pause')}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            </>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>
      
      {/* Alert Banner */}
      {alertLevel !== 'normal' && (
        <Alert className={cn(
          "mx-4 mt-4",
          alertLevel === 'critical' && "border-red-500 text-red-700",
          alertLevel === 'warning' && "border-yellow-500 text-yellow-700",
          alertLevel === 'medical' && "border-orange-500 text-orange-700"
        )}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alertLevel === 'connection' && "Player connection unstable. Metrics may be delayed."}
            {alertLevel === 'critical' && "Player significantly out of target zone. Immediate attention required."}
            {alertLevel === 'warning' && "Player below optimal zone compliance. Consider guidance."}
            {alertLevel === 'medical' && "Heart rate outside normal range. Monitor closely."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Medical Restrictions */}
      {medicalRestrictions.length > 0 && (
        <Alert className="mx-4 mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Medical Restrictions:</strong> {medicalRestrictions.join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="realtime" className="h-full">
          <TabsList className="w-full">
            <TabsTrigger value="realtime">Real-Time</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="zones">Zone Analysis</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="realtime" className="p-4 space-y-4">
            {/* Current Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold">{currentMetrics.heartRate}</div>
                  <div className="text-xs text-muted-foreground">BPM</div>
                  {performanceMetrics && (
                    <div className={cn(
                      "flex items-center justify-center mt-1 text-xs",
                      performanceMetrics.hrTrend > 0 ? "text-red-500" : "text-green-500"
                    )}>
                      {performanceMetrics.hrTrend > 0 ? 
                        <TrendingUp className="h-3 w-3 mr-1" /> : 
                        <TrendingDown className="h-3 w-3 mr-1" />
                      }
                      {Math.abs(performanceMetrics.hrTrend)}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {currentMetrics.watts && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{currentMetrics.watts}</div>
                    <div className="text-xs text-muted-foreground">Watts</div>
                  </CardContent>
                </Card>
              )}
              
              {currentMetrics.speed && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{currentMetrics.speed}</div>
                    <div className="text-xs text-muted-foreground">km/h</div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{currentMetrics.calories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Zone Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Zone Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {zoneStatus.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <zone.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{zone.type}</div>
                          <div className="text-sm text-muted-foreground">
                            Target: {zone.target}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-lg font-bold", zone.color)}>
                          {zone.current}
                        </div>
                        <div className="flex items-center gap-1">
                          {zone.inZone ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={cn("text-sm", zone.color)}>
                            {zone.inZone ? 'In Zone' : `±${zone.deviation}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Current Interval Progress */}
            {currentMetrics.currentInterval && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Interval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{currentMetrics.currentInterval}</span>
                      <Badge variant="outline">
                        {currentMetrics.intervalProgress}% Complete
                      </Badge>
                    </div>
                    <Progress 
                      value={currentMetrics.intervalProgress} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="p-4 space-y-4">
            {performanceMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Heart Rate</div>
                        <div className="text-2xl font-bold">{performanceMetrics.avgHeartRate}</div>
                      </div>
                      <Heart className="h-6 w-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                
                {performanceMetrics.avgWatts && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Power</div>
                          <div className="text-2xl font-bold">{performanceMetrics.avgWatts}</div>
                        </div>
                        <Zap className="h-6 w-6 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Zone Compliance</div>
                        <div className="text-2xl font-bold">{performanceMetrics.avgCompliance}%</div>
                      </div>
                      <Target className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Performance Timeline
                  </span>
                  <select 
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="5m">Last 5 min</option>
                    <option value="15m">Last 15 min</option>
                    <option value="30m">Last 30 min</option>
                    <option value="session">Full Session</option>
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Performance chart would display here</p>
                    <p className="text-sm">Heart rate, power, and zone compliance over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="zones" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zone Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Waves className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Zone analysis chart would display here</p>
                    <p className="text-sm">Time spent in each training zone</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="controls" className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onPlayerControl?.('pause')}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Player Session
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onPlayerControl?.('modify_target')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Modify Target Zones
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => onPlayerControl?.('send_message')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Flag className="h-4 w-4 mr-2" />
                    Flag for Attention
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Adjust Difficulty
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <StopCircle className="h-4 w-4 mr-2" />
                    Emergency Stop
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}