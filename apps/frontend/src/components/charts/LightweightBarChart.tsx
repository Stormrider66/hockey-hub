'use client';

import React, { useMemo } from 'react';

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface LightweightBarChartProps {
  data: BarChartData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  className?: string;
  barColor?: string;
  maxValue?: number;
}

export const LightweightBarChart = React.memo(function LightweightBarChart({
  data,
  height = 200,
  showLabels = true,
  showValues = true,
  className = '',
  barColor = '#3b82f6',
  maxValue
}: LightweightBarChartProps) {
  const max = useMemo(() => {
    if (maxValue) return maxValue;
    return Math.max(...data.map(d => d.value), 1);
  }, [data, maxValue]);

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-gray-400 ${className}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full w-10 flex flex-col justify-between text-xs text-gray-500">
        <span>{max.toFixed(0)}</span>
        <span>{(max / 2).toFixed(0)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full flex items-end gap-2 pr-4">
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end relative group"
              style={{ minWidth: '30px' }}
            >
              {/* Value label */}
              {showValues && (
                <span className="text-xs text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value.toFixed(1)}
                </span>
              )}
              
              {/* Bar */}
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: item.color || barColor,
                  minHeight: '2px'
                }}
              />
              
              {/* X-axis label */}
              {showLabels && (
                <span className="text-xs text-gray-600 mt-2 text-center line-clamp-1">
                  {item.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});