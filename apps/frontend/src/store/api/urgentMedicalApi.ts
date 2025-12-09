import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  UrgentMedicalNotification, 
  CreateUrgentNotificationDto,
  UrgentNotificationAcknowledgment,
} from '@/features/medical-staff/types/urgent-notification';

interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    total: number;
    byUrgencyLevel: Record<string, number>;
    byMedicalType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  acknowledgmentMetrics: {
    averageResponseTime: number;
    acknowledgmentRate: number;
    fullyAcknowledgedCount: number;
  };
  escalationMetrics: {
    totalEscalations: number;
    averageEscalationLevel: number;
    escalationReasons: Record<string, number>;
  };
  deliveryMetrics: {
    byChannel: Record<string, any>;
    successRate: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export const urgentMedicalApi = createApi({
  reducerPath: 'urgentMedicalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/communication',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token || localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['UrgentNotification', 'ComplianceReport'],
  endpoints: (builder) => ({
    // Create urgent notification
    createUrgentNotification: builder.mutation<UrgentMedicalNotification, CreateUrgentNotificationDto>({
      query: (notification) => ({
        url: '/medical/urgent',
        method: 'POST',
        body: notification,
      }),
      invalidatesTags: ['UrgentNotification'],
    }),

    // Get active notifications
    getActiveNotifications: builder.query<UrgentMedicalNotification[], {
      urgencyLevel?: string;
      medicalType?: string;
      targetType?: string;
      requiresAcknowledgment?: boolean;
      createdBy?: string;
    }>({
      query: (params) => ({
        url: '/medical/urgent/active',
        params,
      }),
      providesTags: ['UrgentNotification'],
    }),

    // Get notification details
    getNotificationDetails: builder.query<UrgentMedicalNotification & {
      recipientDetails: any[];
      acknowledgmentProgress: any;
      escalationHistory: any[];
    }, string>({
      query: (notificationId) => `/medical/urgent/${notificationId}`,
      providesTags: (result, error, id) => [{ type: 'UrgentNotification', id }],
    }),

    // Acknowledge notification
    acknowledgeNotification: builder.mutation<UrgentNotificationAcknowledgment, {
      notificationId: string;
      method: string;
      message?: string;
      deviceInfo?: any;
      additionalActions?: any;
    }>({
      query: ({ notificationId, ...body }) => ({
        url: `/medical/urgent/${notificationId}/acknowledge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        { type: 'UrgentNotification', id: notificationId },
        'UrgentNotification',
      ],
    }),

    // Escalate notification
    escalateNotification: builder.mutation<any, {
      notificationId: string;
      reason: string;
      manualMessage?: string;
    }>({
      query: ({ notificationId, ...body }) => ({
        url: `/medical/urgent/${notificationId}/escalate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        { type: 'UrgentNotification', id: notificationId },
        'UrgentNotification',
      ],
    }),

    // Update notification status
    updateNotificationStatus: builder.mutation<any, {
      notificationId: string;
      status: string;
      resolutionNotes?: string;
    }>({
      query: ({ notificationId, ...body }) => ({
        url: `/medical/urgent/${notificationId}/resolve`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { notificationId }) => [
        { type: 'UrgentNotification', id: notificationId },
        'UrgentNotification',
      ],
    }),

    // Generate compliance report
    generateComplianceReport: builder.query<ComplianceReport, {
      startDate: string;
      endDate: string;
    }>({
      query: (params) => ({
        url: '/medical/urgent/reports/compliance',
        params,
      }),
      providesTags: ['ComplianceReport'],
    }),

    // Get enum values
    getUrgencyLevels: builder.query<string[], void>({
      query: () => '/medical/urgent/enums/urgency-levels',
    }),

    getMedicalTypes: builder.query<string[], void>({
      query: () => '/medical/urgent/enums/medical-types',
    }),

    getTargetTypes: builder.query<string[], void>({
      query: () => '/medical/urgent/enums/target-types',
    }),

    getDeliveryChannels: builder.query<string[], void>({
      query: () => '/medical/urgent/enums/delivery-channels',
    }),

    getAcknowledgmentMethods: builder.query<string[], void>({
      query: () => '/medical/urgent/enums/acknowledgment-methods',
    }),
  }),
});

export const {
  useCreateUrgentNotificationMutation,
  useGetActiveNotificationsQuery,
  useGetNotificationDetailsQuery,
  useAcknowledgeNotificationMutation,
  useEscalateNotificationMutation,
  useUpdateNotificationStatusMutation,
  useGenerateComplianceReportQuery,
  useGetUrgencyLevelsQuery,
  useGetMedicalTypesQuery,
  useGetTargetTypesQuery,
  useGetDeliveryChannelsQuery,
  useGetAcknowledgmentMethodsQuery,
} = urgentMedicalApi;