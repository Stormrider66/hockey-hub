# Test Coverage Setup Guide

## Overview

The Hockey Hub monorepo has comprehensive test coverage reporting configured across all services, packages, and the frontend application. This guide explains how to use the coverage tools and interpret the results.

## Quick Start

### Run Coverage for Entire Monorepo

```bash
# Using pnpm (recommended)
pnpm coverage

# Or use the shell script directly
./scripts/collect-all-coverage.sh

# On Windows
scripts\collect-all-coverage.bat
```

### Run Coverage for Individual Workspaces

```bash
# Frontend
cd apps/frontend
pnpm test:coverage

# Any service
cd services/user-service
pnpm test:coverage

# Any package
cd packages/shared-lib
pnpm test:coverage
```

## Coverage Scripts

### Root Level Scripts

- `pnpm test:coverage` - Run tests with coverage for all workspaces
- `pnpm coverage` - Run tests, merge results, and generate reports
- `pnpm coverage:merge` - Merge coverage from all workspaces
- `pnpm coverage:report` - Generate HTML and other report formats
- `pnpm coverage:badge` - Generate coverage badges for README

### Workspace Level Scripts

All services and packages have these scripts:

- `pnpm test` - Run tests without coverage
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:coverage:watch` - Run tests with coverage in watch mode
- `pnpm test:ci` - Run tests with coverage for CI/CD pipelines

## Coverage Configuration

### Jest Configuration

Each workspace has coverage configured in its `jest.config.js`:

```javascript
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.interface.ts',
  '!src/**/*.dto.ts',
  '!src/**/index.ts',
  '!src/**/__tests__/**',
  '!src/**/__mocks__/**'
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Frontend Specific Configuration

The frontend has additional exclusions:

```javascript
collectCoverageFrom: [
  // ... standard exclusions
  '!app/**/layout.tsx',
  '!app/**/page.tsx',
  '!app/**/providers.tsx',
  '!app/**/loading.tsx',
  '!app/**/error.tsx',
  '!app/**/not-found.tsx'
]
```

## Coverage Reports

### Report Formats

After running coverage, the following reports are generated:

1. **HTML Report** - Interactive web interface at `coverage/index.html`
2. **LCOV** - For CI/CD integration at `coverage/lcov.info`
3. **JSON Summary** - Machine-readable at `coverage/coverage-summary.json`
4. **Text Summary** - Console output and `coverage/text-summary.txt`
5. **Coverage Badges** - SVG badges in `coverage/badges/`

### Viewing HTML Report

```bash
# After running coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Coverage Thresholds

The project enforces these minimum coverage thresholds:

- **Backend Services**: 80% for all metrics
- **Frontend**: 70% for all metrics
- **Shared Libraries**: 80% for all metrics

These thresholds are enforced during:
- Local test runs with coverage
- CI/CD pipeline builds
- Pre-commit hooks (if configured)

## Coverage Badges

After running `pnpm coverage:badge`, badges are generated in `coverage/badges/`:

- `coverage.svg` - Overall line coverage
- `lines.svg` - Line coverage
- `statements.svg` - Statement coverage
- `functions.svg` - Function coverage
- `branches.svg` - Branch coverage

### Adding Badges to README

```markdown
![Coverage](./coverage/badges/coverage.svg)
![Lines](./coverage/badges/lines.svg)
![Statements](./coverage/badges/statements.svg)
![Functions](./coverage/badges/functions.svg)
![Branches](./coverage/badges/branches.svg)
```

## CI/CD Integration

The coverage setup generates a `coverage/coverage-ci.json` file with:

```json
{
  "total": {
    "lines": 85.5,
    "statements": 84.2,
    "functions": 82.1,
    "branches": 78.9
  },
  "timestamp": "2025-07-02T12:00:00Z",
  "passed": true
}
```

This can be used in CI/CD pipelines to:
- Fail builds if coverage drops below thresholds
- Track coverage trends over time
- Generate coverage reports for pull requests

## Troubleshooting

### No Coverage Files Found

If you see "No coverage files found", ensure you:
1. Have run tests with coverage first
2. Are in the root directory of the monorepo
3. Have the correct file permissions

### Coverage Not Updating

Clear the coverage cache:
```bash
rm -rf coverage .nyc_output
find . -name "coverage" -type d -not -path "./node_modules/*" -exec rm -rf {} +
```

### Memory Issues

For large codebases, increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm coverage
```

## Best Practices

1. **Run Coverage Regularly** - Check coverage before committing
2. **Fix Coverage Gaps** - Address files with < 80% coverage
3. **Write Meaningful Tests** - Don't just chase numbers
4. **Update Thresholds** - Gradually increase as coverage improves
5. **Monitor Trends** - Track coverage over time, not just current state

## Integration with Development Workflow

### Pre-commit Hook

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests with coverage for changed files
pnpm test:coverage --findRelatedTests --passWithNoTests
```

### Pull Request Checks

Configure your CI to:
1. Run `pnpm test:ci` for all workspaces
2. Generate coverage reports
3. Comment on PRs with coverage changes
4. Fail if coverage drops below thresholds

## Advanced Usage

### Custom Coverage Collection

Create workspace-specific coverage patterns:

```javascript
// In jest.config.js
collectCoverageFrom: [
  ...baseConfig.collectCoverageFrom,
  'src/special-folder/**/*.ts',
  '!src/generated/**'
]
```

### Exclude Files from Coverage

Add patterns to `collectCoverageFrom` with `!` prefix:

```javascript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/migrations/**',  // Exclude migrations
  '!src/**/*.mock.ts'    // Exclude mocks
]
```

## Summary

The coverage setup provides:
- ✅ Unified coverage across the monorepo
- ✅ Multiple report formats
- ✅ Configurable thresholds
- ✅ CI/CD ready output
- ✅ Visual badges for documentation
- ✅ Detailed file-level coverage data

Run `pnpm coverage` regularly to maintain code quality!