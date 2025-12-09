import React, { useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Star,
  Target,
  Activity,
  Clock,
  Calendar,
  Plus,
  Minus,
  Medal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  PerformanceMetricType,
  PerformancePeriod,
  PerformanceTrend,
  useCreatePerformanceDiscussionMutation,
} from '@/store/api/performanceApi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface CreatePerformanceReviewProps {
  playerId: string;
  playerName?: string;
  trainingDiscussionId?: string;
  sessionDate?: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (discussionId: string) => void;
}

interface MetricRating {
  type: PerformanceMetricType;
  value: number;
  trend: PerformanceTrend;
  notes: string;
}

const CreatePerformanceReview: React.FC<CreatePerformanceReviewProps> = ({
  playerId,
  playerName,
  trainingDiscussionId,
  sessionDate,
  open,
  onOpenChange,
  onCreated,
}) => {
  const [createPerformanceDiscussion, { isLoading }] = useCreatePerformanceDiscussionMutation();
  
  const [period, setPeriod] = useState<PerformancePeriod>(
    trainingDiscussionId ? PerformancePeriod.SESSION : PerformancePeriod.WEEKLY
  );
  const [overallRating, setOverallRating] = useState<number[]>([7]);
  const [overallAssessment, setOverallAssessment] = useState('');
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [areasForImprovement, setAreasForImprovement] = useState<string[]>(['']);
  const [isConfidential, setIsConfidential] = useState(false);
  const [parentCanView, setParentCanView] = useState(true);
  
  const [metrics, setMetrics] = useState<MetricRating[]>([
    { type: PerformanceMetricType.SPEED, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.POWER, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.ENDURANCE, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.TECHNIQUE, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.CONSISTENCY, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.MENTAL_FOCUS, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
    { type: PerformanceMetricType.TEAM_PLAY, value: 7, trend: PerformanceTrend.CONSISTENT, notes: '' },
  ]);

  const updateMetric = (index: number, field: keyof MetricRating, value: any) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setMetrics(newMetrics);
  };

  const addStrength = () => setStrengths([...strengths, '']);
  const removeStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };
  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const addAreaForImprovement = () => setAreasForImprovement([...areasForImprovement, '']);
  const removeAreaForImprovement = (index: number) => {
    setAreasForImprovement(areasForImprovement.filter((_, i) => i !== index));
  };
  const updateAreaForImprovement = (index: number, value: string) => {
    const newAreas = [...areasForImprovement];
    newAreas[index] = value;
    setAreasForImprovement(newAreas);
  };

  const handleSubmit = async () => {
    try {
      // Calculate date range based on period
      let startDate = new Date();
      const endDate = new Date();
      
      switch (period) {
        case PerformancePeriod.SESSION:
          startDate = sessionDate || new Date();
          break;
        case PerformancePeriod.WEEKLY:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case PerformancePeriod.MONTHLY:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case PerformancePeriod.QUARTERLY:
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case PerformancePeriod.SEASONAL:
          startDate.setMonth(startDate.getMonth() - 6);
          break;
      }

      const response = await createPerformanceDiscussion({
        playerId,
        trainingDiscussionId,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        performanceMetrics: metrics.map(m => ({
          metric_type: m.type,
          current_value: m.value,
          trend: m.trend,
          notes: m.notes || undefined,
        })),
        strengths: strengths.filter(s => s.trim()),
        areasForImprovement: areasForImprovement.filter(a => a.trim()),
        overallAssessment,
        overallRating: overallRating[0],
        isConfidential,
        parentCanView,
      }).unwrap();

      toast.success('Performance review created successfully');
      onCreated?.(response.id);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create performance review');
    }
  };

  const getMetricLabel = (type: PerformanceMetricType) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getTrendIcon = (trend: PerformanceTrend) => {
    switch (trend) {
      case PerformanceTrend.IMPROVING:
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case PerformanceTrend.DECLINING:
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case PerformanceTrend.CONSISTENT:
        return <Activity className="h-4 w-4 text-blue-600" />;
      case PerformanceTrend.VARIABLE:
        return <BarChart3 className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Performance Review</DialogTitle>
          <DialogDescription>
            {playerName ? `Performance review for ${playerName}` : 'Create a performance review'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Review Period */}
          <div className="space-y-2">
            <Label>Review Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as PerformancePeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trainingDiscussionId && (
                  <SelectItem value={PerformancePeriod.SESSION}>Training Session</SelectItem>
                )}
                <SelectItem value={PerformancePeriod.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={PerformancePeriod.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={PerformancePeriod.QUARTERLY}>Quarterly</SelectItem>
                <SelectItem value={PerformancePeriod.SEASONAL}>Seasonal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Overall Performance Rating (1-10)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={overallRating}
                onValueChange={setOverallRating}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <Badge variant="outline" className="w-12 justify-center text-lg">
                {overallRating[0]}
              </Badge>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <Label>Performance Metrics</Label>
            {metrics.map((metric, index) => (
              <Card key={metric.type}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{getMetricLabel(metric.type)}</h4>
                      <Select
                        value={metric.trend}
                        onValueChange={(value) => updateMetric(index, 'trend', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PerformanceTrend.IMPROVING}>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(PerformanceTrend.IMPROVING)}
                              Improving
                            </div>
                          </SelectItem>
                          <SelectItem value={PerformanceTrend.CONSISTENT}>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(PerformanceTrend.CONSISTENT)}
                              Consistent
                            </div>
                          </SelectItem>
                          <SelectItem value={PerformanceTrend.DECLINING}>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(PerformanceTrend.DECLINING)}
                              Declining
                            </div>
                          </SelectItem>
                          <SelectItem value={PerformanceTrend.VARIABLE}>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(PerformanceTrend.VARIABLE)}
                              Variable
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[metric.value]}
                        onValueChange={([value]) => updateMetric(index, 'value', value)}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="outline" className="w-8 justify-center">
                        {metric.value}
                      </Badge>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={metric.notes}
                      onChange={(e) => updateMetric(index, 'notes', e.target.value)}
                      className="w-full px-3 py-1 text-sm border rounded-md"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Strengths</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addStrength}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-green-600" />
                <input
                  type="text"
                  value={strength}
                  onChange={(e) => updateStrength(index, e.target.value)}
                  placeholder="Enter a strength"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                {strengths.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStrength(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Areas for Improvement</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addAreaForImprovement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {areasForImprovement.map((area, index) => (
              <div key={index} className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <input
                  type="text"
                  value={area}
                  onChange={(e) => updateAreaForImprovement(index, e.target.value)}
                  placeholder="Enter an area for improvement"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                {areasForImprovement.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAreaForImprovement(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Overall Assessment */}
          <div className="space-y-2">
            <Label htmlFor="assessment">Overall Assessment</Label>
            <Textarea
              id="assessment"
              value={overallAssessment}
              onChange={(e) => setOverallAssessment(e.target.value)}
              placeholder="Provide an overall assessment of the player's performance..."
              rows={4}
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label>Privacy Settings</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confidential"
                checked={isConfidential}
                onCheckedChange={(checked) => setIsConfidential(checked as boolean)}
              />
              <label
                htmlFor="confidential"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark as confidential
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parentView"
                checked={parentCanView}
                onCheckedChange={(checked) => setParentCanView(checked as boolean)}
                disabled={isConfidential}
              />
              <label
                htmlFor="parentView"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow parents to view
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePerformanceReview;