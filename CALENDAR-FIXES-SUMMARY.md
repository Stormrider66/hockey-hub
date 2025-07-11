# Calendar Team Filtering & Display Fixes

## Issues Identified
1. **Team-specific events not showing** - Calendar was showing generic events instead of team-specific ones
2. **Yellow background highlighting** - Incorrect CSS styling causing date selection issues
3. **Calendar API not using mock data** - The calendar wasn't connected to the mock data system

## Fixes Applied

### 1. Calendar API Mock Integration
**File**: `/apps/frontend/src/store/api/calendarApi.ts`
- Added import for `mockBaseQuery`
- Updated `calendarApi` to use mock data when `NEXT_PUBLIC_USE_MOCK_API` is true
- This ensures calendar events come from the mock system with team filtering

### 2. Team Filtering in Calendar View
**File**: `/apps/frontend/src/features/calendar/components/CalendarView.tsx`
- Added `teamId` parameter to `useGetEventsByDateRangeQuery` call
- Updated mock event generation to include team names when `teamId` is provided
- Added `getTeamName` helper function for consistent team naming

### 3. Mock Data Date Range Support
**File**: `/apps/frontend/src/store/api/mockBaseQuery.ts`
- Added comprehensive date range query handling for calendar events
- Events are now generated dynamically based on:
  - Start and end dates provided
  - Team ID for filtering
  - Different event types on different days (Monday: Training, Wednesday: Games, Friday: Meetings)

### 4. CSS Styling Fixes
**File**: `/apps/frontend/src/features/calendar/styles/calendar.css`
- Fixed `.rbc-today` to only apply to month view cells (not causing yellow backgrounds elsewhere)
- Disabled `.rbc-selected` background color to prevent selection highlighting issues
- Added rule to hide duplicate date headers in month view

## How It Works Now

### Team Selection Flow
1. User selects a team in the Team Selector dropdown
2. Calendar receives the `teamId` prop
3. Calendar API fetches events filtered by that team
4. Mock data generates team-specific events with proper naming

### Event Display
- **All Teams**: Shows events from multiple teams with team names in titles
- **Specific Team**: Shows only that team's events (e.g., "A-Team Training", "A-Team vs Rivals")
- **Personal View**: Shows individual training sessions

### Mock Event Generation
Events are generated dynamically based on the calendar view:
- **Monday**: Team training sessions (9:00-11:00)
- **Wednesday**: Games (19:00-22:00)
- **Friday**: Team meetings (14:00-15:30)

## Testing Instructions

1. **Team Filtering**:
   - Select different teams from the dropdown
   - Verify calendar shows team-specific events
   - Check that event titles include team names

2. **Visual Issues**:
   - Verify no yellow highlighting on random dates
   - Check that today's date is properly highlighted
   - Ensure no duplicate date numbers appear

3. **Event Types**:
   - Training events should be green
   - Games should be red
   - Meetings should be blue

## Next Steps

1. **Real Backend Integration**: When backend is ready, remove mock data and ensure:
   - Calendar API includes `teamId` in requests
   - Backend filters events by team
   - Event titles include team information

2. **Performance**: Consider caching calendar data per team to reduce API calls

3. **Enhancement**: Add team colors to events for better visual distinction

---

**Status**: ✅ Complete and Working
**Date**: January 2025