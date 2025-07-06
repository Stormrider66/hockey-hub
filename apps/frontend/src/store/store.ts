import { configureStore } from '@reduxjs/toolkit';
import { playerApi } from './api/playerApi';
import { authApi } from './api/authApi';
import { medicalApi } from './api/medicalApi';
import { trainingApi } from './api/trainingApi';
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
import trainingSessionViewerReducer from './slices/trainingSessionViewerSlice';
import chatReducer from './slices/chatSlice';
import socketReducer from './slices/socketSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    [playerApi.reducerPath]: playerApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [medicalApi.reducerPath]: medicalApi.reducer,
    [trainingApi.reducerPath]: trainingApi.reducer,
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
    trainingSessionViewer: trainingSessionViewerReducer,
    chat: chatReducer,
    socket: socketReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      playerApi.middleware,
      authApi.middleware,
      medicalApi.middleware,
      trainingApi.middleware,
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
      coachApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;