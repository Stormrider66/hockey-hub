"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell, Calendar as CalendarIcon, Clock, User,
  MapPin, Target, AlertCircle, CheckCircle
} from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";

interface PersonalTrainingBookingProps {
  onClose: () => void;
  selectedSlot?: { start: Date; end: Date } | null;
  playerTeam?: string;
}

export function PersonalTrainingBooking({ 
  onClose, 
  selectedSlot,
  playerTeam = "Senior Team"
}: PersonalTrainingBookingProps) {
  const [step, setStep] = useState<'type' | 'schedule' | 'details' | 'confirm'>('type');
  const [booking, setBooking] = useState({
    type: '',
    date: selectedSlot?.start || new Date(),
    time: selectedSlot ? format(selectedSlot.start, 'HH:mm') : '16:00',
    duration: '60',
    trainerId: '',
    location: '',
    goals: [] as string[],
    notes: '',
    recurring: false,
    recurrencePattern: 'weekly'
  });

  const trainingTypes = [
    {
      id: 'strength',
      title: 'Strength Training',
      description: 'Build power and muscle strength',
      icon: Dumbbell,
      duration: 60
    },
    {
      id: 'skills',
      title: 'Skills Development',
      description: 'Improve stickhandling, shooting, skating',
      icon: Target,
      duration: 60
    },
    {
      id: 'conditioning',
      title: 'Conditioning',
      description: 'Enhance endurance and speed',
      icon: Clock,
      duration: 45
    },
    {
      id: 'recovery',
      title: 'Recovery Session',
      description: 'Stretching, mobility, injury prevention',
      icon: User,
      duration: 30
    }
  ];

  const trainers = [
    { id: '1', name: 'Mike Johnson', specialties: ['strength', 'conditioning'], available: true },
    { id: '2', name: 'Sarah Williams', specialties: ['skills', 'recovery'], available: true },
    { id: '3', name: 'Tom Anderson', specialties: ['skills', 'conditioning'], available: false },
  ];

  const locations = [
    { id: 'gym', name: 'Team Gym', types: ['strength', 'conditioning', 'recovery'] },
    { id: 'rink', name: 'Practice Rink', types: ['skills'] },
    { id: 'field', name: 'Outdoor Field', types: ['conditioning'] },
  ];

  const handleNext = () => {
    const steps: typeof step[] = ['type', 'schedule', 'details', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: typeof step[] = ['type', 'schedule', 'details', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    console.log('Booking personal training:', booking);
    onClose();
  };

  const selectedType = trainingTypes.find(t => t.id === booking.type);
  const availableTrainers = trainers.filter(t => 
    t.specialties.includes(booking.type) && t.available
  );
  const availableLocations = locations.filter(l => 
    l.types.includes(booking.type)
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Personal Training</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Schedule a one-on-one training session
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Training Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <h3 className="font-medium">Select Training Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {trainingTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      booking.type === type.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setBooking({ ...booking, type: type.id, duration: type.duration.toString() })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <type.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{type.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {type.duration} min
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">{selectedType?.title} - Schedule</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={booking.date}
                    onSelect={(date) => date && setBooking({ ...booking, date })}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border mt-2"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Select 
                      value={booking.time} 
                      onValueChange={(v) => setBooking({ ...booking, time: v })}
                    >
                      <SelectTrigger id="time" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 14 }, (_, i) => i + 6).map((hour) => (
                          ['00', '30'].map((min) => (
                            <SelectItem key={`${hour}:${min}`} value={`${hour.toString().padStart(2, '0')}:${min}`}>
                              {hour > 12 ? hour - 12 : hour}:{min} {hour >= 12 ? 'PM' : 'AM'}
                            </SelectItem>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Select 
                      value={booking.duration} 
                      onValueChange={(v) => setBooking({ ...booking, duration: v })}
                    >
                      <SelectTrigger id="duration" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="trainer">Trainer</Label>
                    <Select 
                      value={booking.trainerId} 
                      onValueChange={(v) => setBooking({ ...booking, trainerId: v })}
                    >
                      <SelectTrigger id="trainer" className="mt-1">
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTrainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select 
                      value={booking.location} 
                      onValueChange={(v) => setBooking({ ...booking, location: v })}
                    >
                      <SelectTrigger id="location" className="mt-1">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <h3 className="font-medium">Training Details</h3>

              <div>
                <Label>Training Goals</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'Improve strength', 'Increase speed', 'Better endurance',
                    'Skill development', 'Injury recovery', 'Flexibility'
                  ].map((goal) => (
                    <label key={goal} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={booking.goals.includes(goal)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBooking({ ...booking, goals: [...booking.goals, goal] });
                          } else {
                            setBooking({ ...booking, goals: booking.goals.filter(g => g !== goal) });
                          }
                        }}
                      />
                      {goal}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific areas to focus on, injuries, or preferences..."
                  value={booking.notes}
                  onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label htmlFor="recurring" className="text-base cursor-pointer">
                  Make this a recurring session
                </Label>
                <input
                  type="checkbox"
                  id="recurring"
                  checked={booking.recurring}
                  onChange={(e) => setBooking({ ...booking, recurring: e.target.checked })}
                />
              </div>

              {booking.recurring && (
                <div>
                  <Label htmlFor="pattern">Recurrence Pattern</Label>
                  <Select 
                    value={booking.recurrencePattern} 
                    onValueChange={(v) => setBooking({ ...booking, recurrencePattern: v })}
                  >
                    <SelectTrigger id="pattern" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="font-medium">Confirm Booking</h3>
              
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedType?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        with {trainers.find(t => t.id === booking.trainerId)?.name}
                      </p>
                    </div>
                    <Badge>{booking.duration} min</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(booking.date, "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{locations.find(l => l.id === booking.location)?.name}</span>
                    </div>
                  </div>

                  {booking.goals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Goals:</p>
                      <div className="flex flex-wrap gap-1">
                        {booking.goals.map((goal) => (
                          <Badge key={goal} variant="secondary" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.recurring && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Recurring {booking.recurrencePattern}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Booking Policy</p>
                      <ul className="mt-1 space-y-1 text-blue-800">
                        <li>• Cancellations must be made 24 hours in advance</li>
                        <li>• Trainers will confirm availability within 2 hours</li>
                        <li>• Session payment will be processed after completion</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'type' && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step !== 'confirm' ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (step === 'type' && !booking.type) ||
                  (step === 'schedule' && (!booking.trainerId || !booking.location))
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <Dumbbell className="h-4 w-4 mr-2" />
                Confirm Booking
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}