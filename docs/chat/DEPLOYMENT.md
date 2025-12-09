# Hockey Hub Chat System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Hockey Hub chat system to production environments. It covers prerequisites, environment setup, deployment procedures, and post-deployment verification.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Redis Configuration](#redis-configuration)
5. [CDN & File Storage](#cdn--file-storage)
6. [Service Deployment](#service-deployment)
7. [Load Balancing](#load-balancing)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Monitoring Setup](#monitoring-setup)
10. [Scaling Strategies](#scaling-strategies)
11. [Backup & Recovery](#backup--recovery)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Minimum Production Requirements
- **CPU**: 4 cores (8 cores recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (expandable)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 22.04 LTS or RHEL 8+

#### Software Dependencies
- Node.js 18.x or higher
- PostgreSQL 15.x
- Redis 7.x
- Nginx 1.24.x
- Docker 24.x (optional)
- Kubernetes 1.28.x (optional)

### Required Services

1. **Database**: PostgreSQL instance
2. **Cache**: Redis instance
3. **File Storage**: S3-compatible storage
4. **CDN**: CloudFront, Cloudflare, or similar
5. **Email Service**: SMTP server or service (SendGrid, AWS SES)
6. **Monitoring**: Prometheus, Grafana, or cloud monitoring
7. **Logging**: ELK stack or cloud logging service

## Environment Setup

### Production Environment Variables

Create `.env.production` for each service:

#### Communication Service
```bash
# Database
DATABASE_URL=postgresql://chat_user:secure_password@db.example.com:5432/chat_production
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://redis.example.com:6379
REDIS_PASSWORD=secure_redis_password
REDIS_TLS=true

# Service Configuration
NODE_ENV=production
PORT=3002
SERVICE_NAME=communication-service

# Security
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
ENCRYPTION_KEY=your-32-character-encryption-key

# File Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=hockey-hub-chat-files
S3_ENDPOINT=https://s3.amazonaws.com

# CDN
CDN_URL=https://cdn.hockeyhub.com
CDN_UPLOAD_URL=https://upload.cdn.hockeyhub.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MESSAGE_RATE_LIMIT=30

# Features
ENABLE_FILE_UPLOADS=true
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=image/*,application/pdf,video/mp4
ENABLE_VOICE_MESSAGES=true
ENABLE_VIDEO_MESSAGES=true
MESSAGE_RETENTION_DAYS=90

# Monitoring
METRICS_PORT=9090
ENABLE_METRICS=true
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn

# External Services
USER_SERVICE_URL=http://user-service:3001
EMAIL_SERVICE_URL=http://email-service:3010
NOTIFICATION_SERVICE_URL=http://notification-service:3011
```

#### API Gateway
```bash
# Service Configuration
NODE_ENV=production
PORT=3000
SERVICE_NAME=api-gateway

# Security
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
CORS_ORIGINS=https://hockeyhub.com,https://app.hockeyhub.com

# Services
COMMUNICATION_SERVICE_URL=http://communication-service:3002
USER_SERVICE_URL=http://user-service:3001

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://redis.example.com:6379
GLOBAL_RATE_LIMIT=1000

# Monitoring
ENABLE_ACCESS_LOGS=true
ACCESS_LOG_PATH=/var/log/api-gateway/access.log
```

### Directory Structure

```
/opt/hockey-hub/
├── services/
│   ├── api-gateway/
│   ├── communication-service/
│   └── ...
├── config/
│   ├── nginx/
│   ├── ssl/
│   └── env/
├── logs/
├── scripts/
└── backups/
```

## Database Setup

### PostgreSQL Configuration

#### 1. Install PostgreSQL
```bash
# Ubuntu
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# RHEL/CentOS
sudo dnf install postgresql15-server postgresql15-contrib
sudo postgresql-15-setup initdb
```

#### 2. Configure PostgreSQL
Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Connection settings
listen_addresses = '*'
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 20MB
maintenance_work_mem = 1GB

# Write performance
checkpoint_completion_target = 0.9
wal_buffers = 16MB
min_wal_size = 2GB
max_wal_size = 8GB

# Query tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# SSL
ssl = on
ssl_cert_file = '/etc/postgresql/15/main/server.crt'
ssl_key_file = '/etc/postgresql/15/main/server.key'
```

#### 3. Create Database and User
```sql
-- Create database
CREATE DATABASE chat_production;

-- Create user
CREATE USER chat_user WITH ENCRYPTED PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE chat_production TO chat_user;
ALTER DATABASE chat_production OWNER TO chat_user;

-- Performance extensions
\c chat_production
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### 4. Configure Authentication
Edit `/etc/postgresql/15/main/pg_hba.conf`:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
hostssl chat_production chat_user       10.0.0.0/8             scram-sha-256
hostssl chat_production chat_user       172.16.0.0/12          scram-sha-256
```

#### 5. Run Migrations
```bash
cd /opt/hockey-hub/services/communication-service
NODE_ENV=production npm run migrate
```

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_messages_sender 
ON messages(sender_id);

CREATE INDEX CONCURRENTLY idx_participants_user 
ON conversation_participants(user_id) 
WHERE left_at IS NULL;

-- Analyze tables
ANALYZE messages;
ANALYZE conversations;
ANALYZE conversation_participants;
```

## Redis Configuration

### 1. Install Redis
```bash
# Ubuntu
sudo apt install redis-server

# From source for latest version
wget https://download.redis.io/releases/redis-7.2.3.tar.gz
tar xzf redis-7.2.3.tar.gz
cd redis-7.2.3
make
sudo make install
```

### 2. Configure Redis
Edit `/etc/redis/redis.conf`:

```conf
# Network
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
timeout 300
tcp-keepalive 300

# General
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Memory
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no

# Security
requirepass your_redis_password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""

# Clients
maxclients 10000

# Threading
io-threads 4
io-threads-do-reads yes
```

### 3. Configure Redis Sentinel (High Availability)

Create `/etc/redis/sentinel.conf`:

```conf
port 26379
daemonize yes
pidfile /var/run/redis/redis-sentinel.pid
logfile /var/log/redis/redis-sentinel.log
dir /var/lib/redis

sentinel monitor mymaster 127.0.0.1 6379 2
sentinel auth-pass mymaster your_redis_password
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

## CDN & File Storage

### S3 Configuration

#### 1. Create S3 Bucket
```bash
aws s3 mb s3://hockey-hub-chat-files --region us-east-1
```

#### 2. Configure Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hockey-hub-chat-files/public/*"
    },
    {
      "Sid": "ServiceWriteAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/chat-service"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::hockey-hub-chat-files/*"
    }
  ]
}
```

#### 3. Configure CORS
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://hockeyhub.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### CloudFront Configuration

#### 1. Create Distribution
```bash
aws cloudfront create-distribution --distribution-config file://cdn-config.json
```

#### 2. Distribution Configuration
```json
{
  "CallerReference": "hockey-hub-chat-cdn",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-hockey-hub-chat-files",
        "DomainName": "hockey-hub-chat-files.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-hockey-hub-chat-files",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/uploads/*",
        "TargetOriginId": "S3-hockey-hub-chat-files",
        "ViewerProtocolPolicy": "https-only",
        "MinTTL": 0,
        "DefaultTTL": 3600,
        "MaxTTL": 86400
      }
    ]
  }
}
```

## Service Deployment

### Using Docker

#### 1. Build Docker Images
```dockerfile
# Dockerfile for communication-service
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node dist/health-check.js || exit 1

EXPOSE 3002

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

#### 2. Docker Compose (Development/Staging)
```yaml
version: '3.8'

services:
  api-gateway:
    image: hockey-hub/api-gateway:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    volumes:
      - ./config/api-gateway:/app/config
      - ./logs/api-gateway:/app/logs
    depends_on:
      - communication-service
      - redis
    restart: unless-stopped

  communication-service:
    image: hockey-hub/communication-service:latest
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://chat_user:password@postgres:5432/chat_production
      REDIS_URL: redis://redis:6379
    volumes:
      - ./config/communication:/app/config
      - ./logs/communication:/app/logs
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chat_production
      POSTGRES_USER: chat_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass secure_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Using PM2

#### 1. Install PM2
```bash
npm install -g pm2
pm2 install pm2-logrotate
```

#### 2. Create PM2 Ecosystem File
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'communication-service',
      script: './dist/index.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      kill_timeout: 5000,
      listen_timeout: 5000,
      restart_delay: 5000,
      autorestart: true,
      watch: false
    }
  ]
};
```

#### 3. Start Services
```bash
cd /opt/hockey-hub/services/communication-service
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Kubernetes

#### 1. Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: communication-service
  namespace: hockey-hub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: communication-service
  template:
    metadata:
      labels:
        app: communication-service
    spec:
      containers:
      - name: communication-service
        image: hockey-hub/communication-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 2. Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: communication-service
  namespace: hockey-hub
spec:
  selector:
    app: communication-service
  ports:
  - protocol: TCP
    port: 3002
    targetPort: 3002
  type: ClusterIP
```

#### 3. HorizontalPodAutoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: communication-service-hpa
  namespace: hockey-hub
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: communication-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Load Balancing

### Nginx Configuration

#### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### 2. Configure Load Balancer
```nginx
# /etc/nginx/sites-available/hockey-hub-chat
upstream communication_service {
    least_conn;
    server 10.0.1.10:3002 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3002 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3002 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

upstream websocket_service {
    ip_hash;
    server 10.0.1.10:3002;
    server 10.0.1.11:3002;
    server 10.0.1.12:3002;
}

server {
    listen 80;
    server_name chat.hockeyhub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.hockeyhub.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/hockeyhub.com.crt;
    ssl_certificate_key /etc/ssl/private/hockeyhub.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API endpoints
    location /api/ {
        proxy_pass http://communication_service;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }

    # WebSocket endpoints
    location /socket.io/ {
        proxy_pass http://websocket_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        
        # WebSocket specific
        proxy_buffering off;
        proxy_cache off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://communication_service/health;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=websocket_limit:10m rate=5r/s;
```

## SSL/TLS Configuration

### Using Let's Encrypt

#### 1. Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### 2. Obtain Certificate
```bash
sudo certbot --nginx -d chat.hockeyhub.com -d api.hockeyhub.com
```

#### 3. Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
0 2 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Using Custom Certificates

```bash
# Generate private key
openssl genrsa -out hockeyhub.com.key 2048

# Generate CSR
openssl req -new -key hockeyhub.com.key -out hockeyhub.com.csr

# After receiving certificate from CA
sudo cp hockeyhub.com.crt /etc/ssl/certs/
sudo cp hockeyhub.com.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/hockeyhub.com.key
```

## Monitoring Setup

### Prometheus Configuration

#### 1. Install Prometheus
```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvf prometheus-2.45.0.linux-amd64.tar.gz
sudo cp prometheus-2.45.0.linux-amd64/prometheus /usr/local/bin/
```

#### 2. Configure Prometheus
```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'communication-service'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
```

### Application Metrics

```typescript
// metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// Metrics
export const messagesSent = new Counter({
  name: 'chat_messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['type'],
  registers: [register]
});

export const activeConnections = new Gauge({
  name: 'chat_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

export const messageProcessingDuration = new Histogram({
  name: 'chat_message_processing_duration_seconds',
  help: 'Message processing duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboards

Create dashboards for:
1. **System Metrics**: CPU, Memory, Disk, Network
2. **Application Metrics**: Messages/sec, Active users, Response times
3. **Database Metrics**: Connections, Query performance, Cache hit rate
4. **Redis Metrics**: Memory usage, Hit rate, Command statistics

### Alerting Rules

```yaml
# /etc/prometheus/alerts.yml
groups:
  - name: chat_alerts
    interval: 30s
    rules:
      - alert: HighMessageLatency
        expr: histogram_quantile(0.95, chat_message_processing_duration_seconds) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High message processing latency"
          description: "95th percentile message processing time is above 2 seconds"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5%"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Database is using more than 80% of available connections"
```

## Scaling Strategies

### Horizontal Scaling

#### 1. Service Scaling
```bash
# Using PM2
pm2 scale communication-service 8

# Using Kubernetes
kubectl scale deployment communication-service --replicas=8

# Using Docker Swarm
docker service scale communication-service=8
```

#### 2. Database Read Replicas
```sql
-- On master
CREATE PUBLICATION chat_publication FOR ALL TABLES;

-- On replica
CREATE SUBSCRIPTION chat_subscription
CONNECTION 'host=master.db.example.com dbname=chat_production user=replicator'
PUBLICATION chat_publication;
```

#### 3. Redis Cluster
```bash
# Create cluster
redis-cli --cluster create \
  10.0.1.10:6379 10.0.1.11:6379 10.0.1.12:6379 \
  10.0.1.13:6379 10.0.1.14:6379 10.0.1.15:6379 \
  --cluster-replicas 1
```

### Vertical Scaling

#### Database Optimization
```sql
-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '8GB';

-- Increase work memory
ALTER SYSTEM SET work_mem = '50MB';

-- Reload configuration
SELECT pg_reload_conf();
```

### Auto-Scaling Configuration

#### AWS Auto Scaling
```json
{
  "AutoScalingGroupName": "communication-service-asg",
  "MinSize": 3,
  "MaxSize": 20,
  "DesiredCapacity": 5,
  "TargetGroupARNs": ["arn:aws:elasticloadbalancing:..."],
  "HealthCheckType": "ELB",
  "HealthCheckGracePeriod": 300,
  "Tags": [
    {
      "Key": "Name",
      "Value": "communication-service",
      "PropagateAtLaunch": true
    }
  ]
}
```

## Backup & Recovery

### Database Backup Strategy

#### 1. Continuous Archiving
```bash
# postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://hockey-hub-backups/wal/%f'
```

#### 2. Daily Backups
```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"
S3_BUCKET="hockey-hub-backups"

# Perform backup
pg_dump -h localhost -U chat_user -d chat_production -Fc > "$BACKUP_DIR/chat_$DATE.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/chat_$DATE.dump" "s3://$S3_BUCKET/postgres/chat_$DATE.dump"

# Cleanup old local backups
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete
```

#### 3. Point-in-Time Recovery
```bash
# Restore from backup
pg_restore -h localhost -U chat_user -d chat_production_restore /backup/chat_20250115.dump

# Replay WAL logs to specific time
recovery_target_time = '2025-01-15 14:30:00'
```

### Redis Backup

```bash
#!/bin/bash
# /opt/scripts/backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"

# Trigger backup
redis-cli BGSAVE

# Wait for completion
while [ $(redis-cli LASTSAVE) -eq $(redis-cli LASTSAVE) ]; do
  sleep 1
done

# Copy backup
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Upload to S3
aws s3 cp "$BACKUP_DIR/redis_$DATE.rdb" "s3://hockey-hub-backups/redis/redis_$DATE.rdb"
```

### File Storage Backup

```bash
# Sync S3 buckets
aws s3 sync s3://hockey-hub-chat-files s3://hockey-hub-chat-files-backup --delete

# Cross-region replication
aws s3api put-bucket-replication \
  --bucket hockey-hub-chat-files \
  --replication-configuration file://replication.json
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 1 hour
2. **RPO (Recovery Point Objective)**: 15 minutes

#### Recovery Procedures
```bash
# 1. Restore database
pg_restore -h new-server -U chat_user -d chat_production /backup/latest.dump

# 2. Restore Redis
redis-cli --rdb /backup/redis_latest.rdb

# 3. Update DNS
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch file://dns-failover.json

# 4. Scale services
kubectl scale deployment communication-service --replicas=10

# 5. Verify health
curl https://chat.hockeyhub.com/health
```

## Troubleshooting

### Common Deployment Issues

#### 1. Service Won't Start
```bash
# Check logs
journalctl -u communication-service -n 100

# Check port availability
sudo lsof -i :3002

# Verify environment variables
printenv | grep -E "(DATABASE|REDIS|NODE_ENV)"

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

#### 2. WebSocket Connection Failures
```bash
# Test WebSocket upgrade
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  https://chat.hockeyhub.com/socket.io/

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Verify sticky sessions
redis-cli KEYS "socket:*"
```

#### 3. High Memory Usage
```bash
# Check Node.js heap
node --inspect=0.0.0.0:9229 dist/index.js
chrome://inspect

# Analyze heap dump
npm install -g heapdump
kill -USR2 <pid>

# Check for memory leaks
pm2 monit
```

#### 4. Database Performance Issues
```sql
-- Check slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Vacuum and analyze
VACUUM ANALYZE messages;
```

### Performance Tuning Checklist

1. **Application Level**
   - [ ] Enable production mode (NODE_ENV=production)
   - [ ] Disable debug logging
   - [ ] Enable gzip compression
   - [ ] Implement connection pooling
   - [ ] Use PM2 cluster mode

2. **Database Level**
   - [ ] Create appropriate indexes
   - [ ] Configure connection pooling
   - [ ] Tune PostgreSQL parameters
   - [ ] Enable query result caching
   - [ ] Set up read replicas

3. **Redis Level**
   - [ ] Configure maxmemory policy
   - [ ] Enable persistence appropriately
   - [ ] Use pipelining for bulk operations
   - [ ] Monitor memory fragmentation

4. **Infrastructure Level**
   - [ ] Use SSD storage
   - [ ] Configure adequate swap
   - [ ] Tune kernel parameters
   - [ ] Enable TCP keepalive
   - [ ] Configure firewall rules

### Health Check Endpoints

Implement comprehensive health checks:

```typescript
// /health - Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// /health/detailed - Detailed health check
app.get('/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    diskSpace: await checkDiskSpace(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };

  const healthy = Object.values(checks).every(check => check.healthy);
  res.status(healthy ? 200 : 503).json(checks);
});
```

## Post-Deployment Verification

### Deployment Checklist

1. **Service Health**
   - [ ] All services responding to health checks
   - [ ] WebSocket connections working
   - [ ] Database connections established
   - [ ] Redis connections active

2. **Functionality Tests**
   - [ ] User can log in
   - [ ] Messages can be sent and received
   - [ ] File uploads working
   - [ ] Real-time updates functioning
   - [ ] Search functionality operational

3. **Performance Verification**
   - [ ] Response times within SLA
   - [ ] No memory leaks detected
   - [ ] CPU usage acceptable
   - [ ] Database queries optimized

4. **Security Verification**
   - [ ] SSL certificates valid
   - [ ] Firewall rules configured
   - [ ] Authentication working
   - [ ] Rate limiting active

5. **Monitoring Verification**
   - [ ] Metrics being collected
   - [ ] Alerts configured
   - [ ] Logs aggregating properly
   - [ ] Dashboards displaying data

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

echo "Running smoke tests..."

# Test API endpoint
curl -f https://chat.hockeyhub.com/health || exit 1

# Test WebSocket connection
wscat -c wss://chat.hockeyhub.com/socket.io/ || exit 1

# Test database query
psql $DATABASE_URL -c "SELECT COUNT(*) FROM messages" || exit 1

# Test Redis
redis-cli ping || exit 1

echo "All smoke tests passed!"
```

## Maintenance Windows

### Planning Maintenance

1. **Schedule during low-traffic periods**
2. **Notify users in advance**
3. **Prepare rollback plan**
4. **Test in staging environment**

### Maintenance Mode

```nginx
# Enable maintenance mode
location / {
    if (-f /var/www/maintenance.html) {
        return 503;
    }
    proxy_pass http://upstream;
}

error_page 503 /maintenance.html;
location = /maintenance.html {
    root /var/www;
}
```

### Zero-Downtime Deployments

```bash
#!/bin/bash
# rolling-update.sh

# Update one instance at a time
for instance in $(pm2 list | grep communication-service | awk '{print $4}'); do
    echo "Updating instance $instance"
    pm2 reload communication-service --update-env
    sleep 30
    
    # Verify instance is healthy
    curl -f http://localhost:3002/health || exit 1
done

echo "Rolling update complete!"
```

## Security Hardening

### System Security

```bash
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Secure SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Install fail2ban
apt install fail2ban
```

### Application Security

1. **Use secure headers**
2. **Implement CSRF protection**
3. **Enable rate limiting**
4. **Use parameterized queries**
5. **Encrypt sensitive data**
6. **Regular security updates**

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Hockey Hub chat system to production. Regular monitoring, maintenance, and updates are essential for maintaining a healthy production environment. Always test changes in a staging environment before applying to production.