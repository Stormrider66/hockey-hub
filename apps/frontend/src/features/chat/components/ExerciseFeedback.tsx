import React, { useState } from 'react';
import { 
  MessageCircle, 
  Video, 
  Camera, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Timer,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useCreateExerciseThreadMutation } from '@/store/api/trainingApi';
import { toast } from 'react-hot-toast';

interface ExerciseFeedbackProps {
  trainingDiscussionId: string;
  exercise: {
    id: string;
    name: string;
    description?: string;
    targetSets?: number;
    targetReps?: number;
    targetDuration?: number;
    targetIntensity?: string;
  };
  onThreadCreated?: (threadId: string) => void;
}

const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({
  trainingDiscussionId,
  exercise,
  onThreadCreated,
}) => {
  const [createThread, { isLoading }] = useCreateExerciseThreadMutation();
  const [feedback, setFeedback] = useState('');
  const [performanceRating, setPerformanceRating] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<number[]>([5]);
  const [techniqueQuality, setTechniqueQuality] = useState<string>('');
  const [actualSets, setActualSets] = useState<string>('');
  const [actualReps, setActualReps] = useState<string>('');
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() && !performanceRating) {
      toast.error('Please provide feedback or a performance rating');
      return;
    }

    try {
      const metadata: any = {
        performanceRating,
        difficultyLevel: difficultyLevel[0],
        techniqueQuality,
      };

      if (actualSets) metadata.actualSets = parseInt(actualSets);
      if (actualReps) metadata.actualReps = parseInt(actualReps);

      const result = await createThread({
        trainingDiscussionId,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseDescription: exercise.description,
        metadata,
        initialFeedback: feedback,
      }).unwrap();

      toast.success('Exercise feedback thread created');
      onThreadCreated?.(result.id);
      
      // Reset form
      setFeedback('');
      setPerformanceRating('');
      setDifficultyLevel([5]);
      setTechniqueQuality('');
      setActualSets('');
      setActualReps('');
      setShowDetailedFeedback(false);
    } catch (error) {
      toast.error('Failed to create feedback thread');
    }
  };

  const getPerformanceIcon = (rating: string) => {
    switch (rating) {
      case 'exceeded': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'met': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'below': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'struggled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getTechniqueIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Zap className="h-4 w-4 text-green-600" />;
      case 'good': return <Target className="h-4 w-4 text-blue-600" />;
      case 'needs_work': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Exercise Feedback: {exercise.name}
        </CardTitle>
        {exercise.description && (
          <CardDescription>{exercise.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Metrics */}
        {(exercise.targetSets || exercise.targetReps || exercise.targetDuration) && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg text-sm">
            {exercise.targetSets && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{exercise.targetSets} sets</span>
              </div>
            )}
            {exercise.targetReps && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{exercise.targetReps} reps</span>
              </div>
            )}
            {exercise.targetDuration && (
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>{exercise.targetDuration} min</span>
              </div>
            )}
            {exercise.targetIntensity && (
              <Badge variant="secondary">{exercise.targetIntensity}</Badge>
            )}
          </div>
        )}

        {/* Quick Performance Rating */}
        <div className="space-y-2">
          <Label>Performance Rating</Label>
          <RadioGroup value={performanceRating} onValueChange={setPerformanceRating}>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="exceeded" id="exceeded" />
                <Label htmlFor="exceeded" className="flex items-center gap-2 cursor-pointer">
                  {getPerformanceIcon('exceeded')}
                  Exceeded Target
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="met" id="met" />
                <Label htmlFor="met" className="flex items-center gap-2 cursor-pointer">
                  {getPerformanceIcon('met')}
                  Met Target
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="below" id="below" />
                <Label htmlFor="below" className="flex items-center gap-2 cursor-pointer">
                  {getPerformanceIcon('below')}
                  Below Target
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                <RadioGroupItem value="struggled" id="struggled" />
                <Label htmlFor="struggled" className="flex items-center gap-2 cursor-pointer">
                  {getPerformanceIcon('struggled')}
                  Struggled
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Feedback Text */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback & Notes</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience, technique notes, or areas for improvement..."
            rows={3}
          />
        </div>

        {/* Detailed Feedback Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
        >
          {showDetailedFeedback ? 'Hide' : 'Show'} Detailed Feedback
        </Button>

        {/* Detailed Feedback */}
        {showDetailedFeedback && (
          <div className="space-y-4 pt-2 border-t">
            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label>Perceived Difficulty (1-10)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={difficultyLevel}
                  onValueChange={setDifficultyLevel}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-8 text-center font-medium">{difficultyLevel[0]}</span>
              </div>
            </div>

            {/* Technique Quality */}
            <div className="space-y-2">
              <Label>Technique Quality</Label>
              <Select value={techniqueQuality} onValueChange={setTechniqueQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technique quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      {getTechniqueIcon('excellent')}
                      Excellent Form
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      {getTechniqueIcon('good')}
                      Good Form
                    </div>
                  </SelectItem>
                  <SelectItem value="needs_work">
                    <div className="flex items-center gap-2">
                      {getTechniqueIcon('needs_work')}
                      Needs Improvement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actual Performance */}
            {(exercise.targetSets || exercise.targetReps) && (
              <div className="grid grid-cols-2 gap-4">
                {exercise.targetSets && (
                  <div className="space-y-2">
                    <Label htmlFor="actualSets">Actual Sets Completed</Label>
                    <input
                      id="actualSets"
                      type="number"
                      value={actualSets}
                      onChange={(e) => setActualSets(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder={exercise.targetSets.toString()}
                      min="0"
                    />
                  </div>
                )}
                {exercise.targetReps && (
                  <div className="space-y-2">
                    <Label htmlFor="actualReps">Actual Reps Per Set</Label>
                    <input
                      id="actualReps"
                      type="number"
                      value={actualReps}
                      onChange={(e) => setActualReps(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder={exercise.targetReps.toString()}
                      min="0"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || (!feedback.trim() && !performanceRating)}
          >
            Create Feedback Thread
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseFeedback;