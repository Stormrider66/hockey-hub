import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Eye, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  peakRenderTime: number;
  visibleItems: number;
  totalItems: number;
  memoryUsage?: number;
}

interface VirtualizationPerformanceMonitorProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export const VirtualizationPerformanceMonitor: React.FC<VirtualizationPerformanceMonitorProps> = ({
  metrics,
  className
}) => {
  const getRenderTimeStatus = (time: number) => {
    if (time < 16.67) return 'success'; // 60 FPS
    if (time < 33.33) return 'warning'; // 30 FPS
    return 'destructive'; // Below 30 FPS
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Render Count */}
          <div className="text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Renders</p>
            <p className="text-sm font-semibold">{metrics.renderCount}</p>
          </div>

          {/* Average Render Time */}
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Avg Time</p>
            <Badge variant={getRenderTimeStatus(metrics.averageRenderTime) as any}>
              {metrics.averageRenderTime}ms
            </Badge>
          </div>

          {/* Peak Render Time */}
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Peak Time</p>
            <Badge variant={getRenderTimeStatus(metrics.peakRenderTime) as any}>
              {metrics.peakRenderTime}ms
            </Badge>
          </div>

          {/* Visible Items */}
          <div className="text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Visible</p>
            <p className="text-sm font-semibold">{metrics.visibleItems}</p>
          </div>

          {/* Total Items */}
          <div className="text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{metrics.totalItems}</p>
          </div>

          {/* Memory Usage */}
          {metrics.memoryUsage !== undefined && (
            <div className="text-center">
              <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memory</p>
              <p className="text-sm font-semibold">{metrics.memoryUsage}MB</p>
            </div>
          )}
        </div>

        {/* Performance Summary */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Rendering {((metrics.visibleItems / metrics.totalItems) * 100).toFixed(1)}% of items
            {metrics.averageRenderTime < 16.67 && (
              <span className="text-green-600 ml-2">• Excellent performance (60+ FPS)</span>
            )}
            {metrics.averageRenderTime >= 16.67 && metrics.averageRenderTime < 33.33 && (
              <span className="text-yellow-600 ml-2">• Good performance (30-60 FPS)</span>
            )}
            {metrics.averageRenderTime >= 33.33 && (
              <span className="text-red-600 ml-2">• Performance issues detected</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};