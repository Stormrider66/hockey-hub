import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface TreatmentManagerProps {
  isLoading?: boolean;
}

export function TreatmentManager({ isLoading }: TreatmentManagerProps) {
  // Mock data for now
  const treatments = [
    {
      id: 1,
      player: 'Erik Andersson',
      type: 'Physiotherapy',
      schedule: 'Daily',
      progress: 'Good',
      nextSession: 'Tomorrow 10:00',
    },
    {
      id: 2,
      player: 'Marcus Lindberg',
      type: 'Massage Therapy',
      schedule: '3x per week',
      progress: 'Excellent',
      nextSession: 'Today 15:00',
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Treatment Plans</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Treatment Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {treatments.map((treatment) => (
              <div
                key={treatment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{treatment.player}</p>
                  <p className="text-sm text-muted-foreground">
                    {treatment.type} • {treatment.schedule}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50">
                      {treatment.progress}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Next: {treatment.nextSession}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Active Plans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold">89%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold">4.2</p>
              <p className="text-sm text-muted-foreground">Avg. Recovery (weeks)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}