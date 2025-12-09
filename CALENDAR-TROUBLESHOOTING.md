# Calendar Team Filtering - Troubleshooting Guide

## Changes Made

### 1. **Calendar API Mock Integration**
- Updated `calendarApi.ts` to use `mockBaseQuery` when `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`
- This is set in your `.env.local` file

### 2. **Mock Data Endpoints**
- Added support for `/events/date-range` endpoint in `mockBaseQuery.ts`
- Events are generated dynamically based on:
  - Date range provided
  - Team ID (if specified)
  - Event pattern: Monday (Training), Wednesday (Games), Friday (Meetings)

### 3. **Calendar Component Updates**
- `CalendarView.tsx` now passes `teamId` to the API query
- Removed hardcoded mock events from the component
- Added debug component to help troubleshoot

### 4. **CSS Fixes**
- Fixed yellow background issues in `calendar.css`
- Today's date only highlighted in calendar cells
- Removed selected date highlighting

## Troubleshooting Steps

### 1. **Check Debug Information**
The calendar now shows debug info at the top (in development mode) showing:
- Organization ID
- Team ID 
- Date range
- Number of events loaded
- Any errors

### 2. **Verify in Browser Console**
Open browser console (F12) and run:
```javascript
// Check if mock auth is enabled
console.log('Mock Auth:', process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH);

// Check localStorage for token
console.log('Token:', localStorage.getItem('access_token'));
```

### 3. **Network Tab**
1. Open Network tab in browser DevTools
2. Look for requests to `/api/calendar/events/date-range`
3. Check the request parameters include `teamId`
4. Check the response contains events

### 4. **Clear Cache & Restart**
```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf apps/frontend/.next

# Restart
cd apps/frontend
pnpm dev
```

### 5. **Manual API Test**
You can test the mock API directly by creating a test component or using the browser console:

```javascript
// In browser console after page loads
fetch('/api/calendar/events/date-range?startDate=2025-01-01&endDate=2025-01-31&teamId=a-team', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
}).then(r => r.json()).then(console.log);
```

## Expected Results

When working correctly, you should see:

1. **Debug Card** showing:
   - Events Count: 3-12 (depending on date range)
   - Team ID: The selected team
   - No errors

2. **Calendar Events**:
   - Team-specific titles (e.g., "A-Team Training", "J20 vs Rivals")
   - Proper colors (Green for training, Red for games, Blue for meetings)
   - Events change when you switch teams

3. **No Visual Issues**:
   - No yellow highlighting except today's date
   - No duplicate date numbers

## If Still Not Working

1. **Check Environment Variables**
   Make sure `.env.local` has:
   ```
   NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
   ```

2. **Browser Hard Refresh**
   - Windows/Linux: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

3. **Check for TypeScript Errors**
   ```bash
   cd apps/frontend
   pnpm run type-check
   ```

4. **Restart Dev Server**
   Sometimes Next.js dev server needs a full restart to pick up environment variable changes.

## Files Modified
- `/apps/frontend/src/store/api/calendarApi.ts`
- `/apps/frontend/src/store/api/mockBaseQuery.ts`
- `/apps/frontend/src/features/calendar/components/CalendarView.tsx`
- `/apps/frontend/src/features/calendar/styles/calendar.css`
- `/apps/frontend/src/features/calendar/components/CalendarDebug.tsx` (new)

---

The debug component will help identify exactly what's happening. Once you see the debug info, we can determine if:
1. The API is being called correctly
2. The mock data is being returned
3. The events are being processed properly