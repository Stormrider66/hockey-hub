# Bundle Analysis Guide for Hockey Hub Frontend

This guide explains how to analyze the Hockey Hub frontend bundle size and identify optimization opportunities using the already configured webpack-bundle-analyzer.

## Overview

Hockey Hub has multiple bundle analysis tools already configured:
- **@next/bundle-analyzer** - Interactive bundle visualization
- **webpack-bundle-analyzer** - Detailed webpack bundle analysis
- **Custom analysis scripts** - Hockey Hub specific bundle insights

## Quick Start

### 1. Interactive Bundle Analyzer (Recommended)

The easiest way to analyze your bundle:

```bash
# Analyze the production bundle with interactive visualization
pnpm analyze

# Or analyze specific bundles
pnpm analyze:browser  # Client-side bundle only
pnpm analyze:server   # Server-side bundle only
```

This will:
1. Build the project in production mode
2. Generate bundle statistics
3. Open an interactive treemap visualization in your browser

### 2. Custom Bundle Analysis Scripts

Hockey Hub includes two custom analysis scripts with specific insights:

#### Basic Bundle Analysis
```bash
# Run bundle analysis with optimization suggestions
pnpm bundle-analyzer

# Open interactive analyzer after analysis
pnpm bundle-analyzer:open
```

This script provides:
- Top 10 largest chunks breakdown
- Heavy library detection (moment, lodash, MUI, etc.)
- Specific optimization recommendations
- Detailed JSON report saved to `bundle-analysis-report.json`

#### Advanced Bundle Analysis
```bash
# Run comprehensive bundle analysis with threshold checks
pnpm analyze-bundle
```

This script provides:
- Total bundle size analysis
- Chunk type categorization
- Size threshold violations
- CI/CD integration support
- Exports results to `bundle-analysis.json`

## Understanding the Results

### Interactive Bundle Analyzer

When you run `pnpm analyze`, you'll see:

1. **Treemap Visualization**: Each rectangle represents a module
   - Size = Rectangle area
   - Colors = Different packages
   - Hover = Detailed size info

2. **Key Areas to Check**:
   - `node_modules` - Third-party dependencies
   - `src` - Your application code
   - Large individual files or packages

### Bundle Analysis Reports

The custom scripts generate reports showing:

1. **Chunk Types**:
   - **Framework**: React, Next.js core (~150KB expected)
   - **Vendor**: Third-party libraries
   - **Main**: Your main application bundle
   - **Pages/App**: Route-specific code
   - **Dynamic**: Lazy-loaded chunks

2. **Size Thresholds**:
   - Individual chunks: Should be < 500KB
   - Total bundle: Should be < 5MB
   - Main chunk: Should be < 100KB

3. **Heavy Libraries Detected**:
   ```
   📚 moment@2.30.1
      Size: 67KB
      💡 Replace with date-fns (~13KB)
   
   📚 @mui/material@5.x.x
      Size: 325KB
      💡 Use specific component imports
   ```

## Optimization Strategies

Based on the analysis, here are common optimizations:

### 1. Replace Heavy Libraries

```javascript
// ❌ Bad: Imports entire moment.js
import moment from 'moment';

// ✅ Good: Use lighter alternative
import { format } from 'date-fns';
```

### 2. Use Dynamic Imports

```javascript
// ❌ Bad: Always loaded
import { Chart } from 'react-chartjs-2';

// ✅ Good: Loaded when needed
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
});
```

### 3. Optimize Imports

```javascript
// ❌ Bad: Imports entire library
import * as Icons from 'lucide-react';

// ✅ Good: Specific imports
import { Home, User, Settings } from 'lucide-react';
```

### 4. Enable Tree Shaking

The Next.js config already has tree shaking enabled:
```javascript
// next.config.js
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'lodash-es',
    // ... other packages
  ],
}
```

## Current Bundle Optimization Status

Hockey Hub already implements several optimizations:

1. **Code Splitting**: 
   - Separate chunks for vendor libraries
   - Route-based code splitting
   - Dynamic imports for heavy components

2. **Tree Shaking**:
   - Enabled in production builds
   - Optimized package imports configured

3. **Minification**:
   - Terser plugin configured
   - Console logs removed in production
   - Aggressive compression settings

## Running Analysis in CI/CD

For automated bundle size monitoring:

```bash
# In your CI pipeline
pnpm analyze-bundle

# Check the exit code
# 0 = All checks passed
# 1 = Size thresholds exceeded
```

The script will fail the build if:
- Total bundle > 5MB
- Any chunk > 500KB
- Main chunk > 100KB

## Interpreting Common Issues

### 1. Large Vendor Chunk
**Symptom**: `vendor.js` is > 1MB

**Solution**:
- Review `package.json` for unused dependencies
- Use dynamic imports for heavy libraries
- Consider alternatives for large packages

### 2. Duplicate Dependencies
**Symptom**: Multiple versions of the same package

**Solution**:
```bash
# Check for duplicates
pnpm list --depth=10 | grep -E "react|lodash|moment"

# Deduplicate
pnpm dedupe
```

### 3. Unoptimized Images
**Symptom**: Large image assets in bundle

**Solution**:
- Use `next/image` component
- Move images to `public` folder
- Use image optimization services

## Best Practices

1. **Regular Analysis**: Run bundle analysis before major releases
2. **Set Budget**: Define size budgets for critical chunks
3. **Monitor Trends**: Track bundle size over time
4. **Automate Checks**: Add to CI/CD pipeline
5. **Document Changes**: Note when adding heavy dependencies

## Advanced Configuration

To customize the bundle analyzer:

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false, // Don't auto-open browser
  analyzerMode: 'static', // Generate HTML report
  reportFilename: '../bundle-analysis.html',
})
```

## Troubleshooting

### Bundle analyzer not opening
```bash
# Ensure you're using the correct command
ANALYZE=true pnpm build

# On Windows PowerShell
$env:ANALYZE="true"; pnpm build
```

### Build failing during analysis
```bash
# Increase Node memory
pnpm dev:mem  # Uses 4GB memory allocation
```

### Missing bundle statistics
```bash
# Clean build and retry
rm -rf .next
pnpm build
pnpm analyze
```

## Resources

- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing

## Summary

Hockey Hub has comprehensive bundle analysis tools ready to use:

1. **Quick check**: `pnpm analyze`
2. **Detailed report**: `pnpm bundle-analyzer`
3. **CI integration**: `pnpm analyze-bundle`

Regular bundle analysis helps maintain optimal performance for the 500+ concurrent users Hockey Hub supports.