'use client';

import React, { useMemo } from 'react';

interface RadialBarData {
  name: string;
  value: number;
  max?: number;
  color?: string;
}

interface LightweightRadialBarProps {
  data: RadialBarData[];
  width?: number;
  height?: number;
  innerRadius?: number;
  barWidth?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  showValue?: boolean;
  className?: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
];

export const LightweightRadialBar = React.memo(function LightweightRadialBar({
  data,
  width = 200,
  height = 200,
  innerRadius = 30,
  barWidth = 20,
  startAngle = -90,
  endAngle = 270,
  showLabels = true,
  showValue = true,
  className = '',
  colors = DEFAULT_COLORS
}: LightweightRadialBarProps) {
  const { bars, labels } = useMemo(() => {
    if (!data.length) return { bars: [], labels: [] };

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 10;
    const angleRange = endAngle - startAngle;
    
    const bars: Array<{
      path: string;
      backgroundPath: string;
      color: string;
      item: RadialBarData;
      percentage: number;
      radius: number;
    }> = [];
    
    const labels: Array<{
      x: number;
      y: number;
      text: string;
      value: number;
      percentage: number;
    }> = [];

    data.forEach((item, index) => {
      const radius = maxRadius - (index * (barWidth + 5));
      const effectiveInnerRadius = radius - barWidth;
      const maxValue = item.max || 100;
      const percentage = Math.min((item.value / maxValue) * 100, 100);
      const sweepAngle = (percentage / 100) * angleRange;
      const color = item.color || colors[index % colors.length];

      // Convert angles to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + sweepAngle) * Math.PI) / 180;
      const fullEndRad = (endAngle * Math.PI) / 180;

      // Calculate arc path for value
      const x1 = centerX + Math.cos(startRad) * radius;
      const y1 = centerY + Math.sin(startRad) * radius;
      const x2 = centerX + Math.cos(endRad) * radius;
      const y2 = centerY + Math.sin(endRad) * radius;
      const ix1 = centerX + Math.cos(startRad) * effectiveInnerRadius;
      const iy1 = centerY + Math.sin(startRad) * effectiveInnerRadius;
      const ix2 = centerX + Math.cos(endRad) * effectiveInnerRadius;
      const iy2 = centerY + Math.sin(endRad) * effectiveInnerRadius;

      const largeArcFlag = sweepAngle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${effectiveInnerRadius} ${effectiveInnerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');

      // Calculate background arc path
      const bgX2 = centerX + Math.cos(fullEndRad) * radius;
      const bgY2 = centerY + Math.sin(fullEndRad) * radius;
      const bgIx2 = centerX + Math.cos(fullEndRad) * effectiveInnerRadius;
      const bgIy2 = centerY + Math.sin(fullEndRad) * effectiveInnerRadius;
      const bgLargeArcFlag = angleRange > 180 ? 1 : 0;

      const backgroundPath = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${bgLargeArcFlag} 1 ${bgX2} ${bgY2}`,
        `L ${bgIx2} ${bgIy2}`,
        `A ${effectiveInnerRadius} ${effectiveInnerRadius} 0 ${bgLargeArcFlag} 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');

      bars.push({
        path,
        backgroundPath,
        color,
        item,
        percentage,
        radius
      });

      // Calculate label position
      if (showLabels) {
        const labelRadius = radius - barWidth / 2;
        const labelAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius * 0.7;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius * 0.7;

        labels.push({
          x: labelX,
          y: labelY,
          text: item.name,
          value: item.value,
          percentage
        });
      }
    });

    return { bars, labels };
  }, [data, width, height, innerRadius, barWidth, startAngle, endAngle, showLabels, colors]);

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`} style={{ height, width }}>
        No data available
      </div>
    );
  }

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      style={{ width: '100%', height: '100%', maxWidth: width, maxHeight: height }}
    >
      {/* Background arcs */}
      <g opacity="0.1">
        {bars.map((bar, index) => (
          <path
            key={`bg-${index}`}
            d={bar.backgroundPath}
            fill={bar.color}
          />
        ))}
      </g>

      {/* Value arcs */}
      <g>
        {bars.map((bar, index) => (
          <path
            key={`value-${index}`}
            d={bar.path}
            fill={bar.color}
            className="transition-all duration-500"
          >
            <title>{`${bar.item.name}: ${bar.item.value} (${bar.percentage.toFixed(1)}%)`}</title>
          </path>
        ))}
      </g>

      {/* Center value */}
      {showValue && data.length === 1 && (
        <g>
          <text
            x={width / 2}
            y={height / 2 - 5}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-700"
          >
            {data[0].value}
          </text>
          <text
            x={width / 2}
            y={height / 2 + 15}
            textAnchor="middle"
            className="text-sm fill-gray-500"
          >
            {bars[0].percentage.toFixed(0)}%
          </text>
        </g>
      )}

      {/* Labels */}
      {showLabels && labels.map((label, index) => (
        <g key={`label-${index}`}>
          <text
            x={label.x}
            y={label.y - 5}
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700"
          >
            {label.text}
          </text>
          {showValue && data.length > 1 && (
            <text
              x={label.x}
              y={label.y + 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {label.percentage.toFixed(0)}%
            </text>
          )}
        </g>
      ))}

      {/* Legend for multiple items */}
      {data.length > 1 && (
        <g transform={`translate(${width - 80}, 20)`}>
          {bars.map((bar, index) => (
            <g key={`legend-${index}`} transform={`translate(0, ${index * 20})`}>
              <rect
                x="0"
                y="0"
                width="12"
                height="12"
                fill={bar.color}
                rx="2"
              />
              <text
                x="16"
                y="9"
                className="text-xs fill-gray-600"
              >
                {bar.item.name}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
});