# Hockey Hub - Deployment Quick Start Guide

## 🚀 Quick Production Deployment

### Prerequisites
- Docker & Docker Compose installed
- 16GB+ RAM, 4+ CPU cores, 100GB+ SSD storage
- Domain name with DNS configured
- SSL certificates (Let's Encrypt recommended)

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/hockey-hub.git
cd hockey-hub
```

### 2. Configure Environment
```bash
# Copy and edit production environment
cp .env.production.template .env.production
nano .env.production

# Generate secrets
./scripts/generate-secrets.sh
```

### 3. Deploy with Single Command
```bash
# Full production deployment
./scripts/deploy.sh

# Check deployment status
./scripts/health-check.sh
```

### 4. Access Application
- **Frontend**: https://hockeyhub.com
- **API**: https://api.hockeyhub.com
- **Monitoring**: https://monitoring.hockeyhub.com/grafana

## 📋 Environment Configuration Checklist

### Required Secrets (⚠️ Must Change)
- [ ] `DB_PASSWORD` - PostgreSQL password
- [ ] `JWT_SECRET` - RSA private key for JWT
- [ ] `JWT_PUBLIC_KEY` - RSA public key for JWT
- [ ] `REDIS_PASSWORD` - Redis authentication
- [ ] `ENCRYPTION_KEY` - Data encryption key

### Email Configuration
- [ ] `SMTP_HOST` - Email server host
- [ ] `SMTP_PASS` - Email server password
- [ ] `EMAIL_FROM` - Sender email address

### File Storage (AWS S3)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_S3_BUCKET` - S3 bucket name

### External Services (Optional)
- [ ] `STRIPE_SECRET_KEY` - Payment processing
- [ ] `TWILIO_AUTH_TOKEN` - SMS notifications
- [ ] `SENTRY_DSN` - Error tracking

## 🔧 Deployment Commands

### Core Operations
```bash
# Deploy new version
./scripts/deploy.sh v1.2.0

# Rollback to previous version
./scripts/rollback.sh

# Health check
./scripts/health-check.sh --detailed

# Create backup
./scripts/backup.sh full
```

### Service Management
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale frontend=3

# Stop all services
docker-compose -f docker-compose.production.yml down
```

## 🔍 Monitoring & Health Checks

### Endpoints
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`
- **Status Page**: `GET /status`

### Monitoring Stack
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **AlertManager**: http://localhost:9093

### Key Metrics to Monitor
- Response time < 500ms
- Error rate < 1%
- CPU usage < 70%
- Memory usage < 80%
- Disk usage < 80%

## 🛡️ Security Best Practices

### SSL/TLS
```bash
# Generate Let's Encrypt certificate
sudo certbot --nginx -d hockeyhub.com -d www.hockeyhub.com

# Auto-renewal cron job
0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Regular Security Tasks
- [ ] Rotate JWT keys monthly
- [ ] Update system packages weekly
- [ ] Review access logs daily
- [ ] Security audit quarterly

## 💾 Backup & Recovery

### Automated Backups
```bash
# Setup daily backups (2 AM)
echo "0 2 * * * /path/to/hockey-hub/scripts/backup.sh full" | crontab -

# Test backup restore
./scripts/restore.sh 20240101_120000
```

### Backup Verification
```bash
# Check backup integrity
cd /backups/20240101_120000
sha256sum -c MANIFEST.sha256
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_messages_created_at ON messages(created_at);
```

### Redis Configuration
```conf
# Optimize Redis for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Nginx Tuning
```nginx
# Optimize worker processes
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

## 🔄 Zero-Downtime Deployment

### Blue-Green Deployment
```bash
# Deploy to staging environment
DEPLOY_ENV=staging ./scripts/deploy.sh v1.2.0

# Switch traffic to new version
./scripts/switch-traffic.sh staging

# Cleanup old environment
./scripts/cleanup-old.sh
```

### Rolling Updates
```bash
# Update services one by one
docker-compose -f docker-compose.production.yml up -d --no-deps frontend
docker-compose -f docker-compose.production.yml up -d --no-deps api-gateway
```

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker-compose logs -f service-name

# Check resources
docker stats

# Restart service
docker-compose restart service-name
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres-users pg_isready

# Reset connections
docker-compose restart postgres-users
```

#### High Memory Usage
```bash
# Check memory usage
free -h
docker stats --no-stream

# Restart memory-intensive services
docker-compose restart communication-service
```

### Performance Issues
```bash
# Check API response times
curl -w "%{time_total}" -o /dev/null -s http://localhost:3000/health

# Check database performance
docker-compose exec postgres-users psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker-compose exec redis redis-cli info stats
```

## 📞 Support & Maintenance

### Daily Tasks
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Update system packages
- [ ] Review security logs
- [ ] Performance optimization review
- [ ] Backup verification test

### Monthly Tasks
- [ ] Security audit
- [ ] Dependency updates
- [ ] Performance benchmarking
- [ ] Disaster recovery test

### Emergency Contacts
- **DevOps Team**: devops@hockeyhub.com
- **Security Team**: security@hockeyhub.com
- **On-Call**: +1-555-HOCKEY-1

---

## 📚 Additional Resources

- [Complete Deployment Guide](DEPLOYMENT.md)
- [Kubernetes Deployment](k8s/README.md)
- [Monitoring Setup](monitoring/README.md)
- [Security Guidelines](SECURITY.md)
- [Backup Procedures](BACKUP.md)

---

**Quick Links:**
- 🏠 [Home](../README.md)
- 🚀 [Quick Start](QUICK-START.md)
- 🔧 [Development](DEVELOPMENT.md)
- 📖 [API Documentation](API.md)

**Last Updated**: January 2025 | **Version**: 1.0.0