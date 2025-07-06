@echo off
echo <Ò Hockey Hub Frontend Only Mode
echo ================================
echo.
echo This will start ONLY the frontend without backend services.
echo.

cd apps\frontend

echo >ù Clearing Next.js cache...
rmdir /s /q .next 2>nul

echo.
echo =€ Starting frontend server only...
echo.
echo After the server starts:
echo 1. Go to http://localhost:3002
echo 2. You can now access:
echo    - Dashboard (with proper navigation text)
echo    - Calendar view
echo    - Chat/Messages
echo    - Settings
echo.

call pnpm dev