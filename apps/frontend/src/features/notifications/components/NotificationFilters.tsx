import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NotificationType, NotificationPriority } from '@/store/api/notificationApi';

interface NotificationFiltersProps {
  selectedType?: NotificationType;
  selectedPriority?: NotificationPriority;
  onTypeChange: (type: NotificationType | undefined) => void;
  onPriorityChange: (priority: NotificationPriority | undefined) => void;
  onClear: () => void;
}

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'MESSAGE', label: 'Messages' },
  { value: 'MENTION', label: 'Mentions' },
  { value: 'REACTION', label: 'Reactions' },
  { value: 'CALENDAR_REMINDER', label: 'Calendar Reminders' },
  { value: 'TRAINING_SCHEDULED', label: 'Training' },
  { value: 'MEDICAL_APPOINTMENT', label: 'Medical' },
  { value: 'EQUIPMENT_READY', label: 'Equipment' },
  { value: 'ANNOUNCEMENT', label: 'Announcements' },
  { value: 'ALERT', label: 'Alerts' },
];

const PRIORITY_LEVELS: { value: NotificationPriority; label: string }[] = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  selectedType,
  selectedPriority,
  onTypeChange,
  onPriorityChange,
  onClear,
}) => {
  const hasFilters = selectedType || selectedPriority;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Select
          value={selectedType || ''}
          onValueChange={(value) => onTypeChange(value as NotificationType || undefined)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPriority || ''}
          onValueChange={(value) => onPriorityChange(value as NotificationPriority || undefined)}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            {PRIORITY_LEVELS.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex gap-2 flex-wrap">
          {selectedType && (
            <Badge variant="secondary" className="text-xs">
              Type: {NOTIFICATION_TYPES.find(t => t.value === selectedType)?.label}
            </Badge>
          )}
          {selectedPriority && (
            <Badge variant="secondary" className="text-xs">
              Priority: {selectedPriority}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationFilters;