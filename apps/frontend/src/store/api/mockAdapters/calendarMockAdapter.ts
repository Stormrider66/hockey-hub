import { EventType, EventStatus, ParticipantStatus, Event } from '../types/calendar.types';

// Generate mock calendar events with some live sessions
const generateMockEvents = (params: any): Event[] => {
  const { startDate, endDate, teamId, organizationId } = params;
  const now = new Date();
  const events: Event[] = [];

  // Helper to create a date within the range
  const createDateInRange = (offsetHours: number) => {
    const date = new Date(now);
    date.setHours(date.getHours() + offsetHours);
    return date.toISOString();
  };

  // Live training session (happening now)
  events.push({
    id: 'event-live-1',
    title: 'Morning Strength Training',
    type: EventType.TRAINING,
    status: EventStatus.IN_PROGRESS,
    startTime: createDateInRange(-0.5), // Started 30 mins ago
    endTime: createDateInRange(0.5), // Ends in 30 mins
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-001',
    createdBy: 'trainer-001',
    location: 'mainGym',
    description: 'Full body strength workout focusing on explosive power',
    participants: [
      { userId: 'player-001', participantId: 'player-001', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-002', participantId: 'player-002', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-003', participantId: 'player-003', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-004', participantId: 'player-004', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'trainer-001', participantId: 'trainer-001', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    metadata: {
      workoutId: 'workout-strength-001',
      sessionId: 'workout-strength-001',
      trainingType: 'strength',
      workoutType: 'STRENGTH',
      estimatedDuration: 75,
      exercises: [
        { name: 'Squats', sets: 4, reps: 8, weight: 135 },
        { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
        { name: 'Deadlifts', sets: 3, reps: 5, weight: 225 }
      ],
      intensity: 'medium',
      focus: 'Strength & Power',
      equipment: ['Barbell', 'Weight Plates', 'Bench'],
      workoutPreview: {
        type: 'Strength Training',
        duration: '75 min',
        exercises: 3,
        equipment: 'Weight Room',
        intensity: 'medium',
      },
      programData: {
        exercises: [
          { name: 'Squats', sets: 4, reps: 8, weight: 135 },
          { name: 'Bench Press', sets: 4, reps: 8, weight: 185 },
          { name: 'Deadlifts', sets: 3, reps: 5, weight: 225 }
        ],
      },
    },
    color: '#3B82F6', // Blue for strength
    // Live session properties
    isLive: true,
    currentProgress: 45,
    activeParticipants: 4,
    currentActivity: {
      type: 'exercise',
      name: 'Bench Press - Set 3/4',
      timeRemaining: 120,
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  });

  // Another live session (conditioning)
  events.push({
    id: 'event-live-2',
    title: 'HIIT Bike Intervals',
    type: EventType.TRAINING,
    status: EventStatus.IN_PROGRESS,
    startTime: createDateInRange(-0.25), // Started 15 mins ago
    endTime: createDateInRange(0.75), // Ends in 45 mins
    organizationId: organizationId || 'org-001',
    teamId: 'team-002',
    createdBy: 'trainer-002',
    location: 'Cardio Room',
    description: 'High-intensity interval training on stationary bikes',
    participants: [
      { userId: 'player-005', participantId: 'player-005', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-006', participantId: 'player-006', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-007', participantId: 'player-007', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'trainer-002', participantId: 'trainer-002', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    metadata: {
      workoutId: 'workout-conditioning-001',
      sessionId: 'workout-conditioning-001',
      trainingType: 'conditioning',
      workoutType: 'CONDITIONING',
      estimatedDuration: 60,
      intervalProgram: {
        name: 'HIIT Bike Intervals',
        equipment: 'bike_erg',
        totalDuration: 3600, // 60 minutes in seconds
        estimatedCalories: 450,
        intervals: [
          { id: '1', type: 'warmup', duration: 300, equipment: 'bike_erg' },
          { id: '2', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 85 } } },
          { id: '3', type: 'rest', duration: 60, equipment: 'bike_erg' },
          { id: '4', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 90 } } },
          { id: '5', type: 'rest', duration: 60, equipment: 'bike_erg' },
          { id: '6', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 85 } } },
          { id: '7', type: 'cooldown', duration: 300, equipment: 'bike_erg' },
        ],
      },
      intensity: 'high',
      focus: 'Cardiovascular Fitness',
      equipment: ['Bike Erg'],
      targetMetrics: {
        heartRateZone: 'Zone 4-5',
        expectedCalories: 450,
      },
      workoutPreview: {
        type: 'Conditioning',
        duration: '60 min',
        equipment: 'bike_erg',
        intervals: 8,
        estimatedCalories: 450,
        intensity: 'high',
      },
      programData: {
        intervalProgram: {
          name: 'HIIT Bike Intervals',
          equipment: 'bike_erg',
          totalDuration: 3600,
          estimatedCalories: 450,
          intervals: [
            { id: '1', type: 'warmup', duration: 300, equipment: 'bike_erg' },
            { id: '2', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 85 } } },
            { id: '3', type: 'rest', duration: 60, equipment: 'bike_erg' },
            { id: '4', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 90 } } },
            { id: '5', type: 'rest', duration: 60, equipment: 'bike_erg' },
            { id: '6', type: 'work', duration: 120, equipment: 'bike_erg', targetMetrics: { heartRate: { value: 85 } } },
            { id: '7', type: 'cooldown', duration: 300, equipment: 'bike_erg' },
          ],
        },
      },
    },
    color: '#EF4444', // Red for conditioning
    // Live session properties
    isLive: true,
    currentProgress: 25,
    activeParticipants: 3,
    currentActivity: {
      type: 'interval',
      name: 'Sprint Interval 3/8',
      timeRemaining: 30,
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  });

  // Upcoming events
  events.push({
    id: 'event-upcoming-1',
    title: 'Team Practice',
    type: EventType.TRAINING,
    status: EventStatus.SCHEDULED,
    startTime: createDateInRange(2),
    endTime: createDateInRange(4),
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-001',
    createdBy: 'coach-001',
    location: 'Ice Rink A',
    description: 'On-ice practice focusing on power play strategies',
    participants: [
      { userId: 'player-001', participantId: 'player-001', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-002', participantId: 'player-002', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-003', participantId: 'player-003', status: ParticipantStatus.TENTATIVE, isOrganizer: false },
      { userId: 'coach-001', participantId: 'coach-001', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    isLive: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  });

  events.push({
    id: 'event-upcoming-2',
    title: 'Agility Training',
    type: EventType.TRAINING,
    status: EventStatus.SCHEDULED,
    startTime: createDateInRange(24),
    endTime: createDateInRange(25),
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-001',
    createdBy: 'trainer-001',
    location: 'Training Field',
    description: 'Speed and agility drills',
    participants: [
      { userId: 'player-001', participantId: 'player-001', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-004', participantId: 'player-004', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'trainer-001', participantId: 'trainer-001', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    metadata: {
      workoutId: 'workout-agility-001',
      sessionId: 'workout-agility-001',
      trainingType: 'agility',
      workoutType: 'AGILITY',
      estimatedDuration: 45,
      agilityProgram: {
        name: 'Speed & Agility Circuit',
        totalDuration: 2700, // 45 minutes in seconds
        drills: [
          {
            id: '1',
            name: 'T-Drill',
            duration: 300,
            conePattern: 'T-shape',
            difficulty: 'medium',
            repetitions: 3,
          },
          {
            id: '2',
            name: '5-10-5 Shuttle',
            duration: 240,
            conePattern: 'linear',
            difficulty: 'medium',
            repetitions: 4,
          },
          {
            id: '3',
            name: 'Ladder Drills',
            duration: 480,
            equipment: 'ladder',
            difficulty: 'easy',
            repetitions: 5,
          },
        ],
      },
      intensity: 'medium',
      focus: 'Speed & Agility',
      equipment: ['Cones', 'Agility Ladder', 'Stopwatch'],
      workoutPreview: {
        type: 'Agility Training',
        duration: '45 min',
        drills: 3,
        equipment: 'Cones & Ladders',
        focus: 'Speed & Agility',
      },
      programData: {
        agilityProgram: {
          name: 'Speed & Agility Circuit',
          totalDuration: 2700,
          drills: [
            {
              id: '1',
              name: 'T-Drill',
              duration: 300,
              conePattern: 'T-shape',
              difficulty: 'medium',
              repetitions: 3,
            },
            {
              id: '2',
              name: '5-10-5 Shuttle',
              duration: 240,
              conePattern: 'linear',
              difficulty: 'medium',
              repetitions: 4,
            },
            {
              id: '3',
              name: 'Ladder Drills',
              duration: 480,
              equipment: 'ladder',
              difficulty: 'easy',
              repetitions: 5,
            },
          ],
        },
      },
    },
    color: '#F97316', // Orange for agility
    isLive: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Hybrid workout event
  events.push({
    id: 'event-hybrid-1',
    title: 'Cross Training Circuit',
    type: EventType.TRAINING,
    status: EventStatus.SCHEDULED,
    startTime: createDateInRange(6),
    endTime: createDateInRange(7.5),
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-002',
    createdBy: 'trainer-003',
    location: 'Multi-purpose Gym',
    description: 'Combined strength and cardio circuit training',
    participants: [
      { userId: 'player-005', participantId: 'player-005', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-006', participantId: 'player-006', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-007', participantId: 'player-007', status: ParticipantStatus.TENTATIVE, isOrganizer: false },
      { userId: 'player-008', participantId: 'player-008', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'trainer-003', participantId: 'trainer-003', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    metadata: {
      workoutId: 'workout-hybrid-001',
      sessionId: 'workout-hybrid-001',
      trainingType: 'hybrid',
      workoutType: 'HYBRID',
      estimatedDuration: 90,
      hybridProgram: {
        name: 'Cross Training Circuit',
        totalDuration: 5400, // 90 minutes in seconds
        blocks: [
          {
            id: '1',
            type: 'exercise',
            name: 'Strength Block',
            duration: 1200, // 20 minutes
            exercises: [
              { name: 'Push-ups', sets: 3, reps: 15 },
              { name: 'Squats', sets: 3, reps: 20 },
              { name: 'Pull-ups', sets: 3, reps: 8 },
            ],
          },
          {
            id: '2',
            type: 'interval',
            name: 'Cardio Block',
            duration: 900, // 15 minutes
            intervals: [
              { type: 'work', duration: 120, equipment: 'rowing' },
              { type: 'rest', duration: 60 },
              { type: 'work', duration: 120, equipment: 'rowing' },
              { type: 'rest', duration: 60 },
            ],
          },
          {
            id: '3',
            type: 'transition',
            name: 'Active Recovery',
            duration: 300, // 5 minutes
          },
          {
            id: '4',
            type: 'exercise',
            name: 'Core & Stability',
            duration: 900, // 15 minutes
            exercises: [
              { name: 'Plank', sets: 3, duration: 60 },
              { name: 'Russian Twists', sets: 3, reps: 30 },
              { name: 'Single Leg Balance', sets: 3, duration: 30 },
            ],
          },
        ],
      },
      intensity: 'high',
      focus: 'Combined Training',
      equipment: ['Dumbbells', 'Resistance Bands', 'Rowing Machine'],
      workoutPreview: {
        type: 'Hybrid Training',
        duration: '90 min',
        blocks: 4,
        exercises: 6,
        intervals: 4,
        intensity: 'high',
      },
      programData: {
        hybridProgram: {
          name: 'Cross Training Circuit',
          totalDuration: 5400,
          blocks: [
            {
              id: '1',
              type: 'exercise',
              name: 'Strength Block',
              duration: 1200,
              exercises: [
                { name: 'Push-ups', sets: 3, reps: 15 },
                { name: 'Squats', sets: 3, reps: 20 },
                { name: 'Pull-ups', sets: 3, reps: 8 },
              ],
            },
            {
              id: '2',
              type: 'interval',
              name: 'Cardio Block',
              duration: 900,
              intervals: [
                { type: 'work', duration: 120, equipment: 'rowing' },
                { type: 'rest', duration: 60 },
                { type: 'work', duration: 120, equipment: 'rowing' },
                { type: 'rest', duration: 60 },
              ],
            },
            {
              id: '3',
              type: 'transition',
              name: 'Active Recovery',
              duration: 300,
            },
            {
              id: '4',
              type: 'exercise',
              name: 'Core & Stability',
              duration: 900,
              exercises: [
                { name: 'Plank', sets: 3, duration: 60 },
                { name: 'Russian Twists', sets: 3, reps: 30 },
                { name: 'Single Leg Balance', sets: 3, duration: 30 },
              ],
            },
          ],
        },
      },
    },
    color: '#8B5CF6', // Purple for hybrid
    isLive: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Team meeting
  events.push({
    id: 'event-meeting-1',
    title: 'Team Strategy Meeting',
    type: EventType.MEETING,
    status: EventStatus.SCHEDULED,
    startTime: createDateInRange(3),
    endTime: createDateInRange(4),
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-001',
    createdBy: 'coach-001',
    location: 'Conference Room A',
    description: 'Review game footage and discuss strategies',
    participants: [
      { userId: 'player-001', participantId: 'player-001', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-002', participantId: 'player-002', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-003', participantId: 'player-003', status: ParticipantStatus.ACCEPTED, isOrganizer: false },
      { userId: 'player-004', participantId: 'player-004', status: ParticipantStatus.PENDING, isOrganizer: false },
      { userId: 'coach-001', participantId: 'coach-001', status: ParticipantStatus.ACCEPTED, isOrganizer: true },
    ],
    isLive: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Game event
  events.push({
    id: 'event-game-1',
    title: 'vs. Rival Team',
    type: EventType.GAME,
    status: EventStatus.SCHEDULED,
    startTime: createDateInRange(48),
    endTime: createDateInRange(51),
    organizationId: organizationId || 'org-001',
    teamId: teamId || 'team-001',
    createdBy: 'admin-001',
    location: 'Home Arena',
    description: 'League game - important match',
    participants: [], // Games typically don't track individual participants
    isLive: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Filter events based on date range if provided
  return events.filter(event => {
    if (!startDate || !endDate) return true;
    const eventStart = new Date(event.startTime);
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    return eventStart >= rangeStart && eventStart <= rangeEnd;
  });
};

export const calendarMockHandlers = {
  // Get events by date range
  '/events/date-range': (params: any) => {
    const events = generateMockEvents(params);
    return { data: events };
  },

  // Get all events
  '/events': (params: any) => {
    const events = generateMockEvents(params);
    return {
      data: {
        data: events,
        total: events.length,
        page: params.page || 1,
        limit: params.limit || 50,
      },
    };
  },

  // Get single event
  '/events/:id': (params: any, eventId: string) => {
    const events = generateMockEvents(params);
    const event = events.find(e => e.id === eventId);
    if (event) {
      return { data: event };
    }
    return { error: { status: 404, data: { message: 'Event not found' } } };
  },

  // Create event
  'POST /events': (body: any) => {
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      status: EventStatus.SCHEDULED,
      isLive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    return { data: newEvent };
  },

  // Update event
  'PUT /events/:id': (body: any, eventId: string) => {
    const updatedEvent = {
      id: eventId,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return { data: updatedEvent };
  },

  // Delete event
  'DELETE /events/:id': () => {
    return { data: null };
  },

  // Check conflicts
  '/events/check-conflicts': (body: any) => {
    const { startTime, endTime, participantIds } = body;
    
    // Generate some conflicting events for demo purposes
    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);
    const hour = requestStart.getHours();
    
    // Create conflicts for morning hours (7-11) to demo the functionality
    if (hour >= 7 && hour <= 11) {
      const conflictingEvents = [
        {
          id: 'conflict-1',
          title: 'Team Meeting',
          type: EventType.MEETING,
          status: EventStatus.SCHEDULED,
          startTime: new Date(requestStart.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins before
          endTime: new Date(requestStart.getTime() + 30 * 60 * 1000).toISOString(), // overlaps
          location: 'Conference Room A',
          organizationId: 'org-001',
          teamId: 'team-001',
          createdBy: 'coach-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'conflict-2',
          title: 'Ice Practice',
          type: EventType.TRAINING,
          status: EventStatus.SCHEDULED,
          startTime: new Date(requestStart.getTime() + 15 * 60 * 1000).toISOString(), // 15 mins after start
          endTime: new Date(requestEnd.getTime() + 15 * 60 * 1000).toISOString(), // 15 mins after end
          location: 'Rink 1',
          organizationId: 'org-001',
          teamId: 'team-001',
          createdBy: 'coach-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      return {
        data: {
          hasConflict: true,
          conflictingEvents: conflictingEvents,
          message: `Found ${conflictingEvents.length} conflicting events`,
        },
      };
    }
    
    // No conflicts for other times
    return {
      data: {
        hasConflict: false,
        conflictingEvents: [],
      },
    };
  },

  // Get upcoming events
  '/events/upcoming': (params: any) => {
    const events = generateMockEvents(params);
    const upcoming = events.filter(e => new Date(e.startTime) > new Date());
    return { data: upcoming };
  },

  // Update participant status
  'PATCH /events/:eventId/participants/:participantId/status': (body: any) => {
    return { data: { success: true } };
  },

  // Get calendar events (player view)
  '/events/calendar': (params: any) => {
    const events = generateMockEvents(params);
    return { data: events };
  },
};