'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, Users, MapPin, Zap, 
  Dumbbell, Activity, Heart, Timer,
  AlertTriangle, Calendar
} from 'lucide-react';
import { format } from "date-fns";
import { useCreateSessionMutation } from '@/store/api/trainingApi';
import { 
  useCreateEventMutation, 
  useCheckConflictsMutation,
  EventType, 
  EventVisibility 
} from '@/store/api/calendarApi';
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface QuickSessionSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedDate?: Date;
  preSelectedTime?: string;
  onSuccess?: () => void;
}

const QUICK_SESSION_TYPES = [
  { value: 'strength', label: 'Strength', icon: Dumbbell, duration: 60 },
  { value: 'cardio', label: 'Cardio', icon: Heart, duration: 45 },
  { value: 'agility', label: 'Agility', icon: Zap, duration: 45 },
  { value: 'speed', label: 'Speed', icon: Timer, duration: 50 },
  { value: 'recovery', label: 'Recovery', icon: Activity, duration: 30 },
  { value: 'hybrid', label: 'Hybrid', icon: Dumbbell, duration: 75 },
];

const TEAMS = [
  { id: 'a-team', name: 'A-Team', playerCount: 22 },
  { id: 'j20', name: 'J20 Team', playerCount: 20 },
  { id: 'u18', name: 'U18 Team', playerCount: 18 },
  { id: 'u16', name: 'U16 Team', playerCount: 16 },
];

const LOCATIONS = [
  'Main Gym',
  'Weight Room',
  'Field',
  'Track',
];

export default function QuickSessionScheduler({
  open,
  onOpenChange,
  preSelectedDate,
  preSelectedTime,
  onSuccess
}: QuickSessionSchedulerProps) {
  const { user } = useAuth();
  const { t } = useTranslation(['physicalTrainer', 'calendar']);
  const [createSession] = useCreateSessionMutation();
  const [createCalendarEvent] = useCreateEventMutation();
  const [checkConflicts] = useCheckConflictsMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  
  const [sessionType, setSessionType] = useState('strength');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [notes, setNotes] = useState('');
  
  const selectedDuration = QUICK_SESSION_TYPES.find(t => t.value === sessionType)?.duration || 60;
  const totalPlayers = selectedTeams.reduce((acc, teamId) => {
    const team = TEAMS.find(t => t.id === teamId);
    return acc + (team?.playerCount || 0);
  }, 0);

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const checkForConflicts = async () => {
    if (!preSelectedDate || !preSelectedTime || selectedTeams.length === 0) return;
    
    setIsCheckingConflicts(true);
    try {
      const startDateTime = new Date(`${format(preSelectedDate, 'yyyy-MM-dd')}T${preSelectedTime}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + selectedDuration * 60000).toISOString();
      
      // Get all player IDs from selected teams (in real implementation, this would be from API)
      const participantIds = selectedTeams.flatMap(teamId => {
        // This is mock data - in real implementation, get player IDs from team
        return ['player1', 'player2', 'player3']; // Placeholder
      });
      
      const conflictResult = await checkConflicts({
        startTime: startDateTime,
        endTime: endDateTime,
        participantIds: participantIds
      }).unwrap();
      
      if (conflictResult.hasConflict && conflictResult.conflictingEvents) {
        setConflicts(conflictResult.conflictingEvents);
        setShowConflictWarning(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      // Continue anyway if conflict check fails
      return true;
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const handleSubmit = async (proceedWithConflicts = false) => {
    if (!preSelectedDate || !preSelectedTime || selectedTeams.length === 0 || !location) return;
    
    // Check for conflicts first unless we're proceeding despite conflicts
    if (!proceedWithConflicts && !showConflictWarning) {
      const canProceed = await checkForConflicts();
      if (!canProceed) return;
    }
    
    setIsSubmitting(true);
    try {
      const sessionNames = selectedTeams.map(teamId => 
        TEAMS.find(t => t.id === teamId)?.name
      ).join(', ');
      
      const sessionName = `${QUICK_SESSION_TYPES.find(t => t.value === sessionType)?.label} - ${sessionNames}`;
      
      // Create training session
      const sessionData = {
        name: sessionName,
        title: sessionName,
        type: sessionType,
        category: sessionType,
        date: format(preSelectedDate, 'yyyy-MM-dd'),
        time: preSelectedTime,
        scheduledDate: `${format(preSelectedDate, 'yyyy-MM-dd')}T${preSelectedTime}:00`,
        duration: selectedDuration,
        estimatedDuration: selectedDuration,
        location,
        team: selectedTeams.join(','),
        teamId: selectedTeams[0], // Primary team
        coachId: user?.id || '',
        playerIds: [], // Will be populated based on team selection in backend
        description: notes,
        maxParticipants: totalPlayers,
        intensity,
        exercises: [], // Quick sessions use templates
        equipment: [],
        settings: {
          allowIndividualLoads: true,
          displayMode: sessionType === 'cardio' ? 'grid' : 'focus',
          showMetrics: true,
          autoRotation: sessionType === 'cardio',
          rotationInterval: 30
        }
      };

      const result = await createSession(sessionData).unwrap();
      
      // Create calendar event
      const startDateTime = new Date(`${format(preSelectedDate, 'yyyy-MM-dd')}T${preSelectedTime}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + selectedDuration * 60000).toISOString();
      
      const calendarEventData = {
        title: sessionName,
        description: notes || `Quick ${sessionType} session`,
        type: EventType.TRAINING,
        startTime: startDateTime,
        endTime: endDateTime,
        location,
        organizationId: user?.organizationId || '',
        teamId: selectedTeams[0],
        createdBy: user?.id || '',
        visibility: EventVisibility.TEAM,
        participants: [], // Will be populated based on team selection
        metadata: {
          workoutId: result.id || result.data?.id,
          sessionType,
          intensity,
          quickSession: true,
          teams: selectedTeams
        },
        maxParticipants: totalPlayers,
        sendReminders: true,
        reminderMinutes: [30] // 30 minutes before for quick sessions
      };
      
      await createCalendarEvent(calendarEventData).unwrap();
      
      // Reset form
      setSessionType('strength');
      setSelectedTeams([]);
      setLocation('');
      setIntensity('medium');
      setNotes('');
      setConflicts([]);
      setShowConflictWarning(false);
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create quick session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedTeams.length > 0 && location;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Session Scheduler</DialogTitle>
          <DialogDescription>
            Schedule a training session for {preSelectedDate ? format(preSelectedDate, 'PPP') : 'selected date'} at {preSelectedTime || 'selected time'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Conflict Warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-200">
                {t('physicalTrainer:conflicts.title', { count: conflicts.length })}
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {t('physicalTrainer:quickScheduler.conflictMessage')}
                </p>
                <div className="space-y-1 mt-2">
                  {conflicts.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{event.title}</span>
                      <span className="text-muted-foreground">
                        ({format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')})
                      </span>
                    </div>
                  ))}
                  {conflicts.length > 3 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 italic">
                      {t('physicalTrainer:moreConflicts', { count: conflicts.length - 3 })}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Session Type Selection */}
          <div className="space-y-2">
            <Label>Session Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SESSION_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant={sessionType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSessionType(type.value)}
                  className="justify-start"
                >
                  <type.icon className="h-4 w-4 mr-2" />
                  {type.label}
                  <Badge variant="secondary" className="ml-auto">
                    {type.duration}m
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label>Select Teams ({selectedTeams.length} selected, {totalPlayers} players)</Label>
            <ScrollArea className="h-32 border rounded-md p-3">
              <div className="space-y-2">
                {TEAMS.map(team => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTeams.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <label 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between flex-1"
                      onClick={() => toggleTeam(team.id)}
                    >
                      <span>{team.name}</span>
                      <Badge variant="outline" className="ml-2">
                        <Users className="h-3 w-3 mr-1" />
                        {team.playerCount}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {loc}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <Label>Intensity</Label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Low - Recovery Focus
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                    Medium - Skill Development
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mr-2" />
                    High - Performance Focus
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Quick Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Duration: {selectedDuration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Participants: {totalPlayers} players</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span>Intensity: {intensity}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setConflicts([]);
            setShowConflictWarning(false);
            onOpenChange(false);
          }}>
            Cancel
          </Button>
          {showConflictWarning ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConflictWarning(false);
                  setConflicts([]);
                }}
                disabled={isSubmitting}
              >
                {t('physicalTrainer:quickScheduler.changeTime')}
              </Button>
              <Button 
                onClick={() => handleSubmit(true)} 
                disabled={!isValid || isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'Creating...' : t('physicalTrainer:quickScheduler.proceedAnyway')}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={!isValid || isSubmitting || isCheckingConflicts}
            >
              {isCheckingConflicts ? 'Checking...' : isSubmitting ? 'Creating...' : 'Schedule Session'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}