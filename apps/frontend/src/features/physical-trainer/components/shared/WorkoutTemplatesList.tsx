import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Target,
  Clock,
  Trophy,
  Activity,
  Plus
} from '@/components/icons';
import { WorkoutTemplateCard } from './WorkoutTemplateCard';
import { WorkoutType } from '../../types';
import { WorkoutTemplateSelection } from '../../types/workout-builder.types';
import { mockWorkoutTemplates } from '../../data/mockTemplates';

export interface WorkoutTemplatesListProps {
  workoutType: WorkoutType;
  onSelectTemplate: (template: WorkoutTemplateSelection) => void;
  onCreateCustom?: () => void;
  currentTemplateId?: string;
}

type TemplateCategory = 'all' | 'goal' | 'duration' | 'level' | 'sport' | 'custom';

export const WorkoutTemplatesList: React.FC<WorkoutTemplatesListProps> = ({
  workoutType,
  onSelectTemplate,
  onCreateCustom,
  currentTemplateId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter templates based on workout type and search
  const filteredTemplates = useMemo(() => {
    let templates = mockWorkoutTemplates.filter(template => template.type === workoutType);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => {
        switch (selectedCategory) {
          case 'goal':
            return template.tags?.some(tag => 
              ['strength', 'endurance', 'power', 'hypertrophy', 'speed', 'agility'].includes(tag)
            );
          case 'duration':
            return true; // All templates have duration
          case 'level':
            return template.tags?.some(tag => 
              ['beginner', 'intermediate', 'advanced'].includes(tag)
            );
          case 'sport':
            return template.tags?.some(tag => 
              ['hockey', 'soccer', 'basketball', 'football', 'general'].includes(tag)
            );
          case 'custom':
            return template.author === 'You' || template.author === 'Custom';
          default:
            return true;
        }
      });
    }

    // Sort by usage count and rating
    return templates.sort((a, b) => {
      const aScore = (a.usageCount || 0) + (a.rating || 0) * 10;
      const bScore = (b.usageCount || 0) + (b.rating || 0) * 10;
      return bScore - aScore;
    });
  }, [workoutType, searchQuery, selectedCategory]);

  // Group templates by category for display
  const groupedTemplates = useMemo(() => {
    if (selectedCategory === 'duration') {
      const groups: Record<string, WorkoutTemplateSelection[]> = {
        'Quick (< 30 min)': [],
        'Standard (30-60 min)': [],
        'Extended (60+ min)': []
      };

      filteredTemplates.forEach(template => {
        if (template.defaultDuration < 30) {
          groups['Quick (< 30 min)'].push(template);
        } else if (template.defaultDuration <= 60) {
          groups['Standard (30-60 min)'].push(template);
        } else {
          groups['Extended (60+ min)'].push(template);
        }
      });

      return groups;
    }

    if (selectedCategory === 'level') {
      const groups: Record<string, WorkoutTemplateSelection[]> = {
        'Beginner': [],
        'Intermediate': [],
        'Advanced': []
      };

      filteredTemplates.forEach(template => {
        const level = template.tags?.find(tag => 
          ['beginner', 'intermediate', 'advanced'].includes(tag)
        );
        if (level) {
          groups[level.charAt(0).toUpperCase() + level.slice(1)].push(template);
        }
      });

      return groups;
    }

    return { 'All Templates': filteredTemplates };
  }, [filteredTemplates, selectedCategory]);

  const categories = [
    { id: 'all', label: t('physicalTrainer:templates.categories.all'), icon: Activity },
    { id: 'goal', label: t('physicalTrainer:templates.categories.byGoal'), icon: Target },
    { id: 'duration', label: t('physicalTrainer:templates.categories.byDuration'), icon: Clock },
    { id: 'level', label: t('physicalTrainer:templates.categories.byLevel'), icon: Trophy },
    { id: 'sport', label: t('physicalTrainer:templates.categories.bySport'), icon: Activity },
    { id: 'custom', label: t('physicalTrainer:templates.categories.custom'), icon: Plus }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t('physicalTrainer:templates.title')}
            </h3>
            {onCreateCustom && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateCustom}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('physicalTrainer:templates.createCustom')}
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('physicalTrainer:templates.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as TemplateCategory)}
          >
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Template list */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {Object.entries(groupedTemplates).map(([groupName, templates]) => (
            templates.length > 0 && (
              <div key={groupName} className="space-y-4">
                {selectedCategory !== 'all' && (
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {groupName}
                  </h4>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map(template => (
                    <WorkoutTemplateCard
                      key={template.templateId}
                      template={template}
                      onSelect={() => onSelectTemplate(template)}
                      isSelected={template.templateId === currentTemplateId}
                      workoutType={workoutType}
                    />
                  ))}
                </div>
              </div>
            )
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? t('physicalTrainer:templates.noSearchResults')
                  : t('physicalTrainer:templates.noTemplates')}
              </p>
              {onCreateCustom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateCustom}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('physicalTrainer:templates.createFirst')}
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};