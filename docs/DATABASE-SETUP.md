# Database Setup for Hockey Hub

## Architecture

Hockey Hub uses a microservices architecture where **each service has its own dedicated PostgreSQL database**. This provides better isolation, scalability, and allows each service to evolve independently.

## Quick Start with Docker

### 1. Start All Databases

**Windows (PowerShell):**
```powershell
.\scripts\start-databases.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/start-databases.sh
./scripts/start-databases.sh
```

Or manually with Docker Compose:
```bash
docker-compose up -d db-users db-admin db-calendar db-communication db-medical db-payment db-planning db-statistics db-training
```

### 2. Verify Databases are Running
```bash
docker ps | grep hockeyhub_db
```

## Database Configuration

Each service connects to its own database on a different port:

| Service | Database Name | Port | Container Name |
|---------|--------------|------|----------------|
| User Service | hockey_hub_users | 5432 | hockeyhub_db_users |
| Admin Service | hockey_hub_admin | 5433 | hockeyhub_db_admin |
| Calendar Service | hockey_hub_calendar | 5434 | hockeyhub_db_calendar |
| Communication Service | hockey_hub_communication | 5435 | hockeyhub_db_communication |
| Medical Service | hockey_hub_medical | 5436 | hockeyhub_db_medical |
| Payment Service | hockey_hub_payment | 5437 | hockeyhub_db_payment |
| Planning Service | hockey_hub_planning | 5438 | hockeyhub_db_planning |
| Statistics Service | hockey_hub_statistics | 5439 | hockeyhub_db_statistics |
| Training Service | hockey_hub_training | 5440 | hockeyhub_db_training |

### Database Credentials
- **Username**: `postgres`
- **Password**: `hockey_hub_password`
- **Host**: `localhost` (when running services locally)
- **Host**: `db-{service}` (when running services in Docker)

## Running Without Database

The training service has been updated to run without a database connection. It will:
- Start the service on port 3004
- Provide mock data for testing
- Show warnings in the console about missing database

This allows you to test the frontend features immediately while setting up the database later.

## Database Configuration

Each service uses its own database:
- `hockey_hub_users` - User Service
- `hockey_hub_training` - Training Service
- `hockey_hub_medical` - Medical Service
- `hockey_hub_calendar` - Calendar Service
- `hockey_hub_communication` - Communication Service
- `hockey_hub_payment` - Payment Service
- `hockey_hub_statistics` - Statistics Service
- `hockey_hub_planning` - Planning Service
- `hockey_hub_admin` - Admin Service

## Environment Variables

The default configuration in `.env` files uses:
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `hockey_hub_password`

Update these in the service `.env` files if your PostgreSQL setup is different.

## Troubleshooting

### "createdb: command not found"
Make sure PostgreSQL is installed and the bin directory is in your PATH.

### "FATAL: password authentication failed"
Update the DB_PASSWORD in the service's `.env` file to match your PostgreSQL password.

### "could not connect to server"
Make sure PostgreSQL is running:
- Windows: Check Services for "postgresql-x64-XX"
- Mac: `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`

## Next Steps

After creating the database:
1. Restart the development server: `pnpm run dev`
2. The training service will connect to the database
3. Tables will be created automatically on first run
4. You can start creating real workout sessions!