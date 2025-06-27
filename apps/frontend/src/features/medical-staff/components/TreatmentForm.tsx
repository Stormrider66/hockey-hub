import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface TreatmentFormProps {
  onSave: (treatment: any) => void;
  onCancel: () => void;
}

export function TreatmentForm({ onSave, onCancel }: TreatmentFormProps) {
  const [formData, setFormData] = useState({
    playerId: '',
    treatmentType: '',
    therapist: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Schedule Treatment</CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="player">Player</Label>
              <Select
                value={formData.playerId}
                onValueChange={(value) => setFormData({ ...formData, playerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Erik Andersson</SelectItem>
                  <SelectItem value="2">Marcus Lindberg</SelectItem>
                  <SelectItem value="3">Viktor Nilsson</SelectItem>
                  <SelectItem value="4">Johan Bergström</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="treatmentType">Treatment Type</Label>
              <Select
                value={formData.treatmentType}
                onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physiotherapy">Physiotherapy</SelectItem>
                  <SelectItem value="massage">Massage Therapy</SelectItem>
                  <SelectItem value="cryotherapy">Cryotherapy</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="therapist">Therapist/Provider</Label>
            <Input
              id="therapist"
              value={formData.therapist}
              onChange={(e) => setFormData({ ...formData, therapist: e.target.value })}
              placeholder="Enter therapist name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                min="15"
                step="15"
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treatment-room">Treatment Room</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="pool">Pool</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="medical-office">Medical Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Schedule Treatment</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}