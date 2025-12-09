# Bundle Analyzer Setup for Hockey Hub Frontend

## Setup Complete ✅

The bundle analyzer has been configured for the Hockey Hub frontend application. Here's what was set up:

### 1. Package Installation
Added `@next/bundle-analyzer` to devDependencies in package.json:
```json
"@next/bundle-analyzer": "^15.4.2"
```

### 2. Next.js Configuration
Updated `next.config.js` to integrate the bundle analyzer:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: process.env.BUNDLE_ANALYZE !== 'browser' && process.env.BUNDLE_ANALYZE !== 'server',
})

// ... rest of config

module.exports = withBundleAnalyzer(nextConfig)
```

### 3. NPM Scripts Added
The following scripts were added to `package.json`:

- `"analyze": "ANALYZE=true pnpm build"` - Runs the bundle analyzer after build
- `"analyze:server": "BUNDLE_ANALYZE=server pnpm build"` - Analyzes server bundles only
- `"analyze:browser": "BUNDLE_ANALYZE=browser pnpm build"` - Analyzes browser bundles only
- `"bundle-stats": "node bundle-stats.js"` - Runs custom bundle size tracking

### 4. Custom Bundle Stats Tracker
Created `bundle-stats.js` which provides:
- Bundle size tracking over time
- Comparison with previous builds
- Detailed breakdown of chunks and pages
- History saved to `bundle-stats-history.json`

### 5. Git Ignore Updates
Added the following to `.gitignore`:
```
# Bundle analysis
bundle-stats-history.json
.next/analyze/
```

## Usage

### Running Bundle Analysis

1. **Complete Bundle Analysis** (opens interactive visualizer):
   ```bash
   pnpm analyze
   ```

2. **Server Bundle Analysis Only**:
   ```bash
   pnpm analyze:server
   ```

3. **Browser Bundle Analysis Only**:
   ```bash
   pnpm analyze:browser
   ```

4. **Bundle Size Tracking** (after building):
   ```bash
   pnpm build
   pnpm bundle-stats
   ```

### What to Look For

When analyzing bundles, pay attention to:

1. **Large Dependencies**: Identify packages that contribute significantly to bundle size
2. **Duplicate Modules**: Look for modules that appear in multiple chunks
3. **Unused Code**: Find code that's imported but not used
4. **Bundle Size Trends**: Use `bundle-stats` to track size changes over time

### Bundle Optimization Tips

Based on the Hockey Hub codebase:

1. **Code Splitting**: Already implemented with Next.js dynamic imports
2. **Tree Shaking**: Ensure imports are specific (e.g., `import { Button } from './ui'` not `import * as ui`)
3. **Image Optimization**: Use Next.js Image component for automatic optimization
4. **Font Optimization**: Use `next/font` for optimal font loading
5. **Library Optimization**: Consider lighter alternatives for heavy dependencies

### Initial Bundle Metrics

To capture initial metrics, run:
```bash
pnpm install  # Ensure dependencies are installed
pnpm build    # Build the application
pnpm bundle-stats  # Generate initial stats
```

The bundle analyzer will help identify optimization opportunities in the Hockey Hub frontend, which currently includes:
- 8 role-based dashboards
- 19 language translations
- Real-time features with Socket.io
- Complex UI components with animations
- Chart libraries and data visualization

Regular bundle analysis will help maintain optimal performance as the application grows.