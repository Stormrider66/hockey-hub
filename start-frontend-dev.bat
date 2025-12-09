@echo off
echo Starting Hockey Hub Frontend Development Server...
echo.
echo The frontend will be available at http://localhost:3002
echo.
echo To stop the server, press Ctrl+C
echo.

cd /d "%~dp0"
pnpm dev:frontend