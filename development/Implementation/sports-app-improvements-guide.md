

# Sports App Architecture Improvements - Implementation Guide

## Overview
This guide provides step-by-step implementation instructions for adding logging/monitoring, API documentation, and caching infrastructure to the sports/training application.

## Phase 1: Observability & Monitoring

### 1.1 OpenTelemetry Setup

#### Step 1: Install Dependencies
```bash
# Core packages
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-prometheus @opentelemetry/exporter-jaeger
npm install @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express
```

#### Step 2: Create Telemetry Configuration
Create `services/shared/telemetry/tracing.ts`:
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initializeTelemetry(serviceName: string) {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
    }),
    // Add instrumentations
    instrumentations: [/* auto-instrumentations */]
  });
  
  sdk.start();
}
```

#### Step 3: Add to Each Service
Update each service's main file:
```typescript
import { initializeTelemetry } from './shared/telemetry/tracing';
initializeTelemetry('auth-service');
```

### 1.2 Prometheus + Grafana Setup

#### Step 1: Docker Compose Configuration
Add to `docker-compose.yml`:
```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  volumes:
    - grafana_data:/var/lib/grafana
    - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
  ports:
    - "3001:3000"
```

#### Step 2: Prometheus Configuration
Create `monitoring/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:9464']
  
  - job_name: 'game-service'
    static_configs:
      - targets: ['game-service:9464']
  
  - job_name: 'training-service'
    static_configs:
      - targets: ['training-service:9464']
```

#### Step 3: Custom Metrics
Create `services/shared/metrics/index.ts`:
```typescript
import { Counter, Histogram, register } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

export const gameEventCounter = new Counter({
  name: 'game_events_total',
  help: 'Total number of game events',
  labelNames: ['event_type', 'sport']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(gameEventCounter);
```

### 1.3 Logging Infrastructure (Simplified)

#### Step 1: Use Winston + Loki (Lighter than ELK)
```bash
npm install winston winston-loki
```

#### Step 2: Centralized Logger
Create `services/shared/logger/index.ts`:
```typescript
import winston from 'winston';
import LokiTransport from 'winston-loki';

export function createLogger(serviceName: string) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console(),
      new LokiTransport({
        host: process.env.LOKI_HOST || 'http://loki:3100',
        labels: { service: serviceName },
        json: true,
        batching: true,
        interval: 5
      })
    ]
  });
}
```

### 1.4 Health Checks

Create `services/shared/health/index.ts`:
```typescript
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      lastCheck?: Date;
    }
  };
}

export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();
  
  register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check);
  }
  
  async checkHealth(): Promise<HealthCheckResult> {
    // Implementation
  }
}
```

## Phase 2: API Documentation

### 2.1 OpenAPI Setup

#### Step 1: Install Dependencies
```bash
npm install @nestjs/swagger swagger-ui-express
npm install @types/swagger-ui-express --save-dev
```

#### Step 2: Swagger Configuration
Create `services/shared/swagger/config.ts`:
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: any, serviceName: string, version: string) {
  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API`)
    .setDescription(`API documentation for ${serviceName}`)
    .setVersion(version)
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('teams', 'Team management')
    .addTag('games', 'Game operations')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}
```

### 2.2 API Versioning Strategy

#### Step 1: Version Middleware
Create `services/shared/versioning/index.ts`:
```typescript
export class APIVersioning {
  static middleware(defaultVersion = 'v1') {
    return (req: any, res: any, next: any) => {
      const version = req.headers['api-version'] || 
                     req.path.match(/\/api\/(v\d+)\//)?.[1] || 
                     defaultVersion;
      req.apiVersion = version;
      next();
    };
  }
}
```

### 2.3 AsyncAPI for NATS Events

Create `docs/asyncapi.yml`:
```yaml
asyncapi: '2.6.0'
info:
  title: Sports App Event API
  version: '1.0.0'
  description: NATS event documentation

servers:
  production:
    url: nats://nats:4222
    protocol: nats

channels:
  player.created:
    publish:
      message:
        $ref: '#/components/messages/PlayerCreated'
  
  game.started:
    publish:
      message:
        $ref: '#/components/messages/GameStarted'

components:
  messages:
    PlayerCreated:
      payload:
        type: object
        properties:
          playerId: 
            type: string
          teamId:
            type: string
          timestamp:
            type: string
            format: date-time
```

### 2.4 API Portal Setup

Create `services/api-portal/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Sports App API Portal</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        urls: [
          {name: "Auth Service", url: "/api/v1/auth/swagger.json"},
          {name: "Game Service", url: "/api/v1/game/swagger.json"},
          {name: "Training Service", url: "/api/v1/training/swagger.json"}
        ],
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
```

## Phase 3: Caching Strategy

### 3.1 Redis Setup

#### Step 1: Add Redis to Docker Compose
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
  ports:
    - "6379:6379"
```

#### Step 2: Redis Client Configuration
Create `services/shared/cache/redis.ts`:
```typescript
import { createClient } from 'redis';

export class RedisCache {
  private client: ReturnType<typeof createClient>;
  
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379'
    });
    
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.connect();
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const options = ttl ? { EX: ttl } : undefined;
    await this.client.set(key, JSON.stringify(value), options);
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}
```

### 3.2 Caching Decorators

Create `services/shared/cache/decorators.ts`:
```typescript
export function Cacheable(keyPrefix: string, ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = this.cache; // Assumes cache is injected
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      
      const cached = await cache.get(key);
      if (cached) return cached;
      
      const result = await originalMethod.apply(this, args);
      await cache.set(key, result, ttl);
      
      return result;
    };
  };
}
```

### 3.3 NATS-Based Cache Invalidation

Create `services/shared/cache/invalidation.ts`:
```typescript
export class CacheInvalidator {
  constructor(
    private nats: any,
    private cache: RedisCache
  ) {
    this.setupListeners();
  }
  
  private setupListeners() {
    // Player updates
    this.nats.subscribe('player.updated', async (msg: any) => {
      const { playerId, teamId } = JSON.parse(msg.data);
      await this.cache.invalidate(`player:${playerId}:*`);
      await this.cache.invalidate(`team:${teamId}:roster`);
    });
    
    // Game events
    this.nats.subscribe('game.ended', async (msg: any) => {
      const { gameId } = JSON.parse(msg.data);
      await this.cache.invalidate(`game:${gameId}:*`);
      await this.cache.invalidate(`stats:game:${gameId}:*`);
    });
  }
}
```

### 3.4 API Gateway Caching

Update API Gateway configuration:
```typescript
// In API Gateway
app.use((req, res, next) => {
  // Cache GET requests
  if (req.method === 'GET') {
    const cacheKey = `api:${req.originalUrl}`;
    
    cache.get(cacheKey).then(cached => {
      if (cached) {
        res.set('X-Cache-Hit', 'true');
        return res.json(cached);
      }
      
      // Store original send
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        
        // Cache successful responses
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, 60); // 1 minute TTL
        }
        
        return res.send(data);
      };
      
      next();
    });
  } else {
    next();
  }
});
```

## Phase 4: Performance Optimizations

### 4.1 Database Query Optimization

Create `services/shared/database/optimizations.ts`:
```typescript
// Materialized view for team statistics
export const createTeamStatsView = `
CREATE MATERIALIZED VIEW team_stats_mv AS
SELECT 
  t.id as team_id,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT g.id) as total_games,
  AVG(gs.score) as avg_score
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
LEFT JOIN games g ON g.home_team_id = t.id OR g.away_team_id = t.id
LEFT JOIN game_stats gs ON gs.team_id = t.id
GROUP BY t.id;

CREATE INDEX idx_team_stats_team_id ON team_stats_mv(team_id);
`;

// Refresh strategy
export const refreshTeamStats = `
REFRESH MATERIALIZED VIEW CONCURRENTLY team_stats_mv;
`;
```

### 4.2 Pre-warming Caches

Create `services/shared/cache/warmer.ts`:
```typescript
export class CacheWarmer {
  constructor(
    private cache: RedisCache,
    private db: any
  ) {}
  
  async warmGameCaches(gameId: string) {
    // Pre-load game data
    const game = await this.db.game.findUnique({ where: { id: gameId }});
    await this.cache.set(`game:${gameId}`, game, 3600);
    
    // Pre-load team rosters
    const [homeRoster, awayRoster] = await Promise.all([
      this.db.player.findMany({ where: { teamId: game.homeTeamId }}),
      this.db.player.findMany({ where: { teamId: game.awayTeamId }})
    ]);
    
    await Promise.all([
      this.cache.set(`team:${game.homeTeamId}:roster`, homeRoster, 3600),
      this.cache.set(`team:${game.awayTeamId}:roster`, awayRoster, 3600)
    ]);
  }
}
```

## Implementation Priority

1. **Week 1-2**: Basic monitoring (Prometheus + Grafana)
2. **Week 3**: Logging infrastructure (Winston + Loki)
3. **Week 4**: API documentation (OpenAPI)
4. **Week 5-6**: Redis caching implementation
5. **Week 7**: Performance optimizations
6. **Week 8**: Testing and refinement

## Testing Strategy

### Unit Tests for Caching
```typescript
describe('RedisCache', () => {
  it('should cache and retrieve values', async () => {
    const cache = new RedisCache();
    await cache.set('test:key', { value: 'test' }, 60);
    const result = await cache.get('test:key');
    expect(result).toEqual({ value: 'test' });
  });
});
```

### Integration Tests for Health Checks
```typescript
describe('Health Endpoint', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
```

## Security Considerations

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

### API Key Management
```typescript
export class APIKeyMiddleware {
  static validate(req: any, res: any, next: any) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || !isValidAPIKey(apiKey)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
  }
}
```

## Monitoring Alerts

Create `monitoring/alerts/rules.yml`:
```yaml
groups:
  - name: performance
    rules:
      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        annotations:
          summary: "High response time on {{ $labels.service }}"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate on {{ $labels.service }}"
```

## Next Steps

1. Set up CI/CD pipeline for automated deployment
2. Implement feature flags for gradual rollout
3. Add A/B testing infrastructure
4. Consider GraphQL federation for unified API
5. Implement event sourcing for audit trails