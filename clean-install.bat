@echo off
echo Cleaning and reinstalling Hockey Hub dependencies...

echo.
echo Step 1: Removing node_modules directories...
rmdir /s /q node_modules 2>nul
rmdir /s /q apps\frontend\node_modules 2>nul

echo.
echo Step 2: Removing pnpm-lock.yaml...
del /f /q pnpm-lock.yaml 2>nul

echo.
echo Step 3: Installing fresh dependencies...
pnpm install

echo.
echo Installation complete!
echo To start the frontend, run:
echo   cd apps\frontend
echo   pnpm dev
echo.
pause