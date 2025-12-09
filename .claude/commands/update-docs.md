# Update Documentation Command

This slash command automatically updates all README files, documentation, and CLAUDE.md whenever successful changes are made to the codebase.

## Usage

```
/update-docs [options]
```

## Options

- `--all` - Update all documentation files
- `--readme` - Update only README files
- `--claude` - Update only CLAUDE.md
- `--dry-run` - Show what would be updated without making changes
- `--auto` - Enable automatic updates on successful git commits

## What It Does

1. **Scans for Changes**: Detects recent code changes in the repository
2. **Identifies Affected Docs**: Finds documentation that references changed code
3. **Updates Documentation**:
   - Feature lists in README files
   - API documentation
   - Architecture diagrams
   - CLAUDE.md context
   - Test coverage reports
   - Technical improvement logs
4. **Validates Updates**: Ensures all links and references are valid
5. **Commits Changes**: Optionally commits documentation updates

## Implementation

The command performs the following steps:

### 1. Change Detection
```bash
# Get recent changes
git diff --name-only HEAD~1 HEAD

# Analyze changed files
# - New features added
# - APIs modified
# - Dependencies updated
# - Tests added/modified
```

### 2. Documentation Scanning
```bash
# Find all documentation files
find . -name "*.md" -type f | grep -E "(README|DOCUMENTATION|GUIDE|docs/)"

# Check CLAUDE.md
if [ -f "CLAUDE.md" ]; then
  echo "Found CLAUDE.md for updates"
fi
```

### 3. Update Logic

#### README Updates
- Update feature lists based on new components
- Update status badges (tests, coverage, build)
- Update installation instructions if dependencies changed
- Update API endpoints if routes changed

#### CLAUDE.md Updates
- Update "Recent Updates" section with latest changes
- Update technical metrics (coverage, TypeScript safety)
- Update active development areas
- Update file modification lists
- Update achievement sections

#### Documentation Updates
- Update API documentation for new/modified endpoints
- Update architecture diagrams for structural changes
- Update user guides for UI changes
- Update technical improvement logs

### 4. Validation
```bash
# Validate all markdown links
find . -name "*.md" -exec markdown-link-check {} \;

# Check for broken references
grep -r "\[.*\](" *.md | grep -v "http"
```

### 5. Git Integration

For automatic updates on commits, add this git hook:

```bash
#!/bin/bash
# .git/hooks/post-commit

# Run documentation update
claude code --no-interaction "/update-docs --auto"
```

## Examples

### Update all documentation
```bash
/update-docs --all
```

### Dry run to see what would change
```bash
/update-docs --dry-run
```

### Update only CLAUDE.md
```bash
/update-docs --claude
```

### Enable automatic updates
```bash
/update-docs --auto
```

## Configuration

Create `.claude/update-docs.config.json`:

```json
{
  "autoUpdate": {
    "enabled": true,
    "triggers": ["commit", "merge", "tag"],
    "excludePaths": ["node_modules", ".next", "dist"]
  },
  "documentation": {
    "readme": {
      "updateFeatures": true,
      "updateMetrics": true,
      "updateDependencies": true
    },
    "claude": {
      "updateRecentChanges": true,
      "updateMetrics": true,
      "updateFilesList": true,
      "maxRecentItems": 10
    },
    "api": {
      "generateFromCode": true,
      "updateExamples": true
    }
  },
  "validation": {
    "checkLinks": true,
    "checkReferences": true,
    "failOnError": false
  }
}
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/update-docs.yml
name: Update Documentation

on:
  push:
    branches: [main]
  pull_request:
    types: [closed]

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update Documentation
        run: |
          npx claude-code "/update-docs --all"
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --staged --quiet || git commit -m "📚 Auto-update documentation"
          git push
```

## Smart Updates

The command intelligently updates based on changes:

### Component Changes
- Updates feature lists
- Updates component documentation
- Updates user guides

### API Changes
- Updates endpoint documentation
- Updates request/response examples
- Updates error codes

### Test Changes
- Updates coverage reports
- Updates test statistics in CLAUDE.md
- Updates testing guides

### Configuration Changes
- Updates setup guides
- Updates environment documentation
- Updates deployment guides

### Performance Changes
- Updates performance metrics
- Updates optimization guides
- Updates benchmark results

## Error Handling

The command handles various error scenarios:

- **No changes detected**: Skips update
- **Invalid markdown**: Reports errors but continues
- **Git conflicts**: Prompts for resolution
- **Network issues**: Retries with exponential backoff
- **Large updates**: Processes in batches

## Best Practices

1. **Run before commits**: Ensure docs are updated with code
2. **Use dry-run first**: Preview changes before applying
3. **Configure exclusions**: Avoid updating generated files
4. **Set up automation**: Use git hooks or CI/CD
5. **Review updates**: Manually review automated changes

## Troubleshooting

### Documentation not updating
- Check git status for uncommitted changes
- Verify file paths in config
- Run with `--verbose` flag

### Broken links after update
- Run link checker: `/update-docs --validate`
- Check moved/renamed files
- Update link references

### Performance issues
- Limit scope with specific flags
- Exclude large directories
- Use incremental updates

## Future Enhancements

- AI-powered documentation generation
- Automatic diagram updates
- Video documentation updates
- Multi-language documentation sync
- Documentation versioning