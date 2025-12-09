# PowerShell script to archive redundant root-level documentation files
# This script moves outdated files to the archive directory while keeping essential files

Write-Host "Hockey Hub Root Documentation Archival Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Create archive directory if it doesn't exist
$archiveDir = "archive"
if (!(Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    Write-Host "Created archive directory: $archiveDir" -ForegroundColor Green
}

# Files that should REMAIN in root (do not archive these)
$keepInRoot = @(
    "README.md",
    "CONTRIBUTING.md",
    "CLAUDE.md",
    "DOCUMENTATION-INDEX.md",
    "DEVELOPER-GUIDE.md",
    "USER-MANUAL.md",
    "DEVELOPMENT-WORKFLOW.md",
    "INTERNATIONALIZATION-GUIDE.md",
    "FAQ.md",
    "PLAYER-GUIDE.md",
    "COACH-GUIDE.md",
    "PARENT-GUIDE.md",
    "MEDICAL-STAFF-GUIDE.md",
    "archive-documentation.ps1",
    "archive-root-documentation.ps1",
    "archive-root-docs.ps1"
)

# List of files to archive (redundant/outdated)
$filesToArchive = @(
    # Redundant Quick Start Files
    "QUICK-START.md",
    "QUICK-DEV-START.md",
    "FRONTEND-QUICK-START.md",
    "FRONTEND-START-INSTRUCTIONS.md",
    "START-FRONTEND-FIX.md",
    "QUICK-AUTH-FIX.md",
    "CRITICAL-FIXES-QUICKSTART.md",
    "FRONTEND-MOCK-MODE-GUIDE.md",
    
    # Session/Update Summaries
    "SESSION-SUMMARY-2025-06-27.md",
    "MIGRATION-SUMMARY.md",
    "MIGRATION-STRATEGY.md",
    "I18N-HANDOFF-SUMMARY.md",
    "PHASE5-ADVANCED-FEATURES-SUMMARY.md",
    "PRE-PHASE5-TESTING-SUMMARY.md",
    "CLAUDE-HANDOFF.md",
    "CLAUDE-PNPM-UPDATE.md",
    "claude-memory-system.md",
    
    # Feature Summaries (now consolidated)
    "ICE-COACH-CALENDAR-SUMMARY.md",
    "PARENT-CALENDAR-SUMMARY.md",
    "CHAT-SYSTEM-COMPLETE.md",
    "CHAT-IMPLEMENTATION-CHECKLIST.md",
    
    # Technical Improvements (now consolidated)
    "TYPESCRIPT-ANY-FIXES-SUMMARY.md",
    "TYPESCRIPT-IMPROVEMENTS-SUMMARY.md",
    "REDIS-CACHE-OPTIMIZATION-SUMMARY.md",
    "UUID-FOREIGN-KEY-FIXES-SUMMARY.md",
    "PAGINATION-IMPLEMENTATION-SUMMARY.md",
    "PLAYER-DASHBOARD-FIXES-SUMMARY.md",
    "DATABASE-IMPROVEMENTS-SUMMARY.md",
    "DATABASE-FINAL-SUMMARY.md",
    "DATABASE-COMPLETE-SUMMARY.md",
    "DATABASE-PHASE3-SUMMARY.md",
    
    # Test Reports (now consolidated)
    "PLAYER-DASHBOARD-TEST-REPORT.md",
    "PHYSICAL-TRAINER-TEST-REPORT.md",
    "PHYSICAL-TRAINER-TEST.md",
    "TEST-COVERAGE-REPORT.md",
    "CONSOLIDATED-TEST-REPORT.md",
    "PLAYER-DASHBOARD-VERIFICATION-CHECKLIST.md",
    "INTEGRATION-TESTS.md",
    
    # Implementation Analysis (historical)
    "PHYSICAL-TRAINER-API-ANALYSIS.md",
    "PHYSICAL-TRAINER-DASHBOARD-ANALYSIS.md",
    "BACKEND-SERVICES-REVIEW.md",
    "CODEBASE-REVIEW-SUMMARY.md",
    "API-DOCUMENTATION-SUMMARY.md",
    
    # Temporary Fix Files
    "FIX-DEPENDENCIES.md",
    "FIXES-APPLIED.md",
    "PORT-UPDATE-SUMMARY.md",
    "PORT-3002-SEARCH-RESULTS.md",
    "FRONTEND-API-GATEWAY-UPDATE.md",
    "JWT_SECRETS_UPDATE_SUMMARY.md",
    
    # Other Redundant Files
    "INSTALLATION-STATUS.md",
    "SECURITY-AUDIT-CHECKLIST.md",
    "TECHNICAL-ISSUES-CHECKLIST.md",
    "IMPROVEMENT-PLAN.md",
    
    # Consolidated files created during reorganization
    "HOCKEY-HUB-FEATURES-OVERVIEW.md",
    "TECHNICAL-IMPROVEMENTS-CONSOLIDATED.md",
    "COMPREHENSIVE-QUICK-START.md"
)

# Counter for archived files
$archivedCount = 0
$skippedCount = 0
$notFoundCount = 0

Write-Host "`nAnalyzing root directory .md files..." -ForegroundColor Yellow

# Get all .md files in root
$allMdFiles = Get-ChildItem -Path "." -Filter "*.md" -File | Select-Object -ExpandProperty Name

Write-Host "Found $($allMdFiles.Count) .md files in root directory`n" -ForegroundColor Cyan

# Archive files
foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination "$archiveDir/$file" -Force -ErrorAction Stop
            Write-Host "[OK] Archived: $file" -ForegroundColor Green
            $archivedCount++
        }
        catch {
            Write-Host "[ERROR] Failed to archive: $file - $_" -ForegroundColor Red
        }
    }
    else {
        $notFoundCount++
    }
}

# Show which files are being kept
Write-Host "`nFiles kept in root:" -ForegroundColor Yellow
foreach ($file in $allMdFiles) {
    if ($keepInRoot -contains $file) {
        Write-Host "[KEEP] $file" -ForegroundColor Blue
        $skippedCount++
    }
    elseif ($filesToArchive -notcontains $file) {
        # File not in either list
        Write-Host "[UNKNOWN] $file" -ForegroundColor Yellow
    }
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "Archival Summary:" -ForegroundColor Cyan
Write-Host "- Files archived: $archivedCount" -ForegroundColor Green
Write-Host "- Files kept in root: $skippedCount" -ForegroundColor Blue
Write-Host "- Files not found: $notFoundCount" -ForegroundColor Gray
Write-Host "- Archive location: $archiveDir" -ForegroundColor Yellow

Write-Host "`nRoot documentation cleanup complete!" -ForegroundColor Green
Write-Host "The root directory now contains only essential documentation." -ForegroundColor Cyan

# Create archive README if it doesn't exist
$archiveReadme = "$archiveDir/README.md"
if (!(Test-Path $archiveReadme)) {
    $readmeContent = @"
# Archived Documentation

This directory contains historical and redundant documentation files that have been consolidated into the main documentation structure.

## Why These Files Were Archived

These files were moved here to:
- Keep the root directory clean and focused
- Preserve historical information for reference
- Reduce confusion from multiple versions
- Maintain a single source of truth

## Finding Current Documentation

All important information from these files has been consolidated into:
- `docs/` - Main documentation directory
- `DOCUMENTATION-INDEX.md` - Complete documentation index
- `CLAUDE.md` - Current project status and memory bank

## Consolidated Documentation Mapping

- **Quick Start Guides** → `docs/QUICK-START-GUIDE.md`
- **Test Reports** → `docs/reports/test-coverage.md`
- **Feature Summaries** → `docs/FEATURES-OVERVIEW.md`
- **Technical Improvements** → `docs/TECHNICAL-IMPROVEMENTS.md`
- **Security Information** → `docs/SECURITY-GUIDE.md`

Last archived: $(Get-Date -Format "yyyy-MM-dd")
"@
    
    Set-Content -Path $archiveReadme -Value $readmeContent
    Write-Host "`nCreated archive README.md" -ForegroundColor Green
}