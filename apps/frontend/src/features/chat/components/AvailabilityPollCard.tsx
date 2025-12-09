import React, { useState } from 'react';
import { BarChart3, Calendar, Clock, MapPin, Users, CheckCircle, Circle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  useSubmitPollResponseMutation,
  useFinalizePollDecisionMutation
} from '@/store/api/scheduleClarificationApi';
import { format, parseISO, isPast } from 'date-fns';
import { toast } from 'react-hot-toast';

interface AvailabilityPollCardProps {
  poll: any; // Replace with proper type
  currentUserId: string;
  isCoordinator: boolean;
  onVoteSubmit?: () => void;
}

export const AvailabilityPollCard: React.FC<AvailabilityPollCardProps> = ({
  poll,
  currentUserId,
  isCoordinator,
  onVoteSubmit,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [overallStatus, setOverallStatus] = useState('available');
  const [comments, setComments] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showVoteForm, setShowVoteForm] = useState(false);

  const [submitResponse] = useSubmitPollResponseMutation();
  const [finalizePoll] = useFinalizePollDecisionMutation();

  const hasVoted = poll.responses?.some((r: any) => r.user_id === currentUserId);
  const userResponse = poll.responses?.find((r: any) => r.user_id === currentUserId);
  const isPollActive = poll.status === 'active' && (!poll.deadline || !isPast(parseISO(poll.deadline)));
  const totalResponses = poll.responses?.length || 0;
  const totalParticipants = poll.target_user_ids?.length || poll.participant_count || 10; // Fallback

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'closed':
        return 'secondary';
      case 'decided':
        return 'primary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPollIcon = () => {
    switch (poll.type) {
      case 'date_time':
        return Calendar;
      case 'time_only':
        return Clock;
      case 'location':
        return MapPin;
      default:
        return BarChart3;
    }
  };

  const Icon = getPollIcon();

  const handleVoteSubmit = async () => {
    if (!poll.allow_multiple_choices && selectedOptions.length !== 1) {
      toast.error('Please select exactly one option');
      return;
    }

    if (selectedOptions.length === 0) {
      toast.error('Please select at least one option');
      return;
    }

    try {
      await submitResponse({
        pollId: poll.id,
        selectedOptionIds: selectedOptions,
        overallStatus,
        comments,
      }).unwrap();

      toast.success('Your response has been submitted!');
      setShowVoteForm(false);
      if (onVoteSubmit) {
        onVoteSubmit();
      }
    } catch (error) {
      toast.error('Failed to submit response');
    }
  };

  const handleFinalizePoll = async (optionId: string) => {
    try {
      await finalizePoll({
        pollId: poll.id,
        selectedOptionId: optionId,
        decisionNotes: `Option selected based on majority preference`,
      }).unwrap();

      toast.success('Poll decision finalized!');
    } catch (error) {
      toast.error('Failed to finalize poll');
    }
  };

  const getOptionVotes = (optionId: string) => {
    return poll.responses?.filter((r: any) => 
      r.selected_option_ids.includes(optionId)
    ).length || 0;
  };

  const toggleOption = (optionId: string) => {
    if (poll.allow_multiple_choices) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Icon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{poll.title}</h4>
              {poll.description && (
                <p className="text-sm text-gray-600 mt-1">{poll.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <Badge variant={getStatusColor(poll.status)}>
                  {poll.status}
                </Badge>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalResponses}/{totalParticipants} responded
                </span>
                {poll.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {format(parseISO(poll.deadline), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPollActive && !hasVoted && (
              <Button
                size="sm"
                onClick={() => setShowVoteForm(!showVoteForm)}
              >
                Vote
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResults(!showResults)}
            >
              {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {(showResults || showVoteForm) && (
        <CardContent className="pt-0">
          {/* Vote Form */}
          {showVoteForm && !hasVoted && (
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                {poll.options.map((option: any) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleOption(option.id)}
                  >
                    <div className="flex items-center gap-3">
                      {poll.allow_multiple_choices ? (
                        <Checkbox
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => toggleOption(option.id)}
                        />
                      ) : (
                        <RadioGroupItem
                          value={option.id}
                          checked={selectedOptions.includes(option.id)}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{option.description}</p>
                        {option.date && (
                          <p className="text-sm text-gray-600">
                            {format(parseISO(option.date), 'EEEE, MMM d')}
                          </p>
                        )}
                        {option.time && (
                          <p className="text-sm text-gray-600">
                            {option.time}
                          </p>
                        )}
                        {option.location && (
                          <p className="text-sm text-gray-600">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {option.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Your Overall Availability</Label>
                <RadioGroup value={overallStatus} onValueChange={setOverallStatus}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="available" id="available" />
                    <label htmlFor="available" className="text-sm">Available</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <label htmlFor="maybe" className="text-sm">Maybe</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_available" id="not_available" />
                    <label htmlFor="not_available" className="text-sm">Not Available</label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleVoteSubmit}
                  disabled={selectedOptions.length === 0}
                >
                  Submit Response
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowVoteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="space-y-3 pt-4">
              {poll.show_results_immediately || poll.status !== 'active' || isCoordinator ? (
                <>
                  {poll.options.map((option: any) => {
                    const votes = getOptionVotes(option.id);
                    const percentage = totalResponses > 0 ? (votes / totalResponses) * 100 : 0;
                    const isWinning = votes === Math.max(...poll.options.map((o: any) => getOptionVotes(o.id)));

                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium flex items-center gap-2">
                              {option.description}
                              {poll.final_decision?.selected_option_id === option.id && (
                                <Badge variant="success" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                              {isWinning && poll.status === 'active' && (
                                <Badge variant="outline" className="text-xs">
                                  Leading
                                </Badge>
                              )}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {votes} vote{votes !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        {!poll.anonymous_responses && votes > 0 && (
                          <div className="flex -space-x-2 mt-1">
                            {poll.responses
                              .filter((r: any) => r.selected_option_ids.includes(option.id))
                              .slice(0, 5)
                              .map((r: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"
                                  title={r.user_name || 'User'}
                                />
                              ))}
                            {votes > 5 && (
                              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white">
                                +{votes - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Finalize Button for Coordinators */}
                  {isCoordinator && poll.status === 'active' && totalResponses > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">
                        Select the winning option to finalize this poll:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {poll.options.map((option: any) => (
                          <Button
                            key={option.id}
                            size="sm"
                            variant="outline"
                            onClick={() => handleFinalizePoll(option.id)}
                          >
                            {option.description}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Results will be shown after the poll closes</p>
                </div>
              )}
            </div>
          )}

          {/* User's Response */}
          {hasVoted && userResponse && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Your Response:</p>
              <div className="space-y-1 text-sm">
                <p>
                  Status: <Badge variant="outline">{userResponse.overall_status}</Badge>
                </p>
                <p>Selected: {userResponse.selected_option_ids.join(', ')}</p>
                {userResponse.comments && (
                  <p className="text-gray-600">"{userResponse.comments}"</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};