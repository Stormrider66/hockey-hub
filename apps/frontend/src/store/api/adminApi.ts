import { apiSlice } from "./apiSlice";

interface Service { name: string; status: string; uptime: number }
interface Metric { date: string; errors: number; response: number }
interface Organization { name: string; value: number; change: number }
interface Task { task: string; owner: string }
interface Revenue { month: string; mrr: number }

interface AdminOverview {
  services: Service[];
  systemMetrics: Metric[];
  organizations: Organization[];
  tasks: Task[];
  revenue: Revenue[];
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<AdminOverview, void>({
      query: () => `/admin/system/overview`,
      providesTags: () => [{ type: "System" as any }],
    }),
  }),
});

export const { useGetAdminOverviewQuery } = adminApi;
