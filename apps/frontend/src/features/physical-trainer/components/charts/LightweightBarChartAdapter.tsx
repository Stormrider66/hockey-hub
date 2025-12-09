'use client';

import React from 'react';
import { LightweightBarChart } from '@/components/charts/LightweightBarChart';

interface BarProps {
  dataKey: string;
  fill?: string;
  name?: string;
}

interface LightweightBarChartAdapterProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  bars?: BarProps[];
}

export const LightweightBarChartAdapter: React.FC<LightweightBarChartAdapterProps> = ({
  data,
  width = 400,
  height = 200,
  margin,
  bars = []
}) => {
  // Transform data for lightweight chart
  const transformedData = React.useMemo(() => {
    if (!data.length || !bars.length) return [];

    // For now, we'll only support single bar (first bar)
    // TODO: Add support for grouped bars
    const primaryBar = bars[0];
    return data.map(item => ({
      name: item.name || item.x || '',
      value: item[primaryBar.dataKey] || 0,
      color: primaryBar.fill
    }));
  }, [data, bars]);

  // Calculate dimensions
  const chartHeight = typeof height === 'string' ? 200 : height;

  // For multiple bars, render them side by side
  if (bars.length > 1 && data.length > 0) {
    return (
      <div style={{ width, height, display: 'flex', gap: '8px' }}>
        {bars.map((bar, index) => {
          const barData = data.map(item => ({
            name: item.name || item.x || '',
            value: item[bar.dataKey] || 0,
            color: bar.fill
          }));

          return (
            <div key={bar.dataKey} style={{ flex: 1 }}>
              <LightweightBarChart
                data={barData}
                height={chartHeight}
                barColor={bar.fill || '#8884d8'}
                showLabels={index === 0}
                showValues={true}
              />
              {bar.name && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {bar.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <LightweightBarChart
        data={transformedData}
        height={chartHeight}
        barColor={bars[0]?.fill || '#8884d8'}
        showLabels={true}
        showValues={true}
      />
    </div>
  );
};