# Quick Development Start Guide

## Frontend Only (Fastest Start)

To just start the frontend development server:

```bash
# From the root directory
npm run dev:frontend
```

The frontend will be available at http://localhost:3010

## Full Stack Development

### Prerequisites
1. Docker Desktop installed and running
2. Node.js 18+ and pnpm installed
3. PostgreSQL and Redis running (or use Docker)

### Option 1: Using Docker for Services (Recommended)

```bash
# 1. Start all backend services with Docker
docker-compose up -d

# 2. In a new terminal, start the frontend
npm run dev:frontend
```

### Option 2: Manual Service Start

If you prefer to run services manually:

```bash
# 1. Install dependencies (if not done)
pnpm install

# 2. Build shared packages first
cd packages/shared-lib && pnpm build
cd ../monitoring && pnpm build
cd ../translations && pnpm build
cd ../..

# 3. Start services individually (each in its own terminal)
cd services/user-service && npm run dev
cd services/api-gateway && npm run dev
cd services/medical-service && npm run dev
# ... etc for other services you need

# 4. Start frontend
cd apps/frontend && npm run dev
```

### Option 3: Fix File Service and Run All

To fix the file service issue and run everything:

```bash
# 1. Remove file-service temporarily
rm -rf services/file-service

# 2. Install all dependencies
pnpm install --no-frozen-lockfile

# 3. Run all services
npm run dev
```

## Common Issues & Solutions

### Issue: 'turbo' is not recognized
```bash
npm install -g turbo
```

### Issue: @hockey-hub/shared-lib not found
Make sure all workspace packages use `workspace:*` syntax:
```json
"@hockey-hub/shared-lib": "workspace:*"
```

### Issue: Port already in use
Check which ports are in use:
```bash
# Windows PowerShell
netstat -ano | findstr :3000
netstat -ano | findstr :3010

# Kill the process using the port
taskkill /PID <PID> /F
```

### Issue: Database connection errors
Make sure PostgreSQL and Redis are running:
```bash
# Using Docker
docker-compose up postgres redis -d

# Or install locally
# PostgreSQL: https://www.postgresql.org/download/
# Redis: https://redis.io/download
```

## Service URLs

- Frontend: http://localhost:3010
- API Gateway: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- User Service: http://localhost:3001
- Medical Service: http://localhost:3005
- Training Service: http://localhost:3004

## Quick Commands

```bash
# Frontend only (no backend needed for UI development)
npm run dev:frontend

# Build everything
npm run build

# Run tests
npm run test

# Check types
npm run typecheck

# Lint code
npm run lint
```

## Next Steps

1. The frontend is now running at http://localhost:3010
2. You can login with test credentials (check the login page)
3. To develop with full functionality, start the backend services
4. Check the API documentation at http://localhost:3000/api-docs (when API Gateway is running)