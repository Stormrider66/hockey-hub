"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockWorkoutSessions = void 0;
// Use shared types for mock data to avoid entity requirements
exports.mockWorkoutSessions = [
    {
        id: 'mock-session-1',
        title: 'Morning Strength Training',
        description: 'Full body strength workout focusing on power development',
        type: 'strength',
        status: 'scheduled',
        scheduledDate: new Date(new Date().setHours(9, 0, 0, 0)),
        location: 'Main Gym',
        teamId: 'team-1',
        playerIds: ['player-123', 'player-124', 'player-125'],
        estimatedDuration: 90,
        createdBy: 'trainer-1',
        settings: {
            allowIndividualLoads: true,
            displayMode: 'grid',
            showMetrics: true,
            autoRotation: false,
            rotationInterval: 30
        },
        exercises: [
            {
                id: 'ex-1',
                name: 'Barbell Squat',
                category: 'strength',
                orderIndex: 0,
                sets: 4,
                reps: 6,
                restDuration: 180,
                unit: 'kilograms',
                targetValue: 100,
                equipment: 'Barbell',
                instructions: 'Focus on depth and explosive drive',
                workoutSessionId: 'mock-session-1'
            },
            {
                id: 'ex-2',
                name: 'Bench Press',
                category: 'strength',
                orderIndex: 1,
                sets: 4,
                reps: 8,
                restDuration: 120,
                unit: 'kilograms',
                targetValue: 80,
                equipment: 'Barbell',
                instructions: 'Control the descent, explosive press',
                workoutSessionId: 'mock-session-1'
            },
            {
                id: 'ex-3',
                name: 'Power Clean',
                category: 'strength',
                orderIndex: 2,
                sets: 3,
                reps: 5,
                restDuration: 180,
                unit: 'kilograms',
                targetValue: 70,
                equipment: 'Barbell',
                instructions: 'Focus on hip drive and catch position',
                workoutSessionId: 'mock-session-1'
            }
        ],
        playerLoads: [],
        executions: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'mock-session-2',
        title: 'Interval Bike Training',
        description: 'High-intensity interval training on stationary bikes',
        type: 'cardio',
        status: 'scheduled',
        scheduledDate: new Date(new Date().setHours(16, 0, 0, 0)),
        location: 'Cardio Room',
        teamId: 'team-1',
        playerIds: ['player-123', 'player-126', 'player-127'],
        estimatedDuration: 45,
        createdBy: 'trainer-2',
        settings: {
            allowIndividualLoads: true,
            displayMode: 'grid',
            showMetrics: true,
            autoRotation: true,
            rotationInterval: 60
        },
        exercises: [
            {
                id: 'ex-4',
                name: 'Warm-up',
                category: 'cardio',
                orderIndex: 0,
                duration: 300,
                unit: 'watts',
                targetValue: 150,
                equipment: 'Stationary Bike',
                instructions: 'Easy pace, prepare for intervals',
                workoutSessionId: 'mock-session-2'
            },
            {
                id: 'ex-5',
                name: 'Sprint Intervals',
                category: 'cardio',
                orderIndex: 1,
                sets: 8,
                duration: 30,
                restDuration: 90,
                unit: 'watts',
                targetValue: 350,
                equipment: 'Stationary Bike',
                instructions: 'All-out effort for 30 seconds',
                workoutSessionId: 'mock-session-2'
            },
            {
                id: 'ex-6',
                name: 'Cool-down',
                category: 'cardio',
                orderIndex: 2,
                duration: 300,
                unit: 'watts',
                targetValue: 100,
                equipment: 'Stationary Bike',
                instructions: 'Easy recovery pace',
                workoutSessionId: 'mock-session-2'
            }
        ],
        playerLoads: [],
        executions: [],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
//# sourceMappingURL=workoutData.js.map