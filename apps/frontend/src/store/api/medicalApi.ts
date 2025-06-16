import { apiSlice } from "./apiSlice";

// Types matching the backend Medical Service
interface Injury {
  id: number;
  player: string;
  playerId: string;
  injury: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'acute' | 'rehab' | 'rtp' | 'assessment';
  dateOccurred: string;
  estimatedReturn: string;
  phase: number;
  totalPhases: number;
  progress: number;
  mechanism: string;
  notes: string;
}

interface Treatment {
  id: string;
  time: string;
  player: string;
  playerId: string;
  type: string;
  location: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  date: string;
  injuryId?: string;
  notes?: string;
}

interface PlayerAvailability {
  full: number;
  limited: number;
  individual: number;
  rehab: number;
  unavailable: number;
}

interface MedicalOverviewResponse {
  appointments: Treatment[];
  availability: PlayerAvailability;
  injuries: Injury[];
  records: any[];
}

// Individual injury response
interface InjuryResponse {
  id: number;
  playerId: string;
  injuryType: string;
  bodyPart: string;
  severity: string;
  status: string;
  dateOccurred: string;
  estimatedReturn?: string;
  description?: string;
  mechanism?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Treatment plan response
interface TreatmentPlan {
  id: number;
  injuryId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Medical document response
interface MedicalDocument {
  id: string;
  player_id: string;
  title: string;
  document_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  injury_id?: string;
  uploaded_by_user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

// Document upload parameters
interface DocumentUploadParams {
  file: File;
  playerId: string;
  title: string;
  documentType: string;
  injuryId?: string;
}

// Player availability status
interface AvailabilityStatus {
  playerId: string;
  currentStatus: string;
  notes?: string;
  effectiveFrom: string;
  expectedEndDate?: string;
  injuryId?: string;
}

interface UpdateAvailabilityParams {
  playerId: string;
  currentStatus: string;
  notes?: string;
  effectiveFrom?: string;
  expectedEndDate?: string;
  injuryId?: string;
}

export const medicalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Overview endpoint (mock for now, will be implemented in backend)
    getMedicalOverview: builder.query<MedicalOverviewResponse, string>({
      query: (teamId) => `medical/teams/${teamId}/overview`,
      providesTags: [{ type: 'Team' as const }],
    }),
    
    // Real backend endpoints for injuries
    getInjuries: builder.query<InjuryResponse[], void>({
      query: () => 'medical/injuries',
      providesTags: ['Injury'],
    }),
    
    getInjuryById: builder.query<InjuryResponse, number>({
      query: (id) => `medical/injuries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Injury', id }],
    }),
    
    createInjury: builder.mutation<InjuryResponse, Partial<InjuryResponse>>({
      query: (injury) => ({
        url: 'medical/injuries',
        method: 'POST',
        body: injury,
      }),
      invalidatesTags: ['Injury'],
    }),
    
    updateInjury: builder.mutation<InjuryResponse, { id: number; injury: Partial<InjuryResponse> }>({
      query: ({ id, injury }) => ({
        url: `medical/injuries/${id}`,
        method: 'PUT',
        body: injury,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Injury', id }],
    }),
    
    deleteInjury: builder.mutation<void, number>({
      query: (id) => ({
        url: `medical/injuries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Injury'],
    }),
    
    // Treatment plan endpoints
    getTreatmentPlans: builder.query<TreatmentPlan[], number>({
      query: (injuryId) => `medical/injuries/${injuryId}/treatments`,
      providesTags: (result, error, injuryId) => [{ type: 'Injury', id: injuryId }],
    }),
    
    createTreatmentPlan: builder.mutation<TreatmentPlan, { injuryId: number; plan: Partial<TreatmentPlan> }>({
      query: ({ injuryId, plan }) => ({
        url: `medical/injuries/${injuryId}/treatments`,
        method: 'POST',
        body: plan,
      }),
      invalidatesTags: (result, error, { injuryId }) => [{ type: 'Injury', id: injuryId }],
    }),

    // Medical Document endpoints
    uploadDocument: builder.mutation<MedicalDocument, DocumentUploadParams>({
      query: ({ file, playerId, title, documentType, injuryId }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('playerId', playerId);
        formData.append('title', title);
        formData.append('documentType', documentType);
        if (injuryId) {
          formData.append('injuryId', injuryId);
        }
        
        return {
          url: 'medical/documents',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Resource'],
    }),

    getMedicalDocuments: builder.query<MedicalDocument[], { playerId?: string; injuryId?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.playerId) searchParams.append('playerId', params.playerId);
        if (params.injuryId) searchParams.append('injuryId', params.injuryId);
        
        return `medical/documents?${searchParams.toString()}`;
      },
      providesTags: ['Resource'],
    }),

    getDocumentSignedUrl: builder.query<{ url: string }, string>({
      query: (documentId) => `medical/documents/${documentId}/url`,
      providesTags: (result, error, documentId) => [{ type: 'Resource', id: documentId }],
    }),

    deleteDocument: builder.mutation<void, string>({
      query: (documentId) => ({
        url: `medical/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resource'],
    }),

    // Player availability endpoints
    getPlayerAvailability: builder.query<AvailabilityStatus, string>({
      query: (playerId) => `medical/players/${playerId}/availability`,
      providesTags: (result, error, playerId) => [{ type: 'Player', id: playerId }],
    }),

    updatePlayerAvailability: builder.mutation<AvailabilityStatus, UpdateAvailabilityParams>({
      query: ({ playerId, ...data }) => ({
        url: `medical/players/${playerId}/availability`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { playerId }) => [{ type: 'Player', id: playerId }],
    }),

    // Treatment endpoints
    getTreatmentsByInjury: builder.query<Treatment[], string>({
      query: (injuryId) => `medical/injuries/${injuryId}/treatments`,
      providesTags: (result, error, injuryId) => [{ type: 'Injury', id: injuryId }],
    }),

    addTreatmentToInjury: builder.mutation<Treatment, { injuryId: string; treatment: Partial<Treatment> }>({
      query: ({ injuryId, treatment }) => ({
        url: `medical/injuries/${injuryId}/treatments`,
        method: 'POST',
        body: treatment,
      }),
      invalidatesTags: (result, error, { injuryId }) => [{ type: 'Injury', id: injuryId }],
    }),

    updateTreatment: builder.mutation<Treatment, { id: string; treatment: Partial<Treatment> }>({
      query: ({ id, treatment }) => ({
        url: `medical/treatments/${id}`,
        method: 'PUT',
        body: treatment,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Training', id }],
    }),

    deleteTreatment: builder.mutation<void, string>({
      query: (id) => ({
        url: `medical/treatments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Training'],
    }),
  }),
});

export const { 
  useGetMedicalOverviewQuery,
  useGetInjuriesQuery,
  useGetInjuryByIdQuery,
  useCreateInjuryMutation,
  useUpdateInjuryMutation,
  useDeleteInjuryMutation,
  useGetTreatmentPlansQuery,
  useCreateTreatmentPlanMutation,
  useUploadDocumentMutation,
  useGetMedicalDocumentsQuery,
  useGetDocumentSignedUrlQuery,
  useDeleteDocumentMutation,
  useGetPlayerAvailabilityQuery,
  useUpdatePlayerAvailabilityMutation,
  useGetTreatmentsByInjuryQuery,
  useAddTreatmentToInjuryMutation,
  useUpdateTreatmentMutation,
  useDeleteTreatmentMutation,
} = medicalApi; 