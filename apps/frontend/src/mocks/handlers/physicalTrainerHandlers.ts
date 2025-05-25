import { http, HttpResponse } from 'msw';

// Handlers for the Physical-Trainer dashboard endpoints
export const physicalTrainerHandlers = [
  // GET team overview
  http.get('/api/v1/physical-trainer/teams/:id/overview', async () => {
    // Mimic network latency so UI loading states can be tested realistically
    await new Promise((r) => setTimeout(r, 500));

    return HttpResponse.json({
      todaysSchedule: [
        {
          time: '15:00 - 15:45',
          title: 'Pre-Training Assessment',
          location: 'Performance Lab',
          type: 'assessment',
          players: 12,
          priority: 'High',
          notes: 'Heart rate variability check for all players',
        },
        {
          time: '16:00 - 17:30',
          title: 'Strength Training - Lower Body',
          location: 'Weight Room',
          type: 'strength',
          players: 18,
          priority: 'High',
          notes: 'Focus on squat progression and posterior chain',
        },
        {
          time: '17:45 - 18:30',
          title: 'Power Development',
          location: 'Training Hall',
          type: 'power',
          players: 15,
          priority: 'Medium',
          notes: 'Plyometric exercises and explosive movements',
        },
        {
          time: '19:00 - 19:30',
          title: 'Recovery Session',
          location: 'Recovery Room',
          type: 'recovery',
          players: 8,
          priority: 'Low',
          notes: 'Foam rolling and mobility work',
        },
      ],
      teamReadiness: {
        overall: 82,
        trend: 'stable',
        riskPlayers: 2,
        readyPlayers: 16,
        averageLoad: 7.2,
      },
      playerReadiness: [
        {
          player: 'Erik Johansson',
          score: 88,
          trend: 'up',
          hrv: 45,
          sleepScore: 8.5,
          loadStatus: 'optimal',
          riskLevel: 'low',
          recommendations: ['Continue current load', 'Monitor hydration'],
        },
        {
          player: 'Maria Andersson',
          score: 75,
          trend: 'down',
          hrv: 38,
          sleepScore: 6.2,
          loadStatus: 'moderate',
          riskLevel: 'medium',
          recommendations: ['Reduce intensity today', 'Focus on recovery'],
        },
        {
          player: 'Johan Berg',
          score: 91,
          trend: 'stable',
          hrv: 52,
          sleepScore: 9.1,
          loadStatus: 'optimal',
          riskLevel: 'low',
          recommendations: ['Ready for high intensity', 'Maintain current routine'],
        },
        {
          player: 'Lucas Holm',
          score: 68,
          trend: 'down',
          hrv: 32,
          sleepScore: 5.8,
          loadStatus: 'high',
          riskLevel: 'high',
          recommendations: ['Consider rest day', 'Sleep consultation needed'],
        },
        {
          player: 'Anna Nilsson',
          score: 84,
          trend: 'up',
          hrv: 48,
          sleepScore: 8.0,
          loadStatus: 'optimal',
          riskLevel: 'low',
          recommendations: ['Continue current program', 'Excellent recovery'],
        },
        {
          player: 'Sara Vikström',
          score: 79,
          trend: 'stable',
          hrv: 41,
          sleepScore: 7.3,
          loadStatus: 'moderate',
          riskLevel: 'low',
          recommendations: ['Maintain load', 'Monitor stress levels'],
        },
      ],
      weeklyLoadData: [
        { day: 'Mon', planned: 750, actual: 720, rpe: 7.2, recovery: 8.1 },
        { day: 'Tue', planned: 500, actual: 480, rpe: 5.8, recovery: 8.5 },
        { day: 'Wed', planned: 650, actual: 620, rpe: 6.9, recovery: 7.8 },
        { day: 'Thu', planned: 550, actual: 540, rpe: 6.2, recovery: 8.2 },
        { day: 'Fri', planned: 800, actual: 780, rpe: 8.1, recovery: 7.4 },
        { day: 'Sat', planned: 350, actual: 340, rpe: 4.5, recovery: 9.1 },
        { day: 'Sun', planned: 0, actual: 0, rpe: 0, recovery: 9.0 },
      ],
      upcomingSessions: [
        {
          date: 'Tomorrow',
          time: '16:00 - 17:30',
          title: 'Upper Body Strength',
          type: 'strength',
          location: 'Weight Room',
          players: 20,
          focus: 'Bench press progression and pulling exercises',
          equipment: ['Barbells', 'Dumbbells', 'Cable machines'],
          estimatedLoad: 680,
        },
        {
          date: 'May 21',
          time: '15:00 - 16:00',
          title: 'Speed & Agility',
          type: 'speed',
          location: 'Turf Field',
          players: 18,
          focus: 'Acceleration mechanics and change of direction',
          equipment: ['Cones', 'Speed ladders', 'Hurdles'],
          estimatedLoad: 520,
        },
        {
          date: 'May 22',
          time: '14:00 - 17:00',
          title: 'Physical Testing Battery',
          type: 'testing',
          location: 'Performance Lab',
          players: 22,
          focus: 'Quarterly fitness assessments',
          equipment: ['Force plates', 'Lactate analyzer', 'VO2 system'],
          estimatedLoad: 750,
        },
      ],
      recentTestResults: [
        {
          player: 'Erik Johansson',
          test: 'Vertical Jump',
          result: '68 cm',
          previous: '65 cm',
          change: '+3 cm',
          percentile: 85,
          date: 'May 15',
          category: 'Power',
        },
        {
          player: 'Maria Andersson',
          test: '5-10-5 Agility',
          result: '4.32 s',
          previous: '4.46 s',
          change: '-0.14 s',
          percentile: 78,
          date: 'May 15',
          category: 'Speed',
        },
        {
          player: 'Johan Berg',
          test: '1RM Back Squat',
          result: '142 kg',
          previous: '135 kg',
          change: '+7 kg',
          percentile: 92,
          date: 'May 14',
          category: 'Strength',
        },
        {
          player: 'Lucas Holm',
          test: 'VO2 Max',
          result: '58.6 ml/kg/min',
          previous: '57.4 ml/kg/min',
          change: '+1.2',
          percentile: 88,
          date: 'May 13',
          category: 'Endurance',
        },
        {
          player: 'Anna Nilsson',
          test: 'Broad Jump',
          result: '245 cm',
          previous: '238 cm',
          change: '+7 cm',
          percentile: 82,
          date: 'May 15',
          category: 'Power',
        },
      ],
      exerciseLibrary: [
        {
          name: 'Back Squat',
          category: 'Strength',
          targetMuscle: 'Lower Body',
          difficulty: 'Intermediate',
          equipment: 'Barbell',
          usage: 45,
          lastUsed: 'Today',
        },
        {
          name: 'Box Jumps',
          category: 'Power',
          targetMuscle: 'Lower Body',
          difficulty: 'Intermediate',
          equipment: 'Plyo Box',
          usage: 32,
          lastUsed: 'Yesterday',
        },
        {
          name: 'Bench Press',
          category: 'Strength',
          targetMuscle: 'Upper Body',
          difficulty: 'Beginner',
          equipment: 'Barbell',
          usage: 38,
          lastUsed: 'May 17',
        },
        {
          name: 'Medicine Ball Slam',
          category: 'Power',
          targetMuscle: 'Full Body',
          difficulty: 'Beginner',
          equipment: 'Medicine Ball',
          usage: 28,
          lastUsed: 'May 16',
        },
      ],
      loadManagement: {
        weeklyTarget: 3500,
        currentLoad: 3240,
        compliance: 92.6,
        highRiskPlayers: 2,
        recommendations: [
          'Reduce intensity for Lucas Holm and Maria Andersson',
          'Consider adding recovery session on Thursday',
          'Monitor sleep quality across all players',
        ],
      },
    });
  }),

  // POST create training session
  http.post('/api/v1/physical-trainer/sessions', async ({ request }) => {
    const sessionData = (await request.json()) as any;
    await new Promise((r) => setTimeout(r, 800));
    return HttpResponse.json({
      success: true,
      sessionId: `SES-${Date.now()}`,
      message: `Training session "${sessionData.title}" created successfully`,
      estimatedParticipants: sessionData.players || 0,
    });
  }),

  // POST record test result
  http.post('/api/v1/physical-trainer/tests/record', async ({ request }) => {
    const testData = (await request.json()) as any;
    await new Promise((r) => setTimeout(r, 600));
    return HttpResponse.json({
      success: true,
      testId: `TEST-${Date.now()}`,
      message: `Test results recorded for ${testData.player}`,
      percentileRank: Math.floor(Math.random() * 40) + 60, // 60–99 percentile
    });
  }),

  // POST update readiness notes
  http.post('/api/v1/physical-trainer/readiness/notes', async ({ request }) => {
    const noteData = (await request.json()) as any;
    await new Promise((r) => setTimeout(r, 400));
    return HttpResponse.json({
      success: true,
      message: `Readiness notes updated for ${noteData.player}`,
      recommendationsUpdated: true,
    });
  }),
]; 