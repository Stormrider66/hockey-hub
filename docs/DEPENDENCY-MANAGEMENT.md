# Dependency Management Guide

This guide outlines the process for managing dependencies in the Hockey Hub monorepo effectively and safely.

## Quick Commands

```bash
# Analyze all dependencies
pnpm deps:analyze

# Check for unused dependencies
pnpm deps:unused

# Check for outdated packages
pnpm deps:outdated

# Update all dependencies
pnpm deps:update

# Security audit
pnpm deps:audit

# Deduplicate dependencies
pnpm deps:dedupe

# Clean reinstall
pnpm deps:clean

# Analyze bundle size
pnpm deps:bundle

# Check version alignment
pnpm deps:align
```

## Monthly Dependency Review Process

### 1. Analysis Phase
```bash
pnpm deps:analyze
pnpm deps:outdated
pnpm deps:audit
```

Review the output and identify:
- Unused dependencies
- Security vulnerabilities
- Outdated packages
- Version misalignments

### 2. Update Phase
```bash
# Test environment first
pnpm deps:update
pnpm test
pnpm build

# If tests pass, proceed with updates
```

### 3. Optimization Phase
```bash
pnpm deps:dedupe
pnpm deps:bundle
```

Check bundle size impact and performance.

### 4. Documentation
Update `DEPENDENCY-AUDIT.md` with any changes made.

## Best Practices

### Adding New Dependencies

1. **Check if it already exists** in the monorepo
2. **Evaluate alternatives** (lighter packages, native solutions)
3. **Choose the right location**: 
   - `dependencies`: Runtime required
   - `devDependencies`: Development/build time only
4. **Use workspace protocol** for internal packages: `"workspace:*"`

### Version Management

1. **Be specific with versions** for production dependencies
2. **Use ranges carefully**: `^` for minor updates, `~` for patches
3. **Keep development tools aligned** across all workspaces
4. **Pin exact versions** for critical dependencies

### Security

1. **Run audits regularly**: `pnpm deps:audit`
2. **Keep dependencies updated**
3. **Review dependency licenses**
4. **Monitor for security advisories**

## Dependency Categories

### Core Runtime Dependencies
- React, Next.js, Node.js
- Database drivers (TypeORM, PostgreSQL)
- Authentication (jsonwebtoken, bcryptjs)

### UI/UX Libraries
- Radix UI components
- Tailwind CSS
- Framer Motion
- Lucide icons

### Development Tools
- TypeScript, ESLint, Prettier
- Jest, Testing Library
- Storybook
- Build tools (Webpack, Babel)

### Backend Services
- Express.js
- Socket.io
- Redis clients
- Monitoring tools

## Common Issues & Solutions

### Dependency Conflicts
1. Check `pnpm deps:align` for version mismatches
2. Use `pnpm deps:dedupe` to resolve duplicates
3. Update to compatible versions

### Bundle Size Issues
1. Use `pnpm deps:bundle` to analyze
2. Replace large dependencies with lighter alternatives
3. Implement code splitting for large libraries

### Security Vulnerabilities
1. Run `pnpm deps:audit` immediately
2. Update vulnerable packages
3. If no fix available, find alternative package

### Build Failures After Updates
1. Clear dependencies: `pnpm deps:clean`
2. Check for breaking changes in package changelogs
3. Update code to match new APIs
4. Consider rollback if issues persist

## Automation

### CI/CD Integration
Add to your workflow:
```yaml
- name: Dependency Audit
  run: |
    pnpm deps:audit
    pnpm deps:outdated
```

### Pre-commit Hooks
```json
{
  "pre-commit": [
    "pnpm deps:audit",
    "pnpm test"
  ]
}
```

## Monitoring

### Weekly Checks
- `pnpm deps:audit` for security
- Bundle size monitoring
- Performance impact assessment

### Monthly Reviews
- Full dependency analysis
- Update planning
- Documentation updates

## Emergency Procedures

### Security Vulnerability
1. **Immediate**: `pnpm deps:audit`
2. **Assess impact**: Which services affected?
3. **Update**: `pnpm update <package-name>`
4. **Test**: Full test suite
5. **Deploy**: Emergency deployment if critical

### Build Breaking Update
1. **Identify**: Which dependency caused the issue?
2. **Rollback**: Revert to previous version
3. **Research**: Check breaking changes
4. **Fix**: Update code or find alternative
5. **Test**: Ensure stability before re-deploying

## Tools & Scripts

### Analysis Script (`scripts/analyze-deps.js`)
- Finds unused dependencies
- Identifies misplaced packages
- Checks for outdated packages
- Analyzes bundle sizes
- Detects duplicates

### Management Script (`scripts/manage-deps.js`)
- Unified dependency operations
- Safety checks before operations
- Cross-platform compatibility
- Color-coded output

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [npm Security Best Practices](https://docs.npmjs.com/security)
- [Dependency Vulnerability Database](https://nvd.nist.gov/)
- [Bundle Analyzer Tools](https://webpack.js.org/guides/bundle-analysis/)

---

**Remember**: Always test in development environment before applying dependency changes to production!