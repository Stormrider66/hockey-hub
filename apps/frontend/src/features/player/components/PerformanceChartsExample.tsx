import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SafeProgress } from '@/components/ui/SafeProgress';
import OptimizedChart from '@/components/charts/OptimizedChart';
import VirtualizedChart from '@/components/charts/VirtualizedChart';
import { useWellnessChartData } from '@/hooks/useWellnessChartData';
import { useDebouncedChartData } from '@/hooks/useDebouncedChartData';

/**
 * Example component demonstrating all performance optimizations
 */
const PerformanceChartsExample: React.FC = () => {
  const [dataSize, setDataSize] = useState(100);
  
  // Generate sample data
  const sampleData = useMemo(() => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dataSize);
    
    for (let i = 0; i < dataSize; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString(),
        performance: 50 + Math.random() * 50 + Math.sin(i / 10) * 10,
        teamAvg: 60 + Math.random() * 20,
        energy: Math.random() * 10,
        wellness: Math.random() * 10,
        effort: 20 + Math.random() * 80
      });
    }
    
    return data;
  }, [dataSize]);

  // Use optimized hooks
  const { data: optimizedData, originalSize, optimizedSize } = useWellnessChartData(sampleData, {
    maxDataPoints: 100,
    optimizationMethod: 'lttb',
    xKey: 'date',
    yKey: 'performance'
  });

  // Debounce data for smooth updates
  const debouncedData = useDebouncedChartData(optimizedData, 300);

  // Example progress values that might exceed 100%
  const testResults = [
    { name: 'Sprint Speed', value: 105, goal: 100 },
    { name: 'Jump Height', value: 68, goal: 65 },
    { name: 'Strength', value: 145, goal: 120 },
    { name: 'Endurance', value: 92, goal: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Data size controls */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Chart Optimization Demo</CardTitle>
          <CardDescription>
            Demonstrating chart optimizations for large datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span>Data points:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDataSize(100)}
            >
              100
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDataSize(500)}
            >
              500
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDataSize(1000)}
            >
              1,000
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDataSize(5000)}
            >
              5,000
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Original: {originalSize} points → Optimized: {optimizedSize} points 
            ({originalSize > 0 ? Math.round((1 - optimizedSize/originalSize) * 100) : 0}% reduction)
          </div>
        </CardContent>
      </Card>

      {/* Safe Progress Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Safe Progress Components</CardTitle>
          <CardDescription>
            Progress bars that handle values exceeding 100%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResults.map((test) => (
            <div key={test.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{test.name}</span>
                <span className="font-medium">
                  {test.value}/{test.goal} ({Math.round((test.value/test.goal) * 100)}%)
                </span>
              </div>
              <SafeProgress
                value={test.value}
                max={test.goal}
                showOverflow={true}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optimized Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Optimized Chart (≤1000 points)</CardTitle>
          <CardDescription>
            Uses LTTB algorithm for intelligent downsampling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataSize <= 1000 ? (
            <OptimizedChart
              data={debouncedData}
              type="line"
              xKey="date"
              yKeys={['performance', 'teamAvg']}
              height={300}
              maxDataPoints={100}
              colors={['#3b82f6', '#94a3b8']}
              xAxisFormatter={(value) => new Date(value).toLocaleDateString()}
              yAxisFormatter={(value) => Math.round(value)}
              tooltipFormatter={(value) => `${Math.round(value)}%`}
              onDataOptimized={(original, optimized) => {
                console.log(`Chart optimized: ${original} → ${optimized} points`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Dataset too large. Use virtualized chart below.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Virtualized Chart for Large Datasets */}
      {dataSize > 1000 && (
        <Card>
          <CardHeader>
            <CardTitle>Virtualized Chart (>1000 points)</CardTitle>
            <CardDescription>
              Windowed rendering with pagination and zoom controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VirtualizedChart
              data={sampleData}
              type="line"
              xKey="date"
              yKeys={['performance', 'teamAvg', 'effort']}
              height={400}
              windowSize={200}
              pageSize={100}
              maxPointsPerWindow={100}
              enableZoom={true}
              enablePagination={true}
              colors={['#3b82f6', '#94a3b8', '#10b981']}
              xAxisFormatter={(value) => new Date(value).toLocaleDateString()}
              yAxisFormatter={(value) => Math.round(value)}
              tooltipFormatter={(value) => `${Math.round(value)}%`}
            />
          </CardContent>
        </Card>
      )}

      {/* Multi-metric Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Metric Performance</CardTitle>
          <CardDescription>
            Multiple data series with optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OptimizedChart
            data={optimizedData}
            type="area"
            xKey="date"
            yKeys={['energy', 'wellness', 'effort']}
            height={300}
            maxDataPoints={50}
            optimizationMethod="aggregate"
            aggregateInterval="day"
            colors={['#6366f1', '#10b981', '#f59e0b']}
            xAxisFormatter={(value) => new Date(value).toLocaleDateString()}
            yAxisFormatter={(value) => value.toFixed(1)}
            showGrid={true}
            showLegend={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChartsExample;