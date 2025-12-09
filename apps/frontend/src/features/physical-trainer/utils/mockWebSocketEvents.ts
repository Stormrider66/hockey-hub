import { io, Socket } from 'socket.io-client';
import {
  TrainingSessionSocketEvent,
  MedicalStatusChangedPayload,
  SessionProgressPayload,
  CalendarEventChangedPayload,
  PlayerAvailabilityChangedPayload,
  WorkoutTemplateUpdatedPayload,
  TeamAssignmentChangedPayload,
  StrengthSetCompletionPayload,
  ConditioningIntervalTransitionPayload,
  HybridBlockTransitionPayload,
  AgilityDrillCompletionPayload,
  BulkSessionOperationPayload,
  CrossSessionParticipantMoveEvent,
  AggregateMetricsBroadcastEvent,
} from '@hockey-hub/shared-types';

// Mock WebSocket event simulator for demo purposes
export class MockWebSocketEventSimulator {
  private socket: Socket | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private eventIndex = 0;

  // PHASE 3.3: Enhanced mock events with type-specific events
  private mockEvents = [
    // Type-specific workout events
    {
      type: TrainingSessionSocketEvent.STRENGTH_SET_COMPLETION,
      delay: 8000,
      payload: {
        sessionId: 'session-1',
        playerId: 'player-1',
        exerciseId: 'exercise-1',
        exerciseName: 'Barbell Back Squat',
        setData: {
          setNumber: 2,
          totalSets: 4,
          reps: 8,
          weight: 100,
          weightUnit: 'kg',
          rpe: 7,
          tempo: '3-1-2-1',
          formRating: 4
        },
        nextSetPreview: {
          weight: 102.5,
          targetReps: 8,
          estimatedRest: 120
        }
      } as StrengthSetCompletionPayload,
    },
    {
      type: TrainingSessionSocketEvent.CONDITIONING_INTERVAL_TRANSITION,
      delay: 12000,
      payload: {
        sessionId: 'session-2',
        playerId: 'player-2',
        transition: {
          fromInterval: { name: 'Work Interval', type: 'work', intensity: 8 },
          toInterval: { name: 'Recovery', type: 'rest', intensity: 3, duration: 60 }
        },
        metrics: {
          lastIntervalAvgHR: 165,
          zoneCompliance: 85,
          powerAverage: 250
        }
      } as ConditioningIntervalTransitionPayload,
    },
    {
      type: TrainingSessionSocketEvent.HYBRID_BLOCK_TRANSITION,
      delay: 18000,
      payload: {
        sessionId: 'session-3',
        playerId: 'player-3',
        blockTransition: {
          fromBlock: { id: 'block-1', type: 'exercise', name: 'Push-ups' },
          toBlock: { id: 'block-2', type: 'interval', name: 'Bike Sprint', estimatedDuration: 300 }
        },
        overallProgress: 45,
        adaptiveAdjustments: {
          intensityModifier: 0.9,
          durationModifier: 1.1,
          reason: 'Player showing signs of fatigue'
        }
      } as HybridBlockTransitionPayload,
    },
    {
      type: TrainingSessionSocketEvent.AGILITY_DRILL_COMPLETION,
      delay: 22000,
      payload: {
        sessionId: 'session-4',
        playerId: 'player-4',
        drillResult: {
          drillId: 'drill-1',
          drillName: 'T-Drill',
          attemptNumber: 3,
          completionTime: 9800, // 9.8 seconds
          errors: [
            { type: 'cone_contact', description: 'Touched cone at position 2' }
          ],
          performanceRating: 'good',
          improvement: {
            fromPrevious: -200, // 0.2 seconds improvement
            fromBest: 300, // 0.3 seconds slower than best
            trend: 'improving'
          }
        }
      } as AgilityDrillCompletionPayload,
    },
    // Bulk session events
    {
      type: TrainingSessionSocketEvent.BULK_SESSION_CREATED,
      delay: 6000,
      payload: {
        bundleId: 'bundle-morning-training',
        bundleName: 'Morning Training Block',
        sessionIds: ['session-strength', 'session-conditioning', 'session-agility'],
        workoutTypes: ['strength', 'conditioning', 'agility'],
        totalParticipants: 24,
        createdAt: new Date(),
        scheduledStart: new Date(Date.now() + 600000), // 10 minutes from now
        estimatedDuration: 90,
        facilitiesRequired: ['Gym A', 'Cardio Room', 'Field'],
        equipmentRequired: ['Barbells', 'Rowing Machines', 'Cones']
      },
    },
    {
      type: TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE,
      delay: 26000,
      payload: {
        bundleId: 'bundle-morning-training',
        playerId: 'player-5',
        playerName: 'Alex Johnson',
        fromSession: {
          sessionId: 'session-strength',
          workoutType: 'strength',
          currentParticipants: 8
        },
        toSession: {
          sessionId: 'session-conditioning',
          workoutType: 'conditioning',
          currentParticipants: 7
        },
        moveReason: 'medical_restriction',
        medicalNotes: 'Avoid heavy lifting, focus on cardio rehabilitation',
        preserveProgress: false,
        estimatedImpact: {
          delayMinutes: 3,
          workoutModification: 'major'
        },
        approvedBy: 'trainer-1'
      } as CrossSessionParticipantMoveEvent,
    },
    {
      type: TrainingSessionSocketEvent.AGGREGATE_METRICS_BROADCAST,
      delay: 35000,
      payload: {
        bundleId: 'bundle-morning-training',
        aggregatedMetrics: {
          totalParticipants: 24,
          activeParticipants: 22,
          completedParticipants: 2,
          averageProgress: 67,
          averageHeartRate: 145,
          totalCaloriesBurned: 1850,
          byWorkoutType: {
            strength: { participants: 8, avgProgress: 75, avgIntensity: 7, completionRate: 12.5 },
            conditioning: { participants: 8, avgProgress: 65, avgIntensity: 8, completionRate: 0 },
            hybrid: { participants: 4, avgProgress: 55, avgIntensity: 6, completionRate: 25 },
            agility: { participants: 4, avgProgress: 80, avgIntensity: 5, completionRate: 25 }
          },
          performanceAlerts: [
            {
              type: 'high_fatigue',
              playerId: 'player-6',
              sessionId: 'session-conditioning',
              severity: 'medium',
              message: 'Heart rate above target zone for extended period'
            }
          ],
          resourceUtilization: {
            facilities: [
              { name: 'Gym A', utilizationPercent: 100 },
              { name: 'Cardio Room', utilizationPercent: 85 },
              { name: 'Field', utilizationPercent: 60 }
            ],
            equipment: [
              { type: 'Barbells', inUse: 8, available: 12 },
              { type: 'Rowing Machines', inUse: 6, available: 8 },
              { type: 'Cones', inUse: 20, available: 50 }
            ]
          }
        }
      } as AggregateMetricsBroadcastEvent,
    },
    // Medical status change event
    {
      type: TrainingSessionSocketEvent.MEDICAL_STATUS_CHANGED,
      delay: 5000, // 5 seconds after start
      payload: {
        playerId: 'player-1',
        previousStatus: 'healthy',
        newStatus: 'limited',
        restrictions: ['No contact drills', 'Limit high-intensity cardio'],
        updatedBy: 'Dr. Smith',
        timestamp: new Date(),
      } as MedicalStatusChangedPayload,
    },
    // Session progress event
    {
      type: TrainingSessionSocketEvent.SESSION_PROGRESS,
      delay: 10000, // 10 seconds
      payload: {
        sessionId: 'session-1',
        workoutId: 'workout-1',
        progress: 35,
        currentPhase: 'Warm-up Complete',
        exercisesCompleted: 3,
        totalExercises: 12,
        playersActive: 8,
        playersCompleted: 0,
        timestamp: new Date(),
      } as SessionProgressPayload,
    },
    // Calendar event changed
    {
      type: TrainingSessionSocketEvent.CALENDAR_EVENT_CHANGED,
      delay: 15000, // 15 seconds
      payload: {
        eventId: 'event-1',
        eventType: 'created',
        event: {
          id: 'event-1',
          title: 'Emergency Team Meeting',
          type: 'meeting',
          startTime: new Date(Date.now() + 3600000), // 1 hour from now
          endTime: new Date(Date.now() + 5400000), // 1.5 hours from now
          teamId: 'team-1',
        },
        changedBy: 'Head Coach',
        timestamp: new Date(),
      } as CalendarEventChangedPayload,
    },
    // Player availability change
    {
      type: TrainingSessionSocketEvent.PLAYER_AVAILABILITY_CHANGED,
      delay: 20000, // 20 seconds
      payload: {
        playerId: 'player-2',
        date: new Date(),
        previousAvailability: 'available',
        newAvailability: 'unavailable',
        reason: 'Personal reasons',
        affectedSessions: ['session-2', 'session-3'],
        timestamp: new Date(),
      } as PlayerAvailabilityChangedPayload,
    },
    // Session progress update
    {
      type: TrainingSessionSocketEvent.SESSION_PROGRESS,
      delay: 25000, // 25 seconds
      payload: {
        sessionId: 'session-1',
        workoutId: 'workout-1',
        progress: 75,
        currentPhase: 'Main Workout',
        exercisesCompleted: 9,
        totalExercises: 12,
        playersActive: 6,
        playersCompleted: 2,
        timestamp: new Date(),
      } as SessionProgressPayload,
    },
    // Medical status cleared
    {
      type: TrainingSessionSocketEvent.MEDICAL_STATUS_CHANGED,
      delay: 30000, // 30 seconds
      payload: {
        playerId: 'player-3',
        previousStatus: 'injured',
        newStatus: 'healthy',
        clearedDate: new Date(),
        updatedBy: 'Dr. Johnson',
        timestamp: new Date(),
      } as MedicalStatusChangedPayload,
    },
    // Workout template shared
    {
      type: TrainingSessionSocketEvent.WORKOUT_TEMPLATE_UPDATED,
      delay: 35000, // 35 seconds
      payload: {
        templateId: 'template-1',
        templateName: 'Elite Speed Development',
        updateType: 'shared',
        updatedBy: 'Head Trainer',
        sharedWith: ['trainer-2', 'trainer-3'],
        timestamp: new Date(),
      } as WorkoutTemplateUpdatedPayload,
    },
    // Team assignment change
    {
      type: TrainingSessionSocketEvent.TEAM_ASSIGNMENT_CHANGED,
      delay: 40000, // 40 seconds
      payload: {
        playerId: 'player-4',
        previousTeamId: 'team-2',
        newTeamId: 'team-1',
        effectiveDate: new Date(),
        updatedBy: 'Club Admin',
        timestamp: new Date(),
      } as TeamAssignmentChangedPayload,
    },
    // Session completed
    {
      type: TrainingSessionSocketEvent.SESSION_PROGRESS,
      delay: 45000, // 45 seconds
      payload: {
        sessionId: 'session-1',
        workoutId: 'workout-1',
        progress: 100,
        currentPhase: 'Cool-down Complete',
        exercisesCompleted: 12,
        totalExercises: 12,
        playersActive: 0,
        playersCompleted: 8,
        timestamp: new Date(),
      } as SessionProgressPayload,
    },
  ];

  constructor(private namespace: string = '/training') {}

  // Start simulating events
  start(socket: Socket) {
    this.socket = socket;
    this.eventIndex = 0;

    console.log('Starting mock WebSocket event simulation...');

    // Schedule events
    this.mockEvents.forEach((event, index) => {
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.simulateEvent(event.type, event.payload);
        }
      }, event.delay);
    });

    // Also simulate periodic session progress updates
    this.intervalId = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.simulateRandomSessionProgress();
      }
    }, 30000); // Every 30 seconds
  }

  // Stop simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Stopped mock WebSocket event simulation');
  }

  // Simulate a specific event
  private simulateEvent(eventType: string, payload: any) {
    if (!this.socket || !this.socket.connected) return;

    // Update timestamps to current time
    const updatedPayload = {
      ...payload,
      timestamp: new Date(),
    };

    console.log(`Simulating ${eventType} event:`, updatedPayload);
    
    // Emit the event as if it came from the server
    // We need to trigger the event handler directly since we can't emit from client
    this.socket.emit('__mock_event__', { type: eventType, payload: updatedPayload });
  }

  // Simulate random session progress
  private simulateRandomSessionProgress() {
    const sessions = ['session-1', 'session-2', 'session-3'];
    const sessionId = sessions[Math.floor(Math.random() * sessions.length)];
    const progress = Math.floor(Math.random() * 100);
    
    const payload: SessionProgressPayload = {
      sessionId,
      workoutId: `workout-${Math.floor(Math.random() * 3) + 1}`,
      progress,
      currentPhase: progress < 25 ? 'Warm-up' : progress < 75 ? 'Main Workout' : 'Cool-down',
      exercisesCompleted: Math.floor(progress / 8),
      totalExercises: 12,
      playersActive: Math.floor(Math.random() * 10) + 1,
      playersCompleted: Math.floor(Math.random() * 5),
      timestamp: new Date(),
    };

    this.simulateEvent(TrainingSessionSocketEvent.SESSION_PROGRESS, payload);
  }
  
  // PHASE 3.3: Enhanced simulation methods for type-specific events
  
  simulateStrengthProgress(sessionId: string = 'session-1', playerId: string = 'player-1') {
    const exercises = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Bent-over Row'];
    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    
    const payload: StrengthSetCompletionPayload = {
      sessionId,
      playerId,
      exerciseId: `ex-${exercise.toLowerCase().replace(/\s+/g, '-')}`,
      exerciseName: exercise,
      setData: {
        setNumber: Math.floor(Math.random() * 4) + 1,
        totalSets: 4,
        reps: Math.floor(Math.random() * 5) + 6, // 6-10 reps
        weight: Math.floor(Math.random() * 50) + 60, // 60-110 kg
        weightUnit: 'kg',
        rpe: Math.floor(Math.random() * 4) + 6, // RPE 6-9
        tempo: '3-1-2-1',
        formRating: Math.floor(Math.random() * 2) + 4 // 4-5
      },
      nextSetPreview: {
        weight: Math.floor(Math.random() * 50) + 62,
        targetReps: Math.floor(Math.random() * 3) + 7,
        estimatedRest: Math.floor(Math.random() * 60) + 90
      },
      timestamp: new Date()
    };
    
    this.simulateEvent(TrainingSessionSocketEvent.STRENGTH_SET_COMPLETION, payload);
  }
  
  simulateConditioningProgress(sessionId: string = 'session-2', playerId: string = 'player-2') {
    const intervals = [
      { name: 'Work', type: 'work', intensity: 8 },
      { name: 'Recovery', type: 'rest', intensity: 3 },
      { name: 'High Intensity', type: 'work', intensity: 9 },
      { name: 'Active Recovery', type: 'rest', intensity: 4 }
    ];
    
    const fromInterval = intervals[Math.floor(Math.random() * intervals.length)];
    const toInterval = intervals[Math.floor(Math.random() * intervals.length)];
    
    const payload: ConditioningIntervalTransitionPayload = {
      sessionId,
      playerId,
      transition: {
        fromInterval,
        toInterval: { ...toInterval, duration: Math.floor(Math.random() * 120) + 30 }
      },
      metrics: {
        lastIntervalAvgHR: Math.floor(Math.random() * 50) + 140,
        zoneCompliance: Math.floor(Math.random() * 30) + 70,
        powerAverage: Math.floor(Math.random() * 100) + 200
      },
      timestamp: new Date()
    };
    
    this.simulateEvent(TrainingSessionSocketEvent.CONDITIONING_INTERVAL_TRANSITION, payload);
  }
  
  simulateHybridProgress(sessionId: string = 'session-3', playerId: string = 'player-3') {
    const blockTypes = ['exercise', 'interval', 'transition'];
    const exercises = ['Push-ups', 'Pull-ups', 'Burpees', 'Mountain Climbers'];
    const intervals = ['Bike Sprint', 'Row Intervals', 'Treadmill Run', 'Battle Ropes'];
    
    const fromType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
    const toType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
    
    const payload: HybridBlockTransitionPayload = {
      sessionId,
      playerId,
      blockTransition: {
        fromBlock: {
          id: `block-${Math.floor(Math.random() * 10)}`,
          type: fromType,
          name: fromType === 'exercise' ? exercises[Math.floor(Math.random() * exercises.length)] : 
                fromType === 'interval' ? intervals[Math.floor(Math.random() * intervals.length)] : 'Transition'
        },
        toBlock: {
          id: `block-${Math.floor(Math.random() * 10)}`,
          type: toType,
          name: toType === 'exercise' ? exercises[Math.floor(Math.random() * exercises.length)] : 
                toType === 'interval' ? intervals[Math.floor(Math.random() * intervals.length)] : 'Transition',
          estimatedDuration: Math.floor(Math.random() * 300) + 60
        }
      },
      overallProgress: Math.floor(Math.random() * 100),
      adaptiveAdjustments: {
        intensityModifier: 0.8 + Math.random() * 0.4, // 0.8 - 1.2
        durationModifier: 0.9 + Math.random() * 0.2, // 0.9 - 1.1
        reason: Math.random() > 0.5 ? 'Performance exceeding expectations' : 'Adjusting for fatigue levels'
      },
      timestamp: new Date()
    };
    
    this.simulateEvent(TrainingSessionSocketEvent.HYBRID_BLOCK_TRANSITION, payload);
  }
  
  simulateAgilityProgress(sessionId: string = 'session-4', playerId: string = 'player-4') {
    const drills = [
      { name: 'T-Drill', id: 't-drill', pattern: 'T-formation' },
      { name: '5-10-5 Shuttle', id: 'shuttle', pattern: '5-10-5' },
      { name: 'Ladder Drill', id: 'ladder', pattern: 'In-In-Out-Out' },
      { name: 'Cone Weave', id: 'weave', pattern: 'Serpentine' }
    ];
    
    const drill = drills[Math.floor(Math.random() * drills.length)];
    const errorTypes = ['cone_contact', 'false_start', 'incomplete_pattern', 'foot_fault'];
    const ratings = ['excellent', 'good', 'average', 'needs_improvement'];
    
    const payload: AgilityDrillCompletionPayload = {
      sessionId,
      playerId,
      drillResult: {
        drillId: drill.id,
        drillName: drill.name,
        attemptNumber: Math.floor(Math.random() * 5) + 1,
        completionTime: Math.floor(Math.random() * 3000) + 8000, // 8-11 seconds in ms
        errors: Math.random() > 0.7 ? [
          {
            type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
            description: 'Simulated error description'
          }
        ] : [],
        performanceRating: ratings[Math.floor(Math.random() * ratings.length)] as any,
        improvement: {
          fromPrevious: Math.floor(Math.random() * 1000) - 500, // -500ms to +500ms
          fromBest: Math.floor(Math.random() * 1000),
          trend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining'
        }
      },
      timestamp: new Date()
    };
    
    this.simulateEvent(TrainingSessionSocketEvent.AGILITY_DRILL_COMPLETION, payload);
  }
  
  simulateBulkOperation(bundleId: string = 'test-bundle', operation: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all' = 'start_all') {
    const sessionIds = ['session-1', 'session-2', 'session-3', 'session-4'];
    
    const payload: BulkSessionOperationPayload = {
      bundleId,
      operation,
      affectedSessions: sessionIds,
      operationStatus: 'in_progress',
      progress: {
        completed: Math.floor(Math.random() * sessionIds.length),
        total: sessionIds.length,
        errors: Math.random() > 0.8 ? ['session-3'] : []
      },
      executedBy: 'trainer-demo',
      estimatedCompletion: new Date(Date.now() + 30000), // 30 seconds from now
      timestamp: new Date()
    };
    
    this.simulateEvent(TrainingSessionSocketEvent.BULK_OPERATION_STATUS, payload);
  }

  // Manually trigger specific events for testing
  triggerMedicalStatusChange(playerId: string, newStatus: 'healthy' | 'injured' | 'limited' | 'recovery') {
    const payload: MedicalStatusChangedPayload = {
      playerId,
      previousStatus: 'healthy',
      newStatus,
      restrictions: newStatus === 'limited' ? ['No contact', 'Light cardio only'] : undefined,
      updatedBy: 'Test User',
      timestamp: new Date(),
    };
    this.simulateEvent(TrainingSessionSocketEvent.MEDICAL_STATUS_CHANGED, payload);
  }

  triggerCalendarEventChange(eventType: 'created' | 'updated' | 'deleted') {
    const payload: CalendarEventChangedPayload = {
      eventId: `event-${Date.now()}`,
      eventType,
      event: {
        id: `event-${Date.now()}`,
        title: `Test ${eventType} Event`,
        type: 'training',
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        teamId: 'team-1',
      },
      changedBy: 'Test User',
      timestamp: new Date(),
    };
    this.simulateEvent(TrainingSessionSocketEvent.CALENDAR_EVENT_CHANGED, payload);
  }
  
  // Enhanced test methods for all workout types
  triggerStrengthSet(sessionId?: string, playerId?: string) {
    this.simulateStrengthProgress(sessionId, playerId);
  }
  
  triggerConditioningTransition(sessionId?: string, playerId?: string) {
    this.simulateConditioningProgress(sessionId, playerId);
  }
  
  triggerHybridBlock(sessionId?: string, playerId?: string) {
    this.simulateHybridProgress(sessionId, playerId);
  }
  
  triggerAgilityDrill(sessionId?: string, playerId?: string) {
    this.simulateAgilityProgress(sessionId, playerId);
  }

  // PHASE 5.2: New Workout Type Event Simulators
  
  simulateStabilityCoreProgress(sessionId: string = 'session-5', playerId: string = 'player-5') {
    const exercises = [
      'Single Leg Balance', 'Bosu Ball Stand', 'Plank Hold', 'Side Plank', 'Dead Bug',
      'Bird Dog', 'Stability Ball Roll-out', 'Balance Board Squat'
    ];
    const surfaces = ['stable', 'foam', 'bosu', 'balance_board', 'stability_ball'];
    const difficulties = ['eyes_open', 'eyes_closed', 'single_leg', 'dynamic', 'perturbation'];
    
    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    const surface = surfaces[Math.floor(Math.random() * surfaces.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // Simulate balance update event
    const balancePayload = {
      sessionId,
      playerId,
      exerciseId: `ex-${exercise.toLowerCase().replace(/\s+/g, '-')}`,
      exerciseName: exercise,
      balanceMetrics: {
        centerOfGravityX: Math.floor(Math.random() * 200) - 100, // -100 to 100
        centerOfGravityY: Math.floor(Math.random() * 200) - 100,
        stabilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        swayVelocity: Math.random() * 50 + 10, // 10-60 mm/s
        balanceConfidence: Math.floor(Math.random() * 40) + 60 // 60-100
      },
      holdProgress: {
        currentHoldTime: Math.floor(Math.random() * 45) + 5, // 5-50 seconds
        targetHoldTime: 30,
        holdNumber: Math.floor(Math.random() * 3) + 1,
        totalHolds: 3,
        isHolding: Math.random() > 0.3
      },
      surfaceType: surface as any,
      difficulty: difficulty as any,
      timestamp: new Date()
    };
    
    this.simulateEvent('STABILITY_CORE_BALANCE_UPDATE', balancePayload);
    
    // Sometimes also simulate hold completion
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const holdCompletionPayload = {
          sessionId,
          playerId,
          exerciseId: balancePayload.exerciseId,
          exerciseName: exercise,
          holdNumber: balancePayload.holdProgress.holdNumber,
          totalHolds: 3,
          holdDuration: Math.floor(Math.random() * 35) + 15, // 15-50 seconds
          targetDuration: 30,
          completionStatus: Math.random() > 0.8 ? 'partial' : 'completed' as any,
          performanceMetrics: {
            averageStability: Math.floor(Math.random() * 30) + 70,
            peakInstability: Math.floor(Math.random() * 40) + 10,
            recoveryTime: Math.random() * 3 + 0.5,
            qualityScore: Math.floor(Math.random() * 2) + 3 // 3-5
          },
          progressionRecommendation: {
            nextDifficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            holdTimeAdjustment: Math.floor(Math.random() * 10) - 5,
            surfaceProgression: surfaces[Math.floor(Math.random() * surfaces.length)]
          },
          restTimeRemaining: Math.floor(Math.random() * 60) + 30,
          timestamp: new Date()
        };
        
        this.simulateEvent('STABILITY_CORE_HOLD_COMPLETION', holdCompletionPayload);
      }, 2000);
    }
  }
  
  simulatePlyometricsProgress(sessionId: string = 'session-6', playerId: string = 'player-6') {
    const exercises = [
      'Box Jumps', 'Depth Jumps', 'Broad Jumps', 'Lateral Bounds', 'Single Leg Hops',
      'Reactive Jumps', 'Split Jumps', 'Tuck Jumps'
    ];
    const jumpTypes = ['vertical', 'broad', 'lateral', 'reactive', 'depth', 'box'];
    
    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
    const jumpType = jumpTypes[Math.floor(Math.random() * jumpTypes.length)];
    
    // Simulate jump measurement event
    const jumpMeasurementPayload = {
      sessionId,
      playerId,
      exerciseId: `ex-${exercise.toLowerCase().replace(/\s+/g, '-')}`,
      exerciseName: exercise,
      jumpType: jumpType as any,
      jumpNumber: Math.floor(Math.random() * 8) + 1,
      totalJumps: 8,
      measurements: {
        height: jumpType === 'vertical' ? Math.floor(Math.random() * 20) + 40 : undefined, // 40-60cm
        distance: ['broad', 'lateral'].includes(jumpType) ? Math.floor(Math.random() * 50) + 150 : undefined, // 150-200cm
        contactTime: Math.floor(Math.random() * 100) + 150, // 150-250ms
        flightTime: Math.floor(Math.random() * 200) + 300, // 300-500ms
        reactiveStrengthIndex: Math.random() * 1.0 + 1.5, // 1.5-2.5
        forceProduction: Math.floor(Math.random() * 500) + 1200, // 1200-1700N
        powerOutput: Math.floor(Math.random() * 300) + 800, // 800-1100W
        asymmetryIndex: Math.random() * 15 + 2 // 2-17%
      },
      techniqueAnalysis: {
        takeoffRating: Math.floor(Math.random() * 2) + 3, // 3-5
        landingRating: Math.floor(Math.random() * 2) + 3,
        armSwingCoordination: Math.floor(Math.random() * 2) + 3,
        overallTechnique: Math.floor(Math.random() * 2) + 3
      },
      performanceZone: ['peak', 'maintenance', 'declining', 'fatigue_risk'][Math.floor(Math.random() * 4)] as any,
      timestamp: new Date()
    };
    
    this.simulateEvent('PLYOMETRICS_JUMP_MEASUREMENT', jumpMeasurementPayload);
    
    // Simulate landing quality assessment
    setTimeout(() => {
      const landingQualityPayload = {
        sessionId,
        playerId,
        exerciseId: jumpMeasurementPayload.exerciseId,
        jumpNumber: jumpMeasurementPayload.jumpNumber,
        landingAssessment: {
          bilateralLanding: Math.random() > 0.2, // 80% good landings
          kneeValgusAngle: Math.floor(Math.random() * 20), // 0-20 degrees
          dorsifloexionAngle: Math.floor(Math.random() * 30) + 15, // 15-45 degrees
          trunkStability: Math.floor(Math.random() * 2) + 3, // 3-5
          soundLevel: ['silent', 'quiet', 'moderate', 'loud'][Math.floor(Math.random() * 4)] as any,
          controlRating: Math.floor(Math.random() * 2) + 3 // 3-5
        },
        injuryRiskIndicators: {
          riskLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)] as any,
          riskFactors: Math.random() > 0.7 ? ['knee_valgus'] : [],
          recommendedAction: ['continue', 'technique_focus', 'reduce_intensity'][Math.floor(Math.random() * 3)] as any
        },
        fatigueIndicators: {
          contactTimeIncrease: Math.floor(Math.random() * 20), // 0-20% increase
          techniqueDeterioration: Math.floor(Math.random() * 3) + 1, // 1-3
          compensationPatterns: Math.random() > 0.5 ? ['asymmetric_landing'] : []
        },
        timestamp: new Date()
      };
      
      this.simulateEvent('PLYOMETRICS_LANDING_QUALITY', landingQualityPayload);
    }, 1000);
    
    // Occasionally simulate set completion
    if (Math.random() > 0.6) {
      setTimeout(() => {
        const setCompletionPayload = {
          sessionId,
          playerId,
          exerciseId: jumpMeasurementPayload.exerciseId,
          exerciseName: exercise,
          setNumber: Math.floor(Math.random() * 3) + 1,
          totalSets: 3,
          jumpsCompleted: jumpMeasurementPayload.totalJumps,
          jumpsPlanned: jumpMeasurementPayload.totalJumps,
          setPerformanceSummary: {
            averageHeight: jumpType === 'vertical' ? Math.floor(Math.random() * 15) + 45 : undefined,
            averageDistance: ['broad', 'lateral'].includes(jumpType) ? Math.floor(Math.random() * 40) + 160 : undefined,
            averageContactTime: Math.floor(Math.random() * 50) + 175,
            averageRSI: Math.random() * 0.8 + 1.7,
            bestJump: {
              jumpNumber: Math.floor(Math.random() * 8) + 1,
              measurement: jumpType === 'vertical' ? Math.floor(Math.random() * 10) + 55 : Math.floor(Math.random() * 30) + 180,
              unit: jumpType === 'vertical' ? 'cm' : jumpType.includes('lateral') || jumpType.includes('broad') ? 'cm' : 'RSI' as any
            },
            consistencyScore: Math.floor(Math.random() * 30) + 70, // 70-100
            fatigueIndex: Math.floor(Math.random() * 20) + 5 // 5-25%
          },
          qualityMetrics: {
            averageLandingScore: Math.random() * 1.5 + 3.5, // 3.5-5.0
            techniqueConsistency: Math.floor(Math.random() * 2) + 3, // 3-5
            injuryRiskEvents: Math.floor(Math.random() * 3) // 0-2
          },
          recoveryRecommendation: {
            restDuration: Math.floor(Math.random() * 120) + 180, // 180-300 seconds
            recoveryType: ['passive', 'active', 'neuromuscular_prep'][Math.floor(Math.random() * 3)] as any,
            readinessCheck: Math.random() > 0.5
          },
          timestamp: new Date()
        };
        
        this.simulateEvent('PLYOMETRICS_SET_COMPLETION', setCompletionPayload);
      }, 3000);
    }
  }
  
  simulateWrestlingProgress(sessionId: string = 'session-7', playerId: string = 'player-7') {
    const drills = [
      'Takedown Practice', 'Escape Drills', 'Pin Combinations', 'Live Wrestling',
      'Situational Wrestling', 'Technique Review', 'Conditioning Rounds'
    ];
    const roundTypes = ['drilling', 'situational', 'live_wrestling', 'conditioning', 'technique_review'];
    const techniques = [
      'single_leg', 'double_leg', 'arm_drag', 'duck_under', 'sweep_single',
      'high_crotch', 'ankle_pick', 'hip_toss', 'sprawl', 'whizzer'
    ];
    const positions = ['neutral', 'top', 'bottom', 'referee_position', 'standing', 'ground'];
    
    const drill = drills[Math.floor(Math.random() * drills.length)];
    const roundType = roundTypes[Math.floor(Math.random() * roundTypes.length)];
    
    // Simulate round transition
    const roundTransitionPayload = {
      sessionId,
      playerId,
      drillId: `drill-${drill.toLowerCase().replace(/\s+/g, '-')}`,
      drillName: drill,
      roundNumber: Math.floor(Math.random() * 5) + 1,
      totalRounds: 6,
      roundType: roundType as any,
      transitionType: ['automatic', 'manual', 'technique_correction'][Math.floor(Math.random() * 3)] as any,
      roundDuration: Math.floor(Math.random() * 60) + 120, // 120-180 seconds
      plannedDuration: 150,
      intensityRating: Math.floor(Math.random() * 4) + 6, // 6-10
      partnerInfo: {
        partnerId: `partner-${Math.floor(Math.random() * 10) + 1}`,
        partnerName: `Training Partner ${Math.floor(Math.random() * 10) + 1}`,
        weightDifference: Math.floor(Math.random() * 20) - 10, // -10 to +10 kg
        skillLevelDifference: ['matched', 'higher', 'lower'][Math.floor(Math.random() * 3)]
      },
      timestamp: new Date()
    };
    
    this.simulateEvent('WRESTLING_ROUND_TRANSITION', roundTransitionPayload);
    
    // Simulate technique scoring
    setTimeout(() => {
      const technique = techniques[Math.floor(Math.random() * techniques.length)];
      const categories = ['takedown', 'escape', 'reversal', 'pin', 'defense', 'positioning'];
      
      const techniqueScorePayload = {
        sessionId,
        playerId,
        drillId: roundTransitionPayload.drillId,
        techniqueCategory: categories[Math.floor(Math.random() * categories.length)] as any,
        specificTechnique: technique,
        attemptNumber: Math.floor(Math.random() * 8) + 1,
        roundNumber: roundTransitionPayload.roundNumber,
        executionRating: {
          setup: Math.floor(Math.random() * 2) + 3, // 3-5
          execution: Math.floor(Math.random() * 2) + 3,
          finishing: Math.floor(Math.random() * 2) + 3,
          timing: Math.floor(Math.random() * 2) + 3,
          overallScore: Math.floor(Math.random() * 2) + 3
        },
        successOutcome: ['successful', 'partially_successful', 'defended', 'countered'][Math.floor(Math.random() * 4)] as any,
        techniqueFeedback: {
          strengthAreas: ['good_setup', 'explosive_finish'],
          improvementAreas: ['hand_placement', 'follow_through'],
          coachNotes: 'Good technique execution, work on speed'
        },
        opponentResponse: {
          defenseRating: Math.floor(Math.random() * 2) + 3,
          counterAttempts: Math.floor(Math.random() * 3),
          adaptationLevel: ['poor', 'good', 'excellent'][Math.floor(Math.random() * 3)]
        },
        conditioningImpact: {
          heartRateSpike: Math.floor(Math.random() * 30) + 20, // 20-50 BPM increase
          breathingIntensity: Math.floor(Math.random() * 2) + 3, // 3-5
          muscularFatigue: Math.floor(Math.random() * 2) + 3,
          mentalFocus: Math.floor(Math.random() * 2) + 3
        },
        timestamp: new Date()
      };
      
      this.simulateEvent('WRESTLING_TECHNIQUE_SCORE', techniqueScorePayload);
    }, 2000);
    
    // Simulate position control
    setTimeout(() => {
      const position = positions[Math.floor(Math.random() * positions.length)];
      const controlStatuses = ['controlling', 'being_controlled', 'scrambling', 'transitioning'];
      
      const positionControlPayload = {
        sessionId,
        playerId,
        drillId: roundTransitionPayload.drillId,
        position: position as any,
        controlStatus: controlStatuses[Math.floor(Math.random() * controlStatuses.length)] as any,
        positionDuration: Math.floor(Math.random() * 30) + 10, // 10-40 seconds
        controlQuality: {
          stability: Math.floor(Math.random() * 2) + 3, // 3-5
          pressure: Math.floor(Math.random() * 2) + 3,
          advancement: Math.floor(Math.random() * 2) + 3,
          defensiveIntegrity: Math.floor(Math.random() * 2) + 3
        },
        transitionAttempts: {
          initiated: Math.floor(Math.random() * 5) + 1,
          successful: Math.floor(Math.random() * 3),
          defended: Math.floor(Math.random() * 3)
        },
        energyExpenditure: {
          currentIntensity: Math.floor(Math.random() * 3) + 7, // 7-10
          cumulativeFatigue: Math.floor(Math.random() * 4) + 4, // 4-8
          efficiency: Math.floor(Math.random() * 2) + 3 // 3-5
        },
        tacticalElements: {
          aggression: Math.floor(Math.random() * 2) + 3,
          strategy: Math.floor(Math.random() * 2) + 3,
          adaptation: Math.floor(Math.random() * 2) + 3,
          mentalToughness: Math.floor(Math.random() * 2) + 3
        },
        timestamp: new Date()
      };
      
      this.simulateEvent('WRESTLING_POSITION_CONTROL', positionControlPayload);
    }, 4000);
    
    // Simulate conditioning metrics
    setTimeout(() => {
      const wrestlingConditioningPayload = {
        sessionId,
        playerId,
        drillId: roundTransitionPayload.drillId,
        drillName: drill,
        roundNumber: roundTransitionPayload.roundNumber,
        workRestRatio: ['2:1', '1:1', '3:1', '1:2'][Math.floor(Math.random() * 4)],
        wrestlingSpecificMetrics: {
          explosiveMovements: Math.floor(Math.random() * 20) + 15, // 15-35 per minute
          positionalChanges: Math.floor(Math.random() * 10) + 8, // 8-18 per round
          grippingStrength: Math.floor(Math.random() * 2) + 3, // 3-5 rating
          coreEngagement: Math.floor(Math.random() * 2) + 3,
          legDriveIntensity: Math.floor(Math.random() * 2) + 3
        },
        physiologicalMarkers: {
          heartRate: Math.floor(Math.random() * 40) + 160, // 160-200 BPM
          respiratoryRate: Math.floor(Math.random() * 15) + 25, // 25-40 breaths/min
          sweatRate: Math.floor(Math.random() * 2) + 3, // 3-5
          muscularTension: Math.floor(Math.random() * 2) + 3
        },
        performanceDecline: {
          speedDecline: Math.floor(Math.random() * 25) + 5, // 5-30%
          powerDecline: Math.floor(Math.random() * 20) + 10, // 10-30%
          techniqueDecline: Math.floor(Math.random() * 3) + 1, // 1-3
          decisionMaking: Math.floor(Math.random() * 2) + 3 // 3-5
        },
        recoveryIndicators: {
          breathingRecoveryTime: Math.floor(Math.random() * 60) + 30, // 30-90 seconds
          postRoundHR: Math.floor(Math.random() * 30) + 130, // 130-160 BPM
          mentalRecovery: Math.floor(Math.random() * 2) + 3, // 3-5
          physicalRecovery: Math.floor(Math.random() * 2) + 3
        },
        timestamp: new Date()
      };
      
      this.simulateEvent('WRESTLING_CONDITIONING_METRICS', wrestlingConditioningPayload);
    }, 6000);
  }
  
  // Trigger methods for new workout types
  triggerStabilityCoreProgress(sessionId?: string, playerId?: string) {
    this.simulateStabilityCoreProgress(sessionId, playerId);
  }
  
  triggerPlyometricsProgress(sessionId?: string, playerId?: string) {
    this.simulatePlyometricsProgress(sessionId, playerId);
  }
  
  triggerWrestlingProgress(sessionId?: string, playerId?: string) {
    this.simulateWrestlingProgress(sessionId, playerId);
  }
  
  triggerBulkSessionOperation(bundleId?: string, operation?: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all') {
    this.simulateBulkOperation(bundleId, operation);
  }
  
  // Start comprehensive demo with all event types
  startComprehensiveDemo() {
    console.log('Starting comprehensive WebSocket demo with all 7 workout types...');
    
    // Schedule various events for all workout types
    setTimeout(() => this.simulateStrengthProgress(), 2000);
    setTimeout(() => this.simulateConditioningProgress(), 4000);
    setTimeout(() => this.simulateHybridProgress(), 6000);
    setTimeout(() => this.simulateAgilityProgress(), 8000);
    setTimeout(() => this.simulateStabilityCoreProgress(), 10000);
    setTimeout(() => this.simulatePlyometricsProgress(), 12000);
    setTimeout(() => this.simulateWrestlingProgress(), 14000);
    setTimeout(() => this.simulateBulkOperation(), 16000);
    
    // Continue with periodic updates including new workout types
    setInterval(() => {
      const eventTypes = [0, 1, 2, 3, 4, 5, 6, 7];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      switch (randomType) {
        case 0: this.simulateStrengthProgress(); break;
        case 1: this.simulateConditioningProgress(); break;
        case 2: this.simulateHybridProgress(); break;
        case 3: this.simulateAgilityProgress(); break;
        case 4: this.simulateStabilityCoreProgress(); break;
        case 5: this.simulatePlyometricsProgress(); break;
        case 6: this.simulateWrestlingProgress(); break;
        case 7: this.simulateBulkOperation(); break;
      }
    }, 15000); // Every 15 seconds
  }
}

// Export a singleton instance
export const mockEventSimulator = new MockWebSocketEventSimulator();

// Export individual simulators for testing
export const {
  triggerMedicalStatusChange,
  triggerCalendarEventChange,
  triggerStrengthSet,
  triggerConditioningTransition,
  triggerHybridBlock,
  triggerAgilityDrill,
  triggerStabilityCoreProgress,
  triggerPlyometricsProgress,
  triggerWrestlingProgress,
  triggerBulkSessionOperation,
  startComprehensiveDemo
} = mockEventSimulator;