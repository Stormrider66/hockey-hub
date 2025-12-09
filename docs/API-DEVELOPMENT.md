# API Development Guide

This guide covers best practices for developing REST APIs in the Hockey Hub microservices architecture.

## Table of Contents
1. [API Design Principles](#api-design-principles)
2. [URL Structure](#url-structure)
3. [HTTP Methods and Status Codes](#http-methods-and-status-codes)
4. [Request/Response Format](#requestresponse-format)
5. [Authentication and Authorization](#authentication-and-authorization)
6. [Validation and Error Handling](#validation-and-error-handling)
7. [Pagination](#pagination)
8. [Filtering and Sorting](#filtering-and-sorting)
9. [Versioning](#versioning)
10. [Documentation](#documentation)

## API Design Principles

### RESTful Design
- Use nouns for resources, not verbs
- Use HTTP methods to indicate actions
- Make URLs hierarchical and logical
- Keep responses stateless

### Consistency
- Follow naming conventions throughout
- Use consistent response formats
- Apply the same error handling patterns
- Maintain consistent HTTP status codes

### Example Structure
```
GET    /api/players              # Get all players
GET    /api/players/123          # Get specific player
POST   /api/players              # Create new player
PUT    /api/players/123          # Update entire player
PATCH  /api/players/123          # Partial update player
DELETE /api/players/123          # Delete player

GET    /api/players/123/stats    # Get player statistics
POST   /api/players/123/stats    # Add statistics entry
```

## URL Structure

### Base URL Pattern
```
https://api.hockey-hub.com/api/{service}/{version}/{resource}
```

### Resource Naming
- Use plural nouns for collections: `/players`, `/teams`, `/games`
- Use singular nouns for single resources: `/player/123/profile`
- Use kebab-case for multi-word resources: `/training-sessions`

### Nested Resources
```typescript
// Good: Shows relationship
GET /api/teams/123/players
GET /api/players/456/statistics
GET /api/games/789/events

// Avoid: Too deeply nested
GET /api/organizations/1/teams/2/players/3/statistics/4/details
```

### Query Parameters
```typescript
// Filtering
GET /api/players?position=forward&active=true

// Sorting
GET /api/players?sort=lastName&order=asc

// Pagination
GET /api/players?page=2&limit=20

// Field selection
GET /api/players?fields=id,firstName,lastName,position
```

## HTTP Methods and Status Codes

### HTTP Methods
| Method | Purpose | Request Body | Response Body |
|---------|---------|--------------|---------------|
| GET | Retrieve resource(s) | No | Yes |
| POST | Create new resource | Yes | Yes |
| PUT | Replace entire resource | Yes | Yes |
| PATCH | Partial update | Yes | Yes |
| DELETE | Remove resource | No | Minimal |

### Status Codes
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server error |

### Implementation Example
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';

const router = Router();

// GET /players - Get all players
router.get('/', 
  authenticate,
  authorize(['COACH', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const players = await playerService.getAllPlayers(req.query);
      
      res.status(200).json({
        success: true,
        data: players,
        meta: {
          total: players.length,
          page: req.query.page || 1,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /players - Create new player
router.post('/',
  authenticate,
  authorize(['COACH', 'ADMIN']),
  validationMiddleware(CreatePlayerDto),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const player = await playerService.createPlayer(req.body);
      
      res.status(201).json({
        success: true,
        data: player,
        message: 'Player created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /players/:id - Update entire player
router.put('/:id',
  authenticate,
  authorize(['COACH', 'ADMIN']),
  validationMiddleware(UpdatePlayerDto),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const player = await playerService.updatePlayer(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        data: player,
        message: 'Player updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /players/:id - Delete player
router.delete('/:id',
  authenticate,
  authorize(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await playerService.deletePlayer(req.params.id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
```

## Request/Response Format

### Request Structure
```typescript
// Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>",
  "X-Request-ID": "uuid-v4",
  "Accept": "application/json"
}

// Body (POST/PUT/PATCH)
{
  "firstName": "Connor",
  "lastName": "McDavid",
  "position": "CENTER",
  "jerseyNumber": 97,
  "dateOfBirth": "1997-01-13",
  "height": 185,
  "weight": 88
}
```

### Response Structure
```typescript
// Success Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Connor",
    "lastName": "McDavid",
    "position": "CENTER",
    "jerseyNumber": 97,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "requestId": "uuid-v4"
  }
}

// Collection Response
{
  "success": true,
  "data": [
    { /* player object */ },
    { /* player object */ }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player not found",
    "details": "No player exists with ID: 123"
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

## Authentication and Authorization

### JWT Authentication
```typescript
import { authenticate, authorize } from '@hockey-hub/shared-lib';

// Require authentication
router.get('/protected', authenticate, (req, res) => {
  // req.user contains authenticated user info
});

// Require specific roles
router.post('/admin-only', 
  authenticate, 
  authorize(['ADMIN']), 
  (req, res) => {
    // Only admins can access
  }
);

// Multiple roles allowed
router.get('/coach-or-admin', 
  authenticate, 
  authorize(['COACH', 'ADMIN']), 
  (req, res) => {
    // Coaches or admins can access
  }
);
```

### Authorization Patterns
```typescript
// Resource ownership check
router.get('/players/:id', 
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const player = await playerService.getPlayer(req.params.id);
      
      // Check if user can access this player
      if (!canUserAccessPlayer(req.user, player)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to access this player'
          }
        });
      }
      
      res.json({ success: true, data: player });
    } catch (error) {
      next(error);
    }
  }
);

function canUserAccessPlayer(user: User, player: Player): boolean {
  // Admin can access all
  if (user.role === 'ADMIN') return true;
  
  // Coach can access players in their teams
  if (user.role === 'COACH') {
    return user.teams.some(team => team.id === player.teamId);
  }
  
  // Player can only access their own data
  if (user.role === 'PLAYER') {
    return user.id === player.userId;
  }
  
  // Parent can access their child's data
  if (user.role === 'PARENT') {
    return user.children.some(child => child.id === player.userId);
  }
  
  return false;
}
```

## Validation and Error Handling

### DTO Validation
```typescript
// CreatePlayerDto
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsNumber, 
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max
} from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(['GOALIE', 'DEFENSE', 'FORWARD', 'CENTER', 'LEFT_WING', 'RIGHT_WING'])
  position: string;

  @IsNumber()
  @Min(1)
  @Max(99)
  jerseyNumber: number;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsNumber()
  @Min(150)
  @Max(220)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(150)
  weight?: number;
}

// UpdatePlayerDto
export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEnum(['GOALIE', 'DEFENSE', 'FORWARD', 'CENTER', 'LEFT_WING', 'RIGHT_WING'])
  position?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  jerseyNumber?: number;
}
```

### Custom Validation
```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom validator for unique jersey number
export function IsUniqueJerseyNumber(teamId: string, validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isUniqueJerseyNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          const playerService = new PlayerService();
          const existingPlayer = await playerService.findByJerseyNumber(teamId, value);
          return existingPlayer === null;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Jersey number $value is already taken';
        }
      }
    });
  };
}

// Usage in DTO
export class CreatePlayerDto {
  @IsNumber()
  @Min(1)
  @Max(99)
  @IsUniqueJerseyNumber('teamId')
  jerseyNumber: number;
}
```

### Error Handling Implementation
```typescript
// Custom error classes
import { ApplicationError } from '@hockey-hub/shared-lib';

export class PlayerNotFoundError extends ApplicationError {
  constructor(playerId: string) {
    super('Player not found', 'PLAYER_NOT_FOUND', 404, {
      playerId
    });
  }
}

export class JerseyNumberTakenError extends ApplicationError {
  constructor(jerseyNumber: number, teamId: string) {
    super('Jersey number already taken', 'JERSEY_NUMBER_TAKEN', 409, {
      jerseyNumber,
      teamId
    });
  }
}

// Service layer error handling
export class PlayerService {
  async createPlayer(data: CreatePlayerDto): Promise<Player> {
    // Check for duplicate jersey number
    const existing = await this.playerRepository.findByJerseyNumber(
      data.teamId, 
      data.jerseyNumber
    );
    
    if (existing) {
      throw new JerseyNumberTakenError(data.jerseyNumber, data.teamId);
    }
    
    try {
      return await this.playerRepository.create(data);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique constraint
        throw new JerseyNumberTakenError(data.jerseyNumber, data.teamId);
      }
      throw error;
    }
  }
  
  async getPlayer(id: string): Promise<Player> {
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new PlayerNotFoundError(id);
    }
    return player;
  }
}
```

## Pagination

### Implementation
```typescript
// PaginationDto
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// Service implementation
export class PlayerService {
  async getPlayers(options: PaginationDto & FilterOptions): Promise<PaginatedResult<Player>> {
    const { page = 1, limit = 20, ...filters } = options;
    const skip = (page - 1) * limit;
    
    const [players, total] = await this.playerRepository.findAndCount({
      where: this.buildWhereClause(filters),
      skip,
      take: limit,
      order: { lastName: 'ASC' }
    });
    
    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}

// Route implementation
router.get('/',
  authenticate,
  validationMiddleware(PaginationDto, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await playerService.getPlayers(req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Cursor-based Pagination (for large datasets)
```typescript
// CursorPaginationDto
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  direction?: 'asc' | 'desc' = 'asc';
}

// Implementation
export class PlayerService {
  async getPlayersCursor(options: CursorPaginationDto): Promise<CursorPaginatedResult<Player>> {
    const { cursor, limit = 20, direction = 'asc' } = options;
    
    const queryBuilder = this.playerRepository.createQueryBuilder('player');
    
    if (cursor) {
      const operator = direction === 'asc' ? '>' : '<';
      queryBuilder.where(`player.id ${operator} :cursor`, { cursor });
    }
    
    const players = await queryBuilder
      .orderBy('player.id', direction.toUpperCase() as 'ASC' | 'DESC')
      .limit(limit + 1) // Get one extra to determine if there's more
      .getMany();
    
    const hasMore = players.length > limit;
    const data = hasMore ? players.slice(0, -1) : players;
    const nextCursor = hasMore ? players[players.length - 2].id : null;
    
    return {
      data,
      meta: {
        hasMore,
        nextCursor,
        limit
      }
    };
  }
}
```

## Filtering and Sorting

### Filter Implementation
```typescript
// FilterDto
export class PlayerFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['GOALIE', 'DEFENSE', 'FORWARD'])
  position?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(18)
  @Max(50)
  minAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(18)
  @Max(50)
  maxAge?: number;
}

// Service implementation
export class PlayerService {
  private buildWhereClause(filters: PlayerFilterDto): FindOptionsWhere<Player> {
    const where: FindOptionsWhere<Player> = {};
    
    if (filters.position) {
      where.position = filters.position;
    }
    
    if (filters.active !== undefined) {
      where.isActive = filters.active;
    }
    
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    
    // Age filtering (requires calculation)
    if (filters.minAge || filters.maxAge) {
      const now = new Date();
      
      if (filters.maxAge) {
        const minBirthDate = new Date(now.getFullYear() - filters.maxAge, now.getMonth(), now.getDate());
        where.dateOfBirth = MoreThanOrEqual(minBirthDate);
      }
      
      if (filters.minAge) {
        const maxBirthDate = new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate());
        where.dateOfBirth = LessThanOrEqual(maxBirthDate);
      }
    }
    
    return where;
  }
  
  async getPlayers(filters: PlayerFilterDto): Promise<PaginatedResult<Player>> {
    const { page = 1, limit = 20, search, ...otherFilters } = filters;
    
    let queryBuilder = this.playerRepository.createQueryBuilder('player');
    
    // Apply basic filters
    const where = this.buildWhereClause(otherFilters);
    if (Object.keys(where).length > 0) {
      queryBuilder = queryBuilder.where(where);
    }
    
    // Apply search
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(player.firstName ILIKE :search OR player.lastName ILIKE :search OR player.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Apply pagination
    const [players, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('player.lastName', 'ASC')
      .getManyAndCount();
    
    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}
```

### Sorting Implementation
```typescript
// SortingDto
export class SortingDto {
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Advanced sorting with multiple fields
export class AdvancedSortingDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortField)
  sort?: SortField[] = [{ field: 'createdAt', order: 'desc' }];
}

export class SortField {
  @IsString()
  field: string;

  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';
}

// Implementation
export class PlayerService {
  private applySorting(queryBuilder: SelectQueryBuilder<Player>, sort: SortField[]): SelectQueryBuilder<Player> {
    sort.forEach((sortField, index) => {
      const { field, order } = sortField;
      const method = index === 0 ? 'orderBy' : 'addOrderBy';
      queryBuilder[method](`player.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
    });
    
    return queryBuilder;
  }
}
```

## Versioning

### URL Versioning
```typescript
// v1 routes
router.use('/api/v1/players', v1PlayerRoutes);

// v2 routes
router.use('/api/v2/players', v2PlayerRoutes);
```

### Header Versioning
```typescript
// Middleware to handle version headers
function versionMiddleware(req: Request, res: Response, next: NextFunction) {
  const version = req.headers['api-version'] || '1';
  req.apiVersion = version;
  next();
}

// Route handler
router.get('/players', versionMiddleware, (req, res) => {
  if (req.apiVersion === '2') {
    return playerServiceV2.getPlayers(req.query);
  }
  return playerServiceV1.getPlayers(req.query);
});
```

### Backward Compatibility
```typescript
// Transform response based on version
function transformPlayerResponse(player: Player, version: string): any {
  const baseResponse = {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
  };
  
  if (version === '1') {
    return {
      ...baseResponse,
      // v1 format
      name: `${player.firstName} ${player.lastName}`,
    };
  }
  
  if (version === '2') {
    return {
      ...baseResponse,
      // v2 format with additional fields
      fullName: `${player.firstName} ${player.lastName}`,
      position: player.position,
      statistics: player.statistics,
    };
  }
  
  return baseResponse;
}
```

## Documentation

### OpenAPI/Swagger Documentation
```typescript
/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *           enum: [GOALIE, DEFENSE, FORWARD]
 *         description: Filter by position
 *     responses:
 *       200:
 *         description: List of players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, getPlayers);

/**
 * @swagger
 * components:
 *   schemas:
 *     Player:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - position
 *         - jerseyNumber
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         position:
 *           type: string
 *           enum: [GOALIE, DEFENSE, FORWARD, CENTER, LEFT_WING, RIGHT_WING]
 *         jerseyNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 99
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         height:
 *           type: integer
 *           minimum: 150
 *           maximum: 220
 *         weight:
 *           type: integer
 *           minimum: 60
 *           maximum: 150
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
```

### API Testing with Examples
```typescript
// Example requests in documentation
const examples = {
  createPlayer: {
    request: {
      firstName: "Connor",
      lastName: "McDavid",
      position: "CENTER",
      jerseyNumber: 97,
      dateOfBirth: "1997-01-13",
      height: 185,
      weight: 88
    },
    response: {
      success: true,
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        firstName: "Connor",
        lastName: "McDavid",
        position: "CENTER",
        jerseyNumber: 97,
        dateOfBirth: "1997-01-13",
        height: 185,
        weight: 88,
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      }
    }
  }
};
```

### Rate Limiting Documentation
```typescript
/**
 * Rate Limiting:
 * - General endpoints: 100 requests per 15 minutes
 * - Authentication endpoints: 5 requests per 15 minutes
 * - Search endpoints: 50 requests per 15 minutes
 * 
 * Rate limit headers are included in responses:
 * - X-RateLimit-Limit: Request limit per window
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Time when rate limit resets
 */
```

This comprehensive API development guide ensures consistency, security, and maintainability across all Hockey Hub microservices.