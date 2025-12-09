# Bulk Session Wizard

A comprehensive 3-step wizard for creating multiple parallel conditioning sessions with equipment and player management.

## Features

### 🧙‍♂️ 3-Step Wizard Interface
- **Step 1: Basic Configuration** - Date, time, facility, and session count
- **Step 2: Session Setup** - Equipment and player assignment per session
- **Step 3: Review & Create** - Final validation and session creation

### ⚡ Equipment Management
- Real-time equipment availability checking
- Visual conflict detection and warnings
- Support for 8 different equipment types
- Equipment capacity tracking and validation

### 👥 Player & Team Assignment
- Individual player selection with medical status
- Team-based bulk assignment
- Medical compliance integration
- Session-specific player assignment

### 🕐 Advanced Scheduling
- Staggered start times to reduce congestion
- Custom session durations (15-180 minutes)
- Equipment conflict resolution options
- Multiple facility support

### 🎯 Smart Validation
- Real-time form validation with error feedback
- Equipment conflict detection
- Player assignment validation
- Medical restriction checking

## Usage

### Basic Integration

```tsx
import { BulkSessionWizard } from '@/features/physical-trainer/components/bulk-sessions';

const MyComponent = () => {
  const handleComplete = async (config: BulkSessionConfig) => {
    try {
      await createBulkSessions(config);
      toast({ title: 'Sessions created successfully!' });
    } catch (error) {
      throw error; // Wizard handles error display
    }
  };

  return (
    <BulkSessionWizard
      onComplete={handleComplete}
      onCancel={() => setOpen(false)}
      isLoading={isCreating}
    />
  );
};
```

### Configuration Object

```typescript
interface BulkSessionConfig {
  // Basic settings
  numberOfSessions: number;     // 2-8 sessions
  sessionDate: string;          // ISO date string
  sessionTime: string;          // HH:MM format
  duration: number;             // Minutes (15-180)
  facilityId: string;           // Selected facility ID
  
  // Sessions array
  sessions: SessionConfiguration[];
  
  // Advanced options
  allowEquipmentConflicts: boolean;
  staggerStartTimes: boolean;
  staggerInterval: number;      // Minutes between starts
}
```

### Session Configuration

```typescript
interface SessionConfiguration {
  id: string;
  name: string;
  equipment: WorkoutEquipmentType[];  // Multiple equipment types
  playerIds: string[];               // Individual players
  teamIds: string[];                 // Teams (expands to players)
  startTime?: string;                // Override for staggered sessions
  notes?: string;                    // Session-specific notes
}
```

## Components

### BulkSessionWizard (Main Component)
```tsx
interface BulkSessionWizardProps {
  onComplete: (config: BulkSessionConfig) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}
```

### BasicConfigStep
- Facility selection with availability status
- Date/time pickers with validation
- Session count selector (2-8 sessions)
- Staggered timing configuration
- Equipment conflict policy settings

### SessionSetupStep
- Multi-select equipment configuration
- Real-time equipment conflict detection
- Player/team assignment interface
- Session naming and notes
- Quick actions for bulk operations

### ReviewStep
- Complete configuration overview
- Equipment usage summary
- Session timeline visualization
- Conflict warnings and recommendations
- Final validation before creation

## Features in Detail

### Equipment Management
- **8 Equipment Types**: bike_erg, rowing, treadmill, airbike, wattbike, skierg, rope_jump, running
- **Capacity Tracking**: Real-time availability checking against facility inventory
- **Conflict Resolution**: Visual warnings with recommendations
- **Multi-Equipment Sessions**: Each session can use multiple equipment types

### Scheduling Options
- **Staggered Starts**: Automatic calculation of session start times
- **Custom Intervals**: 5-30 minute stagger intervals
- **Time Range Display**: Shows earliest start to latest end time
- **Duration Validation**: Ensures sessions fit within facility hours

### Player Assignment
- **Medical Integration**: Shows player medical status and restrictions
- **Team Expansion**: Team selections automatically include all team members
- **Assignment Summary**: Real-time count of assigned participants
- **Validation**: Ensures each session has at least one participant

### Validation System
- **Step-by-Step**: Each step validates independently
- **Real-Time**: Immediate feedback on configuration changes
- **Equipment Conflicts**: Detailed conflict detection and resolution
- **Medical Compliance**: Integration with medical service for safety

## Mock Data Integration

The wizard integrates with existing mock data:

### Facilities
- `facility-001`: Main Training Center (50 capacity)
- `facility-002`: Cardio Center (30 capacity) 
- `facility-003`: Athletic Performance Lab (40 capacity)

### Equipment Availability
Each facility has realistic equipment inventories:
- **Main Center**: 12 bike ergs, 8 rowing machines, 6 treadmills, etc.
- **Cardio Center**: Focus on cardio equipment
- **Performance Lab**: Specialized testing equipment

### Players & Teams
- Full integration with existing player/team data
- Medical status from medical service
- Team rosters and player assignments

## Error Handling

### Validation Errors
- Field-level validation with immediate feedback
- Step-level error summaries
- Comprehensive error messages with suggestions

### Network Errors
- Automatic retry for failed API calls
- Loading states during operations
- Graceful error recovery

### Equipment Conflicts
- Visual conflict indicators
- Detailed conflict explanations
- Resolution recommendations
- Option to allow conflicts when appropriate

## Performance Considerations

### Optimizations
- Debounced validation to reduce API calls
- Efficient re-rendering with proper dependencies
- Lazy loading of equipment availability data
- Memoized calculations for performance

### Scalability
- Handles up to 8 parallel sessions
- Supports 50+ participants per session
- Real-time updates without performance degradation
- Efficient equipment conflict checking

## Integration Points

### Calendar Service
- Automatic calendar event creation
- Session metadata inclusion
- Participant notifications

### Medical Service
- Real-time medical status checking
- Exercise restriction validation
- Load adjustment recommendations

### Training Service
- Session creation and storage
- Equipment reservation processing
- Participant assignment handling

## Best Practices

### Session Planning
- Use staggered starts to reduce equipment conflicts
- Assign different equipment types to each session
- Consider facility capacity when setting session counts
- Keep session names descriptive for easy identification

### Equipment Management
- Check equipment availability before creating sessions
- Allow conflicts only when equipment can be safely shared
- Consider backup equipment for high-demand items
- Use equipment rotation strategies for large groups

### Player Assignment
- Review medical restrictions before assignment
- Balance session sizes for optimal training
- Consider skill levels when dividing players
- Communicate session assignments clearly to participants

## Testing

### Demo Component
The `BulkSessionWizardDemo` component provides:
- Complete integration example
- Feature showcase
- Usage patterns
- Best practices demonstration

### Import Testing
All components and types are validated through the test-imports file.

## Future Enhancements

### Planned Features
- Template saving for common configurations
- Recurring session scheduling
- Advanced equipment rotation algorithms
- Integration with external booking systems
- Mobile-responsive design improvements

### Analytics Integration
- Session creation tracking
- Equipment utilization metrics
- Participant engagement analytics
- Facility usage optimization

## Support

For questions or issues with the Bulk Session Wizard:
1. Check this README for common patterns
2. Review the demo component for integration examples
3. Consult the Physical Trainer documentation
4. Check existing components for similar patterns