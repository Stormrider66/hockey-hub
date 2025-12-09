@echo off
REM Hockey Hub Frontend Development Startup Script (Windows)
REM This script helps fix common startup issues and launches the frontend

echo.
echo 🏒 Hockey Hub Frontend Development Startup
echo =========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
  echo ⚠️  node_modules not found. Running pnpm install...
  call pnpm install
) else (
  echo ✅ node_modules found
)

REM Clear Next.js cache
echo.
echo 🧹 Clearing Next.js cache...
if exist ".next\cache" rmdir /s /q ".next\cache"

REM Clear localStorage data that might be corrupted
echo.
echo 💾 Note: If you encounter Redux persist errors, clear your browser's localStorage:
echo    1. Open DevTools ^(F12^)
echo    2. Go to Application tab
echo    3. Click on localStorage
echo    4. Right-click and Clear
echo.

REM Check environment configuration
if exist ".env.local" (
  echo ✅ .env.local found
  
  REM Check if mock auth is enabled
  findstr /C:"NEXT_PUBLIC_ENABLE_MOCK_AUTH=true" .env.local >nul
  if %errorlevel% equ 0 (
    echo ✅ Mock authentication is ENABLED
    echo.
    echo 🚀 Quick Access URLs ^(after startup^):
    echo    Physical Trainer: http://localhost:3010/physicaltrainer
    echo    Login Page: http://localhost:3010/login ^(with dev quick login panel^)
    echo.
  ) else (
    echo ⚠️  Mock authentication is DISABLED
    echo    To enable quick development access, set NEXT_PUBLIC_ENABLE_MOCK_AUTH=true in .env.local
  )
) else (
  echo ⚠️  .env.local not found. Creating from .env.example...
  copy .env.example .env.local
  
  REM Enable mock auth by default for development (Windows PowerShell command)
  powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_ENABLE_MOCK_AUTH=false', 'NEXT_PUBLIC_ENABLE_MOCK_AUTH=true' | Set-Content .env.local"
  echo ✅ Created .env.local with mock auth enabled
)

echo.
echo 🚀 Starting development server...
echo =========================================
echo.

REM Start the development server
call pnpm dev