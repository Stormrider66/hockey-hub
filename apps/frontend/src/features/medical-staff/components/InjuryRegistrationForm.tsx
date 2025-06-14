"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateInjuryMutation } from '@/store/api/medicalApi';
import { useFeatureFlag } from '@/config/featureFlags';
import { useToast } from '@/hooks/use-toast';

interface InjuryRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (injury: any) => void;
}

const INJURY_TYPES = [
  'ACL Injury',
  'Hamstring Strain',
  'Ankle Sprain',
  'Concussion',
  'Shoulder Injury',
  'Back Pain',
  'Groin Strain',
  'Knee Injury',
  'Wrist Injury',
  'Other'
];

const BODY_PARTS = [
  'Head/Neck',
  'Shoulder',
  'Arm',
  'Elbow',
  'Wrist/Hand',
  'Back',
  'Chest/Ribs',
  'Hip/Pelvis',
  'Thigh',
  'Knee',
  'Lower Leg',
  'Ankle',
  'Foot'
];

const MECHANISMS = [
  'Contact with player',
  'Contact with equipment',
  'Non-contact',
  'Overuse',
  'Fall',
  'Collision',
  'Twist/Turn',
  'Other'
];

const PLAYERS = [
  { id: '15', name: 'Erik Andersson (#15)' },
  { id: '7', name: 'Marcus Lindberg (#7)' },
  { id: '23', name: 'Viktor Nilsson (#23)' },
  { id: '14', name: 'Johan Bergström (#14)' },
  { id: '12', name: 'Anders Johansson (#12)' },
  { id: '21', name: 'Gustav Svensson (#21)' },
  { id: '9', name: 'Emil Karlsson (#9)' },
  { id: '18', name: 'Oskar Pettersson (#18)' }
];

export function InjuryRegistrationForm({ isOpen, onClose, onSave }: InjuryRegistrationFormProps) {
  const initialDate = useMemo(() => new Date(), []);
  const { toast } = useToast();
  const isMedicalBackendEnabled = useFeatureFlag('medical-backend');
  const [createInjury, { isLoading: isCreating }] = useCreateInjuryMutation();
  
  const [formData, setFormData] = useState({
    playerId: '',
    playerName: '',
    injuryType: '',
    bodyPart: '',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
    mechanism: '',
    dateOfInjury: initialDate,
    assessmentNotes: '',
    estimatedRecovery: 7
  });

  const handlePlayerSelect = (playerId: string) => {
    const player = PLAYERS.find(p => p.id === playerId);
    setFormData(prev => ({
      ...prev,
      playerId,
      playerName: player?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isMedicalBackendEnabled) {
      try {
        // Use real API to create injury
        const injuryData = {
          playerId: formData.playerId,
          injuryType: formData.injuryType,
          bodyPart: formData.bodyPart,
          severity: formData.severity,
          status: 'assessment',
          dateOccurred: format(formData.dateOfInjury, 'yyyy-MM-dd'),
          mechanism: formData.mechanism || undefined,
          notes: formData.assessmentNotes || undefined,
          description: formData.assessmentNotes || undefined
        };

        const result = await createInjury(injuryData).unwrap();
        
        toast({
          title: "Injury Registered",
          description: `${formData.injuryType} for ${formData.playerName} has been registered.`,
        });
        
        // Call onSave with the created injury data for UI updates
        onSave({
          ...result,
          player: formData.playerName,
          estimatedReturn: `${formData.estimatedRecovery} days`
        });
        
      } catch (error: any) {
        console.error('Error creating injury:', error);
        toast({
          title: "Registration Failed",
          description: error.data?.message || "Failed to register injury. Please try again.",
          variant: "destructive"
        });
        return; // Don't close form on error
      }
    } else {
      // Fallback to mock data behavior
    const injury = {
      id: Date.now().toString(),
      ...formData,
      dateOfInjury: format(formData.dateOfInjury, 'yyyy-MM-dd'),
      status: 'assessment' as const
    };
    onSave(injury);
    }

    onClose();
    
    // Reset form
    setFormData({
      playerId: '',
      playerName: '',
      injuryType: '',
      bodyPart: '',
      severity: 'mild',
      mechanism: '',
      dateOfInjury: initialDate,
      assessmentNotes: '',
      estimatedRecovery: 7
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Register New Injury</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player">Player *</Label>
                <Select value={formData.playerId} onValueChange={handlePlayerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYERS.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfInjury">Date of Injury *</Label>
                <Input
                  type="date"
                  value={formData.dateOfInjury.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfInjury: new Date(e.target.value) }))}
                />
              </div>
            </div>

            {/* Injury Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="injuryType">Injury Type *</Label>
                <Select value={formData.injuryType} onValueChange={(value) => setFormData(prev => ({ ...prev, injuryType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select injury type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INJURY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyPart">Body Part *</Label>
                <Select value={formData.bodyPart} onValueChange={(value) => setFormData(prev => ({ ...prev, bodyPart: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select body part" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS.map(part => (
                      <SelectItem key={part} value={part}>
                        {part}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mechanism">Mechanism of Injury</Label>
                <Select value={formData.mechanism} onValueChange={(value) => setFormData(prev => ({ ...prev, mechanism: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="How did it happen?" />
                  </SelectTrigger>
                  <SelectContent>
                    {MECHANISMS.map(mechanism => (
                      <SelectItem key={mechanism} value={mechanism}>
                        {mechanism}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedRecovery">Estimated Recovery (days)</Label>
              <Input
                type="number"
                value={formData.estimatedRecovery}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedRecovery: parseInt(e.target.value) || 0 }))}
                min="1"
                max="365"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessmentNotes">Assessment Notes</Label>
              <Textarea
                value={formData.assessmentNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, assessmentNotes: e.target.value }))}
                placeholder="Initial assessment, symptoms, examination findings..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.playerId || !formData.injuryType || !formData.bodyPart || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Injury'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}