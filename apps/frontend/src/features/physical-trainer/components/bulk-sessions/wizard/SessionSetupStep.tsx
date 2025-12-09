'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Zap, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Edit2,
  Copy,
  Trash2
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Import equipment selector - temporary inline component to avoid import issues
const EquipmentSelector = ({ selected, onChange }: any) => {
  const equipmentTypes = ['rowing', 'bike_erg', 'ski_erg', 'running', 'assault_bike', 'swimming'];
  
  return (
    <div className="space-y-4">
      <Label>Select Equipment Type</Label>
      <div className="grid grid-cols-2 gap-2">
        {equipmentTypes.map(type => (
          <Button
            key={type}
            variant={selected === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(type)}
            className="justify-start"
          >
            {type.replace('_', ' ').toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Temporary placeholder for PlayerTeamAssignment
const PlayerTeamAssignment = ({ onPlayerSelectionChange, onTeamSelectionChange }: any) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Player assignment will be available after resolving component imports.
          For now, you can continue with equipment configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
};

import type { 
  BulkSessionConfig, 
  SessionConfiguration, 
  EquipmentAvailability 
} from '../BulkSessionWizard';
import type { WorkoutEquipmentType } from '../../../types/conditioning.types';

interface SessionSetupStepProps {
  config: BulkSessionConfig;
  equipmentAvailability: EquipmentAvailability[];
  onConfigChange: (updates: Partial<BulkSessionConfig>) => void;
  onSessionChange: (sessionId: string, updates: Partial<SessionConfiguration>) => void;
  errors: string[];
}

interface EquipmentConflict {
  equipment: WorkoutEquipmentType;
  required: number;
  available: number;
  conflictingSessions: string[];
}

export const SessionSetupStep: React.FC<SessionSetupStepProps> = ({
  config,
  equipmentAvailability,
  onConfigChange,
  onSessionChange,
  errors
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedSession, setSelectedSession] = useState(config.sessions[0]?.id || '');
  const [editingSessionName, setEditingSessionName] = useState<string | null>(null);
  
  // Calculate equipment conflicts
  const calculateEquipmentConflicts = (): EquipmentConflict[] => {
    const conflicts: EquipmentConflict[] = [];
    const equipmentUsage = new Map<WorkoutEquipmentType, string[]>();
    
    // Count equipment usage across all sessions
    config.sessions.forEach(session => {
      session.equipment.forEach(equipment => {
        const sessions = equipmentUsage.get(equipment) || [];
        sessions.push(session.id);
        equipmentUsage.set(equipment, sessions);
      });
    });
    
    // Check for conflicts
    equipmentUsage.forEach((sessionIds, equipment) => {
      const availability = equipmentAvailability.find(a => a.type === equipment);
      if (availability && sessionIds.length > availability.available) {
        conflicts.push({
          equipment,
          required: sessionIds.length,
          available: availability.available,
          conflictingSessions: sessionIds
        });
      }
    });
    
    return conflicts;
  };
  
  const equipmentConflicts = calculateEquipmentConflicts();
  const hasConflicts = equipmentConflicts.length > 0 && !config.allowEquipmentConflicts;
  
  // Get current session
  const currentSession = config.sessions.find(s => s.id === selectedSession);
  
  // Session management functions
  const duplicateSession = (sessionId: string) => {
    const sessionToDuplicate = config.sessions.find(s => s.id === sessionId);
    if (!sessionToDuplicate) return;
    
    const newSessionId = `session-${config.sessions.length + 1}`;
    const duplicatedSession: SessionConfiguration = {
      ...sessionToDuplicate,
      id: newSessionId,
      name: `${sessionToDuplicate.name} (Copy)`,
      playerIds: [...sessionToDuplicate.playerIds],
      teamIds: [...sessionToDuplicate.teamIds],
      equipment: [...sessionToDuplicate.equipment]
    };
    
    onConfigChange({
      sessions: [...config.sessions, duplicatedSession],
      numberOfSessions: config.numberOfSessions + 1
    });
  };
  
  const deleteSession = (sessionId: string) => {
    if (config.sessions.length <= 2) return; // Minimum 2 sessions
    
    const updatedSessions = config.sessions.filter(s => s.id !== sessionId);
    
    // Select another session if current one is deleted
    if (selectedSession === sessionId) {
      setSelectedSession(updatedSessions[0]?.id || '');
    }
    
    onConfigChange({
      sessions: updatedSessions,
      numberOfSessions: updatedSessions.length
    });
  };
  
  const updateSessionName = (sessionId: string, newName: string) => {
    onSessionChange(sessionId, { name: newName });
    setEditingSessionName(null);
  };
  
  // Get equipment capacity info
  const getEquipmentCapacity = (equipment: WorkoutEquipmentType) => {
    const availability = equipmentAvailability.find(a => a.type === equipment);
    if (!availability) return null;
    
    const usage = config.sessions.filter(s => s.equipment.includes(equipment)).length;
    
    return {
      total: availability.total,
      available: availability.available,
      reserved: availability.reserved,
      currentUsage: usage,
      hasConflict: usage > availability.available
    };
  };
  
  // Calculate session start time (considering staggering)
  const getSessionStartTime = (sessionIndex: number) => {
    if (!config.staggerStartTimes) return config.sessionTime;
    
    const [hours, minutes] = config.sessionTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (sessionIndex * config.staggerInterval);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Equipment Conflicts Alert */}
      {hasConflicts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Equipment conflicts detected:</p>
              {equipmentConflicts.map(conflict => (
                <div key={conflict.equipment} className="text-sm">
                  <strong>{conflict.equipment}:</strong> {conflict.required} sessions need this equipment, 
                  but only {conflict.available} are available
                </div>
              ))}
              <p className="text-sm">
                Enable "Allow Equipment Conflicts" in basic configuration or adjust session equipment.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Session Overview ({config.sessions.length} sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.sessions.map((session, index) => {
              const hasError = errors.some(e => e.includes(`Session ${index + 1}`));
              const equipmentConflictCount = session.equipment.filter(eq => {
                const capacity = getEquipmentCapacity(eq);
                return capacity?.hasConflict;
              }).length;
              
              return (
                <Card 
                  key={session.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedSession === session.id && 'ring-2 ring-primary',
                    hasError && 'border-red-300 bg-red-50'
                  )}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {editingSessionName === session.id ? (
                        <Input
                          value={session.name}
                          onChange={(e) => onSessionChange(session.id, { name: e.target.value })}
                          onBlur={() => setEditingSessionName(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingSessionName(null);
                            if (e.key === 'Escape') setEditingSessionName(null);
                          }}
                          className="text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <h4 
                          className="text-sm font-medium truncate cursor-pointer"
                          onClick={() => setEditingSessionName(session.id)}
                        >
                          {session.name}
                        </h4>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionName(session.id);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSession(session.id);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {config.sessions.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      {/* Start time */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getSessionStartTime(index)}</span>
                      </div>
                      
                      {/* Equipment count */}
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{session.equipment.length} equipment types</span>
                        {equipmentConflictCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1">
                            {equipmentConflictCount} conflicts
                          </Badge>
                        )}
                      </div>
                      
                      {/* Player/team count */}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {session.playerIds.length} players, {session.teamIds.length} teams
                        </span>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center gap-1 mt-2">
                        {session.equipment.length > 0 && 
                         (session.playerIds.length > 0 || session.teamIds.length > 0) ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">Configured</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-600">Needs setup</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Session Configuration */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Configure: {currentSession.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="equipment" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="players">Players & Teams</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              {/* Equipment Tab */}
              <TabsContent value="equipment" className="space-y-4">
                <div className="space-y-4">
                  <EquipmentSelector
                    selected={currentSession.equipment[0] || 'bike_erg' as WorkoutEquipmentType}
                    onChange={(equipment) => {
                      // For bulk sessions, we allow multiple equipment types
                      const currentEquipment = currentSession.equipment;
                      const isSelected = currentEquipment.includes(equipment);
                      
                      const updatedEquipment = isSelected
                        ? currentEquipment.filter(eq => eq !== equipment)
                        : [...currentEquipment, equipment];
                      
                      onSessionChange(currentSession.id, { equipment: updatedEquipment });
                    }}
                  />
                  
                  {/* Multi-select equipment display */}
                  <div className="space-y-2">
                    <Label>Selected Equipment Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentSession.equipment.map(equipment => {
                        const capacity = getEquipmentCapacity(equipment);
                        
                        return (
                          <Badge 
                            key={equipment}
                            variant={capacity?.hasConflict ? 'destructive' : 'default'}
                            className="flex items-center gap-1"
                          >
                            {equipment}
                            {capacity && (
                              <span className="text-xs">
                                ({capacity.currentUsage}/{capacity.available})
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-1"
                              onClick={() => {
                                const updatedEquipment = currentSession.equipment.filter(eq => eq !== equipment);
                                onSessionChange(currentSession.id, { equipment: updatedEquipment });
                              }}
                            >
                              ×
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                    
                    {currentSession.equipment.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Select equipment types from the options above
                      </p>
                    )}
                  </div>
                  
                  {/* Equipment capacity overview */}
                  {equipmentAvailability.length > 0 && (
                    <div className="space-y-2">
                      <Label>Equipment Availability Overview</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {equipmentAvailability.map(equipment => {
                          const usage = config.sessions.filter(s => 
                            s.equipment.includes(equipment.type)
                          ).length;
                          
                          return (
                            <div 
                              key={equipment.type}
                              className={cn(
                                'p-2 rounded border text-xs',
                                usage > equipment.available 
                                  ? 'border-red-300 bg-red-50' 
                                  : 'border-green-300 bg-green-50'
                              )}
                            >
                              <div className="font-medium capitalize">
                                {equipment.type.replace('_', ' ')}
                              </div>
                              <div className="text-muted-foreground">
                                {usage}/{equipment.available} used
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Players Tab */}
              <TabsContent value="players" className="space-y-4">
                <PlayerTeamAssignment
                  selectedPlayerIds={currentSession.playerIds}
                  selectedTeamIds={currentSession.teamIds}
                  onPlayerSelectionChange={(playerIds) => 
                    onSessionChange(currentSession.id, { playerIds })
                  }
                  onTeamSelectionChange={(teamIds) => 
                    onSessionChange(currentSession.id, { teamIds })
                  }
                  maxSelections={50} // Reasonable limit for conditioning sessions
                  showMedicalStatus={true}
                />
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  {/* Session Name */}
                  <div className="space-y-2">
                    <Label htmlFor="session-name">Session Name</Label>
                    <Input
                      id="session-name"
                      value={currentSession.name}
                      onChange={(e) => onSessionChange(currentSession.id, { name: e.target.value })}
                      placeholder="Enter session name"
                    />
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="session-notes">Session Notes</Label>
                    <Textarea
                      id="session-notes"
                      value={currentSession.notes || ''}
                      onChange={(e) => onSessionChange(currentSession.id, { notes: e.target.value })}
                      placeholder="Add any special instructions or notes for this session"
                      rows={3}
                    />
                  </div>
                  
                  {/* Custom Start Time (if staggered) */}
                  {config.staggerStartTimes && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-start-time">Custom Start Time</Label>
                      <Input
                        id="custom-start-time"
                        type="time"
                        value={currentSession.startTime || getSessionStartTime(config.sessions.indexOf(currentSession))}
                        onChange={(e) => onSessionChange(currentSession.id, { startTime: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Override the automatically calculated staggered start time
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Apply first session's equipment to all sessions
                const firstSession = config.sessions[0];
                if (firstSession) {
                  const updatedSessions = config.sessions.map(session => ({
                    ...session,
                    equipment: [...firstSession.equipment]
                  }));
                  onConfigChange({ sessions: updatedSessions });
                }
              }}
            >
              Copy Equipment to All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear all equipment selections
                const updatedSessions = config.sessions.map(session => ({
                  ...session,
                  equipment: []
                }));
                onConfigChange({ sessions: updatedSessions });
              }}
            >
              Clear All Equipment
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset session names to default pattern
                const updatedSessions = config.sessions.map((session, index) => ({
                  ...session,
                  name: `Conditioning Session ${index + 1}`
                }));
                onConfigChange({ sessions: updatedSessions });
              }}
            >
              Reset Session Names
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionSetupStep;