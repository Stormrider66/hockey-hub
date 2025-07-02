import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSearchMessagesQuery } from '@/store/api/chatApi';
import { toast } from 'react-hot-toast';

interface JumpToDateProps {
  conversationId: string;
  onJumpToMessage?: (messageId: string) => void;
  className?: string;
}

const JumpToDate: React.FC<JumpToDateProps> = ({
  conversationId,
  onJumpToMessage,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  
  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    setIsSearching(true);
    
    try {
      // Search for messages on the selected date
      const dateFrom = startOfDay(date).toISOString();
      const dateTo = endOfDay(date).toISOString();
      
      // Use the search API to find messages on this date
      const response = await fetch(`/api/communication/messages/search?conversationId=${conversationId}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=1`);
      const messages = await response.json();
      
      if (messages && messages.length > 0) {
        // Jump to the first message of that date
        if (onJumpToMessage) {
          onJumpToMessage(messages[0].id);
        }
        setIsOpen(false);
        toast.success(`Jumped to ${format(date, 'MMMM d, yyyy')}`);
      } else {
        toast.error('No messages found on this date');
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
      toast.error('Failed to jump to date');
    } finally {
      setIsSearching(false);
    }
  };
  
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'Last Week', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { label: 'Last Month', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          disabled={isSearching}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Jump to Date</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Jump to Date</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Select a date to jump to messages from that day
          </p>
        </div>
        
        {/* Quick date options */}
        <div className="p-2 border-b space-y-1">
          {quickDates.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => handleDateSelect(item.date)}
              disabled={isSearching}
            >
              {item.label}
              <span className="ml-auto text-xs text-muted-foreground">
                {format(item.date, 'MMM d')}
              </span>
            </Button>
          ))}
        </div>
        
        {/* Calendar */}
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
          initialFocus
          className="rounded-md border-0"
        />
        
        {isSearching && (
          <div className="p-3 border-t text-center text-sm text-muted-foreground">
            Searching for messages...
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default JumpToDate;