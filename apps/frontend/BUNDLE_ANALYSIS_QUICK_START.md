# Bundle Analysis Quick Start

## Setup Status ✅

All configuration files have been set up for bundle analysis. You just need to complete the dependency installation.

## Complete the Installation

Since the dependency installation is taking time, run this when you're ready:

```bash
# From the frontend directory
cd apps/frontend
pnpm install

# OR from the root directory
pnpm --filter hockey-hub-frontend install
```

## Run Bundle Analysis

Once dependencies are installed, you can analyze your bundles:

### 1. Interactive Bundle Analyzer
```bash
# From frontend directory
pnpm analyze

# OR from root directory  
pnpm --filter hockey-hub-frontend analyze
```

This will:
- Build the application
- Open an interactive treemap visualization in your browser
- Show all JavaScript bundles and their sizes

### 2. Server-Only Analysis
```bash
pnpm analyze:server
```

### 3. Browser-Only Analysis  
```bash
pnpm analyze:browser
```

### 4. Bundle Size Tracking
```bash
# Build first
pnpm build

# Then run stats
pnpm bundle-stats
```

This will show:
- Total build size
- Top 10 largest chunks
- Page bundle sizes
- Comparison with previous build (if any)

## What's Been Configured

1. **package.json** - Added @next/bundle-analyzer and analysis scripts
2. **next.config.js** - Integrated bundle analyzer with environment variables
3. **bundle-stats.js** - Custom script for tracking bundle sizes over time
4. **.gitignore** - Added bundle analysis artifacts

## First Run

For your initial bundle analysis:

```bash
# 1. Ensure dependencies are installed
pnpm install

# 2. Run the interactive analyzer
pnpm analyze

# 3. Generate initial stats baseline
pnpm build && pnpm bundle-stats
```

## Interpreting Results

The bundle analyzer will show:
- **Stat Size**: Size before minification
- **Parsed Size**: Size after minification
- **Gzipped Size**: Size after gzip compression (what users download)

Look for:
- Large dependencies that could be replaced
- Duplicate code across bundles
- Opportunities for code splitting
- Unused exports that can be tree-shaken

## Next Steps

1. Complete the installation when ready
2. Run initial analysis to establish baseline
3. Identify optimization opportunities
4. Track progress with bundle-stats after each optimization