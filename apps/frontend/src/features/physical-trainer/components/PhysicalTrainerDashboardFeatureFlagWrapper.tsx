'use client';

import React, { lazy, Suspense } from 'react';
import { useFeatureFlags } from '../utils/featureFlags';
import { LoadingSpinner } from '@/components/ui/loading';
import PhysicalTrainerDashboardMonitored from './PhysicalTrainerDashboardMonitored';
import PhysicalTrainerDashboardProgressive from './PhysicalTrainerDashboardProgressive';

/**
 * Feature-flag controlled wrapper that selects the appropriate dashboard version
 * based on enabled optimization flags
 */
const PhysicalTrainerDashboardDeferred = lazy(() => import('./PhysicalTrainerDashboardDeferred'));

export default function PhysicalTrainerDashboardFeatureFlagWrapper() {
  const flags = useFeatureFlags();
  
  // If deferred initialization is enabled, use the most optimized version
  if (flags.DEFER_INITIALIZATION) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
        <PhysicalTrainerDashboardDeferred />
      </Suspense>
    );
  }
  
  // If progressive tabs are enabled, use the progressive version
  if (flags.PROGRESSIVE_TABS) {
    return <PhysicalTrainerDashboardProgressive />;
  }
  
  // Otherwise use the monitored version (which already has Phase 1 optimizations)
  return <PhysicalTrainerDashboardMonitored />;
}