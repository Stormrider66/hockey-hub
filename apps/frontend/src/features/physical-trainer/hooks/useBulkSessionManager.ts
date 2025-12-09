import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { io, Socket } from 'socket.io-client';
import {
  TrainingSessionSocketEvent,
  BulkSessionState,
  BulkSessionOperationPayload,
  CrossSessionParticipantMoveEvent,
  AggregateMetricsBroadcastEvent,
} from '@hockey-hub/shared-types';

interface BulkSessionBundle {
  id: string;
  name: string;
  sessions: {
    id: string;
    workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
    participants: number;
    status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  }[];
  totalParticipants: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  estimatedDuration: number;
}

interface BulkOperationResult {
  success: boolean;
  completedSessions: number;
  totalSessions: number;
  failedSessions: string[];
  errors?: { sessionId: string; error: string }[];
}

interface UseBulkSessionManagerProps {
  enabled?: boolean;
  onBundleUpdate?: (bundle: BulkSessionBundle) => void;
  onOperationComplete?: (result: BulkOperationResult) => void;
  onParticipantMove?: (moveEvent: CrossSessionParticipantMoveEvent) => void;
}

export function useBulkSessionManager({
  enabled = true,
  onBundleUpdate,
  onOperationComplete,
  onParticipantMove
}: UseBulkSessionManagerProps = {}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBundles, setActiveBundles] = useState<Map<string, BulkSessionBundle>>(new Map());
  const [currentOperation, setCurrentOperation] = useState<{
    type: string;
    bundleId: string;
    progress: number;
    status: 'running' | 'completed' | 'failed';
  } | null>(null);
  const [aggregateMetrics, setAggregateMetrics] = useState<Map<string, any>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  const operationTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !user?.id) return;
    
    try {
      const socketUrl = 'http://localhost:3002'; // Communication service
      socketRef.current = io(`${socketUrl}/training`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        auth: {
          userId: user.id,
          role: 'trainer',
          token: user.token || 'mock-token'
        }
      });
      
      socketRef.current.on('connect', () => {
        console.log('Bulk session manager connected');
        setIsConnected(true);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Bulk session manager disconnected');
        setIsConnected(false);
      });
      
      // Register event listeners
      registerEventListeners();
      
    } catch (error) {
      console.error('Failed to connect bulk session manager:', error);
    }
  }, [enabled, user]);
  
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setActiveBundles(new Map());
    setAggregateMetrics(new Map());
  }, []);
  
  // Register WebSocket event listeners
  const registerEventListeners = useCallback(() => {
    if (!socketRef.current) return;
    
    // Bulk session created
    socketRef.current.on(TrainingSessionSocketEvent.BULK_SESSION_CREATED, (payload: any) => {
      const bundle: BulkSessionBundle = {
        id: payload.bundleId,
        name: payload.bundleName,
        sessions: payload.sessionIds.map((id: string, index: number) => ({
          id,
          workoutType: payload.workoutTypes[index] || 'strength',
          participants: Math.floor(payload.totalParticipants / payload.sessionIds.length),
          status: 'scheduled'
        })),
        totalParticipants: payload.totalParticipants,
        status: 'scheduled',
        createdAt: new Date(payload.createdAt),
        estimatedDuration: payload.estimatedDuration
      };
      
      setActiveBundles(prev => new Map(prev).set(bundle.id, bundle));
      onBundleUpdate?.(bundle);
    });
    
    // Bulk session updates
    socketRef.current.on(TrainingSessionSocketEvent.BULK_SESSION_UPDATE, (payload: any) => {
      setActiveBundles(prev => {
        const newMap = new Map(prev);
        const bundle = newMap.get(payload.bundleId);
        if (bundle && payload.changes.status) {
          bundle.status = payload.changes.status;
          newMap.set(bundle.id, bundle);
          onBundleUpdate?.(bundle);
        }
        return newMap;
      });\n    });\n    \n    // Bulk operation status\n    socketRef.current.on(TrainingSessionSocketEvent.BULK_OPERATION_STATUS, (payload: BulkSessionOperationPayload) => {\n      setCurrentOperation({\n        type: payload.operation,\n        bundleId: payload.bundleId,\n        progress: (payload.progress.completed / payload.progress.total) * 100,\n        status: payload.operationStatus === 'completed' ? 'completed' : \n                payload.operationStatus === 'failed' ? 'failed' : 'running'\n      });\n      \n      if (payload.operationStatus === 'completed' || payload.operationStatus === 'failed') {\n        const result: BulkOperationResult = {\n          success: payload.operationStatus === 'completed',\n          completedSessions: payload.progress.completed,\n          totalSessions: payload.progress.total,\n          failedSessions: payload.progress.errors?.map(e => e.sessionId) || [],\n          errors: payload.progress.errors\n        };\n        \n        onOperationComplete?.(result);\n        \n        // Clear operation after 5 seconds\n        if (operationTimeoutRef.current) clearTimeout(operationTimeoutRef.current);\n        operationTimeoutRef.current = setTimeout(() => {\n          setCurrentOperation(null);\n        }, 5000);\n      }\n    });\n    \n    // Cross-session participant moves\n    socketRef.current.on(TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE, (payload: CrossSessionParticipantMoveEvent) => {\n      // Update bundle participant counts\n      setActiveBundles(prev => {\n        const newMap = new Map(prev);\n        const bundle = newMap.get(payload.bundleId);\n        if (bundle) {\n          const fromSession = bundle.sessions.find(s => s.id === payload.fromSession.sessionId);\n          const toSession = bundle.sessions.find(s => s.id === payload.toSession.sessionId);\n          \n          if (fromSession && toSession) {\n            fromSession.participants--;\n            toSession.participants++;\n            newMap.set(bundle.id, bundle);\n            onBundleUpdate?.(bundle);\n          }\n        }\n        return newMap;\n      });\n      \n      onParticipantMove?.(payload);\n    });\n    \n    // Aggregate metrics updates\n    socketRef.current.on(TrainingSessionSocketEvent.AGGREGATE_METRICS_BROADCAST, (payload: AggregateMetricsBroadcastEvent) => {\n      setAggregateMetrics(prev => {\n        const newMap = new Map(prev);\n        newMap.set(payload.bundleId, payload.aggregatedMetrics);\n        return newMap;\n      });\n    });\n  }, [onBundleUpdate, onOperationComplete, onParticipantMove]);\n  \n  // Bulk operation functions\n  const createBulkSession = useCallback(async (bundleData: {\n    name: string;\n    sessionConfigs: {\n      workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';\n      participantIds: string[];\n      facilityId?: string;\n      equipmentRequired?: string[];\n    }[];\n    scheduledStart: Date;\n    estimatedDuration: number;\n  }) => {\n    if (!isConnected || !socketRef.current) {\n      throw new Error('Not connected to WebSocket');\n    }\n    \n    const bundleId = `bundle-${Date.now()}`;\n    const sessionIds = bundleData.sessionConfigs.map((_, index) => `${bundleId}-session-${index}`);\n    \n    const payload = {\n      bundleId,\n      bundleName: bundleData.name,\n      sessionIds,\n      workoutTypes: bundleData.sessionConfigs.map(c => c.workoutType),\n      totalParticipants: bundleData.sessionConfigs.reduce((sum, config) => sum + config.participantIds.length, 0),\n      scheduledStart: bundleData.scheduledStart,\n      estimatedDuration: bundleData.estimatedDuration,\n      facilitiesRequired: bundleData.sessionConfigs\n        .map(c => c.facilityId)\n        .filter(Boolean) as string[],\n      equipmentRequired: bundleData.sessionConfigs\n        .flatMap(c => c.equipmentRequired || [])\n    };\n    \n    socketRef.current.emit(TrainingSessionSocketEvent.BULK_SESSION_CREATED, payload);\n    return bundleId;\n  }, [isConnected]);\n  \n  const executeBulkOperation = useCallback(async (\n    bundleId: string,\n    operation: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all',\n    reason?: string\n  ) => {\n    if (!isConnected || !socketRef.current) {\n      throw new Error('Not connected to WebSocket');\n    }\n    \n    const bundle = activeBundles.get(bundleId);\n    if (!bundle) {\n      throw new Error('Bundle not found');\n    }\n    \n    const payload: BulkSessionOperationPayload = {\n      bundleId,\n      operation,\n      affectedSessions: bundle.sessions.map(s => s.id),\n      operationStatus: 'initiated',\n      progress: { completed: 0, total: bundle.sessions.length },\n      executedBy: user?.id || '',\n      timestamp: new Date()\n    };\n    \n    socketRef.current.emit(TrainingSessionSocketEvent.BULK_OPERATION_STATUS, payload);\n    \n    setCurrentOperation({\n      type: operation,\n      bundleId,\n      progress: 0,\n      status: 'running'\n    });\n  }, [isConnected, activeBundles, user]);\n  \n  const moveParticipantBetweenSessions = useCallback(async (\n    bundleId: string,\n    playerId: string,\n    playerName: string,\n    fromSessionId: string,\n    toSessionId: string,\n    moveReason: string,\n    preserveProgress: boolean = true,\n    medicalNotes?: string\n  ) => {\n    if (!isConnected || !socketRef.current) {\n      throw new Error('Not connected to WebSocket');\n    }\n    \n    const bundle = activeBundles.get(bundleId);\n    if (!bundle) {\n      throw new Error('Bundle not found');\n    }\n    \n    const fromSession = bundle.sessions.find(s => s.id === fromSessionId);\n    const toSession = bundle.sessions.find(s => s.id === toSessionId);\n    \n    if (!fromSession || !toSession) {\n      throw new Error('Session not found');\n    }\n    \n    const payload: Partial<CrossSessionParticipantMoveEvent> = {\n      bundleId,\n      playerId,\n      playerName,\n      fromSession: {\n        sessionId: fromSessionId,\n        workoutType: fromSession.workoutType,\n        currentParticipants: fromSession.participants\n      },\n      toSession: {\n        sessionId: toSessionId,\n        workoutType: toSession.workoutType,\n        currentParticipants: toSession.participants\n      },\n      moveReason: moveReason as any,\n      medicalNotes,\n      preserveProgress,\n      estimatedImpact: {\n        delayMinutes: 2, // Estimated delay\n        workoutModification: preserveProgress ? 'minor' : 'major'\n      }\n    };\n    \n    socketRef.current.emit(TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE, payload);\n  }, [isConnected, activeBundles]);\n  \n  const getAggregateMetrics = useCallback((bundleId: string) => {\n    return aggregateMetrics.get(bundleId);\n  }, [aggregateMetrics]);\n  \n  const getBundleStatus = useCallback((bundleId: string) => {\n    return activeBundles.get(bundleId);\n  }, [activeBundles]);\n  \n  // Auto-connect effect\n  useEffect(() => {\n    if (enabled) {\n      connect();\n    }\n    \n    return () => {\n      disconnect();\n      if (operationTimeoutRef.current) {\n        clearTimeout(operationTimeoutRef.current);\n      }\n    };\n  }, [enabled, connect, disconnect]);\n  \n  // Cleanup effect\n  useEffect(() => {\n    return () => {\n      if (operationTimeoutRef.current) {\n        clearTimeout(operationTimeoutRef.current);\n      }\n    };\n  }, []);\n  \n  return {\n    // Connection status\n    isConnected,\n    \n    // State\n    activeBundles: Array.from(activeBundles.values()),\n    currentOperation,\n    \n    // Operations\n    createBulkSession,\n    executeBulkOperation,\n    moveParticipantBetweenSessions,\n    \n    // Data access\n    getAggregateMetrics,\n    getBundleStatus,\n    \n    // Connection management\n    connect,\n    disconnect\n  };\n}