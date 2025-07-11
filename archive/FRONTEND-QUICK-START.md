# Frontend Quick Start Guide (No Backend Required)

This guide helps you run the Hockey Hub frontend without setting up the backend services.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager

## Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd hockey-hub

# Install dependencies
cd apps/frontend
npm install
```

### 2. Configure Environment

Create or update `.env.local` file in `apps/frontend/`:

```env
# Enable mock authentication
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true

# Other required variables (already set to defaults)
NEXT_PUBLIC_APP_NAME=Hockey Hub
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will start at http://localhost:3002

### 4. Login with Mock Users

Navigate to http://localhost:3002/login and you'll see:

![Development Quick Login Panel]

Click any role button to instantly log in:
- **Player** - Access training, wellness, and performance features
- **Coach** - Manage teams and create training plans
- **Parent** - View child activities and manage payments
- **Medical Staff** - Track injuries and medical records
- **Equipment Manager** - Manage inventory and equipment
- **Physical Trainer** - Create training programs and tests
- **Club Admin** - Organization and user management
- **Admin** - Full system access

### 5. Explore Features

Once logged in, you can:
- Navigate through all dashboards
- Test UI components and layouts
- Verify role-based permissions
- Test responsive design
- Work on new features

## What Works in Mock Mode

✅ **Authentication Flow**
- Login/logout
- Role switching
- Session management
- Token refresh

✅ **UI Components**
- All dashboards
- Forms and inputs
- Navigation
- Modals and dialogs

✅ **State Management**
- Redux store
- Local state
- Context providers

## What Doesn't Work

❌ **Real Data**
- No persistence between sessions
- No real-time updates
- No actual API calls

❌ **Backend Features**
- File uploads
- Email notifications
- Payment processing
- Real-time chat

## Switching to Real Backend

To connect to the real backend:

1. Update `.env.local`:
   ```env
   NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
   ```

2. Ensure backend services are running

3. Restart the frontend server

## Tips for Frontend Development

1. **Use Mock Mode for UI Work**
   - Faster development cycles
   - No backend dependencies
   - Instant role switching

2. **Test All Roles**
   - Each role has different permissions
   - UI should adapt to user capabilities
   - Test edge cases

3. **Check Console Logs**
   - Mock mode logs all "API" calls
   - Helpful for debugging
   - Shows permission checks

4. **Regular Backend Testing**
   - Test with real backend periodically
   - Ensure API integration works
   - Verify data flows

## Troubleshooting

### Can't see mock login panel?
- Check `NEXT_PUBLIC_ENABLE_MOCK_AUTH=true` in `.env.local`
- Restart the development server
- Clear browser cache

### Login not working?
- Check browser console for errors
- Ensure you're clicking the role buttons
- Try incognito/private mode

### Missing features?
- Some features require real backend
- Check the feature flags in `.env.local`
- See full documentation for details

## Next Steps

- Read the [Mock Authentication Guide](./apps/frontend/docs/MOCK_AUTH_GUIDE.md)
- Explore the [Component Library](./apps/frontend/src/components/README.md)
- Check out the [Frontend Architecture](./docs/architecture/frontend.md)

Happy coding! 🏒