// Workout Builder Shared Components
export { WorkoutTypeSelector } from './WorkoutTypeSelector';
export { WorkoutBuilderHeader } from './WorkoutBuilderHeader';
export { PlayerTeamAssignment } from './PlayerTeamAssignment';
export { BulkConfigurationPanel } from './BulkConfigurationPanel';
export { BulkSessionIntegrationExample } from './BulkSessionIntegrationExample';
export { BulkModeDemo } from './BulkModeDemo';
export { default as WorkoutPreview } from '../WorkoutPreview';
export { default as WorkoutScheduler } from './WorkoutScheduler';
export { WorkoutSuccessModal } from './WorkoutSuccessModal';
export { default as WorkoutBuilderErrorBoundary, useErrorBoundary, withWorkoutErrorBoundary } from './WorkoutBuilderErrorBoundary';
export { UnifiedScheduler } from './UnifiedScheduler';
export type { UnifiedSchedule, RecurrenceConfig, ReminderConfig, UnifiedSchedulerProps } from './UnifiedScheduler';

// Unified Builder Layout Components
export { WorkoutBuilderLayout, WorkoutTabContent } from './WorkoutBuilderLayout';
export { ExerciseLibrarySidebar } from './ExerciseLibrarySidebar';
export { UnifiedWorkoutBuilderExample } from './UnifiedWorkoutBuilderExample';

// Phase 6.2 Smart Defaults Components
export { SmartDefaultsIndicator } from './SmartDefaultsIndicator';

// Phase 6.1 Quick Actions Components
export { RecentWorkoutsWidget } from './RecentWorkoutsWidget';
export { QuickActionButton } from './QuickActionButton';
export { KeyboardShortcuts, defaultWorkoutShortcuts, useWorkoutKeyboardShortcuts } from './KeyboardShortcuts';

// Global Features Components
export { HelpModal } from './HelpModal';
export { SettingsModal } from './SettingsModal';
export { FloatingActionMenu } from './FloatingActionMenu';
export { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

// Template Components
export { WorkoutTemplateLibrary } from './WorkoutTemplateLibrary';
export { TemplateCategoryManager } from './TemplateCategoryManager';
export { CategorySelector } from './CategorySelector';
export { CategoryBadge, CategoryBadgeGroup, CategoryIndicator } from './CategoryBadge';
export { CategoryFilter } from './CategoryFilter';
export { WorkoutTemplatesList } from './WorkoutTemplatesList';
export { WorkoutTemplateCard } from './WorkoutTemplateCard';

// Re-export types for convenience
export type {
  TemplateCategory,
  CategoryHierarchy,
  CategoryType,
  CategoryStats,
  TemplateMetadata,
  WorkoutTemplate,
  TemplateSearchOptions,
  CategoryFormData,
  CategoryAssignment,
  CategoryFilter as CategoryFilterType,
  CategoryExport,
  TemplateExport,
  BulkCategoryOperation
} from '../../types/template.types';