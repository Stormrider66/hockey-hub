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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CalendarIcon, Clock, Users, MapPin, Plus, X, 
  Dumbbell, Activity, Heart, Timer, TrendingUp,
  UserCheck
} from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateSessionMutation } from '@/store/api/trainingApi';
import { useCreateEventMutation, EventType, EventVisibility } from '@/store/api/calendarApi';
import BulkPlayerAssignment from './BulkPlayerAssignment';
import type { WorkoutSession, SessionFormData as FormData, Exercise } from '../types';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'react-hot-toast';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession?: (session: WorkoutSession) => void;
}

interface SessionFormData extends FormData {
  category: string; // Added for specific category selection
  team: string;
  coachId: string; // Added for coach assignment
  playerIds: string[]; // Changed from team to specific players
  description: string;
  exercises: Exercise[];
  maxParticipants: string;
  intensity: string;
  equipment: string[];
}

const SESSION_TYPES = [
  { value: 'strength', label: 'Strength Training', icon: Dumbbell },
  { value: 'cardio', label: 'Cardio/Conditioning', icon: Heart },
  { value: 'agility', label: 'Agility Training', icon: Timer },
  { value: 'speed', label: 'Speed Training', icon: TrendingUp },
  { value: 'recovery', label: 'Recovery Session', icon: Activity },
  { value: 'mixed', label: 'Mixed Training', icon: Activity },
  { value: 'hybrid', label: 'Hybrid Workout', icon: Dumbbell },
];

const TEAMS = [
  'A-Team',
  'J20 Team',
  'U18 Team',
  'U16 Team',
  'Individual Training',
  'All Teams'
];

const LOCATIONS = [
  'Main Gym',
  'Weight Room',
  'Field',
  'Track',
  'Ice Rink',
  'Recovery Room'
];

const EQUIPMENT = [
  'Barbells',
  'Dumbbells',
  'Kettlebells',
  'Medicine Balls',
  'Resistance Bands',
  'Agility Ladder',
  'Cones',
  'Jump Boxes',
  'TRX Straps',
  'Foam Rollers'
];

// Mock data for coaches - in production, this would come from an API
const COACHES = [
  { id: '1', name: 'John Smith', role: 'Physical Trainer' },
  { id: '2', name: 'Sarah Johnson', role: 'Physical Trainer' },
  { id: '3', name: 'Mike Williams', role: 'Ice Coach' },
  { id: '4', name: 'Emily Davis', role: 'Ice Coach' },
  { id: '5', name: 'Robert Brown', role: 'Assistant Coach' },
];

// Mock data for players - in production, this would come from an API
const PLAYERS = [
  { id: '1', name: 'Alex Ovechkin', number: 8, team: 'A-Team' },
  { id: '2', name: 'Sidney Crosby', number: 87, team: 'A-Team' },
  { id: '3', name: 'Connor McDavid', number: 97, team: 'A-Team' },
  { id: '4', name: 'Nikita Kucherov', number: 86, team: 'A-Team' },
  { id: '5', name: 'Nathan MacKinnon', number: 29, team: 'J20 Team' },
  { id: '6', name: 'Cale Makar', number: 8, team: 'J20 Team' },
  { id: '7', name: 'Adam Fox', number: 23, team: 'J20 Team' },
  { id: '8', name: 'Quinn Hughes', number: 43, team: 'U18 Team' },
  { id: '9', name: 'Trevor Zegras', number: 11, team: 'U18 Team' },
  { id: '10', name: 'Jack Hughes', number: 86, team: 'U18 Team' },
];

// Workout categories for different dashboard types
const WORKOUT_CATEGORIES = [
  { value: 'cardio', label: 'Cardio Session', description: 'HR/Watts monitoring' },
  { value: 'strength', label: 'Strength Session', description: 'Sets/Reps tracking' },
  { value: 'agility', label: 'Agility Training', description: 'Change of direction & reaction' },
  { value: 'skill', label: 'Skills Training', description: 'Technical development' },
  { value: 'interval', label: 'Interval Training', description: 'Work/Rest periods' },
  { value: 'circuit', label: 'Circuit Training', description: 'Station rotation' },
  { value: 'recovery', label: 'Recovery Session', description: 'Low intensity' },
  { value: 'hybrid', label: 'Hybrid Workout', description: 'Mixed exercises & intervals' },
];

// Sample exercise templates
const EXERCISE_TEMPLATES = {
  strength: [
    { name: 'Barbell Squats', sets: 4, reps: 8, rest: 90 },
    { name: 'Bench Press', sets: 4, reps: 10, rest: 90 },
    { name: 'Deadlifts', sets: 3, reps: 6, rest: 120 },
    { name: 'Pull-ups', sets: 3, reps: 'Max', rest: 90 },
  ],
  cardio: [
    { name: 'Sprint Intervals', sets: 8, duration: 30, rest: 90 },
    { name: 'Bike Intervals', sets: 10, duration: 60, rest: 60 },
    { name: 'Rowing', sets: 5, duration: 120, rest: 60 },
  ],
  speed: [
    { name: '40m Sprints', sets: 6, rest: 120 },
    { name: 'Linear Speed Drills', sets: 4, duration: 60, rest: 60 },
    { name: 'Acceleration Runs', sets: 5, duration: 45, rest: 60 },
  ],
  agility: [
    { name: 'T-Drill', sets: 5, duration: 30, rest: 60 },
    { name: 'Agility Ladder Drills', sets: 4, duration: 60, rest: 45 },
    { name: '5-10-5 Shuttle', sets: 6, duration: 20, rest: 90 },
    { name: 'Cone Weaving', sets: 4, duration: 45, rest: 60 },
    { name: 'Reactive Ball Drills', sets: 8, duration: 15, rest: 30 },
  ],
  hybrid: [
    { name: 'Power Clean + Sprint', sets: 4, reps: 3, duration: 30, rest: 120 },
    { name: 'Box Jump + Agility Ladder', sets: 5, reps: 5, duration: 45, rest: 90 },
    { name: 'Kettlebell Swings + Bike Sprint', sets: 6, reps: 15, duration: 30, rest: 60 },
  ]
};

export default function CreateSessionModal({
  open,
  onOpenChange,
  onCreateSession
}: CreateSessionModalProps) {
  const { user } = useAuth();
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [createCalendarEvent, { isLoading: isCreatingCalendarEvent }] = useCreateEventMutation();
  const [activeTab, setActiveTab] = useState('basic');
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    type: 'strength',
    category: 'strength',
    date: undefined,
    time: '09:00',
    duration: '60',
    location: '',
    team: user?.teams?.[0]?.id || '',
    coachId: user?.id || '',
    playerIds: [],
    description: '',
    exercises: [],
    maxParticipants: '20',
    intensity: 'medium',
    equipment: []
  });

  const updateFormData = <K extends keyof SessionFormData>(field: K, value: SessionFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExercise = (exercise: Exercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...exercise, id: Date.now() }]
    }));
  };

  const removeExercise = (id: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== id)
    }));
  };

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  };

  const togglePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      playerIds: prev.playerIds.includes(playerId)
        ? prev.playerIds.filter(id => id !== playerId)
        : [...prev.playerIds, playerId]
    }));
  };

  const selectAllPlayersFromTeam = (team: string) => {
    const teamPlayers = PLAYERS.filter(p => p.team === team);
    const teamPlayerIds = teamPlayers.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      playerIds: [...new Set([...prev.playerIds, ...teamPlayerIds])]
    }));
  };

  const clearPlayerSelection = () => {
    setFormData(prev => ({
      ...prev,
      playerIds: []
    }));
  };

  const handleSubmit = async () => {
    try {
      // Format the data for the API
      const sessionData = {
        name: formData.name,
        title: formData.name, // For new API
        type: formData.type,
        category: formData.category,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        time: formData.time,
        scheduledDate: formData.date ? `${format(formData.date, 'yyyy-MM-dd')}T${formData.time}:00` : '',
        duration: parseInt(formData.duration),
        estimatedDuration: parseInt(formData.duration),
        location: formData.location,
        team: formData.team,
        teamId: formData.team, // For new API
        coachId: formData.coachId,
        playerIds: formData.playerIds,
        description: formData.description || '',
        maxParticipants: parseInt(formData.maxParticipants),
        intensity: formData.intensity,
        exercises: formData.exercises.map((ex, index) => ({
          ...ex,
          orderIndex: index,
          category: ex.category || formData.type
        })),
        equipment: formData.equipment,
        settings: {
          allowIndividualLoads: true,
          displayMode: formData.category === 'cardio' ? 'grid' : 'focus',
          showMetrics: true,
          autoRotation: formData.category === 'cardio',
          rotationInterval: 30
        }
      };

      // Call the API to create the training session
      const result = await createSession(sessionData).unwrap();
      
      // Create calendar event for the training session
      const startDateTime = formData.date ? 
        new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.time}:00`).toISOString() : '';
      const endDateTime = formData.date ? 
        new Date(new Date(startDateTime).getTime() + parseInt(formData.duration) * 60000).toISOString() : '';
      
      const calendarEventData = {
        title: formData.name,
        description: formData.description || `${formData.type} training session${formData.team ? ` for ${formData.team}` : ''}`,
        type: EventType.TRAINING,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location,
        organizationId: user?.organizationId || '',
        teamId: formData.team,
        createdBy: formData.coachId,
        visibility: EventVisibility.TEAM,
        participants: formData.playerIds.map(playerId => ({
          userId: playerId,
          role: 'required' as const,
          type: 'user' as const
        })),
        metadata: {
          workoutId: result.id || result.data?.id,
          sessionType: formData.type,
          intensity: formData.intensity,
          equipment: formData.equipment,
          exercises: formData.exercises.length
        },
        maxParticipants: parseInt(formData.maxParticipants),
        sendReminders: true,
        reminderMinutes: [60, 15] // 1 hour and 15 minutes before
      };
      
      await createCalendarEvent(calendarEventData).unwrap();
      
      if (onCreateSession) {
        onCreateSession(result);
      }
      
      toast.success('Training session created successfully!');
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'strength',
        category: 'strength',
        date: undefined,
        time: '09:00',
        duration: '60',
        location: '',
        team: '',
        coachId: '',
        playerIds: [],
        description: '',
        exercises: [],
        maxParticipants: '20',
        intensity: 'medium',
        equipment: []
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  const isValid = formData.name && formData.date && formData.coachId && formData.playerIds.length > 0 && formData.location;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Training Session</DialogTitle>
          <DialogDescription>
            Schedule a new training session for your team
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="basic" className="space-y-4">
              {/* Session Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Morning Strength Training"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>

              {/* Session Type */}
              <div className="space-y-2">
                <Label>Session Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SESSION_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant={formData.type === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFormData('type', type.value)}
                      className="justify-start"
                    >
                      <type.icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Workout Category */}
              <div className="space-y-2">
                <Label>Workout Category</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => updateFormData('date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateFormData('time', e.target.value)}
                  />
                </div>
              </div>

              {/* Coach and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coach</Label>
                  <Select value={formData.coachId} onValueChange={(value) => updateFormData('coachId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {COACHES.map(coach => (
                        <SelectItem key={coach.id} value={coach.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{coach.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{coach.role}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Players ({formData.playerIds.length} selected)</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearPlayerSelection}
                    >
                      Clear All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkAssignment(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Bulk Assign
                    </Button>
                    <Select value="" onValueChange={(team) => selectAllPlayersFromTeam(team)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Add team" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAMS.filter(t => t !== 'Individual Training' && t !== 'All Teams').map(team => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {TEAMS.filter(t => t !== 'Individual Training' && t !== 'All Teams').map(team => (
                          <div key={team} className="space-y-2">
                            <div className="font-medium text-sm text-muted-foreground">{team}</div>
                            {PLAYERS.filter(p => p.team === team).map(player => (
                              <div key={player.id} className="flex items-center space-x-2 ml-4">
                                <Checkbox
                                  checked={formData.playerIds.includes(player.id)}
                                  onCheckedChange={() => togglePlayer(player.id)}
                                />
                                <label 
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                                  onClick={() => togglePlayer(player.id)}
                                >
                                  <span className="text-muted-foreground">#{player.number}</span>
                                  {player.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Duration and Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Select value={formData.duration} onValueChange={(value) => updateFormData('duration', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Max Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => updateFormData('maxParticipants', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {formData.type && EXERCISE_TEMPLATES[formData.type as keyof typeof EXERCISE_TEMPLATES]?.map((template, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{template.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addExercise(template)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Exercises */}
              <div className="space-y-2">
                <Label>Session Exercises ({formData.exercises.length})</Label>
                <Card>
                  <CardContent className="pt-4">
                    {formData.exercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No exercises added yet. Use templates or create custom exercises.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formData.exercises.map((exercise) => (
                          <div key={exercise.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="text-sm">
                              <span className="font-medium">{exercise.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {exercise.sets && `${exercise.sets} sets`}
                                {exercise.reps && ` × ${exercise.reps} reps`}
                                {exercise.duration && ` ${exercise.duration}s`}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeExercise(exercise.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {/* Intensity */}
              <div className="space-y-2">
                <Label>Intensity Level</Label>
                <Select value={formData.intensity} onValueChange={(value) => updateFormData('intensity', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Recovery Focus</SelectItem>
                    <SelectItem value="medium">Medium - Skill Development</SelectItem>
                    <SelectItem value="high">High - Performance Focus</SelectItem>
                    <SelectItem value="max">Maximum - Testing/Competition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <Label>Equipment Needed</Label>
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {EQUIPMENT.map(item => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.equipment.includes(item)}
                            onCheckedChange={() => toggleEquipment(item)}
                          />
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Session Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes or instructions for this session..."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isCreating || isCreatingCalendarEvent}>
            {isCreating || isCreatingCalendarEvent ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Bulk Player Assignment Modal */}
    <BulkPlayerAssignment
      open={showBulkAssignment}
      onOpenChange={setShowBulkAssignment}
      currentPlayerIds={formData.playerIds}
      onAssign={(playerIds) => {
        updateFormData('playerIds', playerIds);
        setShowBulkAssignment(false);
      }}
    />
    </>
  );
}