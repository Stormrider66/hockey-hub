import React, { useState, ChangeEvent } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarEventDto, useCreateEventMutation } from '@/features/calendar/calendarApi';

interface Props {
  defaultDate: Date;
}

type EventType = 'physical_training' | 'cardio' | 'agility' | 'core' | 'wrestling';

export default function CreateEventModal({ defaultDate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(defaultDate.toISOString().slice(0,16));
  const [end, setEnd] = useState(defaultDate.toISOString().slice(0,16));
  const [type, setType] = useState<EventType>('physical_training');
  const [description, setDescription] = useState('');
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const handleSubmit = async () => {
    try {
      await createEvent({ title, start, end, type, description }).unwrap();
      setOpen(false);
      // reset form
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Create event error', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium">Title</label>
            <Input id="event-title" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="event-start" className="block text-sm font-medium">Start</label>
            <Input
              id="event-start"
              type="datetime-local"
              value={start}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="event-end" className="block text-sm font-medium">End</label>
            <Input
              id="event-end"
              type="datetime-local"
              value={end}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="event-type" className="block text-sm font-medium">Session Type</label>
            <select
              id="event-type"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as EventType)}
            >
              <option value="physical_training">Physical Training</option>
              <option value="cardio">Cardio</option>
              <option value="agility">Agility</option>
              <option value="core">Core</option>
              <option value="wrestling">Wrestling</option>
            </select>
          </div>
          <div>
            <label htmlFor="event-desc" className="block text-sm font-medium">Description</label>
            <Textarea
              id="event-desc"
              rows={3}
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 