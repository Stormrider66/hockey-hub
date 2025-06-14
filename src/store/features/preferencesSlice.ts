import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PreferencesState {
  language: 'en' | 'sv';  // English or Swedish
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    timing: {
      beforeEvent: number; // minutes before event
      dailySummary: 'morning' | 'evening' | 'none';
      weeklyReport: boolean;
    };
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    reduceMotion: boolean;
    highContrast: boolean;
    enableScreenReader: boolean;
  };
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
    showWeekNumbers: boolean;
    timeZone: string;
  };
}

const initialState: PreferencesState = {
  language: 'en',
  theme: 'light',
  notifications: {
    email: true,
    push: true,
    sms: false,
    timing: {
      beforeEvent: 30,
      dailySummary: 'morning',
      weeklyReport: true,
    },
  },
  accessibility: {
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
    enableScreenReader: false,
  },
  calendar: {
    defaultView: 'week',
    startOfWeek: 1,
    showWeekNumbers: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

type BooleanNotificationKeys = Extract<keyof PreferencesState['notifications'], 'email' | 'push' | 'sms'>;

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'sv'>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleNotification: (state, action: PayloadAction<BooleanNotificationKeys>) => {
      const notificationType = action.payload;
      state.notifications[notificationType] = !state.notifications[notificationType];
    },
    updateNotifications: (state, action: PayloadAction<Partial<PreferencesState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setNotificationTiming: (state, action: PayloadAction<{
      beforeEvent?: number;
      dailySummary?: 'morning' | 'evening' | 'none';
      weeklyReport?: boolean;
    }>) => {
      state.notifications.timing = { ...state.notifications.timing, ...action.payload };
    },
    updateAccessibility: (state, action: PayloadAction<Partial<PreferencesState['accessibility']>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
    updateCalendarPreferences: (state, action: PayloadAction<Partial<PreferencesState['calendar']>>) => {
      state.calendar = { ...state.calendar, ...action.payload };
    },
  },
});

export const {
  setLanguage,
  setTheme,
  toggleNotification,
  updateNotifications,
  setNotificationTiming,
  updateAccessibility,
  updateCalendarPreferences,
} = preferencesSlice.actions;

export default preferencesSlice.reducer; 