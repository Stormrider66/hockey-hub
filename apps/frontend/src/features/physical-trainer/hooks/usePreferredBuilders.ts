import { useState, useEffect, useCallback } from 'react';
import { SmartDefaultsPreferencesManager } from '../utils/smartDefaultsPreferences';

interface BuilderPreferences {
  useEnhancedBuilders: boolean;
  preferredBuildersByType: {
    strength: 'standard' | 'enhanced';
    conditioning: 'standard' | 'enhanced';
    hybrid: 'standard' | 'enhanced';
    agility: 'standard' | 'enhanced';
  };
  autoEnableForNewUsers: boolean;
}

const DEFAULT_PREFERENCES: BuilderPreferences = {
  useEnhancedBuilders: true,
  preferredBuildersByType: {
    strength: 'enhanced',
    conditioning: 'enhanced',
    hybrid: 'enhanced',
    agility: 'enhanced'
  },
  autoEnableForNewUsers: true
};

export function usePreferredBuilders(userId?: string) {
  const [preferences, setPreferences] = useState<BuilderPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const storedPrefs = localStorage.getItem(`builder_preferences_${userId}`);
      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs));
      } else {
        // Check if this is a new user
        const userPrefs = SmartDefaultsPreferencesManager.getPreferences(userId);
        if (!userPrefs) {
          // New user - enable enhanced builders by default
          setPreferences(DEFAULT_PREFERENCES);
          localStorage.setItem(
            `builder_preferences_${userId}`,
            JSON.stringify(DEFAULT_PREFERENCES)
          );
        }
      }
    } catch (error) {
      console.error('Error loading builder preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save preferences
  const savePreferences = useCallback((newPreferences: BuilderPreferences) => {
    if (!userId) return;

    try {
      localStorage.setItem(
        `builder_preferences_${userId}`,
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving builder preferences:', error);
    }
  }, [userId]);

  // Toggle enhanced builders globally
  const toggleEnhancedBuilders = useCallback(() => {
    const newPrefs = {
      ...preferences,
      useEnhancedBuilders: !preferences.useEnhancedBuilders,
      preferredBuildersByType: {
        strength: !preferences.useEnhancedBuilders ? 'enhanced' : 'standard',
        conditioning: !preferences.useEnhancedBuilders ? 'enhanced' : 'standard',
        hybrid: !preferences.useEnhancedBuilders ? 'enhanced' : 'standard',
        agility: !preferences.useEnhancedBuilders ? 'enhanced' : 'standard'
      }
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Set preference for specific workout type
  const setBuilderPreference = useCallback((
    workoutType: keyof BuilderPreferences['preferredBuildersByType'],
    builderType: 'standard' | 'enhanced'
  ) => {
    const newPrefs = {
      ...preferences,
      preferredBuildersByType: {
        ...preferences.preferredBuildersByType,
        [workoutType]: builderType
      }
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Get the preferred builder component for a workout type
  const getPreferredBuilder = useCallback((workoutType: keyof BuilderPreferences['preferredBuildersByType']) => {
    return preferences.preferredBuildersByType[workoutType];
  }, [preferences]);

  // Check if should show onboarding for smart defaults
  const shouldShowSmartDefaultsOnboarding = useCallback(() => {
    if (!userId) return false;
    
    const onboardingKey = `smart_defaults_onboarding_shown_${userId}`;
    const hasShown = localStorage.getItem(onboardingKey);
    
    if (!hasShown && preferences.useEnhancedBuilders) {
      localStorage.setItem(onboardingKey, 'true');
      return true;
    }
    
    return false;
  }, [userId, preferences.useEnhancedBuilders]);

  return {
    preferences,
    isLoading,
    toggleEnhancedBuilders,
    setBuilderPreference,
    getPreferredBuilder,
    shouldShowSmartDefaultsOnboarding,
    isEnhancedEnabled: preferences.useEnhancedBuilders
  };
}