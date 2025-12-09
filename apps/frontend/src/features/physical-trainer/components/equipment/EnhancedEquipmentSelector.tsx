'use client';

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Info, Users, Clock } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../../types/conditioning.types';
import { useGetRealTimeAvailabilityQuery } from '@/store/api/equipmentApi';
import type { EquipmentAvailability } from '../../types/equipment.types';

interface EnhancedEquipmentSelectorProps {
  selected: WorkoutEquipmentType;
  onChange: (equipment: WorkoutEquipmentType) => void;
  facilityId: string;
  participantCount: number;
  startTime?: Date;
  endTime?: Date;
  className?: string;
  showAvailability?: boolean;
  showEquipmentNeeded?: boolean;
  onViewDetails?: (equipmentType: WorkoutEquipmentType) => void;
}

export default function EnhancedEquipmentSelector({
  selected,
  onChange,
  facilityId,
  participantCount,
  startTime,
  endTime,
  className,
  showAvailability = true,
  showEquipmentNeeded = true,
  onViewDetails
}: EnhancedEquipmentSelectorProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const { 
    data: availabilityData, 
    isLoading,
    refetch 
  } = useGetRealTimeAvailabilityQuery(facilityId, {
    skip: !showAvailability || !facilityId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  
  // Force refetch when facilityId changes
  React.useEffect(() => {
    if (facilityId && showAvailability) {
      refetch();
    }
  }, [facilityId, refetch, showAvailability]);

  const equipmentAvailability = useMemo(() => {
    // RTK Query returns the data directly
    if (!availabilityData) return {};
    
    // Check if it's wrapped in success/data or direct data
    if (availabilityData.success && availabilityData.data) {
      return availabilityData.data;
    }
    
    // Otherwise assume it's the direct data
    return availabilityData;
  }, [availabilityData]);

  const getEquipmentStatus = (equipmentType: WorkoutEquipmentType) => {
    const availability = equipmentAvailability[equipmentType];
    if (!availability) return { status: 'unknown', available: 0, total: 0 };

    const available = availability?.availableCount || 0;
    const total = availability?.totalCount || 0;
    const needed = participantCount;

    if (total === 0) {
      return { status: 'unavailable', available: 0, total: 0, needed };
    }

    if (available >= needed) {
      return { status: 'available', available, total, needed };
    } else if (available > 0) {
      return { status: 'limited', available, total, needed };
    } else {
      return { status: 'fully_booked', available, total, needed };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'limited':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'fully_booked':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'unavailable':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return null;
      case 'limited':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'fully_booked':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'unavailable':
        return <AlertTriangle className="h-3 w-3 text-gray-600" />;
      default:
        return <Clock className="h-3 w-3 text-blue-600" />;
    }
  };

  const getStatusText = (status: string, available: number, needed: number) => {
    switch (status) {
      case 'available':
        return t('physicalTrainer:training.equipment.status.available');
      case 'limited':
        return t('physicalTrainer:training.equipment.status.limited', { available, needed });
      case 'fully_booked':
        return t('physicalTrainer:training.equipment.status.fullyBooked');
      case 'unavailable':
        return t('physicalTrainer:training.equipment.status.unavailable');
      default:
        return t('physicalTrainer:training.equipment.status.checking');
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-medium">
          {t('physicalTrainer:conditioning.equipment.title')}
        </Label>
        {showEquipmentNeeded && participantCount > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {t('physicalTrainer:training.equipment.equipmentNeeded', { count: participantCount })}
            </span>
          </div>
        )}
      </div>

      <RadioGroup
        value={selected}
        onValueChange={(value) => onChange(value as WorkoutEquipmentType)}
        className="grid grid-cols-2 gap-3"
      >
        {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => {
          const equipmentType = key as WorkoutEquipmentType;
          const { status, available, total, needed } = getEquipmentStatus(equipmentType);
          const isDisabled = status === 'unavailable' || 
            (status === 'fully_booked' && showAvailability);

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <RadioGroupItem
                      value={key}
                      id={key}
                      className="peer sr-only"
                      disabled={isDisabled}
                    />
                    <Label
                      htmlFor={key}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 cursor-pointer transition-all",
                        "hover:bg-accent hover:text-accent-foreground",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        isDisabled && "opacity-50 cursor-not-allowed hover:bg-popover"
                      )}
                    >
                      <span className="text-2xl mb-1">{config.icon}</span>
                      <span className="text-sm font-medium text-center">{config.label}</span>
                      
                      {/* Primary metric badge */}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {config.metrics.primary}
                        </Badge>
                      </div>

                      {/* Availability information */}
                      {showAvailability && !isLoading && (
                        <div className="mt-2 w-full">
                          <div className={cn(
                            "flex items-center justify-center gap-1 px-2 py-1 rounded border text-xs",
                            getStatusColor(status)
                          )}>
                            {getStatusIcon(status)}
                            <span className="font-medium">
                              {status === 'unknown' || isLoading ? (
                                t('physicalTrainer:training.equipment.status.checking')
                              ) : (
                                `${available}/${total}`
                              )}
                            </span>
                          </div>
                          
                          {/* Warning for insufficient equipment */}
                          {status === 'limited' && (
                            <div className="text-xs text-yellow-700 mt-1 text-center">
                              {t('physicalTrainer:training.equipment.warnings.limited')}
                            </div>
                          )}
                          
                          {/* Error for fully booked */}
                          {status === 'fully_booked' && (
                            <div className="text-xs text-red-700 mt-1 text-center">
                              {t('physicalTrainer:training.equipment.warnings.fullyBooked')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Loading state */}
                      {showAvailability && isLoading && (
                        <div className="mt-2 w-full">
                          <div className="animate-pulse h-5 bg-gray-200 rounded"></div>
                        </div>
                      )}
                    </Label>

                    {/* Details button */}
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onViewDetails(equipmentType);
                        }}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TooltipTrigger>
                
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-sm">{config.description}</div>
                    
                    {showAvailability && !isLoading && status !== 'unknown' && (
                      <div className="border-t pt-2">
                        <div className="font-medium text-sm mb-1">
                          {t('physicalTrainer:training.equipment.availability.current')}:
                        </div>
                        <div className="text-sm">
                          {getStatusText(status, available, needed || participantCount)}
                        </div>
                        
                        {status === 'limited' && (
                          <div className="text-xs text-yellow-700 mt-1">
                            {t('physicalTrainer:training.equipment.availability.suggestions.shareEquipment')}
                          </div>
                        )}
                        
                        {status === 'fully_booked' && (
                          <div className="text-xs text-red-700 mt-1">
                            {t('physicalTrainer:training.equipment.availability.suggestions.chooseAlternative')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="border-t pt-2">
                      <div className="text-xs text-muted-foreground">
                        {t('physicalTrainer:training.equipment.metrics.primary')}: {config.metrics.primary}
                      </div>
                      {config.metrics.secondary && (
                        <div className="text-xs text-muted-foreground">
                          {t('physicalTrainer:training.equipment.metrics.secondary')}: {config.metrics.secondary.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </RadioGroup>

      {/* Summary warning if equipment is insufficient */}
      {showAvailability && selected && (
        (() => {
          const { status, available, needed } = getEquipmentStatus(selected);
          if (status === 'limited' || status === 'fully_booked') {
            return (
              <div className={cn(
                "mt-3 p-3 rounded-lg border",
                status === 'limited' ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4 mt-0.5 flex-shrink-0",
                    status === 'limited' ? "text-yellow-600" : "text-red-600"
                  )} />
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium text-sm",
                      status === 'limited' ? "text-yellow-800" : "text-red-800"
                    )}>
                      {status === 'limited' 
                        ? t('physicalTrainer:training.equipment.warnings.insufficientEquipment')
                        : t('physicalTrainer:training.equipment.warnings.noEquipmentAvailable')
                      }
                    </div>
                    <div className={cn(
                      "text-sm mt-1",
                      status === 'limited' ? "text-yellow-700" : "text-red-700"
                    )}>
                      {status === 'limited' 
                        ? t('physicalTrainer:training.equipment.warnings.availableCount', { available, needed })
                        : t('physicalTrainer:training.equipment.warnings.chooseAlternative')
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}
    </div>
  );
}