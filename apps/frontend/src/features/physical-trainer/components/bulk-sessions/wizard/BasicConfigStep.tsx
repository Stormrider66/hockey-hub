'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Users, Calendar, Settings } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

import type { BulkSessionConfig, FacilityInfo } from '../BulkSessionWizard';

interface BasicConfigStepProps {
  config: BulkSessionConfig;
  onConfigChange: (updates: Partial<BulkSessionConfig>) => void;
  errors: string[];
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '2 hours' }
];

const SESSION_COUNT_OPTIONS = Array.from({ length: 7 }, (_, i) => i + 2); // 2-8 sessions

export const BasicConfigStep: React.FC<BasicConfigStepProps> = ({
  config,
  onConfigChange,
  errors
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [facilities, setFacilities] = useState<FacilityInfo[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  
  // Load facilities on mount
  useEffect(() => {
    loadFacilities();
  }, []);
  
  const loadFacilities = async () => {
    try {
      setLoadingFacilities(true);
      
      // Mock facilities data - replace with actual API call
      const mockFacilities: FacilityInfo[] = [
        {
          id: 'facility-001',
          name: 'Main Training Center',
          location: 'Building A, Floor 2',
          capacity: 50,
          equipment: ['dumbbells', 'barbells', 'squat-racks', 'benches', 'cardio-machines'],
          availability: 'available'
        },
        {
          id: 'facility-002',
          name: 'Cardio Center',
          location: 'Building B, Floor 1',
          capacity: 30,
          equipment: ['bikes', 'treadmills', 'rowing-machines', 'ellipticals'],
          availability: 'available'
        },
        {
          id: 'facility-003',
          name: 'Athletic Performance Lab',
          location: 'Building C, Floor 3',
          capacity: 40,
          equipment: ['power-racks', 'platforms', 'specialty-equipment', 'testing-equipment'],
          availability: 'partially_booked'
        }
      ];
      
      setFacilities(mockFacilities);
    } catch (error) {
      console.error('Failed to load facilities:', error);
    } finally {
      setLoadingFacilities(false);
    }
  };
  
  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get selected facility info
  const selectedFacility = facilities.find(f => f.id === config.facilityId);
  
  // Generate time slots (every 30 minutes from 6:00 to 22:00)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 22 && minute > 0) break; // Stop at 22:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Calculate end time for staggered sessions
  const calculateEndTime = () => {
    if (!config.staggerStartTimes) return config.sessionTime;
    
    const [hours, minutes] = config.sessionTime.split(':').map(Number);
    const baseMinutes = hours * 60 + minutes;
    const lastSessionStart = baseMinutes + ((config.numberOfSessions - 1) * config.staggerInterval);
    const endMinutes = lastSessionStart + config.duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Date and Time Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="session-date">Session Date</Label>
              <Input
                id="session-date"
                type="date"
                value={config.sessionDate}
                min={minDate}
                onChange={(e) => onConfigChange({ sessionDate: e.target.value })}
                className={cn(errors.some(e => e.includes('date')) && 'border-red-500')}
              />
            </div>
            
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="session-time">Start Time</Label>
              <Select 
                value={config.sessionTime} 
                onValueChange={(value) => onConfigChange({ sessionTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Session Duration</Label>
            <Select 
              value={config.duration.toString()} 
              onValueChange={(value) => onConfigChange({ duration: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Facility Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Facility Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingFacilities ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading facilities...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {facilities.map(facility => (
                <div
                  key={facility.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-all hover:border-primary',
                    config.facilityId === facility.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => onConfigChange({ facilityId: facility.id })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{facility.name}</h4>
                        <Badge 
                          variant={facility.availability === 'available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {facility.availability === 'available' ? 'Available' : 'Partially Booked'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{facility.location}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Capacity: {facility.capacity}</span>
                        <span>Equipment: {facility.equipment.length} types</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={config.facilityId === facility.id}
                      onChange={() => onConfigChange({ facilityId: facility.id })}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedFacility && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Selected: {selectedFacility.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedFacility.location}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Session Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Number of Sessions */}
          <div className="space-y-2">
            <Label htmlFor="session-count">Number of Parallel Sessions</Label>
            <Select 
              value={config.numberOfSessions.toString()} 
              onValueChange={(value) => onConfigChange({ numberOfSessions: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of sessions" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_COUNT_OPTIONS.map(count => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} sessions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Run {config.numberOfSessions} conditioning sessions simultaneously
            </p>
          </div>
          
          <Separator />
          
          {/* Advanced Options */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced Options
            </h4>
            
            {/* Stagger Start Times */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="stagger-times">Stagger Start Times</Label>
                <p className="text-xs text-muted-foreground">
                  Start sessions at different times to reduce congestion
                </p>
              </div>
              <Switch
                id="stagger-times"
                checked={config.staggerStartTimes}
                onCheckedChange={(checked) => onConfigChange({ staggerStartTimes: checked })}
              />
            </div>
            
            {/* Stagger Interval */}
            {config.staggerStartTimes && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="stagger-interval">Stagger Interval (minutes)</Label>
                <Select 
                  value={config.staggerInterval.toString()} 
                  onValueChange={(value) => onConfigChange({ staggerInterval: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Allow Equipment Conflicts */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allow-conflicts">Allow Equipment Conflicts</Label>
                <p className="text-xs text-muted-foreground">
                  Allow multiple sessions to use the same equipment simultaneously
                </p>
              </div>
              <Switch
                id="allow-conflicts"
                checked={config.allowEquipmentConflicts}
                onCheckedChange={(checked) => onConfigChange({ allowEquipmentConflicts: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Configuration Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {config.sessionDate ? new Date(config.sessionDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-medium">{config.numberOfSessions} parallel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{config.duration} minutes each</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Time:</span>
                <span className="font-medium">{config.sessionTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Time:</span>
                <span className="font-medium">{calculateEndTime()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facility:</span>
                <span className="font-medium">
                  {selectedFacility?.name || 'Not selected'}
                </span>
              </div>
            </div>
          </div>
          
          {config.staggerStartTimes && (
            <div className="mt-4 p-3 bg-background rounded border">
              <h5 className="text-sm font-medium mb-2">Staggered Start Times:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Array.from({ length: config.numberOfSessions }, (_, i) => {
                  const [hours, minutes] = config.sessionTime.split(':').map(Number);
                  const startMinutes = hours * 60 + minutes + (i * config.staggerInterval);
                  const startHours = Math.floor(startMinutes / 60);
                  const startMins = startMinutes % 60;
                  const startTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
                  
                  return (
                    <div key={i} className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">Session {i + 1}</div>
                      <div className="text-muted-foreground">{startTime}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicConfigStep;