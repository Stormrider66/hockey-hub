import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, User } from 'lucide-react';

export function TreatmentManagement() {
  const [activeTab, setActiveTab] = useState('scheduled');

  // Mock data
  const scheduledTreatments = [
    {
      id: 1,
      player: 'Erik Andersson',
      time: '09:00',
      type: 'Post-Surgery Assessment',
      therapist: 'Dr. Sarah Johnson',
      duration: '45 min',
      status: 'confirmed',
    },
    {
      id: 2,
      player: 'Marcus Lindberg',
      time: '10:00',
      type: 'Physiotherapy',
      therapist: 'Mike Chen',
      duration: '30 min',
      status: 'confirmed',
    },
    {
      id: 3,
      player: 'Viktor Nilsson',
      time: '11:30',
      type: 'Cognitive Testing',
      therapist: 'Dr. Emily Brown',
      duration: '60 min',
      status: 'pending',
    },
  ];

  const treatmentTypes = [
    { name: 'Physiotherapy', count: 12, color: 'bg-blue-100 text-blue-800' },
    { name: 'Massage Therapy', count: 8, color: 'bg-green-100 text-green-800' },
    { name: 'Cryotherapy', count: 5, color: 'bg-cyan-100 text-cyan-800' },
    { name: 'Rehabilitation', count: 10, color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Treatment Management</CardTitle>
              <CardDescription>Schedule and track all treatments</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Treatment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scheduled">Today's Schedule</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing Plans</TabsTrigger>
              <TabsTrigger value="history">Treatment History</TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="mt-6">
              <div className="space-y-3">
                {scheduledTreatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                        <p className="font-semibold">{treatment.time}</p>
                        <p className="text-xs text-muted-foreground">{treatment.duration}</p>
                      </div>
                      <div className="h-12 w-px bg-border" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{treatment.player}</p>
                          <Badge
                            variant={treatment.status === 'confirmed' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {treatment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{treatment.type}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {treatment.therapist}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                      <Button size="sm">Start Session</Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ongoing" className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                {treatmentTypes.map((type) => (
                  <Card key={type.name}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{type.name}</p>
                          <p className="text-sm text-muted-foreground">Active treatments</p>
                        </div>
                        <Badge className={type.color}>{type.count}</Badge>
                      </div>
                      <Button className="w-full mt-4" variant="outline" size="sm">
                        View All
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Treatment history will be displayed here</p>
                <Button className="mt-4" variant="outline">
                  Generate Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}