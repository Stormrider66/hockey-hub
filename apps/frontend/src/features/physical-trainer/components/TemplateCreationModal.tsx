'use client';

import React, { useState, useMemo } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileText, 
  Dumbbell, 
  Heart, 
  Zap, 
  Activity,
  Clock,
  Users,
  AlertCircle,
  Plus,
  X,
  Search,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCreateSessionTemplateMutation, useUpdateSessionTemplateMutation, useGetExercisesQuery } from '@/store/api/trainingApi';
import type { SessionTemplate, Exercise } from '../types';

type WorkoutType = 'strength' | 'conditioning' | 'hybrid' | 'agility';

interface TemplateCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: SessionTemplate;
  templateToDuplicate?: SessionTemplate;
  onSuccess?: (template: SessionTemplate) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  type: WorkoutType;
  category: string;
  duration: number;
  targetPlayers: 'all' | 'forwards' | 'defense' | 'goalies';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  equipment: string[];
  tags: string[];
  exercises: Exercise[];
  notes: string;
  isPublic: boolean;
}

const WORKOUT_TYPES: { value: WorkoutType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'strength', label: 'Strength', icon: <Dumbbell className="h-4 w-4" />, color: 'bg-blue-500' },
  { value: 'conditioning', label: 'Conditioning', icon: <Heart className="h-4 w-4" />, color: 'bg-red-500' },
  { value: 'hybrid', label: 'Hybrid', icon: <Activity className="h-4 w-4" />, color: 'bg-purple-500' },
  { value: 'agility', label: 'Agility', icon: <Zap className="h-4 w-4" />, color: 'bg-orange-500' },
];

const CATEGORIES = [
  'Pre-Season',
  'In-Season',
  'Off-Season',
  'Recovery',
  'Team Building',
  'Assessment',
  'Game Day',
  'Tournament',
];

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Resistance Bands',
  'Medicine Ball',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Kettlebell',
  'TRX',
  'Box/Platform',
  'Agility Ladder',
  'Cones',
  'Battle Ropes',
  'Foam Roller',
];

const PLAYER_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to training' },
  { value: 'intermediate', label: 'Intermediate', description: 'Regular training experience' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced athletes' },
  { value: 'elite', label: 'Elite', description: 'Professional level' },
];

export const TemplateCreationModal: React.FC<TemplateCreationModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  templateToDuplicate,
  onSuccess
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [createTemplate, { isLoading: isCreating }] = useCreateSessionTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateSessionTemplateMutation();
  const { data: exercisesData } = useGetExercisesQuery({});
  
  const allExercises = exercisesData?.exercises || [];
  
  // Initialize form data
  const initialTemplate = templateToEdit || templateToDuplicate;
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState<TemplateFormData>({
    name: templateToDuplicate ? `${templateToDuplicate.name} (Copy)` : initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    type: (initialTemplate?.type as WorkoutType) || 'strength',
    category: (initialTemplate as any)?.category || CATEGORIES[0],
    duration: (initialTemplate as any)?.duration || 60,
    targetPlayers: initialTemplate?.targetPlayers || 'all',
    difficulty: (initialTemplate as any)?.difficulty || 'intermediate',
    equipment: (initialTemplate as any)?.equipment || [],
    tags: (initialTemplate as any)?.tags || [],
    exercises: initialTemplate?.exercises || [],
    notes: (initialTemplate as any)?.notes || '',
    isPublic: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TemplateFormData, string>>>({});

  // Form steps
  const steps = [
    { id: 'basics', label: 'Basic Info', icon: <FileText className="h-4 w-4" /> },
    { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="h-4 w-4" /> },
    { id: 'details', label: 'Details', icon: <Tag className="h-4 w-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
  ];

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      const notSelected = !formData.exercises.some(e => e.id === exercise.id);
      return matchesSearch && matchesCategory && notSelected;
    });
  }, [allExercises, searchTerm, selectedCategory, formData.exercises]);

  // Validation
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Partial<Record<keyof TemplateFormData, string>> = {};

    if (stepIndex === 0) {
      if (!formData.name.trim()) {
        newErrors.name = t('physicalTrainer:templates.validation.nameRequired');
      }
      if (!formData.type) {
        newErrors.type = t('physicalTrainer:templates.validation.typeRequired');
      }
      if (formData.duration < 15 || formData.duration > 180) {
        newErrors.duration = t('physicalTrainer:templates.validation.durationRange');
      }
    }

    if (stepIndex === 1) {
      if (formData.exercises.length === 0) {
        newErrors.exercises = t('physicalTrainer:templates.validation.exercisesRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof TemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Exercise management
  const addExercise = (exercise: any) => {
    // Convert ExerciseTemplate to Exercise format
    const convertedExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: exercise.sets || 3,
      reps: exercise.reps || 10,
      duration: exercise.duration,
      restBetweenSets: exercise.restPeriod || 60,
      intensity: exercise.difficulty === 'beginner' ? 'low' : exercise.difficulty === 'intermediate' ? 'medium' : 'high',
      equipment: exercise.equipment || [],
      notes: exercise.instructions || '',
      orderIndex: formData.exercises.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleFieldChange('exercises', [...formData.exercises, convertedExercise]);
  };

  const removeExercise = (exerciseId: string | number) => {
    handleFieldChange('exercises', formData.exercises.filter(e => e.id !== exerciseId));
  };

  const reorderExercises = (fromIndex: number, toIndex: number) => {
    const newExercises = [...formData.exercises];
    const [removed] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, removed);
    handleFieldChange('exercises', newExercises);
  };

  // Equipment management
  const toggleEquipment = (equipment: string) => {
    const newEquipment = formData.equipment.includes(equipment)
      ? formData.equipment.filter(e => e !== equipment)
      : [...formData.equipment, equipment];
    handleFieldChange('equipment', newEquipment);
  };

  // Tag management
  const [newTag, setNewTag] = useState('');
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleFieldChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleFieldChange('tags', formData.tags.filter(t => t !== tag));
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Save template
  const handleSave = async () => {
    // Validate all steps
    let isValid = true;
    for (let i = 0; i <= currentStep; i++) {
      if (!validateStep(i)) {
        isValid = false;
      }
    }

    if (!isValid) {
      toast.error(t('physicalTrainer:templates.validation.fixErrors'));
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        targetPlayers: formData.targetPlayers,
        exercises: formData.exercises.map((e, index) => ({
          ...e,
          orderIndex: index + 1
        })),
        // Store additional metadata as custom fields
        category: formData.category,
        duration: formData.duration,
        difficulty: formData.difficulty,
        equipment: formData.equipment,
        tags: formData.tags,
        notes: formData.notes,
        isPublic: formData.isPublic,
        metadata: {
          category: formData.category,
          duration: formData.duration,
          difficulty: formData.difficulty,
          equipment: formData.equipment,
          tags: formData.tags,
          isPublic: formData.isPublic
        }
      };

      let result;
      if (templateToEdit) {
        result = await updateTemplate({
          id: templateToEdit.id.toString(),
          data: templateData
        }).unwrap();
        toast.success(t('physicalTrainer:templates.updateSuccess'));
      } else {
        result = await createTemplate(templateData).unwrap();
        toast.success(t('physicalTrainer:templates.createSuccess'));
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(t('physicalTrainer:templates.saveError'));
    }
  };

  // Calculate total workout volume
  const totalVolume = useMemo(() => {
    return formData.exercises.reduce((total, exercise) => {
      const sets = exercise.sets || 3;
      const reps = exercise.reps || 10;
      return total + (sets * reps);
    }, 0);
  }, [formData.exercises]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {templateToEdit 
              ? t('physicalTrainer:templates.editTemplate')
              : templateToDuplicate
              ? t('physicalTrainer:templates.duplicateTemplate')
              : t('physicalTrainer:templates.createTemplate')
            }
          </DialogTitle>
          <DialogDescription>
            {t('physicalTrainer:templates.createDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${index <= currentStep 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background border-muted-foreground/30'
                }
              `}>
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2 transition-colors
                  ${index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 0 && (
            <div className="space-y-6 h-full overflow-y-auto p-1">
              {/* Template Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('physicalTrainer:templates.fields.name')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={t('physicalTrainer:templates.placeholders.name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('physicalTrainer:templates.fields.description')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder={t('physicalTrainer:templates.placeholders.description')}
                  rows={3}
                />
              </div>

              {/* Workout Type */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:templates.fields.workoutType')} *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {WORKOUT_TYPES.map(type => (
                    <Card
                      key={type.value}
                      className={`
                        p-4 cursor-pointer transition-all
                        ${formData.type === type.value 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-accent'
                        }
                      `}
                      onClick={() => handleFieldChange('type', type.value)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${type.color} text-white`}>
                          {type.icon}
                        </div>
                        <span className="font-medium">{type.label}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                {errors.type && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Category and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    {t('physicalTrainer:templates.fields.category')}
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleFieldChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">
                    {t('physicalTrainer:templates.fields.duration')} ({formData.duration} min) *
                  </Label>
                  <Slider
                    id="duration"
                    value={[formData.duration]}
                    onValueChange={([value]) => handleFieldChange('duration', value)}
                    min={15}
                    max={180}
                    step={15}
                    className={errors.duration ? 'opacity-50' : ''}
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive">{errors.duration}</p>
                  )}
                </div>
              </div>

              {/* Target Players */}
              <div className="space-y-2">
                <Label htmlFor="targetPlayers">
                  {t('physicalTrainer:templates.fields.targetPlayers')}
                </Label>
                <Select
                  value={formData.targetPlayers}
                  onValueChange={(value: any) => handleFieldChange('targetPlayers', value)}
                >
                  <SelectTrigger id="targetPlayers">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('physicalTrainer:templates.targetPlayers.all')}</SelectItem>
                    <SelectItem value="forwards">{t('physicalTrainer:templates.targetPlayers.forwards')}</SelectItem>
                    <SelectItem value="defense">{t('physicalTrainer:templates.targetPlayers.defense')}</SelectItem>
                    <SelectItem value="goalies">{t('physicalTrainer:templates.targetPlayers.goalies')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="h-full flex flex-col">
              {/* Exercise Search */}
              <div className="space-y-4 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('physicalTrainer:exercises.searchPlaceholder')}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('physicalTrainer:exercises.allCategories')}</SelectItem>
                      <SelectItem value="strength">{t('physicalTrainer:exercises.strength')}</SelectItem>
                      <SelectItem value="conditioning">{t('physicalTrainer:exercises.conditioning')}</SelectItem>
                      <SelectItem value="agility">{t('physicalTrainer:exercises.agility')}</SelectItem>
                      <SelectItem value="mobility">{t('physicalTrainer:exercises.mobility')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {errors.exercises && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.exercises}
                  </p>
                )}
              </div>

              {/* Exercise Lists */}
              <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                {/* Available Exercises */}
                <div className="flex flex-col">
                  <h3 className="font-medium mb-2">
                    {t('physicalTrainer:templates.availableExercises')} ({filteredExercises.length})
                  </h3>
                  <ScrollArea className="flex-1 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredExercises.map(exercise => (
                        <Card
                          key={exercise.id}
                          className="p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => addExercise(exercise)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.category} • {exercise.difficulty || 'intermediate'}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Selected Exercises */}
                <div className="flex flex-col">
                  <h3 className="font-medium mb-2">
                    {t('physicalTrainer:templates.selectedExercises')} ({formData.exercises.length})
                  </h3>
                  <ScrollArea className="flex-1 border rounded-md p-2">
                    <div className="space-y-2">
                      {formData.exercises.map((exercise, index) => (
                        <Card key={exercise.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.sets || 3} sets × {exercise.reps || exercise.duration || 10} {exercise.reps ? 'reps' : (exercise.duration ? 's' : 'reps')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={index === 0}
                                onClick={() => reorderExercises(index, index - 1)}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={index === formData.exercises.length - 1}
                                onClick={() => reorderExercises(index, index + 1)}
                              >
                                ↓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExercise(exercise.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 h-full overflow-y-auto p-1">
              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:templates.fields.difficulty')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PLAYER_LEVELS.map(level => (
                    <Card
                      key={level.value}
                      className={`
                        p-3 cursor-pointer transition-all
                        ${formData.difficulty === level.value 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-accent'
                        }
                      `}
                      onClick={() => handleFieldChange('difficulty', level.value)}
                    >
                      <p className="font-medium">{level.label}</p>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Equipment Required */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:templates.fields.equipment')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {EQUIPMENT_OPTIONS.map(equipment => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Switch
                        id={equipment}
                        checked={formData.equipment.includes(equipment)}
                        onCheckedChange={() => toggleEquipment(equipment)}
                      />
                      <Label
                        htmlFor={equipment}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {equipment}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:templates.fields.tags')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t('physicalTrainer:templates.placeholders.addTag')}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {t('physicalTrainer:templates.fields.notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder={t('physicalTrainer:templates.placeholders.notes')}
                  rows={4}
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleFieldChange('isPublic', checked)}
                />
                <Label htmlFor="public" className="cursor-pointer">
                  {t('physicalTrainer:templates.fields.makePublic')}
                  <span className="text-xs text-muted-foreground block">
                    {t('physicalTrainer:templates.fields.publicDescription')}
                  </span>
                </Label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="h-full overflow-y-auto p-1">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{formData.name}</h2>
                
                {formData.description && (
                  <p className="text-muted-foreground mb-6">{formData.description}</p>
                )}

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t('physicalTrainer:templates.preview.overview')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.fields.workoutType')}:</span>
                        <Badge>{formData.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.fields.category')}:</span>
                        <span>{formData.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.fields.duration')}:</span>
                        <span>{formData.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.fields.difficulty')}:</span>
                        <Badge variant="outline">{formData.difficulty}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.fields.targetPlayers')}:</span>
                        <span>{formData.targetPlayers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.preview.totalExercises')}:</span>
                        <span>{formData.exercises.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('physicalTrainer:templates.preview.totalVolume')}:</span>
                        <span>{totalVolume} reps</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">{t('physicalTrainer:templates.fields.equipment')}</h3>
                    {formData.equipment.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.equipment.map(item => (
                          <Badge key={item} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('physicalTrainer:templates.preview.noEquipment')}</p>
                    )}

                    {formData.tags.length > 0 && (
                      <>
                        <h3 className="font-semibold mb-3 mt-4">{t('physicalTrainer:templates.fields.tags')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator className="mb-6" />

                <h3 className="font-semibold mb-3">{t('physicalTrainer:templates.preview.exerciseList')}</h3>
                <div className="space-y-3">
                  {formData.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets || 3} sets × {exercise.reps || exercise.duration || 10} {exercise.reps ? 'reps' : (exercise.duration ? 'seconds' : 'reps')}
                          {exercise.restBetweenSets && ` • ${exercise.restBetweenSets}s rest`}
                        </p>
                      </div>
                      <Badge variant="outline">{exercise.category}</Badge>
                    </div>
                  ))}
                </div>

                {formData.notes && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="font-semibold mb-3">{t('physicalTrainer:templates.fields.notes')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.notes}</p>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common:actions.previous')}
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              {t('common:actions.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('common:actions.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {templateToEdit ? t('common:actions.update') : t('common:actions.create')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateCreationModal;