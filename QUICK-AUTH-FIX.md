# Quick Authentication Fix

If the user service won't start due to TypeScript errors, use this workaround:

## Option 1: Run User Service Separately
Open a new terminal and run:

```bash
cd services/user-service
npm run dev:quick
```

## Option 2: Direct Node Execution
```bash
cd services/user-service
node -r ts-node/register/transpile-only src/index.ts
```

## Option 3: Disable TypeScript Checking Temporarily
Edit `services/user-service/tsconfig.json` and add:
```json
{
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true
  }
}
```

## Testing Authentication
Once the user service is running (you'll see "👤 User Service running on port 3001"):

1. Keep the main `pnpm run dev` running for other services
2. Navigate to http://localhost:3010/login
3. Use demo credentials:
   - Email: `player@hockeyhub.com`
   - Password: `demo123`

## What's Happening
The issue is TypeScript strict mode conflicts with some dependencies. The workarounds above bypass strict type checking temporarily to get the service running for testing.