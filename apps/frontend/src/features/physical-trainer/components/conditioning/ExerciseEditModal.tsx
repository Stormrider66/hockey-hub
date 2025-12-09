import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseAssignment } from '../../types/workout-builder.types';

interface ExerciseEditModalProps {
  exercise: ExerciseAssignment;
  exerciseName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ExerciseAssignment) => void;
}

export const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({
  exercise,
  exerciseName,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [formData, setFormData] = useState({
    sets: exercise.sets || 3,
    reps: exercise.reps || 10,
    duration: exercise.duration || 0,
    restBetweenSets: exercise.restBetweenSets || 60,
    unit: exercise.duration ? 'duration' : 'reps',
  });

  const handleSave = () => {
    const updated: ExerciseAssignment = {
      ...exercise,
      sets: formData.sets,
      reps: formData.unit === 'reps' ? formData.reps : undefined,
      duration: formData.unit === 'duration' ? formData.duration : undefined,
      restBetweenSets: formData.restBetweenSets,
    };
    onSave(updated);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Exercise: {exerciseName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sets" className="text-right">
              Sets
            </Label>
            <Input
              id="sets"
              type="number"
              min="1"
              max="10"
              value={formData.sets}
              onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Type
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reps">Repetitions</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.unit === 'reps' ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reps" className="text-right">
                Reps
              </Label>
              <Input
                id="reps"
                type="number"
                min="1"
                max="50"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 1 })}
                className="col-span-3"
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (s)
              </Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="300"
                step="5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                className="col-span-3"
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rest" className="text-right">
              Rest (s)
            </Label>
            <Input
              id="rest"
              type="number"
              min="0"
              max="300"
              step="5"
              value={formData.restBetweenSets}
              onChange={(e) => setFormData({ ...formData, restBetweenSets: parseInt(e.target.value) || 0 })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};