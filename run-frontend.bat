@echo off
echo 🏒 Hockey Hub Frontend Startup Script
echo =====================================

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the Hockey Hub root directory
    exit /b 1
)

if not exist "apps\frontend" (
    echo ❌ Error: Frontend directory not found
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
echo Note: If you see permission errors, you may need to:
echo 1. Run as administrator
echo 2. Or manually run: pnpm install
echo.

:: Try to install dependencies
call pnpm install
if errorlevel 1 (
    echo ⚠️  Warning: pnpm install failed. You may need to run it manually.
)

echo.
echo 🚀 Starting the frontend development server...
echo The frontend will start on http://localhost:3002
echo.

cd apps\frontend
call pnpm dev