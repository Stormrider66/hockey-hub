# Hockey Hub - Security Guide

**Last Updated**: July 2025  
**Criticality**: PRODUCTION ESSENTIAL  
**Compliance**: HIPAA, GDPR Ready

## 🚨 Critical Security Issues (Fix Before Production)

### 1. Medical Service Authentication
**Status**: ❌ CRITICAL - Patient data exposed  
**Location**: `services/medical-service/src/routes/*.ts`

```typescript
// CURRENT: NO AUTHENTICATION
router.get('/injuries', injuryController.getAll);

// REQUIRED FIX:
router.get('/injuries', authenticate, authorize(['medical_staff', 'coach']), injuryController.getAll);
```

**Actions Required**:
- Add authentication middleware to ALL medical routes
- Implement role-based authorization
- Test all endpoints require valid JWT
- Verify HIPAA compliance

### 2. JWT Secret Management
**Status**: ❌ CRITICAL - Hardcoded secrets  
**Issue**: Default secret `your-super-secret-jwt-key-change-this-in-production`

**Generate Secure Secrets**:
```bash
# Generate cryptographically secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Implementation**:
- Use different secrets per service
- Store in environment variables
- Use secret manager in production (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

### 3. Sensitive Data Logging
**Status**: ⚠️ HIGH - Credentials in logs  
**Location**: `packages/shared-lib/src/middleware/service-registry.ts:211`

**Actions**:
- Remove API key logging
- Audit all console.log statements
- Implement log sanitization middleware
- Use structured logging with redaction

## 🔐 Security Architecture

### Authentication & Authorization

#### JWT Implementation
- **Algorithm**: RS256 with RSA keys
- **Token Expiry**: 15 minutes (access), 7 days (refresh)
- **JWKS Endpoint**: Available at `/api/auth/jwks`
- **Token Storage**: httpOnly cookies (not localStorage)

#### Role-Based Access Control (RBAC)
```typescript
// Current roles and permissions
const roles = {
  admin: ['*'],
  coach: ['view_players', 'manage_training', 'view_medical_summary'],
  player: ['view_own_data', 'submit_wellness', 'view_schedule'],
  parent: ['view_child_data', 'view_schedule', 'manage_payments'],
  medical_staff: ['view_all_medical', 'manage_injuries', 'clear_players'],
  equipment_manager: ['manage_equipment', 'view_players'],
  physical_trainer: ['manage_workouts', 'view_medical', 'test_players']
};
```

### Service-to-Service Security

#### API Key Management
- Each service has unique API key
- Keys stored in database with hashed values
- IP whitelisting for service communication
- Request signing for sensitive operations

#### Implementation Example:
```typescript
// Service registration
const serviceClient = new ServiceHttpClient('training-service', {
  apiKey: process.env.TRAINING_SERVICE_API_KEY,
  baseUrl: process.env.TRAINING_SERVICE_URL,
  timeout: 5000
});
```

## 🛡️ Security Best Practices

### Input Validation
All endpoints must use validation middleware:
```typescript
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { CreatePlayerDto } from './dto/create-player.dto';

router.post('/players', 
  validationMiddleware(CreatePlayerDto), 
  playerController.create
);
```

### SQL Injection Prevention
- TypeORM parameterized queries (default)
- Input sanitization middleware
- Database user permissions limited
- Regular security scanning

### XSS Protection
- DOMPurify for user content
- Content Security Policy headers
- React's default escaping
- Sanitization on input and output

### CSRF Protection
```typescript
// Enable CSRF protection
app.use(csrf({ cookie: true }));

// Frontend must include token
headers: {
  'X-CSRF-Token': csrfToken
}
```

## 🔒 Security Headers

Required headers for all responses:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'sha256-...'"], // Use nonces/hashes
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss://"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## 🏥 HIPAA Compliance

### Requirements
1. **Access Controls**: Role-based with audit trails
2. **Encryption**: TLS 1.2+ in transit, AES-256 at rest
3. **Audit Logging**: All medical data access logged
4. **Data Integrity**: Checksums and version control
5. **Breach Notification**: 60-day notification requirement

### Implementation Checklist
- [ ] Encrypt database with transparent data encryption
- [ ] Implement field-level encryption for SSN, DOB
- [ ] Add audit triggers to medical tables
- [ ] Create breach notification system
- [ ] Regular security assessments

## 🇪🇺 GDPR Compliance

### User Rights Implementation
1. **Right to Access**: Export user data endpoint
2. **Right to Erasure**: Soft delete with purge after 30 days
3. **Data Portability**: JSON/CSV export formats
4. **Consent Management**: Granular consent tracking
5. **Privacy by Design**: Data minimization

### Required Endpoints
```typescript
// GDPR compliance endpoints
router.get('/users/:id/export', authenticate, exportUserData);
router.delete('/users/:id/data', authenticate, deleteUserData);
router.get('/users/:id/consent', authenticate, getConsent);
router.put('/users/:id/consent', authenticate, updateConsent);
```

## 🚨 Security Testing

### Automated Testing
```bash
# Dependency scanning
npm audit
pnpm audit --audit-level=moderate

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-app.com

# Security linting
npm run lint:security
```

### Manual Testing Checklist
- [ ] Authentication bypass attempts
- [ ] Authorization boundary testing
- [ ] Input validation fuzzing
- [ ] Session management testing
- [ ] API rate limit testing

## 📊 Security Monitoring

### Real-time Monitoring
- Failed login attempts (>5 = lockout)
- Unusual access patterns
- API rate limit violations
- Service-to-service anomalies

### Alerts Configuration
```typescript
// Example alert thresholds
const securityAlerts = {
  failedLogins: { threshold: 5, window: '5m' },
  apiRateLimit: { threshold: 100, window: '1m' },
  suspiciousActivity: { threshold: 10, window: '10m' },
  dataExfiltration: { threshold: 1000, window: '1h' }
};
```

## 🔄 Security Maintenance

### Regular Tasks
1. **Daily**: Review security alerts
2. **Weekly**: Check dependency vulnerabilities
3. **Monthly**: Rotate API keys
4. **Quarterly**: Security audit
5. **Annually**: Penetration testing

### Update Process
```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies safely
pnpm update --interactive

# Test after updates
pnpm test
pnpm test:e2e
```

## 🚑 Incident Response

### Response Plan
1. **Detect**: Monitoring alerts trigger
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerability
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis

### Contact Information
- Security Team: security@hockeyhub.com
- CISO: ciso@hockeyhub.com
- Legal: legal@hockeyhub.com
- PR: communications@hockeyhub.com

## ✅ Production Checklist

Before deploying to production:
- [ ] All critical security issues resolved
- [ ] Secrets removed from code
- [ ] Authentication on all endpoints
- [ ] Input validation enabled
- [ ] Security headers configured
- [ ] SSL/TLS certificates valid
- [ ] Backup and recovery tested
- [ ] Incident response plan ready
- [ ] Security training completed
- [ ] Compliance requirements met

---

**Remember**: Security is an ongoing process. Schedule regular audits, keep dependencies updated, and maintain security awareness across the team.