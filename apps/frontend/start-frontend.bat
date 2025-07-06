@echo off
echo === Hockey Hub Frontend - Mock Mode ===
echo.

REM Clear any stale auth data
echo Clearing stale authentication data...
echo localStorage.clear(); > "%TEMP%\clear-auth.js"
echo sessionStorage.clear(); >> "%TEMP%\clear-auth.js"

echo.
echo IMPORTANT: Visit http://localhost:3002/debug to check auth state
echo.
echo Quick Start:
echo 1. Go to http://localhost:3002/login
echo 2. Click any role in the Dev Login Panel
echo 3. If you get stuck in a loop, visit http://localhost:3002/debug
echo.

cd apps\frontend
npm run dev