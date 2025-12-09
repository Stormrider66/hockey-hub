# Hockey Hub - Deployment Guide

## Overview
Hockey Hub is a comprehensive hockey management platform built with a microservices architecture. This guide covers production deployment using Docker, Kubernetes, and monitoring setup.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Environment Setup](#environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Database Setup](#database-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Environment Variables](#environment-variables)
9. [Health Checks and Monitoring](#health-checks-and-monitoring)
10. [Deployment Scripts](#deployment-scripts)
11. [Zero-Downtime Deployment](#zero-downtime-deployment)
12. [Backup and Restore](#backup-and-restore)
13. [Scaling](#scaling)
14. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker Engine 20.10+ and Docker Compose V2
- Node.js 18+ (for building)
- Git
- PostgreSQL 15+ (for standalone deployment)
- Redis 7+ (for caching)
- Nginx or similar reverse proxy
- SSL certificates (Let's Encrypt recommended)

### For Kubernetes Deployment
- Kubernetes 1.25+
- kubectl configured
- Helm 3+ (optional but recommended)
- Ingress Controller (nginx-ingress or similar)

### Hardware Requirements
See [System Requirements](#system-requirements) section.

## System Requirements

### Minimum Production Requirements
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 50GB SSD (100GB+ recommended)
- **Network**: 100Mbps+ bandwidth

### Service-Specific Requirements
```
Frontend:          1GB RAM, 1 CPU
API Gateway:       2GB RAM, 2 CPU
User Service:      1GB RAM, 1 CPU
Communication:     2GB RAM, 2 CPU (high Socket.io usage)
Calendar Service:  1GB RAM, 1 CPU
Training Service:  1GB RAM, 1 CPU
Medical Service:   1GB RAM, 1 CPU
Planning Service:  1GB RAM, 1 CPU
Statistics Service: 1GB RAM, 1 CPU
Payment Service:   1GB RAM, 1 CPU
Admin Service:     1GB RAM, 1 CPU
PostgreSQL:        4GB RAM, 2 CPU
Redis:             2GB RAM, 1 CPU
```

### Recommended Production Configuration
- **Load Balancer**: 2+ instances
- **Frontend**: 2+ instances
- **API Gateway**: 2+ instances
- **Backend Services**: 1-2 instances each
- **Database**: Master/Replica setup
- **Redis**: Cluster or Sentinel setup

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/hockey-hub.git
cd hockey-hub
```

### 2. Create Environment Files
```bash
# Create production environment file
cp .env.example .env.production

# Edit production environment
nano .env.production
```

### 3. Generate Secrets
```bash
# Generate JWT keys
mkdir -p secrets
openssl genrsa -out secrets/jwt_private.pem 2048
openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem

# Generate strong passwords
openssl rand -base64 32 > secrets/db_password
openssl rand -base64 32 > secrets/redis_password
openssl rand -base64 32 > secrets/encryption_key
```

## Docker Deployment

### Quick Start
```bash
# Start production deployment
./scripts/deploy.sh

# Or manually
docker-compose -f docker-compose.production.yml up -d
```

### Build and Deploy
```bash
# Build all services
npm run build

# Build Docker images
docker-compose -f docker-compose.production.yml build

# Deploy with rolling updates
docker-compose -f docker-compose.production.yml up -d --no-deps --build
```

### Service Configuration
The production Docker Compose includes:
- Frontend (Next.js)
- API Gateway with load balancing
- 9 Backend microservices
- PostgreSQL databases (one per service)
- Redis cluster
- Nginx reverse proxy
- Monitoring (Prometheus, Grafana)

### Health Checks
All services include health checks:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

## Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Deploy with Helm
```bash
# Create namespace
kubectl create namespace hockey-hub

# Deploy with Helm
helm install hockey-hub ./k8s/helm/hockey-hub \
  --namespace hockey-hub \
  --values ./k8s/helm/hockey-hub/values.production.yaml
```

### Manual Kubernetes Deployment
```bash
# Apply all manifests
kubectl apply -f k8s/manifests/

# Check deployment status
kubectl get pods -n hockey-hub
kubectl get services -n hockey-hub
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hockey-hub-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - hockeyhub.com
    secretName: hockey-hub-tls
  rules:
  - host: hockeyhub.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3002
```

## Database Setup

### PostgreSQL Configuration
Each service has its own database for isolation:
```
hockey_hub_users        (User Service)
hockey_hub_communication (Communication Service)
hockey_hub_calendar     (Calendar Service)
hockey_hub_training     (Training Service)
hockey_hub_medical      (Medical Service)
hockey_hub_planning     (Planning Service)
hockey_hub_statistics   (Statistics Service)
hockey_hub_payment      (Payment Service)
hockey_hub_admin        (Admin Service)
```

### Run Migrations
```bash
# Run all migrations
./scripts/run-all-migrations.sh

# Or run individually
cd services/user-service && npm run migrate
cd services/communication-service && npm run migrate
# ... repeat for all services
```

### Database Initialization
```bash
# Create databases
./scripts/setup-databases.sh

# Seed initial data
./scripts/seed-databases.sh
```

### Connection Pooling
Configure connection pooling for production:
```env
DATABASE_MAX_CONNECTIONS=20
DATABASE_ACQUIRE_TIMEOUT=60000
DATABASE_IDLE_TIMEOUT=300000
```

## SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d hockeyhub.com -d www.hockeyhub.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name hockeyhub.com www.hockeyhub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hockeyhub.com www.hockeyhub.com;

    ssl_certificate /etc/letsencrypt/live/hockeyhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hockeyhub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://frontend:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Gateway
    location /api/ {
        proxy_pass http://api-gateway:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://api-gateway:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables

### Production Environment Template
```env
# Core Configuration
NODE_ENV=production
APP_NAME=Hockey Hub
APP_VERSION=1.0.0

# Database Configuration
DB_PASSWORD=<strong-password>
POSTGRES_USER=hockey_hub_user
POSTGRES_DB=hockey_hub

# JWT Configuration
JWT_SECRET=<rsa-private-key>
JWT_PUBLIC_KEY=<rsa-public-key>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=<redis-password>

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
EMAIL_FROM=noreply@hockeyhub.com

# External Services
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=hockey-hub-uploads

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEW_RELIC_LICENSE_KEY=<newrelic-key>

# Security
ENCRYPTION_KEY=<encryption-key>
CORS_ORIGIN=https://hockeyhub.com
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000
```

### Service-Specific Variables
Each service may have additional environment variables. Check individual service documentation.

## Health Checks and Monitoring

### Health Check Endpoints
All services expose health check endpoints:
```
GET /health          - Basic health check
GET /health/ready    - Readiness check
GET /health/live     - Liveness check
GET /health/metrics  - Prometheus metrics
```

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **AlertManager**: Alert routing
- **Loki**: Log aggregation (optional)

### Custom Metrics
Services expose custom metrics:
```
# API Gateway
http_requests_total
http_request_duration_seconds
websocket_connections_total

# Database Services
database_queries_total
database_query_duration_seconds
database_connection_pool_size

# Cache Services
cache_hits_total
cache_misses_total
cache_memory_usage_bytes
```

### Alerting Rules
```yaml
# Alert for high error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate detected"

# Alert for database connection issues
- alert: DatabaseConnectionHigh
  expr: database_connection_pool_size > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Database connection pool usage high"
```

## Deployment Scripts

### Available Scripts
- `deploy.sh` - Full deployment process
- `rollback.sh` - Rollback to previous version
- `health-check.sh` - Verify deployment health
- `backup.sh` - Create system backup
- `restore.sh` - Restore from backup

### Usage Examples
```bash
# Deploy new version
./scripts/deploy.sh v1.2.0

# Rollback to previous version
./scripts/rollback.sh

# Check system health
./scripts/health-check.sh

# Create backup
./scripts/backup.sh
```

## Zero-Downtime Deployment

### Rolling Updates
```bash
# Update services one by one
docker-compose -f docker-compose.production.yml up -d --no-deps --scale frontend=2 frontend
docker-compose -f docker-compose.production.yml up -d --no-deps --scale api-gateway=2 api-gateway
```

### Blue-Green Deployment
```bash
# Deploy to green environment
DEPLOY_ENV=green ./scripts/deploy.sh

# Switch traffic
./scripts/switch-traffic.sh green

# Cleanup blue environment
./scripts/cleanup-blue.sh
```

### Canary Deployment
```bash
# Deploy canary version (10% traffic)
./scripts/deploy-canary.sh v1.2.0 10

# Increase traffic gradually
./scripts/increase-canary.sh 25
./scripts/increase-canary.sh 50
./scripts/increase-canary.sh 100

# Promote canary to production
./scripts/promote-canary.sh
```

## Backup and Restore

### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup each database
for db in users communication calendar training medical planning statistics payment admin; do
    pg_dump -h postgres-$db -U postgres hockey_hub_$db > $BACKUP_DIR/$db.sql
done

# Backup Redis
redis-cli --rdb $BACKUP_DIR/redis.rdb
```

### File System Backup
```bash
# Backup uploaded files
rsync -av /app/uploads/ /backups/uploads/

# Backup configurations
tar -czf /backups/configs.tar.gz \
    docker-compose.production.yml \
    .env.production \
    nginx.conf \
    monitoring/
```

### Restore Process
```bash
# Restore databases
for db in users communication calendar training medical planning statistics payment admin; do
    psql -h postgres-$db -U postgres hockey_hub_$db < /backups/20240101/$db.sql
done

# Restore Redis
redis-cli --rdb /backups/20240101/redis.rdb

# Restore files
rsync -av /backups/uploads/ /app/uploads/
```

## Scaling

### Horizontal Scaling
```bash
# Scale frontend
docker-compose -f docker-compose.production.yml up -d --scale frontend=3

# Scale API Gateway
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=2

# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale user-service=2
```

### Auto-scaling with Kubernetes
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling
```bash
# Read replicas
docker-compose -f docker-compose.production.yml up -d postgres-replica

# Connection pooling
docker-compose -f docker-compose.production.yml up -d pgbouncer
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs -f service-name

# Check resource usage
docker stats

# Check health
curl http://localhost:3000/health
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres-users psql -U postgres -c "SELECT 1"

# Check connection pool
docker-compose logs postgres-users | grep "connection"

# Reset connections
docker-compose restart postgres-users
```

#### High Memory Usage
```bash
# Check memory usage
docker stats --no-stream

# Restart services with memory limits
docker-compose -f docker-compose.production.yml up -d --no-deps service-name
```

### Performance Issues

#### Slow API Responses
```bash
# Check API Gateway logs
docker-compose logs -f api-gateway

# Check Redis cache
docker-compose exec redis redis-cli info

# Check database performance
docker-compose exec postgres-users pg_stat_activity
```

#### WebSocket Issues
```bash
# Check Socket.io connections
curl http://localhost:3000/socket.io/

# Check connection logs
docker-compose logs -f communication-service | grep "socket"
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug docker-compose up

# Enable SQL logging
DATABASE_LOGGING=true docker-compose up
```

### Support

For additional support:
1. Check the [troubleshooting guide](TROUBLESHOOTING.md)
2. Review service-specific documentation
3. Check monitoring dashboards
4. Contact the development team

---

## Security Considerations

### Production Security Checklist
- [ ] SSL/TLS certificates configured
- [ ] Strong passwords for all services
- [ ] JWT keys properly generated
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Monitoring and alerting active
- [ ] Backup and recovery tested

### Regular Maintenance
- Update dependencies monthly
- Review logs weekly
- Test backups monthly
- Security audit quarterly
- Performance review quarterly

---

**Last Updated**: January 2025
**Version**: 1.0.0