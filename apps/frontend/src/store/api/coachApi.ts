import { apiSlice } from "./apiSlice";

interface ScheduleItem {   time: string;   title: string;   location: string;   type?: string;   note?: string;}interface PlayerInfo {   id: number;   name: string;   position: string;   number: string;   status: string;  goals?: number;  assists?: number;  saves?: number;  savePercentage?: number;}interface Game {   date: string;   opponent: string;   location: string;   time: string;  venue?: string;  importance?: string;}interface RecentPerformance {  game: string;  result: string;  date: string;}interface DevelopmentGoal {  player: string;  goal: string;  progress: number;  target: string;}interface CoachOverview {  teamName?: string;  teamStats?: {     wins: number;     losses: number;     ties: number;     goalsFor: number;     goalsAgainst: number;    goalsPerGame?: number;    powerPlayPercentage?: number;    penaltyKillPercentage?: number;  };  todaysSchedule: ScheduleItem[];  availabilityStats: { available: number; limited: number; unavailable: number };  players: PlayerInfo[];  upcomingGames: Game[];  recentPerformance?: RecentPerformance[];  developmentGoals?: DevelopmentGoal[];}

export const coachApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoachOverview: builder.query<CoachOverview, string>({
      query: (teamId) => `coach/teams/${teamId}/overview`,
      providesTags: (r, _e, id) => [{ type: "Team" as const, id }],
    }),
  }),
});

export const { useGetCoachOverviewQuery } = coachApi; 