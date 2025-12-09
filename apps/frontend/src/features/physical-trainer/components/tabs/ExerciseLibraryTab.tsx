'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Library, Play, X, Dumbbell, Edit, Trash2, Download, Upload } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  useGetExercisesQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation
} from '@/store/api/trainingApi';
import { toast } from 'sonner';
import { mockExerciseLibraryStats } from '../../constants/mockData';
import { VideoPlayerModal } from '../VideoPlayerModal';
import { ExerciseFormModal } from '../ExerciseFormModal';
import { Exercise } from '../../types';
import { exportExercises, importExercises, ExportOptions } from '../../utils/dataExportImport';
import { DataMigrationModal } from '../DataMigrationModal';
import { ReportExporter } from '../ReportExporter';

interface ExerciseLibraryTabProps {
  // Add any props needed
}

export default function ExerciseLibraryTab(props: ExerciseLibraryTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState<string | undefined>(undefined);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; name: string } | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // Fetch exercises from API
  const { data: exercisesData, isLoading: exercisesLoading } = useGetExercisesQuery({
    category: selectedExerciseCategory,
    search: exerciseSearch
  });
  
  // Mutations
  const [createExercise, { isLoading: isCreating }] = useCreateExerciseMutation();
  const [updateExercise, { isLoading: isUpdating }] = useUpdateExerciseMutation();
  const [deleteExercise, { isLoading: isDeleting }] = useDeleteExerciseMutation();

  // Extract exercises array from API response
  const exercises = exercisesData?.exercises || [];

  // Calculate stats from API data
  const displayStats = {
    total: exercises.length,
    byCategory: exercises.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentlyAdded: exercises.filter(ex => {
      const created = new Date(ex.orderIndex); // Using orderIndex as timestamp for now
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
    withVideos: Math.floor(exercises.length * 0.8) // Mock 80% have videos
  };

  const displayExercises = exercises;

  const handlePlayVideo = (exercise: Exercise) => {
    if (exercise.videoUrl) {
      setSelectedVideo({ url: exercise.videoUrl, name: exercise.name });
      setShowVideoPlayer(true);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormMode('edit');
    setShowExerciseForm(true);
  };

  const handleCreateExercise = () => {
    setSelectedExercise(undefined);
    setFormMode('create');
    setShowExerciseForm(true);
  };

  const handleSaveExercise = async (exerciseData: Partial<Exercise>) => {
    // Validate required fields
    if (!exerciseData.name?.trim()) {
      toast.error(t('physicalTrainer:exercises.validation.nameRequired'));
      return;
    }
    
    if (!exerciseData.category) {
      toast.error(t('physicalTrainer:exercises.validation.categoryRequired'));
      return;
    }
    
    // Validate at least one parameter is set
    if (!exerciseData.sets && !exerciseData.reps && !exerciseData.duration && !exerciseData.distance) {
      toast.error(t('physicalTrainer:exercises.validation.parametersRequired'));
      return;
    }
    
    try {
      if (formMode === 'create') {
        // Create new exercise
        const result = await createExercise({
          ...exerciseData,
          orderIndex: exercises.length, // Set order index to the end
        } as Omit<Exercise, 'id'>).unwrap();
        
        toast.success(t('physicalTrainer:exercises.messages.createSuccess'));
      } else if (selectedExercise) {
        // Update existing exercise
        const result = await updateExercise({
          id: selectedExercise.id.toString(),
          data: exerciseData
        }).unwrap();
        
        toast.success(t('physicalTrainer:exercises.messages.updateSuccess'));
      }
      
      setShowExerciseForm(false);
      setSelectedExercise(undefined);
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error(
        formMode === 'create' 
          ? t('physicalTrainer:exercises.messages.createError')
          : t('physicalTrainer:exercises.messages.updateError')
      );
    }
  };
  
  const handleDeleteClick = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setShowDeleteDialog(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    
    try {
      await deleteExercise(exerciseToDelete.id.toString()).unwrap();
      toast.success(t('physicalTrainer:exercises.messages.deleteSuccess'));
      setShowDeleteDialog(false);
      setExerciseToDelete(null);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast.error(t('physicalTrainer:exercises.messages.deleteError'));
    }
  };

  const handleExportExercises = async (options: ExportOptions) => {
    try {
      let exercisesToExport = exercises;
      
      // Filter by selected exercises if any
      if (selectedExercises.length > 0) {
        exercisesToExport = exercises.filter(ex => 
          selectedExercises.includes(ex.id.toString())
        );
      }
      
      // Filter by category if selected
      if (selectedExerciseCategory) {
        exercisesToExport = exercisesToExport.filter(ex => 
          ex.category === selectedExerciseCategory
        );
      }
      
      await exportExercises(exercisesToExport, options);
      toast.success(t('physicalTrainer:exercises.export.success'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('physicalTrainer:exercises.export.error'));
    }
  };

  const handleImportExercises = async (dataType: string, data: any[], options: any) => {
    try {
      const result = await importExercises(data[0], exercises);
      
      if (result.success && result.data) {
        // Create exercises via API
        for (const exercise of result.data) {
          await createExercise(exercise as Omit<Exercise, 'id'>).unwrap();
        }
        
        toast.success(t('physicalTrainer:exercises.import.success', { 
          count: result.data.length 
        }));
        
        if (result.duplicates && result.duplicates.length > 0) {
          toast.warning(t('physicalTrainer:exercises.import.duplicatesSkipped', { 
            count: result.duplicates.length 
          }));
        }
      }
      
      setShowImportModal(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('physicalTrainer:exercises.import.error'));
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('physicalTrainer:exercises.title')}</CardTitle>
              <CardDescription>{t('physicalTrainer:exercises.subtitle')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <ReportExporter
                data={exercises}
                dataType="test"
                onExport={handleExportExercises}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('physicalTrainer:exercises.import.button')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                    {t('physicalTrainer:exercises.import.fromFile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Quick import from file input
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json,.csv,.xlsx';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const result = await importExercises(file, exercises);
                        if (result.success && result.data) {
                          // Create exercises
                          for (const exercise of result.data) {
                            await createExercise(exercise as Omit<Exercise, 'id'>).unwrap();
                          }
                          toast.success(t('physicalTrainer:exercises.import.success', { 
                            count: result.data.length 
                          }));
                        }
                      }
                    };
                    input.click();
                  }}>
                    {t('physicalTrainer:exercises.import.quickImport')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleCreateExercise} disabled={isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                {t('physicalTrainer:exercises.create')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(displayStats.byCategory).map(([category, count]) => (
              <Card 
                key={category} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedExerciseCategory === category && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedExerciseCategory(
                  selectedExerciseCategory === category ? undefined : category
                )}
              >
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground capitalize">{category} {t('physicalTrainer:exercises.exercisesCount')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                <Library className="h-3 w-3 mr-1" />
                {displayStats.total} {t('physicalTrainer:exercises.totalExercises')}
              </Badge>
              <Badge variant="outline">
                <Play className="h-3 w-3 mr-1" />
                {displayStats.withVideos} {t('physicalTrainer:exercises.withVideos')}
              </Badge>
              {selectedExerciseCategory && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedExerciseCategory(undefined)}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('common:actions.clearFilter')}
                </Button>
              )}
            </div>
            <Input 
              placeholder={t('physicalTrainer:exercises.search')} 
              className="max-w-sm"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
            />
          </div>

          {/* Exercise list */}
          {exercisesLoading ? (
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">{t('physicalTrainer:exercises.loading')}</p>
              </div>
            </div>
          ) : displayExercises.length === 0 ? (
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {exerciseSearch || selectedExerciseCategory ? 
                    t('physicalTrainer:exercises.noMatchingExercises') : 
                    t('physicalTrainer:exercises.noExercisesYet')}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-3">
                {displayExercises.map((exercise) => (
                  <Card key={exercise.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{exercise.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {exercise.category}
                              </Badge>
                              {exercise.sets && <span>{exercise.sets} {t('physicalTrainer:workouts.parameters.sets')}</span>}
                              {exercise.reps && <span>× {exercise.reps} {t('physicalTrainer:workouts.parameters.reps')}</span>}
                              {exercise.duration && <span>{exercise.duration}s</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePlayVideo(exercise)}
                            disabled={!exercise.videoUrl}
                            title={exercise.videoUrl ? t('physicalTrainer:exercises.playVideo') : t('physicalTrainer:exercises.noVideo')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            disabled={isUpdating}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(exercise)}
                            disabled={isDeleting}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <VideoPlayerModal
          isOpen={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideo(null);
          }}
          videoUrl={selectedVideo.url}
          exerciseName={selectedVideo.name}
        />
      )}

      {/* Exercise Form Modal */}
      {showExerciseForm && (
        <ExerciseFormModal
          isOpen={showExerciseForm}
          onClose={() => {
            setShowExerciseForm(false);
            setSelectedExercise(undefined);
          }}
          onSave={handleSaveExercise}
          exercise={selectedExercise}
          mode={formMode}
          isLoading={isCreating || isUpdating}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('physicalTrainer:exercises.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('physicalTrainer:exercises.deleteDialog.description', { 
                exerciseName: exerciseToDelete?.name 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t('common:actions.deleting') : t('common:actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Data Migration Modal */}
      {showImportModal && (
        <DataMigrationModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportExercises}
        />
      )}
    </div>
  );
}