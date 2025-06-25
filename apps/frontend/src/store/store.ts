import { configureStore } from '@reduxjs/toolkit';
import { playerApi } from './api/playerApi';

export const store = configureStore({
  reducer: {
    [playerApi.reducerPath]: playerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(playerApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;