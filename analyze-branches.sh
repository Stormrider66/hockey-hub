#!/bin/bash

echo "=== BRANCH CONTENT ANALYSIS ==="
echo ""

# Current status
CURRENT_BRANCH=$(cat .git/HEAD | sed 's/ref: refs\/heads\///')
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Function to count files and show structure
analyze_branch() {
    local branch=$1
    echo "=== Branch: $branch ==="
    
    # Create temp directory for this branch
    temp_dir="/tmp/branch_${branch//\//_}"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Use git archive to export branch content
    git archive "$branch" | tar -x -C "$temp_dir" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "Services found:"
        ls -la "$temp_dir/services" 2>/dev/null | grep "^d" | awk '{print "  - " $NF}' | grep -v "^\s*-\s*\.$" | grep -v "^\s*-\s*\.\.$"
        
        echo "Apps found:"
        ls -la "$temp_dir/apps" 2>/dev/null | grep "^d" | awk '{print "  - " $NF}' | grep -v "^\s*-\s*\.$" | grep -v "^\s*-\s*\.\.$"
        
        # Count TypeScript/JavaScript files
        echo "Statistics:"
        echo "  - Total TS/JS files: $(find "$temp_dir" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l)"
        echo "  - Frontend components: $(find "$temp_dir/apps/frontend" -name "*.tsx" 2>/dev/null | wc -l)"
        echo "  - Service files: $(find "$temp_dir/services" -name "*.ts" 2>/dev/null | wc -l)"
        
        # Check for key features
        echo "Key features:"
        [ -d "$temp_dir/apps/frontend/src/features/physical-trainer" ] && echo "  ✓ Physical Trainer Dashboard"
        [ -d "$temp_dir/apps/frontend/src/features/calendar" ] && echo "  ✓ Calendar Feature"
        [ -d "$temp_dir/apps/frontend/src/features/chat" ] && echo "  ✓ Chat System"
        [ -d "$temp_dir/services/medical-service" ] && echo "  ✓ Medical Service"
        [ -d "$temp_dir/services/planning-service" ] && echo "  ✓ Planning Service"
        
        # Clean up
        rm -rf "$temp_dir"
    else
        echo "  ERROR: Could not analyze branch (may not exist locally)"
    fi
    echo ""
}

# Analyze each branch
for branch in main develop feature/dashboard-upgrades dependabot/npm_and_yarn/packages/shared-lib/jose-6.0.12; do
    analyze_branch "$branch"
done

echo "=== RECOMMENDATIONS ==="
echo "Based on the analysis above, you can see which branch has the most complete codebase."
echo "The branch with the highest file counts and most features is likely your best starting point."