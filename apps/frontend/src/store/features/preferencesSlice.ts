import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PreferencesState {
  language: 'en' | 'sv';  // English or Swedish
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

const initialState: PreferencesState = {
  language: 'en',
  theme: 'light',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
};

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
    toggleNotification: (state, action: PayloadAction<keyof PreferencesState['notifications']>) => {
      const notificationType = action.payload;
      state.notifications[notificationType] = !state.notifications[notificationType];
    },
    updateNotifications: (state, action: PayloadAction<Partial<PreferencesState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
  },
});

export const { setLanguage, setTheme, toggleNotification, updateNotifications } = preferencesSlice.actions;
export default preferencesSlice.reducer;