# Performance Monitoring Example - Physical Trainer Dashboard

## Quick Start Guide

This example shows how to use the performance monitoring system to track and optimize the Physical Trainer dashboard.

### 1. Access the Monitored Dashboard

Navigate to: **http://localhost:3010/physicaltrainer/monitored**

This is a special version of the Physical Trainer dashboard with built-in performance monitoring.

### 2. Enable Performance Monitoring

The monitored dashboard automatically shows two floating control panels:

#### Performance Dashboard (Bottom Right)
- **Toggle**: Press `Ctrl+Shift+P` or click the "Performance Monitor" button
- **Purpose**: Shows real-time performance metrics for all components
- **Features**:
  - Component render times
  - API call durations  
  - Automatic performance classification (Green/Yellow/Orange/Red)
  - Export metrics as JSON

#### Feature Flag Dashboard (Bottom Left)
- **Toggle**: Press `Ctrl+Shift+F` or click the "Feature Flags" button
- **Purpose**: Enable/disable performance optimizations safely
- **Features**:
  - Phase-based optimization rollout
  - Risk levels for each optimization
  - One-click phase enablement

### 3. Collect Baseline Metrics

Before enabling any optimizations:

1. **Navigate through all tabs**:
   - Overview
   - Sessions
   - Calendar
   - Exercise Library
   - Testing
   - Players
   - Templates
   - Medical Analytics
   - Analytics
   - AI Optimization

2. **Perform typical actions**:
   - Create a workout
   - Open modals
   - Filter/search data
   - Switch teams

3. **Monitor performance**:
   - Watch the Performance Dashboard
   - Note slow components (orange/red)
   - Export baseline metrics

### 4. Enable Optimizations Safely

Using the Feature Flag Dashboard:

1. **Start with Phase 1** (Safe Quick Wins):
   - Click "Enable Phase 1" button
   - Enables font and icon optimizations
   - Monitor for any issues

2. **Progress to Phase 2** (Component Optimizations):
   - Only after Phase 1 is stable
   - Click "Enable Phase 2" button
   - Enables lazy loading and progressive rendering

3. **Advanced with Phase 3** (Advanced Optimizations):
   - Only after Phase 2 is stable
   - Click "Enable Phase 3" button
   - Enables lightweight charts and virtual scrolling

### 5. Compare Results

After enabling optimizations:

1. **Export new metrics** from Performance Dashboard
2. **Compare with baseline**:
   - Overview Tab: Target <500ms (from ~1000ms)
   - Sessions Tab: Target <800ms (from ~1500ms)
   - Modals: Target <300ms (from ~600ms)

### 6. Troubleshooting

If any optimization causes issues:

1. **Immediately disable** the problematic flag in Feature Flag Dashboard
2. **Export performance metrics** for debugging
3. **Check browser console** for errors
4. **Report the issue** with:
   - Which flag caused the problem
   - What specifically broke
   - Browser and version
   - Exported metrics

## Example Workflow

```bash
# 1. Start the development server
cd apps/frontend
pnpm dev

# 2. Open the monitored dashboard
open http://localhost:3010/physicaltrainer/monitored

# 3. Open both dashboards
# Press Ctrl+Shift+P (Performance)
# Press Ctrl+Shift+F (Feature Flags)

# 4. Navigate and collect baseline
# Click through all tabs, export metrics

# 5. Enable Phase 1 optimizations
# Click "Enable Phase 1" in Feature Flag Dashboard

# 6. Test and compare
# Navigate again, export new metrics

# 7. Continue with Phase 2 if stable
```

## Key Metrics to Watch

### Good Performance (Green)
- Component render: <16ms
- API calls: <100ms
- Tab switches: <200ms

### Acceptable (Yellow)
- Component render: <50ms
- API calls: <300ms
- Tab switches: <500ms

### Needs Optimization (Orange/Red)
- Component render: >50ms
- API calls: >500ms
- Tab switches: >800ms

## Understanding Console Warnings

You will see performance threshold violations in the console like:
- `[Performance] Threshold Violation - FCP: 7108 (threshold: 4500)`
- `[Performance] Threshold Violation - TTFB: 4923 (threshold: 3000)`
- `[Performance] Threshold Violation - LCP: 9592 (threshold: 6000)`

**These are expected!** They indicate the monitoring system is working correctly and detecting the performance issues we need to fix. The thresholds are based on Google's Core Web Vitals:

- **FCP (First Contentful Paint)**: Time until first content appears
  - Good: <1.8s, Needs Work: <3s, Poor: >4.5s
- **TTFB (Time to First Byte)**: Server response time
  - Good: <0.8s, Needs Work: <1.8s, Poor: >3s
- **LCP (Largest Contentful Paint)**: Time until main content loads
  - Good: <2.5s, Needs Work: <4s, Poor: >6s

## Tips

1. **Test one phase at a time** - Don't enable all optimizations at once
2. **Monitor after each change** - Watch for layout shifts or broken features
3. **Export metrics regularly** - Keep a history of performance improvements
4. **Use keyboard shortcuts** - Faster than clicking buttons
5. **Clear metrics periodically** - Prevents memory buildup

## Next Steps

Once you've successfully optimized the dashboard:

1. Apply the same monitoring to other dashboards
2. Create performance budgets based on your metrics
3. Set up automated performance testing
4. Document your optimization journey

Remember: The goal is to achieve <2 second initial load time and <100ms interactions while maintaining full functionality.