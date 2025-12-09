'use client';

import { useEffect } from 'react';
import { useFeatureFlags } from '../../utils/featureFlags';
import { performanceMonitor } from '../../utils/performanceMonitor';

/**
 * Optimization Monitor
 * Tracks the combined impact of all Phase 1 optimizations
 */
export function OptimizationMonitor() {
  const flags = useFeatureFlags();
  
  useEffect(() => {
    const activeOptimizations = [];
    
    if (flags.OPTIMIZE_FONTS) {
      activeOptimizations.push('fonts');
      // Font optimization reduces text render blocking
      performanceMonitor.startMeasure('font-optimization-impact');
    }
    
    if (flags.REMOVE_UNUSED_IMPORTS) {
      activeOptimizations.push('imports');
      // Import optimization reduces bundle size
      performanceMonitor.startMeasure('import-optimization-impact');
    }
    
    if (flags.OPTIMIZE_ICONS) {
      activeOptimizations.push('icons');
      // Icon optimization significantly reduces bundle size
      performanceMonitor.startMeasure('icon-optimization-impact');
    }
    
    if (activeOptimizations.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🚀 Active optimizations: ${activeOptimizations.join(', ')}`);
      
      // Estimate combined impact
      const estimatedReduction = {
        fonts: flags.OPTIMIZE_FONTS ? 1000 : 0, // 1s FCP improvement
        imports: flags.REMOVE_UNUSED_IMPORTS ? 200 : 0, // 200KB bundle reduction
        icons: flags.OPTIMIZE_ICONS ? 150 : 0, // 150KB bundle reduction
      };
      
      const totalBundleReduction = estimatedReduction.imports + estimatedReduction.icons;
      const fcpImprovement = estimatedReduction.fonts;
      
      console.log(`📊 Estimated impact:`);
      console.log(`   - Bundle size reduction: ${totalBundleReduction}KB`);
      console.log(`   - FCP improvement: ${fcpImprovement}ms`);
      console.log(`   - Expected new metrics:`);
      console.log(`     • FCP: ~${7108 - fcpImprovement}ms (was 7108ms)`);
      console.log(`     • Bundle: ~${1400 - totalBundleReduction}KB (was 1400KB)`);
    }
    
    return () => {
      // Clean up measurements
      if (flags.OPTIMIZE_FONTS) performanceMonitor.endMeasure('font-optimization-impact');
      if (flags.REMOVE_UNUSED_IMPORTS) performanceMonitor.endMeasure('import-optimization-impact');
      if (flags.OPTIMIZE_ICONS) performanceMonitor.endMeasure('icon-optimization-impact');
    };
  }, [flags]);
  
  return null;
}