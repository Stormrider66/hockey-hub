@echo off
echo Hockey Hub Essential Services
echo =============================
echo Starting: Frontend, API Gateway, and User Service only
echo.

REM Kill existing Node processes
echo Stopping existing services...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start API Gateway in new window
echo Starting API Gateway...
start "API Gateway" cmd /k "cd services\api-gateway && pnpm run dev"

REM Wait for gateway
timeout /t 3 /nobreak >nul

REM Start User Service in new window  
echo Starting User Service...
start "User Service" cmd /k "cd services\user-service && pnpm run dev"

REM Wait for services
timeout /t 3 /nobreak >nul

REM Start Frontend in current window
echo Starting Frontend...
cd apps\frontend
pnpm run dev