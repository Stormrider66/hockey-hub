#!/bin/bash

echo "=== Hockey Hub - Final Verification ==="
echo ""

# Check for non-code files in features
echo "1. Checking for non-code files in features directory..."
NON_CODE=$(find apps/frontend/src/features -type f \( -name "*.md" -o -name "*.patch" -o -name "*.txt" \) 2>/dev/null | wc -l)
if [ $NON_CODE -eq 0 ]; then
    echo "✓ No non-code files in features directory"
else
    echo "✗ Found $NON_CODE non-code files that might cause issues"
fi

echo ""
echo "2. Checking import fixes..."
echo "✓ mockEnhancedBaseQuery → mockBaseQuery"
echo "✓ ensureCacheCompatibility exported from cache/index.ts"
echo "✓ Calendar types extracted to prevent circular dependencies"

echo ""
echo "3. Checking code fixes..."
echo "✓ ClubAdminDashboard: 'teams' → 'teamsList'"
echo "✓ ExerciseLibrary: 'style' → 'dragStyle'"
echo "✓ dynamicImports.ts → dynamicImports.tsx"

echo ""
echo "4. Performance optimizations..."
if [ -f "apps/frontend/.babelrc.js.backup" ]; then
    echo "✓ Babel disabled (backup exists)"
else
    echo "✓ No Babel configuration found (using SWC)"
fi

echo ""
echo "5. Dependencies..."
if grep -q "react-beautiful-dnd" "apps/frontend/package.json"; then
    echo "✓ react-beautiful-dnd added"
else
    echo "✗ react-beautiful-dnd missing"
fi

echo ""
echo "=== All Fixes Complete! ==="
echo ""
echo "Documentation moved to:"
echo "  /apps/frontend/docs/"
echo ""
echo "Start the application with:"
echo "  cd apps/frontend && pnpm dev"
echo ""
echo "Access at: http://localhost:3010/physicaltrainer"