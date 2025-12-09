'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Zap, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  Settings
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

import type { 
  BulkSessionConfig, 
  EquipmentAvailability 
} from '../BulkSessionWizard';
import type { WorkoutEquipmentType } from '../../../types/conditioning.types';

interface ReviewStepProps {
  config: BulkSessionConfig;
  equipmentAvailability: EquipmentAvailability[];
  errors: string[];
}

interface SessionSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  equipment: WorkoutEquipmentType[];
  playerCount: number;
  teamCount: number;
  hasConflicts: boolean;
  notes?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  config,
  equipmentAvailability,
  errors
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Calculate session summaries
  const sessionSummaries: SessionSummary[] = config.sessions.map((session, index) => {
    const baseTime = config.sessionTime;
    const [hours, minutes] = baseTime.split(':').map(Number);
    
    // Calculate start time (considering staggering)
    const startMinutes = config.staggerStartTimes 
      ? hours * 60 + minutes + (index * config.staggerInterval)
      : hours * 60 + minutes;
    
    const startHours = Math.floor(startMinutes / 60) % 24;
    const startMins = startMinutes % 60;
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
    
    // Calculate end time
    const endMinutes = startMinutes + config.duration;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    
    // Check for equipment conflicts
    const hasConflicts = session.equipment.some(equipment => {
      const availability = equipmentAvailability.find(a => a.type === equipment);
      if (!availability) return false;
      
      const usage = config.sessions.filter(s => s.equipment.includes(equipment)).length;
      return usage > availability.available;
    });
    
    return {
      id: session.id,
      name: session.name,
      startTime,
      endTime,
      equipment: session.equipment,
      playerCount: session.playerIds.length,
      teamCount: session.teamIds.length,
      hasConflicts,
      notes: session.notes
    };
  });
  
  // Calculate total resource usage
  const calculateResourceUsage = () => {
    const equipmentUsage = new Map<WorkoutEquipmentType, number>();
    const totalPlayers = new Set<string>();
    const totalTeams = new Set<string>();
    
    config.sessions.forEach(session => {
      // Count equipment usage
      session.equipment.forEach(equipment => {
        equipmentUsage.set(equipment, (equipmentUsage.get(equipment) || 0) + 1);
      });
      
      // Count unique players and teams
      session.playerIds.forEach(id => totalPlayers.add(id));
      session.teamIds.forEach(id => totalTeams.add(id));
    });
    
    return {
      equipmentUsage,
      totalPlayers: totalPlayers.size,
      totalTeams: totalTeams.size
    };
  };
  
  const resourceUsage = calculateResourceUsage();
  
  // Get facility name (mock)
  const getFacilityName = (facilityId: string) => {
    const facilities = {
      'facility-001': 'Main Training Center',
      'facility-002': 'Cardio Center',
      'facility-003': 'Athletic Performance Lab'
    };
    return facilities[facilityId as keyof typeof facilities] || 'Unknown Facility';
  };
  
  // Calculate session duration range
  const getSessionTimeRange = () => {
    if (sessionSummaries.length === 0) return { start: '', end: '' };
    
    const startTimes = sessionSummaries.map(s => s.startTime);
    const endTimes = sessionSummaries.map(s => s.endTime);
    
    const earliestStart = startTimes.sort()[0];
    const latestEnd = endTimes.sort().reverse()[0];
    
    return { start: earliestStart, end: latestEnd };
  };
  
  const timeRange = getSessionTimeRange();
  
  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Bulk Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schedule Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(config.sessionDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Range:</span>
                  <span>{timeRange.start} - {timeRange.end}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{config.duration} min each</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span>{config.sessions.length} parallel</span>
                </div>
              </div>
            </div>
            
            {/* Facility Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Facility
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{getFacilityName(config.facilityId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staggered:</span>
                  <span>{config.staggerStartTimes ? 'Yes' : 'No'}</span>
                </div>
                {config.staggerStartTimes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interval:</span>
                    <span>{config.staggerInterval} min</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment Conflicts:</span>
                  <span>{config.allowEquipmentConflicts ? 'Allowed' : 'Blocked'}</span>
                </div>
              </div>
            </div>
            
            {/* Participants Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Players:</span>
                  <span>{resourceUsage.totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Teams:</span>
                  <span>{resourceUsage.totalTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment Types:</span>
                  <span>{resourceUsage.equipmentUsage.size}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Equipment Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Equipment Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(resourceUsage.equipmentUsage.entries()).map(([equipment, usage]) => {
              const availability = equipmentAvailability.find(a => a.type === equipment);
              const hasConflict = availability ? usage > availability.available : false;
              
              return (
                <div 
                  key={equipment}
                  className={cn(
                    'p-3 rounded-lg border',
                    hasConflict 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-green-300 bg-green-50'
                  )}
                >
                  <div className="font-medium text-sm capitalize mb-1">
                    {equipment.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {usage} session{usage !== 1 ? 's' : ''}
                  </div>
                  {availability && (
                    <div className="text-xs mt-1">
                      <span className={hasConflict ? 'text-red-600' : 'text-green-600'}>
                        {usage}/{availability.available} available
                      </span>
                    </div>
                  )}
                  {hasConflict && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Conflict
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          
          {resourceUsage.equipmentUsage.size === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No equipment has been selected for any session. Please go back and configure equipment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Individual Session Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessionSummaries.map((session, index) => (
              <div key={session.id}>
                {index > 0 && <Separator className="my-4" />}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{session.name}</h4>
                      {session.hasConflicts && (
                        <Badge variant="destructive" className="text-xs">
                          Equipment Conflict
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">{session.startTime} - {session.endTime}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Equipment:</span>
                        <div className="font-medium">{session.equipment.length} types</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Players:</span>
                        <div className="font-medium">{session.playerCount}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Teams:</span>
                        <div className="font-medium">{session.teamCount}</div>
                      </div>
                    </div>
                    
                    {/* Equipment list */}
                    {session.equipment.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Equipment: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {session.equipment.map(equipment => {
                            const availability = equipmentAvailability.find(a => a.type === equipment);
                            const usage = config.sessions.filter(s => s.equipment.includes(equipment)).length;
                            const hasConflict = availability ? usage > availability.available : false;
                            
                            return (
                              <Badge 
                                key={equipment}
                                variant={hasConflict ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {equipment.replace('_', ' ')}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Notes */}
                    {session.notes && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Notes: </span>
                        <p className="text-xs mt-1 p-2 bg-muted rounded">{session.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Warnings and Recommendations */}
      {(errors.length > 0 || sessionSummaries.some(s => s.hasConflicts)) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Warnings & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Equipment conflicts */}
              {sessionSummaries.some(s => s.hasConflicts) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some sessions have equipment conflicts. Consider:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Enabling "Allow Equipment Conflicts" if equipment can be shared</li>
                      <li>Staggering session start times to reduce peak equipment demand</li>
                      <li>Redistributing equipment across sessions</li>
                      <li>Using alternative equipment types</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Validation errors */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please resolve the following issues before creating sessions:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Recommendations */}
              <div className="text-sm space-y-2">
                <h5 className="font-medium">Recommendations:</h5>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Ensure all trainers are notified about the multiple parallel sessions</li>
                  <li>Verify facility capacity can accommodate all participants</li>
                  <li>Consider having backup equipment available</li>
                  <li>Brief participants on which session they're assigned to</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Success State */}
      {errors.length === 0 && !sessionSummaries.some(s => s.hasConflicts) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Ready to Create Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 text-sm">
              All sessions are properly configured and ready to be created. 
              Click "Create Sessions" to proceed with scheduling these {config.sessions.length} conditioning sessions.
            </p>
            
            <div className="mt-3 p-3 bg-background rounded border">
              <h5 className="text-sm font-medium mb-2">What happens next:</h5>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• {config.sessions.length} conditioning sessions will be created</li>
                <li>• Calendar events will be automatically generated</li>
                <li>• Assigned participants will receive notifications</li>
                <li>• Equipment reservations will be processed</li>
                <li>• Session details will be available in the dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewStep;