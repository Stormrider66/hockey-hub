/**
 * Physical Trainer Utilities
 * Central export point for all utility functions and constants
 */

// Error handling utilities
export * from './errorFormatting';

// Assignment and validation utilities
export * from './assignmentHelpers';
export * from './workoutValidation';
export * from './validationUtils';

// Workout utilities
export * from './workoutHelpers';

// Medical compliance utilities
export * from './medicalCompliance';

// Data management utilities
export * from './dataExportImport';
export * from './dataMigration';
export * from './migrationTestUtils';

// Metadata utilities
export * from './metadata';
export * from './metadataUtils';
export * from './metadataIntegration';
export * from './metadataMigration';
export * from './metadataExamples';

// Smart defaults and preferences
export * from './smartDefaultsPreferences';

// Offline support
export * from './offlineQueueManager';

// Mock utilities (for development)
export * from './mockWebSocketEvents';

// Form optimization utilities
export * from './formOptimization';

// Note: The following should be imported directly from their respective locations
// to avoid circular dependencies:
// - Error messages from '../constants/errorMessages'
// - useErrorHandler hook from '../hooks/useErrorHandler'
// - ErrorDisplay component from '../components/common/ErrorDisplay'