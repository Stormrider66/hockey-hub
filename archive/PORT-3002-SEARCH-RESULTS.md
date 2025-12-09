# Port 3002 Search Results

## Summary
Searched for any code trying to start frontend on port 3002. Found and fixed one issue.

## Fixed Issue:
✅ **src/lib/i18n-client.ts**
- Was hardcoded to use `http://localhost:3002` for loading locale files
- Updated to use `http://localhost:3010`
- This was causing the i18n library to try to load translation files from the wrong port

## Correct References (Should NOT be changed):
These references to port 3002 are correct because they point to the Communication Service:

1. **src/contexts/ChatSocketContext.tsx**
   - `apiUrl = process.env.NEXT_PUBLIC_COMMUNICATION_API_URL || 'http://localhost:3002'`
   - This is correct - Communication Service runs on 3002

2. **src/contexts/NotificationContext.tsx**
   - `const COMMUNICATION_SERVICE_URL = process.env.NEXT_PUBLIC_COMMUNICATION_SERVICE_URL || 'http://localhost:3002'`
   - This is correct - Communication Service runs on 3002

## Port Allocation Reminder:
- 3000: API Gateway
- 3001: User Service
- 3002: Communication Service ✅ (Chat & Notifications)
- 3003: Calendar Service
- 3004-3009: Other services
- 3010: Frontend ✅

## Result:
No code is trying to start the frontend on port 3002. The only issue was the i18n configuration trying to load translation files from the wrong port, which has been fixed.