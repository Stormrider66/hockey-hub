import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from './baseQuery';

export interface MedicalDiscussion {
  id: string;
  conversation_id: string;
  discussion_type: MedicalDiscussionType;
  title: string;
  description?: string;
  injury_id?: string;
  player_id?: string;
  player_name?: string;
  organization_id: string;
  team_id?: string;
  status: MedicalDiscussionStatus;
  priority: MedicalDiscussionPriority;
  confidentiality_level: MedicalConfidentialityLevel;
  medical_metadata?: {
    injury_details?: {
      body_part?: string;
      severity?: string;
      mechanism?: string;
      diagnosis?: string;
    };
    treatment_plan?: {
      current_phase?: number;
      total_phases?: number;
      phase_description?: string;
      next_evaluation?: Date;
    };
    recovery_timeline?: {
      estimated_return?: Date;
      milestones?: Array<{
        date: Date;
        description: string;
        completed: boolean;
      }>;
    };
    restrictions?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      start_date: Date;
      end_date?: Date;
    }>;
    involved_staff?: Array<{
      staff_id: string;
      role: string;
      name: string;
    }>;
  };
  resolved_at?: Date;
  resolved_by?: string;
  resolution_notes?: string;
  follow_up_date?: Date;
  archived_at?: Date;
  archived_by?: string;
  authorized_viewers?: string[];
  requires_acknowledgment: boolean;
  acknowledged_by?: string[];
  created_at: Date;
  updated_at: Date;
  created_by: string;
  created_by_name?: string;
  created_by_role?: string;
  action_items: MedicalActionItem[];
  conversation: {
    id: string;
    name: string;
    last_message?: {
      content: string;
      created_at: Date;
      sender_name: string;
    };
    unread_count?: number;
  };
}

export interface MedicalActionItem {
  id: string;
  medical_discussion_id: string;
  description: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_role?: string;
  due_date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: Date;
  completed_by?: string;
  completion_notes?: string;
  priority: MedicalDiscussionPriority;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export enum MedicalDiscussionType {
  INJURY_TREATMENT = 'injury_treatment',
  RECOVERY_PLANNING = 'recovery_planning',
  TEAM_HEALTH_UPDATE = 'team_health_update',
  PLAYER_ASSESSMENT = 'player_assessment',
  RETURN_TO_PLAY = 'return_to_play',
  PREVENTIVE_CARE = 'preventive_care',
}

export enum MedicalDiscussionStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  ARCHIVED = 'archived',
}

export enum MedicalDiscussionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MedicalConfidentialityLevel {
  GENERAL = 'general',
  MEDICAL_ONLY = 'medical_only',
  RESTRICTED = 'restricted',
}

export interface CreateMedicalDiscussionDto {
  discussion_type: MedicalDiscussionType;
  title: string;
  description?: string;
  injury_id?: string;
  player_id?: string;
  player_name?: string;
  team_id?: string;
  priority?: MedicalDiscussionPriority;
  confidentiality_level?: MedicalConfidentialityLevel;
  medical_metadata?: any;
  participant_ids: string[];
  requires_acknowledgment?: boolean;
  follow_up_date?: Date;
  created_by_name?: string;
  created_by_role?: string;
}

export interface UpdateMedicalDiscussionDto {
  title?: string;
  description?: string;
  status?: MedicalDiscussionStatus;
  priority?: MedicalDiscussionPriority;
  confidentiality_level?: MedicalConfidentialityLevel;
  medical_metadata?: any;
  follow_up_date?: Date;
}

export interface CreateActionItemDto {
  description: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_role?: string;
  due_date?: Date;
  priority?: MedicalDiscussionPriority;
}

export interface UpdateActionItemDto {
  description?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_role?: string;
  due_date?: Date;
  status?: string;
  priority?: MedicalDiscussionPriority;
  completion_notes?: string;
}

export interface MedicalDiscussionFilters {
  team_id?: string;
  player_id?: string;
  injury_id?: string;
  status?: MedicalDiscussionStatus;
  priority?: MedicalDiscussionPriority;
  discussion_type?: MedicalDiscussionType;
  created_by?: string;
  limit?: number;
  offset?: number;
}

export const medicalDiscussionApi = createApi({
  reducerPath: 'medicalDiscussionApi',
  baseQuery,
  tagTypes: ['MedicalDiscussion', 'ActionItem'],
  endpoints: (builder) => ({
    // Medical Discussion endpoints
    createMedicalDiscussion: builder.mutation<MedicalDiscussion, CreateMedicalDiscussionDto>({
      query: (data) => ({
        url: '/medical/discussions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MedicalDiscussion'],
    }),

    getMedicalDiscussions: builder.query<{ discussions: MedicalDiscussion[]; total: number }, MedicalDiscussionFilters>({
      query: (filters) => ({
        url: '/medical/discussions',
        params: filters,
      }),
      providesTags: ['MedicalDiscussion'],
    }),

    getMedicalDiscussion: builder.query<MedicalDiscussion, string>({
      query: (id) => `/medical/discussions/${id}`,
      providesTags: (result, error, id) => [{ type: 'MedicalDiscussion', id }],
    }),

    updateMedicalDiscussion: builder.mutation<MedicalDiscussion, { id: string; data: UpdateMedicalDiscussionDto }>({
      query: ({ id, data }) => ({
        url: `/medical/discussions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MedicalDiscussion', id }],
    }),

    resolveMedicalDiscussion: builder.mutation<MedicalDiscussion, { id: string; resolution_notes?: string }>({
      query: ({ id, resolution_notes }) => ({
        url: `/medical/discussions/${id}/resolve`,
        method: 'POST',
        body: { resolution_notes },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MedicalDiscussion', id }],
    }),

    archiveMedicalDiscussion: builder.mutation<MedicalDiscussion, string>({
      query: (id) => ({
        url: `/medical/discussions/${id}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'MedicalDiscussion', id }],
    }),

    addAuthorizedViewer: builder.mutation<MedicalDiscussion, { discussionId: string; user_id: string }>({
      query: ({ discussionId, user_id }) => ({
        url: `/medical/discussions/${discussionId}/viewers`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (result, error, { discussionId }) => [{ type: 'MedicalDiscussion', id: discussionId }],
    }),

    removeAuthorizedViewer: builder.mutation<MedicalDiscussion, { discussionId: string; userId: string }>({
      query: ({ discussionId, userId }) => ({
        url: `/medical/discussions/${discussionId}/viewers/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { discussionId }) => [{ type: 'MedicalDiscussion', id: discussionId }],
    }),

    acknowledgeMedicalDiscussion: builder.mutation<MedicalDiscussion, string>({
      query: (id) => ({
        url: `/medical/discussions/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'MedicalDiscussion', id }],
    }),

    // Action Item endpoints
    createActionItem: builder.mutation<MedicalActionItem, { discussionId: string; data: CreateActionItemDto }>({
      query: ({ discussionId, data }) => ({
        url: `/medical/discussions/${discussionId}/action-items`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'MedicalDiscussion', id: discussionId },
        'ActionItem',
      ],
    }),

    getActionItems: builder.query<MedicalActionItem[], string>({
      query: (discussionId) => `/medical/discussions/${discussionId}/action-items`,
      providesTags: ['ActionItem'],
    }),

    updateActionItem: builder.mutation<MedicalActionItem, { id: string; data: UpdateActionItemDto }>({
      query: ({ id, data }) => ({
        url: `/medical/action-items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ActionItem'],
    }),

    completeActionItem: builder.mutation<MedicalActionItem, { id: string; completion_notes?: string }>({
      query: ({ id, completion_notes }) => ({
        url: `/medical/action-items/${id}/complete`,
        method: 'POST',
        body: { completion_notes },
      }),
      invalidatesTags: ['ActionItem'],
    }),

    getMyActionItems: builder.query<MedicalActionItem[], { status?: string }>({
      query: ({ status }) => ({
        url: '/medical/action-items/my',
        params: { status },
      }),
      providesTags: ['ActionItem'],
    }),

    getUpcomingFollowUps: builder.query<MedicalDiscussion[], { days_ahead?: number }>({
      query: ({ days_ahead = 7 }) => ({
        url: '/medical/discussions/follow-ups/upcoming',
        params: { days_ahead },
      }),
      providesTags: ['MedicalDiscussion'],
    }),
  }),
});

export const {
  useCreateMedicalDiscussionMutation,
  useGetMedicalDiscussionsQuery,
  useGetMedicalDiscussionQuery,
  useUpdateMedicalDiscussionMutation,
  useResolveMedicalDiscussionMutation,
  useArchiveMedicalDiscussionMutation,
  useAddAuthorizedViewerMutation,
  useRemoveAuthorizedViewerMutation,
  useAcknowledgeMedicalDiscussionMutation,
  useCreateActionItemMutation,
  useGetActionItemsQuery,
  useUpdateActionItemMutation,
  useCompleteActionItemMutation,
  useGetMyActionItemsQuery,
  useGetUpcomingFollowUpsQuery,
} = medicalDiscussionApi;