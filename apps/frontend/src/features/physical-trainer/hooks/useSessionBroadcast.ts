import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { OfflineQueueManager } from '../utils/offlineQueueManager';
import { io, Socket } from 'socket.io-client';

interface BroadcastMetrics {
  // Common metrics for all workout types
  workoutId: string;
  eventId?: string;
  workoutType: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY' | 'STABILITY_CORE' | 'PLYOMETRICS' | 'WRESTLING';
  playerId: string;
  playerName: string;
  timestamp: string;
  
  // Progress metrics
  overallProgress: number; // 0-100
  currentPhase?: string; // warmup, main, cooldown
  isCompleted: boolean;
  isPaused: boolean;
  
  // Time metrics
  totalTimeElapsed: number; // seconds
  estimatedTimeRemaining?: number;
  
  // Type-specific metrics
  // Strength
  currentExercise?: string;
  currentSet?: number;
  totalSets?: number;
  currentReps?: number;
  currentLoad?: string;
  
  // Conditioning
  currentInterval?: string;
  intervalIndex?: number;
  totalIntervals?: number;
  intervalTimeRemaining?: number;
  heartRate?: number;
  targetHeartRate?: number;
  targetPower?: number;
  targetPace?: string;
  
  // Hybrid
  currentBlock?: string;
  blockType?: 'exercise' | 'interval' | 'transition';
  blockIndex?: number;
  totalBlocks?: number;
  
  // Agility
  currentDrill?: string;
  drillIndex?: number;
  totalDrills?: number;
  currentRep?: number;
  totalReps?: number;
  lastTime?: number;
  bestTime?: number;
  rpe?: number;
  
  // PHASE 5.2: New workout type metrics
  // Stability & Core
  currentHold?: string;
  holdNumber?: number;
  totalHolds?: number;
  holdTimeRemaining?: number;
  stabilityScore?: number;
  balanceConfidence?: number;
  surfaceType?: string;
  difficulty?: string;
  
  // Plyometrics
  currentJump?: string;
  jumpNumber?: number;
  totalJumps?: number;
  lastJumpHeight?: number;
  lastJumpDistance?: number;
  contactTime?: number;
  flightTime?: number;
  reactiveStrengthIndex?: number;
  landingRating?: number;
  injuryRiskLevel?: 'low' | 'moderate' | 'high';
  
  // Wrestling
  currentRound?: string;
  roundNumber?: number;
  totalRounds?: number;
  roundTimeRemaining?: number;
  currentPosition?: string;
  controlStatus?: string;
  techniqueScore?: number;
  intensityRating?: number;
  partnerId?: string;
  partnerName?: string;
}

interface UseSessionBroadcastProps {
  enabled?: boolean;
  throttleMs?: number;
  onConnectionChange?: (connected: boolean) => void;
}

export function useSessionBroadcast({
  enabled = true,
  throttleMs = 2000, // Default 2 second throttle
  onConnectionChange
}: UseSessionBroadcastProps = {}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [queuedUpdates, setQueuedUpdates] = useState<number>(0);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const lastBroadcastRef = useRef<number>(0);
  const reconnectAttemptsRef = useRef(0);
  const offlineQueueRef = useRef<OfflineQueueManager>(new OfflineQueueManager());
  const currentSessionIdRef = useRef<string | null>(null);
  
  // Connect to Socket.IO
  const connect = useCallback(() => {
    if (!enabled || !user?.id) return;
    
    try {
      // Use the training service Socket.IO endpoint
      const socketUrl = 'http://localhost:3004';
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000
      });
      
      socketRef.current.on('connect', () => {
        console.log('Session broadcast connected');
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
        
        // Authenticate
        socketRef.current?.emit('authenticate', {
          userId: user.id,
          role: 'player', // or get from user context
          token: user.token || 'mock-token'
        });
        
        // Send any queued updates
        const queue = offlineQueueRef.current.getQueue();
        if (queue.length > 0) {
          const sentIds: string[] = [];
          queue.forEach(item => {
            try {
              socketRef.current?.emit('workout_update', {
                type: item.type,
                data: item.data
              });
              sentIds.push(item.id);
            } catch (error) {
              console.error('Failed to send queued update:', error);
              offlineQueueRef.current.incrementRetryCount(item.id);
            }
          });
          
          // Mark successfully sent items
          if (sentIds.length > 0) {
            offlineQueueRef.current.markAsSent(sentIds);
          }
          
          setQueuedUpdates(offlineQueueRef.current.getQueueSize());
        }
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('Session broadcast disconnected:', reason);
        setIsConnected(false);
        onConnectionChange?.(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, reconnect manually
          socketRef.current?.connect();
        }
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.error('Session broadcast connection error:', error);
        setIsReconnecting(true);
      });
      
      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`Session broadcast reconnected after ${attemptNumber} attempts`);
        setIsReconnecting(false);
      });
      
      socketRef.current.on('reconnect_failed', () => {
        console.error('Session broadcast reconnection failed');
        setIsReconnecting(false);
      });
      
      socketRef.current.on('authenticated', (response) => {
        console.log('Session broadcast authenticated:', response);
      });
      
      socketRef.current.on('error', (error) => {
        console.error('Session broadcast server error:', error);
      });
      
    } catch (error) {
      console.error('Failed to connect to session broadcast:', error);
    }
  }, [enabled, user?.id, user?.token, onConnectionChange]);
  
  // Disconnect from Socket.IO
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Leave current session if joined
    if (currentSessionIdRef.current && socketRef.current) {
      socketRef.current.emit('session:leave', currentSessionIdRef.current);
      currentSessionIdRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);
  
  // Join session for broadcasting
  const joinSession = useCallback((sessionId: string, workoutId?: string, eventId?: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot join session: not connected');
      return;
    }
    
    // Leave current session if already joined to another
    if (currentSessionIdRef.current && currentSessionIdRef.current !== sessionId) {
      socketRef.current.emit('session:leave', currentSessionIdRef.current);
    }
    
    currentSessionIdRef.current = sessionId;
    socketRef.current.emit('session:join', { sessionId, workoutId, eventId });
    console.log(`Joined session ${sessionId} for broadcasting`);
  }, [isConnected]);

  // Broadcast metrics with throttling
  const broadcast = useCallback((metrics: BroadcastMetrics) => {
    if (!enabled) return;
    
    const now = Date.now();
    const timeSinceLastBroadcast = now - lastBroadcastRef.current;
    
    // Throttle updates unless it's a completion or important state change
    if (timeSinceLastBroadcast < throttleMs && 
        !metrics.isCompleted && 
        !metrics.isPaused &&
        metrics.currentPhase !== 'cooldown') {
      return;
    }
    
    lastBroadcastRef.current = now;
    
    // Add user info to metrics
    const enrichedMetrics: BroadcastMetrics = {
      ...metrics,
      playerId: user?.id || '',
      playerName: user?.name || 'Unknown Player',
      timestamp: new Date().toISOString()
    };
    
    if (isConnected && socketRef.current?.connected) {
      socketRef.current.emit('workout_update', {
        type: 'workout_update',
        data: enrichedMetrics
      });
    } else {
      // Queue update for when connection is restored
      offlineQueueRef.current.addToQueue(enrichedMetrics);
      setQueuedUpdates(offlineQueueRef.current.getQueueSize());
    }
  }, [enabled, throttleMs, isConnected, user]);
  
  // Effect to handle connection lifecycle
  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);
  
  // Update queue size periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueuedUpdates(offlineQueueRef.current.getQueueSize());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Helper functions for specific workout types
  const broadcastStrengthUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentExercise: string;
    currentSet: number;
    totalSets: number;
    currentReps: number;
    currentLoad?: string;
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'STRENGTH',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);
  
  const broadcastConditioningUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentInterval: string;
    intervalIndex: number;
    totalIntervals: number;
    intervalTimeRemaining: number;
    heartRate?: number;
    targetHeartRate?: number;
    targetPower?: number;
    targetPace?: string;
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'CONDITIONING',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);
  
  const broadcastHybridUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentBlock: string;
    blockType: 'exercise' | 'interval' | 'transition';
    blockIndex: number;
    totalBlocks: number;
    totalTimeElapsed: number;
    currentExercise?: string;
    currentSet?: number;
    totalSets?: number;
    currentInterval?: string;
    intervalTimeRemaining?: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'HYBRID',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);
  
  const broadcastAgilityUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentPhase: 'warmup' | 'drills' | 'cooldown';
    currentDrill?: string;
    drillIndex?: number;
    totalDrills?: number;
    currentRep?: number;
    totalReps?: number;
    lastTime?: number;
    bestTime?: number;
    rpe?: number;
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'AGILITY',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);
  
  // PHASE 3.3: Type-Specific Broadcasting Functions
  
  const broadcastStrengthSetCompletion = useCallback((data: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    totalSets: number;
    reps: number;
    weight: number;
    weightUnit: 'kg' | 'lbs';
    rpe?: number;
    formRating?: number;
    tempo?: string;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:strength:set:completion', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastConditioningIntervalTransition = useCallback((data: {
    sessionId: string;
    intervalId: string;
    fromInterval: { name: string; type: string; intensity: number };
    toInterval: { name: string; type: string; intensity: number; duration: number };
    lastIntervalMetrics?: { avgHeartRate?: number; zoneCompliance: number; avgPower?: number };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:conditioning:interval:transition', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastZoneCompliance = useCallback((data: {
    sessionId: string;
    intervalId: string;
    currentHeartRate?: number;
    targetZone: { min: number; max: number; name: string };
    actualZone?: string;
    compliancePercentage: number;
    isInZone: boolean;
    zoneViolationDuration?: number;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    // Throttle zone compliance updates more aggressively
    const now = Date.now();
    const timeSinceLastBroadcast = now - lastBroadcastRef.current;
    if (timeSinceLastBroadcast < 1000) return; // 1 second throttle
    
    lastBroadcastRef.current = now;
    
    socketRef.current.emit('training:conditioning:zone:compliance', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastHybridBlockTransition = useCallback((data: {
    sessionId: string;
    fromBlock: { id: string; type: string; name: string; index: number };
    toBlock: { id: string; type: string; name: string; index: number; estimatedDuration?: number };
    totalBlocks: number;
    overallProgress: number;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:hybrid:block:transition', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastHybridMixedMetrics = useCallback((data: {
    sessionId: string;
    currentBlock: { id: string; type: string; name: string };
    metrics: {
      // Strength metrics
      currentSet?: number;
      reps?: number;
      weight?: number;
      // Conditioning metrics
      heartRate?: number;
      heartRateZone?: number;
      power?: number;
      pace?: string;
      // Universal metrics
      timeInBlock: number;
      rpe?: number;
      fatigue?: number;
    };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:hybrid:mixed:metrics', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastAgilityDrillCompletion = useCallback((data: {
    sessionId: string;
    drillId: string;
    drillName: string;
    pattern: string;
    attemptNumber: number;
    totalAttempts: number;
    completionTime: number;
    bestTime?: number;
    averageTime?: number;
    errors: number;
    errorTypes?: string[];
    performanceRating?: 'excellent' | 'good' | 'average' | 'needs_improvement';
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:agility:drill:completion', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastAgilityPatternProgress = useCallback((data: {
    sessionId: string;
    drillId: string;
    currentPhase: 'setup' | 'execution' | 'recovery' | 'feedback';
    patternProgress: {
      currentStep: number;
      totalSteps: number;
      stepName: string;
      stepInstructions?: string;
    };
    visualCues?: {
      conePositions?: { x: number; y: number; label: string }[];
      pathTrace?: { x: number; y: number }[];
      currentPosition?: { x: number; y: number };
    };
    audioInstructions?: string;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:agility:pattern:progress', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  // Bulk session operations (trainer only)
  const broadcastBulkOperation = useCallback((data: {
    bundleId: string;
    operation: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all';
    affectedSessions: string[];
    reason?: string;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:bulk:operation:status', {
      ...data,
      status: 'initiated',
      executedBy: user?.id || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  const broadcastCrossSessionParticipantMove = useCallback((data: {
    bundleId: string;
    playerId: string;
    fromSessionId: string;
    toSessionId: string;
    moveReason: string;
    medicalNotes?: string;
    preserveProgress: boolean;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:bulk:participant:move', {
      ...data,
      playerName: user?.name || '',
      approvedBy: user?.id || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  // PHASE 5.2: Broadcast functions for new workout types
  
  const broadcastStabilityCoreUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentHold: string;
    holdNumber: number;
    totalHolds: number;
    holdTimeRemaining?: number;
    stabilityScore?: number;
    balanceConfidence?: number;
    surfaceType?: string;
    difficulty?: string;
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'STABILITY_CORE',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);

  const broadcastStabilityCoreBalanceUpdate = useCallback((data: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    balanceMetrics: {
      centerOfGravityX: number;
      centerOfGravityY: number;
      stabilityScore: number;
      swayVelocity: number;
      balanceConfidence: number;
    };
    holdProgress: {
      currentHoldTime: number;
      targetHoldTime: number;
      holdNumber: number;
      totalHolds: number;
      isHolding: boolean;
    };
    surfaceType: 'stable' | 'foam' | 'bosu' | 'balance_board' | 'stability_ball';
    difficulty: 'eyes_open' | 'eyes_closed' | 'single_leg' | 'dynamic' | 'perturbation';
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:stability:balance:update', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastStabilityCoreHoldCompletion = useCallback((data: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    holdNumber: number;
    totalHolds: number;
    holdDuration: number;
    targetDuration: number;
    completionStatus: 'completed' | 'partial' | 'failed' | 'modified';
    performanceMetrics: {
      averageStability: number;
      peakInstability: number;
      recoveryTime: number;
      qualityScore: number;
    };
    progressionRecommendation?: {
      nextDifficulty?: string;
      holdTimeAdjustment?: number;
      surfaceProgression?: string;
    };
    restTimeRemaining?: number;
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:stability:hold:completion', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastPlyometricsUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentJump: string;
    jumpNumber: number;
    totalJumps: number;
    lastJumpHeight?: number;
    lastJumpDistance?: number;
    contactTime?: number;
    flightTime?: number;
    reactiveStrengthIndex?: number;
    landingRating?: number;
    injuryRiskLevel?: 'low' | 'moderate' | 'high';
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'PLYOMETRICS',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);

  const broadcastPlyometricsJumpMeasurement = useCallback((data: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    jumpType: 'vertical' | 'broad' | 'lateral' | 'reactive' | 'depth' | 'box';
    jumpNumber: number;
    totalJumps: number;
    measurements: {
      height?: number;
      distance?: number;
      contactTime: number;
      flightTime: number;
      reactiveStrengthIndex?: number;
      forceProduction?: number;
      powerOutput?: number;
      asymmetryIndex?: number;
    };
    techniqueAnalysis: {
      takeoffRating: number;
      landingRating: number;
      armSwingCoordination: number;
      overallTechnique: number;
    };
    performanceZone: 'peak' | 'maintenance' | 'declining' | 'fatigue_risk';
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:plyometrics:jump:measurement', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastPlyometricsLandingQuality = useCallback((data: {
    sessionId: string;
    exerciseId: string;
    jumpNumber: number;
    landingAssessment: {
      bilateralLanding: boolean;
      kneeValgusAngle: number;
      dorsifloexionAngle: number;
      trunkStability: number;
      soundLevel: 'silent' | 'quiet' | 'moderate' | 'loud';
      controlRating: number;
    };
    injuryRiskIndicators: {
      riskLevel: 'low' | 'moderate' | 'high';
      riskFactors: string[];
      recommendedAction: 'continue' | 'technique_focus' | 'reduce_intensity' | 'stop_exercise';
    };
    fatigueIndicators: {
      contactTimeIncrease: number;
      techniqueDeterioration: number;
      compensationPatterns: string[];
    };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:plyometrics:landing:quality', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastWrestlingUpdate = useCallback((data: {
    workoutId: string;
    eventId?: string;
    overallProgress: number;
    currentRound: string;
    roundNumber: number;
    totalRounds: number;
    roundTimeRemaining?: number;
    currentPosition?: string;
    controlStatus?: string;
    techniqueScore?: number;
    intensityRating?: number;
    partnerId?: string;
    partnerName?: string;
    totalTimeElapsed: number;
    isCompleted?: boolean;
    isPaused?: boolean;
  }) => {
    broadcast({
      ...data,
      workoutType: 'WRESTLING',
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [broadcast, user]);

  const broadcastWrestlingRoundTransition = useCallback((data: {
    sessionId: string;
    drillId: string;
    drillName: string;
    roundNumber: number;
    totalRounds: number;
    roundType: 'drilling' | 'situational' | 'live_wrestling' | 'conditioning' | 'technique_review';
    transitionType: 'automatic' | 'manual' | 'injury_break' | 'technique_correction';
    roundDuration: number;
    plannedDuration: number;
    intensityRating: number;
    partnerInfo?: {
      partnerId?: string;
      partnerName?: string;
      weightDifference?: number;
      skillLevelDifference?: string;
    };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:wrestling:round:transition', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastWrestlingTechniqueScore = useCallback((data: {
    sessionId: string;
    drillId: string;
    techniqueCategory: 'takedown' | 'escape' | 'reversal' | 'pin' | 'defense' | 'positioning';
    specificTechnique: string;
    attemptNumber: number;
    roundNumber: number;
    executionRating: {
      setup: number;
      execution: number;
      finishing: number;
      timing: number;
      overallScore: number;
    };
    successOutcome: 'successful' | 'partially_successful' | 'defended' | 'countered';
    techniqueFeedback: {
      strengthAreas: string[];
      improvementAreas: string[];
      coachNotes?: string;
    };
    conditioningImpact: {
      heartRateSpike: number;
      breathingIntensity: number;
      muscularFatigue: number;
      mentalFocus: number;
    };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:wrestling:technique:score', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);

  const broadcastWrestlingPositionControl = useCallback((data: {
    sessionId: string;
    drillId: string;
    position: 'neutral' | 'top' | 'bottom' | 'referee_position' | 'standing' | 'ground';
    controlStatus: 'controlling' | 'being_controlled' | 'scrambling' | 'transitioning';
    positionDuration: number;
    controlQuality: {
      stability: number;
      pressure: number;
      advancement: number;
      defensiveIntegrity: number;
    };
    transitionAttempts: {
      initiated: number;
      successful: number;
      defended: number;
    };
    energyExpenditure: {
      currentIntensity: number;
      cumulativeFatigue: number;
      efficiency: number;
    };
    tacticalElements: {
      aggression: number;
      strategy: number;
      adaptation: number;
      mentalToughness: number;
    };
  }) => {
    if (!isConnected || !socketRef.current?.connected) return;
    
    socketRef.current.emit('training:wrestling:position:control', {
      ...data,
      playerId: user?.id || '',
      playerName: user?.name || '',
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user]);
  
  return {
    isConnected,
    isReconnecting,
    queuedUpdates,
    broadcast,
    // Legacy broadcast functions
    broadcastStrengthUpdate,
    broadcastConditioningUpdate,
    broadcastHybridUpdate,
    broadcastAgilityUpdate,
    // New type-specific broadcast functions
    broadcastStrengthSetCompletion,
    broadcastConditioningIntervalTransition,
    broadcastZoneCompliance,
    broadcastHybridBlockTransition,
    broadcastHybridMixedMetrics,
    broadcastAgilityDrillCompletion,
    broadcastAgilityPatternProgress,
    // PHASE 5.2: New workout type broadcast functions
    broadcastStabilityCoreUpdate,
    broadcastStabilityCoreBalanceUpdate,
    broadcastStabilityCoreHoldCompletion,
    broadcastPlyometricsUpdate,
    broadcastPlyometricsJumpMeasurement,
    broadcastPlyometricsLandingQuality,
    broadcastWrestlingUpdate,
    broadcastWrestlingRoundTransition,
    broadcastWrestlingTechniqueScore,
    broadcastWrestlingPositionControl,
    // Bulk operation functions
    broadcastBulkOperation,
    broadcastCrossSessionParticipantMove,
    // Session management
    joinSession,
    disconnect
  };
}