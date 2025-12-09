import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

export interface Injury {
  id: number;
  player_id: number;
  injury_type: string;
  injury_date: string;
  recovery_status: 'active' | 'recovering' | 'recovered';
  expected_return_date?: string;
  notes?: string;
}

export interface Treatment {
  id: number;
  injury_id: number;
  treatment_date: string;
  treatment_type: string;
  provider: string;
  notes?: string;
}

export interface MedicalReport {
  id: number;
  player_id: number;
  report_date: string;
  report_type: string;
  summary: string;
  recommendations?: string;
}

export interface PlayerMedicalOverview {
  player_id: number;
  player_name: string;
  current_injuries: Injury[];
  injury_history: Injury[];
  recent_treatments: Treatment[];
  medical_clearance: boolean;
  last_assessment_date: string;
}

export interface TeamMedicalStats {
  total_active_injuries: number;
  players_on_injury_list: number;
  average_recovery_time: number;
  injury_types_breakdown: {
    type: string;
    count: number;
  }[];
}

export const medicalApi = createApi({
  reducerPath: 'medicalApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: '/api/v1/medical',
      prepareHeaders: (headers, { getState }) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['Injury', 'Treatment', 'MedicalReport'],
  keepUnusedDataFor: 300, // 5 minutes default cache
  refetchOnMountOrArgChange: 30, // Refetch if older than 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getTeamMedicalStats: builder.query<TeamMedicalStats, void>({
      query: () => '/team/stats',
      providesTags: ['Injury'],
      keepUnusedDataFor: 600, // 10 minutes cache for team stats
    }),
    getPlayerMedicalOverview: builder.query<PlayerMedicalOverview, string | number>({
      query: (playerId) => `/players/${playerId}/overview`,
      providesTags: (result, error, playerId) => [
        { type: 'Injury', id: String(playerId) },
        { type: 'Treatment', id: String(playerId) },
      ],
      keepUnusedDataFor: 300, // 5 minutes cache per player
    }),
    getAllInjuries: builder.query<Injury[], void>({
      query: () => '/injuries',
      providesTags: ['Injury'],
    }),
    getActiveInjuries: builder.query<Injury[], void>({
      query: () => '/injuries/active',
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Injury' as const, id })),
              { type: 'Injury', id: 'LIST' },
            ]
          : [{ type: 'Injury', id: 'LIST' }],
      keepUnusedDataFor: 180, // 3 minutes cache for active injuries
    }),
    createInjury: builder.mutation<Injury, Omit<Injury, 'id'>>({
      query: (injury) => ({
        url: '/injuries',
        method: 'POST',
        body: injury,
      }),
      invalidatesTags: ['Injury'],
    }),
    updateInjury: builder.mutation<Injury, Injury>({
      query: (injury) => ({
        url: `/injuries/${injury.id}`,
        method: 'PUT',
        body: injury,
      }),
      invalidatesTags: (result, error, injury) => [
        { type: 'Injury', id: injury.player_id },
        'Injury',
      ],
    }),
    createTreatment: builder.mutation<Treatment, Omit<Treatment, 'id'>>({
      query: (treatment) => ({
        url: '/treatments',
        method: 'POST',
        body: treatment,
      }),
      invalidatesTags: ['Treatment', 'Injury'],
    }),
    getTreatments: builder.query<Treatment[], number>({
      query: (injuryId) => `/injuries/${injuryId}/treatments`,
      providesTags: (result, error, injuryId) => [
        { type: 'Treatment', id: injuryId },
      ],
    }),
    createMedicalReport: builder.mutation<MedicalReport, Omit<MedicalReport, 'id'>>({
      query: (report) => ({
        url: '/reports',
        method: 'POST',
        body: report,
      }),
      invalidatesTags: ['MedicalReport'],
    }),
    getMedicalReports: builder.query<MedicalReport[], number>({
      query: (playerId) => `/players/${playerId}/reports`,
      providesTags: (result, error, playerId) => [
        { type: 'MedicalReport', id: playerId },
      ],
      keepUnusedDataFor: 600, // 10 minutes cache for reports
    }),
    getMedicalDocuments: builder.query<any[], void>({
      query: () => '/documents',
      providesTags: ['MedicalReport'],
    }),
    getDocumentSignedUrl: builder.query<{ url: string }, string>({
      query: (documentId) => `/documents/${documentId}/signed-url`,
    }),
  }),
});

export const {
  useGetTeamMedicalStatsQuery,
  useGetPlayerMedicalOverviewQuery,
  useGetAllInjuriesQuery,
  useGetActiveInjuriesQuery,
  useCreateInjuryMutation,
  useUpdateInjuryMutation,
  useCreateTreatmentMutation,
  useGetTreatmentsQuery,
  useCreateMedicalReportMutation,
  useGetMedicalReportsQuery,
  useGetMedicalDocumentsQuery,
  useGetDocumentSignedUrlQuery,
} = medicalApi;