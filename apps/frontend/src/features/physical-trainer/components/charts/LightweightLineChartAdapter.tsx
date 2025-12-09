'use client';

import React from 'react';
import { LightweightLineChart } from '@/components/charts/LightweightLineChart';

interface LineProps {
  type?: 'monotone' | 'linear';
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | object;
  name?: string;
}

interface LightweightLineChartAdapterProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  lines?: LineProps[];
}

export const LightweightLineChartAdapter: React.FC<LightweightLineChartAdapterProps> = ({
  data,
  width = 400,
  height = 200,
  margin,
  lines = []
}) => {
  // Transform data for lightweight chart - only supports single line for now
  const transformedData = React.useMemo(() => {
    if (!data.length || !lines.length) return [];

    const primaryLine = lines[0];
    return data.map(item => ({
      x: item.date || item.name || item.x,
      y: item[primaryLine.dataKey] || 0
    }));
  }, [data, lines]);

  // Calculate dimensions
  const chartWidth = typeof width === 'string' ? 400 : width;
  const chartHeight = typeof height === 'string' ? 200 : height;

  // For multiple lines, we'll render multiple charts overlaid
  if (lines.length > 1) {
    return (
      <div style={{ width, height, position: 'relative' }}>
        {lines.map((line, index) => {
          const lineData = data.map(item => ({
            x: item.date || item.name || item.x,
            y: item[line.dataKey] || 0
          }));

          return (
            <div 
              key={line.dataKey} 
              style={{ 
                position: index === 0 ? 'relative' : 'absolute', 
                top: 0, 
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              <LightweightLineChart
                data={lineData}
                width={chartWidth}
                height={chartHeight}
                color={line.stroke || '#8884d8'}
                strokeWidth={line.strokeWidth || 2}
                showDots={line.dot !== false}
                showGrid={index === 0} // Only show grid for first chart
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <LightweightLineChart
        data={transformedData}
        width={chartWidth}
        height={chartHeight}
        color={lines[0]?.stroke || '#8884d8'}
        strokeWidth={lines[0]?.strokeWidth || 2}
        showDots={lines[0]?.dot !== false}
        showGrid={true}
      />
    </div>
  );
};