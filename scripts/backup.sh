#!/bin/bash

# Hockey Hub - Backup Script
# This script creates comprehensive backups of all system components

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
BACKUP_TYPE="${1:-full}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_BASE_DIR="${BACKUP_DIR:-/backups}"
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_TIMESTAMP}"
LOG_FILE="/var/log/hockey-hub/backup.log"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# S3 Configuration (if enabled)
S3_ENABLED="${S3_BACKUP_ENABLED:-false}"
S3_BUCKET="${S3_BACKUP_BUCKET:-hockey-hub-backups}"
S3_REGION="${AWS_REGION:-us-east-1}"

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
    echo "Usage: $0 [BACKUP_TYPE]"
    echo ""
    echo "Backup Types:"
    echo "  full        Complete backup (databases, files, configs) [default]"
    echo "  databases   Database backup only"
    echo "  files       File backup only"
    echo "  config      Configuration backup only"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR           Base backup directory (default: /backups)"
    echo "  RETENTION_DAYS       Backup retention in days (default: 30)"
    echo "  S3_BACKUP_ENABLED    Enable S3 upload (default: false)"
    echo "  S3_BACKUP_BUCKET     S3 bucket name"
    echo ""
    echo "Examples:"
    echo "  $0 full              # Full backup"
    echo "  $0 databases         # Database backup only"
    echo "  BACKUP_DIR=/tmp $0   # Custom backup directory"
}

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
    
    # Check if services are running
    cd "$PROJECT_ROOT"
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        warn "Some services may not be running"
    fi
    
    # Check disk space
    REQUIRED_SPACE=5242880  # 5GB in KB
    FREE_SPACE=$(df "$BACKUP_BASE_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
    
    if [ "$FREE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        error "Insufficient disk space. Required: 5GB, Available: $(($FREE_SPACE / 1024 / 1024))GB"
        exit 1
    fi
    
    # Check S3 tools if S3 backup is enabled
    if [ "$S3_ENABLED" = "true" ]; then
        if ! command -v aws &> /dev/null; then
            error "AWS CLI is not installed but S3 backup is enabled"
            exit 1
        fi
    fi
    
    log "Prerequisites check passed ✓"
}

create_backup_directory() {
    info "Creating backup directory: $BACKUP_DIR"
    
    mkdir -p "$BACKUP_DIR"
    chmod 750 "$BACKUP_DIR"
    
    # Create metadata file
    cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
  "timestamp": "$BACKUP_TIMESTAMP",
  "type": "$BACKUP_TYPE",
  "environment": "$ENVIRONMENT",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "hostname": "$(hostname)",
  "user": "${USER:-unknown}"
}
EOF
    
    log "Backup directory created ✓"
}

backup_databases() {
    info "Backing up databases..."
    
    cd "$PROJECT_ROOT"
    
    # Create database backup directory
    mkdir -p "$BACKUP_DIR/databases"
    
    # List of databases to backup
    DATABASES=(user communication calendar training medical planning statistics payment admin file)
    
    for db in "${DATABASES[@]}"; do
        log "Backing up database: hockey_hub_${db}"
        
        # Check if database service is running
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "postgres-${db}" | grep -q "Up"; then
            # Create backup
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${db}" \
                pg_dump -U postgres --clean --if-exists --create "hockey_hub_${db}" \
                > "$BACKUP_DIR/databases/${db}.sql"
            
            # Compress backup
            gzip "$BACKUP_DIR/databases/${db}.sql"
            
            # Verify backup
            if [ -f "$BACKUP_DIR/databases/${db}.sql.gz" ]; then
                BACKUP_SIZE=$(du -h "$BACKUP_DIR/databases/${db}.sql.gz" | cut -f1)
                log "Database backup completed: ${db} (${BACKUP_SIZE})"
            else
                error "Database backup failed: ${db}"
                return 1
            fi
        else
            warn "Database service not running: postgres-${db}"
        fi
    done
    
    # Backup Redis
    log "Backing up Redis..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps redis | grep -q "Up"; then
        # Create Redis backup
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis \
            redis-cli --rdb - > "$BACKUP_DIR/databases/redis.rdb"
        
        # Compress Redis backup
        gzip "$BACKUP_DIR/databases/redis.rdb"
        
        if [ -f "$BACKUP_DIR/databases/redis.rdb.gz" ]; then
            REDIS_SIZE=$(du -h "$BACKUP_DIR/databases/redis.rdb.gz" | cut -f1)
            log "Redis backup completed (${REDIS_SIZE})"
        else
            error "Redis backup failed"
            return 1
        fi
    else
        warn "Redis service not running"
    fi
    
    log "Database backup completed ✓"
}

backup_files() {
    info "Backing up files..."
    
    # Create files backup directory
    mkdir -p "$BACKUP_DIR/files"
    
    # Backup uploaded files (if using local storage)
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        log "Backing up uploaded files..."
        tar -czf "$BACKUP_DIR/files/uploads.tar.gz" -C "$PROJECT_ROOT" uploads/
        
        UPLOADS_SIZE=$(du -h "$BACKUP_DIR/files/uploads.tar.gz" | cut -f1)
        log "Uploads backup completed (${UPLOADS_SIZE})"
    fi
    
    # Backup SSL certificates
    if [ -d "/etc/letsencrypt" ]; then
        log "Backing up SSL certificates..."
        sudo tar -czf "$BACKUP_DIR/files/ssl_certificates.tar.gz" -C /etc letsencrypt/
        
        SSL_SIZE=$(du -h "$BACKUP_DIR/files/ssl_certificates.tar.gz" | cut -f1)
        log "SSL certificates backup completed (${SSL_SIZE})"
    fi
    
    # Backup log files
    LOG_DIRS=("/var/log/hockey-hub" "/var/log/nginx")
    for log_dir in "${LOG_DIRS[@]}"; do
        if [ -d "$log_dir" ]; then
            LOG_NAME=$(basename "$log_dir")
            log "Backing up logs: $LOG_NAME"
            tar -czf "$BACKUP_DIR/files/${LOG_NAME}_logs.tar.gz" -C "$(dirname "$log_dir")" "$LOG_NAME/"
            
            LOG_SIZE=$(du -h "$BACKUP_DIR/files/${LOG_NAME}_logs.tar.gz" | cut -f1)
            log "Log backup completed: $LOG_NAME (${LOG_SIZE})"
        fi
    done
    
    log "File backup completed ✓"
}

backup_configuration() {
    info "Backing up configuration..."
    
    # Create config backup directory
    mkdir -p "$BACKUP_DIR/config"
    
    # Backup Docker Compose files
    log "Backing up Docker Compose configuration..."
    cp "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/config/"
    cp "$PROJECT_ROOT/.env.production" "$BACKUP_DIR/config/" 2>/dev/null || warn ".env.production not found"
    
    # Backup Nginx configuration
    if [ -d "$PROJECT_ROOT/nginx" ]; then
        tar -czf "$BACKUP_DIR/config/nginx_config.tar.gz" -C "$PROJECT_ROOT" nginx/
        log "Nginx configuration backed up"
    fi
    
    # Backup monitoring configuration
    if [ -d "$PROJECT_ROOT/monitoring" ]; then
        tar -czf "$BACKUP_DIR/config/monitoring_config.tar.gz" -C "$PROJECT_ROOT" monitoring/
        log "Monitoring configuration backed up"
    fi
    
    # Backup Kubernetes manifests (if they exist)
    if [ -d "$PROJECT_ROOT/k8s" ]; then
        tar -czf "$BACKUP_DIR/config/k8s_manifests.tar.gz" -C "$PROJECT_ROOT" k8s/
        log "Kubernetes manifests backed up"
    fi
    
    # Backup scripts
    tar -czf "$BACKUP_DIR/config/scripts.tar.gz" -C "$PROJECT_ROOT" scripts/
    log "Scripts backed up"
    
    # Create system info
    cat > "$BACKUP_DIR/config/system_info.txt" << EOF
Hostname: $(hostname)
OS: $(uname -a)
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)
Disk Usage: $(df -h)
Memory Usage: $(free -h)
Running Services: $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps)
EOF
    
    log "Configuration backup completed ✓"
}

create_backup_manifest() {
    info "Creating backup manifest..."
    
    # Create backup manifest with checksums
    find "$BACKUP_DIR" -type f -exec sha256sum {} \; > "$BACKUP_DIR/MANIFEST.sha256"
    
    # Create backup summary
    cat > "$BACKUP_DIR/BACKUP_SUMMARY.txt" << EOF
Hockey Hub Backup Summary
========================

Backup Type: $BACKUP_TYPE
Timestamp: $BACKUP_TIMESTAMP
Environment: $ENVIRONMENT
Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)

Contents:
$(find "$BACKUP_DIR" -type f -exec ls -lh {} \; | awk '{print $9 " (" $5 ")"}')

Checksums:
$(cat "$BACKUP_DIR/MANIFEST.sha256")
EOF
    
    log "Backup manifest created ✓"
}

upload_to_s3() {
    if [ "$S3_ENABLED" != "true" ]; then
        return 0
    fi
    
    info "Uploading backup to S3..."
    
    # Create compressed archive
    ARCHIVE_NAME="hockey-hub-backup-${BACKUP_TIMESTAMP}.tar.gz"
    tar -czf "/tmp/${ARCHIVE_NAME}" -C "$BACKUP_BASE_DIR" "$BACKUP_TIMESTAMP"
    
    # Upload to S3
    aws s3 cp "/tmp/${ARCHIVE_NAME}" "s3://${S3_BUCKET}/${ARCHIVE_NAME}" --region "$S3_REGION"
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3: s3://${S3_BUCKET}/${ARCHIVE_NAME}"
        
        # Clean up local archive
        rm "/tmp/${ARCHIVE_NAME}"
    else
        error "Failed to upload backup to S3"
        return 1
    fi
    
    # Clean up old S3 backups
    log "Cleaning up old S3 backups (retention: ${RETENTION_DAYS} days)..."
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
    
    aws s3 ls "s3://${S3_BUCKET}/" | while read -r line; do
        OBJECT_DATE=$(echo "$line" | awk '{print $1}' | tr -d '-')
        OBJECT_NAME=$(echo "$line" | awk '{print $4}')
        
        if [ "$OBJECT_DATE" -lt "$CUTOFF_DATE" ]; then
            aws s3 rm "s3://${S3_BUCKET}/${OBJECT_NAME}"
            log "Deleted old S3 backup: ${OBJECT_NAME}"
        fi
    done
    
    log "S3 upload completed ✓"
}

cleanup_old_backups() {
    info "Cleaning up old local backups..."
    
    # Find and remove old backups
    find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "????????_??????" -mtime +$RETENTION_DAYS -exec rm -rf {} \;
    
    # List remaining backups
    BACKUP_COUNT=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "????????_??????" | wc -l)
    log "Local backup cleanup completed. Remaining backups: $BACKUP_COUNT"
}

verify_backup() {
    info "Verifying backup integrity..."
    
    # Verify checksums
    if cd "$BACKUP_DIR" && sha256sum -c MANIFEST.sha256 --quiet; then
        log "Backup integrity verification passed ✓"
    else
        error "Backup integrity verification failed!"
        return 1
    fi
    
    # Check backup completeness based on type
    case "$BACKUP_TYPE" in
        "full")
            [ -d "$BACKUP_DIR/databases" ] && [ -d "$BACKUP_DIR/files" ] && [ -d "$BACKUP_DIR/config" ]
            ;;
        "databases")
            [ -d "$BACKUP_DIR/databases" ]
            ;;
        "files")
            [ -d "$BACKUP_DIR/files" ]
            ;;
        "config")
            [ -d "$BACKUP_DIR/config" ]
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log "Backup completeness verification passed ✓"
    else
        error "Backup completeness verification failed!"
        return 1
    fi
}

# =============================================================================
# Main Backup Function
# =============================================================================

main() {
    log "Starting Hockey Hub backup (type: $BACKUP_TYPE)"
    log "Backup directory: $BACKUP_DIR"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup directory
    create_backup_directory
    
    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "full")
            backup_databases
            backup_files
            backup_configuration
            ;;
        "databases")
            backup_databases
            ;;
        "files")
            backup_files
            ;;
        "config")
            backup_configuration
            ;;
        *)
            error "Invalid backup type: $BACKUP_TYPE"
            show_usage
            exit 1
            ;;
    esac
    
    # Create backup manifest
    create_backup_manifest
    
    # Verify backup
    if verify_backup; then
        log "Backup verification successful ✓"
    else
        error "Backup verification failed!"
        exit 1
    fi
    
    # Upload to S3 if enabled
    upload_to_s3
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Final summary
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "Backup completed successfully! 🎉"
    info "==================================="
    info "Backup Summary:"
    info "Type: $BACKUP_TYPE"
    info "Location: $BACKUP_DIR"
    info "Size: $BACKUP_SIZE"
    info "Timestamp: $BACKUP_TIMESTAMP"
    if [ "$S3_ENABLED" = "true" ]; then
        info "S3 Location: s3://${S3_BUCKET}/hockey-hub-backup-${BACKUP_TIMESTAMP}.tar.gz"
    fi
    info "==================================="
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
trap 'error "Backup interrupted by user"; exit 130' INT TERM

# Run main function
main

exit 0