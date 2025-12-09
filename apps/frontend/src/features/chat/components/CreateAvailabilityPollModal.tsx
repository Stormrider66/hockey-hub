import React, { useState } from 'react';
import { X, BarChart3, Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateAvailabilityPollMutation } from '@/store/api/scheduleClarificationApi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface CreateAvailabilityPollModalProps {
  clarificationId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PollOption {
  id: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
}

export const CreateAvailabilityPollModal: React.FC<CreateAvailabilityPollModalProps> = ({
  clarificationId,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pollType, setPollType] = useState('date_time');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', date: '', time: '', location: '', description: '' },
    { id: '2', date: '', time: '', location: '', description: '' },
  ]);
  const [deadline, setDeadline] = useState('');
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const [anonymousResponses, setAnonymousResponses] = useState(false);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);

  const [createPoll, { isLoading }] = useCreateAvailabilityPollMutation();

  const pollTypes = [
    { value: 'date_time', label: 'Date & Time', icon: Calendar },
    { value: 'time_only', label: 'Time Only', icon: Clock },
    { value: 'location', label: 'Location', icon: MapPin },
    { value: 'general', label: 'General Options', icon: BarChart3 },
  ];

  const addOption = () => {
    setOptions([
      ...options,
      { id: Date.now().toString(), date: '', time: '', location: '', description: '' },
    ]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: string, field: keyof PollOption, value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast.error('Please provide a title for the poll');
      return;
    }

    // Validate options based on poll type
    const validOptions = options.filter(opt => {
      switch (pollType) {
        case 'date_time':
          return opt.date && opt.time;
        case 'time_only':
          return opt.time;
        case 'location':
          return opt.location;
        case 'general':
          return opt.description;
        default:
          return false;
      }
    });

    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 valid options');
      return;
    }

    try {
      await createPoll({
        clarificationId,
        title,
        description,
        type: pollType,
        options: validOptions.map((opt, index) => ({
          id: `option_${index}`,
          date: opt.date || undefined,
          time: opt.time || undefined,
          location: opt.location || undefined,
          description: opt.description || getOptionDescription(opt, pollType),
        })),
        deadline: deadline || undefined,
        allowMultipleChoices,
        anonymousResponses,
        showResultsImmediately,
      }).unwrap();

      toast.success('Poll created successfully!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error('Failed to create poll');
      console.error('Failed to create poll:', error);
    }
  };

  const getOptionDescription = (option: PollOption, type: string): string => {
    switch (type) {
      case 'date_time':
        return `${format(new Date(option.date!), 'MMM d')} at ${option.time}`;
      case 'time_only':
        return option.time || '';
      case 'location':
        return option.location || '';
      default:
        return option.description || '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Create Availability Poll
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poll Type */}
            <div className="space-y-2">
              <Label>Poll Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {pollTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPollType(type.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      pollType === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm font-medium">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Best time for makeup practice"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context for the poll..."
                rows={2}
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {(pollType === 'date_time' || pollType === 'time_only') && (
                        <>
                          {pollType === 'date_time' && (
                            <Input
                              type="date"
                              value={option.date}
                              onChange={(e) => updateOption(option.id, 'date', e.target.value)}
                              required={pollType === 'date_time'}
                            />
                          )}
                          <Input
                            type="time"
                            value={option.time}
                            onChange={(e) => updateOption(option.id, 'time', e.target.value)}
                            required
                          />
                        </>
                      )}
                      {pollType === 'location' && (
                        <Input
                          value={option.location}
                          onChange={(e) => updateOption(option.id, 'location', e.target.value)}
                          placeholder="Location option"
                          className="col-span-2"
                          required
                        />
                      )}
                      {pollType === 'general' && (
                        <Input
                          value={option.description}
                          onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                          placeholder="Option description"
                          className="col-span-2"
                          required
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Poll Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Poll Settings</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="deadline">Response Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-auto"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowMultiple">Allow Multiple Choices</Label>
                    <p className="text-xs text-gray-500">Participants can select multiple options</p>
                  </div>
                  <Switch
                    id="allowMultiple"
                    checked={allowMultipleChoices}
                    onCheckedChange={setAllowMultipleChoices}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="anonymous">Anonymous Responses</Label>
                    <p className="text-xs text-gray-500">Hide who voted for each option</p>
                  </div>
                  <Switch
                    id="anonymous"
                    checked={anonymousResponses}
                    onCheckedChange={setAnonymousResponses}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showResults">Show Results Immediately</Label>
                    <p className="text-xs text-gray-500">Show results as people vote</p>
                  </div>
                  <Switch
                    id="showResults"
                    checked={showResultsImmediately}
                    onCheckedChange={setShowResultsImmediately}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Create Poll
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};