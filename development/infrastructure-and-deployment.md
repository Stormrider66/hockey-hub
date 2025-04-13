# Hockey Hub - Infrastructure and Deployment Strategy

## Table of Contents

1. [Overview](#overview)
2. [Deployment Environments](#deployment-environments)
3. [Infrastructure Architecture](#infrastructure-architecture)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Configuration Management](#environment-configuration-management)
6. [Database Deployment Strategy](#database-deployment-strategy)
7. [Service Deployment](#service-deployment)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
10. [Scaling Strategy](#scaling-strategy)
11. [Security Considerations](#security-considerations)
12. [Implementation Roadmap](#implementation-roadmap)

## Overview

This document outlines the infrastructure and deployment strategy for the Hockey Hub platform. It defines how the system will be deployed, managed, and monitored across different environments. The strategy ensures reliability, scalability, and security while maintaining operational efficiency.

The Hockey Hub platform follows a microservice architecture with multiple independent services that need to be deployed, configured, and monitored consistently. This document provides the blueprint for operationalizing the entire system.

## Deployment Environments

The Hockey Hub platform utilizes four distinct environments to support the full software development lifecycle:

### Local Development Environment

- **Purpose**: Individual developer workstations for feature development and testing
- **Infrastructure**: Docker Compose for containerized local development
- **Configuration**:
  - Hot reloading for both frontend and backend services
  - Local PostgreSQL database instance
  - Environment variables via `.env` files
  - Service discovery through Docker Compose DNS
  - Mock data for development

### Testing Environment

- **Purpose**: Automated testing, integration testing, and quality assurance
- **Infrastructure**: Ephemeral cloud-based Kubernetes environment
- **Configuration**:
  - Test database with seed data
  - Isolated from production data
  - CI/CD integration for automated testing
  - Minimal resource allocation

### Staging Environment

- **Purpose**: Pre-production validation, UAT, and performance testing
- **Infrastructure**: Cloud-based Kubernetes cluster (production mirror)
- **Configuration**:
  - Production-like setup with reduced resources
  - Anonymized production data (for testing)
  - Full monitoring and logging
  - Accessible to stakeholders for testing

### Production Environment

- **Purpose**: Live system serving end-users
- **Infrastructure**: Cloud-based Kubernetes cluster (with high availability)
- **Configuration**:
  - Redundant components for high availability
  - Auto-scaling enabled
  - Regular backups
  - Comprehensive monitoring and alerting
  - Geographic distribution for global performance (future)

## Infrastructure Architecture

### Cloud Provider

The Hockey Hub platform is deployed on **Azure Kubernetes Service (AKS)** with the following rationale:

- Strong support for Kubernetes
- Comprehensive compliance certifications
- Integrated identity management
- Global presence for future expansion
- Cost-effective scaling options

### Infrastructure Components

The infrastructure consists of the following core components:

#### Kubernetes Clusters

- **Dev/Test Cluster**:
  - Single availability zone
  - Smaller node sizes (Standard_D2s_v3)
  - Autoscaling range: 3-6 nodes
  - Development namespace for feature branches
  - Testing namespace for automated tests

- **Staging Cluster**:
  - Two availability zones
  - Medium node sizes (Standard_D4s_v3)
  - Autoscaling range: 3-9 nodes

- **Production Cluster**:
  - Three availability zones
  - Larger node sizes (Standard_D8s_v3)
  - Autoscaling range: 6-15 nodes
  - Node affinity rules for service placement

#### Database Infrastructure

- **Database**: Azure Database for PostgreSQL - Flexible Server
  - Development: Basic tier, single instance
  - Staging: General Purpose tier, zone-redundant
  - Production: Business Critical tier, zone-redundant with read replicas

- **Storage**:
  - Azure Blob Storage for file attachments and backups
  - Separate storage accounts for each environment
  - Lifecycle management for cost optimization

#### Networking

- **Virtual Network**:
  - Separate VNets for each environment
  - Network security groups for traffic control
  - Private endpoints for Azure services

- **Ingress**:
  - NGINX Ingress Controller for Kubernetes
  - Azure Application Gateway for TLS termination and WAF (production only)
  - DNS management through Azure DNS

#### Supporting Services

- **Container Registry**: Azure Container Registry for Docker images
- **Key Management**: Azure Key Vault for secrets and certificates
- **Monitoring**: Azure Monitor with Application Insights
- **Identity**: Azure Active Directory for service authentication

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure Cloud Platform                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Azure Kubernetes Service                  │    │
│  │                                                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │  Frontend   │  │ API Gateway │  │  Microservices      │  │    │
│  │  │  Service    │◄─┤    Service  │◄─┤  - User Service     │  │    │
│  │  └─────────────┘  └─────────────┘  │  - Calendar Service │  │    │
│  │                                     │  - Training Service │  │    │
│  │  ┌─────────────┐                   │  - Medical Service  │  │    │
│  │  │  Ingress    │                   │  - Other Services   │  │    │
│  │  │  Controller │                   └─────────────────────┘  │    │
│  │  └─────┬───────┘                                            │    │
│  └────────┼──────────────────────────────────────────────────┘    │
│           │                                                         │
│  ┌────────▼─────────┐   ┌───────────────┐   ┌───────────────┐      │
│  │ Application      │   │ Azure Database│   │ Azure Monitor │      │
│  │ Gateway / WAF    │   │ PostgreSQL    │   │ App Insights  │      │
│  └────────┬─────────┘   └───────┬───────┘   └───────────────┘      │
│           │                     │                                   │
│  ┌────────▼─────────┐   ┌───────▼───────┐   ┌───────────────┐      │
│  │ Azure DNS        │   │ Azure Storage │   │ Azure KeyVault│      │
│  └──────────────────┘   └───────────────┘   └───────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## CI/CD Pipeline

The Hockey Hub platform employs a comprehensive CI/CD pipeline using GitHub Actions to automate builds, testing, and deployments.

### Pipeline Overview

```
┌───────────┐     ┌────────┐     ┌───────────┐     ┌────────────┐     ┌─────────────┐
│ Code      │     │ Build  │     │ Test      │     │ Artifact   │     │ Deployment  │
│ Commit    ├────►│ Stage  ├────►│ Stage     ├────►│ Publishing ├────►│ Stage       │
└───────────┘     └────────┘     └───────────┘     └────────────┘     └─────────────┘
```

### Pipeline Implementation

The CI/CD implementation leverages GitHub Actions with separate workflows for each microservice and the frontend application:

#### Common Workflow Structure

```yaml
name: [Service] CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    paths:
      - '[service-directory]/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - '[service-directory]/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16
      - name: Install dependencies
        working-directory: ./[service-directory]
        run: npm ci
      - name: Run ESLint
        working-directory: ./[service-directory]
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16
      - name: Install dependencies
        working-directory: ./[service-directory]
        run: npm ci
      - name: Run tests with coverage
        working-directory: ./[service-directory]
        run: npm test -- --coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./[service-directory]/coverage
          flags: [service-name]

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to ACR
        uses: docker/login-action@v2
        with:
          registry: hockeyhubregistry.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: hockeyhubregistry.azurecr.io/[service-name]
          tags: |
            type=ref,event=branch
            type=sha,format=short
      - name: Build and push
        uses: docker/build-push-action@v3
        with:
          context: ./[service-directory]
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=hockeyhubregistry.azurecr.io/[service-name]:buildcache
          cache-to: type=registry,ref=hockeyhubregistry.azurecr.io/[service-name]:buildcache,mode=max

  deploy-dev:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: development
    steps:
      - uses: actions/checkout@v3
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      - name: Set AKS context
        uses: azure/aks-set-context@v3
        with:
          resource-group: hockey-hub-dev-rg
          cluster-name: hockey-hub-dev-aks
          admin: 'false'
          use-kubelogin: 'true'
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deploy to development
        run: |
          helm upgrade --install [service-name] ./[service-directory]/helm \
            --namespace development \
            --set image.repository=hockeyhubregistry.azurecr.io/[service-name] \
            --set image.tag=sha-${{ github.sha }} \
            --values ./[service-directory]/helm/values-dev.yaml

  deploy-staging:
    runs-on: ubuntu-latest
    needs: deploy-dev
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      - name: Set AKS context
        uses: azure/aks-set-context@v3
        with:
          resource-group: hockey-hub-staging-rg
          cluster-name: hockey-hub-staging-aks
          admin: 'false'
          use-kubelogin: 'true'
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deploy to staging
        run: |
          helm upgrade --install [service-name] ./[service-directory]/helm \
            --namespace staging \
            --set image.repository=hockeyhubregistry.azurecr.io/[service-name] \
            --set image.tag=sha-${{ github.sha }} \
            --values ./[service-directory]/helm/values-staging.yaml

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment: 
      name: production
      url: https://api.hockeyhub.com/[service-path]
    steps:
      - uses: actions/checkout@v3
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      - name: Set AKS context
        uses: azure/aks-set-context@v3
        with:
          resource-group: hockey-hub-prod-rg
          cluster-name: hockey-hub-prod-aks
          admin: 'false'
          use-kubelogin: 'true'
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deploy to production
        run: |
          helm upgrade --install [service-name] ./[service-directory]/helm \
            --namespace production \
            --set image.repository=hockeyhubregistry.azurecr.io/[service-name] \
            --set image.tag=sha-${{ github.sha }} \
            --values ./[service-directory]/helm/values-prod.yaml
```

### Deployment Strategies

Different deployment strategies are used depending on the environment:

1. **Development Environment**:
   - **Strategy**: Direct deployment
   - **Rollback**: Manual rollback if needed
   - **Frequency**: On every merge to develop branch

2. **Staging Environment**:
   - **Strategy**: Blue/Green deployment
   - **Rollback**: Automatic rollback on failed health checks
   - **Frequency**: On every merge to main branch

3. **Production Environment**:
   - **Strategy**: Canary deployment
   - **Rollback**: Automatic rollback on error threshold
   - **Frequency**: Manual approval after staging validation

#### Canary Deployment Implementation

For production deployments, a canary approach gradually shifts traffic to new versions:

```yaml
# Production deployment step with canary strategy
- name: Deploy canary to production
  run: |
    # Deploy new version to canary pods (10% of traffic)
    helm upgrade --install [service-name] ./[service-directory]/helm \
      --namespace production \
      --set image.repository=hockeyhubregistry.azurecr.io/[service-name] \
      --set image.tag=sha-${{ github.sha }} \
      --set canary.enabled=true \
      --set canary.weight=10 \
      --values ./[service-directory]/helm/values-prod.yaml
      
- name: Monitor canary metrics
  run: |
    # Check error rates and performance
    ./scripts/monitor-canary.sh [service-name] 10 5 # Monitor for 10 minutes, threshold 5%

- name: Complete canary deployment
  if: success()
  run: |
    # Scale up to 100% on success
    helm upgrade --install [service-name] ./[service-directory]/helm \
      --namespace production \
      --set image.repository=hockeyhubregistry.azurecr.io/[service-name] \
      --set image.tag=sha-${{ github.sha }} \
      --set canary.enabled=false \
      --values ./[service-directory]/helm/values-prod.yaml

- name: Rollback on failure
  if: failure()
  run: |
    # Rollback to previous stable version
    helm rollback [service-name] -n production
```

### Feature Flags

To support continuous deployment while controlling feature availability:

- **Configuration**: LaunchDarkly for feature flag management
- **Integration**: SDK integration in API Gateway and frontend
- **Usage**: New features deployed behind flags that can be toggled by environment

## Environment Configuration Management

The Hockey Hub platform uses a hierarchical configuration system to manage environment-specific settings.

### Configuration Hierarchy

Configuration is loaded in the following order, with later sources overriding earlier ones:

1. Default configuration (base settings for all environments)
2. Environment-specific configuration (dev, test, staging, prod)
3. Kubernetes ConfigMaps (non-sensitive settings)
4. Kubernetes Secrets (sensitive data)
5. Azure Key Vault (highly sensitive credentials)

### Configuration Storage

Different types of configuration are stored in different locations:

#### 1. Code Repository

- **Location**: `/config` directory in each service
- **Contents**:
  - Default configuration (`default.js`)
  - Environment templates (`development.js`, `staging.js`, `production.js`)
  - Configuration schema definitions
- **Format**: JavaScript/TypeScript configuration objects

Example configuration structure:

```
/config
  /default.js         # Base configuration for all environments
  /development.js     # Development overrides
  /test.js            # Test environment overrides
  /staging.js         # Staging environment overrides
  /production.js      # Production environment overrides
  /custom-environment-variables.js  # Maps environment variables to config
  /schema.js          # Joi validation schema for configuration
```

#### 2. Kubernetes ConfigMaps

- **Purpose**: Environment-specific non-sensitive configuration
- **Format**: YAML or JSON
- **Scope**: Namespace-specific

Example ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: user-service-config
  namespace: production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v1"
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

#### 3. Kubernetes Secrets

- **Purpose**: Sensitive configuration (API keys, credentials)
- **Format**: Base64-encoded values
- **Scope**: Namespace-specific

Example Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: user-service-secrets
  namespace: production
type: Opaque
data:
  JWT_SECRET: "YmFzZTY0LWVuY29kZWQtc2VjcmV0LWtleQ=="
  JWT_REFRESH_SECRET: "YW5vdGhlci1iYXNlNjQtZW5jb2RlZC1zZWNyZXQ="
  DB_PASSWORD: "cGFzc3dvcmQtZm9yLWRhdGFiYXNl"
```

#### 4. Azure Key Vault

- **Purpose**: Highly sensitive credentials (database, external services)
- **Integration**: CSI Secret Store Driver for Kubernetes
- **Scope**: Environment-specific vaults

### Configuration Loading Process

Each service loads configuration using a consistent process:

1. Load base configuration from files
2. Apply environment overrides
3. Connect to Azure Key Vault for secrets
4. Validate configuration against schema
5. Cache configuration (with periodic refresh for dynamic updates)

Implementation example:

```typescript
// src/config/index.ts
import convict from 'convict';
import path from 'path';
import { configSchema } from './schema';

// Load environment variables from .env file in development
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

// Define configuration with schema
const config = convict(configSchema);

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
config.loadFile(path.join(__dirname, `${env}.js`));

// Load Azure Key Vault secrets if available
if (process.env.USE_KEY_VAULT === 'true') {
  const { loadSecretsFromKeyVault } = require('../utils/keyVault');
  loadSecretsFromKeyVault(config);
}

// Validate configuration
config.validate({ allowed: 'strict' });

// Export frozen configuration to prevent modification
export default config.getProperties();
```

### Sensitive Data Management

Sensitive configuration follows strict security practices:

1. **Development**: Environment-specific `.env` files (git-ignored)
2. **CI/CD**: GitHub Secrets for pipeline credentials
3. **Runtime**: Kubernetes Secrets and Azure Key Vault
4. **Rotation**: Automated credential rotation for critical secrets

## Database Deployment Strategy

The Hockey Hub platform uses PostgreSQL 17 as its primary database, with a structured approach to deployment and management.

### Database Infrastructure

- **Development**: Local PostgreSQL container
- **Testing**: Ephemeral PostgreSQL instance per test run
- **Staging**: Azure Database for PostgreSQL (General Purpose)
- **Production**: Azure Database for PostgreSQL (Business Critical)
  - Primary write instance
  - Read replicas for query-heavy services
  - Geo-redundant backups

### Database Migration Strategy

Database migrations are managed using TypeORM migration system:

#### Migration Creation Process

1. Developers create migrations using TypeORM CLI:

```bash
# Create a new migration
npm run typeorm migration:create -- -n UserTableUpdates
```

2. Migration files are stored in each service's `/migrations` directory
3. Migrations include both `up` and `down` methods for forward and rollback actions

Example migration file:

```typescript
// migrations/1680267304000-UserTableUpdates.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class UserTableUpdates1680267304000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'sv' NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN preferred_language;
    `);
  }
}
```

#### Migration Execution

1. **Local Development**: Run manually or on service startup
2. **CI/CD Pipeline**: Dedicated migration job before deployment
3. **Production**: Database migrations run as Kubernetes Job before service update

Example migration job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: user-service-migrations-${RELEASE_TAG}
  namespace: production
spec:
  ttlSecondsAfterFinished: 100
  template:
    spec:
      containers:
      - name: migration-runner
        image: hockeyhubregistry.azurecr.io/user-service:${IMAGE_TAG}
        command: ["npm", "run", "migrations:run"]
        env:
          - name: NODE_ENV
            value: "production"
          # Database configuration from secrets
          - name: DB_HOST
            valueFrom:
              secretKeyRef:
                name: db-secrets
                key: host
          # Additional environment variables...
      restartPolicy: Never
  backoffLimit: 3
```

#### Migration Safety Measures

To ensure safe database migrations:

1. **Validation**: Pre-migration validation in staging environment
2. **Transactions**: All migrations run in transactions when possible
3. **Backups**: Point-in-time backup before production migrations
4. **Monitoring**: Real-time monitoring during migration execution
5. **Rollback Plan**: Documented rollback procedure for each migration
6. **Database Versioning**: Database schema version tracking table

### Database Schema Management

Database schemas are managed with a structured approach:

1. **Service-Specific Schemas**: Each microservice owns its schema
2. **Shared Tables**: Common tables defined in the documentation
3. **Version Control**: Schema changes tracked in version control
4. **Documentation**: Auto-generated schema documentation from models

Example database initialization job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: init-database-${RELEASE_TAG}
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: db-init
        image: postgres:17-alpine
        command: ["/bin/sh", "-c"]
        args:
        - |
          # Create service schemas
          psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE SCHEMA IF NOT EXISTS user_service;
            CREATE SCHEMA IF NOT EXISTS calendar_service;
            CREATE SCHEMA IF NOT EXISTS training_service;
            CREATE SCHEMA IF NOT EXISTS medical_service;
            CREATE SCHEMA IF NOT EXISTS communication_service;
            CREATE SCHEMA IF NOT EXISTS statistics_service;
            CREATE SCHEMA IF NOT EXISTS planning_service;
            CREATE SCHEMA IF NOT EXISTS payment_service;
            CREATE SCHEMA IF NOT EXISTS admin_service;
          EOSQL
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: username
        # Additional environment variables...
      restartPolicy: Never
  backoffLimit: 2
```

## Service Deployment

The Hockey Hub microservices are deployed to Kubernetes using Helm charts for configuration and management.

### Helm Chart Structure

Each service has its own Helm chart with the following structure:

```
/[service-name]/helm/
  /templates/
    deployment.yaml        # Main service deployment
    service.yaml           # Kubernetes service definition
    ingress.yaml           # Ingress configuration
    configmap.yaml         # Configuration settings
    secrets.yaml           # Secret references
    hpa.yaml               # Horizontal Pod Autoscaler
    pdb.yaml               # Pod Disruption Budget
    serviceaccount.yaml    # Service account for the service
  Chart.yaml               # Chart metadata
  values.yaml              # Default values
  values-dev.yaml          # Development environment values
  values-staging.yaml      # Staging environment values
  values-prod.yaml         # Production environment values
```

### Resource Allocation

Resource allocation varies by environment:

#### Development
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 300m
    memory: 256Mi
```

#### Staging
```yaml
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

#### Production
```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### Horizontal Pod Autoscaling

Services scale based on CPU and memory usage:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "service.fullname" . }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "service.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
```

### Health Checks and Probes

Each service implements health checks for Kubernetes probes:

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: http
  initialDelaySeconds: 30
  periodSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
startupProbe:
  httpGet:
    path: /health/startup
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 12 # Allow up to 1 minute to start
```

### Service Mesh Integration

For advanced networking, observability, and security, the production environment uses Istio service mesh:

```yaml
# Enable Istio sidecar injection for the namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    istio-injection: enabled
```

Service mesh features used:

- **Traffic Management**: Advanced routing and load balancing
- **Security**: mTLS between services
- **Observability**: Distributed tracing and metrics collection
- **Resilience**: Circuit breaking and retries

## Monitoring and Logging

The Hockey Hub platform implements comprehensive monitoring and logging to ensure system health and aid troubleshooting.

### Monitoring Stack

The monitoring system consists of the following components:

1. **Metrics Collection**:
   - Prometheus for metrics aggregation
   - Node Exporter for host metrics
   - kube-state-metrics for Kubernetes metrics
   - Custom service metrics via Prometheus client libraries

2. **Visualization**:
   - Grafana for dashboards and visualization
   - Preconfigured dashboards for:
     - Infrastructure health
     - Service performance
     - Business metrics
     - Database performance

3. **Alerting**:
   - AlertManager for alert routing
   - Integration with PagerDuty for on-call notification
   - Slack integration for team notifications
   - Email alerts for non-urgent issues

### Logging Architecture

Logs are centralized and structured for efficient analysis:

1. **Log Collection**:
   - Fluentd as the log collector
   - JSON-formatted logs from all services
   - Standardized log structure with required fields

2. **Log Storage**:
   - Elasticsearch for log storage and indexing
   - Time-based index management
   - Log retention policies by environment

3. **Log Analysis**:
   - Kibana for log visualization and search
   - Predefined searches for common issues
   - Log correlation with request IDs

### Monitoring and Logging Implementation

#### Prometheus Deployment

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name
```

#### Application Monitoring Implementation

Each service exports metrics via a `/metrics` endpoint using the Prometheus client library:

```typescript
// src/utils/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';
import express from 'express';

// Initialize metrics
const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.03, 0.05, 0.07, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Current active connections'
});

// Setup metrics middleware for Express
export const metricsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = process.hrtime();
  
  // Increment active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    // Decrement active connections
    activeConnections.dec();
    
    // Record request duration
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    // Skip metrics route itself
    if (req.path !== '/metrics') {
      const route = req.route ? req.route.path : req.path;
      
      httpRequestDurationMicroseconds
        .labels(req.method, route, res.statusCode.toString())
        .observe(durationInSeconds);
      
      httpRequestCounter
        .labels(req.method, route, res.statusCode.toString())
        .inc();
    }
  });
  
  next();
};

// Metrics endpoint
export const metricsEndpoint = async (_req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Default metrics (GC, memory, etc.)
export const startDefaultMetrics = () => {
  register.setDefaultLabels({
    app: process.env.SERVICE_NAME || 'unknown-service'
  });
  register.collectDefaultMetrics();
};
```

#### Logging Configuration

Standardized logging is implemented using Winston:

```typescript
// src/utils/logger.ts
import winston from 'winston';
import { Request } from 'express';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: process.env.SERVICE_NAME || 'unknown-service' },
  transports: [
    new winston.transports.Console()
  ]
});

// Request context middleware
export const requestLogger = (req: Request, res: Response, next: Function) => {
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Create request-scoped logger
  req.logger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);
  
  // Log request
  req.logger.info('Request received');
  
  // Log response when finished
  res.on('finish', () => {
    req.logger.info('Response sent', {
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime
    });
  });
  
  next();
};

export default logger;
```

#### EFK Stack Configuration

The Elasticsearch, Fluentd, and Kibana (EFK) stack is deployed using Helm:

```bash
# Install EFK stack
helm repo add elastic https://helm.elastic.co
helm repo add fluent https://fluent.github.io/helm-charts

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=3 \
  --set minimumMasterNodes=2 \
  --set resources.requests.cpu=1 \
  --set resources.requests.memory=2Gi \
  --set resources.limits.cpu=2 \
  --set resources.limits.memory=4Gi

# Install Fluentd
helm install fluentd fluent/fluentd \
  --namespace logging \
  --set forwarder.sources.forward.port=24224 \
  --set forwarder.sources.forward.bind=0.0.0.0 \
  --set aggregator.enabled=true \
  --set aggregator.buffer.flush_interval=10s \
  --set aggregator.buffer.flush_mode=interval

# Install Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set elasticsearchHosts=http://elasticsearch-master:9200
```

### Alerting Configuration

Alerting is configured in Prometheus AlertManager:

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
      
    templates:
      - '/etc/alertmanager/templates/*.tmpl'
      
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 3h
      receiver: 'slack-notifications'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty-critical'
        continue: true
      - match:
          severity: warning
        receiver: 'slack-notifications'
          
    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#alerts'
        send_resolved: true
        title: '{{ .GroupLabels.alertname }}'
        text: >-
          {{ range .Alerts }}
            *Alert:* {{ .Annotations.summary }}
            *Description:* {{ .Annotations.description }}
            *Severity:* {{ .Labels.severity }}
            *Service:* {{ .Labels.service }}
          {{ end }}
          
    - name: 'pagerduty-critical'
      pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'
        send_resolved: true
        description: '{{ .CommonAnnotations.summary }}'
        details:
          severity: '{{ .CommonLabels.severity }}'
          service: '{{ .CommonLabels.service }}'
          description: '{{ .CommonAnnotations.description }}'
```

### Dashboard Templates

Pre-configured Grafana dashboards are maintained for consistent monitoring:

1. **Infrastructure Dashboard**:
   - Cluster CPU and memory usage
   - Node health metrics
   - Storage metrics
   - Network throughput

2. **Service Dashboard**:
   - Request rate, errors, and duration (RED)
   - Service dependencies
   - Database query performance
   - Cache hit rates

3. **Business Dashboard**:
   - Active users
   - Tenant organizations
   - Teams created
   - Event creation rate

Dashboards are deployed via configuration as code using the Grafana API.

## Backup and Disaster Recovery

The Hockey Hub platform implements comprehensive backup and disaster recovery procedures to ensure data protection and system availability.

### Database Backup Strategy

#### Automated Backups

PostgreSQL databases are backed up using multiple mechanisms:

1. **Point-in-Time Recovery (PITR)**:
   - Continuous WAL archiving to Azure Storage
   - Retention period: 30 days (production)
   - Recovery to any point in time within retention period

2. **Full Database Backups**:
   - Daily full backups to Azure Storage
   - Weekly consolidated backups
   - Monthly archival backups
   - Retention policy:
     - Daily: 14 days
     - Weekly: 6 weeks
     - Monthly: 12 months

3. **Pre-Deployment Snapshots**:
   - Automated backup before each production deployment
   - Retained until next successful deployment

#### Backup Testing

Backup validity is regularly verified:

1. **Weekly Automated Recovery Tests**:
   - Restore to separate test instance
   - Run validation queries
   - Verify data integrity

2. **Monthly Manual Recovery Drill**:
   - Full recovery procedure test
   - Documentation review and update
   - Recovery time measurement

### Disaster Recovery Plan

The disaster recovery plan addresses various failure scenarios:

#### 1. Service Outage Recovery

For individual service failures:

1. **Detection**: Prometheus alerts trigger notification
2. **Isolation**: Identify affected service
3. **Remediation**:
   - Restart service if temporary failure
   - Rollback to previous version if deployment-related
   - Scale horizontally if capacity-related
4. **Verification**: Run health checks and monitor metrics

#### 2. Database Failure Recovery

For database failures:

1. **High Availability Failover**:
   - Automatic failover to standby replica
   - Read traffic redirected during failover
   - Write capability restored after failover completion

2. **Full Recovery Procedure**:
   - Restore from latest backup
   - Apply transaction logs to reach the desired point
   - Verify data integrity
   - Reconnect applications

#### 3. Full Region Failure

For catastrophic region failure:

1. **Multi-Region Strategy** (Planned for Phase 2):
   - Database geo-replication to secondary region
   - Kubernetes cluster in secondary region
   - Storage replication across regions

2. **Recovery Procedure**:
   - Activate secondary region resources
   - Redirect DNS to secondary region
   - Escalate capacity in secondary region
   - Verify system stability

### Disaster Recovery Testing

Regular testing ensures preparedness:

1. **Quarterly DR Drills**:
   - Simulated failure scenarios
   - Manual recovery procedure execution
   - Documentation validation
   - Team training

2. **Automated Resilience Testing**:
   - Chaos engineering principles
   - Controlled failures in non-production environments
   - Recovery automation validation

### Recovery Time Objectives (RTO)

Target recovery times vary by scenario:

- Single service failure: < 5 minutes
- Database failure with failover: < 15 minutes
- Full region recovery (future): < 60 minutes

### Recovery Point Objectives (RPO)

Maximum acceptable data loss:

- Database with transaction logs: < 1 minute
- File storage with async replication: < 15 minutes

## Scaling Strategy

The Hockey Hub platform is designed to scale efficiently as user base and data volume grow.

### Horizontal Scaling

Services scale horizontally in response to load:

1. **Kubernetes HPA**:
   - CPU threshold: 70%
   - Memory threshold: 80%
   - Custom metrics for specific services (e.g., queue length)

2. **Scaling Limits**:
   - Minimum replicas: 2 (production)
   - Maximum replicas: Based on service (typically 10-20)
   - Scale-down delay: 5 minutes to prevent flapping

3. **Service-Specific Scaling**:
   - API Gateway: Based on request rate
   - User Service: Based on active sessions
   - Calendar Service: Based on event creation rate

### Database Scaling

PostgreSQL scaling strategy:

1. **Vertical Scaling**:
   - Initial approach for write scaling
   - Automated storage scaling
   - Manual instance size upgrades

2. **Read Replicas**:
   - Deployed for read-heavy services
   - Query router implementation
   - Replica lag monitoring

3. **Future Sharding Strategy**:
   - Tenant-based sharding for multi-organization scaling
   - Schema preparation for sharding
   - Consistent hashing for routing

### Storage Scaling

Azure Blob Storage scales automatically:

1. **Tiered Storage**:
   - Hot tier for active content
   - Cool tier for infrequently accessed data
   - Archive tier for compliance storage

2. **Content Delivery**:
   - Azure CDN for static assets
   - Cache policies by content type
   - Regional caching for global expansion

### Future Global Scaling

For international expansion (planned for Year 2):

1. **Multi-Region Deployment**:
   - Regional Kubernetes clusters
   - Geo-replicated databases
   - Traffic routing based on user location

2. **Global Load Balancing**:
   - Azure Traffic Manager
   - Regional service health monitoring
   - Failover policies

## Security Considerations

The Hockey Hub platform implements comprehensive security measures across all infrastructure components.

### Network Security

1. **Network Isolation**:
   - VNet segmentation between environments
   - Network Security Groups for traffic control
   - Service endpoints for Azure services
   - Private Link for database connections

2. **Service Mesh Security**:
   - Mutual TLS between services
   - Traffic encryption in transit
   - Network policy enforcement
   - Service identity verification

3. **External Traffic Protection**:
   - Web Application Firewall (WAF)
   - DDoS protection
   - Rate limiting at ingress
   - TLS 1.3 for all external connections

### Identity and Access Management

1. **Service Identities**:
   - Kubernetes service accounts
   - Managed Identities for Azure resources
   - Just-in-time access for administrators
   - RBAC for all management actions

2. **Secrets Management**:
   - Azure Key Vault for credential storage
   - Kubernetes Secrets for runtime configuration
   - Secret rotation policy
   - Access auditing

3. **Authentication Infrastructure**:
   - Azure AD integration for administrative access
   - AuthN/AuthZ services for end-users
   - Multi-factor authentication for sensitive operations

### Compliance and Auditing

1. **Audit Logging**:
   - Comprehensive audit logs for all changes
   - Log retention based on compliance requirements
   - Tamper-evident logging
   - Regular audit log reviews

2. **Compliance Controls**:
   - GDPR compliance for user data
   - ISO 27001 security controls
   - Regular security assessments
   - Vulnerability management program

3. **Security Testing**:
   - Automated security scanning in CI/CD
   - Regular penetration testing
   - Dependency vulnerability scanning
   - Container image scanning

### Data Protection

1. **Data Encryption**:
   - Encryption at rest for all storage
   - TLS for data in transit
   - Column-level encryption for sensitive fields
   - Client-side encryption for sensitive uploads

2. **Data Access Control**:
   - Row-level security in database
   - Attribute-based access control
   - Data Loss Prevention policies
   - Data access monitoring

3. **Data Retention and Disposal**:
   - Configurable retention policies
   - Secure data deletion procedures
   - Data anonymization for analytics
   - Regular data minimization reviews

## Implementation Roadmap

The infrastructure and deployment implementation follows a phased approach aligned with the overall project timeline.

### Phase 1: Foundation (Months 1-2)

1. **Core Infrastructure Setup**:
   - Azure resource group creation
   - Network architecture implementation
   - Initial Kubernetes cluster deployment
   - Container registry setup

2. **CI/CD Pipeline Implementation**:
   - GitHub Actions workflow setup
   - Container build pipeline
   - Basic deployment automation
   - Development environment configuration

3. **Initial Database Setup**:
   - PostgreSQL provisioning
   - Schema initialization
   - Migration system setup
   - Database backup configuration

4. **Monitoring Foundation**:
   - Prometheus and Grafana installation
   - Basic service metrics
   - Initial alerting configuration
   - Log aggregation setup

### Phase 2: Development Environment (Months 2-3)

1. **Service Deployment Automation**:
   - Helm chart development
   - Environment-specific configuration
   - Deployment script refinement
   - Service interconnection testing

2. **Local Development Environment**:
   - Docker Compose setup
   - Local development documentation
   - Developer tooling
   - Hot reload configuration

3. **Environment Configuration Management**:
   - Configuration system implementation
   - Secret management integration
   - Environment variable documentation
   - Configuration validation

4. **Testing Environment Setup**:
   - Automated test infrastructure
   - Integration test environment
   - Test data management
   - CI/CD test integration

### Phase 3: Staging and Production (Months 3-4)

1. **Staging Environment Deployment**:
   - Staging cluster provisioning
   - Blue/Green deployment setup
   - Staging-specific configurations
   - Testing and validation processes

2. **Production Infrastructure Setup**:
   - Production cluster provisioning
   - High-availability configuration
   - Performance optimization
   - Security hardening

3. **Advanced Deployment Strategies**:
   - Canary deployment implementation
   - Feature flag integration
   - Rollback automation
   - Deployment verification tests

4. **Comprehensive Monitoring**:
   - Advanced dashboards
   - Business metrics integration
   - Automated anomaly detection
   - On-call rotation setup

### Phase 4: Scaling and Optimization (Months 4-6)

1. **Performance Optimization**:
   - Load testing and optimization
   - Resource allocation fine-tuning
   - Caching strategy implementation
   - Database query optimization

2. **Scale Testing**:
   - Automated load generation
   - Horizontal scaling validation
   - Failover testing
   - Bottleneck identification

3. **Disaster Recovery Implementation**:
   - DR procedure documentation
   - Recovery automation
   - Regular DR drills
   - RTO/RPO validation

4. **Security Enhancements**:
   - Advanced threat protection
   - Vulnerability scanning integration
   - Security monitoring
   - Compliance validation

### Phase 5: Advanced Features (Months 6+)

1. **Global Scale Preparation**:
   - Multi-region architecture design
   - Data replication strategy
   - Global traffic management
   - Geographic optimization

2. **Advanced Analytics**:
   - Logging analysis automation
   - Predictive scaling
   - Performance analytics
   - Cost optimization

3. **Continuous Improvement**:
   - Infrastructure as Code refinement
   - Deployment process optimization
   - Monitoring enhancement
   - Documentation updates

## Conclusion

This infrastructure and deployment strategy provides a comprehensive approach to operationalizing the Hockey Hub platform. By following this structured approach to environment management, CI/CD implementation, database deployment, and monitoring, the system will achieve the reliability, scalability, and security required for a successful launch and sustainable growth.

The strategy embraces modern cloud-native practices while maintaining operational efficiency and developer productivity. Regular reviews and updates to this document will ensure it remains aligned with evolving project requirements and technology advancements.