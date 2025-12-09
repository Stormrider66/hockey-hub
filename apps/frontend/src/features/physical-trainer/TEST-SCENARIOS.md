# Physical Trainer - Enhanced Scheduling Test Scenarios

## 1. RecentWorkoutsWidget Enhanced Display ✅

### Test URL
`http://localhost:3010/physicaltrainer/test-scheduling`

### What to verify
- ✅ Location display with MapPin icon (e.g., "Main Training Center - Weight Room")
- ✅ Assigned teams count (e.g., "2 teams")
- ✅ Recurring status indicator (Repeat icon + "Weekly")
- ✅ Reminder status indicator (Bell icon when reminders are set)
- ✅ Existing date/time display remains functional

### Visual indicators
- MapPin icon for location
- Repeat icon (blue) for recurring workouts
- Bell icon (green) for workouts with reminders
- Star icon (yellow) for favorite workouts

## 2. Workout Creation with Context (From Team Roster)

### Test Flow
1. Navigate to Overview tab: `http://localhost:3010/physicaltrainer?tab=overview`
2. Find a session in "Today's Sessions" that says "Create Workout"
3. Click on it to open workout builder with pre-filled context

### What to verify
- Schedule tab shows pre-filled information:
  - Date matches the session date
  - Time matches the session time  
  - Location matches the session location
  - Team/player is pre-selected based on context
- After saving, verify the workout includes:
  - Correct location information
  - Proper team/player assignments
  - Session context linkage

### Test with each workout type
- Strength Training
- Conditioning
- Hybrid
- Agility

## 3. Direct Workout Creation (Without Context)

### Test Flow
1. Navigate to Sessions tab: `http://localhost:3010/physicaltrainer?tab=sessions`
2. Click "Create Workout" dropdown
3. Select a workout type

### What to verify
- Schedule tab shows default values:
  - Today's date
  - Default time (09:00)
  - Default location based on workout type
  - No pre-selected players/teams
- UnifiedScheduler allows:
  - Changing date/time
  - Selecting location
  - Adding players/teams
  - Setting recurrence
  - Adding reminders

## 4. Recurring Workout Configuration

### Test Flow
1. Create any workout type
2. Navigate to Schedule/Players tab
3. Enable "Recurring Session"

### What to verify
- Frequency options: Daily, Weekly, Biweekly, Monthly
- Days of week selector (for weekly/biweekly)
- End date picker
- Preview of next occurrences
- After saving:
  - RecentWorkoutsWidget shows Repeat icon
  - Recurring information displayed

### Test scenarios
- Weekly on MWF
- Daily for 2 weeks
- Monthly on the 15th
- Biweekly on Tuesdays

## 5. Player/Team Assignment Variations

### Test Flow
1. Create workouts with different assignment combinations

### Scenarios to test
a) **Individual players only**
   - Select 3-5 specific players
   - Verify player count in recent workouts

b) **Team assignment**
   - Select one team (e.g., Pittsburgh Penguins)
   - Verify team shows in recent workouts

c) **Multiple teams**
   - Select 2+ teams
   - Verify "2 teams" display

d) **Mixed assignment**
   - Select a team + additional individual players
   - Verify both counts are accurate

e) **No assignment**
   - Create without selecting anyone
   - Verify it saves but shows warning

## 6. Location Variations

### Test different location inputs
- **Weight Room** - Should show facility + area
- **Indoor Track** - Should show facility only
- **Main Training Center - Field 2** - Custom location with area
- Empty location - Should use default

## 7. Reminder Configuration

### Test Flow
1. Enable reminders in Schedule tab
2. Set different reminder options

### Scenarios
- Email 30 minutes before
- Push notification 1 hour before
- Multiple reminders (email + push)
- No reminders

### Verify
- Bell icon appears in recent workouts when reminders are set
- Reminder settings are preserved when editing

## 8. Data Persistence

### Test Flow
1. Create a workout with all enhanced features
2. Navigate away and come back
3. Edit the workout

### Verify all data is preserved
- Location (facility + area)
- Recurring settings
- Reminder settings
- Player/team assignments
- All workout-specific data

## 9. Mock Data Validation

### Check mock endpoints return enhanced data
```javascript
// GET /training/workouts/recent
{
  location: { facilityName: "Main Training Center", area: "Weight Room" },
  recurring: { frequency: "Weekly", daysOfWeek: [1,3,5] },
  hasReminders: true,
  assignedPlayers: ["player-001", "player-002"],
  assignedTeams: ["team-1"]
}
```

## 10. Edge Cases

### Test these scenarios
1. **Very long location names** - Should truncate gracefully
2. **Many team assignments** - Should show count, not list
3. **Recurring with exceptions** - Future enhancement
4. **Past date scheduling** - Should show warning
5. **Conflicting schedules** - Should detect and warn

## Common Issues to Watch For

1. **Icon imports** - All icons must come from `@/components/icons`
2. **Translation keys** - Use `physicalTrainer:` namespace
3. **Date/time formatting** - Consistent across all displays
4. **Responsive layout** - Information should stack on mobile
5. **Loading states** - Skeleton loaders for async data

## Success Criteria

✅ Recent workouts show enhanced scheduling info
✅ All workout builders integrate UnifiedScheduler
✅ Context from Team Roster pre-fills correctly
✅ Direct creation uses sensible defaults
✅ Recurring workouts configured and displayed
✅ Player/team assignments accurate
✅ Location information preserved and displayed
✅ Reminder status indicated visually
✅ All data persists through edit cycles
✅ Mock data includes enhanced fields