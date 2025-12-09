'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceMetric, MetricCardProps } from '../../types/analytics.types';

interface ExtendedMetricCardProps extends MetricCardProps {
  icon?: LucideIcon;
}

// Inline lightweight sparkline component
const Sparkline = React.memo(function Sparkline({ 
  data, 
  color, 
  height = 48 
}: { 
  data: number[]; 
  color: string; 
  height?: number;
}) {
  const width = 120;
  const padding = 2;
  
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="w-full h-full">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Add subtle gradient for visual interest */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#gradient-${color})`}
        points={`${padding},${height} ${points} ${width - padding},${height}`}
      />
    </svg>
  );
});

export function MetricCardLightweight({ 
  metric, 
  size = 'medium', 
  showTrend = true, 
  showTarget = true,
  onClick,
  icon: Icon
}: ExtendedMetricCardProps) {
  const getTrendIcon = () => {
    if (metric.changeDirection === 'up') return TrendingUp;
    if (metric.changeDirection === 'down') return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();
  
  const getChangeColor = () => {
    if (metric.isGood) {
      return metric.changeDirection === 'up' ? 'text-green-600' : 'text-red-600';
    } else {
      return metric.changeDirection === 'down' ? 'text-green-600' : 'text-red-600';
    }
  };

  const getProgressColor = () => {
    if (metric.target) {
      const percentage = (metric.value / metric.target) * 100;
      if (percentage >= 90) return 'bg-green-600';
      if (percentage >= 70) return 'bg-yellow-600';
      return 'bg-red-600';
    }
    return 'bg-primary';
  };

  const cardSizes = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const valueSizes = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const sparklineColor = metric.isGood ? '#10b981' : '#ef4444';

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-lg cursor-pointer",
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className={cardSizes[size]}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn("font-bold", valueSizes[size])}>
                    {metric.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
              </div>
            </div>
            
            {showTrend && (
              <div className={cn("flex items-center gap-1", getChangeColor())}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {Math.abs(metric.change)}%
                </span>
              </div>
            )}
          </div>

          {/* Progress bar if target exists */}
          {showTarget && metric.target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round((metric.value / metric.target) * 100)}%</span>
              </div>
              <Progress 
                value={(metric.value / metric.target) * 100} 
                className="h-2"
                indicatorClassName={getProgressColor()}
              />
            </div>
          )}

          {/* Trend chart - replaced with lightweight sparkline */}
          {showTrend && metric.trend.length > 0 && size !== 'small' && (
            <div className="h-12 relative group">
              <Sparkline 
                data={metric.trend} 
                color={sparklineColor}
                height={48}
              />
              {/* Hover tooltip showing last value */}
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-popover p-1 rounded text-xs shadow-md">
                Latest: {metric.trend[metric.trend.length - 1]} {metric.unit}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}