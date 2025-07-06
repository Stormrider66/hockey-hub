'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation, useLogoutMutation, useRegisterMutation, useRefreshTokenMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials, clearCredentials } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { withRetry } from '@/utils/retryUtils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  };
  organizationId?: string;
  teams?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval - refresh 5 minutes before expiry
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_EXPIRY_KEY = 'token_expiry';
const USER_DATA_KEY = 'user_data';
const REMEMBER_ME_KEY = 'remember_me';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [login] = useLoginMutation();
  const [logout] = useLogoutMutation();
  const [register] = useRegisterMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        // In mock mode, also check for tokens in localStorage
        const hasAuthToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        const storage = rememberMe ? localStorage : sessionStorage;
        
        const userData = storage.getItem(USER_DATA_KEY) || localStorage.getItem(USER_DATA_KEY);
        const tokenExpiry = storage.getItem(TOKEN_EXPIRY_KEY) || localStorage.getItem(TOKEN_EXPIRY_KEY);
        
        if (userData && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10);
          const now = Date.now();
          
          if (expiryTime > now) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            // Sync with Redux store
            const token = localStorage.getItem('access_token') || '';
            dispatch(setCredentials({ user: parsedUser, token }));
          } else {
            // Token expired, clear storage
            clearStorage();
            dispatch(clearCredentials());
          }
        } else if (hasAuthToken && process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true') {
          // In mock mode, if we have a token but no user data, clear and redirect to login
          console.log('🔄 Mock mode: Found token but no user data, clearing...');
          clearStorage();
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        clearStorage();
        dispatch(clearCredentials());
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [dispatch]);

  // Clear storage helper
  const clearStorage = useCallback(() => {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('mock_user_role');
    localStorage.removeItem('user_role');
    sessionStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    // Clear cookies as well
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  // Save user data to storage
  const saveUserData = useCallback((userData: User, expiresIn: number, rememberMe: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    storage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // In mock mode, always save to localStorage for easier development
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true') {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
    
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    }
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!user) return;

    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    const tokenExpiry = storage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!tokenExpiry) return;

    const expiryTime = parseInt(tokenExpiry, 10);
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // If token expires in less than 5 minutes, refresh now
    if (timeUntilExpiry < TOKEN_REFRESH_INTERVAL) {
      refreshToken();
    } else {
      // Schedule refresh for 5 minutes before expiry
      const refreshTime = timeUntilExpiry - TOKEN_REFRESH_INTERVAL;
      const timeout = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [user]);

  // Login function
  const loginUser = useCallback(async (email: string, password: string, rememberMe = false) => {
    console.log('🔑 Login attempt:', { email, rememberMe });
    setError(null);
    setLoading(true);

    try {
      let result;
      
      // Skip retry logic in mock mode for faster development
      const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
      if (isMockMode) {
        console.log('🚀 Using mock mode - skipping retry logic');
        result = await login({ email, password }).unwrap();
      } else {
        result = await withRetry(
          () => login({ email, password }).unwrap(),
          {
            maxRetries: 2,
            initialDelay: 1000,
            shouldRetry: (error) => {
              // Don't retry on auth failures
              if (error?.data?.message?.includes('Invalid') || 
                  error?.data?.message?.includes('locked') ||
                  error?.status === 401) {
                return false;
              }
              // Retry on network errors
              return error?.code === 'OFFLINE' || error?.code === 'ERR_NETWORK' || !error?.status;
            },
            onRetry: (error, attempt) => {
              toast.loading(`Connection failed. Retrying... (${attempt}/2)`, {
                id: 'login-retry'
              });
            }
          }
        );
      }
      
      toast.dismiss('login-retry');
      
      console.log('🔐 Login result:', result);
      
      if (result.user && result.access_token) {
        console.log('✅ Setting user data:', result.user);
        setUser(result.user);
        saveUserData(result.user, result.expires_in || 3600, rememberMe);
        
        // Sync with Redux store
        dispatch(setCredentials({ user: result.user, token: result.access_token }));
        
        // Set current user ID for compatibility with existing code
        localStorage.setItem('current_user_id', result.user.id);
        
        // Also set access token for home page redirect check
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('authToken', result.access_token);
        
        toast.success('Successfully logged in!');
        
        // Redirect based on role
        const roleName = result.user.role.name.toLowerCase();
        console.log('🚀 Redirecting based on role:', roleName);
        
        // Map role names to paths
        const roleToPath: Record<string, string> = {
          'player': '/player',
          'coach': '/coach',
          'parent': '/parent',
          'medical staff': '/medical-staff',
          'medical_staff': '/medical-staff',
          'equipment manager': '/equipment-manager',
          'equipment_manager': '/equipment-manager',
          'physical trainer': '/physical-trainer',
          'physical_trainer': '/physical-trainer',
          'club admin': '/club-admin',
          'club_admin': '/club-admin',
          'admin': '/admin'
        };
        
        const path = roleToPath[roleName] || '/player';
        console.log('🎯 Navigating to:', path);
        router.push(path);
      }
    } catch (err: unknown) {
      toast.dismiss('login-retry');
      
      let errorMessage = 'Failed to login';
      if (err && typeof err === 'object') {
        if ('data' in err) {
          const apiError = err.data as { message?: string };
          errorMessage = apiError.message || 'Login failed';
        } else if ('message' in err) {
          errorMessage = (err as { message: string }).message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [login, router, saveUserData, dispatch]);

  // Register function
  const registerUser = useCallback(async (data: RegisterData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await register(data).unwrap();
      
      if (result.user && result.access_token) {
        setUser(result.user);
        saveUserData(result.user, result.expires_in || 3600, false);
        
        // Sync with Redux store
        dispatch(setCredentials({ user: result.user, token: result.access_token }));
        
        // Set current user ID for compatibility
        localStorage.setItem('current_user_id', result.user.id);
        
        toast.success('Successfully registered! Please verify your email.');
        router.push('/verify-email');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to register';
      if (err && typeof err === 'object' && 'data' in err) {
        const apiError = err.data as { message?: string };
        errorMessage = apiError.message || 'Registration failed';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [register, router, saveUserData, dispatch]);

  // Logout function
  const logoutUser = useCallback(async () => {
    setLoading(true);

    try {
      await logout().unwrap();
      
      setUser(null);
      clearStorage();
      localStorage.removeItem('current_user_id');
      dispatch(clearCredentials());
      
      toast.success('Successfully logged out');
      router.push('/login');
    } catch (err: unknown) {
      // Even if logout fails on server, clear local state
      setUser(null);
      clearStorage();
      localStorage.removeItem('current_user_id');
      dispatch(clearCredentials());
      
      console.error('Logout error:', err);
      toast.error('Logout completed with errors');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [logout, router, clearStorage, dispatch]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const result = await withRetry(
        () => refreshTokenMutation().unwrap(),
        {
          maxRetries: 2,
          initialDelay: 1000,
          shouldRetry: (error) => {
            // Don't retry on 401/403 - these are auth failures
            if (error?.status === 401 || error?.status === 403) {
              return false;
            }
            // Retry on network errors
            return error?.code === 'OFFLINE' || error?.code === 'ERR_NETWORK' || !error?.status;
          },
          onRetry: (error, attempt) => {
            console.log(`Retrying token refresh (attempt ${attempt})...`);
          }
        }
      );
      
      if (result.user && result.access_token) {
        setUser(result.user);
        const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
        saveUserData(result.user, result.expires_in || 3600, rememberMe);
        dispatch(setCredentials({ user: result.user, token: result.access_token }));
      }
    } catch (err) {
      console.error('Token refresh failed after retries:', err);
      // If refresh fails, logout user
      setUser(null);
      clearStorage();
      localStorage.removeItem('current_user_id');
      dispatch(clearCredentials());
      router.push('/login');
    }
  }, [refreshTokenMutation, router, saveUserData, clearStorage, dispatch]);

  // Permission check
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;
    
    return user.role.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }, [user]);

  // Role check
  const hasRole = useCallback((roleName: string): boolean => {
    if (!user) return false;
    
    return user.role.name.toLowerCase() === roleName.toLowerCase();
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    refreshToken,
    clearError,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string;
    requiredPermission?: { resource: string; action: string };
    redirectTo?: string;
  }
) => {
  return (props: P) => {
    const { user, loading, hasRole, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(options?.redirectTo || '/login');
          return;
        }

        if (options?.requiredRole && !hasRole(options.requiredRole)) {
          router.push('/unauthorized');
          return;
        }

        if (
          options?.requiredPermission &&
          !hasPermission(options.requiredPermission.resource, options.requiredPermission.action)
        ) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [user, loading, hasRole, hasPermission, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
};