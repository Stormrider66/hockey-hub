@echo off
echo Installing dependencies and starting frontend...
cd /d "%~dp0"

echo.
echo Step 1: Installing dependencies from root...
cd ..\..
call pnpm install --no-frozen-lockfile

echo.
echo Step 2: Starting frontend dev server...
cd apps\frontend
call pnpm dev

pause