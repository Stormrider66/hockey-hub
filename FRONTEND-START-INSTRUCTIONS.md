# Frontend Quick Start Instructions

Due to the dependency installation issues, here's how to get the frontend running:

## Method 1: Quick Batch Script (Windows)

I've created a batch script for you. Just run:

```bash
# From PowerShell in the Hockey Hub directory
.\start-frontend.bat
```

## Method 2: Manual Steps

If the batch script doesn't work, try these manual steps:

```bash
# 1. Navigate to frontend
cd apps\frontend

# 2. Clean install (force if needed)
npm install --force --legacy-peer-deps

# 3. If that fails, try:
npm cache clean --force
npm install --legacy-peer-deps

# 4. Start the dev server
npm run dev
```

## Method 3: Minimal Install

If you're still having issues, try minimal dependencies:

```bash
cd apps\frontend

# Delete lock files and node_modules
del package-lock.json
del pnpm-lock.yaml
rmdir /s /q node_modules

# Fresh install with npm
npm install --legacy-peer-deps

# Start
npm run dev
```

## Expected Result

Once running, you should see:
- Next.js dev server starting
- Application available at http://localhost:3010
- Hot reload enabled for development

## Troubleshooting

### If you see "Cannot find module 'next'"
```bash
cd apps\frontend
npm install next@15.3.4 --save
```

### If port 3010 is in use
```bash
# Check what's using it
netstat -ano | findstr :3010

# Or change the port in package.json
# Edit "dev": "next dev -p 3010" to use a different port
```

### For persistent issues
Try using yarn instead:
```bash
npm install -g yarn
cd apps\frontend
yarn install
yarn dev
```

## Login Credentials

Once the frontend is running, you can use these test credentials:
- Email: admin@hockeyhub.com
- Password: Admin123!

Or register a new account through the UI.