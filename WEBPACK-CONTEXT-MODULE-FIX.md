# Webpack Context Module Fix - Root Cause Analysis & Solution

## The Problem

The Physical Trainer dashboard was failing to load with multiple errors:
1. Test files being imported in production
2. Server-side Node.js modules (like 'net' from Redis) being imported in the browser
3. Non-JavaScript files (markdown, patches) being imported

## Root Cause

The issue was caused by **dynamic template literal imports** in `dynamicImports.tsx`:

```typescript
// PROBLEMATIC CODE
() => import(`@/features/${importPath}`)
```

When webpack encounters template literal imports, it creates a "context module" that includes **ALL files** matching the pattern. This meant webpack was trying to import:
- Test files (*.test.tsx)
- Server-side code that imports Node.js modules
- Documentation files (*.md, *.patch)

## The Solution

1. **Removed the problematic helper functions** that used template literal imports:
   - `createDashboardComponent`
   - `createModalComponent`
   - `createChartComponent`
   - `createFeatureComponent`

2. **Fixed the only usage** in `CalendarView.tsx` by replacing:
   ```typescript
   // OLD - Creates webpack context module
   const EventDetailsModal = createModalComponent(
     'calendar/components/EventDetailsModal',
     'default'
   );
   
   // NEW - Static import, no context module
   const EventDetailsModal = createDynamicImport(
     () => import('./EventDetailsModal'),
     { loading: LoadingComponent }
   );
   ```

3. **Kept Node.js module fallbacks** in webpack config for any remaining edge cases

## Key Lesson

**Never use template literals in dynamic imports!**

```typescript
// ❌ BAD - Creates context module
import(`@/features/${path}`)

// ✅ GOOD - Static path, efficient code splitting
import('./MyComponent')
```

Template literal imports defeat tree-shaking and cause webpack to include unwanted files.

## Verification

The application should now:
- Load without import errors
- Not attempt to import test files
- Not attempt to import Node.js modules in the browser
- Have smaller bundle sizes due to proper tree-shaking

Start with: `cd apps/frontend && pnpm dev`