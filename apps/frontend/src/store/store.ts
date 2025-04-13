import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './features/preferencesSlice';
import { apiSlice } from './api/apiSlice'; // Import the apiSlice

export const store = configureStore({
  reducer: {
    preferences: preferencesReducer,
    [apiSlice.reducerPath]: apiSlice.reducer, // Add the api reducer
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;