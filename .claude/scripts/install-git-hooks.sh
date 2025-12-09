#!/bin/bash

# Install git hooks for automatic documentation updates

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "📚 Installing documentation update git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create post-commit hook
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash

# Auto-update documentation after commits
echo "📚 Checking if documentation needs updating..."

# Get the directory of this script
HOOK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$HOOK_DIR/../.." && pwd )"

# Check if update-docs script exists
UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs-advanced.js"
if [ ! -f "$UPDATE_SCRIPT" ]; then
    UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs.js"
fi

if [ -f "$UPDATE_SCRIPT" ]; then
    # Run the documentation update in the background
    (
        cd "$PROJECT_ROOT"
        node "$UPDATE_SCRIPT" --auto 2>&1 | tee -a "$PROJECT_ROOT/.claude/logs/doc-updates.log"
    ) &
    
    echo "📚 Documentation update started in background (check .claude/logs/doc-updates.log)"
else
    echo "⚠️  Documentation update script not found"
fi
EOF

# Create post-merge hook
cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash

# Auto-update documentation after merges
echo "📚 Updating documentation after merge..."

# Get the directory of this script
HOOK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$HOOK_DIR/../.." && pwd )"

# Check if update-docs script exists
UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs-advanced.js"
if [ ! -f "$UPDATE_SCRIPT" ]; then
    UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs.js"
fi

if [ -f "$UPDATE_SCRIPT" ]; then
    # Run the documentation update
    cd "$PROJECT_ROOT"
    node "$UPDATE_SCRIPT" --commit
else
    echo "⚠️  Documentation update script not found"
fi
EOF

# Create pre-push hook for validation
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# Validate documentation before push
echo "📚 Validating documentation..."

# Get the directory of this script
HOOK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$HOOK_DIR/../.." && pwd )"

# Run documentation validation
UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs-advanced.js"
if [ ! -f "$UPDATE_SCRIPT" ]; then
    UPDATE_SCRIPT="$PROJECT_ROOT/.claude/scripts/update-docs.js"
fi

if [ -f "$UPDATE_SCRIPT" ]; then
    cd "$PROJECT_ROOT"
    node "$UPDATE_SCRIPT" --dry-run --validate
    
    if [ $? -ne 0 ]; then
        echo "❌ Documentation validation failed. Please update documentation before pushing."
        echo "   Run: /update-docs --all"
        exit 1
    fi
fi

exit 0
EOF

# Make hooks executable
chmod +x "$HOOKS_DIR/post-commit"
chmod +x "$HOOKS_DIR/post-merge"
chmod +x "$HOOKS_DIR/pre-push"

# Create logs directory
mkdir -p "$PROJECT_ROOT/.claude/logs"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  - post-commit: Runs documentation update in background"
echo "  - post-merge: Updates documentation after merges"
echo "  - pre-push: Validates documentation before push"
echo ""
echo "To disable hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"