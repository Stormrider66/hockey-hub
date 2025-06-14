// Feature Flag Configuration for Progressive Backend Integration
// This system allows us to gradually enable backend integration per feature
// while maintaining mock data fallbacks for development and demos

export const FEATURE_FLAGS = {
  // Already integrated
  'auth-backend': true,
  
  // Ready for integration (90% complete services)  
  'medical-backend': process.env.NEXT_PUBLIC_ENABLE_MEDICAL === 'true',
  'planning-backend': process.env.NEXT_PUBLIC_ENABLE_PLANNING === 'true',
  
  // Partially ready (40-60% complete)
  'calendar-backend': process.env.NEXT_PUBLIC_ENABLE_CALENDAR === 'true',
  'training-backend': false,
  'admin-backend': false,
  
  // Not ready (need development)
  'stats-backend': false,
  'payment-backend': false,
  'communication-backend': false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Hook to check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag] ?? false;
};

/**
 * Get all enabled feature flags
 * @returns Array of enabled feature flag names
 */
export const getEnabledFeatures = (): FeatureFlag[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
};

/**
 * Check if any backend integration is enabled
 * @returns boolean indicating if any backend features are enabled
 */
export const hasAnyBackendIntegration = (): boolean => {
  return Object.values(FEATURE_FLAGS).some(enabled => enabled);
};

/**
 * Development helper to override feature flags
 * Only works in development mode
 */
export const overrideFeatureFlag = (flag: FeatureFlag, enabled: boolean): void => {
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore - Intentionally modifying readonly object in development
    FEATURE_FLAGS[flag] = enabled;
    console.log(`🚩 Feature flag '${flag}' ${enabled ? 'enabled' : 'disabled'} for development`);
  }
}; 