'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Zap, 
  Activity,
  Target,
  Info,
  Calculator
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { 
  TargetMetric,
  PlayerTestResult,
  GarminHeartRateZone,
  PowerZone,
  LactateThresholdZone
} from '../../types/conditioning.types';
import { 
  GARMIN_HR_ZONES, 
  POWER_ZONES, 
  LACTATE_ZONES,
  getPlayerMaxHR,
  getPlayerFTP,
  calculateZoneHRRange,
  calculateZonePowerRange
} from '../../types/conditioning.types';

interface ZoneSelectorProps {
  value?: TargetMetric;
  onChange: (target: TargetMetric) => void;
  player?: any;
  playerTests?: PlayerTestResult[];
  metricType: 'heartRate' | 'watts' | 'lactate';
  equipment?: string;
}

export default function ZoneSelector({
  value,
  onChange,
  player,
  playerTests = [],
  metricType,
  equipment
}: ZoneSelectorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedZoneSystem, setSelectedZoneSystem] = useState<'garmin_hr' | 'power' | 'lactate'>(
    metricType === 'heartRate' ? 'garmin_hr' : 
    metricType === 'watts' ? 'power' : 'lactate'
  );

  // Calculate player-specific values
  const playerMaxHR = useMemo(() => {
    return player ? getPlayerMaxHR(player, playerTests) : 190;
  }, [player, playerTests]);

  const playerFTP = useMemo(() => {
    return player ? getPlayerFTP(player, playerTests) : null;
  }, [player, playerTests]);

  // Get zones based on selected system
  const zones = useMemo(() => {
    switch (selectedZoneSystem) {
      case 'garmin_hr':
        return GARMIN_HR_ZONES.map(zone => ({
          ...zone,
          calculatedRange: calculateZoneHRRange(zone.zone, playerMaxHR, 'garmin_hr')
        }));
      case 'power':
        if (!playerFTP) return [];
        return POWER_ZONES.map(zone => ({
          ...zone,
          calculatedRange: calculateZonePowerRange(zone.zone, playerFTP)
        }));
      case 'lactate':
        return LACTATE_ZONES.map((zone, index) => ({
          ...zone,
          zone: index + 1,
          calculatedRange: calculateZoneHRRange(index + 1, playerMaxHR, 'garmin_hr')
        }));
      default:
        return [];
    }
  }, [selectedZoneSystem, playerMaxHR, playerFTP]);

  const handleZoneSelect = (zoneNumber: number) => {
    const selectedZone = zones.find(z => z.zone === zoneNumber);
    if (selectedZone) {
      const target: TargetMetric = {
        type: 'zone',
        value: zoneNumber,
        zoneSystem: selectedZoneSystem,
        unit: selectedZoneSystem === 'power' ? 'W' : 'bpm'
      };
      onChange(target);
    }
  };

  const getZoneIcon = (zoneSystem: string) => {
    switch (zoneSystem) {
      case 'garmin_hr':
      case 'lactate':
        return Heart;
      case 'power':
        return Zap;
      default:
        return Target;
    }
  };

  const getZoneUnit = (zoneSystem: string) => {
    switch (zoneSystem) {
      case 'garmin_hr':
      case 'lactate':
        return 'BPM';
      case 'power':
        return 'Watts';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Training Zone Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone System Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Zone System</label>
          <Tabs value={selectedZoneSystem} onValueChange={(v) => setSelectedZoneSystem(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="garmin_hr" disabled={metricType !== 'heartRate'}>
                <Heart className="h-4 w-4 mr-2" />
                Garmin HR
              </TabsTrigger>
              <TabsTrigger value="power" disabled={metricType !== 'watts' || !playerFTP}>
                <Zap className="h-4 w-4 mr-2" />
                Power
              </TabsTrigger>
              <TabsTrigger value="lactate" disabled={metricType !== 'heartRate'}>
                <Activity className="h-4 w-4 mr-2" />
                Lactate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="garmin_hr" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Based on Max HR: {playerMaxHR} BPM</span>
                  <Badge variant="outline">Garmin 5-Zone System</Badge>
                </div>
                
                <div className="grid gap-2">
                  {GARMIN_HR_ZONES.map((zone) => {
                    const range = calculateZoneHRRange(zone.zone, playerMaxHR, 'garmin_hr');
                    const isSelected = value?.type === 'zone' && value.value === zone.zone;
                    
                    return (
                      <Button
                        key={zone.zone}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-auto p-3 justify-start text-left",
                          isSelected && "ring-2 ring-offset-2"
                        )}
                        style={{
                          borderLeftColor: zone.color,
                          borderLeftWidth: '4px'
                        }}
                        onClick={() => handleZoneSelect(zone.zone)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                className="w-6 h-6 p-0 rounded-full text-xs"
                                style={{ backgroundColor: zone.color, color: 'white' }}
                              >
                                {zone.zone}
                              </Badge>
                              <span className="font-medium">{zone.name}</span>
                            </div>
                            <span className="text-sm font-mono">
                              {range.min}-{range.max} BPM
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {zone.purpose} • {zone.percentage.min}-{zone.percentage.max}% Max HR
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="power" className="mt-4">
              {!playerFTP ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No FTP test data available for this player</p>
                  <p className="text-xs">Functional Threshold Power test required</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Based on FTP: {playerFTP}W</span>
                    <Badge variant="outline">7-Zone Power System</Badge>
                  </div>
                  
                  <div className="grid gap-2">
                    {POWER_ZONES.map((zone) => {
                      const range = calculateZonePowerRange(zone.zone, playerFTP);
                      const isSelected = value?.type === 'zone' && value.value === zone.zone;
                      
                      return (
                        <Button
                          key={zone.zone}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "h-auto p-3 justify-start text-left",
                            isSelected && "ring-2 ring-offset-2"
                          )}
                          style={{
                            borderLeftColor: zone.color,
                            borderLeftWidth: '4px'
                          }}
                          onClick={() => handleZoneSelect(zone.zone)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className="w-6 h-6 p-0 rounded-full text-xs"
                                  style={{ backgroundColor: zone.color, color: 'white' }}
                                >
                                  {zone.zone}
                                </Badge>
                                <span className="font-medium">{zone.name}</span>
                              </div>
                              <span className="text-sm font-mono">
                                {range.min}-{range.max}W
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {zone.purpose} • {zone.percentage.min}-{zone.percentage.max}% FTP
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lactate" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Based on Max HR: {playerMaxHR} BPM</span>
                  <Badge variant="outline">Lactate Threshold System</Badge>
                </div>
                
                <div className="grid gap-2">
                  {LACTATE_ZONES.map((zone, index) => {
                    const range = calculateZoneHRRange(index + 1, playerMaxHR, 'garmin_hr');
                    const isSelected = value?.type === 'zone' && value.value === (index + 1);
                    
                    return (
                      <Button
                        key={zone.name}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-auto p-3 justify-start text-left",
                          isSelected && "ring-2 ring-offset-2"
                        )}
                        style={{
                          borderLeftColor: zone.color,
                          borderLeftWidth: '4px'
                        }}
                        onClick={() => handleZoneSelect(index + 1)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                className="w-6 h-6 p-0 rounded-full text-xs"
                                style={{ backgroundColor: zone.color, color: 'white' }}
                              >
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{zone.name}</span>
                            </div>
                            <span className="text-sm font-mono">
                              {range.min}-{range.max} BPM
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {zone.description} • {zone.lactateLevel.min}-{zone.lactateLevel.max} mmol/L
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Current Selection Summary */}
        {value && value.type === 'zone' && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Selected Zone</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Zone {value.value} will be automatically calculated based on each player's individual test data or estimated values.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}