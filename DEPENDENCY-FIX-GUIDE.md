# Hockey Hub - Dependency Fix Guide

## Issue
The `@hockey-hub/shared-types` package was missing its `package.json` file, causing installation failures.

## Quick Fix Steps

### Option 1: PowerShell Script (Recommended)
```powershell
# Run from Hockey Hub root directory
.\fix-dependencies.ps1
```

### Option 2: Manual Steps

1. **Clean all node_modules** (from Hockey Hub root)
```powershell
# Remove all node_modules directories
Get-ChildItem -Path . -Include node_modules -Recurse -Directory | Remove-Item -Recurse -Force

# Remove lock file
Remove-Item pnpm-lock.yaml -Force
```

2. **Build shared-types package**
```powershell
cd packages/shared-types
pnpm install
pnpm build
cd ../..
```

3. **Install all dependencies**
```powershell
pnpm install
```

4. **Start the frontend**
```powershell
cd apps/frontend
pnpm dev
```

### Option 3: Quick Frontend Only
If you just want to get the frontend running quickly:

```powershell
cd apps/frontend
# Install with no workspace
pnpm install --ignore-workspace
pnpm dev
```

## Verification

After successful installation, you should be able to:
1. Start the frontend on `http://localhost:3010`
2. Access the demo at `http://localhost:3010/physicaltrainer/demo`
3. See all the workout lifecycle features working

## What Was Fixed

I created the missing files:
- `/packages/shared-types/package.json` - Package configuration
- `/packages/shared-types/index.ts` - Main export file
- `/packages/shared-types/tsconfig.json` - TypeScript configuration
- `/packages/shared-types/training-session-events.ts` - WebSocket events
- `/packages/shared-types/medical-events.ts` - Medical events
- `/packages/shared-types/statistics-events.ts` - Statistics events

These files define the shared TypeScript types used across all services for the real-time communication and data structures.

## If Issues Persist

1. **Clear pnpm cache**
```powershell
pnpm store prune
```

2. **Use npm instead temporarily**
```powershell
cd apps/frontend
npm install
npm run dev
```

3. **Check Node version**
Ensure you're using Node.js 18+ LTS

## Demo Access

Once running, navigate to:
- Main app: `http://localhost:3010`
- Physical Trainer: `http://localhost:3010/physicaltrainer`
- **Demo Showcase**: `http://localhost:3010/physicaltrainer/demo`

The demo showcases all implemented features with realistic NHL player data!