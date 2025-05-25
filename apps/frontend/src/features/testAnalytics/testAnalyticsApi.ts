import { apiSlice } from '@/store/api/apiSlice';

// Types for API responses
export interface TestDefinition {
  id: string;
  name: string;
}

export interface CorrelationResponse {
  success: boolean;
  count: number;
  r: number;
  scatter: Array<{ x: number; y: number }>;
}

export interface RegressionResponse {
  success: boolean;
  count: number;
  coefficients: number[];
  r2: number;
}

export const testAnalyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTestDefinitions: builder.query<TestDefinition[], void>({
      query: () => '/tests',
    }),
    getCorrelation: builder.query<CorrelationResponse, { testX: string; testY: string; playerId: string }>({
      query: ({ testX, testY, playerId }) =>
        `/tests/analytics/correlation?testX=${testX}&testY=${testY}&playerId=${playerId}`,
    }),
    postRegression: builder.mutation<RegressionResponse, { targetTest: string; predictors: string[]; playerId: string }>({
      query: (body) => ({
        url: '/tests/analytics/regression',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetTestDefinitionsQuery,
  useGetCorrelationQuery,
  useLazyGetCorrelationQuery,
  usePostRegressionMutation,
} = testAnalyticsApi; 