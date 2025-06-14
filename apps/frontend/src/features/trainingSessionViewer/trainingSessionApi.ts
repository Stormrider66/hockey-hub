import { apiSlice } from '../../store/api/apiSlice';

export const trainingSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch teams from User Service
    getTeams: builder.query<{ id: string; name: string }[], void>({
      query: () => '/users/teams',
      providesTags: ['Team'],
    }),
    // Fetch team members (players) from User Service
    getPlayersByTeam: builder.query<{ id: string; name: string }[], string>({
      query: (teamId) => `/users/teams/${teamId}/members`,
      providesTags: ['Player'],
    }),
    getPlayerProgram: builder.query<any, string>({
      query: (playerId) => `/scheduled-sessions?assignedToUserId=${playerId}`,
    }),
    startLiveSession: builder.mutation<{ intervals: { phase: 'work' | 'rest'; duration: number }[] }, { playerId: string }>({
      query: ({ playerId }) => ({
        url: `/live-sessions/start`, // TODO: confirm endpoint
        method: 'POST',
        body: { playerId },
      }),
    }),
    createProgram: builder.mutation<
      void,
      {
        teamId: string;
        players: string[];
        schedules: { date: string; time: string }[];
        category: string;
        headers: string[];
        place: string;
        trainer: string;
        grid: string[][];
      }
    >({
      query: ({ teamId, players, schedules, category, headers, place, trainer, grid }) => ({
        url: '/training/programs', // updated to Training Service API
        method: 'POST',
        body: { teamId, players, schedules, category, headers, place, trainer, grid },
      }),
      invalidatesTags: ['Team', 'Player', 'Program'],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetPlayersByTeamQuery,
  useGetPlayerProgramQuery,
  useStartLiveSessionMutation,
  useCreateProgramMutation,
} = trainingSessionApi; 