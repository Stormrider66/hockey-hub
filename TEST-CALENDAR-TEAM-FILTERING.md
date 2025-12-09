# Testing Calendar Team Filtering

## Quick Test Steps

1. **Open Physical Trainer Dashboard**
   - Navigate to http://localhost:3010
   - Login with mock credentials (if needed)
   - Go to Physical Trainer dashboard

2. **Test Team Selection**
   - Look for the Team Selector dropdown (should be between header and tabs)
   - Try selecting different teams:
     - "All Teams" - Should show events from multiple teams
     - "A-Team" - Should show only A-Team events
     - "J20" - Should show only J20 events
     - etc.

3. **Verify Calendar Events**
   - Click on the Calendar tab
   - Check that events show team-specific titles:
     - "A-Team Training" (not just "Training Session")
     - "J20 vs Rivals" (not just "Team vs Rivals")
     - "U18 Strategy Meeting" (not just "Team Meeting")

4. **Check Event Colors**
   - Training events: Green
   - Games: Red  
   - Meetings: Blue

5. **Verify No Yellow Highlighting Issues**
   - Check that only today's date has a light yellow background
   - No other dates should have yellow highlighting
   - Selected dates should not show yellow background

## Debugging Commands

If events aren't showing:

1. **Check Browser Console**
   ```javascript
   // Open browser console (F12) and check for:
   // - Network requests to /api/calendar/events/date-range
   // - Any JavaScript errors
   ```

2. **Verify Mock API is Enabled**
   - Check that `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true` in `.env.local`
   - The calendar should be using mock data

3. **Force Refresh**
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache if needed

## Expected Behavior

### When "A-Team" is selected:
- Monday: "A-Team Training" at 9:00-11:00
- Wednesday: "A-Team vs Rivals" at 19:00-22:00  
- Friday: "A-Team Strategy Meeting" at 14:00-15:30

### When "All Teams" is selected:
- Should see events from multiple teams
- Each event title includes the team name

### Visual Check:
- No duplicate date numbers in calendar header
- Today's date highlighted with light yellow background
- No other yellow highlights on random dates

## Common Issues

1. **No Events Showing**
   - Ensure mock API is enabled
   - Check browser console for errors
   - Verify calendar is in current month

2. **Generic Event Names**
   - Clear browser cache
   - Hard refresh the page
   - Check team selector has a team selected

3. **Yellow Highlighting Issues**
   - Should be fixed by CSS changes
   - Only today's date should have yellow background