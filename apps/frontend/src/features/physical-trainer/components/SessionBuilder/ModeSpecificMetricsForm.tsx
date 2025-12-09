import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Zap, Target, TrendingUp, Timer } from '@/components/icons';
import { 
  StrengthMode, 
  ModeSpecificMetrics, 
  SessionExercise 
} from '../../types/session-builder.types';
import { getStrengthModeConfig } from '../../config/strengthModeConfig';

interface ModeSpecificMetricsFormProps {
  exercise: SessionExercise;
  onUpdate: (metrics: Partial<ModeSpecificMetrics>) => void;
  className?: string;
}

const MODE_ICONS = {
  strength: Zap,
  power: Zap,
  stability_core: Target,
  plyometrics: TrendingUp,
};

const MODE_COLORS = {
  strength: 'text-blue-600',
  power: 'text-red-600',
  stability_core: 'text-green-600',
  plyometrics: 'text-orange-600',
};

export const ModeSpecificMetricsForm: React.FC<ModeSpecificMetricsFormProps> = ({
  exercise,
  onUpdate,
  className = ''
}) => {
  const mode = exercise.strengthMode || 'strength';
  const config = getStrengthModeConfig(mode);
  const metrics = exercise.modeSpecificMetrics || {};
  const Icon = MODE_ICONS[mode];

  if (config.availableMetrics.length === 0) {
    return null;
  }

  const handleMetricChange = (metric: keyof ModeSpecificMetrics, value: number | string) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    onUpdate({
      ...metrics,
      [metric]: numericValue
    });
  };

  const renderMetricInput = (metric: keyof ModeSpecificMetrics) => {
    const value = metrics[metric] || '';
    
    switch (metric) {
      case 'velocity':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-velocity`}>
              Target Velocity (m/s)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-velocity`}
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={value}
              onChange={(e) => handleMetricChange('velocity', e.target.value)}
              placeholder="1.0"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Typical power training: 0.8-1.2 m/s
            </p>
          </div>
        );

      case 'powerOutput':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-power`}>
              Target Power Output (watts)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-power`}
              type="number"
              min="0"
              max="2000"
              value={value}
              onChange={(e) => handleMetricChange('powerOutput', e.target.value)}
              placeholder="500"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Based on player's power profile
            </p>
          </div>
        );

      case 'peakVelocity':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-peak-velocity`}>
              Peak Velocity (m/s)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-peak-velocity`}
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={value}
              onChange={(e) => handleMetricChange('peakVelocity', e.target.value)}
              placeholder="1.5"
              className="w-full"
            />
          </div>
        );

      case 'holdTime':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-hold-time`}>
              Hold Time (seconds)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-hold-time`}
              type="number"
              min="0"
              max="300"
              value={value}
              onChange={(e) => handleMetricChange('holdTime', e.target.value)}
              placeholder="30"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Typical core holds: 15-60 seconds
            </p>
          </div>
        );

      case 'balanceDuration':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-balance-duration`}>
              Balance Duration (seconds)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-balance-duration`}
              type="number"
              min="0"
              max="120"
              value={value}
              onChange={(e) => handleMetricChange('balanceDuration', e.target.value)}
              placeholder="20"
              className="w-full"
            />
          </div>
        );

      case 'stabilityScore':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-stability-score`}>
              Stability Score (1-10)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-stability-score`}
              type="number"
              min="1"
              max="10"
              value={value}
              onChange={(e) => handleMetricChange('stabilityScore', e.target.value)}
              placeholder="7"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              1 = Very unstable, 10 = Perfect stability
            </p>
          </div>
        );

      case 'jumpHeight':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-jump-height`}>
              Target Jump Height (cm)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-jump-height`}
              type="number"
              min="0"
              max="200"
              value={value}
              onChange={(e) => handleMetricChange('jumpHeight', e.target.value)}
              placeholder="50"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Typical box jump: 40-70cm
            </p>
          </div>
        );

      case 'contactTime':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-contact-time`}>
              Contact Time (milliseconds)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-contact-time`}
              type="number"
              min="0"
              max="1000"
              value={value}
              onChange={(e) => handleMetricChange('contactTime', e.target.value)}
              placeholder="200"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Shorter = more reactive (100-300ms)
            </p>
          </div>
        );

      case 'reactiveStrengthIndex':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-rsi`}>
              Target RSI
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-rsi`}
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={value}
              onChange={(e) => handleMetricChange('reactiveStrengthIndex', e.target.value)}
              placeholder="2.0"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              RSI = Jump Height ÷ Contact Time
            </p>
          </div>
        );

      case 'flightTime':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-flight-time`}>
              Flight Time (milliseconds)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-flight-time`}
              type="number"
              min="0"
              max="1000"
              value={value}
              onChange={(e) => handleMetricChange('flightTime', e.target.value)}
              placeholder="400"
              className="w-full"
            />
          </div>
        );

      case 'landingForce':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${exercise.sessionExerciseId}-landing-force`}>
              Landing Force (xBW)
            </Label>
            <Input
              id={`${exercise.sessionExerciseId}-landing-force`}
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={value}
              onChange={(e) => handleMetricChange('landingForce', e.target.value)}
              placeholder="3.5"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Multiples of bodyweight (2-5x typical)
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${MODE_COLORS[mode]}`} />
        <h4 className="font-medium text-sm">
          {config.name} Mode Metrics
        </h4>
        <Badge variant="outline" className="text-xs">
          {config.intensityFocus}
        </Badge>
      </div>

      <div className="space-y-4">
        {config.availableMetrics.map((metric, index) => (
          <div key={metric}>
            {index > 0 && <Separator className="my-3" />}
            {renderMetricInput(metric)}
          </div>
        ))}
      </div>

      {config.availableMetrics.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Measurement Tips
            </span>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            {mode === 'power' && (
              <>
                <li>• Use velocity-based training (VBT) devices for accurate velocity</li>
                <li>• Power = Force × Velocity (measured during lift)</li>
                <li>• Rest periods should allow full recovery between sets</li>
              </>
            )}
            {mode === 'stability_core' && (
              <>
                <li>• Focus on quality over duration - maintain perfect form</li>
                <li>• Use unstable surfaces to increase difficulty progressively</li>
                <li>• Monitor breathing - should be able to breathe normally</li>
              </>
            )}
            {mode === 'plyometrics' && (
              <>
                <li>• Quality over quantity - full recovery between reps</li>
                <li>• Focus on landing mechanics and injury prevention</li>
                <li>• Use force plates or jump mats for accurate measurement</li>
              </>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
};