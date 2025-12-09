import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Users, 
  MessageCircle,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppSelector } from '@/store/hooks';
import TrainingDiscussionThread from '@/features/chat/components/TrainingDiscussionThread';
import ExerciseFeedback from '@/features/chat/components/ExerciseFeedback';
import CreatePerformanceReview from '@/features/chat/components/CreatePerformanceReview';
import PerformanceDiscussion from '@/features/chat/components/PerformanceDiscussion';
import { 
  useGetWorkoutSessionByIdQuery,
  useCreateTrainingDiscussionMutation,
  useGetTrainingDiscussionQuery,
} from '@/store/api/trainingApi';
import { useGetPlayerPerformanceDiscussionsQuery } from '@/store/api/performanceApi';
import { toast } from 'react-hot-toast';

interface TrainingSessionDetailsProps {
  sessionId: string;
  sessionType?: 'ice_practice' | 'physical_training';
  onClose?: () => void;
}

const TrainingSessionDetails: React.FC<TrainingSessionDetailsProps> = ({
  sessionId,
  sessionType = 'physical_training',
  onClose,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreatePerformanceReview, setShowCreatePerformanceReview] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPerformanceDiscussion, setSelectedPerformanceDiscussion] = useState<string | null>(null);

  const { data: sessionResp, isLoading: sessionLoading } = useGetWorkoutSessionByIdQuery(sessionId);
  const session = (sessionResp as any)?.data || sessionResp;
  const { data: discussion } = useGetTrainingDiscussionQuery(
    { sessionId, sessionType },
    { skip: !sessionId }
  );
  
  const [createDiscussion, { isLoading: creating }] = useCreateTrainingDiscussionMutation();

  const handleCreateDiscussion = async () => {
    if (!session) return;

    try {
      await createDiscussion({
        sessionId,
        sessionType,
        sessionTitle: (session as any).title,
        sessionDate: (session as any).scheduledDate,
        sessionLocation: (session as any).location,
        teamId: (session as any).teamId,
        coachIds: (session as any).coachIds || [],
        playerIds: (session as any).playerIds || [],
        exerciseIds: (session as any).exercises?.map((e: any) => e.id) || [],
        metadata: {
          estimatedDuration: (session as any).estimatedDuration,
          type: (session as any).type,
          intensity: (session as any).intensity,
        },
      }).unwrap();

      toast.success('Training discussion created');
      setShowDiscussion(true);
    } catch (error) {
      toast.error('Failed to create discussion');
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const isCoachOrTrainer = user?.roles?.some((role: string) => 
    ['coach', 'trainer', 'physical_trainer'].includes(role)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{(session as any).title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date((session as any).scheduledDate), 'PPP')}
                  </div>
                  {(session as any).location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {(session as any).location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {(session as any).playerIds?.length || 0} players
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor((session as any).status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon((session as any).status)}
                  {(session as any).status}
                </span>
              </Badge>
              {!discussion && isCoachOrTrainer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateDiscussion}
                  disabled={creating}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create Discussion
                </Button>
              )}
              {discussion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscussion(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Discussion
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Session Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{(session as any).type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{(session as any).estimatedDuration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Intensity:</span>
                      <Badge variant="outline">{(session as any).intensity}</Badge>
                    </div>
                  </div>
                </div>

                {(session as any).notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{(session as any).notes}</p>
                  </div>
                )}
              </div>

              {discussion && (
                <div className="mt-6">
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Session Discussion</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDiscussion(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Discussion
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {discussion.conversation?.participant_count || 0} participants • 
                    {discussion.conversation?.messages?.length || 0} messages
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="exercises" className="space-y-4">
              {(session as any).exercises?.map((exercise: any, index: number) => (
                <Card key={exercise.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {index + 1}. {exercise.name}
                        </CardTitle>
                        {exercise.description && (
                          <CardDescription className="mt-1">
                            {exercise.description}
                          </CardDescription>
                        )}
                      </div>
                      {exercise.category && (
                        <Badge variant="secondary">{exercise.category}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {(exercise.sets || exercise.reps || exercise.duration) && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3 text-sm">
                        {exercise.sets && (
                          <Badge variant="outline">{exercise.sets} sets</Badge>
                        )}
                        {exercise.reps && (
                          <Badge variant="outline">{exercise.reps} reps</Badge>
                        )}
                        {exercise.duration && (
                          <Badge variant="outline">{exercise.duration} min</Badge>
                        )}
                        {exercise.restBetweenSets && (
                          <Badge variant="outline">{exercise.restBetweenSets}s rest</Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="participants" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(session as any).playerLoads?.map((load: any) => (
                  <Card key={load.playerId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{load.playerName || 'Player'}</p>
                          <p className="text-sm text-muted-foreground">
                            Load: {load.plannedLoad || 'N/A'}
                          </p>
                        </div>
                        {load.actualLoad && (
                          <Badge variant={load.actualLoad >= (load.plannedLoad || 0) ? 'default' : 'secondary'}>
                            {load.actualLoad}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              {discussion ? (
                <div className="space-y-4">
                  {(session as any).exercises?.map((exercise: any) => (
                    <ExerciseFeedback
                      key={exercise.id}
                      trainingDiscussionId={discussion.id}
                      exercise={{
                        id: exercise.id,
                        name: exercise.name,
                        description: exercise.description,
                        targetSets: exercise.sets,
                        targetReps: exercise.reps,
                        targetDuration: exercise.duration,
                        targetIntensity: exercise.intensity,
                      }}
                      onThreadCreated={(threadId) => {
                        toast.success('Exercise feedback thread created');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Create a discussion to enable exercise feedback
                  </p>
                  {isCoachOrTrainer && (
                    <Button
                      onClick={handleCreateDiscussion}
                      disabled={creating}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Create Discussion
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {isCoachOrTrainer ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Player Performance Reviews</h3>
                    {discussion && (
                      <Button
                        onClick={() => {
                          if (session.playerIds?.length === 1) {
                            setSelectedPlayerId(session.playerIds[0]);
                            setShowCreatePerformanceReview(true);
                          }
                        }}
                        disabled={!session.playerIds || session.playerIds.length !== 1}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Create Performance Review
                      </Button>
                    )}
                  </div>
                  
                  {(session as any).playerIds?.map((playerId: string) => (
                    <Card key={playerId} className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Player ID: {playerId}</p>
                            <p className="text-sm text-muted-foreground">
                              Click to create or view performance review
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPlayerId(playerId);
                              setShowCreatePerformanceReview(true);
                            }}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Review Performance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Performance reviews are only available to coaches and trainers
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Training Discussion Dialog */}
      <Dialog open={showDiscussion} onOpenChange={setShowDiscussion}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Training Session Discussion</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <TrainingDiscussionThread
              sessionId={sessionId}
              sessionType={sessionType}
              onClose={() => setShowDiscussion(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Performance Review Dialog */}
      {selectedPlayerId && (
        <CreatePerformanceReview
          playerId={selectedPlayerId}
          trainingDiscussionId={discussion?.id}
          sessionDate={session ? new Date((session as any).scheduledDate) : undefined}
          open={showCreatePerformanceReview}
          onOpenChange={setShowCreatePerformanceReview}
          onCreated={(discussionId) => {
            setSelectedPerformanceDiscussion(discussionId);
            setShowCreatePerformanceReview(false);
          }}
        />
      )}

      {/* Performance Discussion Dialog */}
      {selectedPerformanceDiscussion && (
        <Dialog 
          open={!!selectedPerformanceDiscussion} 
          onOpenChange={(open) => !open && setSelectedPerformanceDiscussion(null)}
        >
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Performance Review Discussion</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <PerformanceDiscussion
                discussionId={selectedPerformanceDiscussion}
                onClose={() => setSelectedPerformanceDiscussion(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TrainingSessionDetails;