/**
 * Metadata System - Main Export File
 * 
 * Provides a unified interface for all metadata-related functionality
 * across the Physical Trainer workout system.
 */

// Core types
export * from '../types/metadata-standard.types';

// Utilities
export * from './metadataUtils';
export * from './metadataMigration';
export * from './metadataIntegration';

// Re-export commonly used classes and functions
export { MetadataUtils } from './metadataUtils';
export { MetadataMigrationUtils } from './metadataMigration';
export { MetadataIntegration } from './metadataIntegration';

// Convenience re-exports for easy access
import { metadataOperations } from './metadataUtils';
import { MetadataMigrationUtils, MIGRATION_PRESETS } from './metadataMigration';
import { metadataIntegration } from './metadataIntegration';

export const metadata = {
  // Core operations
  ...metadataOperations,
  
  // Migration utilities
  migration: {
    strength: MetadataMigrationUtils.migrateStrengthWorkouts,
    conditioning: MetadataMigrationUtils.migrateConditioningWorkouts,
    hybrid: MetadataMigrationUtils.migrateHybridWorkouts,
    agility: MetadataMigrationUtils.migrateAgilityWorkouts,
    all: MetadataMigrationUtils.migrateAllWorkouts,
    report: MetadataMigrationUtils.generateMigrationReport,
    backup: MetadataMigrationUtils.createMigrationBackup,
    restore: MetadataMigrationUtils.restoreFromBackup,
    verify: MetadataMigrationUtils.verifyMigration,
    presets: MIGRATION_PRESETS
  },
  
  // Integration utilities
  integration: metadataIntegration,
  
  // Quick access to common functions
  generate: metadataOperations.create,
  validate: metadataOperations.validate,
  normalize: metadataOperations.normalize,
  filter: metadataOperations.filter,
  sort: metadataOperations.sort,
  search: metadataIntegration.search.query,
  analyze: metadataIntegration.analyze,
  recommend: metadataIntegration.recommend
};

// Default export for convenience
export default metadata;