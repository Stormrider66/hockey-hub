'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Users, 
  Timer, 
  Zap,
  Info,
  Activity,
  Heart,
  Dumbbell
} from '@/components/icons';

export const RotationDemoSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Equipment Rotation System</h2>
        <p className="text-muted-foreground">
          Manage 24 players across 4 stations with limited equipment
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This demo showcases the rotation system with click-based player assignment.
          The full drag-and-drop functionality is being updated.
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">NHL All-Stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Different workouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 each</div>
            <p className="text-xs text-muted-foreground">Per station</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86 min</div>
            <p className="text-xs text-muted-foreground">Total session</p>
          </CardContent>
        </Card>
      </div>

      {/* Station Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Station Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Station 1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Rowing Station</span>
                <Badge variant="outline">6 rowers</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                High-intensity intervals
              </div>
            </div>

            {/* Station 2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Bike Erg Station</span>
                <Badge variant="outline">6 bikes</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Power intervals
              </div>
            </div>

            {/* Station 3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Ski Erg Station</span>
                <Badge variant="outline">6 ski ergs</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Full-body conditioning
              </div>
            </div>

            {/* Station 4 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Recovery Station</span>
                <Badge variant="outline">Open space</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Active recovery
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 text-orange-500" />
              <div>
                <div className="font-medium">Automatic Group Creation</div>
                <div className="text-sm text-muted-foreground">
                  Splits 24 players into 4 groups of 6 based on equipment availability
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <div className="font-medium">Real-time Equipment Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Monitors equipment usage and prevents double-booking
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 mt-0.5 text-red-500" />
              <div>
                <div className="font-medium">Medical Integration</div>
                <div className="text-sm text-muted-foreground">
                  Respects player injury status and exercise restrictions
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Timer className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <div className="font-medium">Automated Transitions</div>
                <div className="text-sm text-muted-foreground">
                  15-minute rotations with 2-minute transition periods
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="text-center">
        <Button size="lg" disabled className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Full Demo Coming Soon
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          The full interactive demo is being updated for better performance
        </p>
      </div>
    </div>
  );
};