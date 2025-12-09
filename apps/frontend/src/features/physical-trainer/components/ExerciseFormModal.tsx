'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, X } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../types';
import { VideoUploadModal } from './VideoUploadModal';

interface ExerciseFormModalProps {
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

export function ExerciseFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  exercise,
  mode,
  isLoading = false
}: ExerciseFormModalProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Exercise>>({
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
  });

  const [selectedEquipment, setSelectedEquipment] = useState('');

  const handleAddEquipment = () => {
    if (selectedEquipment && !formData.equipment?.includes(selectedEquipment)) {
      setFormData({
        ...formData,
        equipment: [...(formData.equipment || []), selectedEquipment]
      });
      setSelectedEquipment('');
    }
  };

  const handleRemoveEquipment = (equipment: string) => {
    setFormData({
      ...formData,
      equipment: formData.equipment?.filter(e => e !== equipment) || []
    });
  };

  const handleVideoUpdate = (videoUrl: string) => {
    setFormData({ ...formData, videoUrl });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' 
                ? t('physicalTrainer:exercises.create')
                : t('physicalTrainer:exercises.edit')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Exercise Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('physicalTrainer:exercises.form.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('physicalTrainer:exercises.form.namePlaceholder')}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('physicalTrainer:exercises.form.category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value: Exercise['category']) => 
                  setFormData({ ...formData, category: value })
                }
              >
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
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">{t('physicalTrainer:exercises.form.reps')}</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) })}
                />
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
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    duration: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder={t('physicalTrainer:exercises.form.optional')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rest">
                  {t('physicalTrainer:exercises.form.restBetweenSets')} 
                  <span className="text-muted-foreground ml-1">({t('common:units.seconds')})</span>
                </Label>
                <Input
                  id="rest"
                  type="number"
                  min="0"
                  value={formData.restBetweenSets}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    restBetweenSets: parseInt(e.target.value) 
                  })}
                />
              </div>
            </div>

            {/* Intensity */}
            <div className="space-y-2">
              <Label htmlFor="intensity">{t('physicalTrainer:exercises.form.intensity')}</Label>
              <Select
                value={formData.intensity}
                onValueChange={(value: Exercise['intensity']) => 
                  setFormData({ ...formData, intensity: value })
                }
              >
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
                {formData.equipment?.map(equipment => (
                  <Badge key={equipment} variant="secondary">
                    {t(`physicalTrainer:equipment.${equipment}`)}
                    <button
                      onClick={() => handleRemoveEquipment(equipment)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Video */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:exercises.form.video')}</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
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
              {formData.videoUrl && (
                <p className="text-sm text-muted-foreground">
                  {t('physicalTrainer:exercises.form.videoAdded')}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('physicalTrainer:exercises.form.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('physicalTrainer:exercises.form.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading 
                ? t('common:actions.saving')
                : mode === 'create' 
                  ? t('common:actions.create')
                  : t('common:actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Upload Modal */}
      {showVideoUpload && (
        <VideoUploadModal
          isOpen={showVideoUpload}
          onClose={() => setShowVideoUpload(false)}
          onVideoUpdate={handleVideoUpdate}
          exerciseName={formData.name || ''}
          currentVideoUrl={formData.videoUrl}
        />
      )}
    </>
  );
}