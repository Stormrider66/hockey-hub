import { apiSlice } from "./apiSlice";

interface Appointment { time: string; player: string; type: string; location: string }
interface Availability { full: number; limited: number; rehab: number; out: number }
interface Injury { player: string; injury: string; status: string }
interface Record { date: string; player: string; note: string }

interface MedicalOverviewResponse {
  appointments: Appointment[];
  availability: Availability;
  injuries: Injury[];
  records: Record[];
}

export const medicalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMedicalOverview: builder.query<MedicalOverviewResponse, string>({
      query: (teamId) => `/medical/teams/${teamId}/overview`,
      providesTags: (r, _e, id) => [{ type: "Team" as const, id }],
    }),
  }),
});

export const { useGetMedicalOverviewQuery } = medicalApi; 