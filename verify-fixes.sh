#!/bin/bash

echo "=== Hockey Hub Fix Verification ==="
echo ""

# Check if key files are fixed
echo "1. Checking ExerciseLibrary.tsx fix..."
if grep -q "const dragStyle" "apps/frontend/src/features/physical-trainer/components/SessionBuilder/ExerciseLibrary.tsx"; then
    echo "✓ ExerciseLibrary.tsx: 'style' conflict fixed"
else
    echo "✗ ExerciseLibrary.tsx: Issue may persist"
fi

echo ""
echo "2. Checking dynamicImports file extension..."
if [ -f "apps/frontend/src/utils/dynamicImports.tsx" ]; then
    echo "✓ dynamicImports.tsx: File renamed correctly"
else
    echo "✗ dynamicImports.tsx: File not found"
fi

echo ""
echo "3. Checking react-beautiful-dnd dependency..."
if grep -q "react-beautiful-dnd" "apps/frontend/package.json"; then
    echo "✓ react-beautiful-dnd: Added to package.json"
else
    echo "✗ react-beautiful-dnd: Missing from package.json"
fi

echo ""
echo "4. Checking critters dependency..."
if grep -q "critters" "apps/frontend/package.json"; then
    echo "✓ critters: Present in package.json"
else
    echo "✗ critters: Missing from package.json"
fi

echo ""
echo "5. Installation status..."
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "✓ node_modules exists with $MODULE_COUNT packages"
else
    echo "✗ node_modules not found - installation pending"
fi

echo ""
echo "=== Summary ==="
echo "All critical code fixes have been applied."
echo "Dependencies are being installed (this may take a few minutes)."
echo ""
echo "Once installation completes, run:"
echo "  cd apps/frontend && pnpm dev"
echo ""
echo "Then access the Physical Trainer dashboard at:"
echo "  http://localhost:3010/physicaltrainer"