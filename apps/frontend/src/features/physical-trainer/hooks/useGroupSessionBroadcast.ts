'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/hooks';

// WebSocket event types for group session monitoring
export enum GroupSessionEvent {
  // Session lifecycle
  JOIN_GROUP_SESSION = 'join_group_session',
  LEAVE_GROUP_SESSION = 'leave_group_session',
  GROUP_SESSION_JOINED = 'group_session_joined',
  GROUP_SESSION_LEFT = 'group_session_left',
  
  // Real-time metrics broadcasting
  PLAYER_METRICS_BROADCAST = 'player_metrics_broadcast',
  TEAM_METRICS_UPDATE = 'team_metrics_update',
  ZONE_COMPLIANCE_ALERT = 'zone_compliance_alert',
  CONNECTION_STATUS_CHANGE = 'connection_status_change',
  
  // Session control events
  SESSION_CONTROL_COMMAND = 'session_control_command',
  PLAYER_CONTROL_COMMAND = 'player_control_command',
  EMERGENCY_STOP_ALL = 'emergency_stop_all',
  
  // Trainer-specific events
  TRAINER_MESSAGE_TO_PLAYER = 'trainer_message_to_player',
  TRAINER_TARGET_ADJUSTMENT = 'trainer_target_adjustment',
  TRAINER_ATTENTION_FLAG = 'trainer_attention_flag',
  
  // System events
  GROUP_SESSION_ERROR = 'group_session_error',
  BROADCAST_QUALITY_UPDATE = 'broadcast_quality_update'
}

// Real-time player metrics interface
export interface RealTimePlayerMetrics {
  playerId: string;
  playerName: string;
  sessionId: string;
  timestamp: Date;
  
  // Core metrics
  heartRate: number;
  watts?: number;
  rpm?: number;
  pace?: string;
  speed?: number;
  calories: number;
  distance?: number;
  
  // Session context
  currentInterval?: string;
  intervalProgress?: number;
  intervalTimeRemaining?: number;
  
  // Performance indicators
  zoneCompliance?: number;
  targetAchievement?: number;
  effortLevel?: number; // 1-10 scale
  
  // Connection and quality
  connectionStatus: 'connected' | 'disconnected' | 'poor' | 'excellent';
  signalStrength?: number;
  latency?: number;
  
  // Alerts and flags
  medicalAlerts?: string[];
  performanceFlags?: string[];
  trainerFlags?: string[];
}

// Team aggregate metrics
export interface TeamAggregateMetrics {
  sessionId: string;
  timestamp: Date;
  totalPlayers: number;
  connectedPlayers: number;
  
  // Averages
  averageHeartRate: number;
  averageWatts?: number;
  averageZoneCompliance: number;
  averageEffort: number;
  
  // Distribution
  playersInTargetZone: number;
  playersNeedingAttention: number;
  playersWithAlerts: number;
  
  // Session progress
  sessionProgress: number;
  estimatedTimeRemaining: number;
  currentPhase?: string;
  
  // Performance metrics
  totalCalories: number;
  averageDistance?: number;
  complianceDistribution: Record<string, number>; // zone: count
}

// Session control commands
export interface SessionControlCommand {
  sessionId: string;
  trainerId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop';
  targetPlayers?: string[]; // Empty = all players
  reason?: string;
  timestamp: Date;
}

// Player control commands
export interface PlayerControlCommand {
  sessionId: string;
  trainerId: string;
  playerId: string;
  action: 'pause' | 'resume' | 'modify_targets' | 'send_message' | 'flag_attention' | 'emergency_stop';
  data?: any;
  timestamp: Date;
}

// Trainer message
export interface TrainerMessage {
  sessionId: string;
  trainerId: string;
  trainerName: string;
  targetPlayerId?: string; // undefined = broadcast to all
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
}

// Hook for group session broadcasting and monitoring
export function useGroupSessionBroadcast(sessionId: string, role: 'trainer' | 'player' = 'trainer') {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const [broadcastCount, setBroadcastCount] = useState(0);
  
  // Real-time data state
  const [playerMetrics, setPlayerMetrics] = useState<Map<string, RealTimePlayerMetrics>>(new Map());
  const [teamMetrics, setTeamMetrics] = useState<TeamAggregateMetrics | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'>('scheduled');
  
  // Get current user from Redux
  const currentUser = useAppSelector((state) => state.auth.user);
  
  // Helper function to update team metrics
  const updateTeamMetrics = useCallback(() => {
    setPlayerMetrics(current => {
      const allMetrics = Array.from(current.values());
      if (allMetrics.length > 0) {
        const teamMetric: TeamAggregateMetrics = {
          sessionId,
          timestamp: new Date(),
          totalPlayers: allMetrics.length,
          connectedPlayers: allMetrics.filter(m => m.connectionStatus === 'connected').length,
          
          averageHeartRate: allMetrics.reduce((sum, m) => sum + m.heartRate, 0) / allMetrics.length,
          averageWatts: allMetrics.some(m => m.watts) ? 
            allMetrics.filter(m => m.watts).reduce((sum, m) => sum + (m.watts || 0), 0) / 
            allMetrics.filter(m => m.watts).length : undefined,
          averageZoneCompliance: allMetrics.reduce((sum, m) => sum + (m.zoneCompliance || 0), 0) / allMetrics.length,
          averageEffort: allMetrics.reduce((sum, m) => sum + (m.effortLevel || 0), 0) / allMetrics.length,
          
          playersInTargetZone: allMetrics.filter(m => (m.zoneCompliance || 0) >= 70).length,
          playersNeedingAttention: allMetrics.filter(m => (m.zoneCompliance || 0) < 60).length,
          playersWithAlerts: allMetrics.filter(m => 
            (m.medicalAlerts && m.medicalAlerts.length > 0) || 
            (m.performanceFlags && m.performanceFlags.length > 0)
          ).length,
          
          sessionProgress: allMetrics.length > 0 ? 
            allMetrics.reduce((sum, m) => sum + (m.intervalProgress || 0), 0) / allMetrics.length : 0,
          estimatedTimeRemaining: 0,
          currentPhase: 'active',
          
          totalCalories: allMetrics.reduce((sum, m) => sum + m.calories, 0),
          averageDistance: allMetrics.some(m => m.distance) ?
            allMetrics.filter(m => m.distance).reduce((sum, m) => sum + (m.distance || 0), 0) /
            allMetrics.filter(m => m.distance).length : undefined,
          complianceDistribution: {
            'excellent': allMetrics.filter(m => (m.zoneCompliance || 0) >= 90).length,
            'good': allMetrics.filter(m => (m.zoneCompliance || 0) >= 70 && (m.zoneCompliance || 0) < 90).length,
            'fair': allMetrics.filter(m => (m.zoneCompliance || 0) >= 50 && (m.zoneCompliance || 0) < 70).length,
            'poor': allMetrics.filter(m => (m.zoneCompliance || 0) < 50).length
          }
        };
        
        setTeamMetrics(teamMetric);
      }
      return current;
    });
  }, [sessionId]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId || !currentUser) return;
    
    const socketUrl = process.env.NEXT_PUBLIC_TRAINING_SERVICE_URL || 'http://localhost:3004';
    
    socket.current = io(socketUrl, {
      auth: {
        token: localStorage.getItem('authToken'),
        userId: currentUser.id,
        role: role,
        sessionId: sessionId
      },
      transports: ['websocket'],
      timeout: 5000,
      forceNew: true
    });
    
    const socketInstance = socket.current;
    
    // Connection event handlers
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionQuality('good');
      
      // Authenticate with the training service
      socketInstance.emit('authenticate', {
        userId: currentUser.id,
        role: role,
        token: localStorage.getItem('authToken') || 'mock-token'
      });
      
      // Join the session room
      socketInstance.emit('session:join', {
        sessionId,
        workoutId: sessionId, // Use sessionId as workoutId for now
        eventId: undefined
      });
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setConnectionQuality('disconnected');
    });
    
    // Training service specific events
    socketInstance.on('authenticated', (response: any) => {
      console.log('Authenticated with training service:', response);
    });

    socketInstance.on('session:joined', (data: any) => {
      console.log('Joined training session:', data);
      setSessionStatus('active');
    });

    // Listen for workout progress updates from players
    socketInstance.on('workout:progress_update', (data: any) => {
      console.log('Workout progress update received:', data);
      
      // Convert the training service data to our RealTimePlayerMetrics format
      const playerMetric: RealTimePlayerMetrics = {
        playerId: data.playerId,
        playerName: data.playerName,
        sessionId: data.sessionId || sessionId,
        timestamp: new Date(data.timestamp),
        
        // Core metrics
        heartRate: data.heartRate || 0,
        watts: data.targetPower,
        rpm: data.rpm,
        pace: data.targetPace,
        calories: data.caloriesBurned || 0,
        
        // Session context
        currentInterval: data.currentInterval || data.currentExercise || data.currentBlock || data.currentDrill,
        intervalProgress: data.overallProgress,
        intervalTimeRemaining: data.intervalTimeRemaining,
        
        // Performance indicators
        zoneCompliance: data.heartRate && data.targetHeartRate ? 
          Math.max(0, 100 - Math.abs(data.heartRate - data.targetHeartRate) * 2) : 80,
        targetAchievement: data.overallProgress,
        effortLevel: data.rpe || 5,
        
        // Connection (assume good if we're receiving data)
        connectionStatus: 'connected' as const,
        signalStrength: 85,
        latency: 50,
        
        // Status flags
        medicalAlerts: [],
        performanceFlags: data.isPaused ? ['Paused'] : data.isCompleted ? ['Completed'] : [],
        trainerFlags: []
      };
      
      setPlayerMetrics(prev => new Map(prev.set(data.playerId, playerMetric)));
      setBroadcastCount(prev => prev + 1);
      
      // Update team metrics
      updateTeamMetrics();
    });
    
    // Group session event handlers
    socketInstance.on(GroupSessionEvent.GROUP_SESSION_JOINED, (data: any) => {
      console.log('Joined group session:', data);
    });
    
    // Real-time metrics handlers
    socketInstance.on(GroupSessionEvent.PLAYER_METRICS_BROADCAST, (metrics: RealTimePlayerMetrics) => {
      setPlayerMetrics(prev => new Map(prev.set(metrics.playerId, metrics)));
      setBroadcastCount(prev => prev + 1);
    });
    
    socketInstance.on(GroupSessionEvent.TEAM_METRICS_UPDATE, (metrics: TeamAggregateMetrics) => {
      setTeamMetrics(metrics);
    });
    
    // Alert handlers
    socketInstance.on(GroupSessionEvent.ZONE_COMPLIANCE_ALERT, (alert: any) => {
      console.log('Zone compliance alert:', alert);
      // Handle zone compliance alerts (could trigger notifications)
    });
    
    socketInstance.on(GroupSessionEvent.CONNECTION_STATUS_CHANGE, (status: any) => {
      setConnectionQuality(status.quality);
      setLatency(status.latency || 0);
    });
    
    // Session control handlers
    socketInstance.on(GroupSessionEvent.SESSION_CONTROL_COMMAND, (command: SessionControlCommand) => {
      setSessionStatus(command.action === 'start' ? 'active' : 
                      command.action === 'pause' ? 'paused' :
                      command.action === 'resume' ? 'active' :
                      command.action === 'stop' ? 'completed' : 'cancelled');
    });
    
    // Error handlers
    socketInstance.on(GroupSessionEvent.GROUP_SESSION_ERROR, (error: any) => {
      console.error('Group session error:', error);
    });
    
    // Latency monitoring
    const latencyInterval = setInterval(() => {
      const start = Date.now();
      socketInstance.emit('ping', start, (response: number) => {
        const roundTripTime = Date.now() - start;
        setLatency(roundTripTime);
        
        // Update connection quality based on latency
        if (roundTripTime < 50) setConnectionQuality('excellent');
        else if (roundTripTime < 150) setConnectionQuality('good');
        else setConnectionQuality('poor');
      });
    }, 5000);
    
    return () => {
      clearInterval(latencyInterval);
      if (socketInstance) {
        socketInstance.emit(GroupSessionEvent.LEAVE_GROUP_SESSION, { sessionId });
        socketInstance.disconnect();
      }
    };
  }, [sessionId, currentUser, role]);
  
  // Broadcast player metrics (for player clients)
  const broadcastPlayerMetrics = useCallback((metrics: Partial<RealTimePlayerMetrics>) => {
    if (!socket.current || !isConnected || role !== 'player') return;
    
    const fullMetrics: RealTimePlayerMetrics = {
      playerId: currentUser?.id || '',
      playerName: currentUser?.name || '',
      sessionId,
      timestamp: new Date(),
      connectionStatus: connectionQuality === 'disconnected' ? 'disconnected' : 'connected',
      signalStrength: connectionQuality === 'excellent' ? 100 : connectionQuality === 'good' ? 80 : 60,
      latency,
      ...metrics,
      // Required fields with defaults
      heartRate: metrics.heartRate || 0,
      calories: metrics.calories || 0
    };
    
    socket.current.emit(GroupSessionEvent.PLAYER_METRICS_BROADCAST, fullMetrics);
    setBroadcastCount(prev => prev + 1);
  }, [socket.current, isConnected, sessionId, currentUser, role, connectionQuality, latency]);
  
  // Send session control command (for trainers)
  const sendSessionControl = useCallback((action: SessionControlCommand['action'], targetPlayers?: string[], reason?: string) => {
    if (!socket.current || !isConnected || role !== 'trainer') return;
    
    const command: SessionControlCommand = {
      sessionId,
      trainerId: currentUser?.id || '',
      action,
      targetPlayers,
      reason,
      timestamp: new Date()
    };
    
    socket.current.emit(GroupSessionEvent.SESSION_CONTROL_COMMAND, command);
  }, [socket.current, isConnected, sessionId, currentUser, role]);
  
  // Send player control command (for trainers)
  const sendPlayerControl = useCallback((playerId: string, action: PlayerControlCommand['action'], data?: any) => {
    if (!socket.current || !isConnected || role !== 'trainer') return;
    
    const command: PlayerControlCommand = {
      sessionId,
      trainerId: currentUser?.id || '',
      playerId,
      action,
      data,
      timestamp: new Date()
    };
    
    socket.current.emit(GroupSessionEvent.PLAYER_CONTROL_COMMAND, command);
  }, [socket.current, isConnected, sessionId, currentUser, role]);
  
  // Send message to player(s) (for trainers)
  const sendTrainerMessage = useCallback((message: string, targetPlayerId?: string, priority: TrainerMessage['priority'] = 'normal') => {
    if (!socket.current || !isConnected || role !== 'trainer') return;
    
    const trainerMessage: TrainerMessage = {
      sessionId,
      trainerId: currentUser?.id || '',
      trainerName: currentUser?.name || '',
      targetPlayerId,
      message,
      priority,
      timestamp: new Date()
    };
    
    socket.current.emit(GroupSessionEvent.TRAINER_MESSAGE_TO_PLAYER, trainerMessage);
  }, [socket.current, isConnected, sessionId, currentUser, role]);
  
  // Emergency stop all players (for trainers)
  const emergencyStopAll = useCallback((reason?: string) => {
    if (!socket.current || !isConnected || role !== 'trainer') return;
    
    socket.current.emit(GroupSessionEvent.EMERGENCY_STOP_ALL, {
      sessionId,
      trainerId: currentUser?.id || '',
      reason: reason || 'Emergency stop initiated by trainer',
      timestamp: new Date()
    });
  }, [socket.current, isConnected, sessionId, currentUser, role]);
  
  // Get player metrics by ID
  const getPlayerMetrics = useCallback((playerId: string): RealTimePlayerMetrics | undefined => {
    return playerMetrics.get(playerId);
  }, [playerMetrics]);
  
  // Get all player metrics as array
  const getAllPlayerMetrics = useCallback((): RealTimePlayerMetrics[] => {
    return Array.from(playerMetrics.values());
  }, [playerMetrics]);
  
  // Get players with alerts
  const getPlayersWithAlerts = useCallback((): RealTimePlayerMetrics[] => {
    return Array.from(playerMetrics.values()).filter(metrics => 
      (metrics.zoneCompliance || 0) < 60 ||
      metrics.connectionStatus !== 'connected' ||
      (metrics.medicalAlerts && metrics.medicalAlerts.length > 0) ||
      (metrics.performanceFlags && metrics.performanceFlags.length > 0)
    );
  }, [playerMetrics]);
  
  // Connection status helpers
  const isConnectionHealthy = connectionQuality === 'excellent' || connectionQuality === 'good';
  const connectionStatus = {
    isConnected,
    quality: connectionQuality,
    latency,
    isHealthy: isConnectionHealthy
  };
  
  return {
    // Connection state
    connectionStatus,
    sessionStatus,
    broadcastCount,
    
    // Data access
    playerMetrics: getAllPlayerMetrics(),
    teamMetrics,
    getPlayerMetrics,
    getPlayersWithAlerts,
    
    // Actions (player)
    broadcastPlayerMetrics,
    
    // Actions (trainer)
    sendSessionControl,
    sendPlayerControl,
    sendTrainerMessage,
    emergencyStopAll,
    
    // Utilities
    isTrainer: role === 'trainer',
    isPlayer: role === 'player'
  };
}