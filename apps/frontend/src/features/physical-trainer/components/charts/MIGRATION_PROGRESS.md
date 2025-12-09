# Recharts Migration Progress

## Completed Migrations (3/7)

### ✅ RecoveryRecommendations.tsx
- **Charts replaced**: AreaChart (with stacked areas and line overlay)
- **Migration approach**: 
  - Used LightweightAreaChart for stacked recovery/readiness data
  - Overlaid LightweightLineChart for fatigue line
  - Added custom legend
- **File**: `/apps/frontend/src/features/physical-trainer/components/predictive/RecoveryRecommendations.tsx`

### ✅ PlateauDetectionAlert.tsx
- **Charts replaced**: LineChart (multi-series with reference line)
- **Migration approach**:
  - Used multiple overlaid LightweightLineChart components for each series
  - Added custom plateau threshold line using absolute positioning
  - Used CSS for dashed line styling
  - Added custom legend
- **File**: `/apps/frontend/src/features/physical-trainer/components/predictive/PlateauDetectionAlert.tsx`

### ✅ LoadRecommendationWidget.tsx
- **Charts replaced**: BarChart (grouped), AreaChart with LineChart overlay
- **Migration approach**:
  - For BarChart: Created custom grouped bar visualization using flexbox and div elements
  - For AreaChart: Used LightweightAreaChart with LightweightLineChart overlay
  - Added custom legends for both charts
- **File**: `/apps/frontend/src/features/physical-trainer/components/predictive/LoadRecommendationWidget.tsx`

## Remaining Components (4/7)

### ⏳ InjuryRiskIndicator.tsx
- Uses: PieChart, BarChart

### ⏳ InjuryRiskDashboard.tsx
- Uses: BarChart, PieChart, LineChart

### ⏳ FatigueMonitoringPanel.tsx
- Uses: LineChart, AreaChart, BarChart

### ⏳ FatigueMonitor.tsx
- Uses: LineChart with ReferenceLine

## Migration Notes

1. **Multi-series charts**: Achieved by overlaying multiple lightweight chart components with `position: absolute`
2. **Reference lines**: Created using positioned div elements with dashed borders
3. **Legends**: Built custom legends using flex layouts and colored indicators
4. **Grouped bar charts**: Implemented using flexbox layouts instead of LightweightBarChart
5. **Tooltips**: Currently using the built-in tooltips from lightweight components

## Performance Impact

The migrated components should see:
- ~80% reduction in JavaScript bundle size for chart functionality
- Faster initial render times
- Better performance with large datasets
- Reduced memory usage

## Next Steps

Continue with the remaining 4 components, focusing on:
1. InjuryRiskIndicator.tsx (PieChart replacement will use LightweightPieChart)
2. InjuryRiskDashboard.tsx (Mix of charts)
3. FatigueMonitoringPanel.tsx (Complex multi-chart component)
4. FatigueMonitor.tsx (LineChart with reference line)