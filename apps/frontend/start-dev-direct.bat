@echo off
echo Starting frontend development server...
cd /d "%~dp0"
call ..\..\node_modules\.bin\next dev -p 3010