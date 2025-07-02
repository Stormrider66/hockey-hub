# Development Workflow Guide

## Overview

This guide outlines the development workflow, best practices, and procedures for contributing to the Hockey Hub project.

## Getting Started

### Prerequisites

Before starting development, ensure you have:

- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis 7+
- Docker and Docker Compose
- Git
- VS Code or preferred IDE

### Initial Setup

1. **Clone the Repository**
```bash
git clone https://github.com/Stormrider66/hockey-hub.git
cd hockey-hub
```

2. **Install Dependencies**
```bash
# Install all dependencies (using pnpm workspaces)
pnpm install
```

3. **Environment Setup**
```bash
# Copy example environment files
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local

# Copy for each service
for service in services/*; do
  cp $service/.env.example $service/.env
done
```

4. **Database Setup**
```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d postgres redis

# Run migrations for each service
pnpm run db:migrate
```

5. **Verify Setup**
```bash
# Run all tests
pnpm test

# Start development environment
pnpm run dev
```

## Development Environment

### Running Services

#### Option 1: Run Everything
```bash
# Start all services and frontend
pnpm run dev

# This starts:
# - Frontend on http://localhost:3002
# - API Gateway on http://localhost:3000
# - All microservices on their respective ports
```

#### Option 2: Run Specific Services
```bash
# Frontend only
cd apps/frontend && pnpm run dev

# Specific service
cd services/user-service && pnpm run dev

# Multiple services
pnpm run dev:services user-service,medical-service
```

### Docker Development

```bash
# Build all images
docker-compose build

# Start all containers
docker-compose up

# Start specific services
docker-compose up frontend user-service postgres
```

## Git Workflow

### Branch Naming Convention

- `feature/[feature-name]` - New features
- `fix/[issue-description]` - Bug fixes
- `chore/[task-description]` - Maintenance tasks
- `docs/[what-docs]` - Documentation updates
- `refactor/[what-refactored]` - Code refactoring

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(player): resolve dashboard loading issue"
git commit -m "docs(api): update authentication endpoints"
```

### Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/new-feature
```

2. **Make Changes**
```bash
# Make your changes
# Write/update tests
# Update documentation
```

3. **Run Quality Checks**
```bash
# Lint code
pnpm run lint

# Run tests
pnpm test

# Type checking
pnpm run type-check

# Build check
pnpm run build
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push to Remote**
```bash
git push -u origin feature/new-feature
```

6. **Create Pull Request**
- Go to GitHub
- Create PR from your branch to `main`
- Fill in PR template
- Request reviews

### PR Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] No console.logs or debugging code
- [ ] TypeScript types are properly defined
- [ ] API changes are documented
- [ ] Database migrations are included
- [ ] Environment variables are documented

## Code Quality

### Linting

```bash
# Run ESLint
pnpm run lint

# Fix auto-fixable issues
pnpm run lint:fix

# Lint specific directory
pnpm run lint apps/frontend
```

### Type Checking

```bash
# Check TypeScript types
pnpm run type-check

# Watch mode
pnpm run type-check:watch
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm test src/components/Button.test.tsx
```

### Pre-commit Hooks

The project uses husky for pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "pnpm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Database Management

### Migrations

```bash
# Create new migration
pnpm run migration:create -- --name AddUserTable

# Run migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

### Seeding

```bash
# Seed development data
pnpm run db:seed

# Reset database (drop, create, migrate, seed)
pnpm run db:reset
```

## API Development

### Adding New Endpoints

1. **Define Route** (in service)
```typescript
// services/[service]/src/routes/newRoute.ts
router.post('/new-endpoint', authenticate, validate(schema), controller.create);
```

2. **Add to API Gateway**
```typescript
// services/api-gateway/src/routes.ts
app.use('/api/service/new-endpoint', proxy('service-name:3001'));
```

3. **Update API Documentation**
```markdown
# API.md
### New Endpoint
POST /api/service/new-endpoint
```

### Testing APIs

```bash
# Use REST client
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Or use included Postman collection
# Import: /postman/hockey-hub.postman_collection.json
```

## Frontend Development

### Adding New Components

1. **Create Component**
```bash
# Generate component boilerplate
pnpm run generate:component MyComponent
```

2. **Add Stories**
```typescript
// MyComponent.stories.tsx
export default {
  title: 'Components/MyComponent',
  component: MyComponent,
};
```

3. **Add Tests**
```typescript
// MyComponent.test.tsx
describe('MyComponent', () => {
  it('renders correctly', () => {
    // Test implementation
  });
});
```

### State Management

```bash
# Generate new Redux slice
pnpm run generate:slice featureName

# Generate new API slice
pnpm run generate:api serviceName
```

## Debugging

### Backend Debugging

1. **VS Code Debug Configuration**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Service",
  "program": "${workspaceFolder}/services/user-service/src/index.ts",
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "*"
  }
}
```

2. **Logging**
```typescript
import { logger } from '@hockey-hub/monitoring';

logger.info('Server started', { port: 3001 });
logger.error('Database error', { error: err });
```

### Frontend Debugging

1. **React DevTools**
- Install browser extension
- Inspect component props/state
- Profile performance

2. **Redux DevTools**
- View state changes
- Time travel debugging
- Action history

## Performance Monitoring

### Development Metrics

```bash
# Bundle size analysis
pnpm run analyze

# Lighthouse CI
pnpm run lighthouse

# Performance profiling
pnpm run profile
```

### Database Query Monitoring

```typescript
// Enable query logging in development
{
  logging: process.env.NODE_ENV === 'development',
  logQueryParameters: true
}
```

## Deployment Preparation

### Build Verification

```bash
# Full build test
pnpm run build:all

# Docker build test
docker-compose build

# Production environment test
NODE_ENV=production pnpm start
```

### Security Checklist

- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation complete

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database Connection Issues**
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear build cache
pnpm run clean
```

## Resources

### Internal Documentation
- [API Documentation](./API.md)
- [Frontend Guide](./apps/frontend/DEVELOPMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Wiki**: Detailed guides and explanations
- **Slack**: Real-time team communication