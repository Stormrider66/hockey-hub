import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  Clock,
  Plus,
  X,
  Upload,
  Users,
  CheckSquare,
  Tag,
  MapPin,
  Phone,
  Link,
  FileText,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import {
  useCreateCommunicationMutation,
  useGetTemplatesQuery,
  useUseTemplateMutation,
  CommunicationType,
  CommunicationCategory,
  CommunicationPriority,
  CreateCommunicationDto,
  ParentCommunicationTemplate,
} from '@/store/api/parentCommunicationApi';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface ParentCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId?: string;
  parentId?: string;
  teamId?: string;
  organizationId: string;
}

interface FormData extends CreateCommunicationDto {
  useTemplate: boolean;
  templateId?: string;
}

export const ParentCommunicationModal: React.FC<ParentCommunicationModalProps> = ({
  isOpen,
  onClose,
  playerId,
  parentId,
  teamId,
  organizationId,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [participants, setParticipants] = useState<{ id: string; name: string; role: string }[]>([]);
  const [actionItems, setActionItems] = useState<{ description: string; assignedTo: string; dueDate?: string }[]>([]);

  const { data: templates } = useGetTemplatesQuery({});
  const [useTemplate] = useUseTemplateMutation();
  const [createCommunication, { isLoading }] = useCreateCommunicationMutation();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      organizationId,
      teamId: teamId || '',
      coachId: user?.id || '',
      playerId: playerId || '',
      parentId: parentId || '',
      type: CommunicationType.IN_PERSON_MEETING,
      category: CommunicationCategory.OTHER,
      priority: CommunicationPriority.MEDIUM,
      communicationDate: new Date().toISOString(),
      subject: '',
      summary: '',
      detailedNotes: '',
      isConfidential: false,
      requiresFollowUp: false,
      useTemplate: false,
    },
  });

  const selectedType = watch('type');
  const selectedTemplate = watch('templateId');
  const requiresFollowUp = watch('requiresFollowUp');

  useEffect(() => {
    if (selectedTemplate && templates) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        handleTemplateSelect(template);
      }
    }
  }, [selectedTemplate, templates]);

  const handleTemplateSelect = async (template: ParentCommunicationTemplate) => {
    try {
      await useTemplate(template.id).unwrap();
      
      setValue('type', template.type);
      setValue('category', template.category);
      setValue('subject', template.subject);
      setValue('summary', template.content);
      
      if (template.actionItemTemplates) {
        const newActionItems = template.actionItemTemplates.map(item => ({
          description: item.description,
          assignedTo: item.defaultAssignee || user?.name || '',
          dueDate: item.defaultDueDays 
            ? new Date(Date.now() + item.defaultDueDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        }));
        setActionItems(newActionItems);
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { id: '', name: '', role: '' }]);
  };

  const handleUpdateParticipant = (index: number, field: string, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleAddActionItem = () => {
    setActionItems([...actionItems, { description: '', assignedTo: user?.name || '' }]);
  };

  const handleUpdateActionItem = (index: number, field: string, value: string) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const communicationData: CreateCommunicationDto = {
        ...data,
        tags: tags.length > 0 ? tags : undefined,
        additionalParticipants: participants.filter(p => p.name).length > 0 
          ? participants.filter(p => p.name)
          : undefined,
        actionItems: actionItems.filter(a => a.description).length > 0
          ? actionItems.filter(a => a.description)
          : undefined,
      };

      await createCommunication(communicationData).unwrap();
      toast.success('Communication logged successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to log communication');
      console.error('Error creating communication:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Log Parent Communication</DialogTitle>
            <DialogDescription>
              Record details of your interaction with the parent
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="basic" className="space-y-4 pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="use-template">Use Template</Label>
                    <Controller
                      name="useTemplate"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="use-template"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  {watch('useTemplate') && templates && templates.length > 0 && (
                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Controller
                        name="templateId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="template">
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Communication Type</Label>
                      <Controller
                        name="type"
                        control={control}
                        rules={{ required: 'Type is required' }}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CommunicationType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                                   type.replace(/_/g, ' ').slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.type && (
                        <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Controller
                        name="category"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CommunicationCategory).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CommunicationPriority).map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor="communication-date">Date & Time</Label>
                      <Controller
                        name="communicationDate"
                        control={control}
                        rules={{ required: 'Date is required' }}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="communication-date"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(new Date(field.value), 'PPP p')
                                  : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.communicationDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.communicationDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      {...register('subject', { required: 'Subject is required' })}
                      placeholder="Brief subject of the communication"
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      {...register('summary', { required: 'Summary is required' })}
                      placeholder="Brief summary of what was discussed"
                      rows={3}
                    />
                    {errors.summary && (
                      <p className="text-sm text-red-600 mt-1">{errors.summary.message}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="detailed-notes">Detailed Notes</Label>
                    <Textarea
                      id="detailed-notes"
                      {...register('detailedNotes')}
                      placeholder="Comprehensive notes about the communication"
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        {...register('durationMinutes', { 
                          valueAsNumber: true,
                          min: { value: 1, message: 'Duration must be at least 1 minute' }
                        })}
                        placeholder="30"
                      />
                      {errors.durationMinutes && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.durationMinutes.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          {...register('location')}
                          placeholder="Meeting location"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {(selectedType === CommunicationType.PHONE_CALL || 
                    selectedType === CommunicationType.TEXT_MESSAGE) && (
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          {...register('phoneNumber')}
                          placeholder="Phone number used"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  )}

                  {selectedType === CommunicationType.VIDEO_CALL && (
                    <div>
                      <Label htmlFor="meeting-link">Meeting Link</Label>
                      <div className="relative">
                        <Link className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="meeting-link"
                          {...register('meetingLink')}
                          placeholder="Video call link"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            id="tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            placeholder="Add a tag"
                            className="pl-8"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddTag}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isConfidential"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="confidential"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="confidential">Mark as Confidential</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="space-y-4 pr-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Additional Participants</Label>
                    <Button
                      type="button"
                      onClick={handleAddParticipant}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Participant
                    </Button>
                  </div>

                  {participants.map((participant, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Name"
                        value={participant.name}
                        onChange={(e) => handleUpdateParticipant(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Role"
                        value={participant.role}
                        onChange={(e) => handleUpdateParticipant(index, 'role', e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => handleRemoveParticipant(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="follow-up" className="space-y-4 pr-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="requiresFollowUp"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="requires-follow-up"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="requires-follow-up">Requires Follow-up</Label>
                  </div>

                  {requiresFollowUp && (
                    <>
                      <div>
                        <Label htmlFor="follow-up-date">Follow-up Date</Label>
                        <Controller
                          name="followUpDate"
                          control={control}
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="follow-up-date"
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? format(new Date(field.value), 'PPP')
                                    : 'Pick a date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date?.toISOString())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>

                      <div>
                        <Label htmlFor="follow-up-notes">Follow-up Notes</Label>
                        <Textarea
                          id="follow-up-notes"
                          {...register('followUpNotes')}
                          placeholder="What needs to be followed up on?"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Action Items</Label>
                      <Button
                        type="button"
                        onClick={handleAddActionItem}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Action Item
                      </Button>
                    </div>

                    {actionItems.map((item, index) => (
                      <div key={index} className="space-y-2 p-3 border rounded">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Action item description"
                            value={item.description}
                            onChange={(e) => handleUpdateActionItem(index, 'description', e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => handleRemoveActionItem(index)}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Assigned to"
                            value={item.assignedTo}
                            onChange={(e) => handleUpdateActionItem(index, 'assignedTo', e.target.value)}
                          />
                          <Input
                            type="date"
                            value={item.dueDate ? item.dueDate.split('T')[0] : ''}
                            onChange={(e) => handleUpdateActionItem(
                              index, 
                              'dueDate', 
                              e.target.value ? new Date(e.target.value).toISOString() : ''
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner size="sm" center={false} className="mr-2" />}
              Log Communication
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};