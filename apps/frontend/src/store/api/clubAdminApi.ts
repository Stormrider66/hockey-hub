import { apiSlice } from "./apiSlice";

interface Team { id: number; name: string; members: number; category: string; attendance: number }
interface RoleSeg { name: string; value: number; color: string }
interface Member { name: string; role: string; team: string; status: string }
interface ClubOverview {
  orgStats: { teams: number; activeMembers: number; coachingStaff: number; upcomingEvents: number };
  teams: Team[];
  roleBreakdown: RoleSeg[];
  members: Member[];
  events: { date: string; title: string; location: string }[];
  tasks: { task: string; owner: string }[];
}

export const clubAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClubOverview: builder.query<ClubOverview, string>({
      query: (clubId) => `club-admin/clubs/${clubId}/overview`,
      providesTags: (r, _e, id) => [{ type: "Club", id }],
    }),
  }),
});

export const { useGetClubOverviewQuery } = clubAdminApi; 