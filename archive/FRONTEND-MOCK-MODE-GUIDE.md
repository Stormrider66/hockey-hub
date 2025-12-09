# Frontend Mock Mode Guide

## Quick Start

1. **Start the frontend:**
   ```bash
   cd apps/frontend
   npm run dev
   ```
   Or use the convenience scripts:
   - Windows: `start-dev-mock.bat`
   - Linux/Mac: `./start-dev-mock.sh`

2. **Navigate to:** http://localhost:3002/login

3. **Use the Dev Login Panel:**
   - Look for the yellow "Development Quick Login" panel
   - Click any role button to instantly log in
   - No password required in mock mode!

## Troubleshooting

### If you don't see the Dev Login Panel:
1. Check that `.env.local` contains:
   ```
   NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
   ```
2. Clear your browser cache and refresh

### If login doesn't redirect:
1. Open browser console (F12)
2. Look for these log messages:
   - `🔐 Attempting mock login for [role]`
   - `🔑 Login attempt:`
   - `🚀 Using mock mode - skipping retry logic`
   - `🔐 Login result:`
   - `🎯 Navigating to: /[role]`

3. If you see errors, check:
   - Is the role dashboard implemented? (e.g., `/player`, `/coach`)
   - Are there any JavaScript errors?

### Manual Login Test:
You can also use the regular login form with these credentials:
- Email: `player@hockeyhub.com` (or any role email)
- Password: Any password (e.g., `test123`)

## Available Test Users

| Role | Email | Dashboard Path |
|------|-------|----------------|
| Player | player@hockeyhub.com | /player |
| Coach | coach@hockeyhub.com | /coach |
| Parent | parent@hockeyhub.com | /parent |
| Medical Staff | medical@hockeyhub.com | /medical-staff |
| Equipment Manager | equipment@hockeyhub.com | /equipment-manager |
| Physical Trainer | trainer@hockeyhub.com | /physical-trainer |
| Club Admin | clubadmin@hockeyhub.com | /club-admin |
| Admin | admin@hockeyhub.com | /admin |

## What Mock Mode Provides

✅ **No Backend Required:**
- All API calls return mock data
- WebSocket connections are disabled
- No database needed

✅ **Instant Login:**
- One-click role switching
- No authentication delays
- Preserved session state

✅ **Realistic Data:**
- Mock users have full profiles
- Appropriate permissions per role
- Sample dashboard data

## Common Issues & Solutions

### "WebSocket connection failed" errors
- **Normal in mock mode** - WebSockets are disabled
- These errors won't affect functionality

### "Failed to load resource" errors
- **Expected** - No backend is running
- Mock data is provided instead

### Page keeps redirecting
- Clear localStorage: `localStorage.clear()`
- Refresh the page
- Try a different browser

## Development Tips

1. **Switch Roles Quickly:**
   - Use the Dev Login Panel
   - Each role shows different dashboard features

2. **Test Permissions:**
   - Mock users have realistic role-based permissions
   - Check what each role can access

3. **Check Console Logs:**
   - Mock mode logs helpful debugging info
   - Look for 🔐, ✅, and 🚀 emojis

4. **Disable Mock Mode:**
   - Set `NEXT_PUBLIC_ENABLE_MOCK_AUTH=false`
   - Restart the dev server
   - Connect to real backend

## Need Help?

If login still doesn't work:
1. Check browser console for errors
2. Verify you're on http://localhost:3002
3. Try incognito/private browsing mode
4. Clear all site data and try again

The mock system is designed to make frontend development fast and easy without any backend dependencies!