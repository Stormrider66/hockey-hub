# PowerShell script to archive redundant documentation files
# This script moves outdated files to the archive directory

Write-Host "Hockey Hub Documentation Archival Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Create archive directory if it doesn't exist
$archiveDir = "docs/archive"
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force
    Write-Host "Created archive directory: $archiveDir" -ForegroundColor Green
}

# List of files to archive (now consolidated)
$filesToArchive = @(
    # Quick Start files (consolidated into docs/QUICK-START-GUIDE.md)
    "QUICK-DEV-START.md",
    "FRONTEND-QUICK-START.md", 
    "FRONTEND-START-INSTRUCTIONS.md",
    "START-FRONTEND-FIX.md",
    "QUICK-AUTH-FIX.md",
    "CRITICAL-FIXES-QUICKSTART.md",
    
    # Test Reports (consolidated into docs/reports/test-coverage.md)
    "PLAYER-DASHBOARD-TEST-REPORT.md",
    "PHYSICAL-TRAINER-TEST-REPORT.md",
    "TEST-COVERAGE-REPORT.md",
    "PLAYER-DASHBOARD-VERIFICATION-CHECKLIST.md",
    
    # Feature Summaries (consolidated into docs/FEATURES-OVERVIEW.md)
    "CHAT-SYSTEM-COMPLETE.md",
    "PHYSICAL-TRAINER-DASHBOARD-ANALYSIS.md",
    "PHYSICAL-TRAINER-API-ANALYSIS.md",
    "ICE-COACH-CALENDAR-SUMMARY.md",
    "PARENT-CALENDAR-SUMMARY.md",
    "I18N-HANDOFF-SUMMARY.md",
    "PHASE5-ADVANCED-FEATURES-SUMMARY.md",
    
    # Technical Improvements (consolidated into docs/TECHNICAL-IMPROVEMENTS.md)
    "TYPESCRIPT-ANY-FIXES-SUMMARY.md",
    "TYPESCRIPT-IMPROVEMENTS-SUMMARY.md",
    "PLAYER-DASHBOARD-FIXES-SUMMARY.md",
    "REDIS-CACHE-OPTIMIZATION-SUMMARY.md",
    "UUID-FOREIGN-KEY-FIXES-SUMMARY.md",
    "PAGINATION-IMPLEMENTATION-SUMMARY.md",
    "DATABASE-IMPROVEMENTS-SUMMARY.md",
    "PORT-UPDATE-SUMMARY.md",
    "FRONTEND-API-GATEWAY-UPDATE.md",
    "JWT_SECRETS_UPDATE_SUMMARY.md",
    
    # Other redundant files
    "FIXES-APPLIED.md",
    "INTEGRATION-TESTS.md",
    "PRE-PHASE5-TESTING-SUMMARY.md",
    "INSTALLATION-STATUS.md",
    "CODEBASE-REVIEW-SUMMARY.md",
    "BACKEND-SERVICES-REVIEW.md",
    "SESSION-SUMMARY-2025-06-27.md",
    "FIX-DEPENDENCIES.md",
    "IMPROVEMENT-PLAN.md",
    "MIGRATION-STRATEGY.md",
    "MIGRATION-SUMMARY.md",
    "TECHNICAL-ISSUES-CHECKLIST.md",
    "SECURITY-AUDIT-CHECKLIST.md",
    "CHAT-IMPLEMENTATION-CHECKLIST.md",
    "DATABASE-FINAL-SUMMARY.md",
    "DATABASE-COMPLETE-SUMMARY.md",
    "DATABASE-PHASE3-SUMMARY.md",
    "API-DOCUMENTATION-SUMMARY.md",
    "CLAUDE-HANDOFF.md",
    "CLAUDE-PNPM-UPDATE.md",
    "PORT-3002-SEARCH-RESULTS.md",
    "PHYSICAL-TRAINER-TEST.md"
)

# Archive consolidated files that were created during the process
$consolidatedFiles = @(
    "COMPREHENSIVE-QUICK-START.md",
    "CONSOLIDATED-TEST-REPORT.md",
    "HOCKEY-HUB-FEATURES-OVERVIEW.md",
    "TECHNICAL-IMPROVEMENTS-CONSOLIDATED.md"
)

$allFiles = $filesToArchive + $consolidatedFiles

# Counter for archived files
$archivedCount = 0
$notFoundCount = 0

Write-Host "`nStarting archival process..." -ForegroundColor Yellow

foreach ($file in $allFiles) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination "$archiveDir/$file" -Force
            Write-Host "✓ Archived: $file" -ForegroundColor Green
            $archivedCount++
        }
        catch {
            Write-Host "✗ Failed to archive: $file - $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "- Not found: $file (may already be archived)" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "Archival Summary:" -ForegroundColor Cyan
Write-Host "- Files archived: $archivedCount" -ForegroundColor Green
Write-Host "- Files not found: $notFoundCount" -ForegroundColor Yellow
Write-Host "- Archive location: $archiveDir" -ForegroundColor Blue

Write-Host "`nDocumentation consolidation complete!" -ForegroundColor Green
Write-Host "See DOCUMENTATION-INDEX.md for the new structure." -ForegroundColor Cyan

# Optional: Display the new documentation structure
Write-Host "`nNew Documentation Structure:" -ForegroundColor Yellow
Write-Host "- docs/README.md (Main hub)" -ForegroundColor White
Write-Host "- docs/QUICK-START-GUIDE.md" -ForegroundColor White
Write-Host "- docs/FEATURES-OVERVIEW.md" -ForegroundColor White
Write-Host "- docs/TECHNICAL-IMPROVEMENTS.md" -ForegroundColor White
Write-Host "- docs/reports/test-coverage.md" -ForegroundColor White
Write-Host "- DOCUMENTATION-INDEX.md (Complete index)" -ForegroundColor White