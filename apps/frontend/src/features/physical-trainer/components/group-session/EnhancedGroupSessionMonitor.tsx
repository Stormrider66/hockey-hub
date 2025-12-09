'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  User, 
  Grid3X3,
  List,
  Eye,
  Activity,
  Target,
  Settings,
  Maximize2,
  Minimize2,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Import our new components
import GroupSessionMonitor from './GroupSessionMonitor';
import PlayerDetailView from './PlayerDetailView';
import SessionControlPanel from './SessionControlPanel';
import { useGroupSessionBroadcast, type RealTimePlayerMetrics, type TeamAggregateMetrics } from '../../hooks/useGroupSessionBroadcast';

// Import workout types
import type { 
  ConditioningSession,
  PlayerTestResult,
  WorkoutSession 
} from '../../types/conditioning.types';
import type { StrengthWorkout } from '../../types/strength.types';
import type { HybridWorkout } from '../../types/hybrid.types';
import type { AgilityWorkout } from '../../types/agility.types';

// Unified workout session type
type UnifiedWorkoutSession = ConditioningSession | StrengthWorkout | HybridWorkout | AgilityWorkout | WorkoutSession;

interface EnhancedGroupSessionMonitorProps {
  sessionId: string;
  workout: UnifiedWorkoutSession;
  workoutType: 'conditioning' | 'strength' | 'hybrid' | 'agility';
  participants: Array<{
    id: string;
    name: string;
    playerTests?: PlayerTestResult[];
    medicalRestrictions?: string[];
  }>;
  onBack?: () => void;
}

type ViewMode = 'overview' | 'grid' | 'list' | 'focus' | 'control';

export default function EnhancedGroupSessionMonitor({
  sessionId,
  workout,
  workoutType,
  participants,
  onBack
}: EnhancedGroupSessionMonitorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [focusedPlayer, setFocusedPlayer] = useState<string | null>(null);
  
  // WebSocket integration
  const {
    connectionStatus,
    sessionStatus,
    playerMetrics,
    teamMetrics,
    getPlayerMetrics,
    getPlayersWithAlerts,
    sendSessionControl,
    sendPlayerControl,
    sendTrainerMessage,
    emergencyStopAll,
    isTrainer
  } = useGroupSessionBroadcast(sessionId, 'trainer');
  
  // Generate mock historical data for focused player
  const generateMockHistoricalData = (playerId: string) => {
    const data = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      data.push({
        timestamp: new Date(now - i * 60000), // Every minute
        heartRate: 140 + Math.random() * 30,
        watts: 200 + Math.random() * 50,
        zoneCompliance: 60 + Math.random() * 40
      });
    }
    return data;
  };
  
  // Get workout name based on type
  const getWorkoutName = () => {
    switch (workoutType) {
      case 'conditioning':
        return (workout as ConditioningSession).intervalProgram?.name || 'Conditioning Session';
      case 'strength':
        return (workout as StrengthWorkout).name || 'Strength Workout';
      case 'hybrid':
        return (workout as HybridWorkout).name || 'Hybrid Workout';
      case 'agility':
        return (workout as AgilityWorkout).name || 'Agility Training';
      default:
        return 'Training Session';
    }
  };
  
  // Get workout equipment/type info
  const getWorkoutTypeInfo = () => {
    switch (workoutType) {
      case 'conditioning':
        const conditioningSession = workout as ConditioningSession;
        return {
          type: 'Conditioning',
          equipment: conditioningSession.equipment?.[0] || 'Mixed',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'strength':
        return {
          type: 'Strength Training',
          equipment: 'Weights',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'hybrid':
        return {
          type: 'Hybrid Training',
          equipment: 'Mixed',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      case 'agility':
        return {
          type: 'Agility Training',
          equipment: 'Cones & Ladders',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      default:
        return {
          type: 'Training',
          equipment: 'Mixed',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };
  
  const workoutInfo = getWorkoutTypeInfo();
  
  // Player selection handlers
  const handlePlayerSelect = (playerId: string, exclusive = false) => {
    if (exclusive) {
      setSelectedPlayers(new Set([playerId]));
      setFocusedPlayer(playerId);
      setViewMode('focus');
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
  };
  
  // Session control handlers
  const handleSessionControl = async (
    action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop',
    targetPlayers?: string[],
    reason?: string
  ) => {
    try {
      if (action === 'emergency_stop') {
        await emergencyStopAll(reason);
      } else {
        await sendSessionControl(action, targetPlayers, reason);
      }
    } catch (error) {
      console.error('Session control error:', error);
    }
  };
  
  const handlePlayerControl = async (
    playerId: string,
    action: 'pause' | 'resume' | 'modify_targets' | 'send_message' | 'flag_attention' | 'emergency_stop',
    data?: any
  ) => {
    try {
      await sendPlayerControl(playerId, action, data);
    } catch (error) {
      console.error('Player control error:', error);
    }
  };
  
  const handleSendMessage = async (
    message: string,
    targetPlayerId?: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ) => {
    try {
      await sendTrainerMessage(message, targetPlayerId, priority);
    } catch (error) {
      console.error('Message send error:', error);
    }
  };
  
  const handleEmergencyStop = async (reason?: string) => {
    try {
      await emergencyStopAll(reason);
    } catch (error) {
      console.error('Emergency stop error:', error);
    }
  };
  
  // Get focused player data
  const focusedPlayerData = focusedPlayer ? getPlayerMetrics(focusedPlayer) : null;
  const focusedPlayerInfo = participants.find(p => p.id === focusedPlayer);
  
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
              <h2 className="text-2xl font-bold">{getWorkoutName()}</h2>
              <Badge variant="outline" className={cn("capitalize", workoutInfo.color)}>
                {workoutInfo.type}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {participants.length} participants • {workoutInfo.equipment} • Group Monitor
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {connectionStatus.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-muted-foreground">
              {connectionStatus.latency}ms
            </span>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('overview')}
            >
              <Activity className="h-4 w-4" />
            </Button>
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
              variant={viewMode === 'control' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('control')}
            >
              <Settings className="h-4 w-4" />
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
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
            {/* Left: Session Control */}
            <div className="lg:col-span-1">
              <SessionControlPanel
                sessionId={sessionId}
                sessionStatus={sessionStatus}
                teamMetrics={teamMetrics}
                playerMetrics={playerMetrics}
                selectedPlayers={selectedPlayers}
                onSessionControl={handleSessionControl}
                onPlayerControl={handlePlayerControl}
                onSendMessage={handleSendMessage}
                onEmergencyStop={handleEmergencyStop}
                canControl={connectionStatus.isConnected}
              />
            </div>
            
            {/* Right: Player Grid */}
            <div className="lg:col-span-2">
              <GroupSessionMonitor
                sessionId={sessionId}
                session={workout as ConditioningSession} // Type assertion for now
                mode="group"
                participants={participants.map(p => ({
                  ...p,
                  realTimeMetrics: getPlayerMetrics(p.id) || undefined
                }))}
                onPlayerFocus={handlePlayerSelect}
              />
            </div>
          </div>
        )}
        
        {viewMode === 'grid' && (
          <GroupSessionMonitor
            sessionId={sessionId}
            session={workout as ConditioningSession}
            mode="group"
            participants={participants.map(p => ({
              ...p,
              realTimeMetrics: getPlayerMetrics(p.id) || undefined
            }))}
            onPlayerFocus={handlePlayerSelect}
          />
        )}
        
        {viewMode === 'list' && (
          <div className="p-4 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Player List View</span>
                  <Badge variant="outline">
                    {playerMetrics.length} connected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playerMetrics.map((metrics) => (
                    <Card 
                      key={metrics.playerId}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedPlayers.has(metrics.playerId) && "ring-2 ring-primary"
                      )}
                      onClick={() => handlePlayerSelect(metrics.playerId)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{metrics.playerName}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span>HR: {metrics.heartRate}</span>
                              {metrics.watts && <span>Power: {metrics.watts}W</span>}
                              <span>Cal: {metrics.calories}</span>
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
              </CardContent>
            </Card>
          </div>
        )}
        
        {viewMode === 'focus' && focusedPlayerData && focusedPlayerInfo && (
          <div className="p-4 h-full">
            <PlayerDetailView
              playerId={focusedPlayerData.playerId}
              playerName={focusedPlayerData.playerName}
              currentMetrics={focusedPlayerData}
              historicalData={generateMockHistoricalData(focusedPlayerData.playerId)}
              medicalRestrictions={focusedPlayerInfo.medicalRestrictions}
              targetZones={{
                heartRate: { min: 140, max: 170 },
                power: { min: 180, max: 220 }
              }}
              onPlayerControl={(action) => handlePlayerControl(focusedPlayerData.playerId, action)}
              onClose={() => {
                setFocusedPlayer(null);
                setViewMode('grid');
              }}
            />
          </div>
        )}
        
        {viewMode === 'control' && (
          <div className="p-4 h-full">
            <SessionControlPanel
              sessionId={sessionId}
              sessionStatus={sessionStatus}
              teamMetrics={teamMetrics}
              playerMetrics={playerMetrics}
              selectedPlayers={selectedPlayers}
              onSessionControl={handleSessionControl}
              onPlayerControl={handlePlayerControl}
              onSendMessage={handleSendMessage}
              onEmergencyStop={handleEmergencyStop}
              canControl={connectionStatus.isConnected}
            />
          </div>
        )}
        
        {/* No Connection Alert */}
        {!connectionStatus.isConnected && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Alert className="max-w-md">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Connection lost. Attempting to reconnect...
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}