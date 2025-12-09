# Phase 2 Loading State Standardization - Testing Guide

## Overview

This guide covers the comprehensive test suite for Phase 2 Loading State Standardization, including unit tests, integration tests, migration verification, and visual regression testing.

## Test Structure

```
src/__tests__/optimizations/
├── phase2-loading-components.test.tsx    # Unit tests for loading components
├── phase2-skeleton-screens.test.tsx      # Unit tests for skeleton screens
├── phase2-migration.test.tsx             # Migration verification tests
└── visual-regression/                     # Visual regression tests
    ├── baseline/                          # Baseline images
    ├── results/                           # Current test results
    ├── diff/                              # Difference images
    ├── visual-regression.config.js        # Test configuration
    └── run-visual-tests.js               # Test runner script
```

## Running Tests

### 1. Unit Tests

Run all Phase 2 unit tests:
```bash
pnpm test phase2-loading-components.test.tsx
pnpm test phase2-skeleton-screens.test.tsx
pnpm test phase2-migration.test.tsx
```

Run all Phase 2 tests:
```bash
pnpm test src/__tests__/optimizations/phase2
```

### 2. Visual Regression Tests

First, ensure Storybook is running:
```bash
pnpm storybook
```

Then run visual regression tests:
```bash
cd apps/frontend
node src/__tests__/optimizations/visual-regression/run-visual-tests.js
```

### 3. Storybook Test Runner

Run automated Storybook tests:
```bash
pnpm test-storybook --url http://localhost:6006
```

## Test Coverage

### Loading Components Tests

1. **LoadingSpinner**
   - Size variants (sm, md, lg, xl)
   - Custom className support
   - Accessibility attributes
   - Animation presence

2. **LoadingSkeleton**
   - Type variants (text, title, avatar, button, card)
   - Animation behavior
   - Custom dimensions
   - Gradient shimmer effect

3. **LoadingOverlay**
   - Visibility control
   - Custom messages
   - Blur effect
   - Z-index stacking

4. **ProgressBar**
   - Progress values (0-100%)
   - Label display
   - Animation transitions
   - Accessibility attributes
   - Invalid value handling

5. **LoadingDots**
   - Inline display
   - Animation timing
   - Size variants
   - Spacing between dots

### Skeleton Screen Tests

1. **PlayerCardSkeleton**
   - Avatar, name, team, status elements
   - Layout structure
   - Animation consistency
   - Custom className support

2. **WorkoutCardSkeleton**
   - Title, type badge, exercise list
   - Configurable exercise count
   - Action buttons option
   - Hover states

3. **DashboardWidgetSkeleton**
   - Header and content areas
   - Size variants (sm, md, lg)
   - Action button option
   - Custom content height

4. **TableRowSkeleton**
   - Configurable columns
   - Custom column widths
   - Multiple rows
   - Checkbox option

5. **FormSkeleton**
   - Configurable field count
   - Field type variations
   - Two-column layout
   - Submit button option

### Migration Verification Tests

1. **Loader2 Removal**
   - No Loader2 imports
   - LoadingSpinner usage instead

2. **Loading Pattern Consistency**
   - Standard components for all loading states
   - No inline "Loading..." text
   - Consistent import paths

3. **Skeleton Usage**
   - List components use skeletons
   - Forms use FormSkeleton
   - Proper skeleton selection

4. **Progress Bar Usage**
   - File uploads use ProgressBar
   - Long operations show progress

5. **Loading Overlay Usage**
   - Page-level loading
   - Modal/dialog loading states

## Visual Regression Testing

### Setup

1. Install dependencies:
```bash
pnpm add -D playwright pixelmatch pngjs
```

2. Create baseline images:
```bash
node src/__tests__/optimizations/visual-regression/run-visual-tests.js
```

### Updating Baselines

When intentional changes are made to components:

1. Delete old baseline:
```bash
rm src/__tests__/optimizations/visual-regression/baseline/[story-id].png
```

2. Run tests to create new baseline:
```bash
node src/__tests__/optimizations/visual-regression/run-visual-tests.js
```

### Viewing Results

After running visual regression tests, open the generated report:
```bash
open src/__tests__/optimizations/visual-regression/visual-regression-report.html
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Phase 2 Tests
  run: |
    pnpm test src/__tests__/optimizations/phase2
    
- name: Start Storybook
  run: |
    pnpm storybook --ci &
    sleep 10
    
- name: Run Visual Regression Tests
  run: |
    node src/__tests__/optimizations/visual-regression/run-visual-tests.js
    
- name: Upload Visual Regression Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-regression-results
    path: |
      src/__tests__/optimizations/visual-regression/results/
      src/__tests__/optimizations/visual-regression/diff/
      src/__tests__/optimizations/visual-regression/visual-regression-report.html
```

## Debugging Failed Tests

### Unit Test Failures

1. Check console output for specific assertion failures
2. Use `screen.debug()` to inspect rendered output
3. Verify component props and state

### Visual Regression Failures

1. Check the diff images in `visual-regression/diff/`
2. Compare baseline vs current in the HTML report
3. Common causes:
   - Animation timing differences
   - Font rendering variations
   - Browser updates
   - Legitimate component changes

### Migration Test Failures

1. Check listed files for non-compliant patterns
2. Use search to find specific violations:
```bash
# Find Loader2 usage
rg "Loader2" --type tsx --type ts

# Find inline loading text
rg "Loading\.\.\." --type tsx --type ts
```

## Best Practices

1. **Run tests before committing** changes to loading components
2. **Update tests** when adding new loading states
3. **Review visual regression** reports for unintended changes
4. **Keep baselines updated** when making intentional visual changes
5. **Document exceptions** if certain files can't follow standards

## Accessibility Testing

All loading components are tested for:
- Proper ARIA attributes
- Screen reader compatibility
- Keyboard navigation (where applicable)
- Color contrast (except skeletons)

Run accessibility audit:
```bash
pnpm test-storybook --url http://localhost:6006 --tag accessibility
```

## Performance Impact

Monitor performance after implementing loading states:
1. Bundle size impact
2. Animation performance
3. Memory usage with many skeletons

Use React DevTools Profiler to measure:
- Component render times
- Animation frame rates
- Memory allocation