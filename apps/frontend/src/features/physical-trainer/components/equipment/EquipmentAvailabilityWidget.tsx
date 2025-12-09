'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Wrench, XCircle } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useGetRealTimeAvailabilityQuery } from '@/store/api/equipmentApi';
import type { EquipmentAvailability } from '@/features/physical-trainer/types/equipment.types';
import { EQUIPMENT_CONFIGS, WorkoutEquipmentType } from '@/features/physical-trainer/types/conditioning.types';

interface EquipmentAvailabilityWidgetProps {
  facilityId: string;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
  filterTypes?: WorkoutEquipmentType[];
}

const getStatusColor = (available: number, total: number) => {
  const ratio = available / total;
  if (ratio >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
  if (ratio >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getStatusIcon = (available: number, total: number) => {
  const ratio = available / total;
  if (ratio >= 0.7) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (ratio >= 0.4) return <Clock className="h-4 w-4 text-yellow-600" />;
  return <AlertCircle className="h-4 w-4 text-red-600" />;
};

export default function EquipmentAvailabilityWidget({
  facilityId,
  className,
  compact = false,
  showDetails = true,
  filterTypes
}: EquipmentAvailabilityWidgetProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  
  const { 
    data: availabilityData, 
    isLoading, 
    error,
    isError,
    refetch
  } = useGetRealTimeAvailabilityQuery(facilityId, {
    skip: !facilityId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  
  // Force refetch when facilityId changes
  React.useEffect(() => {
    if (facilityId) {
      refetch();
    }
  }, [facilityId, refetch]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('physicalTrainer:training.equipment.availability.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !availabilityData?.success || !availabilityData?.data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            {t('physicalTrainer:training.equipment.availability.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('physicalTrainer:training.equipment.availability.error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const availability = availabilityData.data || {};
  
  // Filter equipment types if specified
  const equipmentTypes = filterTypes 
    ? Object.entries(availability).filter(([type]) => 
        filterTypes.includes(type as WorkoutEquipmentType)
      )
    : Object.entries(availability);

  // Sort by availability ratio (worst first)
  const sortedEquipment = equipmentTypes.sort(([, a], [, b]) => {
    const ratioA = a.availableCount / a.totalCount;
    const ratioB = b.availableCount / b.totalCount;
    return ratioA - ratioB;
  });

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {sortedEquipment.map(([type, data]) => {
          const config = EQUIPMENT_CONFIGS[type as WorkoutEquipmentType];
          if (!config) return null;
          
          const availabilityRatio = (data.availableCount / data.totalCount) * 100;
          
          return (
            <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm">{config.icon}</span>
                <span className="text-xs font-medium">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getStatusColor(data.availableCount, data.totalCount))}
                >
                  {data.availableCount}/{data.totalCount}
                </Badge>
                {getStatusIcon(data.availableCount, data.totalCount)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          {t('physicalTrainer:training.equipment.availability.title')}
          <Badge variant="outline" className="text-xs">
            {t('common:realTime')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEquipment.map(([type, data]) => {
          const config = EQUIPMENT_CONFIGS[type as WorkoutEquipmentType];
          if (!config) return null;
          
          const availabilityRatio = (data.availableCount / data.totalCount) * 100;
          const utilizationRatio = ((data.inUseCount + data.reservedCount) / data.totalCount) * 100;
          
          return (
            <div key={type} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.totalCount} {t('physicalTrainer:training.equipment.units')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(data.availableCount, data.totalCount))}
                  >
                    {data.availableCount} {t('physicalTrainer:training.equipment.available')}
                  </Badge>
                  {getStatusIcon(data.availableCount, data.totalCount)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={availabilityRatio} 
                  className="h-2"
                  // Use green for available, red for unavailable
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(availabilityRatio)}% {t('physicalTrainer:training.equipment.available')}</span>
                  <span>{Math.round(utilizationRatio)}% {t('physicalTrainer:training.equipment.inUse')}</span>
                </div>
              </div>

              {/* Detailed Status */}
              {showDetails && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.inUseCount > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="h-3 w-3" />
                      <span>{data.inUseCount} {t('physicalTrainer:training.equipment.inUse')}</span>
                    </div>
                  )}
                  {data.reservedCount > 0 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>{data.reservedCount} {t('physicalTrainer:training.equipment.reserved')}</span>
                    </div>
                  )}
                  {data.maintenanceCount > 0 && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Wrench className="h-3 w-3" />
                      <span>{data.maintenanceCount} {t('physicalTrainer:training.equipment.maintenance')}</span>
                    </div>
                  )}
                  {data.outOfOrderCount > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3 w-3" />
                      <span>{data.outOfOrderCount} {t('physicalTrainer:training.equipment.outOfOrder')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Next Available */}
              {data.availableCount === 0 && data.upcomingReservations.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <div className="font-medium mb-1">
                    {t('physicalTrainer:training.equipment.nextAvailable')}:
                  </div>
                  <div>
                    {new Date(data.upcomingReservations[0].startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} ({data.upcomingReservations[0].count} {t('physicalTrainer:training.equipment.units')})
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedEquipment.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            {t('physicalTrainer:training.equipment.noEquipment')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}