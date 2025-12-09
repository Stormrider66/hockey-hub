'use client';

import React from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import { PerformanceTrendsChart } from './PerformanceTrendsChart';
import { PerformanceTrendsChartOptimized } from './PerformanceTrendsChartOptimized';

export const PerformanceTrendsChartWrapper: React.FC<any> = (props) => {
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');
  
  if (useLightweightCharts) {
    return <PerformanceTrendsChartOptimized {...props} />;
  }
  
  return <PerformanceTrendsChart {...props} />;
};