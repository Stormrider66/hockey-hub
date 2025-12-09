'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerPerformanceData, TimePeriod } from '../../types/analytics.types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TeamHeatmapProps {
  players: PlayerPerformanceData[];
  period: TimePeriod;
  metric?: keyof PlayerPerformanceData['metrics'];
}

export function TeamHeatmap({ 
  players, 
  period, 
  metric = 'performanceIndex' 
}: TeamHeatmapProps) {
  const { t } = useTranslation(['physicalTrainer']);

  // Generate date labels based on period
  const dateLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    
    switch (period) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
        }
        break;
      case 'month':
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          labels.push(`W${5 - i}`);
        }
        break;
      default:
        labels.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
    }
    
    return labels;
  }, [period]);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    return players.map(player => {
      const metricData = player.metrics[metric];
      const trend = metricData.trend.slice(-dateLabels.length);
      
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        position: player.position,
        values: trend.map((value, index) => ({
          date: dateLabels[index],
          value,
          normalized: (value / 100) // Normalize to 0-1 for color scaling
        }))
      };
    });
  }, [players, metric, dateLabels]);

  // Color scale function
  const getColor = (value: number) => {
    // Value should be normalized between 0 and 1
    const hue = value * 120; // 0 = red (0°), 1 = green (120°)
    const saturation = 70;
    const lightness = 50 + (1 - value) * 20; // Darker for better values
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header with date labels */}
        <div className="flex items-center mb-2">
          <div className="w-40 pr-4">
            <span className="text-sm font-medium text-muted-foreground">
              {t('physicalTrainer:analytics.player')}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {dateLabels.map((label) => (
              <div key={label} className="text-center text-xs text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap rows */}
        <TooltipProvider>
          <div className="space-y-1">
            {heatmapData.map((player) => (
              <div key={player.playerId} className="flex items-center">
                {/* Player info */}
                <div className="w-40 pr-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium truncate">{player.playerName}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                </div>

                {/* Heatmap cells */}
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {player.values.map((cell, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "aspect-square rounded cursor-pointer transition-all hover:scale-110",
                            "border border-gray-200"
                          )}
                          style={{ 
                            backgroundColor: getColor(cell.normalized),
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">{player.playerName}</p>
                          <p>{cell.date}: {cell.value}%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t('physicalTrainer:analytics.legend.poor')}</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                <div
                  key={value}
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: getColor(value) }}
                />
              ))}
            </div>
            <span>{t('physicalTrainer:analytics.legend.excellent')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}