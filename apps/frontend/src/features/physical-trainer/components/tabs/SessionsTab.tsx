'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Dumbbell, Users } from 'lucide-react';
import BulkWorkoutAssignment from '../BulkWorkoutAssignment';

interface SessionsTabProps {
  onCreateSession: () => void;
  onNavigateToCalendar: () => void;
}

export default function SessionsTab({ onCreateSession, onNavigateToCalendar }: SessionsTabProps) {
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Session Management</CardTitle>
              <CardDescription>Create, schedule and manage physical training sessions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={onNavigateToCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowBulkAssignment(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign
              </Button>
              <Button onClick={onCreateSession}>
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session builder interface would go here */}
          <div className="h-96 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Session builder interface</p>
              <p className="text-sm text-muted-foreground">Drag and drop exercises, set intensity based on test data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Assignment Modal/Overlay */}
      {showBulkAssignment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <BulkWorkoutAssignment
              organizationId="org-123"
              userId="trainer-123"
              onClose={() => setShowBulkAssignment(false)}
              onSuccess={(count) => {
                console.log(`Created ${count} assignments`);
                setShowBulkAssignment(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}