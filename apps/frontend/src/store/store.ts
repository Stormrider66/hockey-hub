import { configureStore } from '@reduxjs/toolkit';
import { playerApi } from './api/playerApi';
import { authApi } from './api/authApi';
import { medicalApi } from './api/medicalApi';
import { trainingApi } from './api/trainingApi';
import { statisticsApi } from './api/statisticsApi';

export const store = configureStore({
  reducer: {
    [playerApi.reducerPath]: playerApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [medicalApi.reducerPath]: medicalApi.reducer,
    [trainingApi.reducerPath]: trainingApi.reducer,
    [statisticsApi.reducerPath]: statisticsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      playerApi.middleware,
      authApi.middleware,
      medicalApi.middleware,
      trainingApi.middleware,
      statisticsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;