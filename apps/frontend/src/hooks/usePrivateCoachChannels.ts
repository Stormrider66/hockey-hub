import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/use-toast';

interface PrivateCoachChannel {
  id: string;
  name: string;
  metadata: {
    playerId: string;
    playerName?: string;
    parentId: string;
    coachIds: string[];
    teamId: string;
    teamName?: string;
  };
  lastMessage?: {
    content: string;
    created_at: string;
  };
  unreadCount?: number;
  participants: any[];
  hasPendingMeetingRequest?: boolean;
  nextMeeting?: {
    date: string;
    type: string;
  };
}

export const usePrivateCoachChannels = () => {
  const [channels, setChannels] = useState<PrivateCoachChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!currentUser) return;

    const fetchChannels = async () => {
      try {
        setLoading(true);
        let url = '';
        
        if (currentUser.role === 'parent') {
          url = `/api/private-coach-channels/parent/${currentUser.id}/channels`;
        } else if (currentUser.role === 'coach') {
          url = `/api/private-coach-channels/coach/${currentUser.id}/channels`;
        } else {
          setLoading(false);
          return;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch private coach channels');
        }

        const data = await response.json();
        setChannels(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load private coach channels',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [currentUser, toast]);

  const createChannel = async (
    playerId: string,
    parentId: string,
    coachIds: string[],
    teamId: string,
    organizationId: string,
    playerName?: string
  ) => {
    try {
      const response = await fetch('/api/private-coach-channels/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          playerId,
          parentId,
          coachIds,
          teamId,
          organizationId,
          playerName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create private coach channel');
      }

      const newChannel = await response.json();
      setChannels([...channels, newChannel]);
      
      toast({
        title: 'Success',
        description: 'Private coach channel created successfully',
      });
      
      return newChannel;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create private coach channel',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    channels,
    loading,
    error,
    createChannel,
    refetch: () => {
      // Trigger a re-fetch by updating currentUser dependency
      setChannels([]);
      setLoading(true);
    },
  };
};