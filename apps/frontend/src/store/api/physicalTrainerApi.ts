import { apiSlice } from "./apiSlice";

interface ScheduleItem {
  time: string;
  title: string;
  location: string;
  type: "assessment" | "strength" | "power" | "speed" | "recovery" | "testing" | "cardio";
  players: number;
  priority: "High" | "Medium" | "Low";
  notes?: string;
}

interface TeamReadiness {
  overall: number;
  trend: "up" | "down" | "stable";
  riskPlayers: number;
  readyPlayers: number;
  averageLoad: number;
}

interface PlayerReadiness {
  player: string;
  score: number;
  trend: "up" | "down" | "stable";
  hrv: number;
  sleepScore: number;
  loadStatus: "optimal" | "moderate" | "high" | "critical";
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

interface WeeklyLoadData {
  day: string;
  planned: number;
  actual: number;
  rpe: number;
  recovery: number;
}

interface UpcomingSession {
  date: string;
  time: string;
  title: string;
  type: "strength" | "power" | "speed" | "testing" | "recovery" | "cardio";
  location: string;
  players: number;
  focus: string;
  equipment: string[];
  estimatedLoad: number;
}

interface TestResult {
  player: string;
  test: string;
  result: string;
  previous: string;
  change: string;
  percentile: number;
  date: string;
  category: "Power" | "Speed" | "Strength" | "Endurance" | "Agility";
}

interface Exercise {
  name: string;
  category: "Strength" | "Power" | "Speed" | "Recovery" | "Cardio";
  targetMuscle: "Upper Body" | "Lower Body" | "Full Body" | "Core";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  equipment: string;
  usage: number;
  lastUsed: string;
}

interface LoadManagement {
  weeklyTarget: number;
  currentLoad: number;
  compliance: number;
  highRiskPlayers: number;
  recommendations: string[];
}

interface PhysicalTrainerOverview {
  todaysSchedule: ScheduleItem[];
  teamReadiness: TeamReadiness;
  playerReadiness: PlayerReadiness[];
  weeklyLoadData: WeeklyLoadData[];
  upcomingSessions: UpcomingSession[];
  recentTestResults: TestResult[];
  exerciseLibrary: Exercise[];
  loadManagement: LoadManagement;
}

interface CreateSessionRequest {
  title: string;
  type: string;
  location: string;
  date: string;
  time: string;
  players: number;
  focus?: string;
  equipment?: string[];
  notes?: string;
}

interface CreateSessionResponse {
  success: boolean;
  sessionId: string;
  message: string;
  estimatedParticipants: number;
}

interface RecordTestRequest {
  player: string;
  test: string;
  result: string;
  category: string;
  notes?: string;
}

interface RecordTestResponse {
  success: boolean;
  testId: string;
  message: string;
  percentileRank: number;
}

interface UpdateReadinessNotesRequest {
  player: string;
  notes: string;
  recommendations?: string[];
  riskLevel?: "low" | "medium" | "high";
}

interface UpdateReadinessNotesResponse {
  success: boolean;
  message: string;
  recommendationsUpdated: boolean;
}

export const physicalTrainerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrainerOverview: builder.query<PhysicalTrainerOverview, string>({
      query: (teamId) => `physical-trainer/teams/${teamId}/overview`,
      providesTags: (result, _error, id) => [{ type: "Team" as const, id }],
    }),
    createTrainingSession: builder.mutation<CreateSessionResponse, CreateSessionRequest>({
      query: (sessionData) => ({
        url: `physical-trainer/sessions`,
        method: "POST",
        body: sessionData,
      }),
      invalidatesTags: [{ type: "Team", id: "LIST" }],
    }),
    recordTestResult: builder.mutation<RecordTestResponse, RecordTestRequest>({
      query: (testData) => ({
        url: `physical-trainer/tests/record`,
        method: "POST",
        body: testData,
      }),
      invalidatesTags: [{ type: "Team", id: "LIST" }],
    }),
    updateReadinessNotes: builder.mutation<UpdateReadinessNotesResponse, UpdateReadinessNotesRequest>({
      query: (noteData) => ({
        url: `physical-trainer/readiness/notes`,
        method: "POST",
        body: noteData,
      }),
      invalidatesTags: [{ type: "Team", id: "LIST" }],
    }),
  }),
});

export const { 
  useGetTrainerOverviewQuery,
  useCreateTrainingSessionMutation,
  useRecordTestResultMutation,
  useUpdateReadinessNotesMutation
} = physicalTrainerApi; 