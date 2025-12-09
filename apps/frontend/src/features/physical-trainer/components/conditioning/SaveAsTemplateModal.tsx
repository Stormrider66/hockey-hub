'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Save, X, Plus, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IntervalProgram, WorkoutTemplate } from '../../types';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<WorkoutTemplate, 'id' | 'createdBy'>) => void;
  intervalProgram: IntervalProgram;
}

const TEMPLATE_CATEGORIES = [
  { value: 'hiit', label: 'HIIT', description: 'High-intensity interval training' },
  { value: 'steady_state', label: 'Steady State', description: 'Aerobic base building' },
  { value: 'pyramid', label: 'Pyramid', description: 'Progressive intervals' },
  { value: 'fartlek', label: 'Fartlek', description: 'Speed play training' },
  { value: 'recovery', label: 'Recovery', description: 'Active recovery sessions' },
  { value: 'test', label: 'Test', description: 'Fitness testing protocols' },
  { value: 'custom', label: 'Custom', description: 'Other workout types' }
];

const RECOMMENDED_FOR_OPTIONS = [
  'All levels',
  'Beginners',
  'Intermediate',
  'Advanced',
  'Elite',
  'Youth',
  'Masters',
  'Base building',
  'Pre-season',
  'In-season',
  'Off-season',
  'Race preparation',
  'Recovery week',
  'Testing'
];

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  onSave,
  intervalProgram
}: SaveAsTemplateModalProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  const [templateName, setTemplateName] = useState(intervalProgram.name || '');
  const [description, setDescription] = useState(intervalProgram.description || '');
  const [category, setCategory] = useState<WorkoutTemplate['category']>('custom');
  const [recommendedFor, setRecommendedFor] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const template: Omit<WorkoutTemplate, 'id' | 'createdBy'> = {
      name: templateName.trim(),
      category,
      description: description.trim(),
      intervalProgram: {
        ...intervalProgram,
        name: templateName.trim(),
        description: description.trim()
      },
      recommendedFor: recommendedFor.length > 0 ? recommendedFor : undefined,
      isPublic
    };
    
    onSave(template);
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !recommendedFor.includes(newTag.trim())) {
      setRecommendedFor([...recommendedFor, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setRecommendedFor(recommendedFor.filter(t => t !== tag));
  };

  const selectedCategory = TEMPLATE_CATEGORIES.find(c => c.value === category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this workout as a reusable template for future sessions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name" className="required">
              Template Name
            </Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="e.g., 20-Minute HIIT Rowing"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="required">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              placeholder="Describe the workout structure, goals, and benefits..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="required">
              Category
            </Label>
            <Select 
              value={category} 
              onValueChange={(value: WorkoutTemplate['category']) => {
                setCategory(value);
                if (errors.category) {
                  setErrors({ ...errors, category: '' });
                }
              }}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Recommended For Tags */}
          <div className="space-y-2">
            <Label>Recommended For (Optional)</Label>
            <div className="space-y-3">
              {/* Predefined tags */}
              <div className="flex flex-wrap gap-2">
                {RECOMMENDED_FOR_OPTIONS.map((option) => (
                  <Badge
                    key={option}
                    variant={recommendedFor.includes(option) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (recommendedFor.includes(option)) {
                        handleRemoveTag(option);
                      } else {
                        setRecommendedFor([...recommendedFor, option]);
                      }
                    }}
                  >
                    {option}
                  </Badge>
                ))}
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add custom tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected tags */}
              {recommendedFor.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {recommendedFor.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base">
                Make Template Public
              </Label>
              <div className="text-sm text-muted-foreground">
                Allow other trainers in your organization to use this template
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Template Preview Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Template includes:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>{intervalProgram.intervals.length} intervals</li>
                  <li>Total duration: {Math.floor(intervalProgram.totalDuration / 60)} minutes</li>
                  <li>Equipment: {intervalProgram.equipment.replace('_', ' ')}</li>
                  <li>Estimated calories: {intervalProgram.estimatedCalories}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}