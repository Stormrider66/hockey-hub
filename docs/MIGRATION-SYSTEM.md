# Data Migration System for Physical Trainer

## Overview

The Physical Trainer dashboard includes a comprehensive data migration system that safely converts existing workout data from legacy formats to the new unified format. This system supports all workout types (Strength, Conditioning, Hybrid, Agility) with robust validation, progress tracking, and rollback capabilities.

## Features

### Core Migration Capabilities
- **Multi-format Support**: Migrates Strength, Conditioning, Hybrid, and Agility workouts
- **Data Validation**: Pre-migration validation to catch issues early
- **Batch Processing**: Configurable batch sizes for optimal performance
- **Progress Tracking**: Real-time progress reporting with ETA
- **Error Handling**: Graceful error handling with detailed reporting
- **Rollback Support**: Safe rollback to previous format if needed

### User Interface Components
- **Migration Dashboard**: Central control panel for all migration operations
- **Analysis Modal**: Detailed analysis of data before migration
- **Progress Modal**: Real-time migration progress with statistics
- **Settings Modal**: Configurable migration options with presets
- **Rollback Modal**: Safe rollback interface with impact analysis

### Safety Features
- **Dry Run Mode**: Test migrations without making changes
- **Data Preservation**: Optional backup of original data
- **Validation Checks**: Comprehensive data integrity validation
- **Conflict Detection**: Automatic detection of data conflicts
- **Recovery Options**: Multiple recovery and rollback options

## Migration Types Supported

### 1. Strength Workouts (SessionTemplate → UnifiedWorkoutSession)
```typescript
// Legacy Format
interface SessionTemplate {
  exercises: WorkoutExercise[];
  warmupDuration?: number;
  cooldownDuration?: number;
  restBetweenExercises?: number;
}

// Unified Format
interface UnifiedWorkoutSession {
  type: 'strength';
  content: {
    blocks: ExerciseBlock[];
    warmup?: WarmupCooldown;
    cooldown?: WarmupCooldown;
  };
}
```

### 2. Conditioning Workouts (IntervalProgram → UnifiedWorkoutSession)
```typescript
// Legacy Format
interface IntervalProgram {
  intervals: Interval[];
  equipment: Equipment;
  totalDuration: number;
}

// Unified Format
interface UnifiedWorkoutSession {
  type: 'conditioning';
  content: {
    blocks: (IntervalBlock | RestBlock)[];
    intervalSettings: IntervalSettings;
  };
}
```

### 3. Hybrid Workouts (HybridWorkout → UnifiedWorkoutSession)
```typescript
// Legacy Format
interface HybridWorkout {
  blocks: HybridBlock[];
  transitionTime?: number;
}

// Unified Format
interface UnifiedWorkoutSession {
  type: 'hybrid';
  content: {
    blocks: WorkoutBlock[];
    transitionTime?: number;
  };
}
```

### 4. Agility Workouts (AgilityWorkout → UnifiedWorkoutSession)
```typescript
// Legacy Format
interface AgilityWorkout {
  phases: AgilityPhase[];
  focusAreas: string[];
}

// Unified Format
interface UnifiedWorkoutSession {
  type: 'agility';
  content: {
    blocks: WorkoutBlock[];
    focusAreas: string[];
  };
}
```

## Usage Guide

### Accessing the Migration System

1. Navigate to the Physical Trainer Dashboard
2. Click the "Data Migration" button in the top-right corner
3. The Migration Dashboard will open with your workout data loaded

### Migration Process

#### Step 1: Data Analysis
- Automatic analysis of workout data on load
- Format detection and validation
- Issue identification and reporting
- Migration recommendations

#### Step 2: Configuration
- Choose migration settings (batch size, validation, etc.)
- Select safety options (preserve original, stop on error)
- Use presets or custom configuration

#### Step 3: Migration Execution
- Real-time progress tracking
- Batch-by-batch processing
- Error and warning reporting
- Performance metrics

#### Step 4: Results Review
- Success/failure statistics
- Detailed error reports
- Export capabilities
- Rollback options if needed

### Migration Settings

#### Batch Processing
```typescript
interface BatchMigrationOptions {
  batchSize: number;              // 10-200 (default: 50)
  validateBeforeMigration: boolean; // Recommended: true
  stopOnError: boolean;           // false for large datasets
  preserveOriginal: boolean;      // Recommended: true
  dryRun: boolean;               // Test mode
}
```

#### Presets
- **Safe & Careful**: Small batches, validation, stop on errors
- **Recommended**: Balanced speed and safety (default)
- **Fast & Risky**: Large batches, minimal validation

### Rollback Capabilities

If migration results are unsatisfactory, the system supports rollback:

1. **Target Format Selection**: Choose which legacy format to convert back to
2. **Impact Analysis**: Preview data loss and conversion issues
3. **Confirmation**: Explicit confirmation required
4. **Progress Tracking**: Real-time rollback progress

## Technical Implementation

### Core Files Structure
```
src/features/physical-trainer/
├── utils/
│   ├── dataMigration.ts          # Core migration logic
│   └── migrationTestUtils.ts     # Testing utilities
├── hooks/
│   └── useMigration.ts           # Migration state management
└── components/migration/
    ├── MigrationDashboard.tsx    # Main dashboard
    ├── MigrationProgressModal.tsx # Progress tracking
    ├── MigrationAnalysisModal.tsx # Data analysis
    ├── MigrationSettingsModal.tsx # Configuration
    ├── RollbackModal.tsx         # Rollback interface
    └── index.ts                  # Component exports
```

### Migration Functions

#### Format Detection
```typescript
function detectWorkoutFormat(data: any): 
  'strength' | 'conditioning' | 'hybrid' | 'agility' | 'unified' | 'unknown'
```

#### Migration Functions
```typescript
function migrateStrengthWorkout(template: SessionTemplate): MigrationResult<UnifiedWorkoutSession>
function migrateConditioningWorkout(program: IntervalProgram): MigrationResult<UnifiedWorkoutSession>
function migrateHybridWorkout(workout: HybridWorkout): MigrationResult<UnifiedWorkoutSession>
function migrateAgilityWorkout(workout: AgilityWorkout): MigrationResult<UnifiedWorkoutSession>
```

#### Batch Processing
```typescript
async function batchMigrateWorkouts(
  workouts: any[],
  options: BatchMigrationOptions,
  onProgress?: (progress: BatchMigrationProgress) => void
): Promise<BatchMigrationResult>
```

### State Management

The `useMigration` hook provides comprehensive state management:

```typescript
const {
  state,           // Migration state and progress
  analysis,        // Data analysis results
  rollbackState,   // Rollback state
  analyzeData,     // Analyze workout data
  startMigration,  // Start migration process
  rollback,        // Rollback functionality
  exportResults    // Export migration results
} = useMigration();
```

### Error Handling

#### Migration Errors
```typescript
interface MigrationError {
  field: string;
  message: string;
  originalValue?: any;
  code: string;
}
```

#### Error Categories
- **VALIDATION_ERROR**: Data validation failures
- **MIGRATION_ERROR**: Migration process errors
- **ROLLBACK_ERROR**: Rollback operation errors
- **UNKNOWN_FORMAT**: Unrecognizable data format

### Performance Considerations

#### Memory Management
- Configurable batch sizes to control memory usage
- Progress tracking to monitor performance
- Memory leak prevention with proper cleanup

#### Processing Speed
- Optimized migration algorithms
- Parallel processing where safe
- Progress estimation with real-time updates

#### Scalability
- Tested with datasets up to 1000+ workouts
- Configurable batch processing
- Background processing capabilities

## Testing

### Test Utilities

The system includes comprehensive testing utilities:

```typescript
// Generate test data
generateTestStrengthWorkout()
generateTestConditioningWorkout()
generateTestHybridWorkout()
generateTestAgilityWorkout()

// Test scenarios
generateTestScenarios()
runValidationTests()
runPerformanceTest()
runMigrationBenchmark()
```

### Test Scenarios
1. **All Valid Data**: Perfect migration scenario
2. **Mixed Valid/Invalid**: Real-world data quality
3. **Malformed Data**: Error handling testing
4. **Large Datasets**: Performance testing
5. **Already Migrated**: Skip detection testing

### Performance Benchmarks
- Throughput testing (workouts per second)
- Memory usage monitoring
- Error rate tracking
- Recovery testing

## Best Practices

### Before Migration
1. **Backup Data**: Always preserve original data
2. **Analyze First**: Review analysis report thoroughly
3. **Test with Subset**: Use dry run mode first
4. **Check Resources**: Ensure adequate memory/storage

### During Migration
1. **Monitor Progress**: Watch for errors and warnings
2. **Don't Interrupt**: Let batches complete fully
3. **Check Performance**: Monitor system resources
4. **Document Issues**: Note any unexpected behavior

### After Migration
1. **Validate Results**: Check migrated data quality
2. **Test Functionality**: Verify migrated workouts work
3. **Keep Backups**: Retain original data temporarily
4. **Document Process**: Record any issues or learnings

### Recovery Procedures
1. **Partial Failure**: Use rollback for affected workouts
2. **Complete Failure**: Restore from backup and retry
3. **Data Corruption**: Validate and re-migrate affected data
4. **Performance Issues**: Adjust batch size and retry

## API Integration

### Migration Endpoints (Planned)
```typescript
POST /api/migration/analyze      // Analyze workout data
POST /api/migration/start        // Start migration process
GET  /api/migration/status       // Check migration status
POST /api/migration/rollback     // Rollback migration
GET  /api/migration/results      // Get migration results
```

### WebSocket Events (Planned)
```typescript
migration:progress    // Real-time progress updates
migration:complete    // Migration completion
migration:error       // Error notifications
migration:warning     // Warning notifications
```

## Security Considerations

### Data Protection
- All operations logged for audit trail
- Original data preserved during migration
- Secure handling of sensitive workout data
- Permission-based access to migration tools

### Validation
- Comprehensive input validation
- SQL injection prevention
- XSS protection in UI components
- Safe data serialization/deserialization

## Future Enhancements

### Planned Features
1. **Scheduled Migrations**: Background migration processing
2. **Advanced Analytics**: Migration success metrics and trends
3. **Bulk Operations**: Multi-tenant migration support
4. **API Integration**: RESTful migration endpoints
5. **Real-time Sync**: Live migration with minimal downtime

### Performance Improvements
1. **Worker Threads**: Parallel processing capabilities
2. **Streaming**: Large dataset streaming migration
3. **Caching**: Intelligent caching for repeated operations
4. **Compression**: Data compression for storage efficiency

## Troubleshooting

### Common Issues

#### Migration Fails to Start
- Check data format and structure
- Verify sufficient memory available
- Ensure network connectivity if using API

#### High Memory Usage
- Reduce batch size in settings
- Close other applications
- Consider migrating in smaller chunks

#### Validation Errors
- Review data structure requirements
- Check for missing required fields
- Validate data types and formats

#### Performance Issues
- Increase batch size for faster processing
- Reduce concurrent operations
- Monitor system resources

### Support Information

For technical support or questions about the migration system:
- Check the troubleshooting guide above
- Review the error codes and messages
- Export migration results for analysis
- Contact the development team with specific error details

---

*This migration system is designed to be robust, safe, and user-friendly while handling the complexity of converting between different workout data formats. Always test with a small subset of data before running full migrations.*