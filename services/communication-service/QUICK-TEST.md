# Quick Test Guide for Communication Service

## Prerequisites

1. **PostgreSQL running** on port 5435 (as per your .env file)
2. **Database user**: postgres with password: hockey_hub_password

## Step 1: Create Database

### Option A: Using the SQL script (Recommended)
```bash
# From the communication-service directory
psql -h localhost -p 5435 -U postgres -d postgres -f create-database.sql
```

### Option B: Using the bash script (if you have bash)
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### Option C: Manual setup
1. Connect to PostgreSQL:
   ```bash
   psql -h localhost -p 5435 -U postgres
   ```
2. Create database:
   ```sql
   CREATE DATABASE hockey_hub_communication;
   \c hockey_hub_communication;
   ```
3. Run the SQL from `create-database.sql`

## Step 2: Install Dependencies

Since we're having workspace issues, let's install just what we need:

```bash
# From the communication-service directory
pnpm install express cors helmet dotenv socket.io jsonwebtoken uuid
pnpm install --save-dev @types/node @types/express @types/jsonwebtoken @types/uuid typescript
```

## Step 3: Start the Service

```bash
pnpm run dev
```

You should see:
```
✅ Database connected
📧 Communication Service running on port 3002
🔌 WebSocket server ready
```

## Step 4: Test the Service

### Health Check
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "communication-service",
  "port": 3002,
  "database": "connected"
}
```

### Quick Backend Test
```bash
pnpm run test:backend
```

This will test:
- ✅ Health check
- ⚠️ API endpoints (may fail due to auth - this is expected)
- ✅ Socket.io connection

## Expected Results

1. **Health Check**: Should pass ✅
2. **Database Connection**: Should connect ✅
3. **Socket.io**: Should connect ✅
4. **API Endpoints**: May fail due to mock authentication ⚠️

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `pg_ctl status`
- Verify port 5435 is correct in your .env
- Test connection: `psql -h localhost -p 5435 -U postgres`

### Module Not Found Errors
- Ensure you're in the communication-service directory
- Try installing dependencies individually as shown in Step 2

### Permission Errors
- Ensure the postgres user has correct permissions
- Check your .env file has the correct database credentials

## Success Indicators

When everything is working:
- Service starts without errors
- Health check returns "connected" database status
- Socket.io shows connection logs
- No TypeScript compilation errors

## Next Steps

Once the basic test passes:
1. Integrate with real authentication (user service)
2. Create test users and real JWT tokens
3. Test all API endpoints with proper authentication
4. Proceed with Phase 2 (Frontend Components)

The backend foundation is solid - we just need to get past the dependency installation issues!