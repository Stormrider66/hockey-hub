# Hockey Hub Developer Guide

## Table of Contents
1. [Project Setup](#project-setup)
2. [Development Environment](#development-environment)
3. [Code Structure](#code-structure)
4. [Development Conventions](#development-conventions)
5. [Adding New Features](#adding-new-features)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Development Tasks](#common-development-tasks)
8. [Troubleshooting](#troubleshooting)

## Project Setup

### Prerequisites
- Node.js 18.x or higher
- pnpm 8.x or higher
- PostgreSQL 14.x or higher
- Redis 7.x or higher
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/hockey-hub.git
cd hockey-hub
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
# Copy example environment files
cp .env.example .env
cd apps/frontend && cp .env.local.example .env.local
cd ../..

# For each service
for service in services/*; do
  if [ -f "$service/.env.example" ]; then
    cp "$service/.env.example" "$service/.env"
  fi
done
```

4. **Set up databases**
```bash
# Create PostgreSQL databases for each service
createdb hockey_hub_users
createdb hockey_hub_calendar
createdb hockey_hub_training
createdb hockey_hub_medical
createdb hockey_hub_communication
createdb hockey_hub_planning
createdb hockey_hub_statistics
createdb hockey_hub_payment
createdb hockey_hub_admin

# Run migrations
pnpm run migrate:all
```

5. **Start Redis**
```bash
redis-server
```

6. **Start development servers**
```bash
# Start all services (requires Docker)
docker-compose up

# Or start specific services
cd services/api-gateway && pnpm dev
cd apps/frontend && pnpm dev
```

## Development Environment

### Recommended IDE Setup
- **VSCode** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Jest Runner
  - GitLens

### VSCode Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Port Mapping
| Service | Port | Database Port |
|---------|------|---------------|
| Frontend | 3002 | - |
| API Gateway | 3000 | - |
| User Service | 3001 | 5433 |
| Communication | 3002 | 5434 |
| Calendar | 3003 | 5435 |
| Training | 3004 | 5436 |
| Medical | 3005 | 5437 |
| Planning | 3006 | 5438 |
| Statistics | 3007 | 5439 |
| Payment | 3008 | 5440 |
| Admin | 3009 | 5441 |

## Code Structure

### Monorepo Organization
```
hockey-hub/
├── apps/
│   └── frontend/              # Next.js frontend application
│       ├── app/               # Next.js 15 app directory
│       ├── src/
│       │   ├── components/    # Reusable UI components
│       │   ├── features/      # Feature-based modules
│       │   ├── hooks/         # Custom React hooks
│       │   ├── store/         # Redux store and slices
│       │   └── utils/         # Utility functions
│       └── public/            # Static assets
├── services/                  # Backend microservices
│   ├── api-gateway/           # Central API routing
│   ├── user-service/          # Authentication & users
│   └── [other-services]/      # Domain-specific services
├── packages/                  # Shared packages
│   ├── shared-lib/            # Common utilities and types
│   ├── translations/          # i18n resources
│   └── monitoring/            # Logging and metrics
└── docs/                      # Documentation
```

### Service Structure Pattern
Each microservice follows this structure:
```
service-name/
├── src/
│   ├── index.ts              # Service entry point
│   ├── config/               # Configuration files
│   │   └── database.ts       # Database connection
│   ├── entities/             # TypeORM entities
│   ├── routes/               # Express routes
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── repositories/         # Data access layer
│   └── migrations/           # Database migrations
├── tests/                    # Test files
├── package.json
└── tsconfig.json
```

## Development Conventions

### TypeScript Guidelines
```typescript
// Use explicit types for function parameters and return values
function calculateScore(player: Player, metrics: Metrics): number {
  return player.goals * metrics.goalWeight;
}

// Use interfaces for object shapes
interface PlayerStats {
  goals: number;
  assists: number;
  penaltyMinutes: number;
}

// Use enums for constants
enum UserRole {
  PLAYER = 'PLAYER',
  COACH = 'COACH',
  PARENT = 'PARENT',
}

// Use type for unions and intersections
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`)
- **React Components**: PascalCase (`PlayerDashboard.tsx`)
- **Functions/Variables**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces/Types**: PascalCase (`UserProfile`)

### Git Commit Messages
Follow conventional commits:
```
feat: add player statistics dashboard
fix: resolve authentication token refresh issue
docs: update API documentation
test: add integration tests for calendar service
refactor: optimize database queries in user service
chore: update dependencies
```

### Error Handling
```typescript
// Use custom error classes
import { ApplicationError, NotFoundError } from '@hockey-hub/shared-lib';

// In services
async function getPlayer(id: string): Promise<Player> {
  const player = await playerRepository.findOne(id);
  if (!player) {
    throw new NotFoundError('Player not found', 'PLAYER_NOT_FOUND');
  }
  return player;
}

// In routes
router.get('/players/:id', async (req, res, next) => {
  try {
    const player = await playerService.getPlayer(req.params.id);
    res.json(player);
  } catch (error) {
    next(error); // Global error handler will process
  }
});
```

## Adding New Features

### 1. Frontend Feature Module
```bash
# Create feature directory structure
mkdir -p apps/frontend/src/features/my-feature/{components,hooks,types}
```

```typescript
// apps/frontend/src/features/my-feature/components/MyFeature.tsx
import React from 'react';
import { Card } from '@/components/ui/card';

export function MyFeature() {
  return (
    <Card>
      <h2>My New Feature</h2>
    </Card>
  );
}

// apps/frontend/src/features/my-feature/hooks/useMyFeature.ts
import { useAppSelector, useAppDispatch } from '@/hooks/redux';

export function useMyFeature() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.myFeature);
  
  return { data };
}
```

### 2. Backend API Endpoint
```typescript
// services/my-service/src/routes/myFeatureRoutes.ts
import { Router } from 'express';
import { authenticate, authorize } from '@hockey-hub/shared-lib';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateFeatureDto } from '../dto/create-feature.dto';

const router = Router();

router.post(
  '/features',
  authenticate,
  authorize(['ADMIN', 'COACH']),
  validationMiddleware(CreateFeatureDto),
  async (req, res, next) => {
    try {
      const feature = await featureService.create(req.body);
      res.status(201).json(feature);
    } catch (error) {
      next(error);
    }
  }
);

export { router as myFeatureRoutes };
```

### 3. Redux Slice and API
```typescript
// apps/frontend/src/store/api/myFeatureApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

export const myFeatureApi = createApi({
  reducerPath: 'myFeatureApi',
  baseQuery,
  tagTypes: ['Feature'],
  endpoints: (builder) => ({
    getFeatures: builder.query<Feature[], void>({
      query: () => '/features',
      providesTags: ['Feature'],
    }),
    createFeature: builder.mutation<Feature, CreateFeatureInput>({
      query: (data) => ({
        url: '/features',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Feature'],
    }),
  }),
});

export const { useGetFeaturesQuery, useCreateFeatureMutation } = myFeatureApi;
```

## Testing Guidelines

### Unit Testing
```typescript
// services/user-service/src/services/__tests__/userService.test.ts
import { UserService } from '../userService';
import { mockUserRepository } from '../../mocks/repositories';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(mockUserRepository);
  });

  it('should create a new user', async () => {
    const userData = { email: 'test@example.com', password: 'secure123' };
    const user = await userService.createUser(userData);
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: userData.email })
    );
  });
});
```

### Integration Testing
```typescript
// services/user-service/src/routes/__tests__/auth.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, teardownTestDatabase } from '../../test-utils';

describe('Auth Routes Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });
  });
});
```

### Frontend Testing
```typescript
// apps/frontend/src/features/player/__tests__/PlayerDashboard.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { PlayerDashboard } from '../PlayerDashboard';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('PlayerDashboard', () => {
  it('should display player statistics', async () => {
    renderWithProviders(<PlayerDashboard />);
    
    // Wait for data to load
    expect(await screen.findByText('Season Statistics')).toBeInTheDocument();
    expect(screen.getByText('15 Goals')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/players/overview', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    renderWithProviders(<PlayerDashboard />);
    
    expect(await screen.findByText('Failed to load data')).toBeInTheDocument();
  });
});
```

## Common Development Tasks

### Adding a New Service

1. **Create service directory**
```bash
mkdir -p services/new-service/src/{config,entities,routes,services,middleware}
cd services/new-service
```

2. **Initialize package.json**
```json
{
  "name": "@hockey-hub/new-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@hockey-hub/shared-lib": "workspace:*",
    "express": "^4.18.2",
    "typeorm": "^0.3.17"
  }
}
```

3. **Create service entry point**
```typescript
// services/new-service/src/index.ts
import express from 'express';
import { createConnection } from 'typeorm';
import { errorHandler, requestLogger } from '@hockey-hub/shared-lib';
import { routes } from './routes';

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());
app.use(requestLogger);
app.use('/api/new-service', routes);
app.use(errorHandler);

async function start() {
  try {
    await createConnection();
    app.listen(PORT, () => {
      console.log(`New service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
```

### Database Migrations

1. **Create migration**
```bash
cd services/my-service
pnpm typeorm migration:create src/migrations/AddNewFeature
```

2. **Edit migration file**
```typescript
// src/migrations/1234567890-AddNewFeature.ts
import { MigrationInterface, QueryRunner, Table, Column } from 'typeorm';

export class AddNewFeature1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'features',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('features');
  }
}
```

3. **Run migration**
```bash
pnpm typeorm migration:run
```

### Adding API Endpoints

1. **Define DTO**
```typescript
// shared-lib/src/dto/feature.dto.ts
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

2. **Create route**
```typescript
// services/my-service/src/routes/featureRoutes.ts
import { Router } from 'express';
import { authenticate, validationMiddleware } from '@hockey-hub/shared-lib';
import { CreateFeatureDto } from '@hockey-hub/shared-lib/dto';
import { featureService } from '../services';

const router = Router();

router.post(
  '/',
  authenticate,
  validationMiddleware(CreateFeatureDto),
  async (req, res, next) => {
    try {
      const feature = await featureService.create(req.body, req.user);
      res.status(201).json(feature);
    } catch (error) {
      next(error);
    }
  }
);

export { router as featureRoutes };
```

3. **Update API Gateway**
```typescript
// services/api-gateway/src/routes/index.ts
app.use('/api/features', proxy('http://localhost:3010/api/new-service'));
```

### Performance Optimization

1. **Add Redis Caching**
```typescript
// services/my-service/src/repositories/cachedFeatureRepository.ts
import { Redis } from 'ioredis';
import { Feature } from '../entities/Feature';

export class CachedFeatureRepository {
  constructor(
    private repository: Repository<Feature>,
    private redis: Redis
  ) {}

  async findById(id: string): Promise<Feature | null> {
    const cacheKey = `feature:${id}`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Load from database
    const feature = await this.repository.findOne({ where: { id } });
    if (feature) {
      await this.redis.set(cacheKey, JSON.stringify(feature), 'EX', 3600);
    }

    return feature;
  }

  async invalidate(id: string): Promise<void> {
    await this.redis.del(`feature:${id}`);
  }
}
```

2. **Implement Pagination**
```typescript
// Use pagination utilities from shared-lib
import { PaginationDto, createPaginatedResponse } from '@hockey-hub/shared-lib';

router.get(
  '/',
  authenticate,
  validationMiddleware(PaginationDto, 'query'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const [items, total] = await featureRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });

      const response = createPaginatedResponse(items, total, page, limit);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
```

## Troubleshooting

### Common Issues

1. **Port already in use**
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

2. **Database connection errors**
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -c "\l"

# Reset database
dropdb hockey_hub_users && createdb hockey_hub_users
pnpm typeorm migration:run
```

3. **TypeScript errors**
```bash
# Clear build cache
rm -rf dist/ .next/
pnpm install
pnpm build
```

4. **Test failures**
```bash
# Run specific test file
pnpm test -- path/to/test.ts

# Update snapshots
pnpm test -- -u

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debugging Tips

1. **Enable debug logging**
```bash
DEBUG=hockey-hub:* pnpm dev
```

2. **VSCode debugging**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Service",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/services/user-service",
      "console": "integratedTerminal"
    }
  ]
}
```

3. **Database query logging**
```typescript
// In typeorm config
{
  logging: process.env.NODE_ENV === 'development',
  logger: 'advanced-console'
}
```

## Resources

- [TypeORM Documentation](https://typeorm.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Jest Documentation](https://jestjs.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Getting Help

- Check existing issues in GitHub
- Ask in the development Slack channel
- Review the codebase for similar implementations
- Consult the CLAUDE.md file for project-specific context