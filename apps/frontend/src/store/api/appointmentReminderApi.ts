import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum AppointmentType {
  MEDICAL_CHECKUP = 'medical_checkup',
  INJURY_ASSESSMENT = 'injury_assessment',
  TREATMENT_SESSION = 'treatment_session',
  PHYSIOTHERAPY = 'physiotherapy',
  PSYCHOLOGY_SESSION = 'psychology_session',
  NUTRITIONIST = 'nutritionist',
  FOLLOW_UP = 'follow_up',
  VACCINATION = 'vaccination',
  FITNESS_TEST = 'fitness_test',
  OTHER = 'other',
}

export enum ReminderTiming {
  ONE_WEEK_BEFORE = '1_week_before',
  THREE_DAYS_BEFORE = '3_days_before',
  ONE_DAY_BEFORE = '1_day_before',
  MORNING_OF = 'morning_of',
  TWO_HOURS_BEFORE = '2_hours_before',
  THIRTY_MINUTES_BEFORE = '30_minutes_before',
}

export enum ReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ACKNOWLEDGED = 'acknowledged',
}

export interface AppointmentReminder {
  id: string;
  userId: string;
  medicalStaffId: string;
  organizationId: string;
  teamId?: string;
  appointmentType: AppointmentType;
  appointmentDate: string;
  location?: string;
  medicalFacilityName?: string;
  medicalFacilityAddress?: string;
  medicalFacilityPhone?: string;
  appointmentNotes?: string;
  preparationInstructions?: string;
  documentsTobing?: string[];
  requiresFasting: boolean;
  fastingHours?: number;
  requiresTransportation: boolean;
  reminderTimings: ReminderTiming[];
  remindersSent?: Record<ReminderTiming, string>;
  status: ReminderStatus;
  sendAt?: string;
  lastSentAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  calendarEventId?: string;
  medicalRecordId?: string;
  injuryId?: string;
  notifyPatient: boolean;
  notifyParents: boolean;
  notifyCoach: boolean;
  includeInTeamCalendar: boolean;
  reminderCount: number;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateAppointmentReminderRequest {
  userId: string;
  medicalStaffId: string;
  appointmentType: AppointmentType;
  appointmentDate: string;
  location?: string;
  medicalFacilityName?: string;
  medicalFacilityAddress?: string;
  medicalFacilityPhone?: string;
  appointmentNotes?: string;
  preparationInstructions?: string;
  documentsTobing?: string[];
  requiresFasting?: boolean;
  fastingHours?: number;
  requiresTransportation?: boolean;
  reminderTimings: ReminderTiming[];
  calendarEventId?: string;
  medicalRecordId?: string;
  injuryId?: string;
  notifyPatient?: boolean;
  notifyParents?: boolean;
  notifyCoach?: boolean;
  includeInTeamCalendar?: boolean;
}

export interface UpdateAppointmentReminderRequest {
  appointmentDate?: string;
  location?: string;
  appointmentNotes?: string;
  preparationInstructions?: string;
  documentsTobing?: string[];
  requiresFasting?: boolean;
  fastingHours?: number;
  reminderTimings?: ReminderTiming[];
  notifyPatient?: boolean;
  notifyParents?: boolean;
  notifyCoach?: boolean;
}

export interface AppointmentReminderStatistics {
  total: number;
  byStatus: Record<ReminderStatus, number>;
  byType: Record<AppointmentType, number>;
  upcomingCount: number;
  pastDueCount: number;
  acknowledgedRate: number;
  averageRemindersPerAppointment: number;
}

export const appointmentReminderApi = createApi({
  reducerPath: 'appointmentReminderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/communication',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AppointmentReminder', 'ReminderStatistics'],
  endpoints: (builder) => ({
    // Create appointment reminder
    createReminder: builder.mutation<AppointmentReminder, CreateAppointmentReminderRequest>({
      query: (data) => ({
        url: '/api/appointment-reminders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AppointmentReminder', 'ReminderStatistics'],
    }),

    // Get user's reminders
    getUserReminders: builder.query<AppointmentReminder[], { userId: string; upcoming?: boolean }>({
      query: ({ userId, upcoming = true }) => ({
        url: `/api/appointment-reminders/user/${userId}`,
        params: { upcoming },
      }),
      providesTags: ['AppointmentReminder'],
    }),

    // Get medical staff's appointments
    getMedicalStaffReminders: builder.query<AppointmentReminder[], { staffId: string; date?: string }>({
      query: ({ staffId, date }) => ({
        url: `/api/appointment-reminders/medical-staff/${staffId}`,
        params: date ? { date } : undefined,
      }),
      providesTags: ['AppointmentReminder'],
    }),

    // Get organization reminders
    getOrganizationReminders: builder.query<AppointmentReminder[], {
      startDate?: string;
      endDate?: string;
      status?: ReminderStatus;
      appointmentType?: AppointmentType;
    }>({
      query: (params) => ({
        url: '/api/appointment-reminders/organization',
        params,
      }),
      providesTags: ['AppointmentReminder'],
    }),

    // Get single reminder
    getReminder: builder.query<AppointmentReminder, string>({
      query: (id) => `/api/appointment-reminders/${id}`,
      providesTags: ['AppointmentReminder'],
    }),

    // Update reminder
    updateReminder: builder.mutation<AppointmentReminder, { id: string; data: UpdateAppointmentReminderRequest }>({
      query: ({ id, data }) => ({
        url: `/api/appointment-reminders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AppointmentReminder', 'ReminderStatistics'],
    }),

    // Cancel reminder
    cancelReminder: builder.mutation<AppointmentReminder, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/api/appointment-reminders/${id}`,
        method: 'DELETE',
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ['AppointmentReminder', 'ReminderStatistics'],
    }),

    // Acknowledge reminder
    acknowledgeReminder: builder.mutation<AppointmentReminder, string>({
      query: (id) => ({
        url: `/api/appointment-reminders/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['AppointmentReminder'],
    }),

    // Create bulk reminders
    createBulkReminders: builder.mutation<AppointmentReminder[], { appointments: CreateAppointmentReminderRequest[] }>({
      query: (data) => ({
        url: '/api/appointment-reminders/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AppointmentReminder', 'ReminderStatistics'],
    }),

    // Get statistics
    getReminderStatistics: builder.query<AppointmentReminderStatistics, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({
        url: '/api/appointment-reminders/statistics/organization',
        params: { startDate, endDate },
      }),
      providesTags: ['ReminderStatistics'],
    }),
  }),
});

export const {
  useCreateReminderMutation,
  useGetUserRemindersQuery,
  useGetMedicalStaffRemindersQuery,
  useGetOrganizationRemindersQuery,
  useGetReminderQuery,
  useUpdateReminderMutation,
  useCancelReminderMutation,
  useAcknowledgeReminderMutation,
  useCreateBulkRemindersMutation,
  useGetReminderStatisticsQuery,
} = appointmentReminderApi;