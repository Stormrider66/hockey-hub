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
  Dumbbell, Activity, Heart, Timer, TrendingUp
} from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateSessionMutation } from '@/store/api/trainingApi';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession?: (session: any) => void;
}

interface SessionFormData {
  name: string;
  type: string;
  date: Date | undefined;
  time: string;
  duration: string;
  location: string;
  team: string;
  description: string;
  exercises: any[];
  maxParticipants: string;
  intensity: string;
  equipment: string[];
}

const SESSION_TYPES = [
  { value: 'strength', label: 'Strength Training', icon: Dumbbell },
  { value: 'cardio', label: 'Cardio/Conditioning', icon: Heart },
  { value: 'speed', label: 'Speed & Agility', icon: Timer },
  { value: 'recovery', label: 'Recovery Session', icon: Activity },
  { value: 'mixed', label: 'Mixed Training', icon: TrendingUp },
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
    { name: 'Agility Ladder Drills', sets: 4, duration: 60, rest: 60 },
    { name: 'Cone Drills', sets: 5, duration: 45, rest: 60 },
  ]
};

export default function CreateSessionModal({
  open,
  onOpenChange,
  onCreateSession
}: CreateSessionModalProps) {
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    type: 'strength',
    date: undefined,
    time: '09:00',
    duration: '60',
    location: '',
    team: '',
    description: '',
    exercises: [],
    maxParticipants: '20',
    intensity: 'medium',
    equipment: []
  });

  const updateFormData = (field: keyof SessionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExercise = (exercise: any) => {
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

  const handleSubmit = async () => {
    try {
      // Format the data for the API
      const sessionData = {
        name: formData.name,
        type: formData.type,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        time: formData.time,
        duration: parseInt(formData.duration),
        location: formData.location,
        team: formData.team,
        description: formData.description || '',
        maxParticipants: parseInt(formData.maxParticipants),
        intensity: formData.intensity,
        exercises: formData.exercises.map((ex, index) => ({
          ...ex,
          orderIndex: index,
          category: ex.category || formData.type
        })),
        equipment: formData.equipment
      };

      // Call the API
      const result = await createSession(sessionData).unwrap();
      
      if (onCreateSession) {
        onCreateSession(result);
      }
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'strength',
        date: undefined,
        time: '09:00',
        duration: '60',
        location: '',
        team: '',
        description: '',
        exercises: [],
        maxParticipants: '20',
        intensity: 'medium',
        equipment: []
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      // In a real app, show an error message to the user
    }
  };

  const isValid = formData.name && formData.date && formData.team && formData.location;

  return (
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

              {/* Team and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={formData.team} onValueChange={(value) => updateFormData('team', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAMS.map(team => (
                        <SelectItem key={team} value={team}>
                          {team}
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
          <Button onClick={handleSubmit} disabled={!isValid || isCreating}>
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}