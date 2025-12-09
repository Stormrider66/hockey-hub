#!/bin/bash

# Hockey Hub - Production Deployment Script
# This script automates the complete deployment process

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# Configuration
# =============================================================================

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
VERSION="${1:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/hockey-hub/deploy.log"
MAX_ROLLBACK_VERSIONS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*${NC}" | tee -a "$LOG_FILE"
}

# =============================================================================
# Helper Functions
# =============================================================================

check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check disk space (minimum 10GB free)
    FREE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$FREE_SPACE" -lt 10485760 ]; then  # 10GB in KB
        warn "Low disk space. Available: $(($FREE_SPACE / 1024 / 1024))GB"
    fi
    
    # Check if .env.production exists
    if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
        error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    log "Prerequisites check passed ✓"
}

create_backup() {
    info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup databases
    log "Backing up databases..."
    for service in user communication calendar training medical planning statistics payment admin file; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${service}" pg_isready -U postgres &> /dev/null; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${service}" \
                pg_dump -U postgres "hockey_hub_${service}" > "$BACKUP_DIR/${service}.sql"
            log "Database backup created: ${service}.sql"
        else
            warn "Database postgres-${service} is not available for backup"
        fi
    done
    
    # Backup Redis
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis \
            redis-cli --rdb - > "$BACKUP_DIR/redis.rdb"
        log "Redis backup created: redis.rdb"
    fi
    
    # Backup configuration files
    log "Backing up configuration files..."
    cp "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/"
    cp "$PROJECT_ROOT/.env.production" "$BACKUP_DIR/"
    
    # Backup uploaded files (if local storage)
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$PROJECT_ROOT" uploads/
        log "File uploads backup created: uploads.tar.gz"
    fi
    
    log "Backup completed: $BACKUP_DIR ✓"
}

build_images() {
    info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build all services
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache --parallel
    
    # Tag images with version
    if [ "$VERSION" != "latest" ]; then
        log "Tagging images with version: $VERSION"
        
        # Get list of services
        SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" config --services | grep -E "(frontend|.*-service)")
        
        for service in $SERVICES; do
            docker tag "hockey-hub_${service}:latest" "hockey-hub_${service}:${VERSION}"
        done
    fi
    
    log "Docker images built successfully ✓"
}

run_migrations() {
    info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Start only databases first
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres-user postgres-comm postgres-calendar postgres-training postgres-medical postgres-planning postgres-statistics postgres-payment postgres-admin postgres-file redis
    
    # Wait for databases to be ready
    log "Waiting for databases to be ready..."
    sleep 30
    
    # Run migrations for each service
    SERVICES=(user communication calendar training medical planning statistics payment admin)
    
    for service in "${SERVICES[@]}"; do
        log "Running migrations for ${service}-service..."
        
        # Start the service temporarily to run migrations
        docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm "${service}-service" npm run migrate
        
        if [ $? -eq 0 ]; then
            log "Migrations completed for ${service}-service ✓"
        else
            error "Migration failed for ${service}-service"
            exit 1
        fi
    done
    
    log "All migrations completed successfully ✓"
}

deploy_services() {
    info "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy with rolling updates
    log "Starting rolling deployment..."
    
    # Start infrastructure services first
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d redis nginx prometheus grafana alertmanager node-exporter
    
    # Wait for infrastructure
    sleep 10
    
    # Start backend services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        user-service communication-service calendar-service training-service \
        medical-service planning-service statistics-service payment-service \
        admin-service file-service
    
    # Wait for backend services
    sleep 20
    
    # Start API Gateway
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d api-gateway
    
    # Wait for API Gateway
    sleep 10
    
    # Start Frontend
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d frontend
    
    log "Services deployment completed ✓"
}

verify_deployment() {
    info "Verifying deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for services to be fully ready
    log "Waiting for services to start..."
    sleep 60
    
    # Check service health
    FAILED_SERVICES=()
    
    # Get all services with health checks
    SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services)
    
    for service in $SERVICES; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up (healthy)"; then
            log "Service $service is healthy ✓"
        elif docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            warn "Service $service is up but health check pending"
        else
            error "Service $service is not running properly"
            FAILED_SERVICES+=("$service")
        fi
    done
    
    # Test API endpoints
    info "Testing API endpoints..."
    
    # Test API Gateway health
    if curl -f -s "http://localhost:3000/health" > /dev/null; then
        log "API Gateway health check passed ✓"
    else
        error "API Gateway health check failed"
        FAILED_SERVICES+=("api-gateway")
    fi
    
    # Test Frontend
    if curl -f -s "http://localhost:3002" > /dev/null; then
        log "Frontend health check passed ✓"
    else
        error "Frontend health check failed"
        FAILED_SERVICES+=("frontend")
    fi
    
    # Check if any services failed
    if [ ${#FAILED_SERVICES[@]} -ne 0 ]; then
        error "Deployment verification failed. Failed services: ${FAILED_SERVICES[*]}"
        return 1
    fi
    
    log "Deployment verification completed successfully ✓"
    return 0
}

cleanup_old_images() {
    info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old tagged images (keep last 3 versions)
    SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" config --services | grep -E "(frontend|.*-service)")
    
    for service in $SERVICES; do
        # Get list of tagged images for this service
        IMAGES=$(docker images "hockey-hub_${service}" --format "table {{.Tag}}" | tail -n +2 | grep -v "latest" | sort -V)
        
        # Keep only the last 3 versions
        OLD_IMAGES=$(echo "$IMAGES" | head -n -3)
        
        for image in $OLD_IMAGES; do
            if [ -n "$image" ] && [ "$image" != "latest" ]; then
                docker rmi "hockey-hub_${service}:${image}" || true
                log "Removed old image: hockey-hub_${service}:${image}"
            fi
        done
    done
    
    log "Cleanup completed ✓"
}

save_deployment_info() {
    info "Saving deployment information..."
    
    DEPLOY_INFO_FILE="/var/log/hockey-hub/deployments.log"
    mkdir -p "$(dirname "$DEPLOY_INFO_FILE")"
    
    {
        echo "==================================="
        echo "Deployment completed: $(date)"
        echo "Version: $VERSION"
        echo "Environment: $ENVIRONMENT"
        echo "Backup location: $BACKUP_DIR"
        echo "Deployed by: ${USER:-unknown}"
        echo "Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
        echo "Services:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services | sed 's/^/  - /'
        echo "==================================="
        echo ""
    } >> "$DEPLOY_INFO_FILE"
    
    log "Deployment information saved ✓"
}

# =============================================================================
# Main Deployment Function
# =============================================================================

main() {
    log "Starting Hockey Hub deployment (version: $VERSION)"
    log "Environment: $ENVIRONMENT"
    log "Project root: $PROJECT_ROOT"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Build images
    build_images
    
    # Run database migrations
    run_migrations
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    if verify_deployment; then
        log "Deployment successful! 🎉"
        
        # Cleanup old images
        cleanup_old_images
        
        # Save deployment info
        save_deployment_info
        
        # Show deployment summary
        info "==================================="
        info "Deployment Summary:"
        info "Version: $VERSION"
        info "Backup: $BACKUP_DIR"
        info "Frontend: http://localhost:3002"
        info "API Gateway: http://localhost:3000"
        info "Monitoring: http://localhost:3001 (Grafana)"
        info "Prometheus: http://localhost:9090"
        info "==================================="
        
    else
        error "Deployment verification failed!"
        warn "Consider running rollback: ./scripts/rollback.sh"
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Check if script is run as root for production
if [ "$ENVIRONMENT" = "production" ] && [ "$EUID" -ne 0 ]; then
    warn "Running deployment as non-root user. Some operations may fail."
fi

# Handle interrupts gracefully
trap 'error "Deployment interrupted by user"; exit 130' INT TERM

# Run main function
main

exit 0