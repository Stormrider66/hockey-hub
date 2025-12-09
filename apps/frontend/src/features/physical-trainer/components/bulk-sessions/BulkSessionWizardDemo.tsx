'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Users, Plus, Calendar } from '@/components/icons';

import { BulkSessionWizard } from './BulkSessionWizard';
import type { BulkSessionConfig } from './BulkSessionWizard';

/**
 * Demo component for the BulkSessionWizard
 * Shows how to integrate and use the wizard in your application
 */
export const BulkSessionWizardDemo: React.FC = () => {
  const { toast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [createdSessions, setCreatedSessions] = useState<BulkSessionConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Handle wizard completion
  const handleWizardComplete = async (config: BulkSessionConfig) => {
    try {
      setIsCreating(true);
      
      // Simulate API call to create sessions
      console.log('Creating bulk sessions with config:', config);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to created sessions list
      setCreatedSessions(prev => [...prev, { ...config, id: Date.now().toString() }]);
      
      // Show success toast
      toast({
        title: 'Sessions Created Successfully!',
        description: `Created ${config.numberOfSessions} conditioning sessions for ${config.sessionDate}`,
        variant: 'default'
      });
      
      // Close wizard
      setIsWizardOpen(false);
      
    } catch (error) {
      console.error('Failed to create sessions:', error);
      throw error; // Re-throw so wizard can handle the error
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle wizard cancellation
  const handleWizardCancel = () => {
    setIsWizardOpen(false);
  };
  
  // Format session time range
  const formatTimeRange = (config: BulkSessionConfig) => {
    if (config.sessions.length === 0) return 'No sessions';
    
    const startTimes = config.sessions.map((_, index) => {
      if (!config.staggerStartTimes) return config.sessionTime;
      
      const [hours, minutes] = config.sessionTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + (index * config.staggerInterval);
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    });
    
    const endTimes = startTimes.map(startTime => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + config.duration;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    });
    
    const earliestStart = startTimes.sort()[0];
    const latestEnd = endTimes.sort().reverse()[0];
    
    return `${earliestStart} - ${latestEnd}`;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Session Wizard Demo</h1>
          <p className="text-muted-foreground mt-2">
            Create multiple parallel conditioning sessions with the step-by-step wizard
          </p>
        </div>
        
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Bulk Sessions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-none w-[95vw] h-[90vh] p-0">
            <BulkSessionWizard
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Wizard Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Basic Configuration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select date, time, and duration</li>
                <li>• Choose facility from available options</li>
                <li>• Configure number of parallel sessions (2-8)</li>
                <li>• Enable staggered start times</li>
                <li>• Set equipment conflict policies</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Session Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Configure equipment for each session</li>
                <li>• Assign players and teams</li>
                <li>• Add session-specific notes</li>
                <li>• Visual equipment conflict detection</li>
                <li>• Quick actions for bulk operations</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Review & Create</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete session overview</li>
                <li>• Equipment usage summary</li>
                <li>• Conflict warnings and recommendations</li>
                <li>• Final validation before creation</li>
                <li>• Detailed session breakdown</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Previously Created Sessions */}
      {createdSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Created Session Groups ({createdSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {createdSessions.map((config, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        Session Group {index + 1}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(config.sessionDate).toLocaleDateString()} • {formatTimeRange(config)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {config.numberOfSessions} sessions
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">{config.duration} minutes</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Facility:</span>
                      <div className="font-medium">
                        {config.facilityId === 'facility-001' && 'Main Training Center'}
                        {config.facilityId === 'facility-002' && 'Cardio Center'}
                        {config.facilityId === 'facility-003' && 'Athletic Performance Lab'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Staggered:</span>
                      <div className="font-medium">
                        {config.staggerStartTimes ? `Yes (${config.staggerInterval}min)` : 'No'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Conflicts:</span>
                      <div className="font-medium">
                        {config.allowEquipmentConflicts ? 'Allowed' : 'Blocked'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Session list */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Sessions:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {config.sessions.map((session, sessionIndex) => (
                        <div key={session.id} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium">{session.name}</div>
                          <div className="text-muted-foreground">
                            {session.equipment.length} equipment types, {session.playerIds.length} players
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here's how to integrate the BulkSessionWizard into your application:
            </p>
            
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { BulkSessionWizard } from '@/features/physical-trainer/components/bulk-sessions';

// In your component
const handleComplete = async (config: BulkSessionConfig) => {
  try {
    // Your API call to create sessions
    await createBulkSessions(config);
    
    toast({
      title: 'Success!',
      description: \`Created \${config.numberOfSessions} sessions\`
    });
  } catch (error) {
    // Handle error - wizard will show error state
    throw error;
  }
};

// Render wizard
<BulkSessionWizard
  onComplete={handleComplete}
  onCancel={() => setOpen(false)}
  isLoading={isCreating}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
      
      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use staggered start times to reduce equipment conflicts</li>
                <li>• Allow equipment conflicts only when equipment can be safely shared</li>
                <li>• Assign different equipment types to each session when possible</li>
                <li>• Keep session names descriptive for easy identification</li>
                <li>• Consider facility capacity when setting number of sessions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Common Scenarios:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Team divisions:</strong> Create separate sessions for different skill levels</li>
                <li>• <strong>Equipment rotation:</strong> Rotate teams through different equipment stations</li>
                <li>• <strong>Time constraints:</strong> Use staggered starts to fit more athletes in limited time</li>
                <li>• <strong>Large groups:</strong> Split large teams into smaller, manageable sessions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkSessionWizardDemo;