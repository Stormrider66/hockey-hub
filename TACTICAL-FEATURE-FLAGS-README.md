# Tactical Feature Flags System

This document describes the implementation of the feature flag system for the tactical tab, enabling seamless switching between mock and real data sources.

## Overview

The tactical feature flag system provides:
- Runtime toggling between demo (mock) and live data modes
- Centralized configuration for all tactical features
- Clean abstraction layer for data sources
- Demo mode indicators throughout the UI
- Environment variable support for default settings

## Architecture

### Components

1. **Feature Flags Configuration** (`/apps/frontend/src/config/featureFlags.ts`)
   - Centralized feature flag management
   - Environment variable integration
   - Runtime toggle support
   - Local storage persistence

2. **Tactical Data Service** (`/apps/frontend/src/features/coach/services/tacticalDataService.ts`)
   - Abstraction layer between UI and data sources
   - Mock and API adapters
   - Unified interface for all tactical data operations

3. **UI Components** (`/apps/frontend/src/features/coach/components/tactical/TacticalDemoToggle.tsx`)
   - Demo mode toggle switch
   - Status indicators
   - Information panels

## Environment Variables

Add these to your `.env.local` file:

```bash
# Tactical Feature Flags
NEXT_PUBLIC_FEATURE_TACTICAL=true
NEXT_PUBLIC_TACTICAL_USE_MOCK_DATA=true
NEXT_PUBLIC_TACTICAL_DEMO_MODE=true
NEXT_PUBLIC_TACTICAL_REALTIME=true
NEXT_PUBLIC_TACTICAL_AI_ANALYSIS=true
NEXT_PUBLIC_TACTICAL_EXPORTS=true
NEXT_PUBLIC_TACTICAL_ANIMATIONS=true
```

## Usage

### Basic Feature Flag Check

```typescript
import { useFeatureFlags } from '@/config/featureFlags';

function MyComponent() {
  const { isEnabled, isTacticalDemoMode } = useFeatureFlags();
  
  if (!isEnabled('tactical.enabled')) {
    return <div>Tactical features disabled</div>;
  }
  
  return (
    <div>
      {isTacticalDemoMode() ? 'Using demo data' : 'Using live data'}
    </div>
  );
}
```

### Using Tactical Data Service

```typescript
import { tacticalDataService } from '@/features/coach/services/tacticalDataService';

async function loadTacticalData() {
  // Automatically uses mock or real data based on feature flags
  const plays = await tacticalDataService.getTacticalPlays();
  const formations = await tacticalDataService.getFormations();
  
  console.log('Is demo mode:', tacticalDataService.isDemoMode());
}
```

### Adding Demo Mode Toggle

```typescript
import { TacticalDemoToggle, DemoModeIndicator } from '@/features/coach/components/tactical/TacticalDemoToggle';

function MyTacticalComponent() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1>Tactical Dashboard</h1>
        <DemoModeIndicator />
      </div>
      
      <TacticalDemoToggle compact={true} />
      
      {/* Your tactical content */}
    </div>
  );
}
```

## Mock Data

### Tactical Plays
The system includes 4 pre-configured tactical plays:
- **Power Play Umbrella**: Classic umbrella formation for power play situations
- **Breakout Left Wing**: Quick breakout play through the left wing
- **Defensive Zone Trap**: Neutral zone trap to slow down opponent attack
- **2-on-1 Cycle Low**: Cycle play in the offensive zone with low support

### Formations
The system includes 2 pre-configured formations:
- **1-2-2 Offensive**: Aggressive offensive formation with high forwards
- **1-3-1 Neutral Zone**: Balanced formation for neutral zone control

### Player Data
Mock data includes NHL player examples:
- Connor McDavid (Center) - 94.2 overall rating
- Leon Draisaitl (C/RW) - 89.7 overall rating

### Statistics
Comprehensive mock statistics including:
- Play usage and success rates
- Formation effectiveness metrics
- Player tactical ratings
- Trend analysis
- Opponent analysis

## Feature Flag Options

### Core Tactical Features
- `tactical.enabled`: Master switch for all tactical features
- `tactical.useMockData`: Use mock data instead of API calls
- `tactical.enableDemoMode`: Enable demo mode with enhanced mock data

### Advanced Features
- `tactical.enableRealTimeUpdates`: Enable real-time tactical updates
- `tactical.enableAIAnalysis`: Enable AI-powered tactical analysis
- `tactical.enableExports`: Enable export functionality
- `tactical.enableAnimations`: Enable tactical board animations

## Implementation Details

### Data Flow

1. **Feature Flag Check**: Components check if tactical features are enabled
2. **Service Selection**: TacticalDataService selects appropriate adapter (Mock/API)
3. **Data Retrieval**: Adapter provides data based on current mode
4. **UI Updates**: Components display appropriate indicators and data

### State Management

The feature flags use:
- Environment variables for defaults
- LocalStorage for runtime persistence
- React Context for component updates
- Pub/sub pattern for change notifications

### Backward Compatibility

The system maintains full backward compatibility:
- Existing components work without modification
- Mock data is preserved in its original format
- API interfaces remain unchanged
- No breaking changes to existing functionality

## Development Workflow

### Enable Demo Mode
1. Set `NEXT_PUBLIC_TACTICAL_DEMO_MODE=true` in `.env.local`
2. Use the demo toggle in the UI
3. All tactical data will use mock sources

### Switch to Live Data
1. Set `NEXT_PUBLIC_TACTICAL_USE_MOCK_DATA=false` in `.env.local`
2. Use the demo toggle to disable demo mode
3. System will attempt to connect to real APIs

### Add New Mock Data
1. Update mock arrays in `tacticalDataService.ts`
2. Follow existing data structure patterns
3. Test both mock and API modes

### Debug Feature Flags
1. Enable debug mode: `NEXT_PUBLIC_DEBUG_MODE=true`
2. Use the FeatureFlagPanel component for runtime debugging
3. Check browser console for feature flag logs

## Testing

### Mock Data Testing
- All mock data includes realistic success rates and trends
- Player data uses recognizable NHL examples
- Statistics follow realistic hockey patterns

### Integration Testing
- Test switching between mock and live modes
- Verify UI indicators update correctly
- Ensure data consistency across mode switches

### Performance Testing
- Mock data provides instant responses
- No external API dependencies in demo mode
- Local storage persistence for settings

## Security Considerations

- Feature flags are client-side only (safe for public exposure)
- Mock data contains no sensitive information
- API credentials are not exposed in demo mode
- Local storage is cleared on demo mode disable

## Future Enhancements

Planned improvements:
- A/B testing support
- Feature flag analytics
- Gradual rollout capabilities
- Remote configuration updates
- Enhanced demo scenarios

## Troubleshooting

### Common Issues

**Feature flags not working:**
- Check environment variable names and values
- Clear browser localStorage
- Restart development server

**Demo mode not showing:**
- Verify `NEXT_PUBLIC_TACTICAL_DEMO_MODE=true`
- Check component imports
- Ensure React hooks are used inside components

**Data not switching:**
- Check TacticalDataService adapter selection
- Verify mock data format matches API format
- Look for console errors during data loading

**UI indicators missing:**
- Import DemoModeIndicator component
- Check feature flag conditions
- Verify component rendering logic

### Debug Steps

1. Check environment variables in browser dev tools
2. Use FeatureFlagPanel for runtime debugging
3. Monitor console logs for feature flag changes
4. Verify LocalStorage values
5. Test API connectivity when using live mode

---

**Last Updated**: January 29, 2025
**Version**: 1.0.0
**Author**: Hockey Hub Development Team