# Mock Authentication Guide

## Overview

The Hockey Hub frontend includes a mock authentication system that allows developers to test the application without a running backend. This is particularly useful for:

- Frontend development and testing
- UI/UX prototyping
- Demonstrating features
- Running the frontend in isolation

## Enabling Mock Authentication

Mock authentication is controlled by the `NEXT_PUBLIC_ENABLE_MOCK_AUTH` environment variable in your `.env.local` file:

```env
# Enable mock authentication (development only)
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

To disable mock authentication and use the real backend:

```env
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```

## Features

### 1. Quick Login Panel

When mock auth is enabled, a special "Development Quick Login" panel appears on the login page. This panel provides:

- **One-click login** for all user roles
- **Visual role indicators** with colored icons
- **Role descriptions** explaining what each role can access
- **Loading states** during login

### 2. Pre-configured User Roles

The mock system includes 8 pre-configured user roles:

| Role | Email | Description |
|------|-------|-------------|
| **Player** | player@hockeyhub.com | Access player dashboard, training, and wellness features |
| **Coach** | coach@hockeyhub.com | Manage teams, create training plans, view analytics |
| **Parent** | parent@hockeyhub.com | View child activities, manage payments, communicate |
| **Medical Staff** | medical@hockeyhub.com | Manage medical records, track injuries, wellness monitoring |
| **Equipment Manager** | equipment@hockeyhub.com | Inventory management, equipment assignments, maintenance |
| **Physical Trainer** | trainer@hockeyhub.com | Create training programs, physical tests, performance tracking |
| **Club Admin** | clubadmin@hockeyhub.com | Organization management, user administration, analytics |
| **Admin** | admin@hockeyhub.com | Full system access, all permissions, configuration |

### 3. Mock API Responses

The mock system simulates all authentication API endpoints:

- `/login` - Accepts any password for mock users
- `/register` - Creates new mock users
- `/logout` - Clears mock session
- `/refresh` - Refreshes mock tokens
- `/me` - Returns current mock user
- `/sessions` - Returns mock session data
- `/forgot-password` - Simulates password reset flow
- `/verify-email` - Simulates email verification

### 4. Permissions and Roles

Each mock user comes with appropriate permissions for their role:

```typescript
// Example: Player permissions
permissions: [
  { name: 'view_own_stats', resource: 'stats', action: 'view' },
  { name: 'update_own_profile', resource: 'profile', action: 'update' },
  { name: 'view_schedule', resource: 'schedule', action: 'view' },
  { name: 'submit_wellness', resource: 'wellness', action: 'create' },
  { name: 'view_training', resource: 'training', action: 'view' },
]
```

## Usage

### Quick Login (Recommended)

1. Navigate to `/login`
2. Look for the yellow "Development Quick Login" panel
3. Click on any role to instantly log in
4. You'll be redirected to the appropriate dashboard

### Manual Login

You can also use the standard login form with mock credentials:

```
Email: player@hockeyhub.com
Password: [any password]
```

### Custom Mock Users

To add custom mock users, edit `/src/utils/mockAuth.ts`:

```typescript
export const mockUsers: Record<string, LoginResponse> = {
  custom_role: {
    access_token: 'mock_custom_token',
    refresh_token: 'mock_custom_refresh',
    expires_in: 3600,
    user: {
      id: '999',
      email: 'custom@hockeyhub.com',
      firstName: 'Custom',
      lastName: 'User',
      role: {
        id: '999',
        name: 'Custom Role',
        permissions: [
          // Add custom permissions
        ]
      },
      organizationId: 'org-123',
      teams: []
    }
  }
};
```

## Visual Indicators

When mock mode is active:

1. **Toast Notification**: A yellow toast appears showing "Mock Auth Mode Active"
2. **Console Logging**: Detailed logs appear in the browser console
3. **Dev Panel Badge**: The login panel shows a "MOCK MODE" badge

## Security

- Mock authentication is **development-only** and should never be enabled in production
- The mock system bypasses all real authentication checks
- No actual API calls are made to the backend
- All data is stored in memory and cleared on page refresh

## Troubleshooting

### Mock auth not working?

1. Check that `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true` is set in `.env.local`
2. Restart the Next.js development server after changing environment variables
3. Clear browser cache and localStorage
4. Check browser console for error messages

### Can't see the dev login panel?

- The panel only appears when `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`
- Make sure you're on the `/login` page
- The panel can be collapsed/expanded by clicking the header

### Mock user data not persisting?

- Mock data is stored in browser's localStorage/sessionStorage
- Clear browser data if you encounter issues
- Mock tokens expire after 1 hour by default

## Best Practices

1. **Use mock auth for UI development** - Focus on building features without backend dependencies
2. **Test all user roles** - Ensure your UI works correctly for all permission levels
3. **Don't commit mock mode enabled** - Always set `NEXT_PUBLIC_ENABLE_MOCK_AUTH=false` before committing
4. **Test with real auth regularly** - Ensure your code works with the actual backend

## Example Workflow

```bash
# 1. Enable mock auth in .env.local
echo "NEXT_PUBLIC_ENABLE_MOCK_AUTH=true" >> .env.local

# 2. Start the frontend
npm run dev

# 3. Navigate to http://localhost:3002/login

# 4. Click any role in the dev panel to log in

# 5. When done, disable mock auth
# Edit .env.local and set NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
```