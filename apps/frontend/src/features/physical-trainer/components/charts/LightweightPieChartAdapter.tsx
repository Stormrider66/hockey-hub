'use client';

import React from 'react';
import { LightweightPieChart } from './LightweightPieChart';

interface PieProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
  fill?: string;
}

interface LightweightPieChartAdapterProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  pieData?: PieProps;
  children?: React.ReactNode;
}

export const LightweightPieChartAdapter: React.FC<LightweightPieChartAdapterProps> = ({
  data,
  width = 400,
  height = 300,
  margin,
  pieData,
  children
}) => {
  // Extract Pie configuration from children if not provided directly
  let pieConfig = pieData;
  if (!pieConfig && children) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.dataKey) {
        pieConfig = child.props as PieProps;
      }
    });
  }

  // Transform data for lightweight chart
  const transformedData = React.useMemo(() => {
    // If no pieConfig, try to use data directly
    if (!pieConfig && data && data.length > 0) {
      // Assume data already has the right format
      return data.map((item, index) => ({
        name: item.name || `Item ${index + 1}`,
        value: item.value || 0,
        color: item.color
      }));
    }
    
    if (!pieConfig) return [];
    
    const chartData = pieConfig.data || data;
    const nameKey = pieConfig.nameKey || 'name';
    const dataKey = pieConfig.dataKey || 'value';
    
    return chartData.map((item, index) => ({
      name: item[nameKey] || item.name || `Item ${index + 1}`,
      value: item[dataKey] || item.value || 0,
      color: item.color // Will be handled by LightweightPieChart's default colors if not provided
    }));
  }, [data, pieConfig]);

  // Calculate dimensions
  const chartWidth = typeof width === 'string' ? 400 : width;
  const chartHeight = typeof height === 'string' ? 300 : height;

  return (
    <div style={{ width, height }}>
      <LightweightPieChart
        data={transformedData}
        width={chartWidth}
        height={chartHeight}
        innerRadius={pieConfig?.innerRadius}
        showLabels={true}
        showLegend={true}
      />
    </div>
  );
};