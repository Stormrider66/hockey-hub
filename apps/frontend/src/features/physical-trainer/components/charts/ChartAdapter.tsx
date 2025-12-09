'use client';

/**
 * Chart Adapter for Physical Trainer Dashboard
 * Phase 3.1 - Replace Heavy Charts
 * 
 * This adapter provides a unified interface that switches between
 * recharts and lightweight chart implementations based on feature flag
 */

import React from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';

// Import lightweight chart adapters
import { LightweightLineChartAdapter } from './LightweightLineChartAdapter';
import { LightweightBarChartAdapter } from './LightweightBarChartAdapter';
import { LightweightAreaChartAdapter } from './LightweightAreaChartAdapter';
import { LightweightPieChartAdapter } from './LightweightPieChartAdapter';
import {
  LightweightRadialBar,
} from './index';

// Lazy load recharts components (only loaded if feature flag is disabled)
const RechartsComponents = React.lazy(() => import('./RechartsComponents'));

// Types for chart props
export interface ChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: React.ReactNode;
}

export interface LineProps {
  type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean | object;
  name?: string;
}

export interface BarProps {
  dataKey: string;
  fill?: string;
  name?: string;
}

export interface AreaProps extends LineProps {
  fill?: string;
}

export interface PieProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
  fill?: string;
}

// Adapter components that switch based on feature flag
export const LineChart: React.FC<ChartProps> = ({ data, width, height, margin, children }) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // Extract line configurations from children
    const lines: LineProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Line) {
        lines.push(child.props as LineProps);
      }
    });

    return (
      <LightweightLineChartAdapter
        data={data}
        width={width}
        height={height}
        margin={margin}
        lines={lines}
      />
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.LineChart data={data} width={width} height={height} margin={margin}>
        {children}
      </RechartsComponents.LineChart>
    </React.Suspense>
  );
};

export const BarChart: React.FC<ChartProps> = ({ data, width, height, margin, children }) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // Extract bar configurations from children
    const bars: BarProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Bar) {
        bars.push(child.props as BarProps);
      }
    });

    return (
      <LightweightBarChartAdapter
        data={data}
        width={width}
        height={height}
        margin={margin}
        bars={bars}
      />
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.BarChart data={data} width={width} height={height} margin={margin}>
        {children}
      </RechartsComponents.BarChart>
    </React.Suspense>
  );
};

export const PieChart: React.FC<ChartProps> = ({ data, width, height, margin, children }) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // Extract pie configuration from children
    let pieProps: PieProps | null = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Pie) {
        pieProps = child.props as PieProps;
      }
    });

    return (
      <LightweightPieChartAdapter
        data={data}
        width={width}
        height={height}
        margin={margin}
        pieData={pieProps || undefined}
        children={children}
      />
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.PieChart data={data} width={width} height={height} margin={margin}>
        {children}
      </RechartsComponents.PieChart>
    </React.Suspense>
  );
};

export const AreaChart: React.FC<ChartProps> = ({ data, width, height, margin, children }) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // Extract area configurations from children
    const areas: AreaProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Area) {
        areas.push(child.props as AreaProps);
      }
    });

    return (
      <LightweightAreaChartAdapter
        data={data}
        width={width}
        height={height}
        margin={margin}
        areas={areas}
      />
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.AreaChart data={data} width={width} height={height} margin={margin}>
        {children}
      </RechartsComponents.AreaChart>
    </React.Suspense>
  );
};

export const RadialBarChart: React.FC<ChartProps> = ({ data, width, height, children }) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // For radial bar, we'll use a simplified API
    const value = data[0]?.value || 0;
    const maxValue = data[0]?.maxValue || 100;
    
    return (
      <LightweightRadialBar
        value={value}
        maxValue={maxValue}
        width={width}
        height={height}
      />
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.RadialBarChart data={data} width={width} height={height}>
        {children}
      </RechartsComponents.RadialBarChart>
    </React.Suspense>
  );
};

// ResponsiveContainer adapter
export const ResponsiveContainer: React.FC<{ children: React.ReactNode; width?: string | number; height?: string | number }> = ({ 
  children, 
  width = '100%', 
  height = '100%' 
}) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    // For lightweight charts, we need to process the children directly
    // The chart components will handle their own responsive sizing
    return (
      <div style={{ width, height, position: 'relative' }}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          // Check if this is a chart component we can handle
          const chartType = child.type;
          if (chartType === LineChart || chartType === BarChart || 
              chartType === AreaChart || chartType === PieChart || 
              chartType === RadialBarChart) {
            // Pass width and height to the chart components
            return React.cloneElement(child as React.ReactElement<any>, {
              width: width === '100%' ? undefined : width,
              height: height === '100%' ? undefined : height,
            });
          }
          
          // Skip other components (like CartesianGrid, XAxis, etc.) in lightweight mode
          return null;
        })}
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsComponents.ResponsiveContainer width={width} height={height}>
        {children}
      </RechartsComponents.ResponsiveContainer>
    </React.Suspense>
  );
};

// Child components (these are used for configuration only)
export const Line: React.FC<LineProps> = () => null;
export const Bar: React.FC<BarProps> = () => null;
export const Area: React.FC<AreaProps> = () => null;
export const Pie: React.FC<PieProps> = () => null;

// Other recharts components that are handled internally by lightweight charts
export const XAxis: React.FC<any> = () => null;
export const YAxis: React.FC<any> = () => null;
export const CartesianGrid: React.FC<any> = () => null;
export const Tooltip: React.FC<any> = () => null;
export const Legend: React.FC<any> = () => null;
export const Cell: React.FC<any> = () => null;
export const RadialBar: React.FC<any> = () => null;

// Utility function to check if lightweight charts are enabled
export const useLightweightCharts = () => {
  return useFeatureFlag('LIGHTWEIGHT_CHARTS');
};