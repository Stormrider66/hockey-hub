@echo off
echo 🧹 Cleaning Next.js cache and build files...

:: Remove Next.js build cache
rmdir /s /q .next 2>nul

:: Remove node_modules cache
rmdir /s /q node_modules\.cache 2>nul

:: Remove any lockfiles
del /f .next.lock 2>nul

echo ✅ Cache cleared!
echo.
echo 🚀 Starting development server...
echo.

:: Start the dev server
call pnpm dev