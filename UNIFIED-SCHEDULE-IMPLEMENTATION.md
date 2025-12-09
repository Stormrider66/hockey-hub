# 🏒 Unified Schedule Implementation Plan

## Executive Summary
Transform the existing "Today's Training Sessions" into a unified "Today's Schedule" that displays all event types (training, ice practice, games, medical, meetings) across all role dashboards, with smart context-aware actions and a universal preview/launch system.

## 🎯 Goals
1. **Unify all event types** in the Overview tab across all roles
2. **Create universal event preview** page with role-specific launch actions
3. **Maintain existing UI** while enhancing functionality
4. **Enable cross-role visibility** while respecting permissions

## 📊 Event Types & Visual Identity

```typescript
enum EventType {
  TRAINING = 'training',        // Physical Trainer
  ICE_PRACTICE = 'ice_practice', // Ice Coach
  GAME = 'game',                // Team Manager
  MEDICAL = 'medical',          // Medical Staff
  MEETING = 'meeting',          // Coach/Admin
  PERSONAL = 'personal'         // Player
}

const EVENT_CONFIG = {
  [EventType.TRAINING]: {
    icon: 'Dumbbell',
    color: '#3B82F6', // blue-500
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'Intensity',
    owner: 'physicalTrainer',
    viewLabel: 'View Workout',
    launchLabel: 'Start Training'
  },
  [EventType.ICE_PRACTICE]: {
    icon: 'Snowflake',
    color: '#06B6D4', // cyan-500
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    badge: 'Ice Time',
    owner: 'iceCoach',
    viewLabel: 'View Practice',
    launchLabel: 'Start Practice'
  },
  [EventType.GAME]: {
    icon: 'Trophy',
    color: '#10B981', // green-500
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'Game Day',
    owner: 'teamManager',
    viewLabel: 'Game Plan',
    launchLabel: 'Game Center'
  },
  [EventType.MEDICAL]: {
    icon: 'Heart',
    color: '#EF4444', // red-500
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'Medical',
    owner: 'medicalStaff',
    viewLabel: 'View Details',
    launchLabel: 'Start Session'
  },
  [EventType.MEETING]: {
    icon: 'Users',
    color: '#8B5CF6', // purple-500
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: 'Meeting',
    owner: 'coach',
    viewLabel: 'View Agenda',
    launchLabel: 'Join Meeting'
  }
};
```

## 🏗️ Implementation Phases

### Phase 1: Data Integration (Week 1)

#### 1.1 Create Unified Event Service
```typescript
// services/unified-schedule-service/src/UnifiedScheduleService.ts
export class UnifiedScheduleService {
  async getTodaySchedule(userId: string, role: UserRole): Promise<ScheduleEvent[]> {
    const [
      trainingSessions,
      icePractices,
      games,
      medicalAppointments,
      meetings
    ] = await Promise.all([
      this.trainingService.getTodaySessions(userId),
      this.iceService.getTodayPractices(userId),
      this.gameService.getTodayGames(userId),
      this.medicalService.getTodayAppointments(userId),
      this.meetingService.getTodayMeetings(userId)
    ]);

    return this.mergeAndSort([
      ...this.mapTrainingSessions(trainingSessions),
      ...this.mapIcePractices(icePractices),
      ...this.mapGames(games),
      ...this.mapMedicalAppointments(medicalAppointments),
      ...this.mapMeetings(meetings)
    ]);
  }

  private mapToUnifiedEvent(source: any, type: EventType): ScheduleEvent {
    return {
      id: source.id,
      type,
      title: source.name || source.title,
      description: source.description,
      startTime: source.startTime,
      endTime: source.endTime,
      location: source.location,
      participants: source.participants || [],
      intensity: source.intensity,
      owner: source.createdBy,
      metadata: source,
      status: this.calculateStatus(source),
      permissions: this.getPermissions(source, type)
    };
  }
}
```

#### 1.2 Update API Gateway
```typescript
// services/api-gateway/src/routes/schedule.routes.ts
router.get('/schedule/today', authenticate, async (req, res) => {
  const { userId, role } = req.user;
  const schedule = await unifiedScheduleService.getTodaySchedule(userId, role);
  res.json(schedule);
});

router.get('/schedule/event/:id', authenticate, async (req, res) => {
  const event = await unifiedScheduleService.getEventDetails(req.params.id);
  res.json(event);
});
```

### Phase 2: Frontend Components (Week 1-2)

#### 2.1 Enhanced Today's Schedule Component
```tsx
// apps/frontend/src/components/schedule/TodaysSchedule.tsx
export const TodaysSchedule: React.FC<{ role: UserRole }> = ({ role }) => {
  const { data: events, isLoading } = useGetTodayScheduleQuery();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Today's Schedule</h3>
          <QuickAddButton role={role} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events?.map(event => (
            <ScheduleEventCard 
              key={event.id}
              event={event}
              role={role}
              onView={() => navigateToPreview(event)}
              onQuickAction={(action) => handleQuickAction(event, action)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 2.2 Schedule Event Card Component
```tsx
// apps/frontend/src/components/schedule/ScheduleEventCard.tsx
export const ScheduleEventCard: React.FC<ScheduleEventCardProps> = ({ 
  event, 
  role, 
  onView,
  onQuickAction 
}) => {
  const config = EVENT_CONFIG[event.type];
  const Icon = Icons[config.icon];
  
  return (
    <div className={`flex items-center p-3 border rounded-lg ${config.bgColor} ${config.borderColor}`}>
      {/* Time Section */}
      <div className="flex-shrink-0 text-center mr-4">
        <div className="text-2xl font-bold">{formatTime(event.startTime)}</div>
        <Badge variant="outline">{event.location}</Badge>
      </div>
      
      {/* Content Section */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4`} style={{ color: config.color }} />
          <span className="font-medium">{event.title}</span>
          <Badge className={`${config.bgColor} text-${config.color}-700`}>
            {config.badge}
          </Badge>
          {event.status === 'live' && <LiveIndicator />}
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </div>
      
      {/* Actions Section */}
      <div className="flex items-center gap-2">
        <ParticipantBadge count={event.participants.length} />
        <Button 
          variant="default" 
          size="sm"
          onClick={onView}
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {config.viewLabel}
        </Button>
        {role === config.owner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onQuickAction('edit')}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction('cancel')}>
                Cancel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction('duplicate')}>
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
```

#### 2.3 Universal Event Preview Page
```tsx
// apps/frontend/src/pages/event-preview/[id].tsx
export const EventPreviewPage: React.FC = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const { data: event, isLoading } = useGetEventQuery(id);
  
  if (!event) return <NotFound />;
  
  const config = EVENT_CONFIG[event.type];
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      {/* Event Details Card */}
      <Card className="mb-6">
        <CardHeader className={config.bgColor}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-8 w-8" style={{ color: config.color }} />
                <h1 className="text-3xl font-bold">{event.title}</h1>
              </div>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
            <EventMetadata event={event} />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Dynamic content based on event type */}
          <EventContent event={event} role={role} />
        </CardContent>
      </Card>
      
      {/* Launch Actions */}
      <LaunchActions event={event} role={role} />
    </div>
  );
};
```

### Phase 3: Role-Specific Dashboards (Week 2)

#### 3.1 Physical Trainer Dashboard
```tsx
// apps/frontend/src/features/physical-trainer/components/PhysicalTrainerDashboard.tsx
// UPDATE: Overview Tab
<TabsContent value="overview">
  <div className="grid gap-4">
    {/* Stats Cards - Keep existing */}
    <StatsCards />
    
    {/* Enhanced Schedule - NEW */}
    <TodaysSchedule role="physicalTrainer" />
    
    {/* Team Roster - Keep existing */}
    <TeamRoster />
  </div>
</TabsContent>
```

#### 3.2 Player Dashboard
```tsx
// apps/frontend/src/features/player/components/PlayerDashboard.tsx
export const PlayerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <PersonalStatsCards />
      
      {/* My Schedule - Shows only relevant events */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">My Schedule Today</h2>
        </CardHeader>
        <CardContent>
          <TodaysSchedule 
            role="player" 
            filterByPlayer={currentPlayerId}
          />
        </CardContent>
      </Card>
      
      {/* Upcoming */}
      <UpcomingEvents />
    </div>
  );
};
```

#### 3.3 Ice Coach Dashboard
```tsx
// apps/frontend/src/features/ice-coach/components/IceCoachDashboard.tsx
export const IceCoachDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="practice">Practice Plans</TabsTrigger>
          <TabsTrigger value="lines">Line Management</TabsTrigger>
          <TabsTrigger value="drills">Drill Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Ice Time Stats */}
          <IceTimeStats />
          
          {/* Today's Schedule - Shows all events */}
          <TodaysSchedule role="iceCoach" />
          
          {/* Line Combinations */}
          <CurrentLines />
        </TabsContent>
        
        <TabsContent value="practice">
          <PracticePlanBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Phase 4: Launch Actions & Viewers (Week 2-3)

#### 4.1 Role-Specific Launch Actions
```tsx
// apps/frontend/src/components/schedule/LaunchActions.tsx
export const LaunchActions: React.FC<{ event: ScheduleEvent, role: UserRole }> = ({ 
  event, 
  role 
}) => {
  const getLaunchOptions = () => {
    // Training Session Launch Matrix
    if (event.type === EventType.TRAINING) {
      switch(role) {
        case 'player':
          return (
            <Button size="lg" className="w-full" onClick={() => navigate(`/player/workout/${event.id}`)}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Start My Workout
            </Button>
          );
        
        case 'physicalTrainer':
          return (
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={() => navigate(`/trainer/monitor/${event.id}`)}>
                <Monitor className="mr-2 h-5 w-5" />
                Monitor Session
              </Button>
              <Button size="lg" variant="outline" onClick={() => broadcastSession(event.id)}>
                <Radio className="mr-2 h-5 w-5" />
                Broadcast
              </Button>
            </div>
          );
        
        case 'coach':
          return (
            <Button size="lg" className="w-full" onClick={() => navigate(`/coach/team-session/${event.id}`)}>
              <Users className="mr-2 h-5 w-5" />
              Launch Team View
            </Button>
          );
      }
    }
    
    // Ice Practice Launch Matrix
    if (event.type === EventType.ICE_PRACTICE) {
      switch(role) {
        case 'iceCoach':
          return (
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={() => navigate(`/ice-coach/practice/${event.id}`)}>
                <Snowflake className="mr-2 h-5 w-5" />
                Start Practice
              </Button>
              <Button size="lg" variant="outline" onClick={() => openDrillManager(event.id)}>
                <ClipboardList className="mr-2 h-5 w-5" />
                Drill Manager
              </Button>
            </div>
          );
        
        case 'player':
          return (
            <Button size="lg" className="w-full" onClick={() => navigate(`/player/practice/${event.id}`)}>
              <Snowflake className="mr-2 h-5 w-5" />
              View Practice Plan
            </Button>
          );
      }
    }
    
    // Add more event types...
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        {getLaunchOptions()}
      </CardContent>
    </Card>
  );
};
```

#### 4.2 Event-Specific Content Components
```tsx
// apps/frontend/src/components/schedule/event-content/TrainingContent.tsx
export const TrainingContent: React.FC<{ event: TrainingSession }> = ({ event }) => {
  return (
    <div className="space-y-6">
      {/* Workout Overview */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Duration" value={`${event.duration} min`} icon={Clock} />
        <MetricCard label="Exercises" value={event.exercises.length} icon={Dumbbell} />
        <MetricCard label="Intensity" value={event.intensity} icon={Zap} />
      </div>
      
      {/* Exercise List */}
      <div>
        <h3 className="font-semibold mb-3">Exercises</h3>
        <div className="space-y-2">
          {event.exercises.map((exercise, idx) => (
            <ExerciseCard key={idx} exercise={exercise} index={idx + 1} />
          ))}
        </div>
      </div>
      
      {/* Assigned Players */}
      <AssignedPlayersSection players={event.assignedPlayers} />
    </div>
  );
};

// apps/frontend/src/components/schedule/event-content/IcePracticeContent.tsx
export const IcePracticeContent: React.FC<{ event: IcePractice }> = ({ event }) => {
  return (
    <div className="space-y-6">
      {/* Practice Overview */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Ice Time" value={`${event.duration} min`} icon={Clock} />
        <MetricCard label="Drills" value={event.drills.length} icon={Target} />
        <MetricCard label="Focus" value={event.focus} icon={Focus} />
      </div>
      
      {/* Practice Plan */}
      <div>
        <h3 className="font-semibold mb-3">Practice Plan</h3>
        <Timeline>
          {event.drills.map((drill, idx) => (
            <TimelineItem key={idx}>
              <DrillCard drill={drill} duration={drill.duration} />
            </TimelineItem>
          ))}
        </Timeline>
      </div>
      
      {/* Line Assignments */}
      <LineAssignments lines={event.lines} />
    </div>
  );
};
```

### Phase 5: API Integration (Week 3)

#### 5.1 Redux Store Updates
```typescript
// apps/frontend/src/store/api/scheduleApi.ts
export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Schedule', 'Event'],
  endpoints: (builder) => ({
    getTodaySchedule: builder.query<ScheduleEvent[], void>({
      query: () => '/schedule/today',
      providesTags: ['Schedule']
    }),
    
    getEvent: builder.query<ScheduleEvent, string>({
      query: (id) => `/schedule/event/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }]
    }),
    
    updateEvent: builder.mutation<ScheduleEvent, UpdateEventDto>({
      query: ({ id, ...data }) => ({
        url: `/schedule/event/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Event', id },
        'Schedule'
      ]
    }),
    
    launchEvent: builder.mutation<LaunchResponse, LaunchEventDto>({
      query: (data) => ({
        url: `/schedule/event/${data.id}/launch`,
        method: 'POST',
        body: data
      })
    })
  })
});
```

#### 5.2 Mock Data Updates
```typescript
// apps/frontend/src/store/api/mockAdapters/scheduleMockAdapter.ts
export const scheduleMockData = {
  todaySchedule: [
    {
      id: 'evt-001',
      type: EventType.TRAINING,
      title: 'Strength Training',
      description: 'Max strength testing - 1RM squats and deadlifts',
      startTime: '2025-01-28T06:00:00Z',
      endTime: '2025-01-28T07:30:00Z',
      location: 'Weight Room',
      participants: generateParticipants(25),
      intensity: 'high',
      status: 'upcoming'
    },
    {
      id: 'evt-002',
      type: EventType.ICE_PRACTICE,
      title: 'Power Play Practice',
      description: 'Special teams practice - PP and PK units',
      startTime: '2025-01-28T09:00:00Z',
      endTime: '2025-01-28T10:30:00Z',
      location: 'Main Rink',
      participants: generateParticipants(28),
      focus: 'special-teams',
      status: 'upcoming'
    },
    {
      id: 'evt-003',
      type: EventType.MEDICAL,
      title: 'Injury Assessment',
      description: 'Lower body evaluation - Sidney Crosby',
      startTime: '2025-01-28T10:30:00Z',
      endTime: '2025-01-28T11:00:00Z',
      location: 'Medical Room',
      participants: ['player-087'],
      confidential: true,
      status: 'upcoming'
    },
    {
      id: 'evt-004',
      type: EventType.GAME,
      title: 'vs Toronto Maple Leafs',
      description: 'NHL Regular Season - Home Game',
      startTime: '2025-01-28T19:00:00Z',
      endTime: '2025-01-28T22:00:00Z',
      location: 'PPG Paints Arena',
      participants: generateFullRoster(),
      gameType: 'regular',
      opponent: 'Toronto Maple Leafs',
      status: 'upcoming'
    }
  ]
};
```

## 📱 Mobile Responsiveness

```tsx
// Responsive Schedule Card
<div className="flex flex-col sm:flex-row items-start sm:items-center p-3">
  {/* Mobile: Stack vertically */}
  <div className="w-full sm:w-auto sm:flex-shrink-0">
    {/* Time section */}
  </div>
  
  <div className="flex-1 mt-2 sm:mt-0 sm:mx-4">
    {/* Content */}
  </div>
  
  <div className="w-full sm:w-auto mt-3 sm:mt-0">
    {/* Actions - Full width on mobile */}
    <Button className="w-full sm:w-auto">
      {config.viewLabel}
    </Button>
  </div>
</div>
```

## 🔒 Permission Matrix

```typescript
const PERMISSION_MATRIX = {
  [EventType.TRAINING]: {
    view: ['all'],
    edit: ['physicalTrainer', 'admin'],
    launch: ['physicalTrainer', 'coach', 'player'],
    cancel: ['physicalTrainer', 'admin']
  },
  [EventType.ICE_PRACTICE]: {
    view: ['all'],
    edit: ['iceCoach', 'headCoach', 'admin'],
    launch: ['iceCoach', 'assistantCoach'],
    cancel: ['iceCoach', 'headCoach', 'admin']
  },
  [EventType.GAME]: {
    view: ['all'],
    edit: ['teamManager', 'admin'],
    launch: ['teamManager', 'coach'],
    cancel: ['teamManager', 'admin']
  },
  [EventType.MEDICAL]: {
    view: ['medicalStaff', 'player:self', 'coach:limited'],
    edit: ['medicalStaff'],
    launch: ['medicalStaff'],
    cancel: ['medicalStaff']
  }
};
```

## 🚀 Deployment Strategy

### Week 1: Foundation
- [ ] Create unified schedule service
- [ ] Update API endpoints
- [ ] Create base components
- [ ] Update mock data

### Week 2: Integration
- [ ] Update Physical Trainer dashboard
- [ ] Update Player dashboard
- [ ] Create Ice Coach dashboard
- [ ] Implement preview pages

### Week 3: Polish
- [ ] Add launch actions
- [ ] Implement viewers
- [ ] Add real-time updates
- [ ] Test cross-role workflows

### Week 4: Release
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Training materials

## 📊 Success Metrics

1. **Adoption Rate**: 80% of users viewing unified schedule daily
2. **Launch Success**: 95% successful session launches
3. **Cross-Role Usage**: 60% of events viewed by multiple roles
4. **Performance**: <500ms load time for today's schedule
5. **User Satisfaction**: 4.5+ star rating

## 🎯 Testing Checklist

### Unit Tests
- [ ] Schedule service methods
- [ ] Event mapping functions
- [ ] Permission checks
- [ ] Launch action logic

### Integration Tests
- [ ] API endpoints
- [ ] Redux store updates
- [ ] Cross-service communication
- [ ] WebSocket connections

### E2E Tests
- [ ] Physical Trainer workflow
- [ ] Player workflow
- [ ] Ice Coach workflow
- [ ] Cross-role interactions

## 📝 Migration Notes

1. **Backward Compatibility**: Keep old endpoints active for 30 days
2. **Feature Flag**: Use `UNIFIED_SCHEDULE` flag for gradual rollout
3. **Data Migration**: Map existing events to new unified format
4. **User Communication**: In-app notifications about new features

## 🔄 Future Enhancements

1. **Phase 2**: Add team calendar view (month/week views)
2. **Phase 3**: Implement recurring events
3. **Phase 4**: Add conflict detection and resolution
4. **Phase 5**: Mobile app integration
5. **Phase 6**: AI-powered schedule optimization

---

**Implementation Start Date**: January 29, 2025
**Target Completion**: February 26, 2025
**Product Owner**: Hockey Hub Team
**Technical Lead**: Development Team