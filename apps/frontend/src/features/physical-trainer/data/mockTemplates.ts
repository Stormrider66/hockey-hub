import { WorkoutTemplateSelection } from '../types/workout-builder.types';
import { WorkoutType } from '../types';

export const mockWorkoutTemplates: WorkoutTemplateSelection[] = [
  // Strength Templates
  {
    templateId: 'strength-1',
    name: 'Hockey Power Development',
    description: 'Build explosive power for on-ice performance with compound movements',
    type: 'strength' as WorkoutType,
    exercises: [
      {
        exerciseId: 'squat',
        phase: 'warmup',
        orderIndex: 0,
        sets: 3,
        reps: 10,
        weight: 50,
        restBetweenSets: 60
      },
      {
        exerciseId: 'deadlift',
        phase: 'main',
        orderIndex: 0,
        sets: 5,
        reps: 5,
        weight: 80,
        restBetweenSets: 180
      },
      {
        exerciseId: 'box-jump',
        phase: 'main',
        orderIndex: 1,
        sets: 4,
        reps: 6,
        restBetweenSets: 120
      },
      {
        exerciseId: 'plank',
        phase: 'cooldown',
        orderIndex: 0,
        duration: 60,
        sets: 3,
        restBetweenSets: 30
      }
    ],
    defaultDuration: 60,
    defaultIntensity: 'high',
    tags: ['hockey', 'power', 'advanced', 'lower-body'],
    author: 'Coach Smith',
    lastModified: '2025-01-15',
    usageCount: 245,
    rating: 4.8
  },
  {
    templateId: 'strength-2',
    name: 'Upper Body Hypertrophy',
    description: 'Build muscle mass and strength in chest, back, and arms',
    type: 'strength' as WorkoutType,
    exercises: [
      {
        exerciseId: 'bench-press',
        phase: 'main',
        orderIndex: 0,
        sets: 4,
        reps: 10,
        weight: 70,
        restBetweenSets: 90
      },
      {
        exerciseId: 'pull-up',
        phase: 'main',
        orderIndex: 1,
        sets: 4,
        reps: 8,
        restBetweenSets: 90
      },
      {
        exerciseId: 'db-row',
        phase: 'main',
        orderIndex: 2,
        sets: 3,
        reps: 12,
        weight: 60,
        restBetweenSets: 60
      }
    ],
    defaultDuration: 45,
    defaultIntensity: 'medium',
    tags: ['hypertrophy', 'upper-body', 'intermediate'],
    author: 'PT Team',
    lastModified: '2025-01-20',
    usageCount: 180,
    rating: 4.6
  },
  {
    templateId: 'strength-3',
    name: 'Beginner Full Body',
    description: 'Perfect starting point for new athletes with basic movements',
    type: 'strength' as WorkoutType,
    exercises: [
      {
        exerciseId: 'goblet-squat',
        phase: 'main',
        orderIndex: 0,
        sets: 3,
        reps: 12,
        weight: 40,
        restBetweenSets: 60
      },
      {
        exerciseId: 'push-up',
        phase: 'main',
        orderIndex: 1,
        sets: 3,
        reps: 10,
        restBetweenSets: 45
      }
    ],
    defaultDuration: 30,
    defaultIntensity: 'low',
    tags: ['beginner', 'full-body', 'general'],
    author: 'PT Team',
    lastModified: '2025-01-18',
    usageCount: 320,
    rating: 4.9
  },

  // Conditioning Templates
  {
    templateId: 'conditioning-1',
    name: 'Hockey Interval Training',
    description: 'Sport-specific intervals mimicking game shifts',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'bike-interval',
        phase: 'main',
        orderIndex: 0,
        duration: 45,
        sets: 10,
        restBetweenSets: 90,
        notes: '45s on, 90s rest - match shift pattern'
      }
    ],
    defaultDuration: 30,
    defaultIntensity: 'high',
    tags: ['hockey', 'intervals', 'intermediate', 'cardio'],
    author: 'Coach Johnson',
    lastModified: '2025-01-22',
    usageCount: 410,
    rating: 4.7
  },
  {
    templateId: 'conditioning-2',
    name: 'VO2 Max Builder',
    description: 'Improve aerobic capacity with progressive intervals',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'rowing-interval',
        phase: 'main',
        orderIndex: 0,
        duration: 240,
        sets: 5,
        restBetweenSets: 180,
        notes: '4min at 85% HR, 3min recovery'
      }
    ],
    defaultDuration: 45,
    defaultIntensity: 'high',
    tags: ['endurance', 'advanced', 'rowing'],
    author: 'PT Team',
    lastModified: '2025-01-19',
    usageCount: 156,
    rating: 4.5
  },
  {
    templateId: 'conditioning-3',
    name: 'Recovery Ride',
    description: 'Low-intensity steady state for active recovery',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'bike-steady',
        phase: 'main',
        orderIndex: 0,
        duration: 1800,
        sets: 1,
        notes: '30min at 60-65% HR'
      }
    ],
    defaultDuration: 35,
    defaultIntensity: 'low',
    tags: ['recovery', 'beginner', 'bike'],
    author: 'PT Team',
    lastModified: '2025-01-21',
    usageCount: 280,
    rating: 4.4
  },

  // Hybrid Templates
  {
    templateId: 'hybrid-1',
    name: 'Hockey Circuit Training',
    description: 'Combine strength and cardio for complete hockey fitness',
    type: 'hybrid' as WorkoutType,
    exercises: [
      {
        exerciseId: 'squat',
        phase: 'main',
        orderIndex: 0,
        sets: 3,
        reps: 15,
        weight: 60,
        restBetweenSets: 30
      },
      {
        exerciseId: 'bike-sprint',
        phase: 'main',
        orderIndex: 1,
        duration: 60,
        sets: 3,
        restBetweenSets: 30
      },
      {
        exerciseId: 'plank',
        phase: 'main',
        orderIndex: 2,
        duration: 45,
        sets: 3,
        restBetweenSets: 30
      }
    ],
    defaultDuration: 45,
    defaultIntensity: 'high',
    tags: ['hockey', 'circuit', 'intermediate', 'full-body'],
    author: 'Coach Williams',
    lastModified: '2025-01-20',
    usageCount: 189,
    rating: 4.8
  },
  {
    templateId: 'hybrid-2',
    name: 'CrossFit Style WOD',
    description: 'High-intensity workout of the day format',
    type: 'hybrid' as WorkoutType,
    exercises: [
      {
        exerciseId: 'deadlift',
        phase: 'main',
        orderIndex: 0,
        sets: 1,
        reps: 21,
        weight: 60
      },
      {
        exerciseId: 'box-jump',
        phase: 'main',
        orderIndex: 1,
        sets: 1,
        reps: 21
      },
      {
        exerciseId: 'rowing',
        phase: 'main',
        orderIndex: 2,
        distance: 500,
        sets: 1
      }
    ],
    defaultDuration: 20,
    defaultIntensity: 'max',
    tags: ['crossfit', 'advanced', 'full-body'],
    author: 'PT Team',
    lastModified: '2025-01-18',
    usageCount: 145,
    rating: 4.6
  },

  // Agility Templates
  {
    templateId: 'agility-1',
    name: 'Hockey Agility Ladder',
    description: 'Improve footwork and coordination for on-ice performance',
    type: 'agility' as WorkoutType,
    exercises: [
      {
        exerciseId: 'ladder-in-out',
        phase: 'main',
        orderIndex: 0,
        sets: 3,
        reps: 2,
        restBetweenSets: 60
      },
      {
        exerciseId: 'ladder-lateral',
        phase: 'main',
        orderIndex: 1,
        sets: 3,
        reps: 2,
        restBetweenSets: 60
      },
      {
        exerciseId: 'cone-weave',
        phase: 'main',
        orderIndex: 2,
        sets: 4,
        reps: 1,
        restBetweenSets: 90
      }
    ],
    defaultDuration: 30,
    defaultIntensity: 'medium',
    tags: ['hockey', 'agility', 'intermediate', 'footwork'],
    author: 'Coach Davis',
    lastModified: '2025-01-19',
    usageCount: 234,
    rating: 4.7
  },
  {
    templateId: 'agility-2',
    name: 'Reaction Time Developer',
    description: 'Enhance quick decision making and directional changes',
    type: 'agility' as WorkoutType,
    exercises: [
      {
        exerciseId: 'mirror-drill',
        phase: 'main',
        orderIndex: 0,
        duration: 30,
        sets: 5,
        restBetweenSets: 60
      },
      {
        exerciseId: 'cone-reaction',
        phase: 'main',
        orderIndex: 1,
        sets: 8,
        reps: 1,
        restBetweenSets: 45
      }
    ],
    defaultDuration: 25,
    defaultIntensity: 'high',
    tags: ['reaction', 'advanced', 'sports'],
    author: 'PT Team',
    lastModified: '2025-01-21',
    usageCount: 167,
    rating: 4.5
  },
  {
    templateId: 'agility-3',
    name: 'Youth Coordination',
    description: 'Fun agility drills for young athletes',
    type: 'agility' as WorkoutType,
    exercises: [
      {
        exerciseId: 'hopscotch',
        phase: 'warmup',
        orderIndex: 0,
        sets: 2,
        reps: 10,
        restBetweenSets: 30
      },
      {
        exerciseId: 'cone-zigzag',
        phase: 'main',
        orderIndex: 0,
        sets: 4,
        reps: 2,
        restBetweenSets: 60
      }
    ],
    defaultDuration: 20,
    defaultIntensity: 'low',
    tags: ['youth', 'beginner', 'fun'],
    author: 'Youth Team',
    lastModified: '2025-01-17',
    usageCount: 412,
    rating: 4.9
  },

  // Additional Conditioning Templates
  {
    templateId: 'conditioning-4',
    name: 'Sprint Interval Training',
    description: 'High-intensity sprint intervals for speed and power',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'sprint-30',
        phase: 'warmup',
        orderIndex: 0,
        duration: 300,
        sets: 1,
        notes: 'Easy jog 5 minutes'
      },
      {
        exerciseId: 'sprint-100',
        phase: 'main',
        orderIndex: 0,
        duration: 15,
        sets: 8,
        restBetweenSets: 120,
        notes: '100m sprints at 95% effort'
      },
      {
        exerciseId: 'walk-recovery',
        phase: 'cooldown',
        orderIndex: 0,
        duration: 300,
        sets: 1,
        notes: 'Easy walk 5 minutes'
      }
    ],
    defaultDuration: 35,
    defaultIntensity: 'max',
    tags: ['sprints', 'speed', 'advanced', 'track'],
    author: 'Speed Coach',
    lastModified: '2025-01-23',
    usageCount: 324,
    rating: 4.8
  },
  {
    templateId: 'conditioning-5',
    name: 'Endurance Base Builder',
    description: 'Long steady-state session for aerobic foundation',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'run-steady',
        phase: 'main',
        orderIndex: 0,
        duration: 2700,
        sets: 1,
        notes: '45min at 65-70% HR, conversational pace'
      }
    ],
    defaultDuration: 50,
    defaultIntensity: 'medium',
    tags: ['endurance', 'aerobic', 'intermediate', 'running'],
    author: 'PT Team',
    lastModified: '2025-01-22',
    usageCount: 267,
    rating: 4.4
  },
  {
    templateId: 'conditioning-6',
    name: 'Power Development Intervals',
    description: 'Short explosive intervals for power output',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'bike-power',
        phase: 'main',
        orderIndex: 0,
        duration: 20,
        sets: 12,
        restBetweenSets: 60,
        notes: '20s all-out effort, 60s easy recovery'
      }
    ],
    defaultDuration: 25,
    defaultIntensity: 'max',
    tags: ['power', 'intervals', 'advanced', 'bike'],
    author: 'Power Coach',
    lastModified: '2025-01-21',
    usageCount: 189,
    rating: 4.7
  },
  {
    templateId: 'conditioning-7',
    name: 'Hockey Game Simulation',
    description: 'Intervals matching hockey shift patterns',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'shuttle-runs',
        phase: 'main',
        orderIndex: 0,
        duration: 45,
        sets: 15,
        restBetweenSets: 90,
        notes: 'High intensity shuttles, 45s work : 90s rest'
      }
    ],
    defaultDuration: 40,
    defaultIntensity: 'high',
    tags: ['hockey', 'sport-specific', 'intervals', 'intermediate'],
    author: 'Hockey Performance',
    lastModified: '2025-01-23',
    usageCount: 456,
    rating: 4.9
  },
  {
    templateId: 'conditioning-8',
    name: 'Recovery Row',
    description: 'Low-intensity rowing for active recovery',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'row-steady',
        phase: 'main',
        orderIndex: 0,
        duration: 1200,
        sets: 1,
        notes: '20min at 55-60% HR, focus on technique'
      }
    ],
    defaultDuration: 25,
    defaultIntensity: 'low',
    tags: ['recovery', 'rowing', 'beginner', 'low-impact'],
    author: 'PT Team',
    lastModified: '2025-01-20',
    usageCount: 234,
    rating: 4.5
  },
  {
    templateId: 'conditioning-9',
    name: 'Tempo Run Progression',
    description: 'Lactate threshold development workout',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'run-warmup',
        phase: 'warmup',
        orderIndex: 0,
        duration: 600,
        sets: 1,
        notes: 'Easy pace 10 minutes'
      },
      {
        exerciseId: 'run-tempo',
        phase: 'main',
        orderIndex: 0,
        duration: 1200,
        sets: 1,
        notes: '20min at threshold pace (comfortably hard)'
      },
      {
        exerciseId: 'run-cooldown',
        phase: 'cooldown',
        orderIndex: 0,
        duration: 300,
        sets: 1,
        notes: 'Easy jog 5 minutes'
      }
    ],
    defaultDuration: 40,
    defaultIntensity: 'high',
    tags: ['tempo', 'threshold', 'intermediate', 'running'],
    author: 'Running Coach',
    lastModified: '2025-01-22',
    usageCount: 312,
    rating: 4.6
  },
  {
    templateId: 'conditioning-10',
    name: 'Fartlek Fun Run',
    description: 'Variable intensity running for fitness and fun',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'fartlek-run',
        phase: 'main',
        orderIndex: 0,
        duration: 1800,
        sets: 1,
        notes: '30min with random speed bursts (30s-2min hard efforts)'
      }
    ],
    defaultDuration: 35,
    defaultIntensity: 'variable',
    tags: ['fartlek', 'fun', 'intermediate', 'running'],
    author: 'PT Team',
    lastModified: '2025-01-19',
    usageCount: 198,
    rating: 4.7
  },
  {
    templateId: 'conditioning-11',
    name: 'Pyramid Intervals',
    description: 'Progressive interval workout building up and down',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'pyramid-intervals',
        phase: 'main',
        orderIndex: 0,
        duration: 0,
        sets: 1,
        notes: '1-2-3-4-3-2-1 minutes hard with equal rest'
      }
    ],
    defaultDuration: 45,
    defaultIntensity: 'high',
    tags: ['pyramid', 'intervals', 'advanced', 'versatile'],
    author: 'Interval Expert',
    lastModified: '2025-01-21',
    usageCount: 276,
    rating: 4.8
  },
  {
    templateId: 'conditioning-12',
    name: 'Hill Repeat Power',
    description: 'Hill running for strength and power development',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'hill-warmup',
        phase: 'warmup',
        orderIndex: 0,
        duration: 600,
        sets: 1,
        notes: 'Easy jog to hill location'
      },
      {
        exerciseId: 'hill-sprints',
        phase: 'main',
        orderIndex: 0,
        duration: 60,
        sets: 8,
        restBetweenSets: 180,
        notes: '60s uphill at 90% effort, jog down recovery'
      }
    ],
    defaultDuration: 40,
    defaultIntensity: 'high',
    tags: ['hills', 'power', 'intermediate', 'running'],
    author: 'Hill Coach',
    lastModified: '2025-01-23',
    usageCount: 234,
    rating: 4.6
  },
  {
    templateId: 'conditioning-13',
    name: 'Cross-Training Circuit',
    description: 'Multi-equipment cardio circuit for variety',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'bike-interval',
        phase: 'main',
        orderIndex: 0,
        duration: 300,
        sets: 1,
        notes: '5min bike moderate pace'
      },
      {
        exerciseId: 'row-interval',
        phase: 'main',
        orderIndex: 1,
        duration: 300,
        sets: 1,
        notes: '5min row moderate pace'
      },
      {
        exerciseId: 'treadmill-interval',
        phase: 'main',
        orderIndex: 2,
        duration: 300,
        sets: 1,
        notes: '5min run moderate pace'
      }
    ],
    defaultDuration: 20,
    defaultIntensity: 'medium',
    tags: ['circuit', 'variety', 'beginner', 'cross-training'],
    author: 'PT Team',
    lastModified: '2025-01-20',
    usageCount: 345,
    rating: 4.5
  },
  {
    templateId: 'conditioning-14',
    name: 'Tabata Protocol',
    description: 'Classic 4-minute high-intensity interval protocol',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'tabata-bike',
        phase: 'main',
        orderIndex: 0,
        duration: 20,
        sets: 8,
        restBetweenSets: 10,
        notes: '20s all-out, 10s rest x 8 rounds'
      }
    ],
    defaultDuration: 10,
    defaultIntensity: 'max',
    tags: ['tabata', 'HIIT', 'advanced', 'time-efficient'],
    author: 'HIIT Specialist',
    lastModified: '2025-01-22',
    usageCount: 512,
    rating: 4.9
  },
  {
    templateId: 'conditioning-15',
    name: 'Aerobic Power Intervals',
    description: 'VO2max development through structured intervals',
    type: 'conditioning' as WorkoutType,
    exercises: [
      {
        exerciseId: 'vo2-intervals',
        phase: 'main',
        orderIndex: 0,
        duration: 180,
        sets: 6,
        restBetweenSets: 180,
        notes: '3min at 90-95% max HR, 3min recovery'
      }
    ],
    defaultDuration: 40,
    defaultIntensity: 'high',
    tags: ['VO2max', 'intervals', 'advanced', 'performance'],
    author: 'Endurance Coach',
    lastModified: '2025-01-21',
    usageCount: 167,
    rating: 4.7
  }
];