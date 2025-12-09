# Hockey Hub - Backend Services Startup Guide

## Quick Start with Mock Authentication

The frontend now includes mock authentication endpoints for testing without the backend services. You can log in with the demo credentials:

- **Player**: player@hockeyhub.com / demo123
- **Coach**: coach@hockeyhub.com / demo123  
- **Parent**: parent@hockeyhub.com / demo123
- **Medical Staff**: medical@hockeyhub.com / demo123

For registration, use team code: **DEMO2024**

## Starting the Full Backend Services

To run the complete application with all microservices:

### Option 1: Start All Services (Recommended)
```bash
# From the root directory
pnpm install
pnpm dev
```

This will start all services using Turbo, including:
- API Gateway (port 3000)
- User Service (port 3001)
- Calendar Service (port 3003)
- Medical Service (port 3004)
- Training Service (port 3005)
- Planning Service (port 3006)
- Communication Service (port 3007)
- Statistics Service (port 3008)
- Payment Service (port 3009)
- Admin Service (port 3010)

### Option 2: Start Individual Services
```bash
# Start only the API Gateway and User Service (minimum for auth)
cd services/api-gateway
npm run dev

# In another terminal
cd services/user-service
npm run dev
```

### Option 3: Simple Development Script
```bash
# Use the development script
node dev-simple.js
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, check what's using the ports:
```bash
# On Windows
netstat -ano | findstr :3000

# On Mac/Linux
lsof -i :3000
```

### Database Connection
The services expect PostgreSQL to be running. If you don't have it set up, the mock authentication will still work for UI testing.

### Environment Variables
Each service has its own `.env` file. Make sure they're configured correctly:
- `services/api-gateway/.env`
- `services/user-service/.env`
- etc.

## Next Steps

1. For UI development only: Use the mock authentication
2. For full functionality: Set up PostgreSQL and run all services
3. Check the logs in each service directory if you encounter issues