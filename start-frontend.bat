@echo off
echo 🏒 Hockey Hub Frontend - Clean Start
echo =====================================
echo.

cd apps\frontend

echo 🧹 Clearing Next.js cache...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo.
echo 🚀 Starting development server...
echo.
echo After the server starts:
echo 1. Go to http://localhost:3002
echo 2. If you see translation keys, refresh the page
echo 3. Try the debug page: http://localhost:3002/debug/routes
echo.

call pnpm dev