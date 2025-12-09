'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
import { 
  useOptimizedForm, 
  useOptimizedSelect,
  useOptimizedMultiSelect,
  useDebounce
} from '../utils/formOptimization';

interface QuickSessionSchedulerOptimizedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedDate?: Date;
  preSelectedTime?: string;
  onSuccess?: () => void;
}

interface SessionFormData {
  sessionType: string;
  selectedTeams: string[];
  location: string;
  intensity: string;
  notes: string;
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

// Memoized team checkbox component
const TeamCheckbox = React.memo(({ 
  team, 
  isSelected, 
  onToggle 
}: { 
  team: typeof TEAMS[0]; 
  isSelected: boolean; 
  onToggle: (teamId: string) => void;
}) => {
  const handleChange = useCallback(() => {
    onToggle(team.id);
  }, [team.id, onToggle]);
  
  return (
    <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
      <Checkbox 
        id={team.id}
        checked={isSelected}
        onCheckedChange={handleChange}
      />
      <Label
        htmlFor={team.id}
        className="flex-1 cursor-pointer text-sm font-normal"
      >
        <div className="flex items-center justify-between">
          <span>{team.name}</span>
          <Badge variant="secondary" className="ml-2">
            {team.playerCount} players
          </Badge>
        </div>
      </Label>
    </div>
  );
});

TeamCheckbox.displayName = 'TeamCheckbox';

export default function QuickSessionSchedulerOptimized({
  open,
  onOpenChange,
  preSelectedDate,
  preSelectedTime,
  onSuccess
}: QuickSessionSchedulerOptimizedProps) {
  const { user } = useAuth();
  const { t } = useTranslation(['physicalTrainer', 'calendar']);
  const [createSession] = useCreateSessionMutation();
  const [createCalendarEvent] = useCreateEventMutation();
  const [checkConflicts] = useCheckConflictsMutation();
  
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  
  // Use optimized form hook
  const form = useOptimizedForm<SessionFormData>({
    initialValues: {
      sessionType: 'strength',
      selectedTeams: [],
      location: '',
      intensity: 'medium',
      notes: ''
    },
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
    debounceMs: 500 // Longer debounce for notes field
  });
  
  // Optimized selects
  const sessionTypeSelect = useOptimizedSelect(
    form.values.sessionType,
    (value) => form.setFieldValue('sessionType', value)
  );
  
  const locationSelect = useOptimizedSelect(
    form.values.location,
    (value) => form.setFieldValue('location', value)
  );
  
  const intensitySelect = useOptimizedSelect(
    form.values.intensity,
    (value) => form.setFieldValue('intensity', value)
  );
  
  // Optimized multi-select for teams
  const teamsMultiSelect = useOptimizedMultiSelect(
    form.values.selectedTeams,
    (value) => form.setFieldValue('selectedTeams', value)
  );
  
  // Memoized calculations
  const selectedDuration = useMemo(() => 
    QUICK_SESSION_TYPES.find(t => t.value === form.values.sessionType)?.duration || 60,
    [form.values.sessionType]
  );
  
  const totalPlayers = useMemo(() => 
    form.values.selectedTeams.reduce((acc, teamId) => {
      const team = TEAMS.find(t => t.id === teamId);
      return acc + (team?.playerCount || 0);
    }, 0),
    [form.values.selectedTeams]
  );
  
  // Debounced conflict checking
  const debouncedTeams = useDebounce(form.values.selectedTeams, 1000);
  
  React.useEffect(() => {
    if (debouncedTeams.length > 0 && preSelectedDate && preSelectedTime) {
      checkForConflicts();
    }
  }, [debouncedTeams, preSelectedDate, preSelectedTime]);
  
  const checkForConflicts = useCallback(async () => {
    if (!preSelectedDate || !preSelectedTime || form.values.selectedTeams.length === 0) return true;
    
    setIsCheckingConflicts(true);
    try {
      const startDateTime = new Date(`${format(preSelectedDate, 'yyyy-MM-dd')}T${preSelectedTime}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + selectedDuration * 60000).toISOString();
      
      // Get all player IDs from selected teams
      const participantIds = form.values.selectedTeams.flatMap(teamId => {
        // This is mock data - in real implementation, get player IDs from team
        return ['player1', 'player2', 'player3'];
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
      } else {
        setConflicts([]);
        setShowConflictWarning(false);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return true;
    } finally {
      setIsCheckingConflicts(false);
    }
  }, [preSelectedDate, preSelectedTime, form.values.selectedTeams, selectedDuration, checkConflicts]);
  
  const handleSubmit = useCallback(async (values: SessionFormData, proceedWithConflicts = false) => {
    if (!preSelectedDate || !preSelectedTime || values.selectedTeams.length === 0 || !values.location) return;
    
    // Check for conflicts first unless we're proceeding despite conflicts
    if (!proceedWithConflicts && !showConflictWarning) {
      const canProceed = await checkForConflicts();
      if (!canProceed) return;
    }
    
    try {
      const startDateTime = new Date(`${format(preSelectedDate, 'yyyy-MM-dd')}T${preSelectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + selectedDuration * 60000);
      
      // Create training session
      const sessionData = {
        name: `Quick ${values.sessionType.charAt(0).toUpperCase() + values.sessionType.slice(1)} Session`,
        type: values.sessionType,
        date: startDateTime.toISOString(),
        duration: selectedDuration,
        location: values.location,
        intensity: values.intensity,
        teamIds: values.selectedTeams,
        notes: values.notes,
        createdBy: user?.id || 'physical-trainer'
      };
      
      const sessionResult = await createSession(sessionData).unwrap();
      
      // Create calendar event
      const eventData = {
        title: sessionData.name,
        description: values.notes || `${values.sessionType} training session`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        type: EventType.Training,
        visibility: EventVisibility.Public,
        location: values.location,
        teamIds: values.selectedTeams,
        sessionId: sessionResult.id,
        color: '#3b82f6',
        createdBy: user?.id || 'physical-trainer'
      };
      
      await createCalendarEvent(eventData).unwrap();
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      form.reset();
      setConflicts([]);
      setShowConflictWarning(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [preSelectedDate, preSelectedTime, selectedDuration, user, createSession, createCalendarEvent, onOpenChange, onSuccess, form, showConflictWarning, checkForConflicts]);
  
  // Memoized session type icon
  const SessionTypeIcon = useMemo(() => {
    const type = QUICK_SESSION_TYPES.find(t => t.value === form.values.sessionType);
    return type?.icon || Dumbbell;
  }, [form.values.sessionType]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('physicalTrainer:quickScheduler.title')}
          </DialogTitle>
          <DialogDescription>
            {t('physicalTrainer:quickScheduler.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit} className="space-y-4">
          {/* Session Type */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:quickScheduler.sessionType')}</Label>
            <Select {...sessionTypeSelect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUICK_SESSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                      <span className="text-muted-foreground">({type.duration} min)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Team Selection */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:quickScheduler.selectTeams')}</Label>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              {TEAMS.map((team) => (
                <TeamCheckbox
                  key={team.id}
                  team={team}
                  isSelected={teamsMultiSelect.includes(team.id)}
                  onToggle={teamsMultiSelect.toggle}
                />
              ))}
            </ScrollArea>
            {totalPlayers > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalPlayers} players selected
              </p>
            )}
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:quickScheduler.location')}</Label>
            <Select {...locationSelect}>
              <SelectTrigger>
                <SelectValue placeholder={t('physicalTrainer:quickScheduler.selectLocation')} />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{loc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Intensity */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:quickScheduler.intensity')}</Label>
            <Select {...intensitySelect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('common:intensity.low')}</SelectItem>
                <SelectItem value="medium">{t('common:intensity.medium')}</SelectItem>
                <SelectItem value="high">{t('common:intensity.high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('physicalTrainer:quickScheduler.notes')}</Label>
            <Textarea
              {...form.getFieldProps('notes')}
              placeholder={t('physicalTrainer:quickScheduler.notesPlaceholder')}
              rows={3}
            />
          </div>
          
          {/* Conflict Warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('calendar:conflicts.title')}</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  {conflicts.slice(0, 3).map((conflict, idx) => (
                    <p key={idx} className="text-sm">
                      • {conflict.title} ({format(new Date(conflict.startTime), 'HH:mm')} - {format(new Date(conflict.endTime), 'HH:mm')})
                    </p>
                  ))}
                  {conflicts.length > 3 && (
                    <p className="text-sm">... and {conflicts.length - 3} more conflicts</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <SessionTypeIcon className="h-4 w-4" />
                {form.values.sessionType.charAt(0).toUpperCase() + form.values.sessionType.slice(1)} Session
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {selectedDuration} minutes
              </span>
            </div>
            {preSelectedDate && preSelectedTime && (
              <div className="text-sm text-muted-foreground">
                {format(preSelectedDate, 'EEEE, MMMM d, yyyy')} at {preSelectedTime}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={form.isSubmitting}
            >
              {t('common:actions.cancel')}
            </Button>
            {showConflictWarning ? (
              <Button 
                type="button"
                variant="destructive"
                onClick={() => handleSubmit(form.values, true)}
                disabled={form.isSubmitting}
              >
                {t('calendar:conflicts.proceedAnyway')}
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={
                  form.isSubmitting || 
                  form.values.selectedTeams.length === 0 || 
                  !form.values.location ||
                  isCheckingConflicts
                }
              >
                {form.isSubmitting 
                  ? t('common:actions.creating')
                  : isCheckingConflicts
                    ? t('calendar:checkingConflicts')
                    : t('common:actions.createSession')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}