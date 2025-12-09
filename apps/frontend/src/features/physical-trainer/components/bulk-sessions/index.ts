/**
 * Bulk Sessions Module
 * 
 * This module provides components for creating multiple workout sessions
 * while safely wrapping existing single-session builders.
 * 
 * Key Features:
 * - Feature flag controlled (NEXT_PUBLIC_ENABLE_BULK_SESSIONS)
 * - Safe wrapper pattern (no modifications to existing components)
 * - Seamless mode switching between single and bulk creation
 * - Preserves all existing functionality and props
 */

// Main components
export { default as BulkSessionWrapper } from './BulkSessionWrapper';
export { default as BulkSessionExample } from './BulkSessionExample';
export { BulkSessionWizard } from './BulkSessionWizard';
export { SessionBundleView } from './SessionBundleView';
export { SessionBundleViewDemo } from './SessionBundleViewDemo';
export { default as BulkSessionApiTest } from './BulkSessionApiTest';
export { default as BulkSessionIntegrationTest } from './IntegrationTest';

// Wizard components
export * from './wizard';

// Bundle view components
export * from './bundle-view';

// Types
export type {
  BulkSessionWrapperProps,
  BulkSessionConfig as LegacyBulkSessionConfig,
  BulkSessionOptions,
  SessionMode,
  SessionBundle,
  BundleSession,
  SessionParticipant,
  ParticipantMetrics,
  BundleMetrics,
  SessionBundleViewProps,
  BulkActionType
} from './bulk-sessions.types';

// New wizard types
export type {
  BulkSessionConfig,
  SessionConfiguration,
  EquipmentAvailability,
  FacilityInfo
} from './BulkSessionWizard';

// Re-export for convenience
export { default as ConditioningBulkWrapper } from './BulkSessionWrapper';