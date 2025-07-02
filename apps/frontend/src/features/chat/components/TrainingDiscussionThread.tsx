import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Activity, 
  MessageCircle,
  Paperclip,
  ChevronRight,
  Dumbbell,
  Timer,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import FileUpload from './FileUpload';
import { useAppSelector } from '@/hooks/redux';
import { 
  useGetTrainingDiscussionQuery,
  useGetExerciseDiscussionsQuery,
  useActivateDiscussionMutation,
  useCompleteDiscussionMutation,
} from '@/store/api/trainingApi';

interface TrainingDiscussionThreadProps {
  sessionId: string;
  sessionType: 'ice_practice' | 'physical_training' | 'video_review' | 'combined';
  onClose?: () => void;
}

interface ExerciseThread {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exerciseDescription?: string;
  feedbackCount: number;
  attachmentCount: number;
  threadConversationId: string;
  metadata?: {
    duration_minutes?: number;
    sets?: number;
    reps?: number;
    intensity?: string;
  };
}

const TrainingDiscussionThread: React.FC<TrainingDiscussionThreadProps> = ({
  sessionId,
  sessionType,
  onClose,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseThread | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const { data: discussion, isLoading } = useGetTrainingDiscussionQuery({
    sessionId,
    sessionType,
  });

  const { data: exerciseThreads = [] } = useGetExerciseDiscussionsQuery(
    discussion?.id || '',
    { skip: !discussion?.id }
  );

  const [activateDiscussion] = useActivateDiscussionMutation();
  const [completeDiscussion] = useCompleteDiscussionMutation();

  useEffect(() => {
    // Auto-activate discussion if it's scheduled and session time has passed
    if (discussion?.status === 'scheduled') {
      const sessionTime = new Date(discussion.sessionDate);
      if (sessionTime <= new Date()) {
        activateDiscussion(discussion.id);
      }
    }
  }, [discussion, activateDiscussion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No discussion found for this session</p>
      </div>
    );
  }

  const isCoachOrTrainer = user?.roles?.some(role => 
    ['coach', 'trainer', 'physical_trainer'].includes(role)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'archived': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'ice_practice': return <Activity className="h-4 w-4" />;
      case 'physical_training': return <Dumbbell className="h-4 w-4" />;
      case 'video_review': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getSessionTypeIcon(discussion.sessionType)}
              <h2 className="text-xl font-semibold">{discussion.sessionTitle}</h2>
              <Badge variant="outline" className={`${getStatusColor(discussion.status)} text-white`}>
                {discussion.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(discussion.sessionDate), 'PPP')}
              </div>
              {discussion.sessionLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {discussion.sessionLocation}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {discussion.conversation.participant_count} participants
              </div>
            </div>
          </div>

          {isCoachOrTrainer && discussion.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => completeDiscussion(discussion.id)}
            >
              Complete Session
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="discussion" className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="discussion">Main Discussion</TabsTrigger>
          <TabsTrigger value="exercises">
            Exercises ({exerciseThreads.length})
          </TabsTrigger>
          <TabsTrigger value="files">Files & Media</TabsTrigger>
        </TabsList>

        <TabsContent value="discussion" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MessageList 
              conversationId={discussion.conversationId}
              showTypingIndicator
            />
          </div>
          
          <div className="p-4 border-t">
            <MessageInput
              conversationId={discussion.conversationId}
              onFileUpload={() => setShowFileUpload(true)}
              placeholder="Share feedback, ask questions..."
            />
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="flex-1">
          <div className="flex h-full">
            {/* Exercise List */}
            <div className="w-1/3 border-r">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {exerciseThreads.map((exercise: ExerciseThread) => (
                    <Card
                      key={exercise.id}
                      className={`cursor-pointer transition-colors ${
                        selectedExercise?.id === exercise.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm font-medium">
                          {exercise.exerciseName}
                        </CardTitle>
                        {exercise.exerciseDescription && (
                          <CardDescription className="text-xs mt-1">
                            {exercise.exerciseDescription}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {exercise.feedbackCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {exercise.attachmentCount}
                          </div>
                          {exercise.metadata?.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {exercise.metadata.duration_minutes}min
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Exercise Thread */}
            <div className="flex-1 flex flex-col">
              {selectedExercise ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{selectedExercise.exerciseName}</h3>
                    {selectedExercise.exerciseDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedExercise.exerciseDescription}
                      </p>
                    )}
                    {selectedExercise.metadata && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {selectedExercise.metadata.sets && (
                          <Badge variant="secondary">
                            {selectedExercise.metadata.sets} sets
                          </Badge>
                        )}
                        {selectedExercise.metadata.reps && (
                          <Badge variant="secondary">
                            {selectedExercise.metadata.reps} reps
                          </Badge>
                        )}
                        {selectedExercise.metadata.intensity && (
                          <Badge variant="secondary">
                            {selectedExercise.metadata.intensity}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <MessageList 
                      conversationId={selectedExercise.threadConversationId}
                      showTypingIndicator
                    />
                  </div>
                  
                  <div className="p-4 border-t">
                    <MessageInput
                      conversationId={selectedExercise.threadConversationId}
                      onFileUpload={() => setShowFileUpload(true)}
                      placeholder="Share exercise feedback..."
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select an exercise to view discussion</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-1 p-4">
          <div className="space-y-4">
            {isCoachOrTrainer && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowFileUpload(true)}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Shared Files & Media</CardTitle>
                <CardDescription>
                  Videos, images, and documents shared in this training session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  File attachments from the discussion will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          conversationId={selectedExercise?.threadConversationId || discussion.conversationId}
          onClose={() => setShowFileUpload(false)}
          acceptedFileTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx']}
          maxFileSize={100 * 1024 * 1024} // 100MB for videos
        />
      )}
    </div>
  );
};

export default TrainingDiscussionThread;