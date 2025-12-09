# Claude Code Slash Commands

This directory contains custom slash commands for use with Claude Code.

## Available Commands

### /update-docs

Automatically updates documentation files (README.md, CLAUDE.md, etc.) based on recent code changes.

**Usage:**
```bash
/update-docs              # Update all documentation
/update-docs --dry-run    # Preview changes without modifying files
/update-docs --verbose    # Show detailed output
/update-docs --commit     # Auto-commit changes after updating
```

**Features:**
- Detects recent git changes
- Updates CLAUDE.md with recent changes and metrics
- Updates README files when dependencies change
- Validates documentation links
- Can be triggered automatically via git hooks

**Installation:**
1. The command is already set up in `.claude/commands/update-docs.md`
2. To enable automatic updates on git commits:
   ```bash
   bash .claude/scripts/install-git-hooks.sh
   ```

**Scripts:**
- `.claude/scripts/update-docs-simple.js` - Basic updater (fast, recommended)
- `.claude/scripts/update-docs.js` - Standard updater
- `.claude/scripts/update-docs-advanced.js` - Advanced updater with full analysis

## Creating New Commands

To create a new slash command:

1. Create a markdown file in `.claude/commands/` with your command name
2. Document the command usage and implementation
3. Create corresponding scripts in `.claude/scripts/`
4. Test the command thoroughly

## Command Structure

Each command should have:
- Clear usage instructions
- Options documentation
- Examples
- Error handling
- Integration instructions

## Best Practices

1. Keep commands focused on a single task
2. Provide dry-run options for safety
3. Use clear output messages
4. Handle errors gracefully
5. Document all options and behaviors