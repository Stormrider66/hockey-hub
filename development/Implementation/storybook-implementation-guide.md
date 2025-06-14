# Hockey Hub - Storybook Implementation Guide

## Overview

This guide provides detailed instructions for implementing Storybook in the Hockey Hub project to facilitate component-driven development, documentation, and testing. Based on the project's microservice architecture and user role requirements, this implementation plan will outline the setup, organization, and best practices for using Storybook effectively.

## Table of Contents

1. [Why Storybook for Hockey Hub](#why-storybook-for-hockey-hub)
2. [Setup and Configuration](#setup-and-configuration)
3. [Project Organization](#project-organization)
4. [Component Development Workflow](#component-development-workflow)
5. [Implementation Plan by Phase](#implementation-plan-by-phase)
6. [Advanced Testing Strategies](#advanced-testing-strategies)
7. [Performance Optimization](#performance-optimization)
8. [Documentation Standards](#documentation-standards)
9. [Integration with Existing Testing](#integration-with-existing-testing)
10. [Example Components](#example-components)

## Why Storybook for Hockey Hub

Hockey Hub's complexity makes it an ideal candidate for Storybook integration:

- **Diverse User Roles**: 8 different roles (admin, club_admin, coach, fys_coach, rehab, equipment_manager, player, parent) with unique UIs
- **Microservice Architecture**: Multiple services with dedicated UIs but consistent design language
- **Shadcn/UI + Tailwind**: Extensive UI component library that needs documentation and consistent implementation
- **Complex Interactions**: Training sessions, medical dashboards, and scheduling interfaces with rich interactivity
- **Accessibility Requirements**: Need to validate components against accessibility standards

## Setup and Configuration

### Installation

```bash
# Add Storybook to the project
npx storybook init

# Install essential addons for Hockey Hub's needs
npm install --save-dev @storybook/addon-a11y @storybook/addon-viewport @storybook/addon-interactions @storybook/test-runner @storybook/addon-coverage @storybook/addon-designs @storybook/addon-themes
```

### Configuration Files

#### .storybook/main.js

```javascript
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-coverage',
    '@storybook/addon-designs',
    '@storybook/addon-themes',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  features: {
    interactionsDebugger: true,
  },
  staticDirs: ['../public'],
};
```

#### .storybook/preview.js

```javascript
import { themes } from '@storybook/theming';
import '../src/styles/globals.css';
import { withThemeByClassName } from '@storybook/addon-themes';

// Import your context providers
import { ThemeProvider } from '../src/components/ui/theme-provider';
import { RoleProvider } from '../src/contexts/role-context';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#ffffff' },
      { name: 'dark', value: '#1e293b' },
    ],
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1280px',
          height: '800px',
        },
      },
    },
  },
  layout: 'fullscreen',
};

// Define Hockey Hub user roles for the role selector tool
export const globalTypes = {
  role: {
    name: 'User Role',
    description: 'The current user role',
    defaultValue: 'player',
    toolbar: {
      icon: 'user',
      items: [
        { value: 'admin', title: 'Admin' },
        { value: 'club_admin', title: 'Club Admin' },
        { value: 'coach', title: 'Coach' },
        { value: 'fys_coach', title: 'Physical Trainer' },
        { value: 'rehab', title: 'Medical Staff' },
        { value: 'equipment_manager', title: 'Equipment Manager' },
        { value: 'player', title: 'Player' },
        { value: 'parent', title: 'Parent' },
      ],
    },
  },
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'sun', title: 'Light' },
        { value: 'dark', icon: 'moon', title: 'Dark' },
      ],
    },
  },
};

// Create decorators for context providers
export const decorators = [
  withThemeByClassName({
    themes: {
      light: '',
      dark: 'dark',
    },
    defaultTheme: 'light',
  }),
  (Story, context) => {
    // Get the selected role from toolbar
    const role = context.globals.role;
    
    return (
      <ThemeProvider defaultTheme={context.globals.theme}>
        <RoleProvider role={role}>
          <div className={context.globals.theme === 'dark' ? 'dark' : ''}>
            <div className="bg-background text-foreground min-h-screen p-4">
              <Story />
            </div>
          </div>
        </RoleProvider>
      </ThemeProvider>
    );
  },
];
```

### Create Role Context for Testing

```typescript
// src/contexts/role-context.tsx
import React, { createContext, useContext, ReactNode } from 'react';

type Role = 'admin' | 'club_admin' | 'coach' | 'fys_coach' | 'rehab' | 'equipment_manager' | 'player' | 'parent';

interface RoleContextType {
  role: Role;
  permissions: string[];
}

// Define permissions for each role based on your role-based permissions document
const rolePermissions: Record<Role, string[]> = {
  admin: ['system.view', 'system.manage', 'organization.create'],
  club_admin: ['team.create', 'user.manage', 'team.view.all'],
  coach: ['training.create', 'team.view', 'player.view'],
  fys_coach: ['physical.create', 'test.manage', 'player.view'],
  rehab: ['injury.manage', 'medical.view', 'player.status.update'],
  equipment_manager: ['equipment.manage', 'team.view'],
  player: ['profile.view', 'training.view.own', 'calendar.view.own'],
  parent: ['child.view', 'absence.report', 'message.coach'],
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ 
  children, 
  role = 'player'
}: { 
  children: ReactNode; 
  role?: Role;
}) {
  const value = {
    role,
    permissions: rolePermissions[role],
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
```

## Project Organization

Organize your Storybook files to reflect Hockey Hub's microservice architecture:

```
/src
  /components
    /ui                      # shadcn/ui base components
      /button
        Button.tsx
        Button.stories.tsx
    /calendar-service        # Service-specific components 
      /event-card
        EventCard.tsx
        EventCard.stories.tsx
    /training-service
      /training-session-viewer
        TrainingSessionViewer.tsx
        TrainingSessionViewer.stories.tsx
    /medical-service
      /injury-tracker
        InjuryTracker.tsx
        InjuryTracker.stories.tsx
  /documentation             # Special documentation-only stories
    /design-system
      Colors.stories.tsx
      Typography.stories.tsx
      Spacing.stories.tsx
    /best-practices
      Forms.stories.tsx
      DataVisualization.stories.tsx
```

## Component Development Workflow

Follow this component-driven development workflow for all Hockey Hub components:

### 1. Component Specification

- **Create a story file first** with mock data and states before implementing the component
- Document requirements based on functional specifications
- Create stories for different states and user interactions

### 2. Implementation

- Implement the component to match the stories
- Use TypeScript for type safety
- Follow shadcn/ui and Tailwind CSS conventions

### 3. Testing in Storybook

- Test different states and props
- Validate accessibility
- Test responsive behavior
- Add interaction tests

### 4. Documentation

- Add comprehensive documentation
- Include usage examples
- Document prop API
- Add do's and don'ts

## Implementation Plan by Phase

### Phase 1: Foundation (2 weeks)

- **Setup Storybook** with all necessary addons
- **Document design tokens**
  - Colors from Tailwind/shadcn theme
  - Typography system
  - Spacing system
  - Shadows and effects
- **Create stories for shadcn/ui base components**
  - Button
  - Input
  - Select
  - Card
  - Dialog
  - Form components

### Phase 2: Core Components (2 weeks)

- **Layout components**
  - Container
  - Grid
  - Header/Navbar
  - Sidebar
  - Main Content Area
- **Role-based dashboard containers**
  - Create template for each role's home page
  - Document different information displays per role

### Phase 3: Role-Specific Components (6 weeks, iterative)

#### Admin Dashboard (1 week)

- System Health Dashboard
- Organization Management
- Administration Tools

#### Club Admin Dashboard (1 week)

- Organization Overview
- Team Overview Cards
- Administrative Tools

#### Coach Components (1 week)

- Team Snapshot
- Training Management
- Player Development

#### Physical Trainer Components (1 week)

- Training Dashboard
- Testing Overview
- Physical Status Components

#### Medical Components (1 week)

- Injury Dashboard
- Player Status Board
- Treatment Calendar

#### Player & Parent Components (1 week)

- Schedule Timeline
- Training Program View
- Health Status Components

### Phase 4: Module-Specific Components (6 weeks)

#### Calendar Module (1-2 weeks)

- EventCard with all event types
- Calendar Views
- Resource Booking Interface

#### Training Module (2 weeks)

- TrainingSessionViewer
- Exercise Cards
- Workout Templates
- Interval Timer
- Test Result Displays

#### Medical Module (1 week)

- Injury Tracking Forms
- Treatment Plans
- Player Availability Status

#### Communication Module (1 week)

- Message Components
- Chat Layouts
- Notification Components

#### Statistics Module (1 week)

- Data Visualization Components
- Performance Comparison Cards
- Trend Analysis Displays

### Phase 5: Integration & Refinement (2 weeks)

- **Page-Level Stories**
  - Compose components into full pages
  - Document user flows
- **Visual Regression Testing**
  - Set up Chromatic
  - Create baseline snapshots
- **Performance Testing**
  - Document performance optimization techniques
  - Test and optimize heavy components

## Advanced Testing Strategies

### Component Testing

```bash
# Install test runner
npm install --save-dev @storybook/test-runner

# Add to package.json
"scripts": {
  "test-storybook": "test-storybook"
}
```

### Visual Regression Testing

```bash
# Install Chromatic
npm install --save-dev chromatic

# Add to package.json
"scripts": {
  "chromatic": "chromatic --project-token=your_project_token"
}
```

### Interaction Testing

```typescript
// Example interaction test in a story
export const LoginForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill form
    await userEvent.type(canvas.getByLabelText(/email/i), 'coach@example.com');
    await userEvent.type(canvas.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));
    
    // Assert result
    await expect(canvas.getByText(/welcome/i)).toBeInTheDocument();
  },
};
```

### Accessibility Testing

Configure the a11y addon to validate components against WCAG standards:

```javascript
// .storybook/preview.js
export const parameters = {
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
      ],
    },
  },
};
```

## Performance Optimization

### Lazy Loading

```typescript
// .storybook/main.js
module.exports = {
  // ... other config
  features: {
    storyStoreV7: true, // Enables on-demand story loading
  },
};
```

### Story Composition

Create smaller focused stories and compose them into larger ones to improve maintainability:

```typescript
// Import smaller component stories
import { Default as ButtonDefault } from './Button.stories';
import { Default as InputDefault } from './Input.stories';

// Compose them into a form
export const LoginForm: Story = {
  render: () => (
    <form>
      <div className="space-y-4">
        <InputDefault {...InputDefault.args} />
        <ButtonDefault {...ButtonDefault.args} />
      </div>
    </form>
  ),
};
```

## Documentation Standards

### Component Documentation Template

For each component, include:

1. **Overview**: Brief description of the component's purpose
2. **Props API**: Detailed documentation of all props
3. **Usage Examples**: Basic examples of how to use the component
4. **Variants**: Different configurations/variants
5. **Accessibility**: A11y considerations
6. **Do's and Don'ts**: Best practices
7. **Related Components**: Links to related components

Example:

```typescript
// Button.stories.tsx
import { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `
## Overview

The Button component is used to trigger actions or navigate to other pages.

## Accessibility

- Uses native button element
- Includes focus styles
- Ensures sufficient color contrast

## Do's and Don'ts

✅ Do use Button for actionable items
❌ Don't use Button for navigation - use Link instead
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    // Other props...
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

// Other stories...
```

## Integration with Existing Testing

### Jest Integration

```typescript
// jest.config.js
module.exports = {
  // ... other config
  moduleNameMapper: {
    // Handle CSS imports
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  // Add setupFilesAfterEnv
  setupFilesAfterEnv: ['<rootDir>/.jest/setup.js'],
};
```

### Combining with Component Testing

```typescript
// Component.test.tsx
import { composeStories } from '@storybook/testing-react';
import { render, screen } from '@testing-library/react';
import * as stories from './Component.stories';

// Get all stories from the imports
const { Default, WithError } = composeStories(stories);

describe('Component', () => {
  it('renders default state correctly', () => {
    render(<Default />);
    // Add assertions
  });

  it('displays error message in error state', () => {
    render(<WithError />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Example Components

Here are some example implementations of key Hockey Hub components:

### 1. TrainingSessionViewer Component

This implements the group training view for physical trainers:

```typescript
// src/components/training-service/training-session-viewer/TrainingSessionViewer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TeamSelection } from './TeamSelection';
import { PlayerList } from './PlayerList';
import { PlayerProgram } from './PlayerProgram';
import { TeamMetrics } from './TeamMetrics';
import { IntervalDisplay } from './IntervalDisplay';
import { useFullscreen } from '@/hooks/useFullscreen';

export type ViewMode = 'team-selection' | 'player-list' | 'player-program' | 'team-metrics' | 'interval-timer';

export interface Team {
  id: string;
  name: string;
  icon?: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  heartRate?: number;
  watts?: number;
}

export interface IntervalData {
  current: number;
  total: number;
  timeRemaining: number;
  phase: 'work' | 'rest';
  totalWorkTime: number;
  totalRestTime: number;
}

interface TrainingSessionViewerProps {
  initialMode?: ViewMode;
  isFullScreen?: boolean;
  teams?: Team[];
  selectedTeam?: Team;
  players?: Player[];
  selectedPlayer?: Player;
  metricType?: 'heartRate' | 'watts';
  intervalData?: IntervalData;
  onTeamSelect?: (team: Team) => void;
  onPlayerSelect?: (player: Player) => void;
  onStartInterval?: () => void;
}

export function TrainingSessionViewer({
  initialMode = 'team-selection',
  isFullScreen = false,
  teams = [],
  selectedTeam,
  players = [],
  selectedPlayer,
  metricType = 'heartRate',
  intervalData,
  onTeamSelect,
  onPlayerSelect,
  onStartInterval,
}: TrainingSessionViewerProps) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  // Set fullscreen based on prop (allows control from outside)
  useEffect(() => {
    if (isFullScreen !== isFullscreen) {
      toggleFullscreen();
    }
  }, [isFullScreen]);
  
  const renderContent = () => {
    switch (mode) {
      case 'team-selection':
        return (
          <TeamSelection 
            teams={teams} 
            onTeamSelect={(team) => {
              onTeamSelect?.(team);
              setMode('player-list');
            }} 
          />
        );
        
      case 'player-list':
        return (
          <PlayerList 
            team={selectedTeam!} 
            players={players}
            onPlayerSelect={(player) => {
              onPlayerSelect?.(player);
              setMode('player-program');
            }}
            onViewTeamMetrics={() => setMode('team-metrics')}
            onStartInterval={() => {
              onStartInterval?.();
              setMode('interval-timer');
            }}
          />
        );
        
      case 'player-program':
        return (
          <PlayerProgram 
            player={selectedPlayer!}
            onBackToList={() => setMode('player-list')}
          />
        );
        
      case 'team-metrics':
        return (
          <TeamMetrics 
            team={selectedTeam!}
            players={players}
            metricType={metricType}
            onBackToList={() => setMode('player-list')}
          />
        );
        
      case 'interval-timer':
        return (
          <IntervalDisplay 
            intervalData={intervalData!}
            onComplete={() => setMode('player-list')} 
          />
        );
        
      default:
        return <div>Unknown mode</div>;
    }
  };
  
  return (
    <div className={`training-session-viewer ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Training Session</h1>
        
        <div className="flex items-center gap-2">
          {mode !== 'team-selection' && (
            <Button 
              variant="outline" 
              onClick={() => setMode('team-selection')}
            >
              Change Team
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-muted/20 rounded-lg min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
```

### 2. IntervalDisplay Component

```typescript
// src/components/training-service/training-session-viewer/IntervalDisplay.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { IntervalData } from './TrainingSessionViewer';

interface IntervalDisplayProps {
  intervalData: IntervalData;
  onComplete: () => void;
}

export function IntervalDisplay({ intervalData, onComplete }: IntervalDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(intervalData.timeRemaining);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Timer effect
  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Handle interval completion
          if (intervalData.current >= intervalData.total) {
            clearInterval(timer);
            onComplete();
          }
          // In a real implementation, you would trigger next interval here
          return intervalData.phase === 'work' ? intervalData.totalRestTime : intervalData.totalWorkTime;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, intervalData]);
  
  // Sound effect for interval transitions
  useEffect(() => {
    if (soundEnabled && timeLeft <= 3) {
      // Play countdown sound
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [timeLeft, soundEnabled]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const totalTime = intervalData.phase === 'work' ? intervalData.totalWorkTime : intervalData.totalRestTime;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center space-y-8">
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {intervalData.phase === 'work' ? 'WORK' : 'REST'}
            </div>
            
            <div className="text-xl">
              Interval <span className="font-bold">{intervalData.current}</span> of {intervalData.total}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  intervalData.phase === 'work' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          <div className="text-8xl font-bold">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="mr-2" /> : <VolumeX className="mr-2" />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-8">
            {Array.from({ length: intervalData.total }).map((_, idx) => (
              <div 
                key={idx}
                className={`h-3 rounded-full ${
                  idx + 1 === intervalData.current 
                    ? intervalData.phase === 'work' ? 'bg-red-500' : 'bg-blue-500'
                    : idx + 1 < intervalData.current ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Storybook Configuration for TrainingSessionViewer

```typescript
// src/components/training-service/training-session-viewer/TrainingSessionViewer.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TrainingSessionViewer } from './TrainingSessionViewer';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

// Mock data
const mockTeams = [
  { id: 'team-1', name: 'Junior Tigers', icon: '/icons/tiger.svg' },
  { id: 'team-2', name: 'Senior Lions', icon: '/icons/lion.svg' },
];

const mockPlayers = [
  { id: 'player-1', name: 'Erik Andersson', position: 'Forward', heartRate: 155, watts: 325 },
  { id: 'player-2', name: 'Johan Nilsson', position: 'Defense', heartRate: 148, watts: 310 },
  { id: 'player-3', name: 'Niklas Berg', position: 'Forward', heartRate: 162, watts: 340 },
  { id: 'player-4', name: 'Oskar Lind', position: 'Defense', heartRate: 145, watts: 305 },
  { id: 'player-5', name: 'Gustav Holm', position: 'Forward', heartRate: 158, watts: 330 },
];

const mockInterval = {
  current: 2,
  total: 8,
  timeRemaining: 45,
  phase: 'work',
  totalWorkTime: 60,
  totalRestTime: 30,
};

const meta: Meta<typeof TrainingSessionViewer> = {
  title: 'Training Module/TrainingSessionViewer',
  component: TrainingSessionViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Training Session Viewer

A comprehensive view for physical trainers to manage and display training sessions on a shared screen. 
This component supports team selection, player lists, individual programs, group metrics, and interval timers.

## Features

- Team selection via clear icons
- List display of all players in selected team
- Group display of heart rate/watt data
- Interval timer with work/rest phases
- Touch-optimized interface for gym environment

## Usage

This component is designed for the physical trainer (fys_coach) role to use on shared displays during group training sessions.
        `,
      },
    },
  },
  argTypes: {
    initialMode: {
      options: ['team-selection', 'player-list', 'player-program', 'team-metrics', 'interval-timer'],
      control: { type: 'select' },
      description: 'Initial view mode for the component',
    },
    isFullScreen: {
      control: 'boolean',
      description: 'Whether to display in fullscreen mode',
    },
    metricType: {
      options: ['heartRate', 'watts'],
      control: { type: 'radio' },
      description: 'Type of metrics to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrainingSessionViewer>;

// Basic example
export const Default: Story = {
  args: {
    initialMode: 'team-selection',
    isFullScreen: false,
    teams: mockTeams,
  },
};

// Team selection mode
export const TeamSelection: Story = {
  args: {
    initialMode: 'team-selection',
    isFullScreen: false,
    teams: mockTeams,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for component to load
    await expect(canvas.getByText('Training Session')).toBeInTheDocument();
    
    // Ensure teams are displayed
    await expect(canvas.getByText('Junior