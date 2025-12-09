# Performance Monitoring System

## Overview

The Performance Monitoring System provides comprehensive tracking and analysis of the Physical Trainer Dashboard's runtime performance. It uses the browser's Performance API to collect metrics about component rendering, API calls, user interactions, and custom events.

## Features

- **Automatic Component Tracking**: Mount/unmount timing, render counts
- **API Call Monitoring**: Duration, success/failure rates, metadata
- **User Interaction Tracking**: Clicks, navigation, form submissions
- **Custom Performance Marks**: Create custom timing measurements
- **Real-time Dashboard**: Visual performance analytics
- **Data Export**: Export metrics as JSON or CSV
- **Performance Alerts**: Automatic detection of performance issues

## Quick Start

### 1. Wrap Your App with PerformanceProvider

```tsx
// In your app root or layout
import { PerformanceProvider } from '@/features/physical-trainer/performance';

function App() {
  return (
    <PerformanceProvider 
      maxMetrics={5000}
      enableAutoCleanup={true}
      enableConsoleLogging={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </PerformanceProvider>
  );
}
```

### 2. Add Performance Monitoring to Components

```tsx
import { usePerformanceMonitor } from '@/features/physical-trainer/performance';

function PhysicalTrainerDashboard() {
  const perf = usePerformanceMonitor({
    componentName: 'PhysicalTrainerDashboard',
    enableAutoTracking: true,
    trackRenders: true
  });

  // Track API calls
  const loadData = async () => {
    const data = await perf.trackApiCall('fetch-sessions', 
      () => api.getSessions(),
      { includeArchived: false }
    );
    return data;
  };

  // Track user interactions
  const handleTabChange = (tab: string) => {
    perf.trackInteraction('tab-change', { tab });
    setActiveTab(tab);
  };

  // Custom measurements
  const processData = () => {
    perf.startMeasure('data-processing');
    // ... heavy computation
    perf.endMeasure('data-processing', { 
      recordCount: data.length 
    });
  };

  return <div>...</div>;
}
```

### 3. View Performance Metrics

Add the performance dashboard to a development route:

```tsx
import { PerformanceMonitoringDashboard } from '@/features/physical-trainer/performance';

// Add to your routes
<Route path="/dev/performance" element={<PerformanceMonitoringDashboard />} />
```

## Integration Examples

### Tab Performance Tracking

```tsx
import { useTabPerformance } from '@/features/physical-trainer/performance';

function TabbedInterface() {
  const tabPerf = useTabPerformance('main-tabs');
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (newTab: string) => {
    tabPerf.trackSwitch(activeTab, newTab);
    setActiveTab(newTab);
  };

  return (
    <Tabs value={activeTab} onChange={(_, tab) => handleTabChange(tab)}>
      {/* tabs */}
    </Tabs>
  );
}
```

### Workout Builder Performance

```tsx
import { useWorkoutBuilderPerformance } from '@/features/physical-trainer/performance';

function WorkoutBuilder() {
  const builderPerf = useWorkoutBuilderPerformance('strength');

  const saveWorkout = async () => {
    const result = await builderPerf.trackSave(async () => {
      // Validation tracking
      const stopValidation = builderPerf.trackValidation();
      validateWorkout();
      stopValidation();

      // Save operation
      return await api.saveWorkout(workout);
    });
  };

  return <div>...</div>;
}
```

### Chart Performance

```tsx
import { useChartPerformance } from '@/features/physical-trainer/performance';

function PerformanceChart({ data }) {
  const chartPerf = useChartPerformance('player-stats');

  useEffect(() => {
    chartPerf.startRender();
    // Render chart
    requestAnimationFrame(() => {
      chartPerf.endRender({ 
        dataPoints: data.length,
        chartType: 'line' 
      });
    });
  }, [data]);

  return <LineChart data={data} />;
}
```

## Performance Metrics Categories

### Component Metrics
- Mount/unmount duration
- Render count and frequency
- Component lifetime

### API Metrics
- Request duration
- Success/failure rates
- Response sizes
- Endpoint performance

### Interaction Metrics
- Click events
- Form submissions
- Navigation events
- Drag and drop operations

### Render Metrics
- Paint timing
- Layout shifts
- Chart rendering
- Animation performance

### Custom Metrics
- Business logic execution
- Data processing
- Validation timing
- Any custom measurements

## Best Practices

### 1. Strategic Placement
- Focus on critical user paths
- Monitor expensive operations
- Track perceived performance

### 2. Meaningful Metadata
```tsx
perf.endMeasure('search', {
  resultCount: results.length,
  searchTerm: term,
  filters: activeFilters
});
```

### 3. Avoid Over-tracking
- Don't track every minor operation
- Focus on user-impacting metrics
- Use sampling for high-frequency events

### 4. Performance Budget
```tsx
// Set alerts for slow operations
if (duration > 1000) {
  console.warn(`Slow operation detected: ${name} took ${duration}ms`);
}
```

## API Reference

### usePerformanceMonitor

```tsx
const perf = usePerformanceMonitor({
  componentName: string;
  enableAutoTracking?: boolean;
  trackRenders?: boolean;
});

// Methods
perf.startMeasure(name: string): void
perf.endMeasure(name: string, metadata?: any): void
perf.trackInteraction(type: string, metadata?: any): void
perf.trackApiCall<T>(name: string, apiCall: () => Promise<T>, metadata?: any): Promise<T>
perf.mark(name: string): void
perf.measureBetweenMarks(name: string, startMark: string, endMark: string, metadata?: any): void
```

### PerformanceProvider Props

```tsx
interface PerformanceProviderProps {
  maxMetrics?: number;        // Default: 5000
  enableAutoCleanup?: boolean; // Default: true
  cleanupInterval?: number;    // Default: 300000 (5 minutes)
  enableConsoleLogging?: boolean; // Default: false
}
```

### Performance Context

```tsx
const context = usePerformanceContext();

// Methods
context.recordMetric(metric: PerformanceMetric): void
context.clearMetrics(): void
context.exportMetrics(): PerformanceReport
context.getMetricsByCategory(category: string): PerformanceMetric[]
context.getMetricsByComponent(componentName: string): PerformanceMetric[]
context.enableRecording: boolean
context.setEnableRecording(enabled: boolean): void
```

## Troubleshooting

### High Memory Usage
- Reduce `maxMetrics` limit
- Enable `enableAutoCleanup`
- Clear metrics periodically

### Missing Metrics
- Check `enableRecording` is true
- Verify PerformanceProvider is at app root
- Check browser Performance API support

### Inaccurate Timings
- Use `requestAnimationFrame` for render measurements
- Account for async operations
- Clear marks after measurements

## Production Considerations

1. **Disable in Production**: Consider disabling detailed tracking in production
2. **Sampling**: Use sampling for high-traffic applications
3. **Data Privacy**: Don't include sensitive data in metadata
4. **Performance Impact**: Monitor the monitoring system's own impact

```tsx
const shouldTrack = process.env.NODE_ENV === 'development' || 
  Math.random() < 0.01; // 1% sampling in production
```