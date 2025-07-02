@echo off
setlocal enabledelayedexpansion

echo ======================================
echo Hockey Hub Coverage Collection
echo ======================================
echo.

REM Clean previous coverage
echo Cleaning previous coverage data...
for /d /r . %%d in (coverage) do (
    if not "%%d"=="%~dp0node_modules\coverage" (
        if exist "%%d" rd /s /q "%%d" 2>nul
    )
)
if exist ".nyc_output" rd /s /q ".nyc_output"
if exist "coverage" rd /s /q "coverage"

REM Run tests with coverage for all workspaces
echo.
echo Running tests with coverage...
echo.

REM Frontend
echo Frontend Coverage
echo -----------------
cd apps\frontend
call pnpm test:coverage --silent
cd ..\..

REM Services
echo.
echo Services Coverage
echo -----------------
for /d %%s in (services\*) do (
    if exist "%%s\package.json" (
        echo Testing %%~ns...
        cd "%%s"
        call pnpm test:coverage --silent
        cd ..\..
    )
)

REM Packages
echo.
echo Packages Coverage
echo -----------------
for /d %%p in (packages\*) do (
    if exist "%%p\package.json" if exist "%%p\jest.config.js" (
        echo Testing %%~np...
        cd "%%p"
        call pnpm test:coverage --silent
        cd ..\..
    )
)

REM Merge coverage
echo.
echo Merging coverage reports...
call node scripts\merge-coverage.js

REM Generate reports
echo.
echo Generating coverage reports...
call node scripts\generate-coverage-report.js

REM Generate badges
echo.
echo Generating coverage badges...
call node scripts\generate-coverage-badge.js

echo.
echo Coverage collection complete!
echo View HTML report: file:///%cd:\=/%/coverage/index.html

endlocal