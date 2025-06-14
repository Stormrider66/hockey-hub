"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreatmentCalendar } from './TreatmentCalendar';
import { TreatmentForm } from './TreatmentForm';
import { 
  Calendar, 
  List, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
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
  date: string;
  injuryId?: string;
  notes?: string;
}

interface TreatmentManagerProps {
  isLoading?: boolean;
}

// Mock data for demonstration
const mockTreatments: Treatment[] = [
  {
    id: '1',
    date: '2025-06-08',
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
    date: '2025-06-08',
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
    date: '2025-06-08',
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
    date: '2025-06-09',
    time: '15:30',
    player: 'Johan Bergström',
    playerId: '14',
    type: 'massage',
    location: 'Treatment Room 2',
    duration: 45,
    status: 'in-progress'
  },
  {
    id: '5',
    date: '2025-06-10',
    time: '11:00',
    player: 'Anders Johansson',
    playerId: '9',
    type: 'rehabilitation',
    location: 'Gym',
    duration: 90,
    status: 'scheduled',
    notes: 'Knee strengthening exercises'
  }
];

const TREATMENT_TYPES = [
  { value: 'physiotherapy', label: 'Physiotherapy', color: 'bg-green-100 text-green-800' },
  { value: 'massage', label: 'Massage Therapy', color: 'bg-blue-100 text-blue-800' },
  { value: 'rehabilitation', label: 'Rehabilitation', color: 'bg-purple-100 text-purple-800' },
  { value: 'assessment', label: 'Medical Assessment', color: 'bg-amber-100 text-amber-800' },
  { value: 'consultation', label: 'Consultation', color: 'bg-gray-100 text-gray-800' },
];

export function TreatmentManager({ isLoading = false }: TreatmentManagerProps) {
  const [treatments, setTreatments] = useState<Treatment[]>(mockTreatments);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleAddTreatment = (date?: Date) => {
    setSelectedTreatment(undefined);
    setSelectedDate(date);
    setShowTreatmentForm(true);
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setSelectedDate(undefined);
    setShowTreatmentForm(true);
  };

  const handleSaveTreatment = (treatmentData: Treatment) => {
    if (selectedTreatment) {
      // Update existing treatment
      setTreatments(prev => prev.map(t => 
        t.id === selectedTreatment.id ? { ...treatmentData, id: selectedTreatment.id } : t
      ));
    } else {
      // Add new treatment
      const newTreatment = {
        ...treatmentData,
        id: Date.now().toString(), // Simple ID generation for demo
      };
      setTreatments(prev => [...prev, newTreatment]);
    }
    setShowTreatmentForm(false);
    setSelectedTreatment(undefined);
    setSelectedDate(undefined);
  };

  const handleDeleteTreatment = (treatmentId: string) => {
    setTreatments(prev => prev.filter(t => t.id !== treatmentId));
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

  const getTreatmentType = (type: string) => {
    return TREATMENT_TYPES.find(t => t.value === type) || TREATMENT_TYPES[0];
  };

  const todayTreatments = treatments.filter(t => t.date === format(new Date(), 'yyyy-MM-dd'));
  const upcomingTreatments = treatments.filter(t => new Date(t.date) > new Date()).slice(0, 5);

  if (showTreatmentForm) {
    return (
      <TreatmentForm
        treatment={selectedTreatment}
        selectedDate={selectedDate}
        onSave={handleSaveTreatment}
        onCancel={() => {
          setShowTreatmentForm(false);
          setSelectedTreatment(undefined);
          setSelectedDate(undefined);
        }}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={() => handleAddTreatment()}>
            <Plus className="h-4 w-4 mr-2" />
            New Treatment
          </Button>
        </div>

        <TabsContent value="calendar" className="space-y-4">
          <TreatmentCalendar
            treatments={treatments}
            onAddTreatment={handleAddTreatment}
            onEditTreatment={handleEditTreatment}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* Today's Treatments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Treatments ({todayTreatments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayTreatments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No treatments scheduled for today
                </p>
              ) : (
                <div className="space-y-3">
                  {todayTreatments.map(treatment => {
                    const treatmentType = getTreatmentType(treatment.type);
                    return (
                      <div
                        key={treatment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-mono">{treatment.time}</div>
                          <div>
                            <div className="font-medium">{treatment.player}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Badge className={treatmentType.color} variant="outline">
                                  {treatmentType.label}
                                </Badge>
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {treatment.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {treatment.duration}m
                              </span>
                            </div>
                            {treatment.notes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {treatment.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(treatment.status)} variant="outline">
                            {treatment.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTreatment(treatment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Treatments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Treatments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTreatments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming treatments scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTreatments.map(treatment => {
                    const treatmentType = getTreatmentType(treatment.type);
                    return (
                      <div
                        key={treatment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-mono text-muted-foreground">
                            {format(new Date(treatment.date), 'MMM d')}
                            <br />
                            {treatment.time}
                          </div>
                          <div>
                            <div className="font-medium">{treatment.player}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Badge className={treatmentType.color} variant="outline">
                                  {treatmentType.label}
                                </Badge>
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {treatment.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {treatment.duration}m
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(treatment.status)} variant="outline">
                            {treatment.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTreatment(treatment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}