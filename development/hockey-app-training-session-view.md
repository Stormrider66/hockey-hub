# Update to Hockey App - Functional Descriptions

## 3.4 Training Management (training-service)

Under the section "Live Session Execution," the following addition should be made to describe the new functionality for the training session view:

```markdown
#### Training Session in Group View
- **Group view for shared screen**: Display of sessions on a shared screen (tablet, TV, computer)
  - Physical trainer selects team via clear icons
  - List of all players in the selected team is automatically displayed
  - Players can tap on their name to view their specific program
  - Group display of heart rate/watt data for all players during conditioning sessions
  - **Interval timer display**: 
    - Large, clear interval timer for group training
    - Automatic switching between work and rest
    - Audio signals to mark phase changes
    - Visual indication of current and upcoming intervals
    - Perfect for environments where players don't have access to mobile phones
  - Color-coded status indication to show relative intensity
  - Integrated with existing training session data
  - Touch screen-optimized interface for use in training environment
```

## Implementation Instructions for Cursor

The function to be implemented is a training session view for shared display, where physical trainers can manage training sessions on a shared screen. Here are the detailed requirements for the implementation:

### Components to Create

1. **TrainingSessionViewer.tsx** - Main component that handles display of different views
   - Should handle switching between different display modes:
     - Team selection
     - Player list
     - Individual program
     - Group metrics
     - Interval timer
   - Support for fullscreen mode
   - Responsive design for different screen sizes

2. **TeamSelection.tsx** - Component for displaying team icons and selecting a team
   - Show teams the physical trainer has access to
   - Clear icons for each team
   - Touch-friendly interface

3. **PlayerList.tsx** - Component for displaying players in the selected team
   - List of all players in the selected team
   - Option to display heart rate or watts for all
   - Button to activate interval timer

4. **PlayerProgram.tsx** - Component for displaying an individual player's program
   - Shows detailed training program for selected player
   - Shows real-time measurements (heart rate/watts) for the player
   - Clear structuring of training session parts

5. **TeamMetrics.tsx** - Component for displaying real-time measurements for the entire team
   - Table with all players and their real-time data
   - Sorting based on intensity
   - Color coding based on intensity level
   - Summary statistics for the team

6. **IntervalDisplay.tsx** - Component for displaying interval timer
   - Large, clear timer for work and rest phases
   - Visual indication of current interval
   - Countdown to next phase
   - Audio signals to mark transitions
   - Progress indicator for the entire session

### State Management

7. **trainingSessionViewerSlice.ts** - Redux slice to manage the state
   - Manage selected team
   - Manage selected player
   - Manage display mode (team-selection, player-list, etc.)
   - Manage metric type (heart rate or watts)
   - Manage fullscreen mode
   - Manage timer activity

8. **trainingSessionApi.ts** - RTK Query endpoints for data retrieval
   - Get teams for the physical trainer
   - Get players for a team
   - Get training program for a player
   - Get real-time measurements for a player
   - Get real-time measurements for the entire team
   - Get active session with interval details

### Backend Changes in training-service

9. **trainingSessionController.ts** - New endpoints to support the view
   - Endpoint for retrieving team metrics
   - Endpoint for retrieving active session with interval details

10. **webSocketService.ts** - WebSocket for real-time data
    - Support for subscription to team metrics updates
    - Broadcasting of updates to connected clients

### Technical Details

- Use shadcn/ui components for consistent appearance
- Implement responsive design with Tailwind CSS
- WebSocket for real-time updates
- Redux Toolkit for state management
- RTK Query for API integration
- TypeScript for type-safe code

### Permissions

The physical trainer role (fys_coach) needs the following permissions:
- Open group view for training sessions on a shared screen
- View and administer heart rate/watt data in real time
- Interact with the shared view for participants
- Switch between different team views
- Configure and start interval timers

### Specific Requirements for Interval Timer

- Clear display of current phase (work/rest)
- Countdown timer for ongoing interval
- Visual indication of which interval you are in out of the total number
- Audio signals for start and end of interval
- Possibility for automatic countdown announcements
- Display of key metrics simultaneously with timer

### Usage Flow

1. The physical trainer opens the training session view on a shared screen
2. Selects a team via the icon interface
3. Views the list of all players in the team
4. Can choose to see the group's heart rate/watt data or start an interval timer
5. During interval sessions, the screen clearly shows work phase/rest phase and countdown
6. For individual focus, a player can tap on their name to see their program

This functionality will make it possible to conduct effective group training sessions even when players don't have access to their mobile phones, and give the physical trainer better tools to monitor and control the intensity of the training sessions.