'use client';

import React, { useMemo } from 'react';

interface LoadData {
  player: string;
  acute: number;
  chronic: number;
  ratio: number;
  status: 'optimal' | 'warning' | 'danger';
}

interface LoadDistributionChartProps {
  data: LoadData[];
  height?: number;
  showRatioLine?: boolean;
  showStatusColors?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  optimal: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

export const LoadDistributionChart = React.memo(function LoadDistributionChart({
  data,
  height = 300,
  showRatioLine = true,
  showStatusColors = true,
  className = ''
}: LoadDistributionChartProps) {
  const { bars, maxValue, ratioPoints } = useMemo(() => {
    if (!data.length) return { bars: [], maxValue: 0, ratioPoints: [] };

    const maxValue = Math.max(
      ...data.flatMap(d => [d.acute, d.chronic]),
      100
    );

    const bars = data.map((item, index) => ({
      ...item,
      index,
      acuteHeight: (item.acute / maxValue) * 100,
      chronicHeight: (item.chronic / maxValue) * 100,
      color: showStatusColors ? STATUS_COLORS[item.status] : '#3b82f6'
    }));

    const ratioPoints = data.map((item, index) => ({
      x: index,
      y: Math.min(item.ratio * 20, 100), // Scale ratio to percentage (0-5 range to 0-100)
      ratio: item.ratio
    }));

    return { bars, maxValue, ratioPoints };
  }, [data, showStatusColors]);

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-gray-400 ${className}`}>
        No data available
      </div>
    );
  }

  const barWidth = 100 / (data.length * 3); // Width percentage for each bar
  const groupWidth = 100 / data.length; // Width for each player group

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between text-xs text-gray-500">
        <span>{maxValue.toFixed(0)}</span>
        <span>{(maxValue * 0.75).toFixed(0)}</span>
        <span>{(maxValue * 0.5).toFixed(0)}</span>
        <span>{(maxValue * 0.25).toFixed(0)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-14 h-full relative">
        <div className="absolute inset-0 flex items-end">
          {bars.map((item, index) => (
            <div
              key={index}
              className="relative flex-1 flex items-end justify-center gap-1 group"
              style={{ maxWidth: `${groupWidth}%` }}
            >
              {/* Acute load bar */}
              <div className="relative" style={{ width: `${barWidth}%` }}>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${item.acuteHeight}%`,
                    minHeight: '2px'
                  }}
                >
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.acute}
                  </div>
                </div>
              </div>

              {/* Chronic load bar */}
              <div className="relative" style={{ width: `${barWidth}%` }}>
                <div
                  className="w-full bg-gray-400 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${item.chronicHeight}%`,
                    minHeight: '2px'
                  }}
                >
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.chronic}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              {showStatusColors && (
                <div
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Ratio line overlay */}
        {showRatioLine && (
          <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 100 100`}>
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,2"
              points={ratioPoints.map((p, i) => {
                const x = (i + 0.5) * groupWidth;
                const y = 100 - p.y;
                return `${x},${y}`;
              }).join(' ')}
            />
            {/* Ratio points */}
            {ratioPoints.map((p, i) => {
              const x = (i + 0.5) * groupWidth;
              const y = 100 - p.y;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-xs font-medium fill-red-600"
                    style={{ fontSize: '0.5rem' }}
                  >
                    {p.ratio.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {/* Safe zone indicators */}
            <line x1="0" y1="60" x2="100" y2="60" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
            <line x1="0" y1="80" x2="100" y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
          </svg>
        )}

        {/* X-axis labels */}
        <div className="absolute -bottom-8 left-0 right-0 flex">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex-1 text-center text-xs text-gray-600 truncate px-1"
              style={{ maxWidth: `${groupWidth}%` }}
            >
              {item.player}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-gray-600">Acute</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded" />
          <span className="text-gray-600">Chronic</span>
        </div>
        {showRatioLine && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }} />
            <span className="text-gray-600">A:C Ratio</span>
          </div>
        )}
      </div>

      {/* Status legend */}
      {showStatusColors && (
        <div className="absolute top-2 left-14 flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Optimal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Danger</span>
          </div>
        </div>
      )}
    </div>
  );
});