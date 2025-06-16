import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer from './trainingSessionViewerSlice';
import { apiSlice } from '@/store/api/apiSlice';
import LaunchSessionButton from './LaunchSessionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Dumbbell, Heart } from 'lucide-react';

const store = configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

const Decorator = (Story: any) => (
  <Provider store={store}>
    <div className="p-6">
      <Story />
    </div>
  </Provider>
);

const meta = {
  title: 'Features/TrainingSessionViewer/LaunchSessionExamples',
  decorators: [Decorator],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Coach Dashboard Example
export const CoachDashboard: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Coach Dashboard - Team Sessions</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Training Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">A-Team Practice</div>
                <div className="text-sm text-muted-foreground">09:00 - Ice Training</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="team"
              teamId="a-team"
              size="sm"
              onLaunch={() => console.log('Launching A-Team session')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">U20 Team Practice</div>
                <div className="text-sm text-muted-foreground">14:00 - Physical Training</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="team"
              teamId="u20-team"
              size="sm"
              variant="outline"
              onLaunch={() => console.log('Launching U20 session')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

// Physical Trainer Dashboard Example
export const PhysicalTrainerDashboard: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Physical Trainer - Session Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Physical Training Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Strength Training - Group A</div>
                <div className="text-sm text-muted-foreground">High Intensity • 18 players</div>
              </div>
              <Badge variant="destructive">Live</Badge>
            </div>
            <LaunchSessionButton
              sessionType="team"
              teamId="group-a"
              intervals={[
                { phase: 'work', duration: 45 },
                { phase: 'rest', duration: 15 },
              ]}
              size="sm"
              onLaunch={() => console.log('Viewing live strength session')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Recovery Session</div>
                <div className="text-sm text-muted-foreground">Low Intensity • 8 players</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="team"
              teamId="recovery-group"
              size="sm"
              variant="outline"
              onLaunch={() => console.log('Starting recovery session')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

// Player Dashboard Example
export const PlayerDashboard: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Player Dashboard - Individual Training</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>My Training Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Off-Ice Sprint Training</div>
                <div className="text-sm text-muted-foreground">8 x 30s intervals</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="individual"
              playerId="player-123"
              intervals={[
                { phase: 'work', duration: 30 },
                { phase: 'rest', duration: 90 },
                { phase: 'work', duration: 30 },
                { phase: 'rest', duration: 90 },
                { phase: 'work', duration: 30 },
                { phase: 'rest', duration: 90 },
                { phase: 'work', duration: 30 },
                { phase: 'rest', duration: 90 },
              ]}
              size="sm"
              onLaunch={() => console.log('Starting individual sprint training')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Vacation Strength Program</div>
                <div className="text-sm text-muted-foreground">Bodyweight exercises</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="program"
              playerId="player-123"
              programId="vacation-strength"
              intervals={[
                { phase: 'work', duration: 45 },
                { phase: 'rest', duration: 15 },
              ]}
              size="sm"
              variant="outline"
              onLaunch={() => console.log('Starting vacation training')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

// Parent Dashboard Example
export const ParentDashboard: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Parent Dashboard - Monitor Child's Training</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Erik's Training Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Team Practice</div>
                <div className="text-sm text-muted-foreground">U16 Team • Currently Active</div>
              </div>
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            </div>
            <LaunchSessionButton
              sessionType="team"
              teamId="u16-team"
              size="sm"
              onLaunch={() => console.log('Parent viewing live team practice')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Individual Recovery</div>
                <div className="text-sm text-muted-foreground">Scheduled for 16:00</div>
              </div>
            </div>
            <LaunchSessionButton
              sessionType="individual"
              playerId="erik-123"
              size="sm"
              variant="outline"
              onLaunch={() => console.log('Parent viewing scheduled recovery')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
}; 