import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface PaymentDiscussion {
  id: string;
  type: string;
  status: string;
  paymentStatus?: string;
  title: string;
  description?: string;
  paymentId?: string;
  invoiceId?: string;
  paymentPlanId?: string;
  amount?: number;
  outstandingAmount?: number;
  currency?: string;
  parentUserId: string;
  billingStaffIds: string[];
  organizationId: string;
  teamId?: string;
  conversationId: string;
  paymentPlanProposal?: any;
  quickActions?: any;
  attachedDocuments?: any[];
  auditLog: any[];
  containsSensitiveInfo: boolean;
  complianceFlags?: any;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  metadata?: any;
}

export interface CreatePaymentDiscussionDto {
  type: string;
  title: string;
  description?: string;
  paymentId?: string;
  invoiceId?: string;
  paymentPlanId?: string;
  amount?: number;
  outstandingAmount?: number;
  currency?: string;
  parentUserId: string;
  billingStaffIds: string[];
  organizationId: string;
  teamId?: string;
  metadata?: any;
}

export interface PaymentDiscussionFilters {
  parentUserId?: string;
  organizationId?: string;
  status?: string;
  type?: string;
  paymentId?: string;
  invoiceId?: string;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/communication',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PaymentDiscussion', 'PaymentDiscussionAttachment'],
  endpoints: (builder) => ({
    // Payment Discussion endpoints
    createPaymentDiscussion: builder.mutation<PaymentDiscussion, CreatePaymentDiscussionDto>({
      query: (data) => ({
        url: '/payment-discussions/discussions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentDiscussion'],
    }),

    getPaymentDiscussion: builder.query<PaymentDiscussion, string>({
      query: (id) => `/payment-discussions/discussions/${id}`,
      providesTags: (result, error, id) => [{ type: 'PaymentDiscussion', id }],
    }),

    getPaymentDiscussions: builder.query<PaymentDiscussion[], PaymentDiscussionFilters>({
      query: (filters) => ({
        url: '/payment-discussions/discussions',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PaymentDiscussion' as const, id })),
              { type: 'PaymentDiscussion', id: 'LIST' },
            ]
          : [{ type: 'PaymentDiscussion', id: 'LIST' }],
    }),

    updatePaymentDiscussion: builder.mutation<PaymentDiscussion, { id: string; data: Partial<PaymentDiscussion> }>({
      query: ({ id, data }) => ({
        url: `/payment-discussions/discussions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PaymentDiscussion', id }],
    }),

    // Document management
    attachDocument: builder.mutation<any, any>({
      query: (data) => ({
        url: '/payment-discussions/discussions/documents',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { paymentDiscussionId }) => [
        { type: 'PaymentDiscussion', id: paymentDiscussionId },
      ],
    }),

    verifyDocument: builder.mutation<any, string>({
      query: (attachmentId) => ({
        url: `/payment-discussions/discussions/documents/${attachmentId}/verify`,
        method: 'PUT',
      }),
      invalidatesTags: ['PaymentDiscussionAttachment'],
    }),

    // Payment plan management
    proposePaymentPlan: builder.mutation<PaymentDiscussion, { discussionId: string; installments: any[]; notes?: string }>({
      query: ({ discussionId, ...data }) => ({
        url: `/payment-discussions/discussions/${discussionId}/payment-plan`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PaymentDiscussion', id: discussionId },
      ],
    }),

    approvePaymentPlan: builder.mutation<PaymentDiscussion, string>({
      query: (discussionId) => ({
        url: `/payment-discussions/discussions/${discussionId}/payment-plan/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, discussionId) => [
        { type: 'PaymentDiscussion', id: discussionId },
      ],
    }),

    // Quick actions
    trackQuickAction: builder.mutation<PaymentDiscussion, { discussionId: string; action: string }>({
      query: ({ discussionId, action }) => ({
        url: `/payment-discussions/discussions/${discussionId}/quick-action`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PaymentDiscussion', id: discussionId },
      ],
    }),

    // Escalation
    escalateDiscussion: builder.mutation<PaymentDiscussion, { discussionId: string; reason: string }>({
      query: ({ discussionId, reason }) => ({
        url: `/payment-discussions/discussions/${discussionId}/escalate`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PaymentDiscussion', id: discussionId },
      ],
    }),

    // Reminders
    createReminder: builder.mutation<any, any>({
      query: (data) => ({
        url: '/payment-discussions/discussions/reminders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { paymentDiscussionId }) => [
        { type: 'PaymentDiscussion', id: paymentDiscussionId },
      ],
    }),

    // Query by payment/invoice
    getDiscussionsByPayment: builder.query<PaymentDiscussion[], string>({
      query: (paymentId) => `/payment-discussions/payments/${paymentId}/discussions`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'PaymentDiscussion' as const, id }))
          : [],
    }),

    getDiscussionsByInvoice: builder.query<PaymentDiscussion[], string>({
      query: (invoiceId) => `/payment-discussions/invoices/${invoiceId}/discussions`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'PaymentDiscussion' as const, id }))
          : [],
    }),

    // Admin routes
    getOverdueDiscussions: builder.query<PaymentDiscussion[], string>({
      query: (organizationId) => `/payment-discussions/organizations/${organizationId}/overdue-discussions`,
      providesTags: ['PaymentDiscussion'],
    }),
  }),
});

export const {
  useCreatePaymentDiscussionMutation,
  useGetPaymentDiscussionQuery,
  useGetPaymentDiscussionsQuery,
  useUpdatePaymentDiscussionMutation,
  useAttachDocumentMutation,
  useVerifyDocumentMutation,
  useProposePaymentPlanMutation,
  useApprovePaymentPlanMutation,
  useTrackQuickActionMutation,
  useEscalateDiscussionMutation,
  useCreateReminderMutation,
  useGetDiscussionsByPaymentQuery,
  useGetDiscussionsByInvoiceQuery,
  useGetOverdueDiscussionsQuery,
} = paymentApi;