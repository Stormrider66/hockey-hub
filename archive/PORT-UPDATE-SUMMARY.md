# Frontend Port Update - 3003 → 3010

## Why the Change?

The frontend was running on port 3003, which conflicts with the Calendar Service. Here's the complete port mapping:

### Service Port Allocation:
- **3000**: API Gateway
- **3001**: User Service
- **3002**: Communication Service
- **3003**: Calendar Service ⚠️ (was conflicting with frontend)
- **3004**: Training Service
- **3005**: Medical Service
- **3006**: Planning Service
- **3007**: Statistics Service
- **3008**: Payment Service
- **3009**: Admin Service
- **3010**: Frontend ✅ (updated)

## Files Updated:

1. **apps/frontend/package.json**
   - Changed `"dev": "next dev -p 3003"` to `"dev": "next dev -p 3010"`

2. **CLAUDE.md**
   - Updated frontend port reference from 3003 to 3010

3. **apps/frontend/start-dev.sh**
   - Updated port kill command from 3003 to 3010
   - Updated echo message to show port 3010
   - Changed `npm run dev` to `pnpm dev`

4. **apps/frontend/start-simple.sh**
   - Updated `npx next dev -p 3003` to `npx next dev -p 3010`

## How to Start Frontend Now:

From Windows PowerShell:
```powershell
cd "C:\Hockey Hub"
pnpm dev:frontend
```

Or from the frontend directory:
```powershell
cd "C:\Hockey Hub\apps\frontend"
pnpm dev
```

The frontend will now start on **http://localhost:3010**

## Benefits:
- No port conflicts between services
- Clear separation: 3000-3009 for backend services, 3010+ for frontend
- Consistent with the original QUICK-DEV-START.md documentation
- Prevents "address already in use" errors when running full stack