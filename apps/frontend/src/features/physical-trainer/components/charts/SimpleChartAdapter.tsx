'use client';

/**
 * Simplified Chart Adapter for Physical Trainer Dashboard
 * This version creates complete chart components that can be used as drop-in replacements
 */

import React from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';

// Import lightweight adapters
import { LightweightLineChartAdapter } from './LightweightLineChartAdapter';
import { LightweightBarChartAdapter } from './LightweightBarChartAdapter';
import { LightweightAreaChartAdapter } from './LightweightAreaChartAdapter';
import { LightweightPieChartAdapter } from './LightweightPieChartAdapter';
import { LightweightRadialBar } from './LightweightRadialBar';

// Chart configuration types
interface BaseChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

interface LineChartConfig extends BaseChartProps {
  lines: Array<{
    dataKey: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    name?: string;
  }>;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

interface BarChartConfig extends BaseChartProps {
  bars: Array<{
    dataKey: string;
    fill?: string;
    name?: string;
  }>;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

interface AreaChartConfig extends BaseChartProps {
  areas: Array<{
    dataKey: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    name?: string;
  }>;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

interface PieChartConfig extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
}

interface RadialBarChartConfig extends BaseChartProps {
  dataKey: string;
  maxValue?: number;
  fill?: string;
}

// Simple wrapper components that handle the switching
export const SimpleLineChart: React.FC<LineChartConfig> = (props) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    return <LightweightLineChartAdapter {...props} />;
  }

  // Lazy load recharts
  const RechartsLineChart = React.lazy(() => 
    import('recharts').then(mod => ({
      default: () => {
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;
        return (
          <ResponsiveContainer width={props.width || '100%'} height={props.height || 300}>
            <LineChart data={props.data} margin={props.margin}>
              {props.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="date" />
              <YAxis />
              {props.showTooltip !== false && <Tooltip />}
              {props.showLegend !== false && <Legend />}
              {props.lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke || '#8884d8'}
                  strokeWidth={line.strokeWidth}
                  strokeDasharray={line.strokeDasharray}
                  name={line.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsLineChart />
    </React.Suspense>
  );
};

export const SimpleBarChart: React.FC<BarChartConfig> = (props) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    return <LightweightBarChartAdapter {...props} />;
  }

  // Lazy load recharts
  const RechartsBarChart = React.lazy(() => 
    import('recharts').then(mod => ({
      default: () => {
        const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;
        return (
          <ResponsiveContainer width={props.width || '100%'} height={props.height || 300}>
            <BarChart data={props.data} margin={props.margin}>
              {props.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              {props.showTooltip !== false && <Tooltip />}
              {props.showLegend !== false && <Legend />}
              {props.bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill || '#8884d8'}
                  name={bar.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsBarChart />
    </React.Suspense>
  );
};

export const SimpleAreaChart: React.FC<AreaChartConfig> = (props) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    return <LightweightAreaChartAdapter {...props} />;
  }

  // Lazy load recharts
  const RechartsAreaChart = React.lazy(() => 
    import('recharts').then(mod => ({
      default: () => {
        const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod;
        return (
          <ResponsiveContainer width={props.width || '100%'} height={props.height || 300}>
            <AreaChart data={props.data} margin={props.margin}>
              {props.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="date" />
              <YAxis />
              {props.showTooltip !== false && <Tooltip />}
              {props.showLegend !== false && <Legend />}
              {props.areas.map((area, index) => (
                <Area
                  key={area.dataKey}
                  type="monotone"
                  dataKey={area.dataKey}
                  stroke={area.stroke || '#8884d8'}
                  fill={area.fill || '#8884d8'}
                  fillOpacity={area.fillOpacity || 0.6}
                  name={area.name}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsAreaChart />
    </React.Suspense>
  );
};

export const SimplePieChart: React.FC<PieChartConfig> = (props) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    return <LightweightPieChartAdapter data={props.data} width={props.width} height={props.height} />;
  }

  // Lazy load recharts
  const RechartsPieChart = React.lazy(() => 
    import('recharts').then(mod => ({
      default: () => {
        const { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } = mod;
        const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
        
        return (
          <ResponsiveContainer width={props.width || '100%'} height={props.height || 300}>
            <PieChart>
              <Pie
                data={props.data}
                dataKey={props.dataKey}
                nameKey={props.nameKey || 'name'}
                cx="50%"
                cy="50%"
                innerRadius={props.innerRadius}
                outerRadius={props.outerRadius || 80}
                fill="#8884d8"
              >
                {props.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {props.showTooltip !== false && <Tooltip />}
              {props.showLegend !== false && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsPieChart />
    </React.Suspense>
  );
};

export const SimpleRadialBarChart: React.FC<RadialBarChartConfig> = (props) => {
  const useLightweight = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  if (useLightweight) {
    const value = props.data[0]?.[props.dataKey] || 0;
    const maxValue = props.maxValue || 100;
    
    return (
      <LightweightRadialBar
        value={value}
        maxValue={maxValue}
        width={typeof props.width === 'string' ? undefined : props.width}
        height={typeof props.height === 'string' ? undefined : props.height}
      />
    );
  }

  // Lazy load recharts
  const RechartsRadialBarChart = React.lazy(() => 
    import('recharts').then(mod => ({
      default: () => {
        const { RadialBarChart, RadialBar, ResponsiveContainer } = mod;
        return (
          <ResponsiveContainer width={props.width || '100%'} height={props.height || 300}>
            <RadialBarChart data={props.data}>
              <RadialBar dataKey={props.dataKey} fill={props.fill || '#8884d8'} />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      }
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <RechartsRadialBarChart />
    </React.Suspense>
  );
};