import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Medal,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  FileText,
  Zap,
  Users,
  Calendar,
  ChevronRight,
  Plus,
  Edit,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useAppSelector } from '@/hooks/redux';
import { 
  useGetPerformanceDiscussionQuery,
  useAddPerformanceFeedbackMutation,
  useCompleteActionItemMutation,
} from '@/store/api/performanceApi';
import { toast } from 'react-hot-toast';

interface PerformanceDiscussionProps {
  discussionId: string;
  onClose?: () => void;
}

interface PerformanceMetric {
  metric_type: string;
  current_value: number;
  previous_value?: number;
  target_value?: number;
  trend: 'improving' | 'consistent' | 'declining' | 'variable';
  notes?: string;
}

interface Goal {
  id: string;
  description: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'missed';
  progress?: number;
}

interface ActionItem {
  id: string;
  description: string;
  assigned_to: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
}

const PerformanceDiscussion: React.FC<PerformanceDiscussionProps> = ({
  discussionId,
  onClose,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const { data: discussion, isLoading } = useGetPerformanceDiscussionQuery(discussionId);
  const [addFeedback] = useAddPerformanceFeedbackMutation();
  const [completeActionItem] = useCompleteActionItemMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Performance discussion not found</p>
      </div>
    );
  }

  const isCoach = user?.id === discussion.coach_id || user?.roles?.includes('coach');
  const isPlayer = user?.id === discussion.player_id;
  const isParent = user?.roles?.includes('parent') && discussion.parent_can_view;

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'power': return <Activity className="h-4 w-4" />;
      case 'endurance': return <Clock className="h-4 w-4" />;
      case 'technique': return <Target className="h-4 w-4" />;
      case 'consistency': return <BarChart3 className="h-4 w-4" />;
      case 'mental_focus': return <Medal className="h-4 w-4" />;
      case 'team_play': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'consistent': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'variable': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-500';
      case 'missed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      await addFeedback({
        discussionId,
        feedbackContent,
      }).unwrap();

      toast.success('Feedback added successfully');
      setFeedbackContent('');
    } catch (error) {
      toast.error('Failed to add feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCompleteActionItem = async (actionId: string) => {
    try {
      await completeActionItem({
        discussionId,
        actionId,
      }).unwrap();

      toast.success('Action item completed');
    } catch (error) {
      toast.error('Failed to complete action item');
    }
  };

  const formatPeriodLabel = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1).replace('_', ' ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Performance Review - {formatPeriodLabel(discussion.period)}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(discussion.start_date), 'MMM d')} - {format(new Date(discussion.end_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {discussion.overall_rating && (
              <Badge variant="outline" className="text-lg px-3 py-1">
                {discussion.overall_rating}/10
              </Badge>
            )}
            {discussion.is_confidential && (
              <Badge variant="secondary">Confidential</Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="goals">Goals & Action Items</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          {(isCoach || isPlayer) && (
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Overall Assessment */}
          {discussion.overall_assessment && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{discussion.overall_assessment}</p>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {discussion.strengths?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {discussion.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {discussion.areas_for_improvement?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {discussion.areas_for_improvement.map((area: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Training Recommendations */}
          {discussion.training_recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Training Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discussion.training_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="border-l-2 border-purple-200 pl-3">
                      <h4 className="font-medium text-sm">{rec.area}</h4>
                      {rec.exercises?.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {rec.exercises.map((exercise: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">• {exercise}</li>
                          ))}
                        </ul>
                      )}
                      {rec.frequency && (
                        <p className="text-xs text-muted-foreground mt-1">Frequency: {rec.frequency}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 p-4 space-y-4 overflow-y-auto">
          {discussion.performance_metrics?.map((metric: PerformanceMetric, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric.metric_type)}
                    <span className="capitalize">{metric.metric_type.replace('_', ' ')}</span>
                  </div>
                  {getTrendIcon(metric.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-semibold">{metric.current_value}</span>
                  </div>
                  
                  {metric.previous_value !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Previous</span>
                      <span>{metric.previous_value}</span>
                    </div>
                  )}
                  
                  {metric.target_value !== undefined && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target</span>
                        <span>{metric.target_value}</span>
                      </div>
                      <Progress 
                        value={(metric.current_value / metric.target_value) * 100} 
                        className="h-2"
                      />
                    </>
                  )}
                  
                  {metric.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{metric.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="goals" className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Goals */}
          {discussion.goals?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </h3>
              {discussion.goals.map((goal: Goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{goal.description}</p>
                        {goal.target_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(goal.status)} text-white`}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    {goal.progress !== undefined && (
                      <Progress value={goal.progress} className="h-2 mt-3" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Separator />

          {/* Action Items */}
          {discussion.action_items?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Action Items
              </h3>
              {discussion.action_items.map((item: ActionItem) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Assigned to: {item.assigned_to}</span>
                          {item.due_date && (
                            <span>Due: {format(new Date(item.due_date), 'MMM d')}</span>
                          )}
                        </div>
                      </div>
                      {item.completed ? (
                        <Badge variant="outline" className="bg-green-500 text-white">
                          Completed
                        </Badge>
                      ) : (
                        isCoach || user?.id === item.assigned_to ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteActionItem(item.id)}
                          >
                            Mark Complete
                          </Button>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discussion" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MessageList 
              conversationId={discussion.conversation_id}
              showTypingIndicator
            />
          </div>
          
          <div className="p-4 border-t">
            <MessageInput
              conversationId={discussion.conversation_id}
              placeholder="Add to the performance discussion..."
            />
          </div>
        </TabsContent>

        {(isCoach || isPlayer) && (
          <TabsContent value="feedback" className="flex-1 p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Feedback</CardTitle>
                <CardDescription>
                  Provide additional feedback or comments about the performance review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback">Your Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Share your thoughts, observations, or suggestions..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackContent.trim() || isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Previous feedback will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PerformanceDiscussion;