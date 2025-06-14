# Frontend Integration Implementation Plan

## Overview
This plan outlines the immediate steps to integrate the authenticated frontend with role-based dashboards, calendar, and chat functionality based on the successful authentication integration achieved on June 7, 2025.

## Current Status
- ✅ Authentication working (Robert Ohlsson can log in)
- ✅ Frontend on port 3002, API Gateway on port 3000
- ❌ Robert is redirected to generic calendar instead of Coach Dashboard
- ❌ Missing calendar button on all dashboards
- ❌ Missing chat button on all dashboards

## Phase 1: Role-Based Dashboard Routing (Immediate)

### 1.1 Update Login Redirect Logic

**Current Issue**: All users are redirected to '/' after login
**Solution**: Implement role-based routing

```typescript
// apps/frontend/app/login/page.tsx
const getRoleBasedRoute = (roles: Role[]) => {
  // Priority order for users with multiple roles
  if (roles.some(r => r.name === 'admin')) return '/admin';
  if (roles.some(r => r.name === 'coach')) return '/coach';
  if (roles.some(r => r.name === 'player')) return '/player';
  if (roles.some(r => r.name === 'parent')) return '/parent';
  if (roles.some(r => r.name === 'medical_staff')) return '/medical';
  if (roles.some(r => r.name === 'physical_trainer')) return '/physical-trainer';
  if (roles.some(r => r.name === 'equipment_manager')) return '/equipment';
  if (roles.some(r => r.name === 'club_admin')) return '/club-admin';
  return '/'; // Fallback
};

// In onSubmit function:
const dashboardRoute = getRoleBasedRoute(user.roles);
router.push(dashboardRoute);
```

### 1.2 Update Home Page Redirect

```typescript
// apps/frontend/app/page.tsx
- Redirect authenticated users to their role-based dashboard
- Show login page for unauthenticated users
```

## Phase 2: Add Calendar and Chat Buttons to All Dashboards

### 2.1 Create Shared Header Component

```typescript
// apps/frontend/src/components/shared/DashboardHeader.tsx
interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: string;
}

export function DashboardHeader({ title, subtitle, role }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Link href={`/${role}/calendar`}>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </Link>
        <Link href="/chat">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Team Chat
          </Button>
        </Link>
        <Link href="/settings">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

### 2.2 Update Each Dashboard

Update all role-based dashboards to include the new header:
- `/app/coach/page.tsx`
- `/app/admin/page.tsx`
- `/app/player/page.tsx`
- `/app/parent/page.tsx`
- `/app/medical/page.tsx`
- `/app/physical-trainer/page.tsx`
- `/app/equipment/page.tsx`
- `/app/club-admin/page.tsx`

## Phase 3: Calendar Integration

### 3.1 Create Role-Based Calendar Views

```typescript
// apps/frontend/app/[role]/calendar/page.tsx
- Coach Calendar: Team events, training sessions, games
- Player Calendar: Personal schedule, training, games
- Parent Calendar: Child's schedule, parent meetings
- Medical Calendar: Treatment sessions, checkups
- Admin Calendar: System events, meetings
```

### 3.2 Calendar Service Connection

```typescript
// Connect to Calendar Service (port 3003) when available
// For now, use mock data with role-specific filtering
```

## Phase 4: Chat Integration

### 4.1 Basic Chat Interface

```typescript
// apps/frontend/app/chat/page.tsx
- Team chat rooms
- Direct messages
- Role-based access to channels
```

### 4.2 WebSocket Setup (Future)

```typescript
// Prepare for Communication Service (port 3002)
// Initial implementation with mock real-time updates
```

## Implementation Timeline

### Day 1 (Immediate - Today)
1. **Fix Role-Based Routing** (1-2 hours)
   - [ ] Update login redirect logic
   - [ ] Test with Robert's coach role
   - [ ] Update home page to redirect authenticated users

2. **Add Navigation Buttons** (2-3 hours)
   - [ ] Create DashboardHeader component
   - [ ] Add to Coach Dashboard
   - [ ] Add to all other dashboards
   - [ ] Test navigation flow

### Day 2
3. **Calendar Routes** (3-4 hours)
   - [ ] Create calendar pages for each role
   - [ ] Implement basic calendar UI
   - [ ] Add role-specific event filtering
   - [ ] Connect to calendar API when available

4. **Chat Interface** (2-3 hours)
   - [ ] Create basic chat page
   - [ ] Design chat UI with shadcn/ui
   - [ ] Implement mock conversations
   - [ ] Prepare for WebSocket integration

### Day 3
5. **Integration Testing** (2-3 hours)
   - [ ] Test all role-based flows
   - [ ] Verify calendar access per role
   - [ ] Test chat functionality
   - [ ] Fix any navigation issues

6. **Polish & Documentation** (1-2 hours)
   - [ ] Update memory bank
   - [ ] Document new routes
   - [ ] Create user guide

## Technical Implementation Details

### Authentication Context Enhancement
```typescript
// Add user role to auth context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  primaryRole: string | null; // Add this
}
```

### Protected Routes Pattern
```typescript
// apps/frontend/src/components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !user?.roles.some(r => allowedRoles.includes(r.name))) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}
```

## Success Criteria

### Immediate (Day 1)
- [ ] Robert logs in and lands on Coach Dashboard
- [ ] All dashboards have Calendar and Chat buttons
- [ ] Navigation between dashboards works

### Short-term (Days 2-3)
- [ ] Each role has their own calendar view
- [ ] Basic chat interface is accessible
- [ ] All navigation flows are smooth

### Validation
- [ ] Test with different user roles
- [ ] Verify role-based access control
- [ ] Ensure no regression in existing features
- [ ] Confirm Swedish localization works

## Risk Mitigation

1. **Calendar Service Not Ready**
   - Use mock data initially
   - Design API contracts based on service specs
   - Prepare for easy swap when service is ready

2. **Chat/WebSocket Complexity**
   - Start with static UI
   - Add real-time features progressively
   - Use polling as fallback if WebSocket fails

3. **Role Conflicts**
   - Define clear role hierarchy
   - Test users with multiple roles
   - Provide role switcher for multi-role users

## Next Steps After This Integration

Following the integrationPlan.md phases:
1. Complete Calendar Service integration
2. Training Session management
3. Medical records connection
4. Real-time features (WebSocket)
5. Notification system
6. Advanced analytics

This plan focuses on immediate improvements while setting the foundation for the comprehensive integration outlined in integrationPlan.md. 