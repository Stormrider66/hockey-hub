Write-Host "Starting User Service..." -ForegroundColor Green
Set-Location -Path "C:\Hockey Hub"

try {
    # Run the service and capture output
    & pnpm --filter @hockey-hub/user-service start
} catch {
    Write-Host "Error starting service: $_" -ForegroundColor Red
}

# Keep the window open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 