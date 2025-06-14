import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Interval {
  phase: 'work' | 'rest';
  duration: number; // seconds
  targetHr?: number;
  targetWatts?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  intervals: Interval[];
}

export default function SessionPlan({ open, onClose, onStart, intervals }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cardio Session Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {intervals.map((int, idx) => (
            <div
              key={idx}
              className={`flex justify-between rounded-md px-3 py-1.5 ${
                int.phase === 'work' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              <span className="capitalize">{int.phase}</span>
              <span className="font-mono">{int.duration}s</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onStart}>Start Session</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 