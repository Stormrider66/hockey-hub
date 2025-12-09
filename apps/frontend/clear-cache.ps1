# Clear all Next.js and browser caches for Hockey Hub

Write-Host "Clearing Hockey Hub caches..." -ForegroundColor Yellow

# Clear Next.js build cache
Write-Host "Removing .next directory..." -ForegroundColor Cyan
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Clear node_modules cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Cyan
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Clear pnpm cache
Write-Host "Clearing pnpm cache..." -ForegroundColor Cyan
pnpm store prune

Write-Host "`nCache clearing complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run 'pnpm dev' to restart the development server" -ForegroundColor White
Write-Host "2. Open browser and navigate to http://localhost:3010/physicaltrainer" -ForegroundColor White
Write-Host "3. Press Ctrl+F5 (or Cmd+Shift+R on Mac) to hard refresh" -ForegroundColor White
Write-Host "4. If using Chrome, open DevTools (F12) > Application > Storage > Clear site data" -ForegroundColor White