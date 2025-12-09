'use client';

import React, { useMemo } from 'react';

interface TrendDataPoint {
  date: string;
  values: { [key: string]: number };
}

interface TrendSeries {
  key: string;
  name: string;
  color: string;
  strokeDasharray?: string;
}

interface PerformanceTrendChartProps {
  data: TrendDataPoint[];
  series: TrendSeries[];
  height?: number;
  width?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  yAxisLabel?: string;
  dateFormat?: 'short' | 'medium' | 'long';
}

export const PerformanceTrendChart = React.memo(function PerformanceTrendChart({
  data,
  series,
  height = 300,
  width = 600,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className = '',
  yAxisLabel = 'Performance',
  dateFormat = 'short'
}: PerformanceTrendChartProps) {
  const { paths, viewBox, yLabels, xLabels, minY, maxY, legendHeight } = useMemo(() => {
    if (!data.length || !series.length) return { 
      paths: [], 
      viewBox: `0 0 ${width} ${height}`, 
      yLabels: [],
      xLabels: [],
      minY: 0,
      maxY: 100,
      legendHeight: 0
    };

    const legendHeight = showLegend ? 40 : 0;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - legendHeight;

    // Find min/max across all series
    let minY = Infinity;
    let maxY = -Infinity;
    data.forEach(point => {
      series.forEach(s => {
        const value = point.values[s.key] || 0;
        minY = Math.min(minY, value);
        maxY = Math.max(maxY, value);
      });
    });
    
    // Add some padding to y-axis
    const yPadding = (maxY - minY) * 0.1;
    minY = minY - yPadding;
    maxY = maxY + yPadding;
    const yRange = maxY - minY || 1;

    // Generate paths for each series
    const paths = series.map(s => {
      const points = data.map((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const value = point.values[s.key] || 0;
        const y = padding + (1 - (value - minY) / yRange) * chartHeight;
        return { x, y, value };
      });

      const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

      return {
        series: s,
        path: pathData,
        points
      };
    });

    // Generate Y-axis labels
    const yLabelCount = 5;
    const yLabelValues: number[] = [];
    for (let i = 0; i < yLabelCount; i++) {
      yLabelValues.push(minY + (i / (yLabelCount - 1)) * yRange);
    }

    // Generate X-axis labels
    const xLabelIndices: number[] = [];
    const maxLabels = 6;
    const step = Math.ceil(data.length / maxLabels);
    for (let i = 0; i < data.length; i += step) {
      xLabelIndices.push(i);
    }
    if (xLabelIndices[xLabelIndices.length - 1] !== data.length - 1) {
      xLabelIndices.push(data.length - 1);
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      switch (dateFormat) {
        case 'short':
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        case 'medium':
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' });
        case 'long':
          return date.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
        default:
          return dateStr;
      }
    };

    return {
      paths,
      viewBox: `0 0 ${width} ${height}`,
      yLabels: yLabelValues.reverse(),
      xLabels: xLabelIndices.map(i => ({ 
        index: i, 
        value: formatDate(data[i].date),
        x: padding + (i / (data.length - 1)) * chartWidth
      })),
      minY,
      maxY,
      legendHeight
    };
  }, [data, series, width, height, showLegend, dateFormat]);

  const [hoveredPoint, setHoveredPoint] = React.useState<{ x: number; y: number; seriesKey: string; value: number; date: string } | null>(null);

  if (!data.length || !series.length) {
    return (
      <div className={`flex items-center justify-center text-gray-400 ${className}`} style={{ height, width }}>
        No data available
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg 
        viewBox={viewBox}
        style={{ width: '100%', height: '100%' }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Grid lines */}
        {showGrid && (
          <g stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2">
            {/* Horizontal lines */}
            {yLabels.map((_, i) => (
              <line 
                key={`h-${i}`}
                x1="50" 
                y1={50 + i * ((height - 100 - legendHeight) / (yLabels.length - 1))} 
                x2={width - 50} 
                y2={50 + i * ((height - 100 - legendHeight) / (yLabels.length - 1))} 
              />
            ))}
            {/* Vertical lines */}
            {xLabels.map((label) => (
              <line 
                key={`v-${label.index}`}
                x1={label.x} 
                y1="50" 
                x2={label.x} 
                y2={height - 50 - legendHeight} 
              />
            ))}
          </g>
        )}

        {/* Y-axis labels */}
        <g fill="#6b7280" fontSize="12">
          {yLabels.map((label, i) => (
            <text
              key={i}
              x="45"
              y={50 + i * ((height - 100 - legendHeight) / (yLabels.length - 1)) + 4}
              textAnchor="end"
            >
              {label.toFixed(0)}
            </text>
          ))}
          {yAxisLabel && (
            <text
              x="20"
              y={height / 2 - legendHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 20, ${height / 2 - legendHeight / 2})`}
              fontSize="11"
              fill="#4b5563"
            >
              {yAxisLabel}
            </text>
          )}
        </g>

        {/* X-axis labels */}
        <g fill="#6b7280" fontSize="11">
          {xLabels.map((label) => (
            <text
              key={label.index}
              x={label.x}
              y={height - 35 - legendHeight}
              textAnchor="middle"
            >
              {label.value}
            </text>
          ))}
        </g>

        {/* Lines */}
        <g>
          {paths.map((pathData, index) => (
            <g key={index}>
              <path
                d={pathData.path}
                fill="none"
                stroke={pathData.series.color}
                strokeWidth="2"
                strokeDasharray={pathData.series.strokeDasharray}
                className="transition-all duration-300"
              />
              {/* Interactive points */}
              {pathData.points.map((point, pointIndex) => (
                <circle
                  key={pointIndex}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({
                    x: point.x,
                    y: point.y,
                    seriesKey: pathData.series.key,
                    value: point.value,
                    date: data[pointIndex].date
                  })}
                />
              ))}
            </g>
          ))}
        </g>

        {/* Hovered point indicator */}
        {hoveredPoint && (
          <circle
            cx={hoveredPoint.x}
            cy={hoveredPoint.y}
            r="4"
            fill={series.find(s => s.key === hoveredPoint.seriesKey)?.color || '#000'}
            stroke="white"
            strokeWidth="2"
          />
        )}

        {/* Legend */}
        {showLegend && (
          <g transform={`translate(${width / 2}, ${height - legendHeight + 10})`}>
            {series.map((s, index) => {
              const spacing = 120;
              const totalWidth = series.length * spacing;
              const x = -totalWidth / 2 + index * spacing;
              
              return (
                <g key={index} transform={`translate(${x}, 0)`}>
                  <line
                    x1="0"
                    y1="0"
                    x2="20"
                    y2="0"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeDasharray={s.strokeDasharray}
                  />
                  <text
                    x="25"
                    y="4"
                    className="text-xs fill-gray-600"
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredPoint && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 pointer-events-none z-10"
          style={{
            left: hoveredPoint.x,
            top: hoveredPoint.y - 60,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-xs font-medium text-gray-700">
            {new Date(hoveredPoint.date).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-600">
            {series.find(s => s.key === hoveredPoint.seriesKey)?.name}: {hoveredPoint.value.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
});