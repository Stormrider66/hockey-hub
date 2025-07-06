# PowerShell script to start frontend dev server
Write-Host "Starting Hockey Hub Frontend Development Server..." -ForegroundColor Green

# Change to frontend directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running pnpm install from root..." -ForegroundColor Yellow
    Set-Location ..\..\
    & pnpm install --no-frozen-lockfile
    Set-Location apps\frontend
}

# Start the dev server
Write-Host "Starting Next.js dev server on port 3010..." -ForegroundColor Green
& pnpm dev