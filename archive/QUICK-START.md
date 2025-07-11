# Hockey Hub - Quick Start Guide

Welcome to Hockey Hub! This guide will get you up and running quickly with our comprehensive hockey team management platform.

## 🚀 Project Status (July 2025)

Hockey Hub is **production-ready** with all major features complete:
- ✅ **All Dependencies Resolved**: Complete working system
- ✅ **8 Role-Based Dashboards**: Fully functional user interfaces
- ✅ **Professional Chat System**: Enterprise-grade messaging (100% complete)
- ✅ **19 Language Support**: Full internationalization
- ✅ **Advanced Calendar**: Complete scheduling system
- ✅ **Microservices Architecture**: 10 backend services with Redis caching

## Quick Start Options

### Option 1: Frontend Only (Recommended for Testing)

Run the frontend with mock data (no backend required):

**Windows:**
```bash
start-frontend-only.bat
```

**Linux/Mac:**
```bash
./start-frontend-only.sh
```

This will start the frontend on http://localhost:3002 with mock data.

### Option 2: Full Stack (Recommended for Development)

For complete functionality with all backend services:

```bash
# Start all services
pnpm run dev
```

This starts all services including:
- Frontend: http://localhost:3002
- API Gateway: http://localhost:3000
- All microservices on ports 3001-3009

### Option 3: Production Setup

For production deployment, see our [Deployment Guide](docs/DEPLOYMENT.md).

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **Docker** and **Docker Compose** (for databases)
- **PostgreSQL 14+** (can be run via Docker)
- **Redis 6+** (can be run via Docker)
- **Git** for cloning the repository

## 🛠️ Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/Stormrider66/hockey-hub.git
cd hockey-hub
```

### 2. Install Dependencies
```bash
# Install all dependencies using pnpm workspaces
pnpm install
```

### 3. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# Configure environment variables in each service
# Edit .env files as needed for your setup
```

### 4. Start Databases (Optional)
```bash
# If you want to use Docker for databases
docker-compose up -d postgres redis
```

### 5. Run Database Migrations
```bash
# Run migrations for all services
pnpm run migrate:all
```

## 🚀 Running the Application

### Development Mode
```bash
# Start all services in development mode
pnpm run dev
```

### Individual Services
```bash
# Frontend only
cd apps/frontend && pnpm run dev

# Specific backend service
cd services/user-service && pnpm run dev

# API Gateway
cd services/api-gateway && pnpm run dev
```

## 🔗 Access URLs

Once running, access the application at:

- **Frontend Application**: http://localhost:3002
- **API Gateway**: http://localhost:3000
- **Storybook (UI Components)**: http://localhost:6006 (run `pnpm run storybook`)

### Individual Services:
- User Service: http://localhost:3001
- Communication Service: http://localhost:3002
- Calendar Service: http://localhost:3003
- Training Service: http://localhost:3004
- Medical Service: http://localhost:3005
- Planning Service: http://localhost:3006
- Statistics Service: http://localhost:3007
- Payment Service: http://localhost:3008
- Admin Service: http://localhost:3009

## 🧪 Testing the Setup

### 1. Frontend Test
Visit http://localhost:3002 and you should see the Hockey Hub login page.

### 2. API Test
```bash
# Test API Gateway health
curl http://localhost:3000/health

# Test user service
curl http://localhost:3001/health
```

### 3. Run Tests
```bash
# Run all tests
pnpm run test

# Run frontend tests only
cd apps/frontend && pnpm run test

# Run specific service tests
cd services/user-service && pnpm run test
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
If you get port conflict errors:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3002

# Kill processes if needed
kill -9 <PID>
```

#### Dependency Issues
```bash
# Clear all node_modules and reinstall
rm -rf node_modules apps/*/node_modules services/*/node_modules packages/*/node_modules
pnpm install
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check Redis connection
docker ps | grep redis

# Restart databases
docker-compose restart postgres redis
```

#### Build Issues
```bash
# Clean build cache
pnpm run clean
pnpm run build
```

### Getting Help
- Check the [troubleshooting guide](docs/TROUBLESHOOTING.md)
- Review the [documentation](docs/README.md)
- Open an issue on [GitHub](https://github.com/Stormrider66/hockey-hub/issues)

## 📚 Next Steps

Once you have Hockey Hub running:

1. **Explore the UI**: Try the different user role dashboards
2. **Test Features**: Try the chat system, calendar, and training features
3. **Read Documentation**: Check out the [docs](docs/README.md) for detailed guides
4. **Development**: See the [Developer Guide](DEVELOPER-GUIDE.md) for contributing
5. **Deployment**: Review the [Deployment Guide](docs/DEPLOYMENT.md) for production

## 🎯 What's Included

Hockey Hub comes with these major features ready to use:

### ✅ Complete Features
- **8 Role-Based Dashboards**: Player, Coach, Parent, Medical Staff, Equipment Manager, Physical Trainer, Club Admin, System Admin
- **Professional Chat System**: Enterprise messaging with 100+ components, file sharing, bots
- **Advanced Calendar**: Scheduling, conflict detection, recurring events, analytics
- **Training Management**: Workout tracking, performance analytics, load management
- **Medical Tracking**: Injury management, wellness monitoring, treatment plans
- **Multi-language Support**: 19 European languages with 31,000+ translations
- **Real-time Features**: Socket.io integration for live updates
- **Security**: JWT authentication, RBAC, input validation, audit trails

### 📊 Project Status
- **750+ Files**: Complete monorepo implementation
- **100+ React Components**: Professional UI component library
- **60+ API Endpoints**: Comprehensive REST API coverage
- **200+ Test Cases**: Unit, integration, and E2E tests
- **Production Ready**: All major systems complete and tested

---

**Last Updated**: July 2, 2025 | **Version**: 2.0.0 | **Status**: Production Ready

*Get started with Hockey Hub - Professional hockey team management made simple.*