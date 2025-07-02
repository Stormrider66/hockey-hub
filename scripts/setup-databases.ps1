# PowerShell script for Windows users
Write-Host "🔧 Setting up Hockey Hub databases..." -ForegroundColor Cyan

# Database configuration
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Array of databases to create
$DATABASES = @(
    "hockey_hub_users",
    "hockey_hub_training",
    "hockey_hub_medical",
    "hockey_hub_calendar",
    "hockey_hub_communication",
    "hockey_hub_payment",
    "hockey_hub_statistics",
    "hockey_hub_planning",
    "hockey_hub_admin"
)

# Function to create database
function Create-Database {
    param($db_name)
    
    # Check if database exists
    $checkCmd = "psql -U $DB_USER -h $DB_HOST -p $DB_PORT -l"
    $databases = & cmd /c $checkCmd 2>$null
    
    if ($databases -match $db_name) {
        Write-Host "⚠️  Database $db_name already exists" -ForegroundColor Yellow
    } else {
        # Create database
        $createCmd = "createdb -U $DB_USER -h $DB_HOST -p $DB_PORT $db_name"
        $result = & cmd /c $createCmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Created database: $db_name" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create database: $db_name" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
        }
    }
}

# Check if PostgreSQL is running
try {
    $pgCheck = & pg_isready -U $DB_USER -h $DB_HOST -p $DB_PORT 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL not ready"
    }
} catch {
    Write-Host "❌ PostgreSQL is not running or not accessible" -ForegroundColor Red
    Write-Host "   Please start PostgreSQL first" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Creating databases..." -ForegroundColor Cyan
Write-Host ""

# Create each database
foreach ($db in $DATABASES) {
    Create-Database $db
}

Write-Host ""
Write-Host "✨ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update service .env files with database credentials if needed"
Write-Host "2. Run 'pnpm run dev' to start all services"
Write-Host "3. Services will create tables automatically on first run"