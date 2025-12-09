# How to Verify Enhanced Conditioning Features

## Quick Check Steps

1. **Start the Frontend** (if not already running):
   ```bash
   cd apps/frontend
   pnpm dev
   ```

2. **Navigate to Physical Trainer Dashboard**:
   - Go to: `http://localhost:3010/physicaltrainer`
   - Click on "Sessions" tab
   - Click "Create New Session" dropdown
   - Select "Conditioning Workout"

3. **In the Conditioning Workout Builder**:
   - Click the "Add Interval" button in the center panel
   - Click on the newly added interval in the timeline to edit it
   - **IMPORTANT**: The editor panel on the right should show "Edit Interval (Enhanced)"

4. **Check for Enhanced Features**:
   You should see 4 tabs in the interval editor:
   - **Heart Rate Tab**:
     - Garmin HR Zone selection (Zones 1-5 with colors)
     - Percentage of Max HR with slider
     - Absolute BPM input
   - **Power Tab**:
     - Power Zones (1-7)
     - Percentage of FTP with slider
     - Absolute Watts input
   - **Pace Tab**:
     - Pace per 500m (for rowing)
     - Speed in km/h (for bike/treadmill)
   - **Other Tab**:
     - RPE (Rate of Perceived Exertion)
     - Cadence/RPM
     - Equipment-specific settings

## If You See the Old Version

If you only see basic heart rate input without zones/percentages:

1. **Clear Browser Cache**:
   - Press Ctrl+Shift+R (hard refresh)
   - Or open DevTools (F12) → Network tab → Check "Disable cache"

2. **Restart Frontend with Clean Cache**:
   ```powershell
   cd apps/frontend
   Remove-Item -Path ".next" -Recurse -Force
   pnpm dev
   ```

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any import errors
   - Check if EnhancedIntervalForm is being loaded

## Visual Confirmation

The Enhanced version should show:
- Title says "Edit Interval (Enhanced)"
- 4 tabs for different metric types
- Visual zone selection with colored buttons
- Sliders for percentage-based targets
- Multiple input methods for each metric

## Test Direct URL
Once server is running, try:
- `http://localhost:3010/physicaltrainer/test-interval-form`

This should show the enhanced interval form in isolation for testing.