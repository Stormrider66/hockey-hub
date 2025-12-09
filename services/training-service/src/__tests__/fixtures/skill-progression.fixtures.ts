import { 
  SkillProgressionTracking,
  SkillMeasurement,
  Benchmarks,
  DrillHistory
} from '../../entities/SkillProgressionTracking';

// Valid skill progression tracking data
export const validSkillProgressionData = {
  shootingProgression: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Wrist Shot Accuracy',
    category: 'Shooting',
    measurements: [
      {
        date: new Date('2024-09-01'),
        value: 45,
        unit: 'accuracy %',
        testConditions: 'Stationary shot from slot',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Baseline measurement at start of season',
        videoReference: 'https://example.com/shooting-test-1.mp4'
      },
      {
        date: new Date('2024-09-15'),
        value: 48,
        unit: 'accuracy %',
        testConditions: 'Stationary shot from slot',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Small improvement after two weeks of focused practice'
      },
      {
        date: new Date('2024-10-01'),
        value: 52,
        unit: 'accuracy %',
        testConditions: 'Stationary shot from slot',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Consistent improvement, good technique development'
      },
      {
        date: new Date('2024-10-15'),
        value: 56,
        unit: 'accuracy %',
        testConditions: 'Stationary shot from slot',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Breakthrough - player found proper release point',
        videoReference: 'https://example.com/shooting-test-2.mp4'
      },
      {
        date: new Date('2024-11-01'),
        value: 59,
        unit: 'accuracy %',
        testConditions: 'Stationary shot from slot',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Continued improvement, more consistent technique'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U16',
      elite: 75,
      above_average: 65,
      average: 55,
      below_average: 45
    } as Benchmarks,
    drillHistory: [
      {
        date: new Date('2024-09-03'),
        drillId: 'shooting-drill-001',
        drillName: 'Stationary Shooting Accuracy',
        performance: 45,
        notes: 'Starting point - lots of room for improvement'
      },
      {
        date: new Date('2024-09-10'),
        drillId: 'shooting-drill-002',
        drillName: 'Moving Shot Practice',
        performance: 42,
        notes: 'Harder when moving - need more practice'
      },
      {
        date: new Date('2024-09-17'),
        drillId: 'shooting-drill-001',
        drillName: 'Stationary Shooting Accuracy',
        performance: 50,
        notes: 'Good improvement on stationary shots'
      },
      {
        date: new Date('2024-09-24'),
        drillId: 'shooting-drill-003',
        drillName: 'Quick Release Shooting',
        performance: 38,
        notes: 'New drill - challenging but important skill'
      },
      {
        date: new Date('2024-10-01'),
        drillId: 'shooting-drill-001',
        drillName: 'Stationary Shooting Accuracy',
        performance: 54,
        notes: 'Consistent improvement in accuracy'
      },
      {
        date: new Date('2024-10-08'),
        drillId: 'shooting-drill-002',
        drillName: 'Moving Shot Practice',
        performance: 47,
        notes: 'Moving shots improving as technique solidifies'
      }
    ] as DrillHistory[],
    currentLevel: 59,
    targetLevel: 70,
    improvementRate: 8.5, // percentage per month
    startDate: new Date('2024-09-01')
  },

  skatingProgression: {
    playerId: '550e8400-e29b-41d4-a716-446655440011',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Forward Crossovers',
    category: 'Skating',
    measurements: [
      {
        date: new Date('2024-09-01'),
        value: 28.5,
        unit: 'km/h',
        testConditions: 'Figure-8 drill with crossovers',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Baseline speed measurement'
      },
      {
        date: new Date('2024-09-22'),
        value: 29.2,
        unit: 'km/h',
        testConditions: 'Figure-8 drill with crossovers',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Slight improvement in technique'
      },
      {
        date: new Date('2024-10-15'),
        value: 30.1,
        unit: 'km/h',
        testConditions: 'Figure-8 drill with crossovers',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Better edge work showing results',
        videoReference: 'https://example.com/skating-test-1.mp4'
      },
      {
        date: new Date('2024-11-05'),
        value: 31.3,
        unit: 'km/h',
        testConditions: 'Figure-8 drill with crossovers',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Significant improvement in power and speed'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U18',
      elite: 38,
      above_average: 34,
      average: 30,
      below_average: 26
    } as Benchmarks,
    drillHistory: [
      {
        date: new Date('2024-09-05'),
        drillId: 'skating-drill-001',
        drillName: 'Figure-8 Crossovers',
        performance: 28,
        notes: 'Baseline - needs work on edge control'
      },
      {
        date: new Date('2024-09-12'),
        drillId: 'skating-drill-002',
        drillName: 'Tight Turns Practice',
        performance: 6, // different scale
        notes: 'Working on balance and edge work'
      },
      {
        date: new Date('2024-09-19'),
        drillId: 'skating-drill-001',
        drillName: 'Figure-8 Crossovers',
        performance: 29,
        notes: 'Small improvement in speed'
      },
      {
        date: new Date('2024-09-26'),
        drillId: 'skating-drill-003',
        drillName: 'Crossover Power Development',
        performance: 7,
        notes: 'Focus on generating power through crossovers'
      },
      {
        date: new Date('2024-10-03'),
        drillId: 'skating-drill-001',
        drillName: 'Figure-8 Crossovers',
        performance: 30,
        notes: 'Breaking through to new speed level'
      }
    ] as DrillHistory[],
    currentLevel: 31.3,
    targetLevel: 35,
    improvementRate: 3.2,
    startDate: new Date('2024-09-01')
  },

  stickhandlingProgression: {
    playerId: '550e8400-e29b-41d4-a716-446655440012',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Puck Control in Traffic',
    category: 'Puck Handling',
    measurements: [
      {
        date: new Date('2024-09-15'),
        value: 12,
        unit: 'successful reps',
        testConditions: 'Traffic cone drill - 20 attempts',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Struggles with tight spaces and pressure'
      },
      {
        date: new Date('2024-10-01'),
        value: 14,
        unit: 'successful reps',
        testConditions: 'Traffic cone drill - 20 attempts',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Slight improvement with daily practice'
      },
      {
        date: new Date('2024-10-20'),
        value: 16,
        unit: 'successful reps',
        testConditions: 'Traffic cone drill - 20 attempts',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Better protection of puck, improved confidence',
        videoReference: 'https://example.com/stickhandling-test-1.mp4'
      },
      {
        date: new Date('2024-11-10'),
        value: 17,
        unit: 'successful reps',
        testConditions: 'Traffic cone drill - 20 attempts',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Steady improvement, more consistent performance'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U14',
      elite: 19,
      above_average: 17,
      average: 14,
      below_average: 11
    } as Benchmarks,
    drillHistory: [
      {
        date: new Date('2024-09-17'),
        drillId: 'puckhandling-drill-001',
        drillName: 'Basic Traffic Drill',
        performance: 11,
        notes: 'Nervous with puck under pressure'
      },
      {
        date: new Date('2024-09-24'),
        drillId: 'puckhandling-drill-002',
        drillName: 'Puck Protection Practice',
        performance: 8, // different scale
        notes: 'Learning to use body to shield puck'
      },
      {
        date: new Date('2024-10-01'),
        drillId: 'puckhandling-drill-001',
        drillName: 'Basic Traffic Drill',
        performance: 13,
        notes: 'Improved comfort level with contact'
      },
      {
        date: new Date('2024-10-08'),
        drillId: 'puckhandling-drill-003',
        drillName: 'Advanced Traffic Scenarios',
        performance: 6,
        notes: 'New drill - very challenging but good learning'
      }
    ] as DrillHistory[],
    currentLevel: 17,
    targetLevel: 19,
    improvementRate: 5.8,
    startDate: new Date('2024-09-15')
  }
};

// Invalid skill progression data
export const invalidSkillProgressionData = {
  missingRequired: {
    // Missing playerId, coachId, skill, category, measurements, startDate
    currentLevel: 50
  },

  invalidUUIDs: {
    playerId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    skill: 'Test Skill',
    category: 'Test Category',
    measurements: [],
    startDate: new Date()
  },

  malformedMeasurements: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Test Skill',
    category: 'Test Category',
    measurements: [
      {
        // Missing required fields: date, value, unit, evaluatorId
        notes: 'Invalid measurement'
      }
    ] as any,
    startDate: new Date()
  },

  invalidTargetLevel: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Test Skill',
    category: 'Test Category',
    measurements: [
      {
        date: new Date(),
        value: 50,
        unit: 'test unit',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001'
      }
    ] as SkillMeasurement[],
    currentLevel: 80,
    targetLevel: 60, // Target lower than current
    startDate: new Date()
  },

  invalidBenchmarks: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Test Skill',
    category: 'Test Category',
    measurements: [
      {
        date: new Date(),
        value: 50,
        unit: 'test unit',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U16',
      elite: 60,
      above_average: 70, // Above average higher than elite
      average: 50,
      below_average: 40
    } as Benchmarks,
    startDate: new Date()
  }
};

// Edge case data
export const edgeCaseSkillProgressionData = {
  manyMeasurements: {
    playerId: '550e8400-e29b-41d4-a716-446655440020',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Comprehensive Skill Tracking',
    category: 'Multi-Category',
    measurements: Array.from({ length: 50 }, (_, i) => ({
      date: new Date(Date.now() - (50 - i) * 7 * 24 * 60 * 60 * 1000), // Weekly measurements
      value: 40 + Math.floor(Math.random() * 20) + Math.floor(i * 0.5), // Gradual improvement
      unit: 'performance score',
      testConditions: `Weekly assessment ${i + 1}`,
      evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
      notes: i % 5 === 0 ? `Milestone measurement ${i + 1}` : undefined,
      videoReference: i % 10 === 0 ? `https://example.com/skill-video-${i + 1}.mp4` : undefined
    })) as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'Senior',
      elite: 85,
      above_average: 75,
      average: 65,
      below_average: 55
    } as Benchmarks,
    drillHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 10 * 24 * 60 * 60 * 1000), // Every 10 days
      drillId: `comprehensive-drill-${(i % 5) + 1}`,
      drillName: `Comprehensive Drill ${(i % 5) + 1}`,
      performance: 50 + Math.floor(Math.random() * 25) + Math.floor(i * 0.8),
      notes: i % 3 === 0 ? `Special notes for drill ${i + 1}` : undefined
    })) as DrillHistory[],
    currentLevel: 68,
    targetLevel: 80,
    improvementRate: 4.2,
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // One year ago
  },

  rapidImprovement: {
    playerId: '550e8400-e29b-41d4-a716-446655440021',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Breakthrough Skill Development',
    category: 'Rapid Improvement',
    measurements: [
      {
        date: new Date('2024-10-01'),
        value: 35,
        unit: 'skill rating',
        testConditions: 'Initial assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Starting point - significant work needed'
      },
      {
        date: new Date('2024-10-15'),
        value: 42,
        unit: 'skill rating',
        testConditions: 'Two-week follow-up',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Good early progress with focused practice'
      },
      {
        date: new Date('2024-11-01'),
        value: 55,
        unit: 'skill rating',
        testConditions: 'Monthly assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Breakthrough moment - everything clicked!',
        videoReference: 'https://example.com/breakthrough-moment.mp4'
      },
      {
        date: new Date('2024-11-15'),
        value: 68,
        unit: 'skill rating',
        testConditions: 'Confirmation test',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Sustained improvement - excellent development'
      },
      {
        date: new Date('2024-12-01'),
        value: 74,
        unit: 'skill rating',
        testConditions: 'Latest assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Approaching elite level - remarkable progress'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U18',
      elite: 80,
      above_average: 70,
      average: 60,
      below_average: 50
    } as Benchmarks,
    drillHistory: [
      {
        date: new Date('2024-10-03'),
        drillId: 'breakthrough-drill-1',
        drillName: 'Foundation Drill',
        performance: 32,
        notes: 'Building basics from ground up'
      },
      {
        date: new Date('2024-10-17'),
        drillId: 'breakthrough-drill-2',
        drillName: 'Progressive Drill',
        performance: 45,
        notes: 'Major improvement in execution'
      },
      {
        date: new Date('2024-11-03'),
        drillId: 'breakthrough-drill-3',
        drillName: 'Advanced Application',
        performance: 58,
        notes: 'Successfully applying skills in complex situations'
      }
    ] as DrillHistory[],
    currentLevel: 74,
    targetLevel: 80,
    improvementRate: 32.5, // Very high improvement rate
    startDate: new Date('2024-10-01')
  },

  plateauProgression: {
    playerId: '550e8400-e29b-41d4-a716-446655440022',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    skill: 'Plateau Challenge',
    category: 'Consistency Development',
    measurements: [
      {
        date: new Date('2024-08-01'),
        value: 72,
        unit: 'consistency rating',
        testConditions: 'Peak summer assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'High level achieved'
      },
      {
        date: new Date('2024-08-15'),
        value: 71,
        unit: 'consistency rating',
        testConditions: 'Maintenance phase',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Slight decline - need to maintain focus'
      },
      {
        date: new Date('2024-09-01'),
        value: 73,
        unit: 'consistency rating',
        testConditions: 'Season start assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Back to previous level'
      },
      {
        date: new Date('2024-09-15'),
        value: 72,
        unit: 'consistency rating',
        testConditions: 'Mid-month check',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Consistent at high level - good plateau'
      },
      {
        date: new Date('2024-10-01'),
        value: 74,
        unit: 'consistency rating',
        testConditions: 'Monthly assessment',
        evaluatorId: '550e8400-e29b-41d4-a716-446655440001',
        notes: 'Small breakthrough - staying consistent at higher level'
      }
    ] as SkillMeasurement[],
    benchmarks: {
      ageGroup: 'U16',
      elite: 78,
      above_average: 72,
      average: 65,
      below_average: 58
    } as Benchmarks,
    currentLevel: 74,
    targetLevel: 78,
    improvementRate: 0.8, // Very slow improvement - at plateau
    startDate: new Date('2024-08-01')
  }
};

// Bulk data for performance testing
export const bulkSkillProgressionData = Array.from({ length: 60 }, (_, index) => ({
  playerId: `550e8400-e29b-41d4-a716-446655441${index.toString().padStart(3, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-446655440${(index % 3).toString().padStart(3, '0')}`,
  skill: `Bulk Skill ${index + 1}`,
  category: ['Shooting', 'Skating', 'Puck Handling', 'Defensive', 'Mental'][index % 5],
  measurements: Array.from({ length: Math.floor(Math.random() * 10) + 3 }, (_, i) => ({
    date: new Date(Date.now() - (10 - i) * 14 * 24 * 60 * 60 * 1000), // Bi-weekly
    value: 30 + Math.floor(Math.random() * 40) + Math.floor(i * 2),
    unit: ['accuracy %', 'km/h', 'successful reps', 'rating', 'score'][index % 5],
    testConditions: `Bulk test condition ${i + 1}`,
    evaluatorId: `550e8400-e29b-41d4-a716-446655440${(index % 3).toString().padStart(3, '0')}`,
    notes: i % 3 === 0 ? `Bulk notes ${i + 1}` : undefined,
    videoReference: i % 5 === 0 ? `https://example.com/bulk-video-${index}-${i}.mp4` : undefined
  })) as SkillMeasurement[],
  ...(index % 3 === 0 && {
    benchmarks: {
      ageGroup: ['U12', 'U14', 'U16', 'U18', 'Senior'][index % 5],
      elite: 80 + Math.floor(Math.random() * 15),
      above_average: 70 + Math.floor(Math.random() * 10),
      average: 60 + Math.floor(Math.random() * 8),
      below_average: 45 + Math.floor(Math.random() * 10)
    } as Benchmarks
  }),
  ...(index % 2 === 0 && {
    drillHistory: Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => ({
      date: new Date(Date.now() - (8 - i) * 21 * 24 * 60 * 60 * 1000), // Every 3 weeks
      drillId: `bulk-drill-${index}-${i + 1}`,
      drillName: `Bulk Drill ${i + 1}`,
      performance: 40 + Math.floor(Math.random() * 35) + Math.floor(i * 1.5),
      notes: i % 2 === 0 ? `Bulk drill notes ${i + 1}` : undefined
    })) as DrillHistory[]
  }),
  currentLevel: 50 + Math.floor(Math.random() * 30),
  targetLevel: 70 + Math.floor(Math.random() * 20),
  improvementRate: Math.floor(Math.random() * 15) + 2,
  startDate: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000) // Up to 6 months ago
}));

// Export all fixtures
export const skillProgressionFixtures = {
  valid: validSkillProgressionData,
  invalid: invalidSkillProgressionData,
  edgeCase: edgeCaseSkillProgressionData,
  bulk: bulkSkillProgressionData
};