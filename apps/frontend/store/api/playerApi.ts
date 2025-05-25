import { apiSlice } from "./apiSlice";

interface ScheduleItem {
  time: string;
  title: string;
  location: string;
  type?: "ice-training" | "physical-training" | "meeting" | "game" | "rehab" | "travel";
  mandatory?: boolean;
  notes?: string;
}

interface UpcomingEvent {
  date: string;
  title: string;
  time: string;
  location?: string;
  type?: "ice-training" | "physical-training" | "meeting" | "game" | "rehab" | "travel";
  importance?: "High" | "Medium" | "Low";
}

interface TrainingAssignment {
  title: string;
  due: string;
  progress: number;
  type: "strength" | "cardio" | "skills" | "recovery" | "nutrition";
  description?: string;
  assignedBy?: string;
  estimatedTime?: string;
}

interface DevelopmentGoal {
  goal: string;
  progress: number;
  target: string;
  category: "technical" | "physical" | "mental" | "tactical";
  priority: "High" | "Medium" | "Low";
  notes?: string;
}

interface ReadinessData {
  date: string;
  value: number;
  sleepQuality?: number;
  energyLevel?: number;
  mood?: number;
  motivation?: number;
}

interface WellnessEntry {
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  mood: number; // 1-10 scale
  motivation: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
  soreness: number; // 1-10 scale
  hydration: number; // 1-10 scale
  nutrition: number; // 1-10 scale
  bodyWeight?: number;
  restingHeartRate?: number;
  notes?: string;
  symptoms?: string[];
  injuries?: string[];
}

interface WellnessStats {
  weeklyAverage: {
    sleepQuality: number;
    energyLevel: number;
    mood: number;
    readinessScore: number;
  };
  trends: {
    metric: string;
    direction: "up" | "down" | "stable";
    change: number;
  }[];
  recommendations: string[];
}

interface PlayerOverviewResponse {
  playerInfo: {
    name: string;
    number: number;
    position: string;
    team: string;
    age?: number;
    height?: string;
    weight?: string;
  };
  schedule: ScheduleItem[];
  upcoming: UpcomingEvent[];
  training: TrainingAssignment[];
  developmentGoals: DevelopmentGoal[];
  readiness: ReadinessData[];
  recentWellness?: WellnessEntry[];
  wellnessStats?: WellnessStats;
}

interface WellnessSubmissionRequest {
  playerId: number;
  entry: Omit<WellnessEntry, 'date'>;
}

interface WellnessSubmissionResponse {
  success: boolean;
  readinessScore: number;
  message: string;
  recommendations?: string[];
}

interface TrainingCompletionRequest {
  playerId: number;
  trainingId: string;
  completionNotes?: string;
  difficulty?: number; // 1-10 scale
  fatigue?: number; // 1-10 scale
}

interface TrainingCompletionResponse {
  success: boolean;
  newProgress: number;
  message: string;
}

export const playerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlayerOverview: builder.query<PlayerOverviewResponse, number>({
      query: (playerId) => `players/${playerId}/overview`,
      providesTags: (result, _e, id) => [{ type: "Player" as const, id }],
    }),
    submitWellness: builder.mutation<WellnessSubmissionResponse, WellnessSubmissionRequest>({
      query: ({ playerId, entry }) => ({
        url: `players/${playerId}/wellness`,
        method: "POST",
        body: entry,
      }),
      invalidatesTags: (result, _e, { playerId }) => [{ type: "Player", id: playerId }],
    }),
    completeTraining: builder.mutation<TrainingCompletionResponse, TrainingCompletionRequest>({
      query: ({ playerId, trainingId, ...data }) => ({
        url: `players/${playerId}/training/${trainingId}/complete`,
        method: "POST", 
        body: data,
      }),
      invalidatesTags: (result, _e, { playerId }) => [{ type: "Player", id: playerId }],
    }),
    getWellnessHistory: builder.query<WellnessEntry[], { playerId: number; days?: number }>({
      query: ({ playerId, days = 30 }) => `players/${playerId}/wellness?days=${days}`,
      providesTags: (result, _e, { playerId }) => [{ type: "Player", id: playerId }],
    }),
  }),
});

export const { 
  useGetPlayerOverviewQuery,
  useSubmitWellnessMutation,
  useCompleteTrainingMutation,
  useGetWellnessHistoryQuery
} = playerApi; 