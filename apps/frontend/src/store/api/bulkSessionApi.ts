import { createApi } from '@reduxjs/toolkit/query/react';
import { createMockEnabledBaseQuery } from './mockBaseQuery';
import type { 
  SessionBundle, 
  BundleSession, 
  BulkSessionOptions,
  BundleMetrics,
  BulkActionType,
  ParticipantMetrics 
} from '@/features/physical-trainer/components/bulk-sessions/bulk-sessions.types';
import type { ApiResponse } from '@hockey-hub/shared-lib';

// Extended types for API operations
export interface CreateSessionBundleRequest {
  name: string;
  templateId?: string;
  sessions: SessionBundleSessionConfig[];
  globalSettings: {
    maxParticipants?: number;
    allowJoinAfterStart: boolean;
    requireConfirmation: boolean;
    autoStartNext: boolean;
  };
  equipmentReservations?: EquipmentReservation[];
  calendarEventIds?: string[];
}

export interface SessionBundleSessionConfig {
  name: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'stability_core' | 'plyometrics' | 'wrestling';
  workoutId: string;
  scheduledTime?: string;
  estimatedDuration: number;
  location?: string;
  equipmentIds?: string[];
  playerIds: string[];
  teamIds?: string[];
  customizations?: Record<string, any>;
  // Type-specific configurations
  strengthConfig?: {
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: number;
      weight?: number;
      restTime?: number;
    }>;
    totalVolume?: number;
  };
  conditioningConfig?: {
    intervals: Array<{
      duration: number;
      intensity: 'warmup' | 'easy' | 'moderate' | 'hard' | 'maximum';
      targetBPM?: number;
      recovery?: number;
    }>;
    equipment: 'bike' | 'treadmill' | 'rowing' | 'elliptical' | 'ski_erg' | 'assault_bike' | 'versaclimber' | 'stepper';
  };
  hybridConfig?: {
    blocks: Array<{
      type: 'exercise' | 'interval' | 'transition';
      name: string;
      duration: number;
      equipment?: string;
    }>;
  };
  agilityConfig?: {
    drills: Array<{
      id: string;
      name: string;
      category: 'ladder' | 'cone' | 'hurdle' | 'reaction';
      duration: number;
      sets?: number;
      pattern?: string;
    }>;
    equipmentRequired: string[];
  };
  // New workout type configurations
  stabilityCoreConfig?: {
    exercises: Array<{
      id: string;
      name: string;
      holdTime: number;
      sets: number;
      difficulty: 'basic' | 'intermediate' | 'advanced';
      equipment?: string;
    }>;
    totalDuration: number;
    instabilityLevel: 'stable' | 'moderate' | 'high';
  };
  plyometricsConfig?: {
    exercises: Array<{
      id: string;
      name: string;
      reps: number;
      sets: number;
      height?: number;
      distance?: number;
      intensity: 'low' | 'medium' | 'high' | 'maximal';
    }>;
    totalJumps: number;
    restBetweenSets: number;
    equipmentRequired: string[];
  };
  wrestlingConfig?: {
    techniques: Array<{
      id: string;
      name: string;
      category: 'takedown' | 'escape' | 'control' | 'submission';
      duration: number;
      repetitions: number;
      intensity: 'drill' | 'live' | 'competition';
    }>;
    sparringRounds?: number;
    roundDuration?: number;
    restBetweenRounds?: number;
  };
}

export interface EquipmentReservation {
  equipmentId: string;
  equipmentName: string;
  startTime: string;
  endTime: string;
  sessionIds: string[];
  status: 'reserved' | 'in_use' | 'completed';
}

export interface SessionBundleResponse extends SessionBundle {
  equipmentReservations: EquipmentReservation[];
  calendarEvents: {
    eventId: string;
    sessionId: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface UpdateSessionBundleRequest {
  name?: string;
  sessions?: Partial<SessionBundleSessionConfig>[];
  globalSettings?: Partial<CreateSessionBundleRequest['globalSettings']>;
}

export interface BundleStatusResponse {
  bundleId: string;
  status: SessionBundle['status'];
  metrics: BundleMetrics;
  sessions: Array<{
    id: string;
    status: BundleSession['status'];
    progress: number;
    participantCount: number;
    activeParticipants: number;
    currentPhase: string;
    elapsedTime: number;
    estimatedRemaining: number;
  }>;
  lastUpdated: string;
}

export interface BulkControlRequest {
  action: BulkActionType;
  sessionIds?: string[];
  parameters?: {
    message?: string;
    priority?: 'low' | 'normal' | 'high';
    duration?: number;
    exportFormat?: 'csv' | 'excel' | 'pdf';
  };
}

export interface BulkControlResponse {
  success: boolean;
  affectedSessions: string[];
  results: Array<{
    sessionId: string;
    success: boolean;
    error?: string;
  }>;
  exportUrl?: string;
}

export interface RealTimeMetricsUpdate {
  bundleId: string;
  sessionId: string;
  participantId: string;
  metrics: ParticipantMetrics;
  timestamp: string;
}

export interface EquipmentConflictCheck {
  equipmentId: string;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    sessionId: string;
  }>;
}

export interface EquipmentConflictResponse {
  conflicts: Array<{
    equipmentId: string;
    equipmentName: string;
    conflictingSessions: Array<{
      sessionId: string;
      sessionName: string;
      startTime: string;
      endTime: string;
    }>;
    suggestions: Array<{
      alternativeEquipmentId: string;
      alternativeEquipmentName: string;
      available: boolean;
    }>;
  }>;
  totalConflicts: number;
}

// Type-specific validation interfaces
export interface WorkoutValidationRequest {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'stability_core' | 'plyometrics' | 'wrestling';
  sessionConfigs: SessionBundleSessionConfig[];
  playerIds: string[];
  teamIds?: string[];
}

export interface WorkoutValidationResponse {
  isValid: boolean;
  errors: Array<{
    sessionId?: string;
    workoutType: string;
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    sessionId?: string;
    workoutType: string;
    message: string;
    suggestion?: string;
  }>;
  recommendations: Array<{
    sessionId?: string;
    workoutType: string;
    type: 'equipment' | 'intensity' | 'duration' | 'player_capacity';
    message: string;
    action?: string;
  }>;
}

export interface PlayerCapabilityCheck {
  playerId: string;
  playerName: string;
  workoutTypes: Array<'strength' | 'conditioning' | 'hybrid' | 'agility' | 'stability_core' | 'plyometrics' | 'wrestling'>;
  medicalRestrictions?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

export interface PlayerCapabilityResponse {
  results: Array<{
    playerId: string;
    playerName: string;
    capabilities: Array<{
      workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'stability_core' | 'plyometrics' | 'wrestling';
      canParticipate: boolean;
      restrictions: string[];
      modifications: string[];
      riskLevel: 'low' | 'medium' | 'high';
    }>;
  }>;
}

export const bulkSessionApi = createApi({
  reducerPath: 'bulkSessionApi',
  baseQuery: createMockEnabledBaseQuery(),
  tagTypes: ['SessionBundle', 'BundleStatus', 'BundleMetrics'],
  endpoints: (builder) => ({
    // Create a new session bundle
    createSessionBundle: builder.mutation<SessionBundleResponse, CreateSessionBundleRequest>({
      query: (data) => ({
        url: '/api/v1/training/session-bundles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SessionBundle'],
    }),

    // Get session bundle details
    getSessionBundle: builder.query<SessionBundleResponse, string>({
      query: (bundleId) => `/api/v1/training/session-bundles/${bundleId}`,
      providesTags: (result, error, bundleId) => [
        { type: 'SessionBundle', id: bundleId },
      ],
    }),

    // Update session bundle configuration
    updateSessionBundle: builder.mutation<SessionBundleResponse, { bundleId: string; updates: UpdateSessionBundleRequest }>({
      query: ({ bundleId, updates }) => ({
        url: `/api/v1/training/session-bundles/${bundleId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { bundleId }) => [
        { type: 'SessionBundle', id: bundleId },
        'BundleStatus',
      ],
    }),

    // Get real-time bundle status and metrics
    getBundleStatus: builder.query<BundleStatusResponse, string>({
      query: (bundleId) => `/api/v1/training/session-bundles/${bundleId}/status`,
      providesTags: (result, error, bundleId) => [
        { type: 'BundleStatus', id: bundleId },
        { type: 'BundleMetrics', id: bundleId },
      ],
      // Poll every 5 seconds for real-time updates
      pollingInterval: 5000,
    }),

    // Bulk control operations (pause, resume, broadcast, export)
    bulkControlSessions: builder.mutation<BulkControlResponse, { bundleId: string; request: BulkControlRequest }>({
      query: ({ bundleId, request }) => ({
        url: `/api/v1/training/session-bundles/${bundleId}/control`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (result, error, { bundleId }) => [
        { type: 'SessionBundle', id: bundleId },
        { type: 'BundleStatus', id: bundleId },
      ],
    }),

    // Check for equipment conflicts across sessions
    checkEquipmentConflicts: builder.mutation<EquipmentConflictResponse, EquipmentConflictCheck[]>({
      query: (conflicts) => ({
        url: '/api/v1/training/session-bundles/equipment-conflicts',
        method: 'POST',
        body: { conflicts },
      }),
    }),

    // Get all session bundles (with filtering)
    getSessionBundles: builder.query<{ bundles: SessionBundleResponse[]; total: number }, {
      status?: SessionBundle['status'];
      createdBy?: string;
      dateRange?: { start: string; end: string };
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({
        url: '/api/v1/training/session-bundles',
        params,
      }),
      providesTags: ['SessionBundle'],
    }),

    // Delete session bundle
    deleteSessionBundle: builder.mutation<{ success: boolean }, string>({
      query: (bundleId) => ({
        url: `/api/v1/training/session-bundles/${bundleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SessionBundle'],
    }),

    // Duplicate session bundle
    duplicateSessionBundle: builder.mutation<SessionBundleResponse, { bundleId: string; name: string }>({
      query: ({ bundleId, name }) => ({
        url: `/api/v1/training/session-bundles/${bundleId}/duplicate`,
        method: 'POST',
        body: { name },
      }),
      invalidatesTags: ['SessionBundle'],
    }),

    // Get bundle analytics and reports
    getBundleAnalytics: builder.query<{
      bundleId: string;
      completionRate: number;
      averageIntensity: number;
      totalWorkoutTime: number;
      participantStats: Array<{
        playerId: string;
        playerName: string;
        completedSessions: number;
        totalSessions: number;
        averagePerformance: number;
      }>;
      sessionStats: Array<{
        sessionId: string;
        sessionName: string;
        completionRate: number;
        averageDuration: number;
        participantFeedback: number;
      }>;
    }, string>({
      query: (bundleId) => `/api/v1/training/session-bundles/${bundleId}/analytics`,
      providesTags: (result, error, bundleId) => [
        { type: 'BundleMetrics', id: bundleId },
      ],
    }),

    // Validate workout configurations across all types
    validateWorkoutConfigurations: builder.mutation<WorkoutValidationResponse, WorkoutValidationRequest>({
      query: (data) => ({
        url: '/api/v1/training/session-bundles/validate-workouts',
        method: 'POST',
        body: data,
      }),
    }),

    // Check player capabilities for different workout types
    checkPlayerCapabilities: builder.mutation<PlayerCapabilityResponse, PlayerCapabilityCheck[]>({
      query: (players) => ({
        url: '/api/v1/training/session-bundles/player-capabilities',
        method: 'POST',
        body: { players },
      }),
    }),

    // Generate workout data for specific type
    generateWorkoutData: builder.mutation<{
      workoutId: string;
      workoutData: any;
    }, {
      workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'stability_core' | 'plyometrics' | 'wrestling';
      duration: number;
      intensity: 'low' | 'medium' | 'high' | 'maximum';
      playerCount: number;
      equipment?: string[];
      customizations?: Record<string, any>;
    }>({
      query: (config) => ({
        url: '/api/v1/training/session-bundles/generate-workout',
        method: 'POST',
        body: config,
      }),
    }),
  }),
});

export const {
  useCreateSessionBundleMutation,
  useGetSessionBundleQuery,
  useUpdateSessionBundleMutation,
  useGetBundleStatusQuery,
  useBulkControlSessionsMutation,
  useCheckEquipmentConflictsMutation,
  useGetSessionBundlesQuery,
  useDeleteSessionBundleMutation,
  useDuplicateSessionBundleMutation,
  useGetBundleAnalyticsQuery,
  useValidateWorkoutConfigurationsMutation,
  useCheckPlayerCapabilitiesMutation,
  useGenerateWorkoutDataMutation,
} = bulkSessionApi;

// Re-export types for convenience
export type {
  SessionBundle,
  BundleSession,
  BulkSessionOptions,
  BundleMetrics,
  BulkActionType,
  ParticipantMetrics,
  SessionBundleResponse,
  CreateSessionBundleRequest,
  UpdateSessionBundleRequest,
  BundleStatusResponse,
  BulkControlRequest,
  BulkControlResponse,
  EquipmentConflictCheck,
  EquipmentConflictResponse,
  RealTimeMetricsUpdate,
  WorkoutValidationRequest,
  WorkoutValidationResponse,
  PlayerCapabilityCheck,
  PlayerCapabilityResponse,
};