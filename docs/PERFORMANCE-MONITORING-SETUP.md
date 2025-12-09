# Performance Monitoring Setup Guide

## 🎯 Overview

This guide explains how to use the non-intrusive performance monitoring system for the Physical Trainer dashboard. This is Phase 0 of the V2 optimization plan - completely safe with zero risk to functionality.

## 🚀 Quick Start

### 1. Access the Monitored Dashboard

Visit: `/physicaltrainer/monitored`

This is the same Physical Trainer dashboard but with performance monitoring enabled.

### 2. View Performance Metrics

Press `Ctrl+Shift+P` to toggle the Performance Dashboard, or click the "Performance Monitor" button in the bottom-right corner.

### 3. Manage Feature Flags

Press `Ctrl+Shift+F` to toggle the Feature Flag Dashboard, or click the "Feature Flags" button in the bottom-left corner.

## 📊 Performance Dashboard Features

### Real-time Metrics
- Component render times
- API call durations
- User interaction tracking
- Automatic performance classification (Fast/OK/Slow)

### Controls
- **Auto-refresh**: Updates metrics every 2 seconds
- **Export**: Download metrics as JSON
- **Clear**: Reset all collected metrics
- **Minimize**: Hide dashboard but keep collecting

### Performance Indicators
- 🟢 **Green** (<16ms): Excellent, 60fps capable
- 🟡 **Yellow** (<50ms): Acceptable performance
- 🟠 **Orange** (<100ms): Slow, needs optimization
- 🔴 **Red** (>100ms): Very slow, critical issue

## 🚩 Feature Flag Dashboard

### Safety Levels
- **Low Risk**: Safe optimizations (fonts, icons)
- **Medium Risk**: Component changes (modals, charts)
- **High Risk**: Core functionality changes (WebSocket, initialization)

### Phase Controls
- **Phase 1**: Enable safe quick wins
- **Phase 2**: Enable component optimizations
- **Phase 3**: Enable advanced optimizations

### Best Practices
1. Enable one flag at a time
2. Test thoroughly after each change
3. Monitor performance metrics
4. Disable immediately if issues occur

## 🔧 Using in Development

### Add Monitoring to a Component

```tsx
import { usePerformanceMonitor } from '@/features/physical-trainer/hooks/usePerformanceMonitor';

function MyComponent() {
  usePerformanceMonitor({
    componentName: 'MyComponent',
    logToConsole: true // Enable for debugging
  });
  
  return <div>...</div>;
}
```

### Wrap Components

```tsx
import { PerformanceMonitorWrapper } from '@/features/physical-trainer/components/shared/PerformanceMonitorWrapper';

<PerformanceMonitorWrapper componentName="SessionsTab">
  <SessionsTab {...props} />
</PerformanceMonitorWrapper>
```

### Monitor Operations

```tsx
import { useOperationMonitor } from '@/features/physical-trainer/hooks/usePerformanceMonitor';

function MyComponent() {
  const measureOp = useOperationMonitor('MyComponent');
  
  const handleClick = async () => {
    const endMeasure = measureOp('fetchData');
    await fetchSomeData();
    endMeasure(); // Logs operation duration
  };
}
```

## 📈 Baseline Metrics

Before enabling any optimizations, collect baseline metrics:

1. Navigate through all tabs
2. Open and close modals
3. Perform typical user actions
4. Export metrics for comparison

Expected baseline (before optimization):
- Overview Tab: ~500-1000ms
- Sessions Tab: ~800-1500ms
- Analytics Tabs: ~1000-2000ms
- Modals: ~300-600ms

## ⚠️ Troubleshooting

### Performance Dashboard Not Showing
1. Check if `PERFORMANCE_MONITORING` flag is enabled
2. Try keyboard shortcut: `Ctrl+Shift+P`
3. Check browser console for errors

### Metrics Not Collecting
1. Ensure you're on `/physicaltrainer/monitored` page
2. Check if components have monitoring wrappers
3. Clear browser cache and reload

### High Memory Usage
1. Click "Clear" button to reset metrics
2. Metrics are limited to 100 per component
3. Restart browser if needed

## 🎯 Next Steps

Once baseline metrics are collected:

1. **Phase 1**: Enable `OPTIMIZE_FONTS` flag
   - Test for 24 hours
   - Compare metrics
   - Check for layout shifts

2. **Phase 1**: Enable `OPTIMIZE_ICONS` flag
   - Test icon rendering
   - Check bundle size
   - Verify all icons work

3. Continue with Phase 2 only after Phase 1 is stable

## 📝 Reporting Issues

If any optimization causes problems:

1. Immediately disable the problematic flag
2. Export performance metrics
3. Note:
   - Which flag caused the issue
   - What specifically broke
   - Browser and version
   - Error messages (if any)

## 🔗 Related Documentation

- [V2 Performance Optimization Plan](./PHYSICAL-TRAINER-PERFORMANCE-OPTIMIZATION-V2.md)
- [Original Optimization Attempt](./PHYSICAL-TRAINER-PERFORMANCE-OPTIMIZATION.md)
- [Physical Trainer Features](./PHYSICAL-TRAINER-COMPLETE-FEATURES.md)

---

**Remember**: This monitoring system is completely safe and doesn't change any functionality. It only observes and reports performance metrics.