'use client';

import React, { useMemo } from 'react';

interface LineChartData {
  x: string | number;
  y: number;
}

interface LightweightLineChartProps {
  data: LineChartData[];
  height?: number;
  width?: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showGrid?: boolean;
  className?: string;
}

export const LightweightLineChart = React.memo(function LightweightLineChart({
  data,
  height = 200,
  width = 400,
  color = '#3b82f6',
  strokeWidth = 2,
  showDots = true,
  showGrid = true,
  className = ''
}: LightweightLineChartProps) {
  const { points, viewBox, yLabels } = useMemo(() => {
    if (!data.length) return { points: '', viewBox: `0 0 ${width} ${height}`, yLabels: [] };

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;

    // Generate points for SVG path
    const pointsArray = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + (1 - (point.y - minY) / yRange) * chartHeight;
      return `${x},${y}`;
    });

    // Generate Y-axis labels
    const yLabelValues = [maxY, (maxY + minY) / 2, minY];

    return {
      points: pointsArray.join(' '),
      viewBox: `0 0 ${width} ${height}`,
      yLabels: yLabelValues
    };
  }, [data, width, height]);

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`} style={{ height, width }}>
        No data available
      </div>
    );
  }

  return (
    <svg 
      viewBox={viewBox} 
      className={className}
      style={{ width: '100%', height: '100%', maxWidth: width, maxHeight: height }}
    >
      {/* Grid lines */}
      {showGrid && (
        <g stroke="#e5e7eb" strokeWidth="1">
          <line x1="40" y1="40" x2={width - 40} y2="40" />
          <line x1="40" y1={height / 2} x2={width - 40} y2={height / 2} />
          <line x1="40" y1={height - 40} x2={width - 40} y2={height - 40} />
        </g>
      )}

      {/* Y-axis labels */}
      <g fill="#6b7280" fontSize="12">
        {yLabels.map((label, i) => (
          <text
            key={i}
            x="35"
            y={40 + i * ((height - 80) / 2) + 4}
            textAnchor="end"
          >
            {label.toFixed(1)}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g fill="#6b7280" fontSize="12">
        {data.map((point, i) => {
          // Only show every nth label to avoid crowding
          if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
          const x = 40 + (i / (data.length - 1)) * (width - 80);
          return (
            <text
              key={i}
              x={x}
              y={height - 20}
              textAnchor="middle"
            >
              {point.x}
            </text>
          );
        })}
      </g>

      {/* Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        points={points}
      />

      {/* Dots */}
      {showDots && data.map((point, index) => {
        const x = 40 + (index / (data.length - 1)) * (width - 80);
        const yValues = data.map(d => d.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const yRange = maxY - minY || 1;
        const y = 40 + (1 - (point.y - minY) / yRange) * (height - 80);

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="4"
            fill={color}
            className="hover:r-6 transition-all cursor-pointer"
          >
            <title>{`${point.x}: ${point.y}`}</title>
          </circle>
        );
      })}
    </svg>
  );
});