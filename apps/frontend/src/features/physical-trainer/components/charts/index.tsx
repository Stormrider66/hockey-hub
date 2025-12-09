// Lightweight chart components for Physical Trainer dashboard
// These replace recharts for better performance and smaller bundle size

export { LightweightLineChart } from '@/components/charts/LightweightLineChart';
export { LightweightBarChart } from '@/components/charts/LightweightBarChart';
export { LightweightPieChart } from './LightweightPieChart';
export { LightweightAreaChart } from './LightweightAreaChart';
export { LightweightRadialBar } from './LightweightRadialBar';

// Re-export with recharts-compatible names for easier migration
export { LightweightLineChart as LineChart } from '@/components/charts/LightweightLineChart';
export { LightweightBarChart as BarChart } from '@/components/charts/LightweightBarChart';
export { LightweightPieChart as PieChart } from './LightweightPieChart';
export { LightweightAreaChart as AreaChart } from './LightweightAreaChart';
export { LightweightRadialBar as RadialBarChart } from './LightweightRadialBar';

// Dummy exports for recharts components that need custom implementation
export const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100%', height: '100%' }}>{children}</div>
);

export const Tooltip = () => null; // Handled internally in lightweight components
export const Legend = () => null; // Handled internally in lightweight components
export const CartesianGrid = () => null; // Handled internally in lightweight components
export const XAxis = () => null; // Handled internally in lightweight components
export const YAxis = () => null; // Handled internally in lightweight components
export const Cell = () => null; // Handled internally in lightweight components

// Type exports for compatibility
export interface ChartData {
  name?: string;
  value: number;
  x?: string | number;
  y?: number;
  color?: string;
}