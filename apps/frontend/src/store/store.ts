import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { combineReducers } from 'redux';
import { playerApi } from './api/playerApi';
import { authApi } from './api/authApi';
import { medicalApi } from './api/medicalApi';
import { trainingApi } from './api/trainingApi';
import { unifiedTrainingApi } from './api/unifiedTrainingApi';
import { statisticsApi } from './api/statisticsApi';
import { calendarApi } from './api/calendarApi';
import { notificationApi } from './api/notificationApi';
import { chatApi } from './api/chatApi';
import { dashboardApi } from './api/dashboardApi';
import { privacyApi } from './api/privacyApi';
import { scheduledMessageApi } from './api/scheduledMessageApi';
import { fileApi } from './api/fileApi';
import { communicationApi } from './api/communicationApi';
import { parentCommunicationApi } from './api/parentCommunicationApi';
import { paymentApi } from './api/paymentApi';
import { userApi } from './api/userApi';
import { scheduleClarificationApi } from './api/scheduleClarificationApi';
import { urgentMedicalApi } from './api/urgentMedicalApi';
import { medicalDiscussionApi } from './api/medicalDiscussionApi';
import { appointmentReminderApi } from './api/appointmentReminderApi';
import { systemAnnouncementApi } from './api/systemAnnouncementApi';
import { moderationApi } from './api/moderationApi';
import { eventConversationApi } from './api/eventConversationApi';
import { performanceApi } from './api/performanceApi';
import { coachApi } from './api/coachApi';
import { facilityApi } from './api/facilityApi';
import { workoutBuilderApi } from './utils/workoutBuilderIntegration';
import { recentWorkoutsApi } from './api/recentWorkoutsApi';
import { predictiveAnalyticsApi } from './api/predictiveAnalyticsApi';
import { adminApi } from './api/adminApi';
import { medicalAnalyticsApi } from './api/medicalAnalyticsApi';
import { equipmentApi } from './api/equipmentApi';
import { bulkSessionApi } from './api/bulkSessionApi';
import { scheduleApi } from './api/scheduleApi';
import trainingSessionViewerReducer from './slices/trainingSessionViewerSlice';
import chatReducer from './slices/chatSlice';
import socketReducer from './slices/socketSlice';
import authReducer from './slices/authSlice';
import workoutBuilderReducer from './slices/workoutBuilderSlice';
import { createRTKQueryTimingMiddleware } from '@/utils/performance/trackApiTiming';
import { persistConfig } from './persistConfig';
import { ensureCacheCompatibility } from './cache';
import { cacheAnalyticsMiddleware } from './cache/cacheMiddleware';
import { initializeCacheWarming } from './cache/cacheWarming';

// Initialize cache versioning system
if (typeof window !== 'undefined') {
  ensureCacheCompatibility().catch((error) => {
    console.error('Failed to initialize cache versioning:', error);
  });
}

// Combine all reducers
const rootReducer = combineReducers({
  [playerApi.reducerPath]: playerApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [medicalApi.reducerPath]: medicalApi.reducer,
  [trainingApi.reducerPath]: trainingApi.reducer,
  [unifiedTrainingApi.reducerPath]: unifiedTrainingApi.reducer,
  [statisticsApi.reducerPath]: statisticsApi.reducer,
  [calendarApi.reducerPath]: calendarApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [privacyApi.reducerPath]: privacyApi.reducer,
  [scheduledMessageApi.reducerPath]: scheduledMessageApi.reducer,
  [fileApi.reducerPath]: fileApi.reducer,
  [communicationApi.reducerPath]: communicationApi.reducer,
  [parentCommunicationApi.reducerPath]: parentCommunicationApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [scheduleClarificationApi.reducerPath]: scheduleClarificationApi.reducer,
  [urgentMedicalApi.reducerPath]: urgentMedicalApi.reducer,
  [medicalDiscussionApi.reducerPath]: medicalDiscussionApi.reducer,
  [appointmentReminderApi.reducerPath]: appointmentReminderApi.reducer,
  [systemAnnouncementApi.reducerPath]: systemAnnouncementApi.reducer,
  [moderationApi.reducerPath]: moderationApi.reducer,
  [eventConversationApi.reducerPath]: eventConversationApi.reducer,
  [performanceApi.reducerPath]: performanceApi.reducer,
  [coachApi.reducerPath]: coachApi.reducer,
  [facilityApi.reducerPath]: facilityApi.reducer,
  [workoutBuilderApi.reducerPath]: workoutBuilderApi.reducer,
  [recentWorkoutsApi.reducerPath]: recentWorkoutsApi.reducer,
  [predictiveAnalyticsApi.reducerPath]: predictiveAnalyticsApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  [medicalAnalyticsApi.reducerPath]: medicalAnalyticsApi.reducer,
  [equipmentApi.reducerPath]: equipmentApi.reducer,
  [bulkSessionApi.reducerPath]: bulkSessionApi.reducer,
  [scheduleApi.reducerPath]: scheduleApi.reducer,
  trainingSessionViewer: trainingSessionViewerReducer,
  chat: chatReducer,
  socket: socketReducer,
  auth: authReducer,
  workoutBuilder: workoutBuilderReducer,
});

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore these paths in the state for serialization checks
        ignoredPaths: ['socket', 'chat.activeConnections'],
      },
    }).concat(
      cacheAnalyticsMiddleware,
      createRTKQueryTimingMiddleware(),
      playerApi.middleware,
      authApi.middleware,
      medicalApi.middleware,
      trainingApi.middleware,
      unifiedTrainingApi.middleware,
      statisticsApi.middleware,
      calendarApi.middleware,
      notificationApi.middleware,
      chatApi.middleware,
      dashboardApi.middleware,
      privacyApi.middleware,
      scheduledMessageApi.middleware,
      fileApi.middleware,
      communicationApi.middleware,
      parentCommunicationApi.middleware,
      paymentApi.middleware,
      userApi.middleware,
      scheduleClarificationApi.middleware,
      urgentMedicalApi.middleware,
      medicalDiscussionApi.middleware,
      appointmentReminderApi.middleware,
      systemAnnouncementApi.middleware,
      moderationApi.middleware,
      eventConversationApi.middleware,
      performanceApi.middleware,
      coachApi.middleware,
      facilityApi.middleware,
      workoutBuilderApi.middleware,
      recentWorkoutsApi.middleware,
      predictiveAnalyticsApi.middleware,
      adminApi.middleware,
      medicalAnalyticsApi.middleware,
      equipmentApi.middleware,
      bulkSessionApi.middleware,
      scheduleApi.middleware
    ),
});

// Create the persistor
export const persistor = persistStore(store);

// Initialize cache warming after store is created and rehydrated
// Skip cache warming in development/mock mode since backend services aren't running
const shouldEnableCacheWarming =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH !== 'true';

if (typeof window !== 'undefined' && shouldEnableCacheWarming) {
  let cleanupCacheWarming: (() => void) | null = null;

  // Function to start cache warming once store is ready
  const startCacheWarmingWhenReady = () => {
    try {
      // Ensure store is properly initialized
      const state = store.getState();
      if (!state || typeof state !== 'object') {
        console.warn('Store not ready for cache warming, will retry...');
        setTimeout(startCacheWarmingWhenReady, 1000);
        return;
      }

      // Check if store has been rehydrated (redux-persist adds _persist key)
      if (state._persist && !state._persist.rehydrated) {
        console.debug('Waiting for store rehydration before cache warming...');
        setTimeout(startCacheWarmingWhenReady, 500);
        return;
      }

      // Check if at least one RTK Query API is initialized
      // We'll check for authApi as it's critical
      const hasInitializedApis = authApi.endpoints && Object.keys(authApi.endpoints).length > 0;
      
      if (!hasInitializedApis) {
        console.debug('RTK Query APIs not yet initialized, waiting...');
        setTimeout(startCacheWarmingWhenReady, 1000);
        return;
      }

      console.debug('Store is ready, initializing cache warming...');
      cleanupCacheWarming = initializeCacheWarming(store.dispatch);
    } catch (error) {
      console.error('Failed to initialize cache warming:', error);
    }
  };

  // Wait longer for initial store setup to ensure APIs are initialized
  const initTimeout = setTimeout(startCacheWarmingWhenReady, 3000);

  // Clean up on module unload (if applicable)
  if (typeof window !== 'undefined' && 'addEventListener' in window) {
    window.addEventListener('beforeunload', () => {
      clearTimeout(initTimeout);
      if (cleanupCacheWarming) {
        cleanupCacheWarming();
      }
    });
  }
}

// Export types - update RootState to use the root reducer before persistence
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;