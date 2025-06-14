"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle,
  Heart,
  Activity,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface Treatment {
  id?: string;
  date: string;
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

interface TreatmentFormProps {
  treatment?: Treatment;
  selectedDate?: Date;
  onSave?: (treatment: Treatment) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const TREATMENT_TYPES = [
  { value: 'physiotherapy', label: 'Physiotherapy', icon: Heart },
  { value: 'massage', label: 'Massage Therapy', icon: Activity },
  { value: 'rehabilitation', label: 'Rehabilitation', icon: Zap },
  { value: 'assessment', label: 'Medical Assessment', icon: User },
  { value: 'consultation', label: 'Consultation', icon: Clock },
  { value: 'hydrotherapy', label: 'Hydrotherapy', icon: Activity },
  { value: 'strength_training', label: 'Strength Training', icon: Zap },
  { value: 'flexibility', label: 'Flexibility Training', icon: Activity },
];

const TREATMENT_LOCATIONS = [
  'Treatment Room 1',
  'Treatment Room 2',
  'Medical Office',
  'Hydrotherapy Pool',
  'Gym',
  'Recovery Suite',
  'Consultation Room',
  'Testing Lab'
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Mock players data
const PLAYERS = [
  { id: '7', name: 'Marcus Lindberg' },
  { id: '15', name: 'Erik Andersson' },
  { id: '23', name: 'Viktor Nilsson' },
  { id: '14', name: 'Johan Bergström' },
  { id: '9', name: 'Anders Johansson' },
  { id: '21', name: 'Mikael Svensson' },
  { id: '11', name: 'Lars Karlsson' },
  { id: '3', name: 'Nils Eriksson' },
];

export function TreatmentForm({ 
  treatment, 
  selectedDate, 
  onSave, 
  onCancel, 
  isLoading = false 
}: TreatmentFormProps) {
  const [formData, setFormData] = useState<Treatment>({
    id: treatment?.id,
    date: treatment?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    time: treatment?.time || '09:00',
    player: treatment?.player || '',
    playerId: treatment?.playerId || '',
    type: treatment?.type || '',
    location: treatment?.location || '',
    duration: treatment?.duration || 60,
    status: treatment?.status || 'scheduled',
    injuryId: treatment?.injuryId || '',
    notes: treatment?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof Treatment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    const player = PLAYERS.find(p => p.id === playerId);
    if (player) {
      setFormData(prev => ({
        ...prev,
        playerId: player.id,
        player: player.name
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.player || !formData.playerId) newErrors.player = 'Player selection is required';
    if (!formData.type) newErrors.type = 'Treatment type is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.duration || formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    onSave?.(formData);
  };

  const getTreatmentIcon = (type: string) => {
    const treatmentType = TREATMENT_TYPES.find(t => t.value === type);
    return treatmentType?.icon || Clock;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {treatment ? 'Edit Treatment' : 'Schedule New Treatment'}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
              <SelectTrigger className={errors.time ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="text-sm text-red-600">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Player Selection */}
        <div className="space-y-2">
          <Label htmlFor="player">Player *</Label>
          <Select 
            value={formData.playerId} 
            onValueChange={handlePlayerSelect}
          >
            <SelectTrigger className={errors.player ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {PLAYERS.map(player => (
                <SelectItem key={player.id} value={player.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {player.name} (#{player.id})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.player && (
            <p className="text-sm text-red-600">{errors.player}</p>
          )}
        </div>

        {/* Treatment Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Treatment Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select treatment type" />
            </SelectTrigger>
            <SelectContent>
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
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type}</p>
          )}
        </div>

        {/* Location and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
              <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {TREATMENT_LOCATIONS.map(location => (
                  <SelectItem key={location} value={location}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="180"
              step="15"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              className={errors.duration ? 'border-red-500' : ''}
            />
            {errors.duration && (
              <p className="text-sm text-red-600">{errors.duration}</p>
            )}
          </div>
        </div>

        {/* Status (only for editing) */}
        {treatment && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Related Injury */}
        <div className="space-y-2">
          <Label htmlFor="injuryId">Related Injury ID (Optional)</Label>
          <Input
            id="injuryId"
            value={formData.injuryId}
            onChange={(e) => handleInputChange('injuryId', e.target.value)}
            placeholder="Enter injury ID if treatment is related to a specific injury"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes about this treatment session..."
            rows={3}
          />
        </div>

        {/* Treatment Preview */}
        {formData.type && formData.player && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Treatment Summary:</strong> {formData.duration}-minute {TREATMENT_TYPES.find(t => t.value === formData.type)?.label} 
              session for {formData.player} on {format(new Date(formData.date), 'MMMM d, yyyy')} at {formData.time} 
              in {formData.location}.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {treatment ? 'Update Treatment' : 'Schedule Treatment'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}