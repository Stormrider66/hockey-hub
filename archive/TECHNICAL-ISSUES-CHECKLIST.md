# Hockey Hub - Technical Issues Checklist

## 🔴 Critical Security Issues

### Medical Service Authentication
- [ ] Add authentication middleware to all medical endpoints
- [ ] Implement proper HIPAA-compliant access controls
- [ ] Add audit logging for all medical data access
- **Files**: `services/medical-service/src/routes/*.ts`

### Hardcoded Secrets
- [ ] Replace JWT secret in all .env files
- [ ] Use different secrets for each environment
- [ ] Implement secret rotation mechanism
- [ ] Remove service API key logging
- **Files**: All `.env` files, `packages/shared-lib/src/middleware/service-registry.ts:211`

### Frontend Service Bypass
- [ ] Update all RTK Query baseUrl to use API Gateway
- [ ] Remove direct service port references
- [ ] Update WebSocket connections to use gateway
- **Files**: `apps/frontend/src/store/api/*.ts`

## 🟠 High Priority Backend Issues

### Missing Validation
- [ ] Add validation middleware to all POST/PUT endpoints
- [ ] Use existing DTOs with class-validator
- [ ] Add request size limits
- **Example**: 
```typescript
app.post('/api/injuries', 
  validationMiddleware(CreateInjuryDto), 
  injuryController.create
);
```

### Database Issues
- [ ] Fix foreign key type mismatches (UUID vs integer)
- [ ] Add missing indexes:
```sql
CREATE INDEX idx_injuries_player_id ON injuries(player_id);
CREATE INDEX idx_workout_sessions_created_by ON workout_sessions(created_by);
CREATE INDEX idx_deleted_at_partial ON users(id) WHERE deleted_at IS NULL;
```

### Error Handling
- [ ] Add global error handler to each service
- [ ] Remove try-catch with console.error patterns
- [ ] Use proper error classes from shared-lib
- **Template**:
```typescript
app.use(errorHandler); // From shared-lib
```

## 🟡 Frontend Issues

### TypeScript Any Types
- [ ] Replace 86 instances of `: any` with proper types
- [ ] Create custom error types
- [ ] Use `unknown` for catch blocks
- **Common pattern to fix**:
```typescript
// Bad
catch (error: any) { }

// Good
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}
```

### Performance
- [ ] Add React.lazy for route splitting
- [ ] Implement React.memo for expensive components
- [ ] Break down large components (>500 lines)
- [ ] Add useMemo/useCallback where needed

### Security
- [ ] Move tokens from localStorage to httpOnly cookies
- [ ] Add CSRF protection
- [ ] Implement Content Security Policy

## 📦 Deployment Issues

### Docker Configuration
- [ ] Create Dockerfiles for:
  - [ ] Calendar Service
  - [ ] Training Service  
  - [ ] Medical Service
  - [ ] Planning Service
  - [ ] Statistics Service
  - [ ] Payment Service
  - [ ] Admin Service
  - [ ] Communication Service

### Package Management
- [ ] Fix Dockerfile npm commands to use pnpm
- [ ] Or generate package-lock.json files
- [ ] Standardize on one package manager

### Environment Configuration
- [ ] Create .env.example for each service
- [ ] Document all environment variables
- [ ] Remove default passwords and secrets

## 🧪 Testing Priorities

### Add Tests For:
- [ ] Calendar Service - Event creation, conflicts
- [ ] Training Service - Session management
- [ ] Medical Service - Injury tracking, wellness
- [ ] Payment Service - Billing, subscriptions
- [ ] Authentication flows
- [ ] Service-to-service communication

### Test Infrastructure
- [ ] Add in-memory database for unit tests
- [ ] Create test data factories
- [ ] Set up E2E testing framework
- [ ] Add GitHub Actions for CI

## 📚 Documentation Needs

### Immediate
- [ ] Create comprehensive SETUP.md
- [ ] Add .env.example files
- [ ] Document database setup
- [ ] Create architecture diagrams

### API Documentation  
- [ ] Add OpenAPI specs
- [ ] Document webhooks
- [ ] Add request/response examples
- [ ] Create Postman collection

## 🔧 Quick Fixes (<1 hour each)

1. Remove console.log of API keys:
   - `packages/shared-lib/src/middleware/service-registry.ts:211`

2. Add missing await:
   - `services/medical-service/src/routes/injuryRoutes.ts:20`

3. Fix WebSocket auth:
   - `services/training-service/src/index.ts:65`

4. Remove mock endpoints:
   - All `/mock` routes in services

5. Fix error status codes:
   - Use 404 not 500 for not found
   - Use 400 not 500 for validation errors

## 📊 Database Optimization

```sql
-- Add these indexes immediately
CREATE INDEX idx_users_email_active ON users(email, is_active);
CREATE INDEX idx_injuries_player_id ON injuries(player_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(scheduled_date);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Add GIN indexes for JSONB
CREATE INDEX idx_workout_settings ON workout_sessions USING GIN(settings);
CREATE INDEX idx_message_metadata ON messages USING GIN(metadata);
```

## 🚀 Performance Quick Wins

1. Enable Redis caching in all services
2. Add pagination to all list endpoints
3. Implement connection pooling
4. Add request compression
5. Enable HTTP/2 in production

## Estimated Timeline

- **Week 1**: Critical security fixes
- **Week 2**: Deployment preparation  
- **Week 3**: Testing infrastructure
- **Week 4**: Performance optimization
- **Week 5-6**: Documentation and polish

Total: 4-6 weeks to production readiness