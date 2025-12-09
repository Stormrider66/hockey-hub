import React from 'react';
import { format } from 'date-fns';
import { MoreVertical, PlayCircle, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as Icons from '@/components/icons';
import { EventType, EVENT_CONFIG, ScheduleEvent, UserRole, hasPermission } from '../types';

interface ScheduleEventCardProps {
  event: ScheduleEvent;
  role: UserRole;
  onView: () => void;
  onQuickAction?: (action: string) => void;
  className?: string;
}

const LiveIndicator: React.FC = () => (
  <div className="flex items-center gap-1">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </span>
    <span className="text-xs font-medium text-red-600">LIVE</span>
  </div>
);

const ParticipantBadge: React.FC<{ count: number }> = ({ count }) => (
  <Badge variant="secondary" className="flex items-center gap-1">
    <Icons.Users className="h-3 w-3" />
    <span>{count}</span>
  </Badge>
);

export const ScheduleEventCard: React.FC<ScheduleEventCardProps> = ({
  event,
  role,
  onView,
  onQuickAction,
  className = ''
}) => {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG[EventType.TRAINING]; // Fallback to training config
  const Icon = config?.icon ? Icons[config.icon as keyof typeof Icons] : Icons.Calendar;
  
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatDuration = () => {
    try {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const durationMs = end.getTime() - start.getTime();
      const minutes = Math.floor(durationMs / 60000);
      if (minutes < 60) return `${minutes}min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    } catch {
      return '90min';
    }
  };

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canEdit = hasPermission(event.type, 'edit', role);
  const canLaunch = hasPermission(event.type, 'launch', role);

  return (
    <div 
      className={`
        flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg
        ${config.bgColor} ${config.borderColor} hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {/* Time Section */}
      <div className="flex-shrink-0 text-center sm:mr-4 mb-3 sm:mb-0 w-full sm:w-auto">
        <div className="text-2xl font-bold text-gray-900">{formatTime(event.startTime)}</div>
        <div className="text-sm text-gray-500">{formatDuration()}</div>
        {event.location && (
          <Badge variant="outline" className="mt-1">
            <Icons.MapPin className="h-3 w-3 mr-1" />
            {event.location}
          </Badge>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {Icon && <Icon className="h-4 w-4" style={{ color: config.color }} />}
          <span className="font-medium text-gray-900">{event.title}</span>
          <Badge 
            className="text-xs"
            style={{ 
              backgroundColor: `${config.color}20`,
              color: config.color 
            }}
          >
            {config.badge}
          </Badge>
          {event.intensity && (
            <Badge className={`text-xs ${getIntensityColor(event.intensity)}`}>
              {event.intensity.toUpperCase()}
            </Badge>
          )}
          {event.status === 'active' && <LiveIndicator />}
        </div>
        
        {event.description && (
          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
        )}

        {/* Type-specific details */}
        <div className="flex flex-wrap gap-2 mt-2">
          {event.workoutType && (
            <Badge variant="outline">
              <Icons.Dumbbell className="h-3 w-3 mr-1" />
              {event.workoutType}
            </Badge>
          )}
          {event.opponent && (
            <Badge variant="outline">
              vs {event.opponent}
            </Badge>
          )}
          {event.focus && (
            <Badge variant="outline">
              Focus: {event.focus}
            </Badge>
          )}
          {event.confidential && (
            <Badge variant="destructive">
              <Icons.Lock className="h-3 w-3 mr-1" />
              Confidential
            </Badge>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
        {event.participants && (
          <ParticipantBadge count={
            Array.isArray(event.participants) ? event.participants.length : 0
          } />
        )}
        
        <Button
          variant="default"
          size="sm"
          onClick={onView}
          className="flex-1 sm:flex-initial"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {config.viewLabel}
        </Button>

        {event.status === 'active' && canLaunch && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.('monitor')}
          >
            <Radio className="h-4 w-4" />
          </Button>
        )}

        {(canEdit || canLaunch) && onQuickAction && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => onQuickAction('edit')}>
                    <Icons.Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQuickAction('duplicate')}>
                    <Icons.Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                </>
              )}
              {canLaunch && event.status === 'upcoming' && (
                <DropdownMenuItem onClick={() => onQuickAction('launch')}>
                  <Icons.PlayCircle className="mr-2 h-4 w-4" />
                  Launch Now
                </DropdownMenuItem>
              )}
              {(canEdit || canLaunch) && event.status !== 'completed' && (
                <DropdownMenuItem 
                  onClick={() => onQuickAction('cancel')}
                  className="text-red-600"
                >
                  <Icons.X className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onQuickAction('share')}>
                <Icons.Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};