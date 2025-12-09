'use client';

import React, { useMemo } from 'react';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface LightweightPieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  innerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export const LightweightPieChart = React.memo(function LightweightPieChart({
  data,
  width = 300,
  height = 300,
  innerRadius = 0,
  showLabels = true,
  showLegend = true,
  className = '',
  colors = DEFAULT_COLORS
}: LightweightPieChartProps) {
  const { paths, legendItems, total } = useMemo(() => {
    if (!data.length) return { paths: [], legendItems: [], total: 0 };

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const effectiveInnerRadius = innerRadius * outerRadius;

    let currentAngle = -Math.PI / 2; // Start at top
    const paths: Array<{ d: string; fill: string; item: PieChartData }> = [];
    const legendItems: Array<{ name: string; color: string; value: number; percentage: number }> = [];

    data.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + angle;
      const color = item.color || colors[index % colors.length];

      // Calculate path
      const x1 = centerX + Math.cos(currentAngle) * outerRadius;
      const y1 = centerY + Math.sin(currentAngle) * outerRadius;
      const x2 = centerX + Math.cos(endAngle) * outerRadius;
      const y2 = centerY + Math.sin(endAngle) * outerRadius;

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      let d: string;
      if (effectiveInnerRadius > 0) {
        // Donut chart
        const ix1 = centerX + Math.cos(currentAngle) * effectiveInnerRadius;
        const iy1 = centerY + Math.sin(currentAngle) * effectiveInnerRadius;
        const ix2 = centerX + Math.cos(endAngle) * effectiveInnerRadius;
        const iy2 = centerY + Math.sin(endAngle) * effectiveInnerRadius;

        d = [
          `M ${x1} ${y1}`,
          `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${ix2} ${iy2}`,
          `A ${effectiveInnerRadius} ${effectiveInnerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
          'Z'
        ].join(' ');
      } else {
        // Pie chart
        d = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
      }

      paths.push({ d, fill: color, item });
      legendItems.push({ 
        name: item.name, 
        color, 
        value: item.value,
        percentage 
      });

      currentAngle = endAngle;
    });

    return { paths, legendItems, total };
  }, [data, width, height, innerRadius, colors]);

  if (!data.length) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`} style={{ width, height }}>
        No data available
      </div>
    );
  }

  const chartSize = showLegend ? width * 0.6 : width;
  const legendWidth = width * 0.35;

  return (
    <div className={`flex items-center ${className}`} style={{ width, height }}>
      <svg width={chartSize} height={height} className="flex-shrink-0">
        <g>
          {paths.map((path, index) => (
            <g key={index}>
              <path
                d={path.d}
                fill={path.fill}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                stroke="white"
                strokeWidth="2"
              >
                <title>{`${path.item.name}: ${path.item.value} (${((path.item.value / total) * 100).toFixed(1)}%)`}</title>
              </path>
              {showLabels && path.item.value / total > 0.05 && (
                <text
                  x={width / 2 + Math.cos(-Math.PI / 2 + (2 * Math.PI * legendItems.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0) / total) - (Math.PI * path.item.value / total)) * (innerRadius ? (outerRadius + innerRadius * outerRadius) / 2 : outerRadius * 0.7)}
                  y={height / 2 + Math.sin(-Math.PI / 2 + (2 * Math.PI * legendItems.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0) / total) - (Math.PI * path.item.value / total)) * (innerRadius ? (outerRadius + innerRadius * outerRadius) / 2 : outerRadius * 0.7)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white pointer-events-none"
                >
                  {((path.item.value / total) * 100).toFixed(0)}%
                </text>
              )}
            </g>
          ))}
        </g>
        {innerRadius > 0 && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-2xl font-bold fill-gray-700"
          >
            {total}
          </text>
        )}
      </svg>
      
      {showLegend && (
        <div className="ml-4 flex flex-col justify-center" style={{ width: legendWidth }}>
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              <div 
                className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 truncate">{item.name}</div>
                <div className="text-xs font-medium">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});