"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  Heart,
  Zap,
  Activity,
  Filter
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  time: string;
  player: string;
  playerId: string;
  type: string;
  location: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  injuryId?: string;
  notes?: string;
}

interface TreatmentCalendarProps {
  treatments?: Treatment[];
  onAddTreatment?: (date: Date) => void;
  onEditTreatment?: (treatment: Treatment) => void;
  isLoading?: boolean;
}

const TREATMENT_TYPES = [
  { value: 'physiotherapy', label: 'Physiotherapy', icon: Heart, color: 'bg-green-100 text-green-800' },
  { value: 'massage', label: 'Massage Therapy', icon: Activity, color: 'bg-blue-100 text-blue-800' },
  { value: 'rehabilitation', label: 'Rehabilitation', icon: Zap, color: 'bg-purple-100 text-purple-800' },
  { value: 'assessment', label: 'Assessment', icon: User, color: 'bg-amber-100 text-amber-800' },
  { value: 'consultation', label: 'Consultation', icon: Clock, color: 'bg-gray-100 text-gray-800' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Mock treatments for demonstration
const mockTreatments: Treatment[] = [
  {
    id: '1',
    time: '09:00',
    player: 'Marcus Lindberg',
    playerId: '7',
    type: 'physiotherapy',
    location: 'Treatment Room 1',
    duration: 60,
    status: 'scheduled',
    notes: 'Hamstring rehabilitation session'
  },
  {
    id: '2',
    time: '10:30',
    player: 'Erik Andersson',
    playerId: '15',
    type: 'assessment',
    location: 'Medical Office',
    duration: 30,
    status: 'scheduled',
    notes: 'Post-surgery evaluation'
  },
  {
    id: '3',
    time: '14:00',
    player: 'Viktor Nilsson',
    playerId: '23',
    type: 'consultation',
    location: 'Medical Office',
    duration: 45,
    status: 'completed',
    notes: 'Concussion protocol review'
  },
  {
    id: '4',
    time: '15:30',
    player: 'Johan Bergström',
    playerId: '14',
    type: 'massage',
    location: 'Treatment Room 2',
    duration: 45,
    status: 'in-progress'
  }
];

export function TreatmentCalendar({ 
  treatments = mockTreatments, 
  onAddTreatment,
  onEditTreatment,
  isLoading = false 
}: TreatmentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const getTreatmentType = (type: string) => {
    return TREATMENT_TYPES.find(t => t.value === type) || TREATMENT_TYPES[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTreatmentsForDate = (date: Date) => {
    return treatments.filter(treatment => {
      // For demo purposes, distribute treatments across the week
      const dayIndex = date.getDay();
      const treatmentIndex = parseInt(treatment.id) % 7;
      return treatmentIndex === dayIndex;
    });
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesType = filterType === 'all' || treatment.type === filterType;
    const matchesSearch = treatment.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTreatmentsForTimeSlot = (date: Date, timeSlot: string) => {
    const dayTreatments = getTreatmentsForDate(date);
    return dayTreatments.filter(treatment => treatment.time === timeSlot);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading treatment schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Treatment Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-4 font-medium">
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </span>
                <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search treatments or players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TREATMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Treatment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 font-medium text-center bg-muted">Time</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="p-3 text-center border-l">
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-sm mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                  isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {TIME_SLOTS.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 border-b min-h-[60px]">
                <div className="p-3 text-sm text-muted-foreground bg-muted border-r flex items-center">
                  {timeSlot}
                </div>
                {weekDays.map(day => {
                  const dayTreatments = getTreatmentsForTimeSlot(day, timeSlot);
                  return (
                    <div key={`${day.toISOString()}-${timeSlot}`} className="p-1 border-l min-h-[60px]">
                      {dayTreatments.map(treatment => {
                        const treatmentType = getTreatmentType(treatment.type);
                        return (
                          <div
                            key={treatment.id}
                            className={cn(
                              "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity mb-1",
                              treatmentType.color
                            )}
                            onClick={() => onEditTreatment?.(treatment)}
                          >
                            <div className="font-medium truncate">{treatment.player}</div>
                            <div className="truncate">{treatmentType.label}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{treatment.duration}m</span>
                              <Badge 
                                className={cn("text-xs", getStatusColor(treatment.status))}
                                variant="outline"
                              >
                                {treatment.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {dayTreatments.length === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-full min-h-[50px] opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => onAddTreatment?.(day)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Treatments</p>
                <p className="text-2xl font-bold">{filteredTreatments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {filteredTreatments.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {filteredTreatments.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}