'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, 
  List, 
  Filter,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  Clock,
  Users
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { SessionCard } from './SessionCard';
import type { BundleSession } from '../bulk-sessions.types';

interface SessionGridViewProps {
  sessions: BundleSession[];
  onSessionClick?: (sessionId: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'active' | 'paused' | 'preparing' | 'completed';
type SortType = 'name' | 'progress' | 'participants' | 'elapsed';

export const SessionGridView: React.FC<SessionGridViewProps> = ({ 
  sessions, 
  onSessionClick, 
  className 
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // Apply filter
    if (filter !== 'all') {
      filtered = sessions.filter(session => session.status === filter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'participants':
          return b.participants.length - a.participants.length;
        case 'elapsed':
          return b.elapsedTime - a.elapsedTime;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessions, filter, sortBy]);

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return sessions.length;
    return sessions.filter(s => s.status === filterType).length;
  };

  const getFilterIcon = (filterType: FilterType) => {
    switch (filterType) {
      case 'active':
        return <PlayCircle className="h-3 w-3" />;
      case 'paused':
        return <PauseCircle className="h-3 w-3" />;
      case 'preparing':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Grid classes based on session count for optimal layout
  const getGridClasses = () => {
    const count = filteredAndSortedSessions.length;
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Badges */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'paused', 'preparing'] as FilterType[]).map((filterType) => {
              const count = getFilterCount(filterType);
              if (count === 0 && filterType !== 'all') return null;
              
              return (
                <Badge
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'secondary'}
                  className={cn(
                    "cursor-pointer hover:bg-opacity-80 transition-colors",
                    filter === filterType && "shadow-sm"
                  )}
                  onClick={() => setFilter(filterType)}
                >
                  {getFilterIcon(filterType)}
                  <span className={cn(getFilterIcon(filterType) && "ml-1")}>
                    {t(`bundle.filters.${filterType}`)} ({count})
                  </span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t(`bundle.sort.${sortBy}`)}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              {t('bundle.sort.name')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('progress')}>
              {t('bundle.sort.progress')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('participants')}>
              {t('bundle.sort.participants')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy('elapsed')}>
              {t('bundle.sort.elapsed')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sessions Display */}
      {filteredAndSortedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('bundle.noSessions.title')}
          </h3>
          <p className="text-gray-500 max-w-md">
            {filter === 'all' 
              ? t('bundle.noSessions.description')
              : t('bundle.noSessions.filtered', { filter: t(`bundle.filters.${filter}`) })
            }
          </p>
          {filter !== 'all' && (
            <Button 
              variant="outline" 
              onClick={() => setFilter('all')}
              className="mt-4"
            >
              {t('bundle.noSessions.showAll')}
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? `grid gap-4 ${getGridClasses()}`
            : 'space-y-3'
        )}>
          {filteredAndSortedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={onSessionClick}
              className={viewMode === 'list' ? 'hover:bg-gray-50' : ''}
            />
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {filteredAndSortedSessions.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
          <div>
            {t('bundle.summary.showing', { 
              count: filteredAndSortedSessions.length,
              total: sessions.length 
            })}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4 text-green-600" />
              <span>{sessions.filter(s => s.status === 'active').length} active</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{sessions.reduce((sum, s) => sum + s.participants.length, 0)} participants</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};