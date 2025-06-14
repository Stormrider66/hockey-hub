import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

// Load initial state from localStorage if available
const loadAuthFromStorage = (): AuthState => {
  if (typeof window !== 'undefined') {
    try {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        return {
          ...parsed,
          isAuthenticated: !!parsed.accessToken,
        };
      }
    } catch (error) {
      console.error('Error loading auth from localStorage:', error);
    }
  }
  
  return {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  };
};

const initialState: AuthState = loadAuthFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: any }>) => {
      const { accessToken, refreshToken, user } = action.payload;
      
      // Validate required data
      if (!accessToken || !refreshToken || !user) {
        console.error('❌ Invalid credentials data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!user });
        return;
      }
      
      console.log('🔐 Storing credentials:', { 
        accessToken: accessToken.substring(0, 20) + '...', 
        user: user.email 
      });
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      state.isAuthenticated = true;
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth', JSON.stringify({
          accessToken,
          refreshToken,
          user,
        }));
        console.log('💾 Credentials saved to localStorage');
      }
    },
    clearCredentials: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
    },
    updateToken: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        const currentAuth = localStorage.getItem('auth');
        if (currentAuth) {
          const parsed = JSON.parse(currentAuth);
          localStorage.setItem('auth', JSON.stringify({
            ...parsed,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken || parsed.refreshToken,
          }));
        }
      }
    },
  },
});

export const { setCredentials, clearCredentials, updateToken } = authSlice.actions;
export default authSlice.reducer;