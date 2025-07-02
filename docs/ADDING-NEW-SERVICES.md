# Adding New Services to Hockey Hub

This guide walks through creating a new microservice in the Hockey Hub ecosystem.

## Overview

Each microservice in Hockey Hub follows a standardized structure and integrates with the API Gateway and shared infrastructure. This guide will help you create a new service that fits seamlessly into the existing architecture.

## Service Template Structure

```
services/my-new-service/
├── src/
│   ├── index.ts              # Service entry point
│   ├── config/
│   │   ├── database.ts       # Database connection config
│   │   └── redis.ts          # Redis connection config
│   ├── entities/             # TypeORM entities
│   │   ├── MyEntity.ts
│   │   └── index.ts
│   ├── dto/                  # Data transfer objects
│   │   ├── create-item.dto.ts
│   │   └── update-item.dto.ts
│   ├── routes/               # Express routes
│   │   ├── itemRoutes.ts
│   │   └── index.ts
│   ├── services/             # Business logic
│   │   ├── itemService.ts
│   │   └── index.ts
│   ├── repositories/         # Data access layer
│   │   ├── itemRepository.ts
│   │   └── index.ts
│   ├── middleware/           # Custom middleware
│   │   └── validation.ts
│   ├── migrations/           # Database migrations
│   │   └── 1234567890-InitialSchema.ts
│   └── __tests__/           # Test files
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── package.json
├── tsconfig.json
├── jest.config.js
├── jest.setup.ts
├── Dockerfile
└── .env.example
```

## Step-by-Step Implementation

### 1. Create Service Directory

```bash
# Create the service directory
mkdir -p services/my-new-service/src/{config,entities,dto,routes,services,repositories,middleware,migrations,__tests__}

# Navigate to the service directory
cd services/my-new-service
```

### 2. Initialize Package Configuration

Create `package.json`:

```json
{
  "name": "@hockey-hub/my-new-service",
  "version": "1.0.0",
  "description": "Description of your service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "typeorm": "typeorm-ts-node-esm",
    "migration:create": "typeorm-ts-node-esm migration:create",
    "migration:run": "typeorm-ts-node-esm migration:run",
    "migration:revert": "typeorm-ts-node-esm migration:revert"
  },
  "dependencies": {
    "@hockey-hub/shared-lib": "workspace:*",
    "express": "^4.18.2",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@types/pg": "^8.10.2",
    "@types/cors": "^2.8.13",
    "@types/compression": "^1.7.2",
    "@types/jest": "^29.5.5",
    "jest": "^29.6.4",
    "ts-jest": "^29.1.1",
    "tsx": "^3.12.7",
    "typescript": "^5.2.2",
    "eslint": "^8.47.0",
    "@typescript-eslint/eslint-plugin": "^6.4.1",
    "@typescript-eslint/parser": "^6.4.1"
  }
}
```

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/config/*": ["./config/*"],
      "@/entities/*": ["./entities/*"],
      "@/services/*": ["./services/*"],
      "@/routes/*": ["./routes/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3. Create Database Configuration

Create `src/config/database.ts`:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: isTest 
    ? process.env.TEST_DB_NAME || 'test_my_new_service'
    : process.env.DB_NAME || 'hockey_hub_my_new_service',
  synchronize: false, // Always use migrations
  logging: !isProduction && !isTest,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Run pending migrations
    await AppDataSource.runMigrations();
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}
```

Create `src/config/redis.ts`:

```typescript
import Redis from 'ioredis';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('Redis');

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('✅ Redis connection established');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

export default redis;
```

### 4. Create TypeORM Entities

Create `src/entities/MyEntity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

@Entity('my_entities')
@Index(['organizationId', 'isActive'])
export class MyEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Create `src/entities/index.ts`:

```typescript
export { MyEntity } from './MyEntity';
```

### 5. Create DTOs for Validation

Create `src/dto/create-item.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsUUID()
  organizationId: string;
}
```

Create `src/dto/update-item.dto.ts`:

```typescript
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### 6. Create Repository Layer

Create `src/repositories/itemRepository.ts`:

```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '@/config/database';
import { MyEntity } from '@/entities/MyEntity';
import { Logger } from '@hockey-hub/shared-lib';
import redis from '@/config/redis';

export class ItemRepository {
  private repository: Repository<MyEntity>;
  private logger = new Logger('ItemRepository');

  constructor() {
    this.repository = AppDataSource.getRepository(MyEntity);
  }

  async findAll(organizationId: string): Promise<MyEntity[]> {
    const cacheKey = `items:org:${organizationId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const items = await this.repository.find({
      where: { organizationId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(items), 'EX', 300);
    
    return items;
  }

  async findById(id: string): Promise<MyEntity | null> {
    const cacheKey = `item:${id}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const item = await this.repository.findOne({
      where: { id, isActive: true },
    });

    if (item) {
      await redis.set(cacheKey, JSON.stringify(item), 'EX', 300);
    }

    return item;
  }

  async create(data: Partial<MyEntity>): Promise<MyEntity> {
    const item = this.repository.create(data);
    const savedItem = await this.repository.save(item);
    
    // Invalidate cache
    await this.invalidateCache(savedItem.organizationId);
    
    this.logger.info('Item created', { itemId: savedItem.id });
    return savedItem;
  }

  async update(id: string, data: Partial<MyEntity>): Promise<MyEntity | null> {
    const item = await this.findById(id);
    if (!item) return null;

    Object.assign(item, data);
    const updatedItem = await this.repository.save(item);
    
    // Invalidate cache
    await this.invalidateItemCache(id);
    await this.invalidateCache(item.organizationId);
    
    this.logger.info('Item updated', { itemId: id });
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const item = await this.findById(id);
    if (!item) return false;

    await this.repository.update(id, { isActive: false });
    
    // Invalidate cache
    await this.invalidateItemCache(id);
    await this.invalidateCache(item.organizationId);
    
    this.logger.info('Item soft deleted', { itemId: id });
    return true;
  }

  private async invalidateCache(organizationId: string): Promise<void> {
    await redis.del(`items:org:${organizationId}`);
  }

  private async invalidateItemCache(itemId: string): Promise<void> {
    await redis.del(`item:${itemId}`);
  }
}
```

Create `src/repositories/index.ts`:

```typescript
export { ItemRepository } from './itemRepository';
```

### 7. Create Service Layer

Create `src/services/itemService.ts`:

```typescript
import { ItemRepository } from '@/repositories/itemRepository';
import { MyEntity } from '@/entities/MyEntity';
import { CreateItemDto, UpdateItemDto } from '@/dto';
import { NotFoundError, ValidationError, Logger } from '@hockey-hub/shared-lib';

export class ItemService {
  private itemRepository: ItemRepository;
  private logger = new Logger('ItemService');

  constructor() {
    this.itemRepository = new ItemRepository();
  }

  async getAllItems(organizationId: string, userId: string): Promise<MyEntity[]> {
    this.logger.info('Fetching all items', { organizationId, userId });
    
    // Add authorization logic here if needed
    
    return await this.itemRepository.findAll(organizationId);
  }

  async getItemById(id: string, userId: string): Promise<MyEntity> {
    this.logger.info('Fetching item by ID', { itemId: id, userId });
    
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item not found', 'ITEM_NOT_FOUND');
    }

    // Add authorization logic here
    
    return item;
  }

  async createItem(data: CreateItemDto, userId: string): Promise<MyEntity> {
    this.logger.info('Creating new item', { data, userId });
    
    // Add business logic validation
    await this.validateCreateData(data);
    
    const itemData = {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    };
    
    return await this.itemRepository.create(itemData);
  }

  async updateItem(id: string, data: UpdateItemDto, userId: string): Promise<MyEntity> {
    this.logger.info('Updating item', { itemId: id, data, userId });
    
    const existingItem = await this.getItemById(id, userId);
    
    // Add business logic validation
    await this.validateUpdateData(existingItem, data);
    
    const updateData = {
      ...data,
      updatedBy: userId,
    };
    
    const updatedItem = await this.itemRepository.update(id, updateData);
    if (!updatedItem) {
      throw new NotFoundError('Item not found', 'ITEM_NOT_FOUND');
    }
    
    return updatedItem;
  }

  async deleteItem(id: string, userId: string): Promise<void> {
    this.logger.info('Deleting item', { itemId: id, userId });
    
    const item = await this.getItemById(id, userId);
    
    // Add business logic validation
    await this.validateDeleteOperation(item);
    
    const deleted = await this.itemRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Item not found', 'ITEM_NOT_FOUND');
    }
  }

  private async validateCreateData(data: CreateItemDto): Promise<void> {
    // Add custom business logic validation
    if (data.name.toLowerCase().includes('forbidden')) {
      throw new ValidationError('Invalid item name', 'INVALID_NAME');
    }
  }

  private async validateUpdateData(existingItem: MyEntity, data: UpdateItemDto): Promise<void> {
    // Add custom business logic validation
    if (data.name && data.name.toLowerCase().includes('forbidden')) {
      throw new ValidationError('Invalid item name', 'INVALID_NAME');
    }
  }

  private async validateDeleteOperation(item: MyEntity): Promise<void> {
    // Add custom business logic validation
    // e.g., check if item is referenced by other entities
  }
}
```

Create `src/services/index.ts`:

```typescript
export { ItemService } from './itemService';
```

### 8. Create Routes

Create `src/routes/itemRoutes.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { ItemService } from '@/services/itemService';
import { CreateItemDto, UpdateItemDto } from '@/dto';
import {
  authenticate,
  authorize,
  validationMiddleware,
  PaginationDto,
  createPaginatedResponse,
  AuthenticatedRequest,
} from '@hockey-hub/shared-lib';

const router = Router();
const itemService = new ItemService();

// GET /items - Get all items
router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'COACH', 'MANAGER']),
  validationMiddleware(PaginationDto, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const items = await itemService.getAllItems(organizationId, req.user.id);
      
      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /items/:id - Get item by ID
router.get(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'COACH', 'MANAGER']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const item = await itemService.getItemById(req.params.id, req.user.id);
      
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /items - Create new item
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'COACH', 'MANAGER']),
  validationMiddleware(CreateItemDto),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const itemData = {
        ...req.body,
        organizationId: req.user.organizationId,
      };
      
      const item = await itemService.createItem(itemData, req.user.id);
      
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /items/:id - Update item
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'COACH', 'MANAGER']),
  validationMiddleware(UpdateItemDto),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const item = await itemService.updateItem(req.params.id, req.body, req.user.id);
      
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /items/:id - Delete item
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'COACH', 'MANAGER']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await itemService.deleteItem(req.params.id, req.user.id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as itemRoutes };
```

Create `src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { itemRoutes } from './itemRoutes';

const router = Router();

router.use('/items', itemRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'my-new-service',
  });
});

export { router as routes };
```

### 9. Create Service Entry Point

Create `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

import { initializeDatabase } from '@/config/database';
import { routes } from '@/routes';
import {
  errorHandler,
  requestLogger,
  notFoundHandler,
  Logger,
} from '@hockey-hub/shared-lib';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3010;
const logger = new Logger('MyNewService');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3002',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use(limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/my-new-service', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 My New Service running on port ${PORT}`);
      logger.info(`📚 Health check: http://localhost:${PORT}/api/my-new-service/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 10. Create Initial Migration

```bash
# Create initial migration
pnpm typeorm migration:create src/migrations/InitialSchema
```

Edit the migration file:

```typescript
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class InitialSchema1234567890 implements MigrationInterface {
  name = 'InitialSchema1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create my_entities table
    await queryRunner.createTable(
      new Table({
        name: 'my_entities',
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
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('my_entities', new Index('IDX_my_entities_organization_active', ['organization_id', 'is_active']));
    await queryRunner.createIndex('my_entities', new Index('IDX_my_entities_organization', ['organization_id']));
    await queryRunner.createIndex('my_entities', new Index('IDX_my_entities_active', ['is_active']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('my_entities');
  }
}
```

### 11. Create Test Configuration

Create `jest.config.js`:

```javascript
const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'my-new-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/migrations/**',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

Create `jest.setup.ts`:

```typescript
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

### 12. Create Environment Files

Create `.env.example`:

```bash
# Service Configuration
NODE_ENV=development
PORT=3010

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=hockey_hub_my_new_service

# Test Database
TEST_DB_NAME=test_hockey_hub_my_new_service

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS Configuration
CORS_ORIGIN=http://localhost:3002,http://localhost:3000

# Logging
LOG_LEVEL=info
```

Create `.env.test`:

```bash
NODE_ENV=test
DB_NAME=test_hockey_hub_my_new_service
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=error
```

### 13. Create Docker Configuration

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY packages/shared-lib/package.json ./packages/shared-lib/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the service
RUN pnpm build

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010/api/my-new-service/health || exit 1

# Start the service
CMD ["pnpm", "start"]
```

### 14. Update API Gateway

Add your service to the API Gateway routing:

```typescript
// services/api-gateway/src/routes/index.ts
import { createProxyMiddleware } from 'http-proxy-middleware';

// Add your service proxy
app.use(
  '/api/my-new-service',
  createProxyMiddleware({
    target: process.env.MY_NEW_SERVICE_URL || 'http://localhost:3010',
    changeOrigin: true,
    pathRewrite: {
      '^/api/my-new-service': '/api/my-new-service',
    },
    onError: (err, req, res) => {
      console.error('Proxy error for my-new-service:', err);
      res.status(503).json({ error: 'Service temporarily unavailable' });
    },
  })
);
```

### 15. Update Docker Compose

Add your service to `docker-compose.yml`:

```yaml
services:
  my-new-service:
    build:
      context: .
      dockerfile: services/my-new-service/Dockerfile
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_NAME=hockey_hub_my_new_service
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./services/my-new-service:/app/services/my-new-service
    command: pnpm dev
```

### 16. Create Sample Tests

Create `src/__tests__/unit/itemService.test.ts`:

```typescript
import { ItemService } from '@/services/itemService';
import { ItemRepository } from '@/repositories/itemRepository';
import { NotFoundError } from '@hockey-hub/shared-lib';

// Mock the repository
jest.mock('@/repositories/itemRepository');

describe('ItemService', () => {
  let itemService: ItemService;
  let mockItemRepository: jest.Mocked<ItemRepository>;

  beforeEach(() => {
    mockItemRepository = new ItemRepository() as jest.Mocked<ItemRepository>;
    itemService = new ItemService();
    (itemService as any).itemRepository = mockItemRepository;
  });

  describe('getItemById', () => {
    it('should return item when found', async () => {
      const mockItem = {
        id: '1',
        name: 'Test Item',
        organizationId: 'org1',
        isActive: true,
      };

      mockItemRepository.findById.mockResolvedValue(mockItem as any);

      const result = await itemService.getItemById('1', 'user1');

      expect(result).toEqual(mockItem);
      expect(mockItemRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError when item not found', async () => {
      mockItemRepository.findById.mockResolvedValue(null);

      await expect(itemService.getItemById('1', 'user1'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
```

### 17. Install Dependencies and Test

```bash
# Install dependencies
pnpm install

# Run TypeScript check
pnpm typecheck

# Run tests
pnpm test

# Start development server
pnpm dev
```

## Integration Steps

### 1. Database Setup
```bash
# Create database
createdb hockey_hub_my_new_service

# Run migrations
pnpm migration:run
```

### 2. Update Root Package.json
Add your service to the workspace scripts:

```json
{
  "scripts": {
    "dev:my-new-service": "pnpm --filter @hockey-hub/my-new-service dev",
    "build:my-new-service": "pnpm --filter @hockey-hub/my-new-service build",
    "test:my-new-service": "pnpm --filter @hockey-hub/my-new-service test"
  }
}
```

### 3. Update Documentation
- Add service to main README.md
- Update architecture diagrams
- Add API documentation

## Best Practices

### Performance
- Use Redis caching aggressively
- Implement proper database indexes
- Use pagination for list endpoints
- Consider database query optimization

### Security
- Always use authentication middleware
- Implement proper authorization
- Validate all inputs with DTOs
- Use parameterized queries (TypeORM handles this)

### Monitoring
- Add structured logging
- Implement health checks
- Add metrics collection
- Use correlation IDs for tracing

### Testing
- Write unit tests for business logic
- Create integration tests for API endpoints
- Mock external dependencies
- Maintain good test coverage (>80%)

This template provides a solid foundation for creating new microservices that integrate seamlessly with the Hockey Hub ecosystem.