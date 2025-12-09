# Hockey Hub Frontend - Startup Troubleshooting Guide

## Quick Start

### Windows
```bash
# Run this in PowerShell or Command Prompt
./start-dev.bat
```

### Linux/Mac
```bash
# Run this in Terminal
./start-dev.sh
```

## Common Issues and Solutions

### 1. Redux Persist State Corruption

**Error**: `Cannot read properties of undefined` in persistMigrations.ts

**Solution**:
1. Clear browser localStorage:
   - Open DevTools (F12)
   - Go to Application tab
   - Click on localStorage
   - Right-click and Clear
2. Restart the development server

### 2. MockBaseQuery Error

**Error**: `originalBaseQuery is not a function`

**Solution**: Already fixed in the codebase. If you still see this error, ensure you have the latest code.

### 3. Authentication Redirect Loop

**Error**: Redirected to login page when trying to access Physical Trainer dashboard

**Solution**:
1. Ensure mock auth is enabled in `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
   ```
2. Use the quick login panel on the login page
3. Or navigate directly to: http://localhost:3010/physicaltrainer (auto-login will trigger)

### 4. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3010`

**Solution**:
```bash
# Find and kill the process using port 3010
# Windows:
netstat -ano | findstr :3010
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3010
kill -9 <PID>
```

## Development URLs

With mock auth enabled:

- **Physical Trainer Dashboard**: http://localhost:3010/physicaltrainer
- **Login Page** (with dev panel): http://localhost:3010/login
- **Player Dashboard**: http://localhost:3010/player
- **Coach Dashboard**: http://localhost:3010/coach
- **Parent Dashboard**: http://localhost:3010/parent
- **Medical Staff**: http://localhost:3010/medicalstaff
- **Equipment Manager**: http://localhost:3010/equipmentmanager
- **Club Admin**: http://localhost:3010/clubadmin
- **System Admin**: http://localhost:3010/admin

## Mock Login Credentials

All mock users use password: `mock123`

| Role | Email | Auto-Login |
|------|-------|------------|
| Physical Trainer | trainer@hockeyhub.com | Yes (on dashboard) |
| Player | player@hockeyhub.com | Via login panel |
| Coach | coach@hockeyhub.com | Via login panel |
| Parent | parent@hockeyhub.com | Via login panel |
| Medical Staff | medical@hockeyhub.com | Via login panel |
| Equipment Manager | equipment@hockeyhub.com | Via login panel |
| Club Admin | clubadmin@hockeyhub.com | Via login panel |
| System Admin | admin@hockeyhub.com | Via login panel |

## Environment Variables

Key development settings in `.env.local`:

```env
# Enable mock authentication (no backend required)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true

# Enable mock API responses
NEXT_PUBLIC_MOCK_API=true

# Show development tools
NEXT_PUBLIC_SHOW_DEV_TOOLS=true

# Debug mode
NEXT_PUBLIC_DEBUG_MODE=true
```

## Clean Start

If you're experiencing persistent issues:

```bash
# Clean everything and start fresh
rm -rf node_modules .next
pnpm install
pnpm dev
```

## Need Help?

1. Check the browser console for errors
2. Look at the terminal output for build errors
3. Ensure all environment variables are set correctly
4. Try the clean start procedure above