/**
 * Metadata System Usage Examples
 * 
 * Comprehensive examples showing how to use the standardized metadata system
 * across different workout types and scenarios.
 */

import {
  StandardMetadata,
  WorkoutDifficulty,
  SkillLevel,
  FocusArea,
  VisibilityLevel,
  WorkoutStatus,
  Season,
  MetadataFilters,
  MetadataSortOptions
} from '../types/metadata-standard.types';
import { metadata } from './metadata';
import { WorkoutSession, SessionTemplate } from '../types/index';

// ===== EXAMPLE 1: Creating New Workout with Metadata =====

export function createStrengthWorkoutExample(): WorkoutSession {
  // Generate standardized metadata
  const workoutMetadata = metadata.generate(
    {
      name: 'Upper Body Power Development',
      description: 'Explosive upper body workout focusing on power and speed',
      category: 'strength',
      difficulty: WorkoutDifficulty.ADVANCED,
      level: SkillLevel.PROFICIENT,
      focus: [FocusArea.STRENGTH, FocusArea.POWER, FocusArea.UPPER_BODY],
      estimatedDuration: 75,
      intensityScore: 8,
      complexityScore: 6,
      equipment: ['barbell', 'dumbbells', 'medicine ball', 'resistance bands'],
      space: 'gym',
      tags: ['power', 'explosive', 'competition-prep'],
      season: Season.PRE_SEASON,
      visibility: VisibilityLevel.TEAM
    },
    'trainer_001', // createdBy
    'hockey_club_123' // organizationId
  );

  // Create workout session with metadata
  const workoutSession: WorkoutSession = {
    id: workoutMetadata.id,
    title: workoutMetadata.name,
    description: workoutMetadata.description,
    type: 'strength',
    scheduledDate: '2025-01-15T10:00:00Z',
    location: 'Main Gym',
    teamId: 'team_seniors',
    playerIds: ['player_001', 'player_002', 'player_003'],
    status: 'scheduled',
    intensity: 'high',
    exercises: [
      {
        id: 'ex_001',
        name: 'Explosive Push-ups',
        category: 'strength',
        sets: 4,
        reps: 8,
        orderIndex: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ex_002',
        name: 'Medicine Ball Slam',
        category: 'strength',
        sets: 3,
        reps: 10,
        orderIndex: 2,
        equipment: ['medicine ball'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    metadata: workoutMetadata,
    createdAt: workoutMetadata.createdAt,
    updatedAt: workoutMetadata.updatedAt,
    createdBy: workoutMetadata.createdBy
  };

  return workoutSession;
}

// ===== EXAMPLE 2: Creating Conditioning Workout Template =====

export function createConditioningTemplateExample(): SessionTemplate {
  const templateMetadata = metadata.generate(
    {
      name: 'HIIT Endurance Builder',
      description: 'High-intensity interval training for cardiovascular endurance',
      category: 'conditioning',
      difficulty: WorkoutDifficulty.INTERMEDIATE,
      level: SkillLevel.DEVELOPING,
      focus: [FocusArea.ENDURANCE, FocusArea.SPEED, FocusArea.FULL_BODY],
      estimatedDuration: 45,
      intensityScore: 9,
      complexityScore: 4,
      equipment: ['stationary bike', 'heart rate monitor'],
      space: 'cardio room',
      tags: ['hiit', 'endurance', 'heart-rate-zones'],
      isTemplate: true,
      visibility: VisibilityLevel.ORGANIZATION
    },
    'trainer_002',
    'hockey_club_123'
  );

  const template: SessionTemplate = {
    id: templateMetadata.id,
    name: templateMetadata.name,
    description: templateMetadata.description,
    type: 'conditioning',
    exercises: [], // Conditioning workouts use interval programs instead
    targetPlayers: 'all',
    metadata: templateMetadata,
    intervalProgram: {
      warmup: { duration: 300, intensity: 3 }, // 5 min warmup
      intervals: [
        { duration: 120, intensity: 8, rest: 60 }, // 2 min work, 1 min rest
        { duration: 120, intensity: 8, rest: 60 },
        { duration: 120, intensity: 8, rest: 60 },
        { duration: 120, intensity: 8, rest: 60 }
      ],
      cooldown: { duration: 300, intensity: 2 } // 5 min cooldown
    },
    createdAt: templateMetadata.createdAt,
    updatedAt: templateMetadata.updatedAt,
    createdBy: templateMetadata.createdBy
  };

  return template;
}

// ===== EXAMPLE 3: Migrating Legacy Workouts =====

export function migrateLegacyWorkoutsExample() {
  // Simulate legacy workout data
  const legacyWorkouts = [
    {
      id: 'old_workout_001',
      name: 'Basic Strength',
      difficulty: 'medium',
      duration: 60,
      exercises: [/* ... */],
      createdBy: 'old_trainer',
      created: '2024-01-01T00:00:00Z',
      tags: ['strength', 'basic']
    },
    {
      id: 'old_workout_002',
      title: 'Cardio Session', // Note: different field name
      intensity: 7,
      estimatedTime: 45, // Note: different field name
      intervals: [/* ... */],
      authorId: 'trainer_003', // Note: different field name
      labels: ['cardio', 'endurance'] // Note: different field name
    }
  ];

  // Migrate using auto-detection
  const migrationResult = metadata.migration.all(legacyWorkouts, {
    preserveOriginalIds: true,
    validateAfterMigration: true,
    skipInvalid: false,
    addMigrationTags: true,
    defaultOrganizationId: 'hockey_club_123',
    defaultCreatedBy: 'system'
  });

  console.log('Migration Report:');
  console.log(metadata.migration.report(migrationResult));

  return migrationResult.migratedWorkouts;
}

// ===== EXAMPLE 4: Searching and Filtering Workouts =====

export function searchAndFilterExample(workouts: WorkoutSession[]) {
  // Convert to unified format
  const unifiedWorkouts = workouts.map(workout => 
    metadata.integration.unify.session(workout, {
      generateMetadataIfMissing: true,
      organizationId: 'hockey_club_123',
      createdBy: 'system'
    })
  );

  // Create searchable index
  const searchableWorkouts = metadata.integration.search.create(unifiedWorkouts);

  // Example search
  const strengthWorkouts = metadata.integration.search.query(
    searchableWorkouts,
    'strength power'
  );

  // Example filtering
  const filters: MetadataFilters = {
    categories: ['strength', 'conditioning'],
    difficulties: [WorkoutDifficulty.INTERMEDIATE, WorkoutDifficulty.ADVANCED],
    focusAreas: [FocusArea.UPPER_BODY, FocusArea.POWER],
    minDuration: 30,
    maxDuration: 90,
    equipment: ['barbell'],
    status: [WorkoutStatus.ACTIVE, WorkoutStatus.SCHEDULED]
  };

  const sortOptions: MetadataSortOptions = {
    field: 'popularityScore',
    direction: 'desc'
  };

  const filteredCollection = metadata.integration.filter(
    unifiedWorkouts,
    filters,
    sortOptions
  );

  console.log(`Found ${filteredCollection.filteredCount} workouts out of ${filteredCollection.totalCount}`);
  console.log('Analytics:', filteredCollection.analytics);

  return filteredCollection;
}

// ===== EXAMPLE 5: Workout Recommendations =====

export function generateRecommendationsExample(
  targetWorkout: WorkoutSession,
  availableWorkouts: WorkoutSession[]
) {
  // Unify workouts
  const target = metadata.integration.unify.session(targetWorkout);
  const available = availableWorkouts.map(w => 
    metadata.integration.unify.session(w)
  );

  // Generate recommendations
  const recommendations = metadata.integration.recommend(
    target,
    available,
    5 // limit to 5 recommendations
  );

  console.log(`Generated ${recommendations.length} recommendations for "${target.metadata.name}"`);
  
  recommendations.forEach((rec, index) => {
    const similarity = metadata.integration.similarity(target.metadata, rec.metadata);
    console.log(`${index + 1}. ${rec.metadata.name} (${(similarity * 100).toFixed(1)}% similar)`);
  });

  return recommendations;
}

// ===== EXAMPLE 6: Metadata Validation and Sanitization =====

export function validateAndSanitizeExample() {
  // Example of invalid metadata
  const invalidMetadata = {
    name: '', // Empty name (invalid)
    description: 'A'.repeat(600), // Too long description
    tags: Array(15).fill('tag'), // Too many tags
    estimatedDuration: -5, // Invalid duration
    intensityScore: 15, // Out of range
    equipment: ['  Barbell  ', 'DUMBBELLS', 'barbell'] // Messy data
  };

  console.log('Before sanitization:', invalidMetadata);

  // Sanitize first
  const sanitized = metadata.sanitize(invalidMetadata);
  console.log('After sanitization:', sanitized);

  // Then validate
  const validation = metadata.validate(sanitized);
  console.log('Validation result:', validation);

  if (!validation.isValid) {
    console.log('Errors found:');
    validation.errors.forEach(error => {
      console.log(`- ${error.field}: ${error.message}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log('Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`- ${warning.field}: ${warning.message}`);
    });
  }

  return { sanitized, validation };
}

// ===== EXAMPLE 7: Workout Analytics Dashboard =====

export function generateAnalyticsDashboard(workouts: WorkoutSession[]) {
  // Convert to unified format
  const unifiedWorkouts = workouts.map(workout => 
    metadata.integration.unify.session(workout, {
      generateMetadataIfMissing: true
    })
  );

  // Generate comprehensive analytics
  const analytics = metadata.integration.analyze(unifiedWorkouts);

  // Display analytics
  console.log('=== Workout Analytics Dashboard ===');
  console.log(`Total Workouts: ${analytics.byType}`);
  console.log(`Average Duration: ${analytics.averageDuration} minutes`);
  console.log(`Average Intensity: ${analytics.averageIntensity}/10`);
  
  console.log('\nWorkouts by Type:');
  Object.entries(analytics.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nWorkouts by Difficulty:');
  Object.entries(analytics.byDifficulty).forEach(([difficulty, count]) => {
    console.log(`  ${difficulty}: ${count}`);
  });

  console.log('\nTop Focus Areas:');
  Object.entries(analytics.byFocus)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([focus, count]) => {
      console.log(`  ${focus}: ${count}`);
    });

  console.log('\nPopular Tags:');
  analytics.popularTags.slice(0, 10).forEach(tag => {
    console.log(`  ${tag.tag}: ${tag.count} uses`);
  });

  console.log('\nUsage Trends (last 30 days):');
  analytics.usageTrends.slice(-7).forEach(trend => {
    console.log(`  ${trend.date}: ${trend.count} sessions`);
  });

  return analytics;
}

// ===== EXAMPLE 8: Batch Operations =====

export function batchOperationsExample(workouts: WorkoutSession[]) {
  // Batch validate all workouts
  const validationResults = workouts.map(workout => {
    if (!workout.metadata) return null;
    return {
      workoutId: workout.id,
      validation: metadata.validate(workout.metadata)
    };
  }).filter(Boolean);

  const validWorkouts = validationResults.filter(r => r?.validation.isValid).length;
  const invalidWorkouts = validationResults.filter(r => !r?.validation.isValid).length;

  console.log(`Batch Validation Results: ${validWorkouts} valid, ${invalidWorkouts} invalid`);

  // Batch update tags for specific criteria
  const strengthWorkouts = workouts.filter(w => 
    w.metadata?.category === 'strength'
  );

  const updatedWorkouts = strengthWorkouts.map(workout => {
    const updated = metadata.update(
      workout.metadata,
      {
        tags: [...(workout.metadata.tags || []), 'strength-updated'],
        updatedAt: new Date().toISOString()
      },
      'batch_updater'
    );
    
    return {
      ...workout,
      metadata: updated
    };
  });

  console.log(`Updated ${updatedWorkouts.length} strength workouts with new tags`);

  return { validationResults, updatedWorkouts };
}

// ===== EXAMPLE 9: Integration with Search UI =====

export function searchUIIntegrationExample() {
  // Mock workout data
  const mockWorkouts: WorkoutSession[] = [
    createStrengthWorkoutExample(),
    // ... more workouts would be loaded here
  ];

  // Setup for search UI
  const setupSearchInterface = () => {
    const unifiedWorkouts = mockWorkouts.map(w => 
      metadata.integration.unify.session(w)
    );
    
    const searchableWorkouts = metadata.integration.search.create(unifiedWorkouts);
    
    return {
      // Search function for UI
      search: (term: string) => metadata.integration.search.query(searchableWorkouts, term),
      
      // Filter function for UI
      filter: (filters: MetadataFilters, sort: MetadataSortOptions) => 
        metadata.integration.filter(unifiedWorkouts, filters, sort),
      
      // Get filter options for UI dropdowns
      getFilterOptions: () => ({
        categories: [...new Set(unifiedWorkouts.map(w => w.metadata.category))],
        difficulties: Object.values(WorkoutDifficulty),
        focusAreas: Object.values(FocusArea),
        equipment: [...new Set(unifiedWorkouts.flatMap(w => w.metadata.equipment))],
        tags: [...new Set(unifiedWorkouts.flatMap(w => w.metadata.tags))]
      }),
      
      // Get analytics for dashboard
      getAnalytics: () => metadata.integration.analyze(unifiedWorkouts)
    };
  };

  return setupSearchInterface();
}

// ===== Usage Example Export =====

export const metadataExamples = {
  createWorkout: createStrengthWorkoutExample,
  createTemplate: createConditioningTemplateExample,
  migrateWorkouts: migrateLegacyWorkoutsExample,
  searchAndFilter: searchAndFilterExample,
  getRecommendations: generateRecommendationsExample,
  validateData: validateAndSanitizeExample,
  generateAnalytics: generateAnalyticsDashboard,
  batchOperations: batchOperationsExample,
  setupSearchUI: searchUIIntegrationExample
};

// Quick start guide
export const quickStartGuide = `
METADATA SYSTEM QUICK START GUIDE
=================================

1. CREATING NEW WORKOUTS:
   const metadata = metadata.generate(partialData, createdBy, organizationId);
   const workout = { ...workoutData, metadata };

2. MIGRATING LEGACY DATA:
   const result = metadata.migration.all(legacyWorkouts, options);

3. SEARCHING WORKOUTS:
   const unified = workouts.map(w => metadata.integration.unify.session(w));
   const searchable = metadata.integration.search.create(unified);
   const results = metadata.integration.search.query(searchable, "search term");

4. FILTERING & SORTING:
   const collection = metadata.integration.filter(unified, filters, sortOptions);

5. ANALYTICS:
   const analytics = metadata.integration.analyze(unified);

6. RECOMMENDATIONS:
   const recs = metadata.integration.recommend(target, available, limit);

7. VALIDATION:
   const validation = metadata.validate(workoutMetadata);

For more examples, see the metadataExamples object above.
`;

export default metadataExamples;