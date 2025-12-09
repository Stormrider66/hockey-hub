# Hockey Hub - Workout Lifecycle Demo Guide

## Overview
This guide shows how to access and navigate the comprehensive mock data showcase that demonstrates all the features implemented in the Hockey Hub workout lifecycle.

## Quick Start

### 1. Start the Development Server
```bash
cd apps/frontend
pnpm dev
```

### 2. Access the Demo
Navigate to: `http://localhost:3010/physicaltrainer/demo`

## Demo Features

### 📋 Overview Tab
Shows the complete workout lifecycle flow with feature highlights:
- 7 completed implementation phases
- Key metrics and capabilities
- System architecture overview

### 🏋️ Workouts Tab
Displays all 4 workout types with rich details:
- **Strength Training**: Traditional sets/reps with equipment
- **Conditioning**: Garmin 5-zone system with intervals
- **Hybrid**: Mixed exercises and cardio blocks
- **Agility**: Drill patterns with cone setups

Each workout shows:
- Complete exercise/interval details
- Medical modifications for injured players
- Equipment requirements
- Duration and intensity levels

### 📡 Live Sessions Tab
Real-time workout monitoring simulation:
- **Live metrics** updating every 2 seconds
- Heart rate zones with Garmin 5-zone colors
- Power output and pace tracking
- Compliance percentages
- Individual player performance cards

### 👥 Live Monitor Tab
Trainer's group monitoring view:
- Grid layout of all active players
- Real-time metrics for each participant
- Medical status indicators
- Performance alerts
- Zone distribution visualization

### 📅 Calendar Tab
Upcoming training sessions with:
- Workout metadata integration
- Color-coded by workout type
- Medical alerts for restricted players
- Quick preview information
- Launch buttons (simulated)

### 📊 Analytics Tab
Comprehensive performance analytics:
- **Team Performance**: Overall metrics and trends
- **Individual Analytics**: Player-specific data
- **Workout Effectiveness**: Session impact analysis
- **Zone Distribution**: Time in each heart rate zone
- **Progress Tracking**: Historical improvements

### 🤖 AI Insights Tab
Predictive analytics and recommendations:
- **Injury Risk Assessment**: ML-based predictions
- **Performance Optimization**: Training adjustments
- **Recovery Recommendations**: Rest and nutrition
- **Load Management**: Volume suggestions

### 📄 Reports Tab
Export examples and templates:
- **Weekly Team Report**: Comprehensive PDF summary
- **Individual Progress**: Player development tracking
- **Medical Compliance**: HIPAA-compliant exports
- Available formats: PDF, Excel, CSV, HTML

## Mock Data Players

### NHL Elite Players with Realistic Scenarios:

1. **Sidney Crosby** (#87)
   - Status: Injured (Grade 2 Back Strain)
   - Restrictions: No spinal loading, limited rotation
   - Modified workouts with alternatives

2. **Nathan MacKinnon** (#29)
   - Status: Limited (Minor Shoulder Impingement)
   - Restrictions: Limited overhead movements
   - 80% training capacity

3. **Connor McDavid** (#97)
   - Status: Healthy
   - Peak performance metrics
   - Full training capacity

4. **Auston Matthews** (#34)
   - Status: Healthy
   - High training load tolerance
   - Excellent recovery metrics

5. **Leon Draisaitl** (#29)
   - Status: Healthy
   - Moderate training load
   - Focus on conditioning

## Key Features to Explore

### 1. Medical Integration
- Click on injured players to see exercise modifications
- View alternative exercises for restricted movements
- Check compliance percentages during live sessions

### 2. Real-time Updates
- Watch live metrics change every 2 seconds
- See zone compliance tracking in real-time
- Monitor team aggregate performance

### 3. Analytics Deep Dive
- Click through different time periods
- Compare player performances
- View predictive insights

### 4. Export Functionality
- Try different export formats
- Preview report templates
- See scheduled report examples

## API Endpoints

All mock data is available through these endpoints:

```
GET /api/training/showcase/workouts
GET /api/training/showcase/sessions/active
GET /api/training/showcase/calendar
GET /api/training/showcase/analytics
GET /api/training/showcase/players
GET /api/training/showcase/reports
```

## Navigation Tips

1. **Tabs are lazy-loaded** - First click may take a moment
2. **Live data simulates** real-time updates automatically
3. **Click player cards** for detailed information
4. **Export buttons** demonstrate the export modal
5. **Medical alerts** show hover tooltips

## Testing Scenarios

### Scenario 1: Injured Player Workout
1. Go to Workouts tab
2. Find Sidney Crosby's modified strength workout
3. Note the exercise substitutions and load reductions

### Scenario 2: Live Group Monitoring
1. Go to Live Monitor tab
2. Watch multiple players' metrics update
3. See alerts for players outside target zones

### Scenario 3: Analytics Export
1. Go to Analytics tab
2. Click "Export Analytics" button
3. Select format and preview options

### Scenario 4: Calendar Integration
1. Go to Calendar tab
2. See upcoming workouts with metadata
3. Note medical alerts on events

## Technical Notes

- Mock data updates use `setInterval` for realistic simulation
- All player data is based on realistic NHL athlete profiles
- Medical scenarios represent common hockey injuries
- Performance metrics align with elite athlete standards

## Troubleshooting

If the demo doesn't load:
1. Ensure frontend is running on port 3010
2. Check browser console for errors
3. Try refreshing the page
4. Verify mock auth is enabled

---

This demo showcases the complete Hockey Hub workout lifecycle implementation with production-ready features and realistic data scenarios.