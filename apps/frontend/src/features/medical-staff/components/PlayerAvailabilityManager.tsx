import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface PlayerAvailabilityManagerProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
  onUpdate: (status: string) => void;
}

export function PlayerAvailabilityManager({
  playerId,
  playerName,
  onClose,
  onUpdate,
}: PlayerAvailabilityManagerProps) {
  const [status, setStatus] = useState('full');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onUpdate(status);
    // TODO: Implement API call to update player availability
    console.log('Updating player availability:', { playerId, status, notes });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Update Player Availability</CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="font-medium text-lg">{playerName}</p>
          <p className="text-sm text-muted-foreground">Player ID: {playerId}</p>
        </div>

        <RadioGroup value={status} onValueChange={setStatus}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Full Availability</span>
                  <Badge className="bg-green-100 text-green-800">Full</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Can participate in all activities</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="limited" id="limited" />
              <Label htmlFor="limited" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Limited Availability</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Can participate with restrictions</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Individual Training</span>
                  <Badge className="bg-orange-100 text-orange-800">Individual</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Modified training program only</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="rehab" id="rehab" />
              <Label htmlFor="rehab" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Rehabilitation</span>
                  <Badge className="bg-red-100 text-red-800">Rehab</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Injury recovery program</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="unavailable" id="unavailable" />
              <Label htmlFor="unavailable" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Unavailable</span>
                  <Badge className="bg-gray-100 text-gray-800">Out</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Cannot participate in any activities</p>
              </Label>
            </div>
          </div>
        </RadioGroup>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}