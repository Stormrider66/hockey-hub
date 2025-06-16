import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import trainingSessionViewerReducer from './trainingSessionViewerSlice';
import { apiSlice } from '@/store/api/apiSlice';
import TrainingSessionViewer from './TrainingSessionViewer';
import LaunchSessionButton from './LaunchSessionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Dumbbell, Heart, Activity, Zap, Timer } from 'lucide-react';

// Create store with RTK-Query middleware
const createStore = () => configureStore({
  reducer: {
    trainingSessionViewer: trainingSessionViewerReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export default function IntegratedDemo() {
  const [showSession, setShowSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ name: string; type: string } | null>(null);
  const [store, setStore] = useState(() => createStore());

  const handleBackToDashboard = () => {
    setShowSession(false);
    setSessionInfo(null);
    // Reset the store to clear previous session state
    setStore(createStore());
  };

  if (showSession) {
    return (
      <Provider store={store}>
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="border-b px-4 py-3 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              {sessionInfo && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {sessionInfo.type} • {sessionInfo.name}
                  </div>
                  <Badge variant="outline" className="animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Live
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Session Time: 00:00</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TrainingSessionViewer />
          </div>
        </div>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Physical Training Dashboard
            </h1>
            <p className="text-muted-foreground">Launch and monitor training sessions with real-time metrics</p>
          </div>
          
          <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Today's Training Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Strength Training Session */}
              <div className="group flex items-center justify-between p-5 border rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Strength & Power Training</div>
                    <div className="text-sm text-muted-foreground">U20 Team • 09:00 • 90 min</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Olympic Lifts
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        Plyometrics
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-4">High Intensity</Badge>
                </div>
                <LaunchSessionButton
                  sessionType="team"
                  teamId="u20-strength"
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                  onLaunch={() => {
                    setSessionInfo({ name: 'U20 Team', type: 'Strength & Power Training' });
                    setShowSession(true);
                  }}
                />
              </div>

              {/* Cardio Interval Session */}
              <div className="group flex items-center justify-between p-5 border rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">High-Intensity Cardio Intervals</div>
                    <div className="text-sm text-muted-foreground">A-Team • 11:00 • 45 min</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        HR Zone Training
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        8x3min @ 90% HRM
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                      Zone 4-5
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Activity className="h-4 w-4 text-red-600" />
                      <span>165-185 BPM</span>
                    </div>
                  </div>
                </div>
                <LaunchSessionButton
                  sessionType="team"
                  teamId="a-team-cardio"
                  intervals={[
                    { phase: 'work' as const, duration: 180 }, // 3 min high intensity
                    { phase: 'rest' as const, duration: 90 },  // 1.5 min recovery
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 180 },
                    { phase: 'rest' as const, duration: 120 }, // Cool down
                  ]}
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
                  onLaunch={() => {
                    setSessionInfo({ name: 'A-Team', type: 'High-Intensity Cardio Intervals' });
                    setShowSession(true);
                  }}
                />
              </div>

              {/* Individual Sprint Training */}
              <div className="group flex items-center justify-between p-5 border rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Individual Sprint Training</div>
                    <div className="text-sm text-muted-foreground">Player: Erik Andersson • 14:00</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        10x30s sprints
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        Power output tracking
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
                    Explosive Power
                  </Badge>
                </div>
                <LaunchSessionButton
                  sessionType="individual"
                  playerId="erik-123"
                  intervals={[
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 90 },
                    { phase: 'work' as const, duration: 30 },
                    { phase: 'rest' as const, duration: 180 }, // Cool down
                  ]}
                  size="sm"
                  className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-md"
                  onLaunch={() => {
                    setSessionInfo({ name: 'Erik Andersson', type: 'Sprint Training' });
                    setShowSession(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/50 rounded-xl">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Session Features
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Real-time heart rate monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span>Automated interval timing</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span>Live performance metrics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Provider>
  );
} 