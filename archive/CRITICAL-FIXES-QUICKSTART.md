# Hockey Hub - Critical Fixes Quick Start Guide

## 🚨 FIX TODAY - Security Vulnerabilities

### 1. Medical Service - Add Authentication (30 minutes)
```typescript
// File: services/medical-service/src/routes/injuryRoutes.ts
// Add this import at the top
import { authenticate, authorize } from '@hockey-hub/shared-lib';

// Update ALL routes like this:
// BEFORE:
router.get('/injuries', injuryController.getAll);

// AFTER:
router.get('/injuries', authenticate, authorize(['medical_staff', 'coach', 'admin']), injuryController.getAll);
```

Do this for ALL routes in:
- `injuryRoutes.ts`
- `wellnessRoutes.ts`
- `availabilityRoutes.ts`
- `medicalOverviewRoutes.ts`

### 2. Remove API Key Logging (5 minutes)
```typescript
// File: packages/shared-lib/src/middleware/service-registry.ts
// Line 211 - DELETE THIS LINE:
console.log(`Service '${service.name}' registered with API key: ${registered.apiKey}`);
```

### 3. Fix Frontend API URLs (20 minutes)
```typescript
// Fix these files in apps/frontend/src/store/api/
// Change all service-specific URLs to API Gateway

// authApi.ts - Line 56
// BEFORE: baseUrl: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3001/api/auth'
// AFTER:  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/auth'

// Similar changes needed in:
// - statisticsApi.ts
// - trainingApi.ts
// - performanceApi.ts
// - dashboardApi.ts
```

## 🔧 FIX THIS WEEK - Deployment Blockers

### 1. Add Validation Middleware (2 hours)
```typescript
// Example for each service's routes
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateInjuryDto, UpdateInjuryDto } from '@hockey-hub/shared-lib';

router.post('/injuries', 
  authenticate,
  validationMiddleware(CreateInjuryDto), // ADD THIS
  injuryController.create
);
```

### 2. Create Missing Dockerfiles (3 hours)
Create a Dockerfile for each service without one. Use this template:
```dockerfile
# Dockerfile template for services
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
EXPOSE 3003
CMD ["node", "dist/index.js"]
```

### 3. Add Global Error Handlers (1 hour)
```typescript
// Add to each service's index.ts before app.listen()
import { errorHandler } from '@hockey-hub/shared-lib';
app.use(errorHandler);
```

## 📝 IMMEDIATE DATABASE FIXES

Run these SQL commands on each service database:

```sql
-- Critical Performance Indexes
CREATE INDEX idx_injuries_player_id ON injuries(player_id);
CREATE INDEX idx_workout_sessions_created_by ON workout_sessions(created_by);
CREATE INDEX idx_users_email_active ON users(email, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_time, end_time);
```

## 🔐 GENERATE NEW SECRETS

Run this command to generate secure secrets:
```bash
# Generate new JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate new refresh token secret  
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Update these in ALL .env files - DO NOT use the default values!

## ✅ Quick Verification Checklist

After making these changes, verify:

1. **Medical Service Security**
   - [ ] Try accessing `/api/injuries` without auth token - should get 401
   - [ ] Try accessing with valid token - should work

2. **Frontend API Gateway**
   - [ ] Check browser network tab - all API calls go to port 3000
   - [ ] No direct calls to ports 3001-3009

3. **Validation Working**
   - [ ] Try POST with invalid data - should get 400 with validation errors
   - [ ] Try POST with valid data - should work

4. **No Sensitive Logs**
   - [ ] Start services and check logs - no passwords, tokens, or API keys visible

## 🚀 Next Steps

1. **Today**: Complete all items in "FIX TODAY" section
2. **Tomorrow**: Start on validation middleware and error handlers
3. **This Week**: Create missing Dockerfiles and fix database indexes
4. **Next Week**: Add comprehensive tests and documentation

## Need Help?

- Check `TECHNICAL-ISSUES-CHECKLIST.md` for detailed fixes
- Review `SECURITY-AUDIT-CHECKLIST.md` for security guidelines
- See `CODEBASE-REVIEW-SUMMARY.md` for full analysis

Remember: **Medical Service authentication is the #1 priority** - patient data is currently exposed!