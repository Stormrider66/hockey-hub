@echo off
echo === Hockey Hub Frontend Clean Start ===
echo.
echo Cleaning build cache...

REM Kill any existing Node processes on port 3002
echo Checking for processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

REM Remove Next.js cache
if exist .next (
    echo Removing .next folder...
    rmdir /s /q .next
)

REM Remove node_modules .cache if exists
if exist node_modules\.cache (
    echo Removing node_modules cache...
    rmdir /s /q node_modules\.cache
)

echo.
echo Starting fresh development server...
echo.
npm run dev