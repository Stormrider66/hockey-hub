@echo off
echo Hockey Hub Frontend (Mock Mode)
echo ==============================

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install --no-frozen-lockfile
)

REM Navigate to frontend directory
cd apps\frontend

REM Check if frontend dependencies are installed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call pnpm install
)

REM Start the frontend
echo Starting frontend on http://localhost:3010
echo Running in mock mode - no backend services required
call pnpm run dev