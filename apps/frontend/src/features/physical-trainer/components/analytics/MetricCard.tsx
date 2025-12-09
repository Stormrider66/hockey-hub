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
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface ExtendedMetricCardProps extends MetricCardProps {
  icon?: LucideIcon;
}

export function MetricCard({ 
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

  // Prepare trend data for mini chart
  const trendData = metric.trend.map((value, index) => ({
    index,
    value
  }));

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

          {/* Trend chart */}
          {showTrend && metric.trend.length > 0 && size !== 'small' && (
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        return (
                          <div className="bg-popover p-2 rounded-md shadow-md border">
                            <p className="text-xs">
                              {payload[0].value} {metric.unit}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={metric.isGood ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}