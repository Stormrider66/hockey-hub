import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Dumbbell,
  Users,
  Eye,
  FolderOpen,
  Save,
  X,
  AlertCircle
} from '@/components/icons';
import { 
  WorkoutBuilderLayoutProps, 
  WorkoutBuilderTab 
} from '../../types/workout-builder.types';
import { WorkoutBuilderHeader } from './WorkoutBuilderHeader';

/**
 * Unified workout builder layout component
 * Provides consistent structure for all workout types
 */
export const WorkoutBuilderLayout: React.FC<WorkoutBuilderLayoutProps> = ({
  workoutType,
  currentTab,
  onTabChange,
  children,
  onSave,
  onCancel,
  isDirty = false,
  isSaving = false,
  validationErrors = [],
  title
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Tab configuration with icons and labels
  const tabs: Array<{
    id: WorkoutBuilderTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'details',
      label: t('physicalTrainer:workoutBuilder.tabs.details'),
      icon: FileText
    },
    {
      id: 'exercises',
      label: t('physicalTrainer:workoutBuilder.tabs.exercises'),
      icon: Dumbbell,
      badge: validationErrors.filter(e => e.field.startsWith('exercise')).length
    },
    {
      id: 'assignment',
      label: t('physicalTrainer:workoutBuilder.tabs.assignment'),
      icon: Users,
      badge: validationErrors.filter(e => e.field.startsWith('assignment')).length
    },
    {
      id: 'preview',
      label: t('physicalTrainer:workoutBuilder.tabs.preview'),
      icon: Eye
    },
    {
      id: 'templates',
      label: t('physicalTrainer:workoutBuilder.tabs.templates'),
      icon: FolderOpen
    }
  ];

  // Get workout type color
  const getWorkoutTypeColor = () => {
    switch (workoutType) {
      case 'strength':
        return 'blue';
      case 'conditioning':
        return 'red';
      case 'hybrid':
        return 'purple';
      case 'agility':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const color = getWorkoutTypeColor();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <WorkoutBuilderHeader
        title={title}
        workoutType={workoutType}
        onSave={onSave}
        onCancel={onCancel}
        isSaving={isSaving}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs 
          value={currentTab} 
          onValueChange={(value) => onTabChange(value as WorkoutBuilderTab)}
          className="h-full flex flex-col"
        >
          {/* Tab List */}
          <TabsList className="mx-6 mt-4 mb-0 bg-white border-b border-gray-200 rounded-b-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const hasErrors = tab.badge && tab.badge > 0;
              
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 relative",
                    "data-[state=active]:text-primary data-[state=active]:border-b-2",
                    `data-[state=active]:border-${color}-500`,
                    hasErrors && "text-red-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {hasErrors && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 px-1 min-w-[20px] flex items-center justify-center"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden bg-white mx-6 mb-6 rounded-b-lg shadow-sm">
            {children}
          </div>
        </Tabs>
      </div>

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('physicalTrainer:workoutBuilder.validation.errorsFound', { count: validationErrors.length })}
            </span>
          </div>
        </div>
      )}

      {/* Footer Actions (Mobile) */}
      <div className="md:hidden px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            {t('common:cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || validationErrors.length > 0}
            className={cn(
              "flex-1",
              `bg-${color}-500 hover:bg-${color}-600 text-white`
            )}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t('common:saving') : t('common:save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Tab content wrapper component
 */
export const WorkoutTabContent: React.FC<{
  value: WorkoutBuilderTab;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  return (
    <TabsContent 
      value={value} 
      className={cn(
        "h-full overflow-auto focus:outline-none",
        "data-[state=active]:flex data-[state=active]:flex-col",
        className
      )}
    >
      {children}
    </TabsContent>
  );
};