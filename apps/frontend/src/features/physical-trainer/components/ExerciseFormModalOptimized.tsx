'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../types';
import { VideoUploadModal } from './VideoUploadModal';
import { 
  useOptimizedForm, 
  useOptimizedSelect, 
  useOptimizedMultiSelect,
  useOptimizedNumberInput,
  useFormFieldProps 
} from '../utils/formOptimization';

interface ExerciseFormModalOptimizedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Partial<Exercise>) => void;
  exercise?: Exercise;
  mode: 'create' | 'edit';
  isLoading?: boolean;
}

const EXERCISE_CATEGORIES = [
  'strength',
  'conditioning',
  'agility',
  'mobility',
  'recovery',
  'skill'
] as const;

const EQUIPMENT_OPTIONS = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'resistance-band',
  'pull-up-bar',
  'bench',
  'mat',
  'medicine-ball',
  'trx',
  'cable-machine',
  'none'
];

// Memoized component for equipment badges to prevent re-renders
const EquipmentBadge = React.memo(({ 
  equipment, 
  onRemove 
}: { 
  equipment: string; 
  onRemove: (equipment: string) => void;
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  const handleRemove = useCallback(() => {
    onRemove(equipment);
  }, [equipment, onRemove]);
  
  return (
    <Badge variant="secondary">
      {t(`physicalTrainer:equipment.${equipment}`)}
      <button
        onClick={handleRemove}
        className="ml-2 hover:text-destructive"
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
});

EquipmentBadge.displayName = 'EquipmentBadge';

export function ExerciseFormModalOptimized({ 
  isOpen, 
  onClose, 
  onSave, 
  exercise,
  mode,
  isLoading = false
}: ExerciseFormModalOptimizedProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  
  // Initialize form with optimized hook
  const form = useOptimizedForm<Partial<Exercise>>({
    initialValues: {
      name: exercise?.name || '',
      category: exercise?.category || 'strength',
      sets: exercise?.sets || 3,
      reps: exercise?.reps || 10,
      duration: exercise?.duration,
      restBetweenSets: exercise?.restBetweenSets || 60,
      equipment: exercise?.equipment || [],
      notes: exercise?.notes || '',
      videoUrl: exercise?.videoUrl || '',
      intensity: exercise?.intensity || 'medium'
    },
    onSubmit: (values) => {
      onSave(values);
      onClose();
    },
    debounceMs: 300
  });
  
  // Optimized select handlers
  const categorySelect = useOptimizedSelect(
    form.values.category!,
    (value) => form.setFieldValue('category', value)
  );
  
  const intensitySelect = useOptimizedSelect(
    form.values.intensity!,
    (value) => form.setFieldValue('intensity', value)
  );
  
  // Optimized multi-select for equipment
  const equipmentMultiSelect = useOptimizedMultiSelect(
    form.values.equipment || [],
    (value) => form.setFieldValue('equipment', value)
  );
  
  // Optimized number inputs
  const setsInput = useOptimizedNumberInput(
    form.values.sets,
    (value) => form.setFieldValue('sets', value),
    { min: 1, max: 20, debounceMs: 500 }
  );
  
  const repsInput = useOptimizedNumberInput(
    form.values.reps,
    (value) => form.setFieldValue('reps', value),
    { min: 1, max: 100, debounceMs: 500 }
  );
  
  const durationInput = useOptimizedNumberInput(
    form.values.duration,
    (value) => form.setFieldValue('duration', value),
    { min: 0, max: 3600, debounceMs: 500 }
  );
  
  const restInput = useOptimizedNumberInput(
    form.values.restBetweenSets,
    (value) => form.setFieldValue('restBetweenSets', value),
    { min: 0, max: 600, debounceMs: 500 }
  );
  
  // Equipment selector state
  const [selectedEquipment, setSelectedEquipment] = useState('');
  
  const handleAddEquipment = useCallback(() => {
    if (selectedEquipment && !equipmentMultiSelect.includes(selectedEquipment)) {
      equipmentMultiSelect.add(selectedEquipment);
      setSelectedEquipment('');
    }
  }, [selectedEquipment, equipmentMultiSelect]);
  
  const handleVideoUpdate = useCallback((videoUrl: string) => {
    form.setFieldValue('videoUrl', videoUrl);
  }, [form]);
  
  // Memoized form field props
  const nameFieldProps = useFormFieldProps('name', form);
  const notesFieldProps = useFormFieldProps('notes', form);
  const videoUrlFieldProps = useFormFieldProps('videoUrl', form);
  
  // Memoized dialog title
  const dialogTitle = useMemo(() => 
    mode === 'create' 
      ? t('physicalTrainer:exercises.create')
      : t('physicalTrainer:exercises.edit'),
    [mode, t]
  );
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Exercise Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('physicalTrainer:exercises.form.name')}</Label>
                <Input
                  {...nameFieldProps}
                  placeholder={t('physicalTrainer:exercises.form.namePlaceholder')}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">{t('physicalTrainer:exercises.form.category')}</Label>
                <Select {...categorySelect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {t(`physicalTrainer:exercises.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sets and Reps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">{t('physicalTrainer:exercises.form.sets')}</Label>
                  <Input {...setsInput} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">{t('physicalTrainer:exercises.form.reps')}</Label>
                  <Input {...repsInput} />
                </div>
              </div>

              {/* Duration and Rest */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    {t('physicalTrainer:exercises.form.duration')} 
                    <span className="text-muted-foreground ml-1">({t('common:units.seconds')})</span>
                  </Label>
                  <Input
                    {...durationInput}
                    placeholder={t('physicalTrainer:exercises.form.optional')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rest">
                    {t('physicalTrainer:exercises.form.restBetweenSets')} 
                    <span className="text-muted-foreground ml-1">({t('common:units.seconds')})</span>
                  </Label>
                  <Input {...restInput} />
                </div>
              </div>

              {/* Intensity */}
              <div className="space-y-2">
                <Label htmlFor="intensity">{t('physicalTrainer:exercises.form.intensity')}</Label>
                <Select {...intensitySelect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('common:intensity.low')}</SelectItem>
                    <SelectItem value="medium">{t('common:intensity.medium')}</SelectItem>
                    <SelectItem value="high">{t('common:intensity.high')}</SelectItem>
                    <SelectItem value="max">{t('common:intensity.max')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:exercises.form.equipment')}</Label>
                <div className="flex gap-2">
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('physicalTrainer:exercises.form.selectEquipment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_OPTIONS.map(equipment => (
                        <SelectItem key={equipment} value={equipment}>
                          {t(`physicalTrainer:equipment.${equipment}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={handleAddEquipment}
                    disabled={!selectedEquipment}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {equipmentMultiSelect.values.map(equipment => (
                    <EquipmentBadge
                      key={equipment}
                      equipment={equipment}
                      onRemove={equipmentMultiSelect.remove}
                    />
                  ))}
                </div>
              </div>

              {/* Video */}
              <div className="space-y-2">
                <Label>{t('physicalTrainer:exercises.form.video')}</Label>
                <div className="flex gap-2">
                  <Input
                    {...videoUrlFieldProps}
                    placeholder={t('physicalTrainer:exercises.form.videoUrlPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVideoUpload(true)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {t('physicalTrainer:exercises.form.uploadVideo')}
                  </Button>
                </div>
                {form.values.videoUrl && (
                  <p className="text-sm text-muted-foreground">
                    {t('physicalTrainer:exercises.form.videoAdded')}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('physicalTrainer:exercises.form.notes')}</Label>
                <Textarea
                  {...notesFieldProps}
                  placeholder={t('physicalTrainer:exercises.form.notesPlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || form.isSubmitting}
              >
                {isLoading || form.isSubmitting
                  ? t('common:actions.saving')
                  : mode === 'create' 
                    ? t('common:actions.create')
                    : t('common:actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Upload Modal */}
      {showVideoUpload && (
        <VideoUploadModal
          isOpen={showVideoUpload}
          onClose={() => setShowVideoUpload(false)}
          onVideoUpdate={handleVideoUpdate}
          exerciseName={form.values.name || ''}
          currentVideoUrl={form.values.videoUrl}
        />
      )}
    </>
  );
}