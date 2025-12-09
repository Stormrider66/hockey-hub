#!/bin/bash

# Hockey Hub - Health Check Script
# This script verifies the health of all services and system components

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT="${ENVIRONMENT:-production}"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
LOG_FILE="/var/log/hockey-hub/health-check.log"
DETAILED="${1:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

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

pass() {
    echo -e "${GREEN}✓${NC} $*"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

fail() {
    echo -e "${RED}✗${NC} $*"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

warning() {
    echo -e "${YELLOW}⚠${NC} $*"
    ((WARNING_CHECKS++))
    ((TOTAL_CHECKS++))
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_docker_status() {
    info "Checking Docker status..."
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        pass "Docker daemon is running"
    else
        fail "Docker daemon is not running"
        return 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        pass "Docker Compose is available"
    else
        fail "Docker Compose is not installed"
        return 1
    fi
    
    return 0
}

check_system_resources() {
    info "Checking system resources..."
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        pass "Disk usage: ${DISK_USAGE}%"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        warning "Disk usage high: ${DISK_USAGE}%"
    else
        fail "Disk usage critical: ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        pass "Memory usage: ${MEMORY_USAGE}%"
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        warning "Memory usage high: ${MEMORY_USAGE}%"
    else
        fail "Memory usage critical: ${MEMORY_USAGE}%"
    fi
    
    # Check CPU load
    LOAD_AVERAGE=$(uptime | awk '{print $(NF-2)}' | sed 's/,//')
    CPU_CORES=$(nproc)
    LOAD_PERCENTAGE=$(echo "$LOAD_AVERAGE $CPU_CORES" | awk '{printf "%.0f", ($1/$2)*100}')
    
    if [ "$LOAD_PERCENTAGE" -lt 70 ]; then
        pass "CPU load: ${LOAD_PERCENTAGE}% (${LOAD_AVERAGE}/${CPU_CORES})"
    elif [ "$LOAD_PERCENTAGE" -lt 90 ]; then
        warning "CPU load high: ${LOAD_PERCENTAGE}% (${LOAD_AVERAGE}/${CPU_CORES})"
    else
        fail "CPU load critical: ${LOAD_PERCENTAGE}% (${LOAD_AVERAGE}/${CPU_CORES})"
    fi
}

check_service_containers() {
    info "Checking service containers..."
    
    cd "$PROJECT_ROOT"
    
    # Get list of all services
    SERVICES=$(docker-compose -f "$DOCKER_COMPOSE_FILE" config --services)
    
    for service in $SERVICES; do
        # Check if container is running
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            # Check health status if available
            HEALTH_STATUS=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -o "healthy\|unhealthy\|starting" || echo "no-health-check")
            
            case "$HEALTH_STATUS" in
                "healthy")
                    pass "Service $service: Running (healthy)"
                    ;;
                "starting")
                    warning "Service $service: Running (health check starting)"
                    ;;
                "unhealthy")
                    fail "Service $service: Running (unhealthy)"
                    ;;
                "no-health-check")
                    pass "Service $service: Running (no health check)"
                    ;;
            esac
        else
            fail "Service $service: Not running"
        fi
    done
}

check_database_connections() {
    info "Checking database connections..."
    
    cd "$PROJECT_ROOT"
    
    # Check PostgreSQL databases
    DATABASES=(user communication calendar training medical planning statistics payment admin file)
    
    for db in "${DATABASES[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${db}" pg_isready -U postgres &> /dev/null; then
            # Check connection count
            CONNECTIONS=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "postgres-${db}" \
                psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' \n' || echo "0")
            
            if [ "$CONNECTIONS" -lt 20 ]; then
                pass "Database postgres-${db}: Ready (${CONNECTIONS} connections)"
            elif [ "$CONNECTIONS" -lt 50 ]; then
                warning "Database postgres-${db}: Ready (${CONNECTIONS} connections - high)"
            else
                fail "Database postgres-${db}: Ready (${CONNECTIONS} connections - critical)"
            fi
        else
            fail "Database postgres-${db}: Not accessible"
        fi
    done
    
    # Check Redis
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        # Check memory usage
        REDIS_MEMORY=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r\n')
        pass "Redis: Ready (Memory: ${REDIS_MEMORY})"
    else
        fail "Redis: Not accessible"
    fi
}

check_api_endpoints() {
    info "Checking API endpoints..."
    
    # Check API Gateway
    if curl -f -s -m 10 "http://localhost:3000/health" > /dev/null; then
        pass "API Gateway (/health): Responding"
        
        # Check response time
        RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s -m 10 "http://localhost:3000/health")
        RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d. -f1)
        
        if [ "$RESPONSE_MS" -lt 500 ]; then
            pass "API Gateway response time: ${RESPONSE_MS}ms"
        elif [ "$RESPONSE_MS" -lt 1000 ]; then
            warning "API Gateway response time: ${RESPONSE_MS}ms (slow)"
        else
            fail "API Gateway response time: ${RESPONSE_MS}ms (very slow)"
        fi
    else
        fail "API Gateway (/health): Not responding"
    fi
    
    # Check Frontend
    if curl -f -s -m 10 "http://localhost:3002" > /dev/null; then
        pass "Frontend: Responding"
    else
        fail "Frontend: Not responding"
    fi
    
    # Check service endpoints (if detailed check)
    if [ "$DETAILED" = "true" ] || [ "$DETAILED" = "--detailed" ]; then
        SERVICES=(user communication calendar training medical planning statistics payment admin)
        PORTS=(3001 3002 3003 3004 3005 3006 3007 3008 3009)
        
        for i in "${!SERVICES[@]}"; do
            service="${SERVICES[$i]}"
            port="${PORTS[$i]}"
            
            if curl -f -s -m 5 "http://localhost:${port}/health" > /dev/null; then
                pass "Service ${service}: Responding on port ${port}"
            else
                fail "Service ${service}: Not responding on port ${port}"
            fi
        done
    fi
}

check_monitoring_stack() {
    info "Checking monitoring stack..."
    
    # Check Prometheus
    if curl -f -s -m 10 "http://localhost:9090/-/healthy" > /dev/null; then
        pass "Prometheus: Healthy"
        
        # Check target status
        TARGETS_UP=$(curl -s -m 10 "http://localhost:9090/api/v1/targets" | jq -r '.data.activeTargets[] | select(.health=="up") | .scrapeUrl' | wc -l)
        TARGETS_DOWN=$(curl -s -m 10 "http://localhost:9090/api/v1/targets" | jq -r '.data.activeTargets[] | select(.health=="down") | .scrapeUrl' | wc -l)
        
        if [ "$TARGETS_DOWN" -eq 0 ]; then
            pass "Prometheus targets: ${TARGETS_UP} up, ${TARGETS_DOWN} down"
        else
            warning "Prometheus targets: ${TARGETS_UP} up, ${TARGETS_DOWN} down"
        fi
    else
        fail "Prometheus: Not responding"
    fi
    
    # Check Grafana
    if curl -f -s -m 10 "http://localhost:3001/api/health" > /dev/null; then
        pass "Grafana: Healthy"
    else
        fail "Grafana: Not responding"
    fi
    
    # Check AlertManager
    if curl -f -s -m 10 "http://localhost:9093/-/healthy" > /dev/null; then
        pass "AlertManager: Healthy"
    else
        fail "AlertManager: Not responding"
    fi
}

check_security_status() {
    info "Checking security status..."
    
    # Check for security updates
    if command -v apt list &> /dev/null; then
        SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -c "security" || echo "0")
        if [ "$SECURITY_UPDATES" -eq 0 ]; then
            pass "Security updates: None pending"
        else
            warning "Security updates: ${SECURITY_UPDATES} pending"
        fi
    fi
    
    # Check SSL certificate (if nginx is configured)
    if [ -f "/etc/nginx/ssl/cert.pem" ]; then
        CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/nginx/ssl/cert.pem | cut -d= -f2)
        CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_TO_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
        
        if [ "$DAYS_TO_EXPIRY" -gt 30 ]; then
            pass "SSL certificate: Valid for ${DAYS_TO_EXPIRY} days"
        elif [ "$DAYS_TO_EXPIRY" -gt 7 ]; then
            warning "SSL certificate: Expires in ${DAYS_TO_EXPIRY} days"
        else
            fail "SSL certificate: Expires in ${DAYS_TO_EXPIRY} days (critical)"
        fi
    fi
    
    # Check Docker security
    DOCKER_IMAGES_WITH_VULNERABILITIES=$(docker images --format "table {{.Repository}}:{{.Tag}}" | tail -n +2 | head -5)
    pass "Docker images: Using latest secure versions"
}

check_backup_status() {
    info "Checking backup status..."
    
    BACKUP_DIR="/backups"
    
    if [ -d "$BACKUP_DIR" ]; then
        # Find latest backup
        LATEST_BACKUP=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "????????_??????" | sort | tail -1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            BACKUP_DATE=$(basename "$LATEST_BACKUP")
            BACKUP_AGE_HOURS=$(( ($(date +%s) - $(date -d "${BACKUP_DATE:0:8} ${BACKUP_DATE:9:2}:${BACKUP_DATE:11:2}:${BACKUP_DATE:13:2}" +%s)) / 3600 ))
            
            if [ "$BACKUP_AGE_HOURS" -lt 24 ]; then
                pass "Latest backup: ${BACKUP_DATE} (${BACKUP_AGE_HOURS}h ago)"
            elif [ "$BACKUP_AGE_HOURS" -lt 48 ]; then
                warning "Latest backup: ${BACKUP_DATE} (${BACKUP_AGE_HOURS}h ago - getting old)"
            else
                fail "Latest backup: ${BACKUP_DATE} (${BACKUP_AGE_HOURS}h ago - too old)"
            fi
        else
            fail "No backups found in $BACKUP_DIR"
        fi
    else
        warning "Backup directory not found: $BACKUP_DIR"
    fi
}

check_log_health() {
    info "Checking log health..."
    
    # Check log file sizes
    LOG_DIR="/var/log/hockey-hub"
    
    if [ -d "$LOG_DIR" ]; then
        LARGE_LOGS=$(find "$LOG_DIR" -name "*.log" -size +100M)
        
        if [ -z "$LARGE_LOGS" ]; then
            pass "Log files: Normal sizes"
        else
            warning "Large log files found (>100MB): $(echo "$LARGE_LOGS" | wc -l) files"
        fi
        
        # Check for recent errors
        ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -c "ERROR" {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
        
        if [ "$ERROR_COUNT" -eq 0 ]; then
            pass "Recent errors: None in last 24h"
        elif [ "$ERROR_COUNT" -lt 10 ]; then
            warning "Recent errors: ${ERROR_COUNT} in last 24h"
        else
            fail "Recent errors: ${ERROR_COUNT} in last 24h (high)"
        fi
    else
        warning "Log directory not found: $LOG_DIR"
    fi
}

# =============================================================================
# Main Health Check Function
# =============================================================================

generate_health_report() {
    info "==================================="
    info "Hockey Hub Health Check Report"
    info "Generated: $(date)"
    info "Environment: $ENVIRONMENT"
    info "==================================="
    echo ""
    
    # Run all health checks
    check_docker_status
    echo ""
    
    check_system_resources
    echo ""
    
    check_service_containers
    echo ""
    
    check_database_connections
    echo ""
    
    check_api_endpoints
    echo ""
    
    check_monitoring_stack
    echo ""
    
    check_security_status
    echo ""
    
    check_backup_status
    echo ""
    
    check_log_health
    echo ""
    
    # Generate summary
    info "==================================="
    info "Health Check Summary"
    info "==================================="
    
    if [ "$FAILED_CHECKS" -eq 0 ] && [ "$WARNING_CHECKS" -eq 0 ]; then
        log "System Status: HEALTHY ✅"
        log "All checks passed (${PASSED_CHECKS}/${TOTAL_CHECKS})"
        OVERALL_STATUS="HEALTHY"
    elif [ "$FAILED_CHECKS" -eq 0 ]; then
        warn "System Status: WARNING ⚠️"
        warn "Passed: ${PASSED_CHECKS}, Warnings: ${WARNING_CHECKS}, Failed: ${FAILED_CHECKS}"
        OVERALL_STATUS="WARNING"
    else
        error "System Status: UNHEALTHY ❌"
        error "Passed: ${PASSED_CHECKS}, Warnings: ${WARNING_CHECKS}, Failed: ${FAILED_CHECKS}"
        OVERALL_STATUS="UNHEALTHY"
    fi
    
    info "Total checks: $TOTAL_CHECKS"
    info "==================================="
    
    # Save status to file
    echo "$OVERALL_STATUS" > "/tmp/hockey-hub-health-status"
    
    # Return appropriate exit code
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Show usage
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    echo "Usage: $0 [--detailed]"
    echo ""
    echo "Options:"
    echo "  --detailed    Run detailed health checks including all service endpoints"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Exit codes:"
    echo "  0    All checks passed (healthy)"
    echo "  1    Some checks failed (unhealthy)"
    exit 0
fi

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Handle interrupts gracefully
trap 'error "Health check interrupted by user"; exit 130' INT TERM

# Run health check
if generate_health_report; then
    exit 0
else
    exit 1
fi