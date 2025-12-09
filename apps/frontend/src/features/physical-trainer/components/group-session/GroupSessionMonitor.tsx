'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  StopCircle, 
  Users, 
  User, 
  Grid3X3,
  List,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Heart,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { 
  ConditioningSession,
  PersonalizedInterval,
  PlayerTestResult,
  WorkoutEquipmentType 
} from '../../types/conditioning.types';

// Real-time metrics interface
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

// Team aggregate metrics
interface TeamAggregateMetrics {
  averageHeartRate: number;
  averageWatts?: number;
  totalCalories: number;
  averageZoneCompliance: number;
  playersInTargetZone: number;
  totalPlayers: number;
  sessionProgress: number;
  estimatedTimeRemaining: number;
}

// Session control state
interface SessionControlState {
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  startTime?: Date;
  pausedAt?: Date;
  endTime?: Date;
  duration: number;
  canControl: boolean;
}

interface GroupSessionMonitorProps {
  sessionId: string;
  session: ConditioningSession;
  participants: Array<{
    id: string;
    name: string;
    playerTests?: PlayerTestResult[];
    medicalRestrictions?: string[];
  }>;
  onSessionControl?: (action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop') => Promise<void>;
  onPlayerFocus?: (playerId: string | null) => void;
  onBack?: () => void;
}

type ViewMode = 'grid' | 'list' | 'focus';
type MetricsFilter = 'all' | 'heart_rate' | 'power' | 'compliance' | 'alerts';

export default function GroupSessionMonitor({
  sessionId,
  session,
  participants,
  onSessionControl,
  onPlayerFocus,
  onBack
}: GroupSessionMonitorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [metricsFilter, setMetricsFilter] = useState<MetricsFilter>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2 seconds
  
  // Player focus
  const [focusedPlayer, setFocusedPlayer] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  
  // Real-time data (in production, this would come from WebSocket)
  const [playerMetrics, setPlayerMetrics] = useState<Map<string, RealTimePlayerMetrics>>(new Map());
  const [sessionControl, setSessionControl] = useState<SessionControlState>({
    status: 'scheduled',
    duration: 0,
    canControl: true
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  
  // Mock real-time data generation for demo
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      const mockMetrics = new Map<string, RealTimePlayerMetrics>();
      
      participants.forEach((participant, index) => {
        const baseHR = 140 + (index * 10) + Math.random() * 20 - 10;
        const baseWatts = 200 + (index * 25) + Math.random() * 40 - 20;
        
        mockMetrics.set(participant.id, {
          playerId: participant.id,
          playerName: participant.name,
          heartRate: Math.max(60, Math.min(200, Math.round(baseHR))),
          watts: Math.max(50, Math.round(baseWatts)),
          rpm: Math.round(80 + Math.random() * 20),
          speed: Math.round((25 + Math.random() * 10) * 10) / 10,
          calories: Math.round(150 + (index * 20) + Math.random() * 50),
          distance: Math.round((5 + Math.random() * 3) * 100) / 100,
          timestamp: new Date(),
          connectionStatus: Math.random() > 0.1 ? 'connected' : 'poor',
          currentInterval: `Interval ${Math.floor(Math.random() * 8) + 1}`,
          intervalProgress: Math.round(Math.random() * 100),
          zoneCompliance: Math.round(60 + Math.random() * 40),
          targetAchievement: Math.round(70 + Math.random() * 30)
        });
      });
      
      setPlayerMetrics(mockMetrics);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [participants, autoRefresh, refreshInterval]);
  
  // Calculate team aggregate metrics
  const teamMetrics = useMemo((): TeamAggregateMetrics => {
    const metrics = Array.from(playerMetrics.values());
    const connectedMetrics = metrics.filter(m => m.connectionStatus === 'connected');
    
    if (connectedMetrics.length === 0) {
      return {
        averageHeartRate: 0,
        totalCalories: 0,
        averageZoneCompliance: 0,
        playersInTargetZone: 0,
        totalPlayers: participants.length,
        sessionProgress: 0,
        estimatedTimeRemaining: 0
      };
    }
    
    const avgHR = connectedMetrics.reduce((sum, m) => sum + m.heartRate, 0) / connectedMetrics.length;
    const avgWatts = connectedMetrics.filter(m => m.watts).length > 0 
      ? connectedMetrics.reduce((sum, m) => sum + (m.watts || 0), 0) / connectedMetrics.filter(m => m.watts).length
      : undefined;
    const totalCals = connectedMetrics.reduce((sum, m) => sum + m.calories, 0);
    const avgCompliance = connectedMetrics.reduce((sum, m) => sum + (m.zoneCompliance || 0), 0) / connectedMetrics.length;
    const playersInZone = connectedMetrics.filter(m => (m.zoneCompliance || 0) >= 80).length;
    
    return {
      averageHeartRate: Math.round(avgHR),
      averageWatts: avgWatts ? Math.round(avgWatts) : undefined,
      totalCalories: Math.round(totalCals),
      averageZoneCompliance: Math.round(avgCompliance),
      playersInTargetZone: playersInZone,
      totalPlayers: participants.length,
      sessionProgress: Math.round(Math.random() * 100), // Mock progress
      estimatedTimeRemaining: Math.round(1800 + Math.random() * 600) // Mock time remaining
    };
  }, [playerMetrics, participants]);
  
  // Session control handlers
  const handleSessionControl = useCallback(async (action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop') => {
    if (!sessionControl.canControl) return;
    
    try {
      setSessionControl(prev => ({ ...prev, canControl: false }));
      
      if (onSessionControl) {
        await onSessionControl(action);
      }
      
      // Update local state based on action
      setSessionControl(prev => {
        const now = new Date();
        switch (action) {
          case 'start':
            return { ...prev, status: 'active', startTime: now, canControl: true };
          case 'pause':
            return { ...prev, status: 'paused', pausedAt: now, canControl: true };
          case 'resume':
            return { ...prev, status: 'active', pausedAt: undefined, canControl: true };
          case 'stop':
          case 'emergency_stop':
            return { ...prev, status: action === 'emergency_stop' ? 'cancelled' : 'completed', endTime: now, canControl: true };
          default:
            return { ...prev, canControl: true };
        }
      });
    } catch (error) {
      console.error('Session control error:', error);
      setSessionControl(prev => ({ ...prev, canControl: true }));
    }
  }, [sessionControl.canControl, onSessionControl]);
  
  // Player selection handlers
  const handlePlayerSelect = useCallback((playerId: string, exclusive = false) => {
    if (exclusive) {
      setSelectedPlayers(new Set([playerId]));
      setFocusedPlayer(playerId);
      if (onPlayerFocus) onPlayerFocus(playerId);
    } else {
      setSelectedPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
          newSet.delete(playerId);
        } else {
          newSet.add(playerId);
        }
        return newSet;
      });
    }
  }, [onPlayerFocus]);
  
  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get status color
  const getStatusColor = (status: SessionControlState['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Filter players based on metrics filter
  const filteredMetrics = useMemo(() => {
    const metrics = Array.from(playerMetrics.values());
    
    switch (metricsFilter) {
      case 'heart_rate':
        return metrics.filter(m => m.heartRate > 0);
      case 'power':
        return metrics.filter(m => m.watts && m.watts > 0);
      case 'compliance':
        return metrics.filter(m => (m.zoneCompliance || 0) < 80);
      case 'alerts':
        return metrics.filter(m => 
          (m.zoneCompliance || 0) < 60 || 
          m.connectionStatus !== 'connected' ||
          m.heartRate > 180 || 
          m.heartRate < 60
        );
      default:
        return metrics;
    }
  }, [playerMetrics, metricsFilter]);
  
  // Player Metrics Card Component
  const PlayerMetricsCard = ({ metrics, isSelected, isFocused }: { 
    metrics: RealTimePlayerMetrics; 
    isSelected: boolean; 
    isFocused: boolean; 
  }) => {
    const hasAlert = (metrics.zoneCompliance || 0) < 60 || 
                    metrics.connectionStatus !== 'connected' ||
                    metrics.heartRate > 180 || 
                    metrics.heartRate < 60;
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg",
          isSelected && "ring-2 ring-primary",
          isFocused && "ring-2 ring-blue-500",
          hasAlert && "border-red-500"
        )}
        onClick={() => handlePlayerSelect(metrics.playerId)}
        onDoubleClick={() => handlePlayerSelect(metrics.playerId, true)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{metrics.playerName}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  metrics.connectionStatus === 'connected' ? 'bg-green-500' :
                  metrics.connectionStatus === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
              </div>
              <Badge variant={
                (metrics.zoneCompliance || 0) >= 80 ? "default" : 
                (metrics.zoneCompliance || 0) >= 60 ? "secondary" : "destructive"
              }>
                {Math.round(metrics.zoneCompliance || 0)}%
              </Badge>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="font-mono">{metrics.heartRate}</span>
                <span className="text-xs text-muted-foreground">BPM</span>
              </div>
              
              {metrics.watts && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span className="font-mono">{metrics.watts}</span>
                  <span className="text-xs text-muted-foreground">W</span>
                </div>
              )}
              
              {metrics.speed && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span className="font-mono">{metrics.speed}</span>
                  <span className="text-xs text-muted-foreground">km/h</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="font-mono">{metrics.calories}</span>
                <span className="text-xs text-muted-foreground">Cal</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            {metrics.intervalProgress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{metrics.currentInterval}</span>
                  <span>{metrics.intervalProgress}%</span>
                </div>
                <Progress value={metrics.intervalProgress} className="h-1" />
              </div>
            )}
            
            {/* Alerts */}
            {hasAlert && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Attention required</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={cn("h-full flex flex-col bg-background", isFullScreen && "fixed inset-0 z-50")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {onBack && !isFullScreen && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{session.intervalProgram.name}</h2>
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(sessionControl.status))} />
              <Badge variant="outline" className="capitalize">
                {sessionControl.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {participants.length} participants • Group Session Monitor
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-muted-foreground capitalize">
              {connectionStatus}
            </span>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'focus' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('focus')}
              disabled={!focusedPlayer}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Team Overview Bar */}
      <div className="px-4 py-2 bg-muted/50 border-b">
        <div className="grid grid-cols-6 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{teamMetrics.averageHeartRate}</div>
            <div className="text-muted-foreground">Avg HR</div>
          </div>
          {teamMetrics.averageWatts && (
            <div className="text-center">
              <div className="font-bold text-lg">{teamMetrics.averageWatts}</div>
              <div className="text-muted-foreground">Avg Power</div>
            </div>
          )}
          <div className="text-center">
            <div className="font-bold text-lg">{teamMetrics.totalCalories}</div>
            <div className="text-muted-foreground">Total Cal</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{teamMetrics.averageZoneCompliance}%</div>
            <div className="text-muted-foreground">Compliance</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{teamMetrics.playersInTargetZone}/{teamMetrics.totalPlayers}</div>
            <div className="text-muted-foreground">In Zone</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{formatTime(teamMetrics.estimatedTimeRemaining)}</div>
            <div className="text-muted-foreground">Remaining</div>
          </div>
        </div>
      </div>
      
      {/* Session Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          {sessionControl.status === 'scheduled' && (
            <Button 
              onClick={() => handleSessionControl('start')}
              disabled={!sessionControl.canControl}
              className="h-8"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Session
            </Button>
          )}
          
          {sessionControl.status === 'active' && (
            <>
              <Button 
                variant="outline"
                onClick={() => handleSessionControl('pause')}
                disabled={!sessionControl.canControl}
                className="h-8"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause All
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleSessionControl('emergency_stop')}
                disabled={!sessionControl.canControl}
                className="h-8"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Emergency Stop
              </Button>
            </>
          )}
          
          {sessionControl.status === 'paused' && (
            <>
              <Button 
                onClick={() => handleSessionControl('resume')}
                disabled={!sessionControl.canControl}
                className="h-8"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume All
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleSessionControl('stop')}
                disabled={!sessionControl.canControl}
                className="h-8"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                End Session
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Metrics Filter */}
          <select 
            value={metricsFilter} 
            onChange={(e) => setMetricsFilter(e.target.value as MetricsFilter)}
            className="h-8 px-2 border rounded text-sm"
          >
            <option value="all">All Players</option>
            <option value="heart_rate">Heart Rate</option>
            <option value="power">Power Data</option>
            <option value="compliance">Low Compliance</option>
            <option value="alerts">Alerts Only</option>
          </select>
          
          {/* Auto Refresh */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMetrics.map((metrics) => (
                <PlayerMetricsCard
                  key={metrics.playerId}
                  metrics={metrics}
                  isSelected={selectedPlayers.has(metrics.playerId)}
                  isFocused={focusedPlayer === metrics.playerId}
                />
              ))}
            </div>
          </div>
        )}
        
        {viewMode === 'list' && (
          <div className="h-full">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                {filteredMetrics.map((metrics) => (
                  <Card 
                    key={metrics.playerId}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPlayers.has(metrics.playerId) && "ring-2 ring-primary",
                      focusedPlayer === metrics.playerId && "ring-2 ring-blue-500"
                    )}
                    onClick={() => handlePlayerSelect(metrics.playerId)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{metrics.playerName}</span>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              metrics.connectionStatus === 'connected' ? 'bg-green-500' :
                              metrics.connectionStatus === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
                            )} />
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span className="font-mono">{metrics.heartRate} BPM</span>
                            </div>
                            
                            {metrics.watts && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                <span className="font-mono">{metrics.watts} W</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="font-mono">{metrics.calories} Cal</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            (metrics.zoneCompliance || 0) >= 80 ? "default" : 
                            (metrics.zoneCompliance || 0) >= 60 ? "secondary" : "destructive"
                          }>
                            {Math.round(metrics.zoneCompliance || 0)}%
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayerSelect(metrics.playerId, true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {viewMode === 'focus' && focusedPlayer && (
          <div className="p-4 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {playerMetrics.get(focusedPlayer)?.playerName} - Detailed View
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFocusedPlayer(null);
                      setViewMode('grid');
                    }}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Detailed individual player view would be implemented here */}
                <div className="text-center text-muted-foreground">
                  Detailed player metrics, zone tracking, and individual session controls
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {filteredMetrics.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Alert className="max-w-md">
              <Users className="h-4 w-4" />
              <AlertDescription>
                No players match the current filter criteria.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}