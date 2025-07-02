import { useEffect } from 'react';
import { 
  useGetTrainingDiscussionQuery,
  useCreateTrainingDiscussionMutation,
} from '@/store/api/trainingApi';
import { WorkoutSession } from '@hockey-hub/shared-lib';

interface UseTrainingDiscussionOptions {
  autoCreate?: boolean;
  sessionType?: 'ice_practice' | 'physical_training' | 'video_review' | 'combined';
}

export const useTrainingDiscussion = (
  session: WorkoutSession | null,
  options: UseTrainingDiscussionOptions = {}
) => {
  const { autoCreate = true, sessionType = 'physical_training' } = options;

  const { 
    data: discussion, 
    isLoading: discussionLoading,
    refetch: refetchDiscussion,
  } = useGetTrainingDiscussionQuery(
    { 
      sessionId: session?.id || '', 
      sessionType 
    },
    { skip: !session?.id }
  );

  const [createDiscussion, { isLoading: creating }] = useCreateTrainingDiscussionMutation();

  useEffect(() => {
    if (!autoCreate || !session || discussion || discussionLoading || creating) {
      return;
    }

    // Auto-create discussion for scheduled sessions
    if (session.status === 'scheduled') {
      const sessionDate = new Date(session.scheduledDate);
      const now = new Date();
      
      // Create discussion 24 hours before session
      const createTime = new Date(sessionDate);
      createTime.setHours(createTime.getHours() - 24);
      
      if (now >= createTime) {
        createDiscussion({
          sessionId: session.id,
          sessionType,
          sessionTitle: session.title,
          sessionDate: session.scheduledDate,
          sessionLocation: session.location,
          teamId: session.teamId,
          coachIds: session.coachIds || [],
          playerIds: session.playerIds || [],
          exerciseIds: session.exercises?.map(e => e.id) || [],
          metadata: {
            estimatedDuration: session.estimatedDuration,
            type: session.type,
            intensity: session.intensity,
          },
        }).then(() => {
          refetchDiscussion();
        });
      }
    }
  }, [
    session, 
    discussion, 
    discussionLoading, 
    creating, 
    autoCreate, 
    sessionType, 
    createDiscussion,
    refetchDiscussion
  ]);

  return {
    discussion,
    isLoading: discussionLoading || creating,
    createDiscussion: async () => {
      if (!session) return;
      
      const result = await createDiscussion({
        sessionId: session.id,
        sessionType,
        sessionTitle: session.title,
        sessionDate: session.scheduledDate,
        sessionLocation: session.location,
        teamId: session.teamId,
        coachIds: session.coachIds || [],
        playerIds: session.playerIds || [],
        exerciseIds: session.exercises?.map(e => e.id) || [],
        metadata: {
          estimatedDuration: session.estimatedDuration,
          type: session.type,
          intensity: session.intensity,
        },
      });
      
      refetchDiscussion();
      return result;
    },
  };
};

// Hook to get active training discussions for a user
export const useActiveTrainingDiscussions = () => {
  const { data: discussions = [], isLoading } = useGetActiveDiscussionsQuery();

  return {
    discussions,
    isLoading,
    hasActiveDiscussions: discussions.length > 0,
    upcomingCount: discussions.filter(d => d.status === 'scheduled').length,
    activeCount: discussions.filter(d => d.status === 'active').length,
  };
};

// Hook to get upcoming training discussions for an organization
export const useUpcomingTrainingDiscussions = () => {
  const { data: discussions = [], isLoading } = useGetUpcomingDiscussionsQuery();

  return {
    discussions,
    isLoading,
    todayCount: discussions.filter(d => {
      const sessionDate = new Date(d.sessionDate);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    }).length,
    weekCount: discussions.filter(d => {
      const sessionDate = new Date(d.sessionDate);
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return sessionDate >= now && sessionDate <= weekFromNow;
    }).length,
  };
};