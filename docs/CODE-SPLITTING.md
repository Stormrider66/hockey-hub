# Code Splitting Guide for Hockey Hub

## Overview

This guide explains how to implement code splitting in the Hockey Hub application to improve performance by reducing initial bundle size and loading components on demand.

## Table of Contents

1. [Why Code Splitting](#why-code-splitting)
2. [Dynamic Import Utility](#dynamic-import-utility)
3. [Implementation Patterns](#implementation-patterns)
4. [Best Practices](#best-practices)
5. [Performance Monitoring](#performance-monitoring)

## Why Code Splitting

Code splitting provides several benefits:

- **Reduced Initial Bundle Size**: Users only download the code they need initially
- **Faster Page Loads**: Smaller bundles load and parse faster
- **Better Caching**: Changed components don't invalidate the entire bundle
- **Improved Performance**: Particularly important for users on slower connections

## Dynamic Import Utility

We've created a standardized utility for dynamic imports at `/src/utils/dynamicImports.ts`:

```typescript
import { createDynamicImport } from '@/utils/dynamicImports';

// Example usage
const MyComponent = createDynamicImport(
  () => import(
    /* webpackChunkName: "my-component" */
    '@/features/my-feature/MyComponent'
  ),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Disable SSR for components with browser-only code
  }
);
```

### Helper Functions

The utility provides specialized helpers for common component types:

#### Dashboard Components

```typescript
const PlayerDashboard = createDashboardComponent(
  'player/PlayerDashboard',
  'PlayerDashboard'
);
```

#### Modal Components

```typescript
const CreateEventModal = createModalComponent(
  'calendar/components/CreateEventModal',
  'default'
);
```

#### Chart Components

```typescript
const PerformanceChart = createChartComponent(
  'analytics/charts/PerformanceChart',
  'PerformanceChart'
);
```

## Implementation Patterns

### 1. Route-Based Code Splitting

All dashboard pages now use dynamic imports:

```typescript
// app/player/page.tsx
"use client";

import React from "react";
import { createDynamicImport } from "@/utils/dynamicImports";

const PlayerDashboard = createDynamicImport(
  () => import(
    /* webpackChunkName: "player-dashboard" */
    "@/features/player/PlayerDashboard"
  ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Player Dashboard...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function PlayerDashboardPage() {
  return <PlayerDashboard />;
}
```

### 2. Component-Level Code Splitting

For large components within pages:

```typescript
// In a component file
const HeavyFeature = createDynamicImport(
  () => import('./HeavyFeature'),
  {
    loading: () => <div>Loading feature...</div>
  }
);

// Use it conditionally
function MyComponent() {
  const [showFeature, setShowFeature] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowFeature(true)}>
        Show Feature
      </Button>
      {showFeature && <HeavyFeature />}
    </div>
  );
}
```

### 3. Modal Code Splitting

Modals are perfect candidates for code splitting:

```typescript
// Instead of direct import
// import EventDetailsModal from './EventDetailsModal';

// Use dynamic import
const EventDetailsModal = createModalComponent(
  'calendar/components/EventDetailsModal',
  'default'
);

// Usage remains the same
{isModalOpen && (
  <EventDetailsModal
    event={selectedEvent}
    onClose={() => setIsModalOpen(false)}
  />
)}
```

### 4. Chart Components

Charts with heavy dependencies should be lazy loaded:

```typescript
const PerformanceChart = createChartComponent(
  'analytics/PerformanceChart',
  'PerformanceChart'
);

// In your component
{showChart && <PerformanceChart data={chartData} />}
```

## Best Practices

### 1. When to Use Code Splitting

**DO** use code splitting for:
- Dashboard components (route-based splitting)
- Modal/dialog components
- Heavy visualization components (charts, graphs)
- Features behind user interaction (tabs, accordions)
- Optional features (admin panels, developer tools)

**DON'T** use code splitting for:
- Small utility components
- Frequently used UI components (buttons, inputs)
- Components needed for initial render
- Critical path components

### 2. Webpack Magic Comments

Always use webpack magic comments for better debugging:

```typescript
() => import(
  /* webpackChunkName: "descriptive-name" */
  /* webpackPrefetch: true */ // For likely needed resources
  /* webpackPreload: true */  // For critical resources
  './MyComponent'
)
```

### 3. Loading States

Provide meaningful loading states:

```typescript
loading: () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Spinner />
      <p className="mt-4 text-gray-600">Loading dashboard...</p>
    </div>
  </div>
)
```

### 4. Error Handling

Implement retry logic for failed imports:

```typescript
const MyComponent = createDynamicImport(
  () => retryDynamicImport(
    () => import('./MyComponent'),
    3, // retries
    1000 // initial delay
  )
);
```

### 5. Preloading

Preload components that are likely to be needed:

```typescript
// On hover or focus
onMouseEnter={() => {
  preloadComponent(() => import('./HeavyComponent'));
}}

// After initial load
useEffect(() => {
  // Preload components likely to be used
  preloadComponent(() => import('./CommonModal'));
}, []);
```

## Performance Monitoring

### Bundle Analysis

Use webpack-bundle-analyzer to monitor bundle sizes:

```bash
pnpm analyze
```

### Metrics to Track

1. **Initial Bundle Size**: Should decrease after implementing code splitting
2. **Time to Interactive (TTI)**: Should improve with smaller initial bundles
3. **Chunk Loading Time**: Monitor how quickly dynamic chunks load
4. **Cache Hit Rate**: Ensure chunks are being cached effectively

### Chrome DevTools

Use the Network tab to verify:
- Chunks are loading on demand
- Appropriate chunk names from webpack magic comments
- Chunks are being cached

Use the Coverage tab to identify:
- Unused code in initial bundles
- Opportunities for additional code splitting

## Migration Guide

When migrating existing components:

1. **Identify Large Components**: Use bundle analyzer to find candidates
2. **Create Loading Component**: Design appropriate loading states
3. **Update Imports**: Replace direct imports with dynamic imports
4. **Test Thoroughly**: Ensure components load correctly
5. **Monitor Performance**: Verify improvements in metrics

## Examples in Hockey Hub

### Dashboard Pages

All role-based dashboards now use code splitting:
- `/app/player/page.tsx`
- `/app/coach/page.tsx`
- `/app/parent/page.tsx`
- `/app/admin/page.tsx`
- `/app/physicaltrainer/page.tsx`
- `/app/medicalstaff/page.tsx`
- `/app/equipmentmanager/page.tsx`
- `/app/clubadmin/page.tsx`

### Modal Components

Calendar modals use dynamic imports:
- `EventDetailsModal`
- `CreateEventModal`

### Chart Components

Analytics dashboards lazy load chart libraries:
- Performance charts
- Statistical visualizations

## Troubleshooting

### Common Issues

1. **Component Not Loading**
   - Check import path is correct
   - Verify the component has a default export
   - Check browser console for errors

2. **SSR Issues**
   - Set `ssr: false` for components using browser APIs
   - Ensure window/document checks in components

3. **TypeScript Errors**
   - Import types separately (not dynamically)
   - Use proper type annotations for dynamic components

### Debug Tips

1. Enable webpack logging:
   ```javascript
   // next.config.js
   webpack: (config) => {
     config.stats = 'verbose';
     return config;
   }
   ```

2. Check chunk names in Network tab match magic comments

3. Use React DevTools Profiler to measure impact

## Conclusion

Code splitting is a powerful optimization technique that significantly improves the performance of Hockey Hub. By following this guide and using our standardized utilities, you can ensure consistent implementation across the application.

Remember: The goal is to balance performance gains with code maintainability. Not every component needs to be code split, but strategic splitting of large components can dramatically improve user experience.