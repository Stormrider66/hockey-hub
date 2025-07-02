# PowerShell script to start databases
Write-Host "🚀 Starting Hockey Hub databases with Docker Compose..." -ForegroundColor Cyan

# Start only the database services
docker-compose up -d `
  db-users `
  db-admin `
  db-calendar `
  db-communication `
  db-medical `
  db-payment `
  db-planning `
  db-statistics `
  db-training

Write-Host ""
Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "📊 Database Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" | Select-String "hockeyhub_db"

Write-Host ""
Write-Host "✅ Databases are running!" -ForegroundColor Green
Write-Host ""
Write-Host "Database Ports:" -ForegroundColor Cyan
Write-Host "  - Users DB:          localhost:5432"
Write-Host "  - Admin DB:          localhost:5433"
Write-Host "  - Calendar DB:       localhost:5434"
Write-Host "  - Communication DB:  localhost:5435"
Write-Host "  - Medical DB:        localhost:5436"
Write-Host "  - Payment DB:        localhost:5437"
Write-Host "  - Planning DB:       localhost:5438"
Write-Host "  - Statistics DB:     localhost:5439"
Write-Host "  - Training DB:       localhost:5440"
Write-Host ""
Write-Host "Now you can run 'pnpm run dev' to start the services!" -ForegroundColor Green