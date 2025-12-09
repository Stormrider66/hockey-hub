'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Library, Star, Clock, Users, Grid, Edit, Copy, 
  Play, MoreVertical, Heart, Dumbbell, Zap, Target
} from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionTemplate } from '../../../types/session-builder.types';
import { WorkoutType } from '../../../types';

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count 
}) => {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className="gap-1"
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
      <Badge 
        variant={active ? "secondary" : "outline"} 
        className="ml-1 text-xs"
      >
        {count}
      </Badge>
    </Button>
  );
};

interface TemplateCardProps {
  template: SessionTemplate;
  onUse: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onDuplicate: () => void;
  compact?: boolean;
  isFavorite?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onUse, 
  onEdit, 
  onFavorite,
  onDuplicate,
  compact = false,
  isFavorite = false
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength':
      case 'mixed':
        return Dumbbell;
      case 'cardio':
      case 'conditioning':
        return Heart;
      case 'hybrid':
        return Zap;
      case 'agility':
        return Target;
      default:
        return Dumbbell;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
      case 'mixed':
        return 'text-blue-500';
      case 'cardio':
      case 'conditioning':
        return 'text-red-500';
      case 'hybrid':
        return 'text-purple-500';
      case 'agility':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const TypeIcon = getTypeIcon(template.type);
  const typeColor = getTypeColor(template.type);
  
  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg bg-muted ${typeColor}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onUse}>
                  <Play className="mr-2 h-4 w-4" />
                  {t('sessions.templates.use')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('sessions.templates.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('sessions.templates.duplicate')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onFavorite}>
                  <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? t('sessions.templates.unfavorite') : t('sessions.templates.favorite')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <h5 className="font-medium text-sm truncate" title={template.name}>
            {template.name}
          </h5>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {template.duration} min
            </Badge>
            {template.difficulty && (
              <Badge variant="secondary" className="text-xs">
                {template.difficulty}
              </Badge>
            )}
          </div>
          
          {template.usageCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('sessions.templates.usedTimes', { count: template.usageCount })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${typeColor}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-medium">{template.name}</h5>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFavorite}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-500' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">{template.duration} min</Badge>
          {template.difficulty && (
            <Badge variant="secondary">{template.difficulty}</Badge>
          )}
          {template.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('sessions.templates.usedTimes', { count: template.usageCount })}
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              {t('sessions.templates.edit')}
            </Button>
            <Button size="sm" onClick={onUse}>
              <Play className="h-3 w-3 mr-1" />
              {t('sessions.templates.use')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export type TemplateFilter = 'favorites' | 'recent' | 'shared' | 'all';

interface TemplatesHistorySectionProps {
  templates: SessionTemplate[];
  favoriteIds: string[];
  onUseTemplate: (template: SessionTemplate) => void;
  onEditTemplate: (template: SessionTemplate) => void;
  onDuplicateTemplate: (template: SessionTemplate) => void;
  onToggleFavorite: (templateId: string) => void;
  onLoadMore: () => void;
  isLoading?: boolean;
}

export const TemplatesHistorySection: React.FC<TemplatesHistorySectionProps> = ({
  templates,
  favoriteIds = [],
  onUseTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onToggleFavorite,
  onLoadMore,
  isLoading = false
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [activeFilter, setActiveFilter] = useState<TemplateFilter>('recent');
  
  const getFilteredTemplates = (filter: TemplateFilter): SessionTemplate[] => {
    switch (filter) {
      case 'favorites':
        return templates.filter(t => favoriteIds.includes(t.id));
      case 'recent':
        // Sort by creation date (most recent first)
        return [...templates].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 10);
      case 'shared':
        // Filter for shared templates (mock logic - replace with real implementation)
        return templates.filter(t => t.metadata?.shared === true);
      case 'all':
      default:
        return templates;
    }
  };
  
  const filteredTemplates = getFilteredTemplates(activeFilter);
  
  const filterCounts = {
    favorites: templates.filter(t => favoriteIds.includes(t.id)).length,
    recent: Math.min(templates.length, 10),
    shared: templates.filter(t => t.metadata?.shared === true).length,
    all: templates.length
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-green-500" />
            <CardTitle>{t('sessions.templatesHistory.title')}</CardTitle>
          </div>
          <div className="flex gap-1">
            <FilterButton
              active={activeFilter === 'favorites'}
              onClick={() => setActiveFilter('favorites')}
              icon={Star}
              label={t('sessions.templatesHistory.favorites')}
              count={filterCounts.favorites}
            />
            <FilterButton
              active={activeFilter === 'recent'}
              onClick={() => setActiveFilter('recent')}
              icon={Clock}
              label={t('sessions.templatesHistory.recent')}
              count={filterCounts.recent}
            />
            <FilterButton
              active={activeFilter === 'shared'}
              onClick={() => setActiveFilter('shared')}
              icon={Users}
              label={t('sessions.templatesHistory.team')}
              count={filterCounts.shared}
            />
            <FilterButton
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              icon={Grid}
              label={t('sessions.templatesHistory.all')}
              count={filterCounts.all}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Template Grid */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => onUseTemplate(template)}
                onEdit={() => onEditTemplate(template)}
                onDuplicate={() => onDuplicateTemplate(template)}
                onFavorite={() => onToggleFavorite(template.id)}
                isFavorite={favoriteIds.includes(template.id)}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t('sessions.templatesHistory.noTemplates')}
            </p>
          </div>
        )}
        
        {/* Load More */}
        {filteredTemplates.length > 0 && activeFilter === 'all' && (
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? t('common:loading') : t('sessions.templatesHistory.loadMore')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};