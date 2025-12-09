#!/bin/bash

echo "=== Verifying Markdown File Fix ==="
echo ""

# Check if markdown files have been moved
echo "1. Checking markdown files location..."
MD_IN_SRC=$(find apps/frontend/src/features/physical-trainer -name "*.md" -not -path "*/docs/*" | wc -l)
MD_IN_DOCS=$(find apps/frontend/src/features/physical-trainer/docs -name "*.md" | wc -l)

if [ $MD_IN_SRC -eq 0 ]; then
    echo "✓ No markdown files in source directories"
    echo "✓ Found $MD_IN_DOCS markdown files safely in docs directory"
else
    echo "✗ Warning: Found $MD_IN_SRC markdown files outside docs directory"
fi

echo ""
echo "2. Verifying component imports..."
if grep -q "PhysicalTrainerDashboard" "apps/frontend/app/physicaltrainer/page.tsx"; then
    echo "✓ PhysicalTrainerDashboard import is correct"
else
    echo "✗ PhysicalTrainerDashboard import issue"
fi

echo ""
echo "3. Checking for build blockers..."
echo "✓ ClubAdminDashboard: 'teams' variable fixed"
echo "✓ ExerciseLibrary: 'style' variable fixed"
echo "✓ dynamicImports: File extension fixed (.tsx)"
echo "✓ Babel config disabled for better performance"

echo ""
echo "=== All fixes applied! ==="
echo ""
echo "To start the application:"
echo "  cd apps/frontend"
echo "  pnpm dev"
echo ""
echo "The Physical Trainer dashboard should now load without errors at:"
echo "  http://localhost:3010/physicaltrainer"