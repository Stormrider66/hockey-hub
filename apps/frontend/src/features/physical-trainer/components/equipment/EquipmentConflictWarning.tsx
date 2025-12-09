'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Calendar, 
  MapPin,
  Lightbulb,
  ChevronRight 
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { EquipmentConflict } from '../../types/equipment.types';
import { EQUIPMENT_CONFIGS, WorkoutEquipmentType } from '../../types/conditioning.types';

interface EquipmentConflictWarningProps {
  conflicts: EquipmentConflict[];
  onAcceptSuggestion?: (suggestion: {
    type: 'alternative_time' | 'alternative_equipment' | 'reduce_participants';
    timeSlot?: { start: Date; end: Date };
    alternativeEquipment?: string;
    maxParticipants?: number;
  }) => void;
  onViewDetails?: (conflict: EquipmentConflict) => void;
  onDismiss?: () => void;
  className?: string;
}

export default function EquipmentConflictWarning({
  conflicts,
  onAcceptSuggestion,
  onViewDetails,
  onDismiss,
  className
}: EquipmentConflictWarningProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const primaryConflict = conflicts[0];
  const hasMultipleConflicts = conflicts.length > 1;

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'insufficient_equipment':
        return <Users className="h-5 w-5" />;
      case 'overlapping_reservation':
        return <Clock className="h-5 w-5" />;
      case 'maintenance_window':
        return <AlertTriangle className="h-5 w-5" />;
      case 'facility_closed':
        return <MapPin className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getConflictTitle = (conflict: EquipmentConflict) => {
    switch (conflict.type) {
      case 'insufficient_equipment':
        return t('physicalTrainer:training.equipment.conflicts.insufficientEquipment.title');
      case 'overlapping_reservation':
        return t('physicalTrainer:training.equipment.conflicts.overlappingReservation.title');
      case 'maintenance_window':
        return t('physicalTrainer:training.equipment.conflicts.maintenanceWindow.title');
      case 'facility_closed':
        return t('physicalTrainer:training.equipment.conflicts.facilityClosed.title');
      default:
        return t('physicalTrainer:training.equipment.conflicts.generic.title');
    }
  };

  const getConflictDescription = (conflict: EquipmentConflict) => {
    const equipmentConfig = EQUIPMENT_CONFIGS[conflict.equipmentType as WorkoutEquipmentType];
    const equipmentName = equipmentConfig?.label || conflict.equipmentType;

    switch (conflict.type) {
      case 'insufficient_equipment':
        return t('physicalTrainer:training.equipment.conflicts.insufficientEquipment.description', {
          equipment: equipmentName,
          requested: conflict.requested,
          available: conflict.available,
          time: format(conflict.timeSlot.start, 'HH:mm')
        });
      case 'overlapping_reservation':
        return t('physicalTrainer:training.equipment.conflicts.overlappingReservation.description', {
          equipment: equipmentName,
          count: conflict.conflictingReservations?.length || 0
        });
      case 'maintenance_window':
        return t('physicalTrainer:training.equipment.conflicts.maintenanceWindow.description', {
          equipment: equipmentName,
          time: `${format(conflict.timeSlot.start, 'HH:mm')} - ${format(conflict.timeSlot.end, 'HH:mm')}`
        });
      case 'facility_closed':
        return t('physicalTrainer:training.equipment.conflicts.facilityClosed.description', {
          time: `${format(conflict.timeSlot.start, 'HH:mm')} - ${format(conflict.timeSlot.end, 'HH:mm')}`
        });
      default:
        return t('physicalTrainer:training.equipment.conflicts.generic.description');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'alternative_time':
        return <Clock className="h-4 w-4" />;
      case 'alternative_equipment':
        return <Users className="h-4 w-4" />;
      case 'reduce_participants':
        return <Users className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionText = (suggestion: any) => {
    switch (suggestion.type) {
      case 'alternative_time':
        return t('physicalTrainer:training.equipment.suggestions.alternativeTime', {
          time: `${format(suggestion.timeSlot.start, 'HH:mm')} - ${format(suggestion.timeSlot.end, 'HH:mm')}`
        });
      case 'alternative_equipment':
        const equipmentConfig = EQUIPMENT_CONFIGS[suggestion.alternativeEquipment as WorkoutEquipmentType];
        return t('physicalTrainer:training.equipment.suggestions.alternativeEquipment', {
          equipment: equipmentConfig?.label || suggestion.alternativeEquipment
        });
      case 'reduce_participants':
        return t('physicalTrainer:training.equipment.suggestions.reduceParticipants', {
          maxParticipants: suggestion.maxParticipants
        });
      default:
        return suggestion.description;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Alert */}
      <Alert variant="destructive">
        <div className="flex items-start gap-3">
          {getConflictIcon(primaryConflict.type)}
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              {getConflictTitle(primaryConflict)}
              {hasMultipleConflicts && (
                <Badge variant="destructive" className="text-xs">
                  +{conflicts.length - 1} {t('physicalTrainer:training.equipment.moreConflicts')}
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {getConflictDescription(primaryConflict)}
            </AlertDescription>

            {/* Time and equipment details */}
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(primaryConflict.timeSlot.start, 'MMM d, HH:mm')} - 
                  {format(primaryConflict.timeSlot.end, 'HH:mm')}
                </span>
              </div>
              {primaryConflict.equipmentType && (
                <div className="flex items-center gap-1">
                  <span>
                    {EQUIPMENT_CONFIGS[primaryConflict.equipmentType as WorkoutEquipmentType]?.icon}
                  </span>
                  <span>
                    {EQUIPMENT_CONFIGS[primaryConflict.equipmentType as WorkoutEquipmentType]?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(primaryConflict)}
                >
                  {t('physicalTrainer:training.equipment.viewDetails')}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  {t('common:dismiss')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Alert>

      {/* Suggestions */}
      {primaryConflict.suggestions && primaryConflict.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              {t('physicalTrainer:training.equipment.suggestions.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {primaryConflict.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getSuggestionIcon(suggestion.type)}
                  <div>
                    <div className="text-sm font-medium text-blue-900">
                      {getSuggestionText(suggestion)}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {suggestion.reason}
                    </div>
                  </div>
                </div>
                {onAcceptSuggestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-3"
                    onClick={() => onAcceptSuggestion({
                      type: suggestion.type,
                      timeSlot: suggestion.timeSlot,
                      alternativeEquipment: suggestion.alternativeEquipment,
                      maxParticipants: suggestion.maxParticipants
                    })}
                  >
                    {t('physicalTrainer:training.equipment.suggestions.apply')}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Additional conflicts summary */}
      {hasMultipleConflicts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t('physicalTrainer:training.equipment.additionalConflicts')} ({conflicts.length - 1})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.slice(1, 4).map((conflict, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getConflictIcon(conflict.type)}
                  <span>{getConflictTitle(conflict)}</span>
                  <span className="text-xs">
                    ({format(conflict.timeSlot.start, 'HH:mm')})
                  </span>
                </div>
              ))}
              {conflicts.length > 4 && (
                <div className="text-xs text-muted-foreground">
                  {t('physicalTrainer:training.equipment.andMoreConflicts', { count: conflicts.length - 4 })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}