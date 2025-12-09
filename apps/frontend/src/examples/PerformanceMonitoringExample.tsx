import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { measurePerformance, withPerformanceMeasure, measureBlock, PerformanceTimer } from '@/utils/performance';
import { useRenderTime, withRenderTracking, useBatchRenderTracking } from '@/hooks/useRenderTime';
import { withPerformanceMonitoring } from '@/components/hoc/withPerformanceMonitoring';
import { PerformanceMonitor } from '@/services/performance';

// Example 1: Using the useRenderTime hook
const ComponentWithRenderTracking: React.FC = () => {
  useRenderTime('ComponentWithRenderTracking', {
    threshold: 16,
    logToConsole: true
  });

  const [count, setCount] = useState(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component with Render Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Count: {count}</p>
        <Button onClick={() => setCount(c => c + 1)}>Increment</Button>
      </CardContent>
    </Card>
  );
};

// Example 2: Using the withRenderTracking HOC
const SimpleComponent: React.FC<{ title: string }> = ({ title }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p>This component is wrapped with render tracking</p>
    </CardContent>
  </Card>
);

const TrackedSimpleComponent = withRenderTracking(SimpleComponent, 'SimpleComponent');

// Example 3: Using the withPerformanceMonitoring HOC
const ExpensiveComponent: React.FC = () => {
  const [data, setData] = useState<number[]>([]);

  const generateData = () => {
    // Simulate expensive operation
    const newData = Array.from({ length: 10000 }, (_, i) => Math.random() * i);
    setData(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expensive Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Data points: {data.length}</p>
        <Button onClick={generateData}>Generate Data</Button>
      </CardContent>
    </Card>
  );
};

const MonitoredExpensiveComponent = withPerformanceMonitoring(ExpensiveComponent, {
  componentName: 'ExpensiveComponent',
  trackRender: true,
  trackMount: true,
  slowThreshold: 50
});

// Example 4: Class with decorator
class DataService {
  @measurePerformance
  async fetchData(id: string): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, data: 'example' };
  }

  @measurePerformance
  async processData(data: any[]): Promise<any[]> {
    // Simulate heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));
    return data.map(item => ({ ...item, processed: true }));
  }
}

// Example 5: Using performance utilities
const PerformanceUtilitiesExample: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);

  const runExamples = async () => {
    const newResults: string[] = [];

    // Example: withPerformanceMeasure
    const timedFetch = withPerformanceMeasure(
      async (url: string) => {
        const response = await fetch(url);
        return response.json();
      },
      'fetchUserData'
    );

    // Example: measureBlock
    const blockResult = await measureBlock(
      'dataProcessing',
      () => {
        // Simulate processing
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.random();
        }
        return sum;
      },
      { operation: 'sum', iterations: 1000000 }
    );
    newResults.push(`Block result: ${blockResult}`);

    // Example: PerformanceTimer
    const timer = new PerformanceTimer('multiStepOperation');
    
    // Step 1
    await new Promise(resolve => setTimeout(resolve, 50));
    timer.mark('step1-complete');
    
    // Step 2
    await new Promise(resolve => setTimeout(resolve, 100));
    timer.mark('step2-complete');
    
    // Step 3
    await new Promise(resolve => setTimeout(resolve, 75));
    timer.mark('step3-complete');
    
    const totalTime = timer.end();
    const summary = timer.summary();
    
    newResults.push(`Total time: ${totalTime.toFixed(2)}ms`);
    summary.forEach(({ mark, elapsed }) => {
      newResults.push(`${mark}: ${elapsed.toFixed(2)}ms`);
    });

    // Example: Custom marks
    PerformanceMonitor.mark('custom-operation-start');
    await new Promise(resolve => setTimeout(resolve, 200));
    PerformanceMonitor.mark('custom-operation-end');
    const customDuration = PerformanceMonitor.measure(
      'custom-operation',
      'custom-operation-start',
      'custom-operation-end'
    );
    if (customDuration) {
      newResults.push(`Custom operation: ${customDuration.toFixed(2)}ms`);
    }

    setResults(newResults);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Utilities Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runExamples}>Run Performance Tests</Button>
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Results:</h4>
            {results.map((result, idx) => (
              <p key={idx} className="text-sm font-mono">{result}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Example 6: List with batch render tracking
const LargeList: React.FC = () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  
  useBatchRenderTracking('LargeList', items.length, {
    threshold: 100,
    logToConsole: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Large List (Batch Tracking)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-auto">
          {items.map(item => (
            <div key={item.id} className="py-1">
              {item.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main example component
export const PerformanceMonitoringExample: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Performance Monitoring Examples</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ComponentWithRenderTracking />
        <TrackedSimpleComponent title="HOC Tracked Component" />
        <MonitoredExpensiveComponent />
        <PerformanceUtilitiesExample />
        <LargeList />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.open('/admin/performance', '_blank')}
            variant="outline"
          >
            Open Performance Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitoringExample;