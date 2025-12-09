'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  Heart, 
  Zap, 
  Activity, 
  Gauge, 
  Target,
  Thermometer,
  Waves,
  Timer,
  Save,
  X,
  Info,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import SetConfigurationForm from './SetConfigurationForm';
import type { 
  IntervalSet, 
  IntervalType,
  PlayerTestResult,
  TargetMetric,
  TargetMetricType,
  TargetReference,
  IntervalSetConfig
} from '../../types';
import { 
  WorkoutEquipmentType, 
  EQUIPMENT_CONFIGS,
  ConditioningMode,
  getModeConfig,
  GARMIN_HR_ZONES,
  POWER_ZONES,
  LACTATE_ZONES,
  calculateZoneHRRange,
  calculateZonePowerRange,
  getPlayerMaxHR,
  getPlayerFTP,
  getPlayerLactateThreshold
} from '../../types/conditioning.types';

interface EnhancedIntervalFormProps {
  interval: IntervalSet;
  equipment?: WorkoutEquipmentType; // Made optional since we use interval's equipment
  mode?: ConditioningMode;
  onSave: (interval: IntervalSet) => void;
  onCancel: () => void;
  playerTests?: PlayerTestResult[];
  selectedPlayers?: string[];
}

const INTERVAL_TYPES: { value: IntervalType; label: string; color: string; description: string }[] = [
  { value: 'warmup', label: 'Warm Up', color: '#10b981', description: 'Light preparation activity' },
  { value: 'work', label: 'Work', color: '#ef4444', description: 'Main training stimulus' },
  { value: 'rest', label: 'Rest', color: '#3b82f6', description: 'Complete recovery period' },
  { value: 'active_recovery', label: 'Active Recovery', color: '#f59e0b', description: 'Light movement recovery' },
  { value: 'cooldown', label: 'Cool Down', color: '#6366f1', description: 'Gradual recovery phase' },
];

export default function EnhancedIntervalForm({
  interval,
  equipment,
  mode = 'conditioning',
  onSave,
  onCancel,
  playerTests = [],
  selectedPlayers = []
}: EnhancedIntervalFormProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Get mode configuration for context-aware suggestions
  const modeConfig = getModeConfig(mode);
  
  // Form state - use interval's equipment, not the prop
  const [formData, setFormData] = useState<IntervalSet>({
    ...interval,
    targetMetrics: interval.targetMetrics || {}
  });
  
  // Use formData.equipment instead of prop equipment for config
  const equipmentConfig = EQUIPMENT_CONFIGS[formData.equipment];
  
  const [activeMetricTab, setActiveMetricTab] = useState<'heartRate' | 'power' | 'pace' | 'other'>('heartRate');
  const [primaryTarget, setPrimaryTarget] = useState<'time' | 'distance' | 'calories'>(
    (formData as any).primaryMetric || 'time'
  );
  
  // Get available player data for calculations
  const playerStats = useMemo(() => {
    if (!selectedPlayers.length || !playerTests.length) return null;
    
    // For now, use first player's data for calculations
    const playerId = selectedPlayers[0];
    const playerTestData = playerTests.filter(test => test.playerId === playerId);
    
    return {
      maxHR: getPlayerMaxHR({ id: playerId }, playerTestData),
      ftp: getPlayerFTP({ id: playerId }, playerTestData),
      lt1: getPlayerLactateThreshold({ id: playerId }, playerTestData, 'lt1'),
      lt2: getPlayerLactateThreshold({ id: playerId }, playerTestData, 'lt2'),
      vo2max: playerTestData.find(t => t.testType === 'vo2max')?.value
    };
  }, [selectedPlayers, playerTests]);

  // Parse duration to minutes and seconds
  const durationMinutes = Math.floor(formData.duration / 60);
  const durationSeconds = formData.duration % 60;

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If equipment changes, reset incompatible metrics
    if (field === 'equipment') {
      const newEquipmentConfig = EQUIPMENT_CONFIGS[value];
      const currentMetrics = formData.targetMetrics;
      const updatedMetrics = { ...currentMetrics };
      
      // Remove metrics not supported by new equipment
      Object.keys(updatedMetrics).forEach(metric => {
        if (!newEquipmentConfig.metrics.supported.includes(metric)) {
          delete updatedMetrics[metric];
        }
      });
      
      setFormData(prev => ({
        ...prev,
        equipment: value,
        targetMetrics: updatedMetrics
      }));
      
      // Update active tab if current metric is not supported
      if (!newEquipmentConfig.metrics.supported.includes(activeMetricTab) && 
          activeMetricTab !== 'heartRate' && activeMetricTab !== 'other') {
        setActiveMetricTab('heartRate');
      }
    }
  };

  const updateTargetMetric = (metric: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      targetMetrics: {
        ...prev.targetMetrics,
        [metric]: value
      }
    }));
  };

  const removeTargetMetric = (metric: string) => {
    setFormData(prev => {
      const newTargetMetrics = { ...prev.targetMetrics };
      delete newTargetMetrics[metric];
      return {
        ...prev,
        targetMetrics: newTargetMetrics
      };
    });
  };

  const handleDurationChange = (minutes: number, seconds: number) => {
    const totalSeconds = (minutes * 60) + seconds;
    updateFormData('duration', totalSeconds);
  };

  // Heart Rate Zone Builder
  const HeartRateZoneBuilder = () => {
    const currentHR = formData.targetMetrics.heartRate;
    const [hrType, setHrType] = useState<'absolute' | 'percentage' | 'zone'>('zone');
    const [hrValue, setHrValue] = useState<number>(3);
    const [hrReference, setHrReference] = useState<TargetReference>('max_hr');

    useEffect(() => {
      if (currentHR) {
        if (currentHR.type === 'zone' && currentHR.zoneSystem === 'garmin_hr') {
          setHrType('zone');
          setHrValue(typeof currentHR.value === 'number' ? currentHR.value : 3);
        } else if (currentHR.type === 'percentage') {
          setHrType('percentage');
          setHrValue(typeof currentHR.value === 'number' ? currentHR.value : 70);
          setHrReference(currentHR.reference || 'max_hr');
        } else {
          setHrType('absolute');
          setHrValue(typeof currentHR.value === 'number' ? currentHR.value : 150);
        }
      }
    }, [currentHR]);

    const handleHRUpdate = () => {
      let targetMetric: TargetMetric;
      
      if (hrType === 'zone') {
        targetMetric = {
          type: 'zone',
          value: hrValue,
          zoneSystem: 'garmin_hr',
          unit: 'zone'
        };
      } else if (hrType === 'percentage') {
        targetMetric = {
          type: 'percentage',
          value: hrValue,
          reference: hrReference,
          unit: '%'
        };
      } else {
        targetMetric = {
          type: 'absolute',
          value: hrValue,
          unit: 'bpm'
        };
      }
      
      updateTargetMetric('heartRate', targetMetric);
    };

    // Calculate actual HR ranges for display
    const getHRRange = () => {
      if (!playerStats?.maxHR) return null;
      
      if (hrType === 'zone') {
        return calculateZoneHRRange(hrValue, playerStats.maxHR, 'garmin_hr');
      } else if (hrType === 'percentage') {
        const refValue = hrReference === 'max_hr' ? playerStats.maxHR : 
                        hrReference === 'lt1' ? playerStats.lt1 :
                        hrReference === 'lt2' ? playerStats.lt2 : playerStats.maxHR;
        if (refValue) {
          const calculated = Math.round((refValue * hrValue) / 100);
          return { min: calculated - 2, max: calculated + 2 };
        }
      }
      return null;
    };

    const hrRange = getHRRange();
    const selectedZone = hrType === 'zone' ? GARMIN_HR_ZONES.find(z => z.zone === hrValue) : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Heart Rate Target
          </Label>
          {currentHR && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeTargetMetric('heartRate')}
              className="text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <RadioGroup value={hrType} onValueChange={(value: any) => setHrType(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="zone" id="hr-zone" />
            <Label htmlFor="hr-zone">Garmin HR Zone</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="hr-percentage" />
            <Label htmlFor="hr-percentage">Percentage of Max</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="absolute" id="hr-absolute" />
            <Label htmlFor="hr-absolute">Absolute BPM</Label>
          </div>
        </RadioGroup>

        {hrType === 'zone' && (
          <div className="space-y-3">
            <Label>Heart Rate Zone</Label>
            <div className="grid grid-cols-5 gap-2">
              {GARMIN_HR_ZONES.map((zone) => (
                <Button
                  key={zone.zone}
                  variant={hrValue === zone.zone ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHrValue(zone.zone)}
                  className={cn(
                    "flex flex-col h-auto p-3 text-xs",
                    hrValue === zone.zone && "shadow-lg"
                  )}
                  style={{
                    backgroundColor: hrValue === zone.zone ? zone.color : undefined,
                    borderColor: zone.color,
                    color: hrValue === zone.zone ? 'white' : zone.color
                  }}
                >
                  <span className="font-bold">Zone {zone.zone}</span>
                  <span className="text-xs opacity-80">{zone.name}</span>
                  <span className="text-xs">{zone.percentage.min}-{zone.percentage.max}%</span>
                </Button>
              ))}
            </div>
            {selectedZone && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedZone.name}:</strong> {selectedZone.description}
                  {hrRange && (
                    <span className="block mt-1 text-sm">
                      Target: {hrRange.min}-{hrRange.max} BPM
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {hrType === 'percentage' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reference</Label>
                <Select value={hrReference} onValueChange={(value: any) => setHrReference(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="max_hr">Max HR</SelectItem>
                    <SelectItem value="lt1">LT1</SelectItem>
                    <SelectItem value="lt2">LT2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Percentage</Label>
                <Input
                  type="number"
                  value={hrValue}
                  onChange={(e) => setHrValue(Number(e.target.value))}
                  min={50}
                  max={110}
                />
              </div>
            </div>
            <div>
              <Label>Percentage: {hrValue}%</Label>
              <Slider
                value={[hrValue]}
                onValueChange={(value) => setHrValue(value[0])}
                min={50}
                max={110}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {hrType === 'absolute' && (
          <div className="space-y-3">
            <div>
              <Label>Target Heart Rate (BPM)</Label>
              <Input
                type="number"
                value={hrValue}
                onChange={(e) => setHrValue(Number(e.target.value))}
                min={60}
                max={220}
              />
            </div>
            <div>
              <Label>BPM: {hrValue}</Label>
              <Slider
                value={[hrValue]}
                onValueChange={(value) => setHrValue(value[0])}
                min={60}
                max={220}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        )}

        <Button onClick={handleHRUpdate} className="w-full">
          <Heart className="h-4 w-4 mr-2" />
          Set Heart Rate Target
        </Button>
      </div>
    );
  };

  // Power Zone Builder
  const PowerZoneBuilder = () => {
    const currentPower = formData.targetMetrics.watts;
    const [powerType, setPowerType] = useState<'absolute' | 'percentage' | 'zone'>('zone');
    const [powerValue, setPowerValue] = useState<number>(3);

    useEffect(() => {
      if (currentPower) {
        if (currentPower.type === 'zone' && currentPower.zoneSystem === 'power') {
          setPowerType('zone');
          setPowerValue(typeof currentPower.value === 'number' ? currentPower.value : 3);
        } else if (currentPower.type === 'percentage') {
          setPowerType('percentage');
          setPowerValue(typeof currentPower.value === 'number' ? currentPower.value : 75);
        } else {
          setPowerType('absolute');
          setPowerValue(typeof currentPower.value === 'number' ? currentPower.value : 200);
        }
      }
    }, [currentPower]);

    const handlePowerUpdate = () => {
      let targetMetric: TargetMetric;
      
      if (powerType === 'zone') {
        targetMetric = {
          type: 'zone',
          value: powerValue,
          zoneSystem: 'power',
          reference: 'ftp',
          unit: 'zone'
        };
      } else if (powerType === 'percentage') {
        targetMetric = {
          type: 'percentage',
          value: powerValue,
          reference: 'ftp',
          unit: '% FTP'
        };
      } else {
        targetMetric = {
          type: 'absolute',
          value: powerValue,
          unit: 'W'
        };
      }
      
      updateTargetMetric('watts', targetMetric);
    };

    const getPowerRange = () => {
      if (!playerStats?.ftp) return null;
      
      if (powerType === 'zone') {
        return calculateZonePowerRange(powerValue, playerStats.ftp);
      } else if (powerType === 'percentage') {
        const calculated = Math.round((playerStats.ftp * powerValue) / 100);
        return { min: calculated - 5, max: calculated + 5 };
      }
      return null;
    };

    const powerRange = getPowerRange();
    const selectedZone = powerType === 'zone' ? POWER_ZONES.find(z => z.zone === powerValue) : null;

    if (!equipmentConfig.metrics.supported.includes('watts')) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Power metrics not supported for {equipmentConfig.displayName}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Power Target
          </Label>
          {currentPower && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeTargetMetric('watts')}
              className="text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <RadioGroup value={powerType} onValueChange={(value: any) => setPowerType(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="zone" id="power-zone" />
            <Label htmlFor="power-zone">Power Zone (% FTP)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="power-percentage" />
            <Label htmlFor="power-percentage">Percentage of FTP</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="absolute" id="power-absolute" />
            <Label htmlFor="power-absolute">Absolute Watts</Label>
          </div>
        </RadioGroup>

        {powerType === 'zone' && (
          <div className="space-y-3">
            <Label>Power Zone</Label>
            <div className="grid grid-cols-3 gap-2">
              {POWER_ZONES.slice(0, 6).map((zone) => (
                <Button
                  key={zone.zone}
                  variant={powerValue === zone.zone ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPowerValue(zone.zone)}
                  className={cn(
                    "flex flex-col h-auto p-3 text-xs",
                    powerValue === zone.zone && "shadow-lg"
                  )}
                  style={{
                    backgroundColor: powerValue === zone.zone ? zone.color : undefined,
                    borderColor: zone.color,
                    color: powerValue === zone.zone ? 'white' : zone.color
                  }}
                >
                  <span className="font-bold">Zone {zone.zone}</span>
                  <span className="text-xs opacity-80">{zone.name}</span>
                  <span className="text-xs">{zone.percentage.min}-{zone.percentage.max}%</span>
                </Button>
              ))}
            </div>
            {selectedZone && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedZone.name}:</strong> {selectedZone.purpose}
                  {powerRange && (
                    <span className="block mt-1 text-sm">
                      Target: {powerRange.min}-{powerRange.max} W
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {powerType === 'percentage' && (
          <div className="space-y-3">
            <div>
              <Label>Percentage of FTP</Label>
              <Input
                type="number"
                value={powerValue}
                onChange={(e) => setPowerValue(Number(e.target.value))}
                min={40}
                max={150}
              />
            </div>
            <div>
              <Label>FTP: {powerValue}%</Label>
              <Slider
                value={[powerValue]}
                onValueChange={(value) => setPowerValue(value[0])}
                min={40}
                max={150}
                step={1}
                className="mt-2"
              />
            </div>
            {powerRange && (
              <div className="text-sm text-muted-foreground">
                Target: {powerRange.min}-{powerRange.max} W
              </div>
            )}
          </div>
        )}

        {powerType === 'absolute' && (
          <div className="space-y-3">
            <div>
              <Label>Target Power (Watts)</Label>
              <Input
                type="number"
                value={powerValue}
                onChange={(e) => setPowerValue(Number(e.target.value))}
                min={50}
                max={800}
              />
            </div>
            <div>
              <Label>Watts: {powerValue}</Label>
              <Slider
                value={[powerValue]}
                onValueChange={(value) => setPowerValue(value[0])}
                min={50}
                max={800}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
        )}

        <Button onClick={handlePowerUpdate} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Set Power Target
        </Button>
      </div>
    );
  };

  // Pace/Speed Builder
  const PaceSpeedBuilder = () => {
    const currentPace = formData.targetMetrics.pace;
    const currentSpeed = formData.targetMetrics.speed;
    const [metricType, setMetricType] = useState<'pace' | 'speed'>('pace');
    const [paceMinutes, setPaceMinutes] = useState(2);
    const [paceSeconds, setPaceSeconds] = useState(0);
    const [speed, setSpeed] = useState(15);

    const handlePaceUpdate = () => {
      if (metricType === 'pace') {
        const totalSeconds = (paceMinutes * 60) + paceSeconds;
        const targetMetric: TargetMetric = {
          type: 'absolute',
          value: totalSeconds,
          unit: equipmentConfig.units.pace || '/500m'
        };
        updateTargetMetric('pace', targetMetric);
        removeTargetMetric('speed');
      } else {
        const targetMetric: TargetMetric = {
          type: 'absolute',
          value: speed,
          unit: equipmentConfig.units.speed || 'km/h'
        };
        updateTargetMetric('speed', targetMetric);
        removeTargetMetric('pace');
      }
    };

    if (!equipmentConfig.metrics.supported.includes('pace') && 
        !equipmentConfig.metrics.supported.includes('speed')) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pace/Speed metrics not supported for {equipmentConfig.displayName}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Pace/Speed Target
          </Label>
          {(currentPace || currentSpeed) && (
            <div className="flex gap-1">
              {currentPace && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeTargetMetric('pace')}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {currentSpeed && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeTargetMetric('speed')}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <RadioGroup value={metricType} onValueChange={(value: any) => setMetricType(value)}>
          {equipmentConfig.metrics.supported.includes('pace') && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pace" id="pace-target" />
              <Label htmlFor="pace-target">Pace ({equipmentConfig.units.pace})</Label>
            </div>
          )}
          {equipmentConfig.metrics.supported.includes('speed') && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="speed" id="speed-target" />
              <Label htmlFor="speed-target">Speed ({equipmentConfig.units.speed})</Label>
            </div>
          )}
        </RadioGroup>

        {metricType === 'pace' && (
          <div className="space-y-3">
            <Label>Target Pace</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Minutes</Label>
                <Input
                  type="number"
                  value={paceMinutes}
                  onChange={(e) => setPaceMinutes(Number(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
              <div>
                <Label>Seconds</Label>
                <Input
                  type="number"
                  value={paceSeconds}
                  onChange={(e) => setPaceSeconds(Number(e.target.value))}
                  min={0}
                  max={59}
                />
              </div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              Target: {paceMinutes}:{paceSeconds.toString().padStart(2, '0')} {equipmentConfig.units.pace}
            </div>
          </div>
        )}

        {metricType === 'speed' && (
          <div className="space-y-3">
            <div>
              <Label>Target Speed ({equipmentConfig.units.speed})</Label>
              <Input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                min={5}
                max={50}
                step={0.5}
              />
            </div>
            <div>
              <Label>Speed: {speed} {equipmentConfig.units.speed}</Label>
              <Slider
                value={[speed]}
                onValueChange={(value) => setSpeed(value[0])}
                min={5}
                max={50}
                step={0.5}
                className="mt-2"
              />
            </div>
          </div>
        )}

        <Button onClick={handlePaceUpdate} className="w-full">
          <Activity className="h-4 w-4 mr-2" />
          Set {metricType === 'pace' ? 'Pace' : 'Speed'} Target
        </Button>
      </div>
    );
  };

  // Other Metrics Builder (RPM, RPE, etc.)
  const OtherMetricsBuilder = () => {
    return (
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-purple-500" />
          Other Metrics
        </Label>

        {/* RPM/Cadence */}
        {(equipmentConfig.metrics.supported.includes('rpm') || 
          equipmentConfig.metrics.supported.includes('runCadence') ||
          equipmentConfig.metrics.supported.includes('strokeRate')) && (
          <div className="space-y-3">
            <Label>Cadence/RPM</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder="e.g. 90"
                  onChange={(e) => {
                    if (e.target.value) {
                      const metric = equipmentConfig.metrics.supported.includes('rpm') ? 'rpm' :
                                   equipmentConfig.metrics.supported.includes('runCadence') ? 'runCadence' : 'strokeRate';
                      updateTargetMetric(metric, {
                        type: 'absolute',
                        value: Number(e.target.value),
                        unit: equipmentConfig.units.cadence || 'rpm'
                      });
                    }
                  }}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input 
                  value={equipmentConfig.units.cadence || 'rpm'} 
                  disabled 
                />
              </div>
            </div>
          </div>
        )}

        {/* RPE (Rate of Perceived Exertion) */}
        <div className="space-y-3">
          <Label>RPE (Rate of Perceived Exertion)</Label>
          <div className="grid grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
              <Button
                key={rpe}
                variant={formData.targetMetrics.rpe === rpe ? "default" : "outline"}
                size="sm"
                onClick={() => updateTargetMetric('rpe', rpe)}
                className={cn(
                  "aspect-square text-xs",
                  rpe <= 3 && "border-green-500 text-green-600",
                  rpe >= 4 && rpe <= 6 && "border-yellow-500 text-yellow-600",
                  rpe >= 7 && rpe <= 8 && "border-orange-500 text-orange-600",
                  rpe >= 9 && "border-red-500 text-red-600"
                )}
              >
                {rpe}
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            1-3: Easy, 4-6: Moderate, 7-8: Hard, 9-10: Maximum
          </div>
        </div>

        {/* Equipment-specific metrics */}
        {equipment === WorkoutEquipmentType.TREADMILL && (
          <div className="space-y-3">
            <Label>Incline (%)</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="e.g. 5"
                min={0}
                max={20}
                onChange={(e) => {
                  if (e.target.value) {
                    updateTargetMetric('incline', {
                      type: 'absolute',
                      value: Number(e.target.value),
                      unit: '%'
                    });
                  }
                }}
              />
              <div className="flex items-center text-sm text-muted-foreground">
                0-20% grade
              </div>
            </div>
          </div>
        )}

        {(equipment === WorkoutEquipmentType.ROWING || equipment === WorkoutEquipmentType.SKIERG) && (
          <div className="space-y-3">
            <Label>Damper Setting</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="e.g. 5"
                min={1}
                max={10}
                onChange={(e) => {
                  if (e.target.value) {
                    updateFormData('damperSetting', Number(e.target.value));
                  }
                }}
              />
              <div className="flex items-center text-sm text-muted-foreground">
                1-10 setting
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSave = () => {
    // Ensure color is set based on interval type
    const intervalType = INTERVAL_TYPES.find(t => t.value === formData.type);
    const updatedFormData = {
      ...formData,
      primaryMetric: primaryTarget,
      color: intervalType?.color || formData.color
    } as any;
    
    onSave(updatedFormData);
  };

  const getActiveTargetsCount = () => {
    return Object.keys(formData.targetMetrics).filter(key => 
      formData.targetMetrics[key] !== undefined && 
      formData.targetMetrics[key] !== null
    ).length;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Edit Interval (Enhanced)
          {getActiveTargetsCount() > 0 && (
            <Badge variant="secondary">
              {getActiveTargetsCount()} target{getActiveTargetsCount() > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Basic Settings */}
        <div className="space-y-4">
          {/* Interval Name - First */}
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Interval 1"
            />
          </div>

          {/* Interval Type - Second */}
          <div>
            <Label>Interval Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: IntervalType) => {
                updateFormData('type', value);
                const type = INTERVAL_TYPES.find(t => t.value === value);
                if (type) {
                  updateFormData('color', type.color);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipment - Third */}
          <div>
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Equipment
            </Label>
            <Select 
              value={formData.equipment} 
              onValueChange={(value) => updateFormData('equipment', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Target (Time/Distance/Calories) - Fourth */}
          <div>
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Primary Target
            </Label>
            <Select 
              value={primaryTarget} 
              onValueChange={(value: 'time' | 'distance' | 'calories') => {
                setPrimaryTarget(value);
                // Update form data based on target type
                updateFormData('primaryMetric' as any, value);
                if (value === 'distance') {
                  updateFormData('targetType', 'distance');
                } else if (value === 'calories') {
                  updateFormData('targetType', 'calories');
                } else {
                  updateFormData('targetType', 'time');
                }
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>Time (Duration)</span>
                  </div>
                </SelectItem>
                <SelectItem value="distance">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Distance</span>
                  </div>
                </SelectItem>
                <SelectItem value="calories">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Calories</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose whether this interval is based on time, distance, or calories
            </p>
          </div>

          {/* Dynamic Target Input based on Primary Target */}
          {primaryTarget === 'time' && (
            <div>
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Minutes</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => handleDurationChange(Number(e.target.value), durationSeconds)}
                    min={0}
                    max={60}
                  />
                </div>
                <div>
                  <Label className="text-xs">Seconds</Label>
                  <Input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => handleDurationChange(durationMinutes, Number(e.target.value))}
                    min={0}
                    max={59}
                  />
                </div>
              </div>
              <div className="text-center mt-2 p-2 bg-muted rounded text-sm">
                Total: {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {primaryTarget === 'distance' && (
            <div>
              <Label>Target Distance</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.targetDistance || ''}
                  onChange={(e) => updateFormData('targetDistance', Number(e.target.value))}
                  placeholder="Enter distance"
                  min={0}
                  step={equipmentConfig.units.distance === 'km' ? 0.1 : 100}
                />
                <div className="flex items-center px-3 bg-muted rounded">
                  {equipmentConfig.units.distance || 'm'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete this interval when the target distance is reached
              </p>
            </div>
          )}

          {primaryTarget === 'calories' && (
            <div>
              <Label>Target Calories</Label>
              <Input
                type="number"
                value={formData.targetCalories || ''}
                onChange={(e) => updateFormData('targetCalories', Number(e.target.value))}
                placeholder="Enter calorie target"
                min={0}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Complete this interval when the calorie target is reached
              </p>
            </div>
          )}
        </div>

        {/* Set Configuration - Optional with Toggle */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enable-sets"
              checked={!!formData.setConfig}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Enable with default values
                  updateFormData('setConfig', {
                    numberOfSets: 3,
                    intervalsPerSet: 5,
                    restBetweenSets: 120,
                    restBetweenIntervals: 30
                  });
                } else {
                  // Disable
                  updateFormData('setConfig', undefined);
                }
              }}
            />
            <Label 
              htmlFor="enable-sets" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Enable Set Configuration (Multiple sets with rest periods)
            </Label>
          </div>
          
          {formData.setConfig && (
            <SetConfigurationForm
              config={formData.setConfig}
              intervalDuration={formData.duration || 60}
              onApply={(config) => {
                updateFormData('setConfig', config);
                toast.success(`Set configuration applied: ${config.numberOfSets} × ${config.intervalsPerSet}`);
              }}
              onClear={() => updateFormData('setConfig', undefined)}
            />
          )}
        </div>

        {/* Performance Target Metrics - Fifth */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <Label className="font-medium">Performance Target Metrics</Label>
            <Badge variant="outline">{equipmentConfig.displayName}</Badge>
          </div>

          <Tabs value={activeMetricTab} onValueChange={(v: any) => setActiveMetricTab(v)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="heartRate" className="flex items-center gap-1 text-xs">
                <Heart className="h-3 w-3" />
                HR
              </TabsTrigger>
              <TabsTrigger value="power" className="flex items-center gap-1 text-xs">
                <Zap className="h-3 w-3" />
                Power
              </TabsTrigger>
              <TabsTrigger value="pace" className="flex items-center gap-1 text-xs">
                <Activity className="h-3 w-3" />
                Pace
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-1 text-xs">
                <Gauge className="h-3 w-3" />
                Other
              </TabsTrigger>
            </TabsList>

            <TabsContent value="heartRate" className="space-y-4">
              <HeartRateZoneBuilder />
            </TabsContent>

            <TabsContent value="power" className="space-y-4">
              <PowerZoneBuilder />
            </TabsContent>

            <TabsContent value="pace" className="space-y-4">
              <PaceSpeedBuilder />
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <OtherMetricsBuilder />
            </TabsContent>
          </Tabs>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes (Optional)</Label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder="Add any specific instructions or notes for this interval..."
            rows={3}
          />
        </div>

        {/* Current Targets Summary */}
        {getActiveTargetsCount() > 0 && (
          <div className="space-y-2">
            <Label className="font-medium">Active Targets:</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.targetMetrics).map(([key, metric]) => {
                if (!metric) return null;
                
                let displayValue = '';
                if (metric.type === 'zone') {
                  displayValue = `Zone ${metric.value}`;
                } else if (metric.type === 'percentage') {
                  displayValue = `${metric.value}% ${metric.reference || ''}`;
                } else {
                  displayValue = `${metric.value} ${metric.unit || ''}`;
                }

                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {displayValue}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Stats Info */}
        {playerStats && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <div>Using player data for calculations:</div>
                <div className="flex flex-wrap gap-4 text-xs">
                  {playerStats.maxHR && <span>Max HR: {playerStats.maxHR} bpm</span>}
                  {playerStats.ftp && <span>FTP: {playerStats.ftp}W</span>}
                  {playerStats.lt1 && <span>LT1: {playerStats.lt1} bpm</span>}
                  {playerStats.lt2 && <span>LT2: {playerStats.lt2} bpm</span>}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Interval
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}