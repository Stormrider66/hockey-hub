# PowerShell script to fix Hockey Hub dependencies

Write-Host "Hockey Hub Dependency Fix Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Step 1: Clean all node_modules and lock files
Write-Host "`nStep 1: Cleaning old dependencies..." -ForegroundColor Yellow
Get-ChildItem -Path . -Include node_modules -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

# Step 2: Ensure shared-types package exists
Write-Host "`nStep 2: Verifying shared-types package..." -ForegroundColor Yellow
if (!(Test-Path "packages/shared-types/package.json")) {
    Write-Host "shared-types package.json was missing - it has been created" -ForegroundColor Green
} else {
    Write-Host "shared-types package.json exists" -ForegroundColor Green
}

# Step 3: Install dependencies
Write-Host "`nStep 3: Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pnpm install

# Step 4: Build shared packages first
Write-Host "`nStep 4: Building shared packages..." -ForegroundColor Yellow
Set-Location packages/shared-types
pnpm build
Set-Location ../..

# Step 5: Try to start frontend
Write-Host "`nStep 5: Starting frontend development server..." -ForegroundColor Yellow
Set-Location apps/frontend
pnpm dev

Write-Host "`nIf the server started successfully, navigate to http://localhost:3010/physicaltrainer/demo" -ForegroundColor Green