# PowerShell script to restart frontend with clean cache
Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Clearing node_modules/.cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Starting development server..." -ForegroundColor Green
pnpm dev