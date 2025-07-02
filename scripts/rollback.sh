#!/bin/bash

# Hockey Hub - Production Rollback Script
# This script rolls back to a previous deployment version

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
TARGET_VERSION="${1:-}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
LOG_FILE="/var/log/hockey-hub/rollback.log"
BACKUP_DIR="/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

show_usage() {
    echo "Usage: $0 [VERSION|BACKUP_DATE]"
    echo ""
    echo "Options:"
    echo "  VERSION       Version tag to rollback to (e.g., v1.2.0)"
    echo "  BACKUP_DATE   Backup date to restore from (e.g., 20240101_120000)"
    echo ""
    echo "Examples:"
    echo "  $0 v1.2.0                    # Rollback to version v1.2.0"
    echo "  $0 20240101_120000           # Restore from backup"
    echo "  $0                           # Interactive selection"
    echo ""
    echo "Available versions:"
    list_available_versions
    echo ""
    echo "Available backups:"
    list_available_backups
}

list_available_versions() {
    info "Available Docker image versions:"
    
    # Get list of available versions for frontend service
    VERSIONS=$(docker images hockey-hub_frontend --format "table {{.Tag}}" | tail -n +2 | grep -v "latest" | sort -V)
    
    if [ -z "$VERSIONS" ]; then
        warn "No previous versions found"
        return 1
    fi
    
    echo "$VERSIONS" | sed 's/^/  - /'
}

list_available_backups() {
    info "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warn "No backup directory found at $BACKUP_DIR"
        return 1
    fi
    
    BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "????????_??????" | sort -r | head -10)
    
    if [ -z "$BACKUPS" ]; then
        warn "No backups found"
        return 1
    fi
    
    for backup in $BACKUPS; do
        BACKUP_NAME=$(basename "$backup")
        BACKUP_DATE=$(echo "$BACKUP_NAME" | sed 's/_/ /')
        echo "  - $BACKUP_NAME ($BACKUP_DATE)"
    done
}

interactive_selection() {
    info "Interactive rollback selection"
    
    echo ""
    echo "Select rollback method:"
    echo "1) Rollback to previous version (using Docker images)"
    echo "2) Restore from backup (complete restore)"
    echo "3) Cancel"
    echo ""
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            select_version
            ;;
        2)
            select_backup
            ;;
        3)
            info "Rollback cancelled by user"
            exit 0
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
}

select_version() {
    info "Selecting version for rollback..."
    
    if ! list_available_versions; then
        error "No versions available for rollback"
        exit 1
    fi
    
    echo ""
    read -p "Enter version to rollback to: " selected_version
    
    if [ -z "$selected_version" ]; then
        error "No version specified"
        exit 1
    fi
    
    TARGET_VERSION="$selected_version"
    ROLLBACK_METHOD="version"
}

select_backup() {
    info "Selecting backup for restore..."
    
    if ! list_available_backups; then
        error "No backups available for restore"
        exit 1
    fi
    
    echo ""
    read -p "Enter backup date to restore from: " selected_backup
    
    if [ -z "$selected_backup" ]; then
        error "No backup specified"
        exit 1
    fi
    
    if [ ! -d "$BACKUP_DIR/$selected_backup" ]; then
        error "Backup directory not found: $BACKUP_DIR/$selected_backup"
        exit 1
    fi
    
    TARGET_VERSION="$selected_backup"
    ROLLBACK_METHOD="backup"
}

verify_rollback_target() {
    info "Verifying rollback target..."
    
    if [ "$ROLLBACK_METHOD" = "version" ]; then
        # Check if Docker image exists
        if ! docker images "hockey-hub_frontend:$TARGET_VERSION" --format "table {{.Tag}}" | grep -q "$TARGET_VERSION"; then
            error "Docker image not found for version: $TARGET_VERSION"
            exit 1
        fi
        log "Docker image verified for version: $TARGET_VERSION ✓"
        
    elif [ "$ROLLBACK_METHOD" = "backup" ]; then
        # Check if backup directory exists and contains required files
        BACKUP_PATH="$BACKUP_DIR/$TARGET_VERSION"
        
        if [ ! -f "$BACKUP_PATH/docker-compose.production.yml" ]; then
            error "Docker compose file not found in backup: $BACKUP_PATH"
            exit 1
        fi
        
        if [ ! -f "$BACKUP_PATH/.env.production" ]; then
            error "Environment file not found in backup: $BACKUP_PATH"
            exit 1
        fi
        
        log "Backup files verified: $BACKUP_PATH ✓"
    fi
}

create_rollback_backup() {
    info "Creating backup before rollback..."
    
    ROLLBACK_BACKUP_DIR="/backups/rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$ROLLBACK_BACKUP_DIR"
    
    # Backup current configuration
    cp "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" "$ROLLBACK_BACKUP_DIR/"
    cp "$PROJECT_ROOT/.env.production" "$ROLLBACK_BACKUP_DIR/"
    
    # Save current service states
    cd "$PROJECT_ROOT"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps > "$ROLLBACK_BACKUP_DIR/service_states.txt"
    
    log "Rollback backup created: $ROLLBACK_BACKUP_DIR ✓"
}

rollback_to_version() {
    info "Rolling back to version: $TARGET_VERSION"
    
    cd "$PROJECT_ROOT"
    
    # Stop services gracefully
    log "Stopping services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Get list of services
    SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" config --services | grep -E "(frontend|.*-service)")
    
    # Tag current images with target version
    for service in $SERVICES; do
        if docker images "hockey-hub_${service}:${TARGET_VERSION}" --format "table {{.Tag}}" | grep -q "$TARGET_VERSION"; then
            log "Tagging $service with target version"
            docker tag "hockey-hub_${service}:${TARGET_VERSION}" "hockey-hub_${service}:latest"
        else
            warn "Image not found for ${service}:${TARGET_VERSION}, skipping"
        fi
    done
    
    # Start services with rolled back images
    log "Starting services with version $TARGET_VERSION..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log "Version rollback completed ✓"
}

restore_from_backup() {
    info "Restoring from backup: $TARGET_VERSION"
    
    BACKUP_PATH="$BACKUP_DIR/$TARGET_VERSION"
    cd "$PROJECT_ROOT"
    
    # Stop all services
    log "Stopping all services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Restore configuration files
    log "Restoring configuration files..."
    cp "$BACKUP_PATH/docker-compose.production.yml" "$PROJECT_ROOT/"
    cp "$BACKUP_PATH/.env.production" "$PROJECT_ROOT/"
    
    # Start databases
    log "Starting databases..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        postgres-user postgres-comm postgres-calendar postgres-training \
        postgres-medical postgres-planning postgres-statistics postgres-payment \
        postgres-admin postgres-file redis
    
    # Wait for databases
    sleep 30
    
    # Restore databases
    log "Restoring databases..."
    for service in user communication calendar training medical planning statistics payment admin file; do
        if [ -f "$BACKUP_PATH/${service}.sql" ]; then
            log "Restoring database: ${service}"
            
            # Drop and recreate database
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${service}" \
                psql -U postgres -c "DROP DATABASE IF EXISTS hockey_hub_${service};"
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${service}" \
                psql -U postgres -c "CREATE DATABASE hockey_hub_${service};"
            
            # Restore data
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${service}" \
                psql -U postgres "hockey_hub_${service}" < "$BACKUP_PATH/${service}.sql"
            
            log "Database restored: ${service} ✓"
        else
            warn "Database backup not found: ${service}.sql"
        fi
    done
    
    # Restore Redis
    if [ -f "$BACKUP_PATH/redis.rdb" ]; then
        log "Restoring Redis..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli FLUSHALL
        docker cp "$BACKUP_PATH/redis.rdb" "$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis):/data/dump.rdb"
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart redis
        log "Redis restored ✓"
    fi
    
    # Restore uploaded files
    if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
        log "Restoring uploaded files..."
        rm -rf "$PROJECT_ROOT/uploads"
        tar -xzf "$BACKUP_PATH/uploads.tar.gz" -C "$PROJECT_ROOT/"
        log "Uploaded files restored ✓"
    fi
    
    # Start all services
    log "Starting all services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log "Backup restore completed ✓"
}

verify_rollback() {
    info "Verifying rollback..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 60
    
    # Check service health
    FAILED_SERVICES=()
    SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services)
    
    for service in $SERVICES; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log "Service $service is running ✓"
        else
            error "Service $service failed to start"
            FAILED_SERVICES+=("$service")
        fi
    done
    
    # Test basic endpoints
    if curl -f -s "http://localhost:3000/health" > /dev/null; then
        log "API Gateway health check passed ✓"
    else
        error "API Gateway health check failed"
        FAILED_SERVICES+=("api-gateway")
    fi
    
    if curl -f -s "http://localhost:3002" > /dev/null; then
        log "Frontend health check passed ✓"
    else
        error "Frontend health check failed"
        FAILED_SERVICES+=("frontend")
    fi
    
    if [ ${#FAILED_SERVICES[@]} -ne 0 ]; then
        error "Rollback verification failed. Failed services: ${FAILED_SERVICES[*]}"
        return 1
    fi
    
    log "Rollback verification completed successfully ✓"
    return 0
}

save_rollback_info() {
    info "Saving rollback information..."
    
    ROLLBACK_INFO_FILE="/var/log/hockey-hub/rollbacks.log"
    mkdir -p "$(dirname "$ROLLBACK_INFO_FILE")"
    
    {
        echo "==================================="
        echo "Rollback completed: $(date)"
        echo "Target: $TARGET_VERSION"
        echo "Method: $ROLLBACK_METHOD"
        echo "Environment: $ENVIRONMENT"
        echo "Performed by: ${USER:-unknown}"
        echo "==================================="
        echo ""
    } >> "$ROLLBACK_INFO_FILE"
    
    log "Rollback information saved ✓"
}

# =============================================================================
# Main Rollback Function
# =============================================================================

main() {
    log "Starting Hockey Hub rollback"
    log "Environment: $ENVIRONMENT"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Determine rollback method
    if [ -z "$TARGET_VERSION" ]; then
        interactive_selection
    else
        # Check if target is a version or backup date
        if [[ "$TARGET_VERSION" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
            ROLLBACK_METHOD="backup"
        else
            ROLLBACK_METHOD="version"
        fi
    fi
    
    # Verify target
    verify_rollback_target
    
    # Confirm rollback
    warn "You are about to rollback to: $TARGET_VERSION"
    warn "Method: $ROLLBACK_METHOD"
    warn "This action cannot be undone without another rollback!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        info "Rollback cancelled by user"
        exit 0
    fi
    
    # Create backup before rollback
    create_rollback_backup
    
    # Perform rollback
    if [ "$ROLLBACK_METHOD" = "version" ]; then
        rollback_to_version
    elif [ "$ROLLBACK_METHOD" = "backup" ]; then
        restore_from_backup
    fi
    
    # Verify rollback
    if verify_rollback; then
        log "Rollback successful! 🎉"
        save_rollback_info
        
        info "==================================="
        info "Rollback Summary:"
        info "Target: $TARGET_VERSION"
        info "Method: $ROLLBACK_METHOD"
        info "Frontend: http://localhost:3002"
        info "API Gateway: http://localhost:3000"
        info "==================================="
    else
        error "Rollback verification failed!"
        error "System may be in an inconsistent state!"
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Show usage if help requested
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_usage
    exit 0
fi

# Handle interrupts gracefully
trap 'error "Rollback interrupted by user"; exit 130' INT TERM

# Run main function
main

exit 0