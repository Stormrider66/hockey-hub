/**
 * Comprehensive Mock Data for Hockey Hub Workout Lifecycle
 * 
 * This file contains realistic mock data that showcases all implemented features:
 * - Workout Creation (all types with rich details)
 * - Calendar Integration (events with workout metadata)
 * - Player Dashboard (upcoming workouts, active sessions)
 * - Real-time Execution (live metrics, zone compliance)
 * - Group Monitoring (multiple players with live data)
 * - Statistics & Analytics (performance data, trends)
 * - Medical Integration (restrictions, substitutions)
 * - Export Examples (sample reports)
 */

import { WorkoutEquipmentType } from '@/features/physical-trainer/types/conditioning.types';

// Helper functions to create dates
const getFutureDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const getPastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const getTimeFromNow = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

// ============================================================================
// PLAYER DATA WITH COMPREHENSIVE PROFILES
// ============================================================================

export const comprehensivePlayerData = [
  {
    id: 'player-001',
    name: 'Sidney Crosby',
    team: 'Pittsburgh Penguins',
    position: 'C',
    age: 36,
    weight: 91, // kg
    height: 180, // cm
    jerseyNumber: 87,
    medicalStatus: 'injured',
    injury: {
      type: 'Lower Back Strain',
      severity: 'moderate',
      restrictedActivities: ['deadlifts', 'heavy_squats', 'high_impact_jumping'],
      expectedReturn: '2025-02-15',
      restrictions: {
        weightLimit: 60, // kg
        noTwisting: true,
        noExplosiveMovements: true
      }
    },
    fitnessProfile: {
      maxHR: 195,
      restingHR: 48,
      vo2Max: 58.5,
      ftp: 280, // watts
      lt1: { hr: 156, power: 210 },
      lt2: { hr: 175, power: 265 },
      bodyFat: 8.2,
      fitnessLevel: 'elite'
    },
    recentPerformance: {
      trainingLoad: 72, // out of 100
      fatigueLevel: 'moderate',
      recoveryScore: 68,
      injuryRisk: 'high',
      lastTestDate: '2025-01-15'
    }
  },
  {
    id: 'player-002',
    name: 'Nathan MacKinnon',
    team: 'Colorado Avalanche',
    position: 'C',
    age: 29,
    weight: 88,
    height: 183,
    jerseyNumber: 29,
    medicalStatus: 'limited',
    injury: {
      type: 'Minor Shoulder Impingement',
      severity: 'mild',
      restrictedActivities: ['overhead_press', 'heavy_bench_press'],
      expectedReturn: '2025-02-01',
      restrictions: {
        shoulderAbduction: false,
        weightLimit: 80
      }
    },
    fitnessProfile: {
      maxHR: 198,
      restingHR: 45,
      vo2Max: 62.1,
      ftp: 310,
      lt1: { hr: 158, power: 230 },
      lt2: { hr: 178, power: 290 },
      bodyFat: 7.8,
      fitnessLevel: 'elite'
    },
    recentPerformance: {
      trainingLoad: 85,
      fatigueLevel: 'low',
      recoveryScore: 88,
      injuryRisk: 'low',
      lastTestDate: '2025-01-20'
    }
  },
  {
    id: 'player-003',
    name: 'Connor McDavid',
    team: 'Edmonton Oilers',
    position: 'C',
    age: 27,
    weight: 86,
    height: 185,
    jerseyNumber: 97,
    medicalStatus: 'healthy',
    fitnessProfile: {
      maxHR: 200,
      restingHR: 42,
      vo2Max: 65.2,
      ftp: 325,
      lt1: { hr: 160, power: 245 },
      lt2: { hr: 182, power: 305 },
      bodyFat: 7.2,
      fitnessLevel: 'elite'
    },
    recentPerformance: {
      trainingLoad: 78,
      fatigueLevel: 'low',
      recoveryScore: 92,
      injuryRisk: 'very_low',
      lastTestDate: '2025-01-25'
    }
  },
  {
    id: 'player-004',
    name: 'Auston Matthews',
    team: 'Toronto Maple Leafs',
    position: 'C',
    age: 26,
    weight: 100,
    height: 191,
    jerseyNumber: 34,
    medicalStatus: 'healthy',
    fitnessProfile: {
      maxHR: 192,
      restingHR: 52,
      vo2Max: 59.8,
      ftp: 295,
      lt1: { hr: 154, power: 220 },
      lt2: { hr: 172, power: 275 },
      bodyFat: 9.1,
      fitnessLevel: 'elite'
    },
    recentPerformance: {
      trainingLoad: 68,
      fatigueLevel: 'moderate',
      recoveryScore: 75,
      injuryRisk: 'low',
      lastTestDate: '2025-01-18'
    }
  },
  {
    id: 'player-005',
    name: 'Leon Draisaitl',
    team: 'Edmonton Oilers',
    position: 'RW',
    age: 29,
    weight: 95,
    height: 188,
    jerseyNumber: 29,
    medicalStatus: 'healthy',
    fitnessProfile: {
      maxHR: 188,
      restingHR: 50,
      vo2Max: 57.5,
      ftp: 285,
      lt1: { hr: 152, power: 210 },
      lt2: { hr: 170, power: 260 },
      bodyFat: 8.8,
      fitnessLevel: 'elite'
    },
    recentPerformance: {
      trainingLoad: 74,
      fatigueLevel: 'low',
      recoveryScore: 82,
      injuryRisk: 'low',
      lastTestDate: '2025-01-22'
    }
  }
];

// ============================================================================
// COMPREHENSIVE WORKOUT EXAMPLES
// ============================================================================

// Pre-calculate dates to avoid parsing issues
const date1DayFromNow = getFutureDate(1);
const date2DaysFromNow = getFutureDate(2);
const date3DaysFromNow = getFutureDate(3);
const date4DaysFromNow = getFutureDate(4);

export const comprehensiveWorkoutExamples = {
  // STRENGTH WORKOUT with full exercise details
  strength: {
    id: 'workout-strength-001',
    type: 'STRENGTH',
    name: 'Elite Hockey Power Development',
    description: 'Olympic lift focused session targeting explosive hip extension and power transfer',
    scheduledDate: date2DaysFromNow, // 2 days from now
    location: 'Performance Center - Weight Room A',
    estimatedDuration: 90,
    assignedPlayerIds: ['player-001', 'player-002', 'player-003'],
    assignedTeamIds: ['team-001'],
    difficulty: 'ADVANCED',
    tags: ['power', 'olympic-lifts', 'explosive', 'hockey-specific'],
    equipment: ['Olympic Barbell', 'Bumper Plates', 'Squat Rack', 'Platform'],
    phases: [
      {
        id: 'phase-warmup',
        name: 'Dynamic Warm-up',
        type: 'warmup',
        duration: 15,
        exercises: [
          {
            id: 'ex-warmup-1',
            exerciseId: 'leg-swings',
            name: 'Leg Swings (Forward/Back)',
            sets: [{ reps: 10, restTime: 30 }],
            notes: 'Focus on hip mobility'
          },
          {
            id: 'ex-warmup-2',
            exerciseId: 'hip-circles',
            name: 'Hip Circles',
            sets: [{ reps: 8, restTime: 30 }],
            notes: 'Both directions'
          }
        ]
      },
      {
        id: 'phase-main',
        name: 'Power Development',
        type: 'main',
        duration: 50,
        exercises: [
          {
            id: 'ex-main-1',
            exerciseId: 'power-clean',
            name: 'Power Clean',
            sets: [
              { weight: 60, reps: 5, restTime: 180, rpe: 6 },
              { weight: 70, reps: 3, restTime: 180, rpe: 7 },
              { weight: 80, reps: 3, restTime: 180, rpe: 8 },
              { weight: 85, reps: 2, restTime: 240, rpe: 9 },
              { weight: 90, reps: 1, restTime: 240, rpe: 9 }
            ],
            notes: 'Focus on explosive hip extension. Stop if form breaks down.',
            medicalModifications: {
              'player-001': 'Use 50% max weight due to back injury'
            }
          },
          {
            id: 'ex-main-2',
            exerciseId: 'front-squat',
            name: 'Front Squat',
            sets: [
              { weight: 70, reps: 8, restTime: 120 },
              { weight: 80, reps: 6, restTime: 120 },
              { weight: 85, reps: 4, restTime: 150 },
              { weight: 90, reps: 2, restTime: 180 }
            ],
            notes: 'Maintain upright torso. Full depth.',
            medicalModifications: {
              'player-001': 'Replace with goblet squats, max 30kg'
            }
          }
        ]
      },
      {
        id: 'phase-accessory',
        name: 'Hockey-Specific Power',
        type: 'accessory',
        duration: 20,
        exercises: [
          {
            id: 'ex-acc-1',
            exerciseId: 'lateral-bounds',
            name: 'Lateral Bounds',
            sets: [
              { reps: 8, restTime: 60, notes: 'Each direction' },
              { reps: 8, restTime: 60, notes: 'Each direction' },
              { reps: 6, restTime: 60, notes: 'Each direction' }
            ],
            notes: 'Mimic skating stride pattern'
          }
        ]
      }
    ],
    medicalCompliance: {
      restrictions: ['player-001'],
      alternatives: {
        'player-001': {
          'power-clean': 'Medicine ball slams',
          'front-squat': 'Goblet squats'
        }
      },
      warnings: [
        'Sidney Crosby has back restrictions - modified program assigned'
      ]
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: 'trainer-001'
  },

  // CONDITIONING WORKOUT with intervals and zones
  conditioning: {
    id: 'workout-conditioning-001',
    type: 'CONDITIONING',
    name: 'VO2 Max Development Protocol',
    description: '4x4 minute intervals at 90% max HR to develop aerobic power',
    scheduledDate: date1DayFromNow, // 1 day from now
    location: 'Training Center - Cardio Lab',
    estimatedDuration: 60,
    assignedPlayerIds: ['player-002', 'player-003', 'player-004'],
    equipment: WorkoutEquipmentType.ROWING,
    intervalProgram: {
      id: 'interval-vo2max-001',
      name: 'VO2 Max Development',
      description: 'High intensity intervals for aerobic power',
      equipment: WorkoutEquipmentType.ROWING,
      totalDuration: 3600, // 60 minutes
      intervals: [
        {
          id: 'warmup-1',
          type: 'warmup',
          name: 'Easy Warm-up',
          duration: 600, // 10 minutes
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 2,
            pace: { type: 'percentage', value: 65, reference: 'critical_power' },
            rpe: 3
          },
          color: '#3b82f6'
        },
        {
          id: 'work-1',
          type: 'work',
          name: 'VO2 Max Interval 1',
          duration: 240, // 4 minutes
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 5,
            watts: { type: 'percentage', value: 90, reference: 'ftp' },
            pace: { type: 'percentage', value: 85, reference: 'critical_power' },
            rpe: 8
          },
          color: '#ef4444'
        },
        {
          id: 'rest-1',
          type: 'rest',
          name: 'Active Recovery',
          duration: 180, // 3 minutes
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 1,
            pace: { type: 'percentage', value: 50, reference: 'critical_power' },
            rpe: 2
          },
          color: '#94a3b8'
        },
        // Repeat pattern for 4 intervals
        {
          id: 'work-2',
          type: 'work',
          name: 'VO2 Max Interval 2',
          duration: 240,
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 5,
            watts: { type: 'percentage', value: 90, reference: 'ftp' },
            rpe: 8
          },
          color: '#ef4444'
        },
        {
          id: 'rest-2',
          type: 'rest',
          duration: 180,
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: { heartRateZone: 1, rpe: 2 },
          color: '#94a3b8'
        },
        {
          id: 'work-3',
          type: 'work',
          name: 'VO2 Max Interval 3',
          duration: 240,
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 5,
            watts: { type: 'percentage', value: 88, reference: 'ftp' }, // Slight drop
            rpe: 9
          },
          color: '#ef4444'
        },
        {
          id: 'rest-3',
          type: 'rest',
          duration: 180,
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: { heartRateZone: 1, rpe: 2 },
          color: '#94a3b8'
        },
        {
          id: 'work-4',
          type: 'work',
          name: 'VO2 Max Interval 4',
          duration: 240,
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 5,
            watts: { type: 'percentage', value: 85, reference: 'ftp' }, // Final drop
            rpe: 9
          },
          color: '#ef4444'
        },
        {
          id: 'cooldown-1',
          type: 'cooldown',
          name: 'Cool-down',
          duration: 720, // 12 minutes
          equipment: WorkoutEquipmentType.ROWING,
          targetMetrics: {
            heartRateZone: 1,
            pace: { type: 'percentage', value: 45, reference: 'critical_power' },
            rpe: 2
          },
          color: '#10b981'
        }
      ],
      targetZones: {
        zone1: 45, // 45% in zone 1
        zone2: 15, // 15% in zone 2
        zone3: 10, // 10% in zone 3
        zone4: 10, // 10% in zone 4
        zone5: 20  // 20% in zone 5 (target zone)
      },
      difficulty: 'advanced',
      tags: ['vo2max', 'intervals', 'aerobic-power']
    },
    personalizedPrograms: {
      'player-002': {
        maxHR: 198,
        ftp: 310,
        zones: {
          zone1: { min: 99, max: 119 },  // 50-60% max HR
          zone2: { min: 119, max: 139 }, // 60-70% max HR
          zone3: { min: 139, max: 158 }, // 70-80% max HR
          zone4: { min: 158, max: 178 }, // 80-90% max HR
          zone5: { min: 178, max: 198 }  // 90-100% max HR
        }
      }
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: 'trainer-001'
  },

  // HYBRID WORKOUT combining strength and conditioning
  hybrid: {
    id: 'workout-hybrid-001',
    type: 'HYBRID',
    name: 'CrossFit Hockey Circuit',
    description: 'High-intensity circuit combining Olympic lifts, metabolic conditioning, and hockey-specific movements',
    scheduledDate: date3DaysFromNow, // 3 days from now
    location: 'Performance Center - Functional Training Area',
    estimatedDuration: 75,
    assignedPlayerIds: ['player-003', 'player-004', 'player-005'],
    hybridProgram: {
      id: 'hybrid-crossfit-001',
      name: 'Hockey Performance Circuit',
      totalDuration: 75,
      blocks: [
        {
          id: 'block-warmup',
          type: 'exercise',
          name: 'Dynamic Warm-up Circuit',
          duration: 10,
          exercises: [
            { name: 'Arm Circles', duration: 60 },
            { name: 'Leg Swings', duration: 60 },
            { name: 'Hip Circles', duration: 60 },
            { name: 'Light Jogging', duration: 120 },
            { name: 'Bodyweight Squats', reps: 15 },
            { name: 'Push-ups', reps: 10 }
          ],
          intensity: 'low',
          transitionTime: 30
        },
        {
          id: 'block-strength-1',
          type: 'exercise',
          name: 'Power Complex 1',
          duration: 12,
          exercises: [
            { name: 'Hang Clean', sets: 4, reps: 3, weight: '75%', rest: 90 },
            { name: 'Front Squat', sets: 4, reps: 5, weight: '80%', rest: 90 },
            { name: 'Push Press', sets: 4, reps: 3, weight: '70%', rest: 90 }
          ],
          intensity: 'high',
          equipment: ['Olympic Barbell', 'Bumper Plates'],
          transitionTime: 60
        },
        {
          id: 'block-conditioning-1',
          type: 'interval',
          name: 'Metabolic Blast',
          duration: 8,
          equipment: WorkoutEquipmentType.AIRBIKE,
          intervals: [
            {
              type: 'work',
              duration: 30,
              intensity: 'sprint',
              targetWatts: 350,
              targetHR: 'zone5'
            },
            {
              type: 'rest',
              duration: 90,
              intensity: 'easy',
              targetWatts: 100,
              targetHR: 'zone1'
            }
          ],
          rounds: 4,
          totalTime: 480,
          transitionTime: 60
        },
        {
          id: 'block-strength-2',
          type: 'exercise',
          name: 'Functional Power',
          duration: 15,
          exercises: [
            { name: 'Single-Leg RDL', sets: 3, reps: 8, weight: 'bodyweight + 20kg' },
            { name: 'Lateral Lunges', sets: 3, reps: 10, weight: '15kg DBs' },
            { name: 'Turkish Get-ups', sets: 3, reps: 5, weight: '16kg KB' },
            { name: 'Plank Variations', sets: 3, duration: 45 }
          ],
          intensity: 'moderate',
          equipment: ['Dumbbells', 'Kettlebells'],
          transitionTime: 45
        },
        {
          id: 'block-conditioning-2',
          type: 'interval',
          name: 'Rowing Pyramid',
          duration: 15,
          equipment: WorkoutEquipmentType.ROWING,
          intervals: [
            { type: 'work', duration: 60, targetPace: '1:45/500m', targetHR: 'zone4' },
            { type: 'rest', duration: 60, targetPace: '2:30/500m', targetHR: 'zone2' },
            { type: 'work', duration: 120, targetPace: '1:50/500m', targetHR: 'zone4' },
            { type: 'rest', duration: 90, targetPace: '2:30/500m', targetHR: 'zone2' },
            { type: 'work', duration: 180, targetPace: '1:55/500m', targetHR: 'zone3' },
            { type: 'rest', duration: 120, targetPace: '2:30/500m', targetHR: 'zone2' },
            { type: 'work', duration: 120, targetPace: '1:50/500m', targetHR: 'zone4' },
            { type: 'rest', duration: 90, targetPace: '2:30/500m', targetHR: 'zone2' },
            { type: 'work', duration: 60, targetPace: '1:45/500m', targetHR: 'zone4' }
          ],
          transitionTime: 60
        },
        {
          id: 'block-finisher',
          type: 'exercise',
          name: 'Core & Mobility',
          duration: 10,
          exercises: [
            { name: 'Dead Bug', sets: 2, reps: 10 },
            { name: 'Hip Flexor Stretch', duration: 60 },
            { name: 'Hamstring Stretch', duration: 60 },
            { name: 'Shoulder Rolls', reps: 10 }
          ],
          intensity: 'low',
          transitionTime: 0
        }
      ],
      equipment: ['Olympic Barbell', 'Dumbbells', 'Kettlebells', 'Air Bike', 'Rowing Machine'],
      difficulty: 'advanced',
      tags: ['circuit', 'crossfit', 'metabolic', 'power']
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: 'trainer-002'
  },

  // AGILITY WORKOUT with drills and patterns
  agility: {
    id: 'workout-agility-001',
    type: 'AGILITY',
    name: 'Elite Speed & Reaction Training',
    description: 'Comprehensive agility session targeting linear speed, change of direction, and reaction time',
    scheduledDate: date4DaysFromNow, // 4 days from now
    location: 'Training Center - Turf Field',
    estimatedDuration: 60,
    assignedPlayerIds: ['player-001', 'player-003', 'player-005'],
    agilityProgram: {
      id: 'agility-elite-001',
      name: 'Elite Hockey Agility Protocol',
      totalDuration: 60,
      phases: [
        {
          id: 'phase-warmup-agility',
          name: 'Movement Preparation',
          type: 'warmup',
          duration: 10,
          drills: [
            {
              id: 'drill-prep-1',
              name: 'Dynamic Leg Swings',
              pattern: 'linear',
              duration: 120,
              sets: 1,
              intensity: 'low',
              cones: 0,
              instructions: 'Forward/back and side to side, 15 each direction'
            },
            {
              id: 'drill-prep-2',
              name: 'High Knees March',
              pattern: 'linear',
              duration: 60,
              sets: 2,
              rest: 30,
              intensity: 'low',
              cones: 2,
              distance: 10,
              instructions: 'Focus on posture and knee lift'
            }
          ]
        },
        {
          id: 'phase-linear-speed',
          name: 'Linear Acceleration',
          type: 'main',
          duration: 15,
          drills: [
            {
              id: 'drill-accel-1',
              name: '10-Yard Acceleration',
              pattern: 'linear',
              distance: 10,
              sets: 6,
              rest: 120,
              intensity: 'high',
              cones: 2,
              timing: true,
              targetTime: 1.8, // seconds
              instructions: 'Full sprint from standing start. Focus on first 3 steps.',
              medicalModifications: {
                'player-001': 'Reduce to 75% effort due to back injury'
              }
            },
            {
              id: 'drill-accel-2',
              name: '20-Yard Build-ups',
              pattern: 'linear',
              distance: 20,
              sets: 4,
              rest: 150,
              intensity: 'moderate',
              cones: 3,
              instructions: '50% for 5 yards, 75% for 10 yards, 100% for final 5 yards'
            }
          ]
        },
        {
          id: 'phase-change-direction',
          name: 'Change of Direction',
          type: 'main',
          duration: 20,
          drills: [
            {
              id: 'drill-cod-1',
              name: '5-10-5 Pro Agility',
              pattern: 'pro-agility',
              sets: 5,
              rest: 180,
              intensity: 'high',
              cones: 3,
              distance: 5,
              timing: true,
              targetTime: 4.2,
              instructions: 'Start in 3-point stance. Touch lines with hand. Full sprint through finish.',
              technique: {
                startPosition: '3-point stance',
                bodyPosition: 'Low center of gravity',
                footwork: 'Plant and drive',
                armAction: 'Coordinated with legs'
              }
            },
            {
              id: 'drill-cod-2',
              name: 'T-Drill',
              pattern: 't-drill',
              sets: 4,
              rest: 180,
              intensity: 'high',
              cones: 4,
              distance: 5,
              timing: true,
              targetTime: 9.5,
              instructions: 'Forward, side shuffle right, side shuffle left through center, side shuffle right, backpedal to start',
              technique: {
                forwardRun: 'Aggressive arm drive',
                sideShuffles: 'Stay low, don\'t cross feet',
                backpedal: 'Maintain posture'
              }
            },
            {
              id: 'drill-cod-3',
              name: 'Hexagon Drill',
              pattern: 'hexagon',
              sets: 3,
              rest: 120,
              intensity: 'moderate',
              cones: 6,
              instructions: 'Face same direction throughout. Quick feet around hexagon.',
              timing: true,
              targetTime: 12.0
            }
          ]
        },
        {
          id: 'phase-reaction',
          name: 'Reaction Training',
          type: 'main',
          duration: 10,
          drills: [
            {
              id: 'drill-react-1',
              name: 'Mirror Drill',
              pattern: 'reactive',
              duration: 30,
              sets: 4,
              rest: 60,
              intensity: 'high',
              partnerRequired: true,
              instructions: 'Follow partner\'s movements. React to direction changes.',
              reactionTime: true
            },
            {
              id: 'drill-react-2',
              name: 'Light System Reaction',
              pattern: 'reactive',
              sets: 3,
              rest: 90,
              intensity: 'high',
              equipment: 'reaction-lights',
              instructions: 'Sprint to illuminated light as quickly as possible',
              reactionTime: true,
              targetReactionTime: 0.35 // seconds
            }
          ]
        },
        {
          id: 'phase-cooldown-agility',
          name: 'Movement Recovery',
          type: 'cooldown',
          duration: 5,
          drills: [
            {
              id: 'drill-cool-1',
              name: 'Walking Lunges',
              pattern: 'linear',
              distance: 20,
              sets: 2,
              intensity: 'low',
              instructions: 'Focus on hip flexor stretch and posture'
            },
            {
              id: 'drill-cool-2',
              name: 'Leg Swings - Cool Down',
              pattern: 'stationary',
              duration: 120,
              sets: 1,
              intensity: 'low',
              instructions: 'Gentle range of motion to cool down'
            }
          ]
        }
      ],
      equipment: ['Cones', 'Timing Gates', 'Reaction Lights', 'Agility Ladder'],
      difficulty: 'elite',
      tags: ['speed', 'agility', 'reaction', 'hockey-specific'],
      performanceMetrics: {
        linearSpeed: ['10-yard time', '20-yard time'],
        changeOfDirection: ['5-10-5 time', 't-drill time'],
        reactionTime: ['light reaction', 'movement reaction'],
        consistency: ['time variance', 'technique score']
      }
    },
    medicalCompliance: {
      restrictions: ['player-001'],
      alternatives: {
        'player-001': {
          '10-Yard Acceleration': 'Reduce to 75% effort',
          '5-10-5 Pro Agility': 'Reduce cutting intensity'
        }
      },
      warnings: [
        'Sidney Crosby - reduce explosive movements and cutting intensity'
      ]
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: 'trainer-003'
  },
  // WRESTLING WORKOUT with round-based structure
  wrestling: {
    id: 'workout-wrestling-001',
    type: 'WRESTLING',
    name: 'Wrestling Fundamentals & Technique Development',
    description: 'Round-based wrestling training focusing on basic techniques and partner drills',
    scheduledDate: date3DaysFromNow, // 3 days from now
    location: 'Performance Center - Wrestling Room',
    estimatedDuration: 75,
    assignedPlayerIds: ['player-001', 'player-002', 'player-003'],
    assignedTeamIds: ['team-001'],
    difficulty: 'BEGINNER',
    tags: ['wrestling', 'technique', 'partner-training', 'fundamentals'],
    equipment: ['Wrestling Mats', 'Timer', 'First Aid Kit', 'Mat Sanitizer'],
    program: {
      id: 'wrestling-program-001',
      name: 'Wrestling Fundamentals & Technique Development',
      description: 'Introduction to wrestling basics with partner assignments',
      focus: 'technique',
      totalDuration: 75,
      difficultyLevel: 'beginner',
      rounds: [
        {
          id: 'round-warmup',
          name: 'Dynamic Wrestling Warm-up',
          type: 'warmup',
          duration: 600, // 10 minutes
          restPeriod: 0,
          intensity: 'technique',
          techniques: [],
          instructions: 'Joint mobility, wrestling-specific movements, and light stretching',
          partnerRotation: false,
          scoring: { trackAttempts: false, trackSuccesses: false, trackTechnique: false },
          safetyProtocol: { tapOutAllowed: false, timeLimit: false, supervision: 'coach' },
          equipment: ['Wrestling Mats'],
          matSpace: 'full'
        },
        {
          id: 'round-technique-1',
          name: 'Basic Takedown Techniques',
          type: 'technique',
          duration: 900, // 15 minutes
          restPeriod: 120, // 2 minutes
          intensity: 'technique',
          techniques: [
            {
              id: 'double_leg',
              name: 'Double Leg Takedown',
              type: 'takedown',
              category: 'standing',
              difficulty: 'beginner',
              description: 'Classic double leg attack with proper setup',
              keyPoints: ['Penetration step', 'Head positioning', 'Lift and drive'],
              commonMistakes: ['Reaching', 'No setup', 'Poor head position'],
              variations: ['Blast double', 'High double', 'Low double'],
              safetyNotes: ['Control the fall', "Don't spike partner"],
              partnerRequirements: {
                minExperience: 'beginner',
                weightDifference: 20,
                skillLevel: 'any'
              }
            }
          ],
          instructions: 'Practice double leg takedowns with controlled intensity',
          partnerRotation: false,
          scoring: { trackAttempts: true, trackSuccesses: true, trackTechnique: true },
          safetyProtocol: { tapOutAllowed: true, timeLimit: true, supervision: 'coach' },
          equipment: ['Wrestling Mats'],
          matSpace: 'quarter'
        },
        {
          id: 'round-drilling',
          name: 'Takedown Drilling',
          type: 'drilling',
          duration: 1200, // 20 minutes
          restPeriod: 180, // 3 minutes
          intensity: 'drilling',
          techniques: [
            {
              id: 'single_leg',
              name: 'Single Leg Takedown',
              type: 'takedown',
              category: 'standing',
              difficulty: 'intermediate',
              description: 'Basic single leg attack from neutral position',
              keyPoints: ['Level change', 'Head placement', 'Drive through'],
              commonMistakes: ['Head too high', 'No follow-through', 'Poor timing'],
              variations: ['High single', 'Low single', 'Single leg sweep'],
              safetyNotes: ['Control descent', "Protect partner's knee"],
              partnerRequirements: {
                minExperience: 'beginner',
                weightDifference: 15,
                skillLevel: 'any'
              }
            }
          ],
          instructions: 'Controlled repetition of single leg takedowns with resistance',
          partnerRotation: true,
          scoring: { trackAttempts: true, trackSuccesses: true, trackTechnique: true },
          safetyProtocol: { tapOutAllowed: true, timeLimit: true, supervision: 'coach' },
          equipment: ['Wrestling Mats'],
          matSpace: 'quarter'
        },
        {
          id: 'round-conditioning',
          name: 'Wrestling Conditioning',
          type: 'conditioning',
          duration: 600, // 10 minutes
          restPeriod: 120, // 2 minutes
          intensity: 'live',
          techniques: [],
          instructions: 'High-intensity wrestling movements and cardio',
          partnerRotation: false,
          scoring: { trackAttempts: false, trackSuccesses: false, trackTechnique: false },
          safetyProtocol: { tapOutAllowed: true, timeLimit: true, supervision: 'coach' },
          equipment: ['Wrestling Mats'],
          matSpace: 'full'
        },
        {
          id: 'round-cooldown',
          name: 'Cool-down & Stretching',
          type: 'cooldown',
          duration: 600, // 10 minutes
          restPeriod: 0,
          intensity: 'technique',
          techniques: [],
          instructions: 'Static stretching and breathing exercises',
          partnerRotation: false,
          scoring: { trackAttempts: false, trackSuccesses: false, trackTechnique: false },
          safetyProtocol: { tapOutAllowed: false, timeLimit: false, supervision: 'coach' },
          equipment: ['Wrestling Mats'],
          matSpace: 'full'
        }
      ],
      partnerPairings: [
        {
          id: 'pairing-001',
          player1: { id: 'player-001', name: 'Sidney Crosby' },
          player2: { id: 'player-002', name: 'Nathan MacKinnon' },
          weightDifference: 5,
          experienceMatch: 'good',
          compatibility: 85,
          notes: 'Similar experience level, good size match'
        }
      ],
      matRequirements: {
        mats: 2,
        size: 'practice',
        spacing: 3
      },
      safetyChecklist: [
        'Proper warm-up completed',
        'Mats inspected and clean',
        'First aid kit accessible',
        'Emergency procedures reviewed',
        'All participants understand tap-out rules'
      ],
      progressionNotes: 'Focus on technique over intensity. Ensure all participants understand safety protocols.'
    },
    coachNotes: 'First wrestling session for team - emphasize safety and proper technique',
    medicalAlerts: ['Sidney Crosby - avoid explosive takedowns due to back strain'],
    intensity: 'medium',
    preview: {
      rounds: ['Warm-up', 'Takedown Techniques', 'Drilling', 'Conditioning', 'Cool-down'],
      totalDuration: '75 minutes',
      focusAreas: ['Basic Takedowns', 'Partner Drills', 'Wrestling Conditioning']
    }
  }
};

// ============================================================================
// ACTIVE WORKOUT SESSIONS WITH REAL-TIME DATA
// ============================================================================

export const activeWorkoutSessions = [
  {
    id: 'session-live-001',
    workoutId: 'workout-conditioning-001',
    name: 'VO2 Max Development Protocol',
    type: 'CONDITIONING',
    status: 'active',
    startTime: new Date(Date.now() - 20 * 60 * 1000), // Started 20 minutes ago
    estimatedEndTime: new Date(Date.now() + 40 * 60 * 1000), // 40 minutes remaining
    currentPhase: 'work-2',
    participants: [
      {
        playerId: 'player-002',
        name: 'Nathan MacKinnon',
        status: 'active',
        currentInterval: 'work-2',
        timeInInterval: 120, // 2 minutes into 4-minute interval
        liveMetrics: {
          heartRate: 185, // Currently in zone 5
          targetHeartRate: 178, // 90% max HR
          watts: 285, // Slightly below target
          targetWatts: 295,
          pace: '1:52', // per 500m
          targetPace: '1:50',
          rpm: 28,
          compliance: 92, // % on target
          zone: 5,
          targetZone: 5,
          effortLevel: 8.5
        },
        intervalProgress: {
          completed: 1, // Completed intervals
          current: 2,   // Current interval
          total: 4,     // Total work intervals
          timeRemaining: 120 // Seconds left in current interval
        }
      },
      {
        playerId: 'player-003',
        name: 'Connor McDavid',
        status: 'active',
        currentInterval: 'work-2',
        timeInInterval: 120,
        liveMetrics: {
          heartRate: 188,
          targetHeartRate: 180, // 90% max HR
          watts: 298,
          targetWatts: 292, // 90% of FTP
          pace: '1:49',
          targetPace: '1:48',
          rpm: 30,
          compliance: 96,
          zone: 5,
          targetZone: 5,
          effortLevel: 8.8
        },
        intervalProgress: {
          completed: 1,
          current: 2,
          total: 4,
          timeRemaining: 120
        }
      },
      {
        playerId: 'player-004',
        name: 'Auston Matthews',
        status: 'active', 
        currentInterval: 'work-2',
        timeInInterval: 120,
        liveMetrics: {
          heartRate: 175,
          targetHeartRate: 173, // 90% max HR
          watts: 268,
          targetWatts: 265, // 90% of FTP
          pace: '1:54',
          targetPace: '1:53',
          rpm: 26,
          compliance: 89,
          zone: 5,
          targetZone: 5,
          effortLevel: 8.2
        },
        intervalProgress: {
          completed: 1,
          current: 2,
          total: 4,
          timeRemaining: 120
        }
      }
    ],
    sessionMetrics: {
      averageCompliance: 92,
      peakHeartRates: {
        'player-002': 192,
        'player-003': 195,
        'player-004': 182
      },
      currentZoneDistribution: {
        zone1: 0,
        zone2: 0,
        zone3: 0,
        zone4: 15, // 15% of session so far
        zone5: 85  // 85% of session so far
      },
      alerts: [
        {
          playerId: 'player-004',
          type: 'performance',
          message: 'Heart rate below target zone',
          severity: 'low',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        }
      ]
    },
    equipment: {
      type: WorkoutEquipmentType.ROWING,
      assigned: {
        'player-002': 'Erg Station 1',
        'player-003': 'Erg Station 2', 
        'player-004': 'Erg Station 3'
      }
    },
    trainer: {
      id: 'trainer-001',
      name: 'Mike Johnson',
      status: 'monitoring'
    }
  },
  {
    id: 'session-live-002',
    workoutId: 'workout-strength-001',
    name: 'Elite Hockey Power Development',
    type: 'STRENGTH',
    status: 'active',
    startTime: new Date(Date.now() - 35 * 60 * 1000), // Started 35 minutes ago
    estimatedEndTime: new Date(Date.now() + 55 * 60 * 1000),
    currentPhase: 'phase-main',
    participants: [
      {
        playerId: 'player-001',
        name: 'Sidney Crosby',
        status: 'active',
        currentExercise: 'front-squat',
        currentSet: 3,
        totalSets: 4,
        liveMetrics: {
          weight: 30, // Modified due to injury
          targetWeight: 85, // Normal target
          reps: 8,
          targetReps: 4,
          rpe: 6, // Easier due to modification
          targetRpe: 8,
          restRemaining: 45, // seconds
          formScore: 9, // out of 10
          compliance: 100 // Following medical modifications
        },
        medicalStatus: 'modified',
        modifications: ['Using goblet squats instead', 'Weight limited to 30kg'],
        setHistory: [
          { set: 1, weight: 20, reps: 8, rpe: 4, completed: true },
          { set: 2, weight: 25, reps: 8, rpe: 5, completed: true },
          { set: 3, weight: 30, reps: 8, rpe: 6, completed: false }
        ]
      },
      {
        playerId: 'player-002',
        name: 'Nathan MacKinnon', 
        status: 'active',
        currentExercise: 'front-squat',
        currentSet: 3,
        totalSets: 4,
        liveMetrics: {
          weight: 85,
          targetWeight: 85,
          reps: 4,
          targetReps: 4,
          rpe: 8,
          targetRpe: 8,
          restRemaining: 45,
          formScore: 8,
          compliance: 95
        },
        medicalStatus: 'cleared',
        setHistory: [
          { set: 1, weight: 70, reps: 8, rpe: 6, completed: true },
          { set: 2, weight: 80, reps: 6, rpe: 7, completed: true },
          { set: 3, weight: 85, reps: 4, rpe: 8, completed: false }
        ]
      }
    ],
    sessionMetrics: {
      averageIntensity: 82, // % of prescribed load
      volumeCompleted: 68,  // % of total planned volume
      medicalCompliance: 100,
      formScores: {
        'player-001': 9.2,
        'player-002': 8.5
      },
      alerts: [
        {
          playerId: 'player-001',
          type: 'medical',
          message: 'Following modified program due to back injury',
          severity: 'info',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        }
      ]
    }
  }
];

// ============================================================================
// CALENDAR EVENTS WITH WORKOUT METADATA
// ============================================================================

export const workoutCalendarEvents = [
  // Today's events
  {
    id: 'cal-event-001',
    title: 'Elite Hockey Power Development',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    end: new Date(Date.now() + 3.5 * 60 * 60 * 1000),
    type: 'training-session',
    workoutType: 'STRENGTH',
    workoutId: 'workout-strength-001',
    status: 'scheduled',
    location: 'Performance Center - Weight Room A',
    participants: ['Sidney Crosby', 'Nathan MacKinnon', 'Connor McDavid'],
    equipment: ['Olympic Barbell', 'Bumper Plates', 'Squat Rack'],
    intensity: 'high',
    medicalAlerts: ['Sidney Crosby - modified program'],
    preview: {
      mainExercises: ['Power Clean', 'Front Squat', 'Lateral Bounds'],
      estimatedCalories: 380,
      targetMuscleGroups: ['Glutes', 'Quadriceps', 'Hamstrings', 'Core']
    }
  },
  {
    id: 'cal-event-002',
    title: 'VO2 Max Development Protocol',
    start: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow morning
    end: new Date(Date.now() + 26 * 60 * 60 * 1000),
    type: 'training-session',
    workoutType: 'CONDITIONING',
    workoutId: 'workout-conditioning-001',
    status: 'scheduled',
    location: 'Training Center - Cardio Lab',
    participants: ['Nathan MacKinnon', 'Connor McDavid', 'Auston Matthews'],
    equipment: ['Rowing Machine'],
    intensity: 'very-high',
    preview: {
      mainIntervals: ['4x4min @ 90% max HR'],
      estimatedCalories: 520,
      targetZones: ['Zone 5 - VO2 Max'],
      averageHeartRate: 175
    }
  },
  {
    id: 'cal-event-003',
    title: 'CrossFit Hockey Circuit',
    start: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
    end: new Date(Date.now() + 73.25 * 60 * 60 * 1000),
    type: 'training-session',
    workoutType: 'HYBRID',
    workoutId: 'workout-hybrid-001',
    status: 'scheduled',
    location: 'Performance Center - Functional Training Area',
    participants: ['Connor McDavid', 'Auston Matthews', 'Leon Draisaitl'],
    equipment: ['Olympic Barbell', 'Air Bike', 'Rowing Machine', 'Kettlebells'],
    intensity: 'very-high',
    preview: {
      blocks: ['Power Complex', 'Metabolic Blast', 'Functional Power'],
      estimatedCalories: 650,
      mixedTraining: true,
      workRestRatio: '1:1.5'
    }
  },
  {
    id: 'cal-event-004',
    title: 'Elite Speed & Reaction Training', 
    start: new Date(Date.now() + 96 * 60 * 60 * 1000), // 4 days from now
    end: new Date(Date.now() + 97 * 60 * 60 * 1000),
    type: 'training-session',
    workoutType: 'AGILITY',
    workoutId: 'workout-agility-001',
    status: 'scheduled',
    location: 'Training Center - Turf Field',
    participants: ['Sidney Crosby', 'Connor McDavid', 'Leon Draisaitl'],
    equipment: ['Cones', 'Timing Gates', 'Reaction Lights'],
    intensity: 'high',
    medicalAlerts: ['Sidney Crosby - reduced cutting intensity'],
    preview: {
      drills: ['5-10-5 Pro Agility', 'T-Drill', 'Reaction Training'],
      targetTimes: ['<4.2s (5-10-5)', '<9.5s (T-Drill)'],
      focusAreas: ['Linear Speed', 'Change of Direction', 'Reaction Time']
    }
  }
];

// ============================================================================
// PERFORMANCE ANALYTICS & STATISTICS
// ============================================================================

export const performanceAnalytics = {
  teamOverview: {
    totalWorkouts: 156,
    thisWeek: 12,
    averageIntensity: 7.8,
    complianceRate: 94.2,
    injuryRate: 3.8, // % of players
    peakPerformanceWeek: '2025-01-15',
    trends: {
      workoutVolume: [
        { week: '2025-01-08', volume: 85 },
        { week: '2025-01-15', volume: 92 },
        { week: '2025-01-22', volume: 88 },
        { week: '2025-01-29', volume: 94 }
      ],
      averageIntensity: [
        { week: '2025-01-08', intensity: 7.2 },
        { week: '2025-01-15', intensity: 7.8 },
        { week: '2025-01-22', intensity: 7.6 },
        { week: '2025-01-29', intensity: 8.1 }
      ],
      injuryRates: [
        { week: '2025-01-08', rate: 2.1 },
        { week: '2025-01-15', rate: 1.8 },
        { week: '2025-01-22', rate: 4.2 },
        { week: '2025-01-29', rate: 3.8 }
      ]
    }
  },
  
  individualMetrics: {
    'player-001': { // Sidney Crosby
      workoutsCompleted: 18,
      averageIntensity: 6.8, // Reduced due to injury
      complianceRate: 100,   // Following modifications perfectly
      improvementTrend: 'recovering',
      keyMetrics: {
        strengthGains: -5,    // % change (decline due to injury)
        cardioFitness: -2,    // % change
        powerOutput: -8,      // % change
        mobility: 15,         // % improvement (focus area)
        recoveryRate: 82
      },
      medicalStatus: {
        currentInjury: 'Lower Back Strain',
        daysInjured: 14,
        expectedReturn: '2025-02-15',
        complianceWithRestrictions: 100,
        alternativeExercises: 12
      },
      recentWorkouts: [
        { date: '2025-01-30', type: 'STRENGTH', intensity: 6, duration: 60, compliance: 100 },
        { date: '2025-01-28', type: 'CONDITIONING', intensity: 7, duration: 45, compliance: 98 },
        { date: '2025-01-25', type: 'AGILITY', intensity: 5, duration: 40, compliance: 100 }
      ]
    },
    
    'player-002': { // Nathan MacKinnon  
      workoutsCompleted: 22,
      averageIntensity: 8.4,
      complianceRate: 96.8,
      improvementTrend: 'improving',
      keyMetrics: {
        strengthGains: 8,
        cardioFitness: 12,
        powerOutput: 15,
        mobility: 6,
        recoveryRate: 91
      },
      medicalStatus: {
        currentInjury: 'Minor Shoulder Impingement',
        daysInjured: 7,
        expectedReturn: '2025-02-01',
        complianceWithRestrictions: 95,
        alternativeExercises: 3
      },
      recentWorkouts: [
        { date: '2025-01-30', type: 'CONDITIONING', intensity: 9, duration: 65, compliance: 94 },
        { date: '2025-01-28', type: 'HYBRID', intensity: 8, duration: 75, compliance: 98 },
        { date: '2025-01-26', type: 'STRENGTH', intensity: 8, duration: 80, compliance: 97 }
      ]
    },
    
    'player-003': { // Connor McDavid
      workoutsCompleted: 24,
      averageIntensity: 8.9,
      complianceRate: 98.2,
      improvementTrend: 'peak_form',
      keyMetrics: {
        strengthGains: 12,
        cardioFitness: 18,
        powerOutput: 22,
        mobility: 8,
        recoveryRate: 95
      },
      medicalStatus: {
        currentInjury: null,
        injuryRisk: 'very_low',
        lastInjury: '2024-11-15',  
        complianceWithPrevention: 100
      },
      recentWorkouts: [
        { date: '2025-01-30', type: 'AGILITY', intensity: 9, duration: 55, compliance: 100 },
        { date: '2025-01-29', type: 'CONDITIONING', intensity: 9, duration: 60, compliance: 96 },
        { date: '2025-01-27', type: 'HYBRID', intensity: 9, duration: 75, compliance: 99 }
      ]
    }
  },

  workoutTypeAnalytics: {
    STRENGTH: {
      totalSessions: 45,
      averageIntensity: 8.1,
      averageDuration: 78, // minutes
      completionRate: 96.2,
      popularExercises: [
        { name: 'Squat Variations', frequency: 42, avgWeight: 95 },
        { name: 'Deadlift Variations', frequency: 38, avgWeight: 115 },
        { name: 'Bench Press', frequency: 35, avgWeight: 85 },
        { name: 'Power Clean', frequency: 28, avgWeight: 75 }
      ],
      progressionTrends: {
        overallStrength: 14, // % improvement
        powerOutput: 18,     // % improvement
        volumeTolerance: 22  // % improvement
      }
    },
    
    CONDITIONING: {
      totalSessions: 52,
      averageIntensity: 8.5,
      averageDuration: 58,
      completionRate: 94.8,
      equipmentUsage: {
        [WorkoutEquipmentType.ROWING]: 22,
        [WorkoutEquipmentType.BIKE_ERG]: 18,
        [WorkoutEquipmentType.RUNNING]: 12
      },
      zoneDistribution: {
        zone1: 25, // % of total time
        zone2: 20,
        zone3: 15,
        zone4: 25,
        zone5: 15
      },
      progressionTrends: {
        vo2Max: 12,        // % improvement
        lactateThreshold: 8, // % improvement
        maxPower: 15       // % improvement
      }
    },

    HYBRID: {
      totalSessions: 38,
      averageIntensity: 8.7,
      averageDuration: 72,
      completionRate: 92.4,
      blockTypes: {
        exercise: 45,  // % of blocks
        interval: 35,  // % of blocks
        transition: 20 // % of blocks
      },
      popularCombinations: [
        'Strength + Rowing Intervals',
        'Olympic Lifts + Air Bike',
        'Bodyweight + Running'
      ],
      progressionTrends: {
        workCapacity: 20,    // % improvement
        powerEndurance: 16,  // % improvement
        transitionSpeed: 25  // % improvement
      }
    },

    AGILITY: {
      totalSessions: 21,
      averageIntensity: 7.8,
      averageDuration: 52,
      completionRate: 97.1,
      drillFrequency: {
        'Pro Agility (5-10-5)': 19,
        'T-Drill': 16,
        '20-Yard Shuttle': 14,
        'Hexagon Drill': 12,
        'Reaction Training': 15
      },
      performanceMetrics: {
        linearSpeed: {
          '10-yard': { average: 1.78, best: 1.65, improvement: 8 },
          '20-yard': { average: 3.12, best: 2.95, improvement: 6 }
        },
        changeOfDirection: {
          '5-10-5': { average: 4.18, best: 3.95, improvement: 12 },
          't-drill': { average: 9.32, best: 8.88, improvement: 10 }
        },
        reactionTime: {
          average: 0.342, // seconds
          best: 0.298,
          improvement: 15 // % improvement
        }
      }
    }
  },

  predictiveInsights: {
    injuryRisk: {
      'player-001': {
        risk: 'high',
        factors: ['current injury', 'training load spike', 'age'],
        recommendation: 'Continue modified program, focus on mobility',
        confidence: 87
      },
      'player-002': {
        risk: 'moderate',
        factors: ['minor shoulder issue', 'high training volume'],
        recommendation: 'Monitor shoulder exercises, ensure adequate rest',
        confidence: 72
      },
      'player-003': {
        risk: 'low',
        factors: ['excellent form', 'good recovery patterns'],
        recommendation: 'Maintain current training approach',
        confidence: 94
      }
    },
    
    performancePredictions: {
      'player-003': {
        vo2MaxPotential: 67.5, // ml/kg/min (current: 65.2)
        ftpPotential: 340,      // watts (current: 325)  
        strengthPotential: 105,  // % of current max
        timeframe: '6-8 weeks',
        confidence: 89
      }
    },

    trainingRecommendations: {
      team: [
        'Increase agility training frequency by 15%',
        'Add more hybrid sessions for work capacity',
        'Focus on recovery protocols for high-load players'
      ],
      individual: {
        'player-001': [
          'Continue rehabilitation protocol',
          'Increase mobility work to 20 min/session',
          'Begin progressive loading in week 3'
        ],
        'player-002': [
          'Reduce overhead pressing volume by 25%',
          'Add shoulder stability exercises',
          'Monitor for pain during lateral movements'
        ],
        'player-003': [
          'Increase VO2 max intervals to 2x/week',
          'Add power-endurance hybrid sessions',
          'Consider altitude training camp'
        ]
      }
    }
  }
};

// ============================================================================
// EXPORT EXAMPLES & REPORTS
// ============================================================================

export const exportExamples = {
  weeklyTeamReport: {
    title: 'Weekly Team Performance Report',
    dateRange: '2025-01-24 to 2025-01-30',
    summary: {
      totalWorkouts: 12,
      totalDuration: 14.5, // hours
      averageIntensity: 8.1,
      complianceRate: 94.2,
      injuriesReported: 1
    },
    sections: [
      {
        title: 'Workout Distribution',
        data: {
          STRENGTH: 4,
          CONDITIONING: 5,
          HYBRID: 2,
          AGILITY: 1
        }
      },
      {
        title: 'Individual Performance',
        players: [
          {
            name: 'Sidney Crosby',
            workouts: 3,
            compliance: 100,
            status: 'Modified program due to injury',
            notes: 'Following rehabilitation protocol'
          },
          {
            name: 'Nathan MacKinnon',
            workouts: 4,
            compliance: 96,
            status: 'Minor restrictions',
            notes: 'Avoiding overhead movements'
          }
        ]
      }
    ],
    recommendations: [
      'Continue modified program for Crosby',
      'Monitor MacKinnon shoulder symptoms',
      'Increase recovery protocols for high-volume players'
    ],
    nextWeekPlan: [
      'Schedule return-to-play assessment for Crosby',
      'Add extra mobility session for team',
      'Focus on speed development with McDavid'
    ]
  },

  individualProgressReport: {
    player: 'Connor McDavid',
    dateRange: '2025-01-01 to 2025-01-30',
    summary: {
      workoutsCompleted: 24,
      totalHours: 28.5,
      averageIntensity: 8.9,
      improvementScore: 94
    },
    fitnessMetrics: [
      {
        metric: 'VO2 Max',
        baseline: 62.8,
        current: 65.2,
        improvement: 3.8,
        percentile: 95
      },
      {
        metric: 'FTP (Watts)',
        baseline: 310,
        current: 325,
        improvement: 4.8,
        percentile: 92
      },
      {
        metric: '5-10-5 Agility',
        baseline: 4.22,
        current: 3.95,
        improvement: 6.4,
        percentile: 88
      }
    ],
    strengthProgress: [
      { exercise: 'Back Squat', baseline: 140, current: 155, improvement: 10.7 },
      { exercise: 'Power Clean', baseline: 95, current: 105, improvement: 10.5 },
      { exercise: 'Bench Press', baseline: 110, current: 118, improvement: 7.3 }
    ],
    recommendations: [
      'Continue current training intensity',
      'Add altitude training for further VO2 gains',
      'Focus on power-endurance for late-game performance'
    ]
  },

  medicalComplianceReport: {
    title: 'Medical Compliance & Injury Management',
    dateRange: '2025-01-24 to 2025-01-30',
    activeInjuries: [
      {
        player: 'Sidney Crosby',
        injury: 'Lower Back Strain',
        daysActive: 14,
        compliance: 100,
        modifications: 8,
        progress: 'Improving - pain reduced from 6/10 to 3/10'
      },
      {
        player: 'Nathan MacKinnon',
        injury: 'Shoulder Impingement',
        daysActive: 7,
        compliance: 95,
        modifications: 3,
        progress: 'Good - full range of motion returning'
      }
    ],
    complianceMetrics: {
      overallCompliance: 97.5,
      exerciseModifications: 11,
      restrictionViolations: 0,
      alternativeExercisesUsed: 15
    },
    returnToPlayStatus: [
      {
        player: 'Sidney Crosby',
        estimatedReturn: '2025-02-15',
        progressMarkers: ['Pain reduction', 'Mobility improvement', 'Load tolerance'],
        completedTests: 2,
        remainingTests: 4
      }
    ]
  }
};

// Export the comprehensive data
export const comprehensiveMockData = {
  players: comprehensivePlayerData,
  workouts: comprehensiveWorkoutExamples,
  activeSessions: activeWorkoutSessions,
  calendarEvents: workoutCalendarEvents,
  analytics: performanceAnalytics,
  exports: exportExamples
};