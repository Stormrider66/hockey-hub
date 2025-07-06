@echo off

REM Start script for frontend development with mock authentication

echo === Hockey Hub Frontend in Mock Mode ===
echo.
echo [✓] Mock authentication is enabled
echo [✓] No backend services required  
echo [✓] WebSocket connections disabled
echo.

REM Clear Next.js cache to avoid issues
echo Clearing Next.js cache...
if exist .next\cache (
    rmdir /s /q .next\cache
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting development server on http://localhost:3002
echo.
echo === Quick Login Options ===
echo    - Player: player@hockeyhub.com
echo    - Coach: coach@hockeyhub.com
echo    - Parent: parent@hockeyhub.com
echo    - Medical Staff: medical@hockeyhub.com
echo    - Equipment Manager: equipment@hockeyhub.com
echo    - Physical Trainer: trainer@hockeyhub.com
echo    - Club Admin: clubadmin@hockeyhub.com
echo    - Admin: admin@hockeyhub.com
echo.
echo Password: Any password works in mock mode
echo.

npm run dev