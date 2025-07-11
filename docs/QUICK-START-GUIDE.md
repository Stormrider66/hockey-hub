# Hockey Hub - Quick Start Guide

Get Hockey Hub running in 5 minutes! This guide provides the fastest path to start developing with Hockey Hub.

## 🎯 Choose Your Path

### 1️⃣ Frontend Only (Fastest - 2 minutes)
Perfect for UI development, component work, and frontend testing.

```bash
# Navigate to frontend
cd apps/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

✅ **Access**: http://localhost:3010  
✅ **Mock Auth**: Enabled - click any role to login  
✅ **Mock Data**: All features work with fake data  

### 2️⃣ Full Stack (Complete - 10 minutes)
For backend development and full system testing.

```bash
# From root directory
pnpm install
pnpm run dev
```

✅ **Frontend**: http://localhost:3010  
✅ **API**: http://localhost:3000  
✅ **API Docs**: http://localhost:3000/api-docs  

## 📋 Prerequisites

### Essential
- **Node.js 18+** (check with `node --version`)
- **pnpm** (`npm install -g pnpm`)

### For Full Stack
- **Docker Desktop** (for databases)
- **8GB RAM minimum**
- **20GB free disk space**

## 🛠️ Initial Setup (First Time Only)

### 1. Clone Repository
```bash
git clone https://github.com/your-org/hockey-hub.git
cd hockey-hub
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 4. Database Setup (Full Stack Only)
```bash
# Start databases with Docker
docker-compose up -d postgres redis

# Run migrations
pnpm run migrate:all
```

## 🏃‍♂️ Quick Commands

### Development
```bash
# Start everything
pnpm dev

# Start frontend only
pnpm dev:frontend

# Start specific service
pnpm --filter training-service dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Database
```bash
# Run migrations
pnpm run migrate:all

# Reset database
pnpm run db:reset

# Seed test data
pnpm run db:seed
```

## 🔧 Common Issues & Solutions

### Port Conflicts
```bash
# Error: Port 3010 already in use
# Solution: Kill the process
lsof -ti:3010 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3010    # Windows
```

### Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Connection
```bash
# Check if Docker is running
docker ps

# Restart databases
docker-compose restart postgres redis
```

### Frontend Build Issues
```bash
# Clear Next.js cache
rm -rf apps/frontend/.next
cd apps/frontend && pnpm dev
```

## 🔐 Authentication

### Mock Auth (Development)
Already enabled! Just click any role button on the login page.

### Real Auth Setup
1. Start all backend services: `pnpm dev`
2. Use test credentials:
   - Admin: `admin@hockeyhub.com` / `Admin123!`
   - Coach: `coach@hockeyhub.com` / `Coach123!`
   - Player: `player@hockeyhub.com` / `Player123!`

## 📍 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3010 | http://localhost:3010 |
| API Gateway | 3000 | http://localhost:3000 |
| User Service | 3001 | http://localhost:3001 |
| Calendar Service | 3003 | http://localhost:3003 |
| Training Service | 3004 | http://localhost:3004 |
| Medical Service | 3005 | http://localhost:3005 |
| Storybook | 6006 | http://localhost:6006 |

## ✅ Verify Everything Works

### Frontend
1. Navigate to http://localhost:3010
2. Click any role to login (mock auth)
3. Explore the dashboard

### API
1. Visit http://localhost:3000/api-docs
2. Check service health: http://localhost:3000/health

### Database
```bash
# Check database connection
docker exec -it hockey-hub-postgres psql -U postgres -c "\l"
```

## 🚨 Troubleshooting

### "Cannot find module" Error
```bash
pnpm install
pnpm run build:shared
```

### "EADDRINUSE" Error
Port is already in use. Find and kill the process or change the port in `.env`.

### TypeScript Errors
```bash
# Rebuild TypeScript definitions
pnpm run build:types
```

### Database Migration Failed
```bash
# Reset and retry
docker-compose down -v
docker-compose up -d
pnpm run migrate:all
```

## 📚 Next Steps

- **Explore Features**: Check out all 8 role-based dashboards
- **Read Docs**: See [Developer Guide](./DEVELOPER-GUIDE.md) for detailed information
- **Join Community**: Submit issues or PRs on GitHub
- **Deploy**: See [Deployment Guide](./DEPLOYMENT-GUIDE.md) for production setup

## 🆘 Getting Help

- **Documentation**: [Full Documentation](./README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/hockey-hub/issues)
- **Chat**: Join our Discord server
- **Email**: support@hockeyhub.com

---

**Quick Tips:**
- 🚀 Use mock auth for fastest development
- 🔄 Keep Docker running for databases
- 📦 Use pnpm for all commands
- 🛑 Check logs if something fails
- 💡 Frontend works independently!

*Last updated: July 2025 | Version: 1.0*