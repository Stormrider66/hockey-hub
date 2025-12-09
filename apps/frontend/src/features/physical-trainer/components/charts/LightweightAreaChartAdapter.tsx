'use client';

import React from 'react';
import { LightweightAreaChart } from './LightweightAreaChart';

interface AreaProps {
  type?: 'monotone' | 'linear';
  dataKey: string;
  stroke?: string;
  fill?: string;
  fillOpacity?: number;
  name?: string;
}

interface LightweightAreaChartAdapterProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  areas?: AreaProps[];
}

export const LightweightAreaChartAdapter: React.FC<LightweightAreaChartAdapterProps> = ({
  data,
  width = 400,
  height = 200,
  margin,
  areas = []
}) => {
  // Transform data for lightweight chart
  const transformedData = React.useMemo(() => {
    if (!data.length || !areas.length) return [];

    return data.map(item => {
      const transformed: any = {
        x: item.date || item.name || item.x,
        y: item[areas[0]?.dataKey] || 0
      };

      // Support secondary area
      if (areas[1]) {
        transformed.y2 = item[areas[1].dataKey] || 0;
      }

      return transformed;
    });
  }, [data, areas]);

  // Calculate dimensions
  const chartWidth = typeof width === 'string' ? 400 : width;
  const chartHeight = typeof height === 'string' ? 200 : height;

  return (
    <div style={{ width, height }}>
      <LightweightAreaChart
        data={transformedData}
        width={chartWidth}
        height={chartHeight}
        color={areas[0]?.stroke || areas[0]?.fill || '#8884d8'}
        secondaryColor={areas[1]?.stroke || areas[1]?.fill || '#82ca9d'}
        opacity={areas[0]?.fillOpacity || 0.6}
        showGrid={true}
        gradient={true}
      />
    </div>
  );
};