'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Dumbbell, Users, X, Heart, Zap } from 'lucide-react';
import BulkWorkoutAssignment from '../BulkWorkoutAssignment';
import { SessionBuilder } from '../SessionBuilder/SessionBuilder';
import SessionTemplates from '../SessionTemplates';
import ConditioningWorkoutBuilderSimple from '../ConditioningWorkoutBuilderSimple';
import HybridWorkoutBuilderSimple from '../HybridWorkoutBuilderSimple';
import AgilityWorkoutBuilder from '../AgilityWorkoutBuilder';
import { useAuth } from "@/contexts/AuthContext";
import type { SessionTemplate as SessionTemplateType } from '../../types/session-builder.types';
import type { IntervalProgram } from '../../types/conditioning.types';
import type { HybridProgram } from '../../types/hybrid.types';
import type { AgilityProgram } from '../../types/agility.types';
import { toast } from 'react-hot-toast';
import { 
  useCreateSessionTemplateMutation, 
  useUpdateSessionTemplateMutation,
  useCreateConditioningWorkoutMutation,
  useCreateHybridWorkoutMutation,
  useCreateAgilityWorkoutMutation
} from '@/store/api/trainingApi';
import { WorkoutBuilderErrorBoundary } from '../WorkoutErrorBoundary';

interface SessionsTabProps {
  selectedTeamId: string | null;
  onCreateSession: () => void;
  onNavigateToCalendar: () => void;
}

export default function SessionsTab({ selectedTeamId, onCreateSession, onNavigateToCalendar }: SessionsTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const { user } = useAuth();
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [showConditioningBuilder, setShowConditioningBuilder] = useState(false);
  const [showHybridBuilder, setShowHybridBuilder] = useState(false);
  const [showAgilityBuilder, setShowAgilityBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplateType | undefined>();
  
  const [createSessionTemplate, { isLoading: isCreating }] = useCreateSessionTemplateMutation();
  const [updateSessionTemplate, { isLoading: isUpdating }] = useUpdateSessionTemplateMutation();
  const [createConditioningWorkout, { isLoading: isCreatingConditioning }] = useCreateConditioningWorkoutMutation();
  const [createHybridWorkout, { isLoading: isCreatingHybrid }] = useCreateHybridWorkoutMutation();
  const [createAgilityWorkout, { isLoading: isCreatingAgility }] = useCreateAgilityWorkoutMutation();

  const handleSaveTemplate = async (template: SessionTemplateType) => {
    try {
      if (editingTemplate?.id) {
        // Update existing template
        await updateSessionTemplate({
          id: editingTemplate.id,
          data: template
        }).unwrap();
        toast.success(t('physicalTrainer:templates.updateSuccess'));
      } else {
        // Create new template
        await createSessionTemplate(template).unwrap();
        toast.success(t('physicalTrainer:templates.createSuccess'));
      }
      setShowSessionBuilder(false);
      setEditingTemplate(undefined);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(t('physicalTrainer:templates.saveError'));
    }
  };

  const handleApplyTemplate = (template: SessionTemplateType, date?: Date, time?: string) => {
    // This would normally schedule a session based on the template
    console.log('Applying template:', template, date, time);
    onCreateSession();
  };

  const handleEditTemplate = (template: SessionTemplateType) => {
    setEditingTemplate(template);
    setShowSessionBuilder(true);
  };

  const handleSaveConditioningWorkout = async (program: IntervalProgram) => {
    try {
      // Create conditioning workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'conditioning' as const,
        scheduledDate: new Date().toISOString(),
        location: 'Training Center', // Default location
        teamId: selectedTeamId || 'team-001',
        playerIds: [], // Will be populated when scheduling
        intervalProgram: program,
        personalizeForPlayers: false
      };
      
      await createConditioningWorkout(workoutData).unwrap();
      toast.success(t('physicalTrainer:conditioning.createSuccess'));
      setShowConditioningBuilder(false);
      
      // Also create as template for reuse
      const template: SessionTemplateType = {
        id: '',
        name: program.name,
        description: program.description,
        type: 'cardio',
        category: 'conditioning',
        duration: Math.ceil(program.totalDuration / 60),
        exercises: [],
        equipment: [program.equipment],
        targetPlayers: 'all',
        difficulty: program.difficulty || 'intermediate',
        tags: program.tags || [],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          intervalProgram: program
        }
      };
      await createSessionTemplate(template).unwrap();
    } catch (error) {
      console.error('Failed to save conditioning workout:', error);
      toast.error(t('physicalTrainer:conditioning.saveError'));
    }
  };

  const handleSaveHybridWorkout = async (program: HybridProgram) => {
    try {
      // Create hybrid workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'hybrid' as const,
        scheduledDate: new Date().toISOString(),
        location: 'Training Center',
        teamId: selectedTeamId || 'team-001',
        playerIds: [],
        hybridProgram: program
      };
      
      await createHybridWorkout(workoutData).unwrap();
      toast.success(t('physicalTrainer:hybrid.createSuccess'));
      setShowHybridBuilder(false);
      
      // Also create as template for reuse
      const template: SessionTemplateType = {
        id: '',
        name: program.name,
        description: program.description,
        type: 'hybrid',
        category: 'hybrid',
        duration: Math.ceil(program.totalDuration / 60),
        exercises: [],
        equipment: program.equipment,
        targetPlayers: 'all',
        difficulty: 'intermediate',
        tags: ['hybrid'],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          hybridProgram: program
        }
      };
      await createSessionTemplate(template).unwrap();
    } catch (error) {
      console.error('Failed to save hybrid workout:', error);
      toast.error(t('physicalTrainer:hybrid.saveError'));
    }
  };

  const handleSaveAgilityWorkout = async (program: AgilityProgram) => {
    try {
      // Create agility workout using the dedicated API
      const workoutData = {
        title: program.name,
        description: program.description,
        type: 'agility' as const,
        scheduledDate: new Date().toISOString(),
        location: 'Field House',
        teamId: selectedTeamId || 'team-001',
        playerIds: [],
        agilityProgram: program
      };
      
      await createAgilityWorkout(workoutData).unwrap();
      toast.success(t('physicalTrainer:agility.createSuccess'));
      setShowAgilityBuilder(false);
      
      // Also create as template for reuse
      const template: SessionTemplateType = {
        id: '',
        name: program.name,
        description: program.description,
        type: 'agility',
        category: 'agility',
        duration: Math.ceil(program.totalDuration / 60),
        exercises: [],
        equipment: program.equipmentNeeded,
        targetPlayers: 'all',
        difficulty: program.difficulty,
        tags: ['agility', ...program.focusAreas],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          agilityProgram: program
        }
      };
      await createSessionTemplate(template).unwrap();
    } catch (error) {
      console.error('Failed to save agility workout:', error);
      toast.error(t('physicalTrainer:agility.saveError'));
    }
  };

  if (showConditioningBuilder) {
    return (
      <div className="h-full">
        <WorkoutBuilderErrorBoundary
          componentName="Conditioning Workout Builder"
          onReset={() => setShowConditioningBuilder(false)}
        >
          <ConditioningWorkoutBuilderSimple
            onSave={handleSaveConditioningWorkout}
            onCancel={() => setShowConditioningBuilder(false)}
            isLoading={isCreatingConditioning}
          />
        </WorkoutBuilderErrorBoundary>
      </div>
    );
  }

  if (showHybridBuilder) {
    return (
      <div className="h-full">
        <WorkoutBuilderErrorBoundary
          componentName="Hybrid Workout Builder"
          onReset={() => setShowHybridBuilder(false)}
        >
          <HybridWorkoutBuilderSimple
            onSave={handleSaveHybridWorkout}
            onCancel={() => setShowHybridBuilder(false)}
            isLoading={isCreatingHybrid}
          />
        </WorkoutBuilderErrorBoundary>
      </div>
    );
  }

  if (showAgilityBuilder) {
    return (
      <div className="h-full">
        <WorkoutBuilderErrorBoundary
          componentName="Agility Workout Builder"
          onReset={() => setShowAgilityBuilder(false)}
        >
          <AgilityWorkoutBuilder
            onSave={handleSaveAgilityWorkout}
            onCancel={() => setShowAgilityBuilder(false)}
            teamId={selectedTeamId}
          />
        </WorkoutBuilderErrorBoundary>
      </div>
    );
  }

  if (showSessionBuilder) {
    return (
      <div className="h-full">
        <WorkoutBuilderErrorBoundary
          componentName="Session Builder"
          onReset={() => {
            setShowSessionBuilder(false);
            setEditingTemplate(undefined);
          }}
        >
          <SessionBuilder
            mode={editingTemplate ? 'edit' : 'create'}
            sessionId={editingTemplate?.id}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setShowSessionBuilder(false);
              setEditingTemplate(undefined);
            }}
          />
        </WorkoutBuilderErrorBoundary>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('physicalTrainer:sessions.management.title')}</CardTitle>
              <CardDescription>{t('physicalTrainer:sessions.management.subtitle')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={onNavigateToCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('physicalTrainer:sessions.management.schedule')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowBulkAssignment(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                {t('physicalTrainer:sessions.management.bulkAssign')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowSessionBuilder(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                Strength
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowConditioningBuilder(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <Heart className="h-4 w-4 mr-2" />
                Conditioning
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowHybridBuilder(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                Hybrid
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowAgilityBuilder(true)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
              >
                <Zap className="h-4 w-4 mr-2" />
                Agility
              </Button>
              <Button variant="default" onClick={onCreateSession}>
                <Calendar className="h-4 w-4 mr-2" />
                {t('physicalTrainer:sessions.management.quickSchedule')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionTemplates
            onApplyTemplate={handleApplyTemplate}
            onEditTemplate={handleEditTemplate}
          />
        </CardContent>
      </Card>

      {/* Bulk Assignment Modal/Overlay */}
      {showBulkAssignment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <BulkWorkoutAssignment
              organizationId={user?.organizationId || ''}
              userId={user?.id || ''}
              onClose={() => setShowBulkAssignment(false)}
              onSuccess={(count) => {
                console.log(`Created ${count} assignments`);
                setShowBulkAssignment(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}