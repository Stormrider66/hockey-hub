'use client';

import { useFeatureFlag } from '../../utils/featureFlags';
import Head from 'next/head';

/**
 * Font Optimization Component
 * Phase 1.1 - Safe Quick Win
 * 
 * Adds preconnect hints for Google Fonts to improve font loading performance
 */
export function FontOptimization() {
  const isEnabled = useFeatureFlag('OPTIMIZE_FONTS');

  if (!isEnabled) {
    return null;
  }

  return (
    <Head>
      {/* Preconnect to Google Fonts for faster font loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS prefetch as a fallback for older browsers */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </Head>
  );
}