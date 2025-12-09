import { useState, useEffect, useCallback } from 'react';
import { 
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation 
} from '../../../store/api/notificationApi';
import { NotificationPreference } from '../types';

interface UseNotificationPreferencesResult {
  preferences: NotificationPreference[];
  isLoading: boolean;
  error: string | null;
  updatePreferences: (preferences: Partial<NotificationPreference>[]) => Promise<void>;
  refreshPreferences: () => void;
}

export function useNotificationPreferences(
  userId: string, 
  organizationId?: string
): UseNotificationPreferencesResult {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    data: preferencesData,
    isLoading,
    refetch,
  } = useGetNotificationPreferencesQuery();

  const [updatePreferencesMutation] = useUpdateNotificationPreferencesMutation();

  useEffect(() => {
    if (preferencesData) {
      setPreferences(preferencesData);
      setError(null);
    }
  }, [preferencesData]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreference>[]) => {
    try {
      await updatePreferencesMutation({ 
        userId, 
        organizationId, 
        preferences: newPreferences 
      }).unwrap();
      
      // Refresh preferences after update
      refetch();
    } catch (error) {
      setError('Failed to update notification preferences');
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }, [updatePreferencesMutation, userId, organizationId, refetch]);

  const refreshPreferences = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refreshPreferences,
  };
}