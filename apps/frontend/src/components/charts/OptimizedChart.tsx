import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  AreaChart, 
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineProps,
  AreaProps,
  BarProps
} from 'recharts';
import { optimizeChartData } from '@/utils/chartOptimization';
import { Loader2 } from 'lucide-react';

export interface OptimizedChartProps {
  data: any[];
  type: 'line' | 'area' | 'bar';
  xKey: string;
  yKeys: string[];
  height?: number;
  maxDataPoints?: number;
  optimizationMethod?: 'lttb' | 'uniform' | 'aggregate';
  aggregateInterval?: 'hour' | 'day' | 'week' | 'month';
  loading?: boolean;
  colors?: string[];
  strokeWidth?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
  onDataOptimized?: (originalSize: number, optimizedSize: number) => void;
}

const OptimizedChart = React.memo(({
  data,
  type,
  xKey,
  yKeys,
  height = 300,
  maxDataPoints = 100,
  optimizationMethod = 'lttb',
  aggregateInterval = 'day',
  loading = false,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  strokeWidth = 2,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  onDataOptimized
}: OptimizedChartProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Optimize data with memoization
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    setIsOptimizing(true);
    
    // Use requestIdleCallback for large datasets
    if (data.length > 1000 && 'requestIdleCallback' in window) {
      let result: any[] = [];
      
      (window as any).requestIdleCallback(() => {
        result = optimizeChartData(data, maxDataPoints, {
          xKey,
          yKey: yKeys[0], // Use first yKey for LTTB
          method: optimizationMethod,
          aggregateInterval,
          valueKeys: yKeys
        });
        
        setIsOptimizing(false);
        
        if (onDataOptimized) {
          onDataOptimized(data.length, result.length);
        }
      });
      
      return result;
    }
    
    const result = optimizeChartData(data, maxDataPoints, {
      xKey,
      yKey: yKeys[0],
      method: optimizationMethod,
      aggregateInterval,
      valueKeys: yKeys
    });
    
    setIsOptimizing(false);
    
    if (onDataOptimized) {
      onDataOptimized(data.length, result.length);
    }
    
    return result;
  }, [data, maxDataPoints, xKey, yKeys, optimizationMethod, aggregateInterval, onDataOptimized]);

  // Custom tooltip with performance optimization
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="text-sm font-medium mb-2">
          {xAxisFormatter ? xAxisFormatter(label) : label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {tooltipFormatter ? tooltipFormatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }, [xAxisFormatter, tooltipFormatter]);

  // Show loading state
  if (loading || isOptimizing) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No data state
  if (!optimizedData || optimizedData.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={optimizedData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickFormatter={xAxisFormatter}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={yAxisFormatter}
        />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        
        {yKeys.map((key, index) => {
          const props: any = {
            key,
            dataKey: key,
            stroke: colors[index % colors.length],
            strokeWidth,
            dot: false, // Disable dots for performance
            animationDuration: 300
          };
          
          if (type === 'area') {
            props.fill = colors[index % colors.length];
            props.fillOpacity = 0.1;
          } else if (type === 'bar') {
            props.fill = colors[index % colors.length];
          }
          
          return React.createElement(DataComponent, props);
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
});

OptimizedChart.displayName = 'OptimizedChart';

export default OptimizedChart;