'use client';

import React, { useMemo } from 'react';

interface AreaChartData {
  x: string | number;
  y: number;
  y2?: number; // For stacked areas
}

interface LightweightAreaChartProps {
  data: AreaChartData[];
  height?: number;
  width?: number;
  color?: string;
  secondaryColor?: string;
  opacity?: number;
  showGrid?: boolean;
  showDots?: boolean;
  gradient?: boolean;
  className?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const LightweightAreaChart = React.memo(function LightweightAreaChart({
  data,
  height = 200,
  width = 400,
  color = '#3b82f6',
  secondaryColor = '#8b5cf6',
  opacity = 0.3,
  showGrid = true,
  showDots = false,
  gradient = true,
  className = '',
  yAxisLabel,
  xAxisLabel
}: LightweightAreaChartProps) {
  const { paths, viewBox, yLabels, xLabels, gradientId } = useMemo(() => {
    if (!data.length) return { 
      paths: { area: '', line: '', area2: '', line2: '' }, 
      viewBox: `0 0 ${width} ${height}`, 
      yLabels: [],
      xLabels: [],
      gradientId: ''
    };

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate min/max for y values
    const yValues = data.flatMap(d => [d.y, d.y2].filter(v => v !== undefined)) as number[];
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;

    // Generate SVG path for primary area
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + (1 - (point.y - minY) / yRange) * chartHeight;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    const areaPath = [
      `M ${points[0].x} ${padding + chartHeight}`,
      ...points.map(p => `L ${p.x} ${p.y}`),
      `L ${points[points.length - 1].x} ${padding + chartHeight}`,
      'Z'
    ].join(' ');

    // Generate path for secondary area if y2 values exist
    let area2Path = '';
    let line2Path = '';
    if (data.some(d => d.y2 !== undefined)) {
      const points2 = data.map((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + (1 - ((point.y2 || 0) - minY) / yRange) * chartHeight;
        return { x, y };
      });

      line2Path = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      
      area2Path = [
        `M ${points2[0].x} ${padding + chartHeight}`,
        ...points2.map(p => `L ${p.x} ${p.y}`),
        `L ${points2[points2.length - 1].x} ${padding + chartHeight}`,
        'Z'
      ].join(' ');
    }

    // Generate Y-axis labels
    const yLabelCount = 5;
    const yLabelValues: number[] = [];
    for (let i = 0; i < yLabelCount; i++) {
      yLabelValues.push(minY + (i / (yLabelCount - 1)) * yRange);
    }

    // Generate X-axis labels
    const xLabelIndices: number[] = [];
    const maxLabels = 5;
    const step = Math.ceil(data.length / maxLabels);
    for (let i = 0; i < data.length; i += step) {
      xLabelIndices.push(i);
    }
    if (xLabelIndices[xLabelIndices.length - 1] !== data.length - 1) {
      xLabelIndices.push(data.length - 1);
    }

    return {
      paths: { area: areaPath, line: linePath, area2: area2Path, line2: line2Path },
      viewBox: `0 0 ${width} ${height}`,
      yLabels: yLabelValues.reverse(),
      xLabels: xLabelIndices.map(i => ({ index: i, value: data[i].x })),
      gradientId
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
      <defs>
        {gradient && (
          <>
            <linearGradient id={`${gradientId}-primary`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={opacity} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-secondary`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity={opacity} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>
          </>
        )}
      </defs>

      {/* Grid lines */}
      {showGrid && (
        <g stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2">
          {yLabels.map((_, i) => (
            <line 
              key={`h-${i}`}
              x1="40" 
              y1={40 + i * ((height - 80) / (yLabels.length - 1))} 
              x2={width - 40} 
              y2={40 + i * ((height - 80) / (yLabels.length - 1))} 
            />
          ))}
          {xLabels.map((label) => {
            const x = 40 + (label.index / (data.length - 1)) * (width - 80);
            return (
              <line 
                key={`v-${label.index}`}
                x1={x} 
                y1="40" 
                x2={x} 
                y2={height - 40} 
              />
            );
          })}
        </g>
      )}

      {/* Y-axis labels */}
      <g fill="#6b7280" fontSize="12">
        {yLabels.map((label, i) => (
          <text
            key={i}
            x="35"
            y={40 + i * ((height - 80) / (yLabels.length - 1)) + 4}
            textAnchor="end"
          >
            {label.toFixed(1)}
          </text>
        ))}
        {yAxisLabel && (
          <text
            x="15"
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
            fontSize="10"
            fill="#4b5563"
          >
            {yAxisLabel}
          </text>
        )}
      </g>

      {/* X-axis labels */}
      <g fill="#6b7280" fontSize="12">
        {xLabels.map((label) => {
          const x = 40 + (label.index / (data.length - 1)) * (width - 80);
          return (
            <text
              key={label.index}
              x={x}
              y={height - 20}
              textAnchor="middle"
            >
              {label.value}
            </text>
          );
        })}
        {xAxisLabel && (
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="10"
            fill="#4b5563"
          >
            {xAxisLabel}
          </text>
        )}
      </g>

      {/* Secondary area (if exists) */}
      {paths.area2 && (
        <>
          <path
            d={paths.area2}
            fill={gradient ? `url(#${gradientId}-secondary)` : secondaryColor}
            fillOpacity={gradient ? 1 : opacity}
          />
          <path
            d={paths.line2}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
          />
        </>
      )}

      {/* Primary area */}
      <path
        d={paths.area}
        fill={gradient ? `url(#${gradientId}-primary)` : color}
        fillOpacity={gradient ? 1 : opacity}
      />
      <path
        d={paths.line}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />

      {/* Dots */}
      {showDots && data.map((point, index) => {
        const x = 40 + (index / (data.length - 1)) * (width - 80);
        const yValues = data.flatMap(d => [d.y, d.y2].filter(v => v !== undefined)) as number[];
        const minY = Math.min(...yValues, 0);
        const maxY = Math.max(...yValues);
        const yRange = maxY - minY || 1;
        
        return (
          <g key={index}>
            <circle
              cx={x}
              cy={40 + (1 - (point.y - minY) / yRange) * (height - 80)}
              r="3"
              fill={color}
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>{`${point.x}: ${point.y}`}</title>
            </circle>
            {point.y2 !== undefined && (
              <circle
                cx={x}
                cy={40 + (1 - (point.y2 - minY) / yRange) * (height - 80)}
                r="3"
                fill={secondaryColor}
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>{`${point.x}: ${point.y2}`}</title>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
});