/**
 * Chart optimization utilities for handling large datasets
 */

export interface DataPoint {
  [key: string]: any;
}

export interface AggregationOptions {
  method: 'average' | 'max' | 'min' | 'first' | 'last';
  groupBy?: string;
}

export interface SamplingOptions {
  method: 'uniform' | 'lttb' | 'downsample';
  targetPoints: number;
}

/**
 * Implements Largest Triangle Three Buckets (LTTB) algorithm for downsampling
 * This preserves the visual characteristics of the data while reducing points
 */
export function lttbDownsample(data: DataPoint[], targetPoints: number, xKey: string, yKey: string): DataPoint[] {
  if (data.length <= targetPoints) return data;
  
  const bucketSize = (data.length - 2) / (targetPoints - 2);
  const downsampled: DataPoint[] = [];
  
  // Always keep the first point
  downsampled.push(data[0]);
  
  for (let i = 1; i < targetPoints - 1; i++) {
    const startIdx = Math.floor((i - 1) * bucketSize) + 1;
    const endIdx = Math.floor(i * bucketSize) + 1;
    
    // Calculate the average point for the next bucket
    const nextBucketStart = Math.floor(i * bucketSize) + 1;
    const nextBucketEnd = Math.floor((i + 1) * bucketSize) + 1;
    
    let avgX = 0;
    let avgY = 0;
    const nextBucketLength = Math.min(nextBucketEnd, data.length) - nextBucketStart;
    
    for (let j = nextBucketStart; j < Math.min(nextBucketEnd, data.length); j++) {
      avgX += data[j][xKey];
      avgY += data[j][yKey];
    }
    
    avgX /= nextBucketLength;
    avgY /= nextBucketLength;
    
    // Find the point with the largest triangle area
    let maxArea = -1;
    let selectedPoint = data[startIdx];
    
    for (let j = startIdx; j < endIdx && j < data.length; j++) {
      const area = Math.abs(
        (downsampled[downsampled.length - 1][xKey] - avgX) * (data[j][yKey] - downsampled[downsampled.length - 1][yKey]) -
        (downsampled[downsampled.length - 1][xKey] - data[j][xKey]) * (avgY - downsampled[downsampled.length - 1][yKey])
      );
      
      if (area > maxArea) {
        maxArea = area;
        selectedPoint = data[j];
      }
    }
    
    downsampled.push(selectedPoint);
  }
  
  // Always keep the last point
  downsampled.push(data[data.length - 1]);
  
  return downsampled;
}

/**
 * Uniform sampling - takes every nth point
 */
export function uniformSample(data: DataPoint[], targetPoints: number): DataPoint[] {
  if (data.length <= targetPoints) return data;
  
  const step = Math.ceil(data.length / targetPoints);
  const sampled: DataPoint[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
}

/**
 * Time-based aggregation for time series data
 */
export function aggregateByTime(
  data: DataPoint[],
  timeKey: string,
  valueKeys: string[],
  interval: 'hour' | 'day' | 'week' | 'month',
  aggregation: AggregationOptions = { method: 'average' }
): DataPoint[] {
  const buckets = new Map<string, DataPoint[]>();
  
  // Group data by time interval
  data.forEach(point => {
    const date = new Date(point[timeKey]);
    let bucketKey: string;
    
    switch (interval) {
      case 'hour':
        bucketKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        bucketKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const week = getWeekNumber(date);
        bucketKey = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
        bucketKey = `${date.getFullYear()}-${date.getMonth()}`;
        break;
    }
    
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(point);
  });
  
  // Aggregate each bucket
  const aggregated: DataPoint[] = [];
  
  buckets.forEach((points, bucketKey) => {
    const aggregatedPoint: DataPoint = {
      [timeKey]: points[0][timeKey] // Use first timestamp in bucket
    };
    
    valueKeys.forEach(key => {
      const values = points.map(p => p[key]).filter(v => v !== null && v !== undefined);
      
      switch (aggregation.method) {
        case 'average':
          aggregatedPoint[key] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'max':
          aggregatedPoint[key] = Math.max(...values);
          break;
        case 'min':
          aggregatedPoint[key] = Math.min(...values);
          break;
        case 'first':
          aggregatedPoint[key] = values[0];
          break;
        case 'last':
          aggregatedPoint[key] = values[values.length - 1];
          break;
      }
    });
    
    aggregated.push(aggregatedPoint);
  });
  
  // Sort by time
  return aggregated.sort((a, b) => 
    new Date(a[timeKey]).getTime() - new Date(b[timeKey]).getTime()
  );
}

/**
 * Optimizes chart data based on size and type
 */
export function optimizeChartData(
  data: DataPoint[],
  maxPoints: number = 100,
  options?: {
    xKey?: string;
    yKey?: string;
    method?: 'lttb' | 'uniform' | 'aggregate';
    aggregateInterval?: 'hour' | 'day' | 'week' | 'month';
    valueKeys?: string[];
  }
): DataPoint[] {
  if (data.length <= maxPoints) return data;
  
  const {
    xKey = 'x',
    yKey = 'y',
    method = 'lttb',
    aggregateInterval = 'day',
    valueKeys = [yKey]
  } = options || {};
  
  switch (method) {
    case 'lttb':
      return lttbDownsample(data, maxPoints, xKey, yKey);
    case 'uniform':
      return uniformSample(data, maxPoints);
    case 'aggregate':
      return aggregateByTime(data, xKey, valueKeys, aggregateInterval);
    default:
      return uniformSample(data, maxPoints);
  }
}

/**
 * Helper function to get week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Caps a progress value at 100%
 */
export function capProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Formats large numbers for display
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}