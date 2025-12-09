# Metadata Standardization Migration Guide

This guide explains how to migrate existing workout data to use the new standardized metadata system and how to update components to work with the unified metadata structure.

## 📋 Overview

The metadata standardization provides:
- ✅ Consistent metadata structure across all workout types
- ✅ Unified search, filtering, and sorting capabilities
- ✅ Automated migration utilities for existing data
- ✅ Enhanced analytics and reporting features
- ✅ Type-safe validation and sanitization

## 🗂️ File Structure

```
src/features/physical-trainer/
├── types/
│   └── metadata-standard.types.ts    # Core metadata type definitions
├── utils/
│   ├── metadataUtils.ts              # Core metadata operations
│   ├── metadataMigration.ts          # Legacy data migration utilities
│   ├── metadataIntegration.ts        # Integration and search utilities
│   ├── metadata.ts                   # Main export file
│   └── metadataExamples.ts           # Usage examples and patterns
└── docs/
    └── METADATA-MIGRATION-GUIDE.md   # This file
```

## 🚀 Quick Start

### 1. Import the Metadata System

```typescript
// Import everything you need
import { metadata } from '../utils/metadata';
import { StandardMetadata, MetadataFilters } from '../types/metadata-standard.types';
import { WorkoutSession } from '../types';
```

### 2. Create New Workouts with Metadata

```typescript
// Generate standardized metadata
const workoutMetadata = metadata.generate(
  {
    name: 'Upper Body Strength',
    category: 'strength',
    difficulty: WorkoutDifficulty.INTERMEDIATE,
    estimatedDuration: 60,
    focus: [FocusArea.STRENGTH, FocusArea.UPPER_BODY],
    equipment: ['barbell', 'dumbbells']
  },
  userId,
  organizationId
);

// Create workout with metadata
const workout: WorkoutSession = {
  // ... existing workout fields ...
  metadata: workoutMetadata
};
```

### 3. Migrate Existing Data

```typescript
// Migrate legacy workouts
const migrationResult = metadata.migration.all(legacyWorkouts, {
  preserveOriginalIds: true,
  validateAfterMigration: true,
  addMigrationTags: true,
  defaultOrganizationId: 'your-org-id',
  defaultCreatedBy: 'system'
});

console.log(metadata.migration.report(migrationResult));
```

## 📊 Core Metadata Structure

### Standard Metadata Fields

```typescript
interface StandardMetadata {
  // Core Identity
  id: string;
  name: string;
  description?: string;
  tags: string[];
  version: number;

  // Classification
  category: string;                    // 'strength', 'conditioning', 'hybrid', 'agility'
  difficulty: WorkoutDifficulty;      // BEGINNER, INTERMEDIATE, ADVANCED, ELITE
  level: SkillLevel;                  // NOVICE, DEVELOPING, PROFICIENT, EXPERT, MASTER
  focus: FocusArea[];                 // STRENGTH, POWER, ENDURANCE, AGILITY, etc.
  season?: Season;                    // PRE_SEASON, IN_SEASON, POST_SEASON, OFF_SEASON

  // Performance Metrics
  estimatedDuration: number;          // in minutes
  actualDuration?: number;
  intensityScore: number;             // 1-10
  complexityScore: number;            // 1-10
  fatigueRating?: number;             // 1-10

  // Equipment & Resources
  equipment: string[];
  space: string;                      // 'gym', 'field', 'ice', 'home'
  groupSize?: { min: number; max: number; optimal: number };

  // Usage & Analytics
  usageCount: number;
  popularityScore: number;            // 0-100
  averageRating?: number;             // 1-5
  completionRate?: number;            // 0-100%
  lastUsed?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;

  // Ownership & Permissions
  createdBy: string;
  updatedBy?: string;
  organizationId: string;
  teamId?: string;
  visibility: VisibilityLevel;        // PRIVATE, TEAM, ORGANIZATION, PUBLIC

  // Status & Workflow
  status: WorkoutStatus;              // DRAFT, ACTIVE, ARCHIVED, SCHEDULED, etc.
  isTemplate: boolean;
}
```

## 🔄 Migration Strategies

### Strategy 1: Automatic Migration

Use the auto-detection migration for mixed workout types:

```typescript
const result = metadata.migration.all(allWorkouts, {
  preserveOriginalIds: true,
  validateAfterMigration: true,
  skipInvalid: false,
  addMigrationTags: true,
  defaultOrganizationId: 'hockey-club-123',
  defaultCreatedBy: 'migration-system'
});
```

### Strategy 2: Type-Specific Migration

Migrate specific workout types separately:

```typescript
// Migrate strength workouts
const strengthResult = metadata.migration.strength(strengthWorkouts, options);

// Migrate conditioning workouts
const conditioningResult = metadata.migration.conditioning(conditioningWorkouts, options);

// Migrate hybrid workouts
const hybridResult = metadata.migration.hybrid(hybridWorkouts, options);

// Migrate agility workouts
const agilityResult = metadata.migration.agility(agilityWorkouts, options);
```

### Strategy 3: Manual Migration

For custom or complex legacy data:

```typescript
const migratedWorkout = metadata.normalize(legacyWorkout, 'strength');
const validation = metadata.validate(migratedWorkout);

if (!validation.isValid) {
  // Handle validation errors
  console.error('Migration failed:', validation.errors);
}
```

## 🔍 Search and Filtering

### Basic Search

```typescript
// Convert workouts to unified format
const unifiedWorkouts = workouts.map(w => 
  metadata.integration.unify.session(w, { generateMetadataIfMissing: true })
);

// Create searchable index
const searchableWorkouts = metadata.integration.search.create(unifiedWorkouts);

// Search by term
const results = metadata.integration.search.query(searchableWorkouts, 'strength power');
```

### Advanced Filtering

```typescript
const filters: MetadataFilters = {
  categories: ['strength', 'conditioning'],
  difficulties: [WorkoutDifficulty.INTERMEDIATE, WorkoutDifficulty.ADVANCED],
  focusAreas: [FocusArea.STRENGTH, FocusArea.POWER],
  minDuration: 30,
  maxDuration: 90,
  equipment: ['barbell'],
  tags: ['competition-prep'],
  status: [WorkoutStatus.ACTIVE],
  searchTerm: 'upper body'
};

const sortOptions: MetadataSortOptions = {
  field: 'popularityScore',
  direction: 'desc'
};

const collection = metadata.integration.filter(unifiedWorkouts, filters, sortOptions);
```

## 📈 Analytics and Insights

### Generate Analytics

```typescript
const analytics = metadata.integration.analyze(unifiedWorkouts);

console.log('Workout Analytics:');
console.log(`Average Duration: ${analytics.averageDuration} minutes`);
console.log(`Average Intensity: ${analytics.averageIntensity}/10`);
console.log('Popular Focus Areas:', analytics.popularFocusAreas);
console.log('Usage Trends:', analytics.usageTrends);
```

### Get Recommendations

```typescript
const recommendations = metadata.integration.recommend(
  targetWorkout,
  availableWorkouts,
  5 // limit
);

recommendations.forEach(rec => {
  const similarity = metadata.integration.similarity(
    targetWorkout.metadata,
    rec.metadata
  );
  console.log(`${rec.metadata.name} (${(similarity * 100).toFixed(1)}% similar)`);
});
```

## 🛠️ Component Updates

### Update Workout Builders

```typescript
// Before
const handleSave = (workoutData: any) => {
  const workout = {
    ...workoutData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  saveWorkout(workout);
};

// After
const handleSave = (workoutData: any) => {
  const workoutMetadata = metadata.generate(
    {
      name: workoutData.title,
      category: workoutData.type,
      estimatedDuration: workoutData.duration,
      // ... other metadata fields
    },
    currentUser.id,
    currentUser.organizationId
  );

  const workout: WorkoutSession = {
    ...workoutData,
    metadata: workoutMetadata
  };
  
  saveWorkout(workout);
};
```

### Update Search Components

```typescript
// Search component with metadata
const WorkoutSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MetadataFilters>({});
  const { workouts } = useWorkouts();

  const searchResults = useMemo(() => {
    const unified = workouts.map(w => metadata.integration.unify.session(w));
    const searchable = metadata.integration.search.create(unified);
    
    let results = searchable;
    
    if (searchTerm) {
      results = metadata.integration.search.query(results, searchTerm);
    }
    
    if (Object.keys(filters).length > 0) {
      const collection = metadata.integration.filter(unified, filters, sortOptions);
      results = collection.workouts.map(w => ({
        id: w.metadata.id,
        type: w.metadata.category,
        searchIndex: [],
        metadata: w.metadata,
        data: w.session
      }));
    }
    
    return results;
  }, [workouts, searchTerm, filters]);

  // ... rest of component
};
```

## ✅ Validation and Quality

### Validate Metadata

```typescript
const validation = metadata.validate(workoutMetadata);

if (!validation.isValid) {
  console.error('Validation errors:');
  validation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message} (${error.code})`);
  });
}

if (validation.warnings.length > 0) {
  console.warn('Validation warnings:');
  validation.warnings.forEach(warning => {
    console.warn(`- ${warning.field}: ${warning.message}`);
  });
}
```

### Sanitize Data

```typescript
// Sanitize before validation
const sanitized = metadata.sanitize({
  name: '  Upper Body Workout  ', // Will be trimmed
  tags: ['  STRENGTH  ', 'power', 'strength'], // Will be cleaned and deduplicated
  intensityScore: 15, // Will be clamped to 10
  estimatedDuration: -5 // Will be clamped to minimum
});

const validation = metadata.validate(sanitized);
```

## 🔄 Backward Compatibility

### Supporting Legacy Components

```typescript
// Wrapper function for legacy compatibility
function getLegacyWorkoutData(workout: WorkoutSession): LegacyWorkout {
  return {
    id: workout.id,
    title: workout.metadata.name,
    description: workout.metadata.description,
    type: workout.metadata.category,
    duration: workout.metadata.estimatedDuration,
    difficulty: workout.metadata.difficulty,
    tags: workout.metadata.tags,
    equipment: workout.metadata.equipment,
    // ... map other fields as needed
  };
}

// Use in legacy components
const legacyData = getLegacyWorkoutData(standardWorkout);
```

## 📚 Best Practices

### 1. Always Generate Metadata for New Workouts

```typescript
// ✅ Good
const metadata = metadata.generate(partialData, userId, orgId);
const workout = { ...workoutData, metadata };

// ❌ Avoid
const workout = { ...workoutData }; // Missing metadata
```

### 2. Validate Before Saving

```typescript
// ✅ Good
const validation = metadata.validate(workout.metadata);
if (validation.isValid) {
  await saveWorkout(workout);
} else {
  handleValidationErrors(validation.errors);
}

// ❌ Avoid
await saveWorkout(workout); // No validation
```

### 3. Use Unified Format for Operations

```typescript
// ✅ Good
const unified = metadata.integration.unify.session(workout);
const results = performOperation(unified);

// ❌ Avoid
const results = performOperation(workout); // Direct manipulation
```

### 4. Handle Migration Errors Gracefully

```typescript
// ✅ Good
const result = metadata.migration.all(legacyWorkouts, options);
if (!result.success) {
  console.error('Migration issues:', result.errors);
  // Handle failed migrations
}

// ❌ Avoid
const result = metadata.migration.all(legacyWorkouts, options);
// Ignoring potential errors
```

## 🚨 Common Issues and Solutions

### Issue 1: Missing Metadata on Existing Workouts

**Solution**: Use the unification utility with auto-generation:

```typescript
const unified = metadata.integration.unify.session(workout, {
  generateMetadataIfMissing: true,
  organizationId: 'your-org-id',
  createdBy: 'system'
});
```

### Issue 2: Validation Failures After Migration

**Solution**: Use sanitization before validation:

```typescript
const sanitized = metadata.sanitize(migratedData);
const validation = metadata.validate(sanitized);
```

### Issue 3: Performance Issues with Large Datasets

**Solution**: Use batch processing:

```typescript
const BATCH_SIZE = 100;
const batches = chunkArray(workouts, BATCH_SIZE);

for (const batch of batches) {
  const results = await processBatch(batch);
  // Handle batch results
}
```

## 📊 Migration Checklist

- [ ] **Install Dependencies**: Ensure all metadata utilities are imported
- [ ] **Update Type Definitions**: Add StandardMetadata to WorkoutSession and SessionTemplate
- [ ] **Migrate Existing Data**: Run migration utilities on legacy data
- [ ] **Update Components**: Modify workout builders and viewers to use metadata
- [ ] **Update Search/Filter Logic**: Implement unified search and filtering
- [ ] **Add Validation**: Include metadata validation in save workflows
- [ ] **Update API Endpoints**: Ensure backend supports metadata fields
- [ ] **Test Backward Compatibility**: Verify legacy components still work
- [ ] **Update Documentation**: Document new metadata usage patterns
- [ ] **Performance Testing**: Verify search and filter performance with large datasets

## 🔗 Additional Resources

- **API Documentation**: See backend metadata schema documentation
- **Component Examples**: Check `metadataExamples.ts` for implementation patterns
- **Type Definitions**: Review `metadata-standard.types.ts` for complete type information
- **Migration Utilities**: Use `metadataMigration.ts` for complex migration scenarios

---

For questions or issues with the migration, please refer to the examples in `metadataExamples.ts` or consult the team lead.