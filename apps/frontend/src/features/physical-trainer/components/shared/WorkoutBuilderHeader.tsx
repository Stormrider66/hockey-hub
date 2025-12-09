import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, X, Clock, Copy, Users } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BulkSessionConfig } from '../../hooks/useBulkSession';

export type WorkoutType = 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'flexibility' | 'wrestling' | 'cardio' | 'skill' | 'recovery' | 'mixed';

interface WorkoutBuilderHeaderProps {
  title: string;
  workoutType: WorkoutType;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  showAutoSave?: boolean;
  lastSaved?: Date;
  progress?: number;
  className?: string;
  
  // Bulk mode support
  supportsBulkMode?: boolean;
  bulkMode?: boolean;
  onBulkToggle?: (enabled: boolean) => void;
  bulkConfig?: BulkSessionConfig;
  onBulkConfigChange?: (config: BulkSessionConfig) => void;
}

const workoutTypeConfig: Record<WorkoutType, { color: string; badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  strength: { color: 'bg-red-500 text-white' },
  conditioning: { color: 'bg-blue-500 text-white' },
  hybrid: { color: 'bg-purple-500 text-white' },
  agility: { color: 'bg-orange-500 text-white' },
  flexibility: { color: 'bg-emerald-500 text-white' },
  wrestling: { color: 'bg-amber-600 text-white' },
  cardio: { color: 'bg-cyan-500 text-white' },
  skill: { color: 'bg-green-500 text-white' },
  recovery: { color: 'bg-indigo-500 text-white' },
  mixed: { color: 'bg-gray-500 text-white' }
};

const formatLastSaved = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleDateString();
};

export const WorkoutBuilderHeader: React.FC<WorkoutBuilderHeaderProps> = ({
  title,
  workoutType,
  onSave,
  onCancel,
  isSaving = false,
  showAutoSave = false,
  lastSaved,
  progress,
  className,
  supportsBulkMode = false,
  bulkMode = false,
  onBulkToggle,
  bulkConfig,
  onBulkConfigChange
}) => {
  const typeConfig = workoutTypeConfig[workoutType] || workoutTypeConfig.mixed;

  return (
    <div className={cn('flex items-center justify-between p-4 border-b bg-background', className)}>
      {/* Left section - Title and type badge */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge 
          className={cn('text-sm px-3 py-1 capitalize', typeConfig.color)}
          variant={typeConfig.badgeVariant}
        >
          {workoutType}
        </Badge>
        
        {/* Optional progress indicator */}
        {progress !== undefined && progress >= 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {/* Center section - Bulk mode toggle (if supported) */}
      {supportsBulkMode && (
        <div className="flex items-center gap-3 px-4">
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="bulk-mode-toggle" className="text-sm font-medium cursor-pointer">
              Bulk Mode
            </Label>
            <Switch
              id="bulk-mode-toggle"
              checked={bulkMode}
              onCheckedChange={onBulkToggle}
              disabled={isSaving}
            />
            {bulkMode && bulkConfig && (
              <Badge variant="outline" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {bulkConfig.numberOfSessions} sessions
              </Badge>
            )}
          </div>
          <Separator orientation="vertical" className="h-6" />
        </div>
      )}

      {/* Right section - Save status and action buttons */}
      <div className="flex items-center gap-4">
        {/* Auto-save indicator */}
        {showAutoSave && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="h-3 w-3" />
                <span>Saved {formatLastSaved(lastSaved)}</span>
              </>
            ) : null}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : bulkMode ? `Save ${bulkConfig?.numberOfSessions || 1} Sessions` : 'Save Workout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export type for use in other components
export type { WorkoutBuilderHeaderProps };