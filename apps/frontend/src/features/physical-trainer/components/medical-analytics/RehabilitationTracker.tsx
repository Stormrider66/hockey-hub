'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Target } from 'lucide-react';

interface RehabilitationTrackerProps {
  teamId?: string;
  playerId?: string;
}

export const RehabilitationTracker: React.FC<RehabilitationTrackerProps> = ({
  teamId,
  playerId
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Rehabilitation Tracking</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Comprehensive rehabilitation exercise tracking, compliance monitoring, and progress analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exercise Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track rehabilitation exercise completion rates and adherence to therapy protocols.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Monitor achievement of rehabilitation milestones and functional improvement targets.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Therapy Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Analyze the effectiveness of different rehabilitation interventions and treatment approaches.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};