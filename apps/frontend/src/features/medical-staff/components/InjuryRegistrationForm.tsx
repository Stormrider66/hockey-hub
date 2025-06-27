import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InjuryRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (injury: any) => void;
}

export function InjuryRegistrationForm({ isOpen, onClose, onSave }: InjuryRegistrationFormProps) {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    playerId: '',
    injuryType: '',
    bodyPart: '',
    severity: '',
    mechanism: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      dateOccurred: date,
      id: Date.now(), // Mock ID
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Register New Injury</DialogTitle>
        </DialogHeader>
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
              <Label>Date of Injury</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="injuryType">Injury Type</Label>
            <Input
              id="injuryType"
              value={formData.injuryType}
              onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
              placeholder="e.g., Muscle strain, Ligament tear"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bodyPart">Body Part</Label>
              <Select
                value={formData.bodyPart}
                onValueChange={(value) => setFormData({ ...formData, bodyPart: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="head">Head</SelectItem>
                  <SelectItem value="shoulder">Shoulder</SelectItem>
                  <SelectItem value="knee">Knee</SelectItem>
                  <SelectItem value="ankle">Ankle</SelectItem>
                  <SelectItem value="hamstring">Hamstring</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="mechanism">Mechanism of Injury</Label>
            <Input
              id="mechanism"
              value={formData.mechanism}
              onChange={(e) => setFormData({ ...formData, mechanism: e.target.value })}
              placeholder="How did the injury occur?"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Register Injury</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}