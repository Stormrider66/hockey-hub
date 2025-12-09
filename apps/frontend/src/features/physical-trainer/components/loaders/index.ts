// Lazy loaders for code splitting and performance optimization
export { LazyMedicalAnalyticsLoader } from './LazyMedicalAnalyticsLoader';
export type { MedicalAnalyticsType } from './LazyMedicalAnalyticsLoader';

export { LazyReportingLoader } from './LazyReportingLoader';
export type { ReportingComponentType } from './LazyReportingLoader';

export { LazyAnalyticsLoader } from './LazyAnalyticsLoader';
export type { AnalyticsComponentType } from './LazyAnalyticsLoader';

export { LazyPredictiveAnalyticsLoader } from './LazyPredictiveAnalyticsLoader';
export type { PredictiveAnalyticsType } from './LazyPredictiveAnalyticsLoader';

export { LoaderErrorBoundary } from './LoaderErrorBoundary';
export { PerformanceMonitor, useComponentPerformance } from './PerformanceMonitor';
export { 
  preloadMedicalAnalytics, 
  preloadReporting,
  preloadAnalytics,
  preloadPredictiveAnalytics,
  preloadAllMedicalAnalytics, 
  preloadAllReporting,
  preloadAllAnalytics,
  preloadAllPredictiveAnalytics,
  preloadOnInteraction 
} from './preloadUtils';

// Re-export existing loaders if they're in this directory
export { LazyModalLoader } from '../modals/LazyModalLoader';
export type { ModalType } from '../modals/LazyModalLoader';

export { LazyWorkoutBuilderLoader } from '../builders/LazyWorkoutBuilderLoader';
export type { WorkoutBuilderType } from '../builders/LazyWorkoutBuilderLoader';

export { LazyTabLoader } from '../tabs/LazyTabLoader';
export type { TabType } from '../tabs/LazyTabLoader';