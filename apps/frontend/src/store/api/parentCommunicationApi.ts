import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum CommunicationType {
  IN_PERSON_MEETING = 'in_person_meeting',
  PHONE_CALL = 'phone_call',
  VIDEO_CALL = 'video_call',
  EMAIL = 'email',
  CHAT_MESSAGE = 'chat_message',
  TEXT_MESSAGE = 'text_message',
  OTHER = 'other'
}

export enum CommunicationCategory {
  ACADEMIC = 'academic',
  BEHAVIORAL = 'behavioral',
  MEDICAL = 'medical',
  PERFORMANCE = 'performance',
  ADMINISTRATIVE = 'administrative',
  SOCIAL = 'social',
  OTHER = 'other'
}

export enum CommunicationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ParentCommunication {
  id: string;
  organizationId: string;
  teamId: string;
  coachId: string;
  playerId: string;
  parentId: string;
  type: CommunicationType;
  category: CommunicationCategory;
  priority: CommunicationPriority;
  communicationDate: string;
  durationMinutes?: number;
  subject: string;
  summary: string;
  detailedNotes?: string;
  additionalParticipants?: {
    id: string;
    name: string;
    role: string;
  }[];
  actionItems?: {
    id: string;
    description: string;
    assignedTo: string;
    dueDate?: string;
    completed: boolean;
  }[];
  followUpDate?: string;
  followUpNotes?: string;
  isConfidential: boolean;
  requiresFollowUp: boolean;
  isFollowUpComplete: boolean;
  tags?: string[];
  location?: string;
  phoneNumber?: string;
  emailThreadId?: string;
  meetingLink?: string;
  metadata?: Record<string, any>;
  attachments?: ParentCommunicationAttachment[];
  reminders?: ParentCommunicationReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface ParentCommunicationAttachment {
  id: string;
  communicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ParentCommunicationReminder {
  id: string;
  communicationId: string;
  reminderDate: string;
  reminderType: string;
  reminderMessage: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentCommunicationTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: CommunicationType;
  category: CommunicationCategory;
  subject: string;
  content: string;
  variables?: string[];
  actionItemTemplates?: {
    description: string;
    defaultAssignee?: string;
    defaultDueDays?: number;
  }[];
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunicationDto {
  organizationId: string;
  teamId: string;
  coachId?: string;
  playerId: string;
  parentId: string;
  type: CommunicationType;
  category: CommunicationCategory;
  priority?: CommunicationPriority;
  communicationDate: string;
  durationMinutes?: number;
  subject: string;
  summary: string;
  detailedNotes?: string;
  additionalParticipants?: {
    id: string;
    name: string;
    role: string;
  }[];
  actionItems?: {
    description: string;
    assignedTo: string;
    dueDate?: string;
  }[];
  followUpDate?: string;
  followUpNotes?: string;
  isConfidential?: boolean;
  requiresFollowUp?: boolean;
  tags?: string[];
  location?: string;
  phoneNumber?: string;
  emailThreadId?: string;
  meetingLink?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationFilter {
  organizationId?: string;
  teamId?: string;
  coachId?: string;
  playerId?: string;
  parentId?: string;
  type?: CommunicationType;
  category?: CommunicationCategory;
  priority?: CommunicationPriority;
  dateFrom?: string;
  dateTo?: string;
  requiresFollowUp?: boolean;
  isFollowUpComplete?: boolean;
  isConfidential?: boolean;
  searchTerm?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface CommunicationListResponse {
  data: ParentCommunication[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CommunicationReportOptions {
  organizationId?: string;
  dateFrom: string;
  dateTo: string;
  groupBy?: 'coach' | 'player' | 'category' | 'type';
  includeConfidential?: boolean;
}

export interface CommunicationReport {
  totalCommunications: number;
  dateRange: {
    from: string;
    to: string;
  };
  breakdown: Record<string, any>;
  statistics: {
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    averageDuration: number;
    followUpRate: number;
    completionRate: number;
  };
}

export const parentCommunicationApi = createApi({
  reducerPath: 'parentCommunicationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/parent-communications`,
    credentials: 'include',
  }),
  tagTypes: ['ParentCommunication', 'Template', 'Reminder'],
  endpoints: (builder) => ({
    // Communication CRUD
    createCommunication: builder.mutation<ParentCommunication, CreateCommunicationDto>({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ParentCommunication'],
    }),

    updateCommunication: builder.mutation<ParentCommunication, { id: string; data: Partial<CreateCommunicationDto> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ParentCommunication', id },
        'ParentCommunication',
      ],
    }),

    getCommunication: builder.query<ParentCommunication, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ParentCommunication', id }],
    }),

    listCommunications: builder.query<CommunicationListResponse, CommunicationFilter>({
      query: (filter) => ({
        url: '/',
        params: filter,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'ParentCommunication' as const, id })),
              { type: 'ParentCommunication', id: 'LIST' },
            ]
          : [{ type: 'ParentCommunication', id: 'LIST' }],
    }),

    // Attachments
    addAttachment: builder.mutation<ParentCommunicationAttachment, {
      communicationId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      description?: string;
      metadata?: Record<string, any>;
    }>({
      query: (data) => ({
        url: '/attachments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { communicationId }) => [
        { type: 'ParentCommunication', id: communicationId },
      ],
    }),

    removeAttachment: builder.mutation<void, string>({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ParentCommunication'],
    }),

    // Reminders
    createReminder: builder.mutation<ParentCommunicationReminder, {
      communicationId: string;
      reminderDate: string;
      reminderType: string;
      reminderMessage: string;
    }>({
      query: (data) => ({
        url: '/reminders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reminder', 'ParentCommunication'],
    }),

    completeReminder: builder.mutation<ParentCommunicationReminder, {
      reminderId: string;
      completionNotes?: string;
    }>({
      query: ({ reminderId, completionNotes }) => ({
        url: `/reminders/${reminderId}/complete`,
        method: 'PUT',
        body: { completionNotes },
      }),
      invalidatesTags: ['Reminder', 'ParentCommunication'],
    }),

    getUpcomingReminders: builder.query<ParentCommunicationReminder[], { days?: number }>({
      query: ({ days = 7 }) => ({
        url: '/reminders/upcoming',
        params: { days },
      }),
      providesTags: ['Reminder'],
    }),

    // Action Items
    updateActionItem: builder.mutation<ParentCommunication, {
      communicationId: string;
      actionItemId: string;
      completed: boolean;
    }>({
      query: ({ communicationId, actionItemId, completed }) => ({
        url: `/${communicationId}/action-items/${actionItemId}`,
        method: 'PUT',
        body: { completed },
      }),
      invalidatesTags: (_result, _error, { communicationId }) => [
        { type: 'ParentCommunication', id: communicationId },
      ],
    }),

    // Reports
    generateReport: builder.query<CommunicationReport, CommunicationReportOptions>({
      query: (options) => ({
        url: '/reports/summary',
        params: options,
      }),
    }),

    // Templates
    createTemplate: builder.mutation<ParentCommunicationTemplate, Partial<ParentCommunicationTemplate>>({
      query: (data) => ({
        url: '/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Template'],
    }),

    getTemplates: builder.query<ParentCommunicationTemplate[], { category?: CommunicationCategory }>({
      query: ({ category }) => ({
        url: '/templates',
        params: category ? { category } : undefined,
      }),
      providesTags: ['Template'],
    }),

    useTemplate: builder.mutation<ParentCommunicationTemplate, string>({
      query: (templateId) => ({
        url: `/templates/${templateId}/use`,
        method: 'POST',
      }),
      invalidatesTags: ['Template'],
    }),
  }),
});

export const {
  useCreateCommunicationMutation,
  useUpdateCommunicationMutation,
  useGetCommunicationQuery,
  useListCommunicationsQuery,
  useAddAttachmentMutation,
  useRemoveAttachmentMutation,
  useCreateReminderMutation,
  useCompleteReminderMutation,
  useGetUpcomingRemindersQuery,
  useUpdateActionItemMutation,
  useGenerateReportQuery,
  useCreateTemplateMutation,
  useGetTemplatesQuery,
  useUseTemplateMutation,
} = parentCommunicationApi;