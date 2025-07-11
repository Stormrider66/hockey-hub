"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockExercises = void 0;
exports.mockExercises = [
    // Strength exercises
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Barbell Squat',
        category: 'strength',
        description: 'A compound exercise that targets the quadriceps, hamstrings, and glutes',
        primaryUnit: 'kilograms',
        equipment: ['barbell', 'squat rack'],
        muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'core'],
        instructions: '1. Position the barbell on your upper back\n2. Stand with feet shoulder-width apart\n3. Lower your body by bending at the knees and hips\n4. Descend until thighs are parallel to the floor\n5. Push through heels to return to starting position',
        defaultParameters: {
            sets: 4,
            reps: 8,
            restDuration: 120,
            intensityLevel: 'high'
        },
        progressionGuidelines: {
            beginnerRange: { min: 20, max: 40 },
            intermediateRange: { min: 40, max: 80 },
            advancedRange: { min: 80, max: 150 },
            unit: 'kilograms'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Bench Press',
        category: 'strength',
        description: 'Upper body compound exercise targeting chest, shoulders, and triceps',
        primaryUnit: 'kilograms',
        equipment: ['barbell', 'bench'],
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        instructions: '1. Lie on bench with eyes under the bar\n2. Grip bar slightly wider than shoulder width\n3. Lower bar to chest with control\n4. Press bar up to full arm extension',
        defaultParameters: {
            sets: 3,
            reps: 10,
            restDuration: 90,
            intensityLevel: 'medium'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    // Cardio exercises
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Bike Sprints',
        category: 'cardio',
        description: 'High-intensity interval training on a stationary bike',
        primaryUnit: 'watts',
        equipment: ['stationary bike'],
        muscleGroups: ['quadriceps', 'hamstrings', 'calves', 'cardiovascular'],
        instructions: '1. Warm up for 5 minutes at moderate pace\n2. Sprint at maximum effort for 30 seconds\n3. Recover at easy pace for 90 seconds\n4. Repeat for desired intervals',
        defaultParameters: {
            sets: 8,
            duration: 30,
            restDuration: 90,
            intensityLevel: 'max'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Rowing Intervals',
        category: 'cardio',
        description: 'Cardiovascular conditioning using rowing machine',
        primaryUnit: 'meters',
        equipment: ['rowing machine'],
        muscleGroups: ['back', 'legs', 'arms', 'cardiovascular'],
        instructions: '1. Set damper to appropriate level\n2. Row at steady pace for distance/time\n3. Focus on proper form throughout',
        defaultParameters: {
            sets: 5,
            duration: 120,
            restDuration: 60,
            intensityLevel: 'high'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    // Skill exercises
    {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Puck Handling Drills',
        category: 'skill',
        description: 'Hockey-specific stickhandling and puck control exercises',
        primaryUnit: 'reps',
        equipment: ['hockey stick', 'pucks', 'cones'],
        muscleGroups: ['forearms', 'core', 'coordination'],
        instructions: '1. Set up cones in various patterns\n2. Navigate through cones while maintaining puck control\n3. Vary speed and direction\n4. Include toe drags and quick hands movements',
        defaultParameters: {
            sets: 3,
            duration: 300,
            restDuration: 60,
            intensityLevel: 'medium'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Shooting Practice',
        category: 'skill',
        description: 'Hockey shooting technique and accuracy training',
        primaryUnit: 'reps',
        equipment: ['hockey stick', 'pucks', 'net', 'shooting pad'],
        muscleGroups: ['core', 'arms', 'legs'],
        instructions: '1. Set up in proper shooting stance\n2. Practice wrist shots, slap shots, and snap shots\n3. Aim for specific targets in the net\n4. Focus on quick release and accuracy',
        defaultParameters: {
            reps: 50,
            sets: 3,
            restDuration: 120,
            intensityLevel: 'medium'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    // Mobility exercises
    {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Dynamic Hip Stretches',
        category: 'mobility',
        description: 'Dynamic stretching routine for hip mobility and flexibility',
        primaryUnit: 'seconds',
        equipment: ['mat'],
        muscleGroups: ['hip flexors', 'glutes', 'hamstrings'],
        instructions: '1. Leg swings forward and back\n2. Lateral leg swings\n3. Hip circles\n4. Walking lunges with twist',
        defaultParameters: {
            duration: 300,
            sets: 1,
            intensityLevel: 'low'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    // Recovery exercises
    {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'Foam Rolling',
        category: 'recovery',
        description: 'Self-myofascial release for muscle recovery',
        primaryUnit: 'seconds',
        equipment: ['foam roller'],
        muscleGroups: ['full body'],
        instructions: '1. Roll slowly over muscle groups\n2. Pause on tender spots for 30-60 seconds\n3. Breathe deeply throughout\n4. Cover all major muscle groups',
        defaultParameters: {
            duration: 600,
            sets: 1,
            intensityLevel: 'low'
        },
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    }
];
//# sourceMappingURL=exerciseData.js.map