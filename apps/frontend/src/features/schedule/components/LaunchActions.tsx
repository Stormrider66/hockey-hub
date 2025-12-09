import React from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Monitor, Radio, Users, Snowflake, ClipboardList, Heart, Trophy, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/icons';
import { EventType, ScheduleEvent, UserRole, hasPermission } from '../types';
import { useLaunchEventMutation } from '@/store/api/scheduleApi';
import { useToast } from '@/components/ui/use-toast';

interface LaunchActionsProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const LaunchActions: React.FC<LaunchActionsProps> = ({ event, role }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [launchEvent, { isLoading }] = useLaunchEventMutation();

  const canLaunch = hasPermission(event.type, 'launch', role);

  const handleLaunch = async (action: string) => {
    try {
      const result = await launchEvent({
        id: event.id,
        role,
        action
      }).unwrap();

      if (result.redirectUrl) {
        router.push(result.redirectUrl);
      } else {
        toast({
          title: 'Event Launched',
          description: result.message || 'The event has been started successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Launch Failed',
        description: 'Failed to launch the event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getLaunchOptions = () => {
    // Training Session Launch Matrix
    if (event.type === EventType.TRAINING) {
      switch(role) {
        case 'player':
          return (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => {
                // Navigate directly to the appropriate workout viewer based on workout type
                const workoutType = event.workoutType || 'strength';
                if (workoutType === 'conditioning') {
                  router.push(`/player/workout/conditioning/${event.id}`);
                } else if (workoutType === 'hybrid') {
                  router.push(`/player/workout/hybrid/${event.id}`);
                } else if (workoutType === 'agility') {
                  router.push(`/player/workout/agility/${event.id}`);
                } else {
                  router.push(`/player/workout/${event.id}`);
                }
              }}
              disabled={isLoading}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start My Workout
            </Button>
          );
        
        case 'physicalTrainer':
          return (
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={() => router.push(`/physicaltrainer/monitor/${event.id}`)}
                disabled={isLoading}
              >
                <Monitor className="mr-2 h-5 w-5" />
                Monitor Session
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => handleLaunch('broadcast')}
                disabled={isLoading}
              >
                <Radio className="mr-2 h-5 w-5" />
                Broadcast
              </Button>
            </div>
          );
        
        case 'coach':
          return (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => router.push(`/coach/team-session/${event.id}`)}
              disabled={isLoading}
            >
              <Users className="mr-2 h-5 w-5" />
              Launch Team View
            </Button>
          );
        
        default:
          return null;
      }
    }
    
    // Ice Practice Launch Matrix
    if (event.type === EventType.ICE_PRACTICE) {
      switch(role) {
        case 'iceCoach':
        case 'coach':
          return (
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={() => router.push(`/coach/practice/${event.id}`)}
                disabled={isLoading}
              >
                <Snowflake className="mr-2 h-5 w-5" />
                Start Practice
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push(`/coach/drills/${event.id}`)}
                disabled={isLoading}
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Drill Manager
              </Button>
            </div>
          );
        
        case 'player':
          return (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => router.push(`/player/practice/${event.id}`)}
              disabled={isLoading}
            >
              <Snowflake className="mr-2 h-5 w-5" />
              View Practice Plan
            </Button>
          );
        
        default:
          return null;
      }
    }

    // Game Launch Matrix
    if (event.type === EventType.GAME) {
      switch(role) {
        case 'coach':
        case 'clubAdmin':
          return (
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={() => router.push(`/game-center/${event.id}`)}
                disabled={isLoading}
              >
                <Trophy className="mr-2 h-5 w-5" />
                Game Center
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push(`/game-plan/${event.id}`)}
                disabled={isLoading}
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Game Plan
              </Button>
            </div>
          );
        
        case 'player':
          return (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => router.push(`/player/game/${event.id}`)}
              disabled={isLoading}
            >
              <Trophy className="mr-2 h-5 w-5" />
              View Game Details
            </Button>
          );
        
        default:
          return null;
      }
    }

    // Medical Appointment Launch Matrix
    if (event.type === EventType.MEDICAL) {
      switch(role) {
        case 'medicalStaff':
          return (
            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => router.push(`/medical/session/${event.id}`)}
              disabled={isLoading}
            >
              <Heart className="mr-2 h-5 w-5" />
              Start Medical Session
            </Button>
          );
        
        case 'player':
          if (event.participants?.includes(role)) {
            return (
              <Button 
                size="lg" 
                className="w-full" 
                onClick={() => router.push(`/player/medical/${event.id}`)}
                disabled={isLoading}
              >
                <Heart className="mr-2 h-5 w-5" />
                View Appointment Details
              </Button>
            );
          }
          return null;
        
        default:
          return null;
      }
    }

    // Meeting Launch Matrix
    if (event.type === EventType.MEETING) {
      const isParticipant = event.participants?.some(p => 
        typeof p === 'string' ? p === role : p.id === role
      );
      
      if (isParticipant || role === 'coach' || role === 'clubAdmin') {
        return (
          <div className="flex gap-3">
            {event.metadata?.meetingLink && (
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={() => window.open(event.metadata.meetingLink, '_blank')}
                disabled={isLoading}
              >
                <Video className="mr-2 h-5 w-5" />
                Join Virtual Meeting
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline"
              className={event.metadata?.meetingLink ? '' : 'w-full'}
              onClick={() => router.push(`/meeting/${event.id}`)}
              disabled={isLoading}
            >
              <Users className="mr-2 h-5 w-5" />
              View Meeting Details
            </Button>
          </div>
        );
      }
      return null;
    }

    // Personal Event Launch Matrix
    if (event.type === EventType.PERSONAL) {
      if (role === 'player') {
        return (
          <Button 
            size="lg" 
            className="w-full" 
            onClick={() => router.push(`/player/personal/${event.id}`)}
            disabled={isLoading}
          >
            <Icons.User className="mr-2 h-5 w-5" />
            Start Activity
          </Button>
        );
      }
      return null;
    }

    return null;
  };

  const launchOptions = getLaunchOptions();

  if (!launchOptions || !canLaunch) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Launch Options</h3>
          {launchOptions}
        </div>
      </CardContent>
    </Card>
  );
};