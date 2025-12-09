import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useRefreshTokenMutation } from '@/store/api/authApi';
import { toast } from 'react-hot-toast';

interface UseSessionTimeoutOptions {
  warningTime?: number; // Time before expiry to show warning (in ms)
  checkInterval?: number; // How often to check session expiry (in ms)
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    warningTime = 5 * 60 * 1000, // 5 minutes before expiry
    checkInterval = 30 * 1000, // Check every 30 seconds
  } = options;

  const { user, logout } = useAuth();
  const [refreshToken] = useRefreshTokenMutation();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getTokenExpiry = useCallback(() => {
    // Get token expiry from localStorage or session storage
    // This should be set when the token is received
    const expiryTime = localStorage.getItem('token_expiry');
    return expiryTime ? parseInt(expiryTime, 10) : null;
  }, []);

  const calculateTimeRemaining = useCallback(() => {
    const expiry = getTokenExpiry();
    if (!expiry) return null;
    
    const now = Date.now();
    const remaining = expiry - now;
    return remaining > 0 ? remaining : 0;
  }, [getTokenExpiry]);

  const handleRefreshToken = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await refreshToken().unwrap();
      setShowWarning(false);
      toast.success('Session extended successfully');
    } catch (error) {
      toast.error('Failed to extend session. Please login again.');
      logout();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, logout, isRefreshing]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const remaining = calculateTimeRemaining();
      if (remaining === null) return;

      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Session expired
        toast.error('Your session has expired. Please login again.');
        handleLogout();
      } else if (remaining <= warningTime && !showWarning) {
        // Show warning
        setShowWarning(true);
      } else if (remaining > warningTime && showWarning) {
        // Hide warning if token was refreshed
        setShowWarning(false);
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const interval = setInterval(checkSession, checkInterval);

    return () => clearInterval(interval);
  }, [user, calculateTimeRemaining, warningTime, showWarning, checkInterval, handleLogout]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    showWarning,
    timeRemaining,
    formattedTimeRemaining: timeRemaining !== null ? formatTimeRemaining(timeRemaining) : null,
    handleRefreshToken,
    handleLogout,
    isRefreshing,
  };
}