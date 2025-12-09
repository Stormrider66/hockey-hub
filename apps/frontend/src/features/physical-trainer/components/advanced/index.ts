/**
 * Advanced Features Components
 * 
 * High-value components for Phase 6.3 implementation including:
 * - Bulk editing capabilities
 * - Workout comparison views
 * - Performance analytics and predictions
 * - AI-powered suggestions
 * - Enhanced calendar integration
 */

export { BulkEditManager } from './BulkEditManager';
export { WorkoutComparison } from './WorkoutComparison';
export { PerformanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard';
export { EnhancedCalendarIntegration } from './EnhancedCalendarIntegration';

// Re-export types used by advanced components
export type {
  ComparisonData,
  DifferenceItem,
  SimilarityItem,
  ComparisonMetrics,
} from './WorkoutComparison';

export type {
  ScheduleOptions,
  RecurringOptions,
  SchedulePattern,
  DraggedItem,
} from './EnhancedCalendarIntegration';

export type {
  DashboardMetrics,
} from './PerformanceAnalyticsDashboard';