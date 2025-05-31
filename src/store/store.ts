import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './features/preferencesSlice';

export const store = configureStore({
  reducer: {
    preferences: preferencesReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 