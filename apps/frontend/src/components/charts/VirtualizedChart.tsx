import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedChart from './OptimizedChart';
import { optimizeChartData } from '@/utils/chartOptimization';

export interface VirtualizedChartProps {
  data: any[];
  type: 'line' | 'area' | 'bar';
  xKey: string;
  yKeys: string[];
  height?: number;
  windowSize?: number;
  pageSize?: number;
  maxPointsPerWindow?: number;
  enableZoom?: boolean;
  enablePagination?: boolean;
  colors?: string[];
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any) => string;
}

const VirtualizedChart: React.FC<VirtualizedChartProps> = ({
  data,
  type,
  xKey,
  yKeys,
  height = 400,
  windowSize = 100,
  pageSize = 50,
  maxPointsPerWindow = 100,
  enableZoom = true,
  enablePagination = true,
  colors,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [windowOffset, setWindowOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate window boundaries
  const effectiveWindowSize = Math.floor(windowSize / zoomLevel);
  const startIndex = Math.max(0, currentPage * pageSize + windowOffset);
  const endIndex = Math.min(data.length, startIndex + effectiveWindowSize);
  
  // Get windowed data
  const windowedData = data.slice(startIndex, endIndex);
  
  // Calculate total pages
  const totalPages = Math.ceil(data.length / pageSize);
  
  // Handle pagination
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
    setWindowOffset(0);
  }, []);
  
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    setWindowOffset(0);
  }, [totalPages]);
  
  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(10, prev * 1.5));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(0.1, prev / 1.5));
  }, []);
  
  // Handle drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableZoom) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  }, [enableZoom]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const dataPointsToMove = Math.floor(Math.abs(deltaX) / 10);
    
    if (deltaX > 0) {
      // Dragging right - show earlier data
      setWindowOffset(prev => Math.max(-currentPage * pageSize, prev - dataPointsToMove));
    } else {
      // Dragging left - show later data
      const maxOffset = Math.min(data.length - startIndex - effectiveWindowSize, pageSize);
      setWindowOffset(prev => Math.min(maxOffset, prev + dataPointsToMove));
    }
    
    setDragStartX(e.clientX);
  }, [isDragging, dragStartX, currentPage, pageSize, data.length, startIndex, effectiveWindowSize]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === '+' && e.ctrlKey) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' && e.ctrlKey) {
        e.preventDefault();
        handleZoomOut();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevPage, handleNextPage, handleZoomIn, handleZoomOut]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enablePagination && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 0 && windowOffset >= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1 && windowOffset >= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {data.length} points
          </span>
          
          {enableZoom && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 10}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart */}
      <div 
        ref={containerRef}
        className={`border rounded-lg p-4 ${isDragging ? 'cursor-grabbing' : enableZoom ? 'cursor-grab' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        <OptimizedChart
          data={windowedData}
          type={type}
          xKey={xKey}
          yKeys={yKeys}
          height={height}
          maxDataPoints={maxPointsPerWindow}
          colors={colors}
          xAxisFormatter={xAxisFormatter}
          yAxisFormatter={yAxisFormatter}
          tooltipFormatter={tooltipFormatter}
          showLegend={true}
          onDataOptimized={(original, optimized) => {
            console.log(`Window data: ${original} points optimized to ${optimized} points`);
          }}
        />
      </div>
      
      {/* Instructions */}
      {(enableZoom || enablePagination) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {enablePagination && <p>• Use arrow keys or buttons to navigate pages</p>}
          {enableZoom && (
            <>
              <p>• Ctrl + Plus/Minus to zoom in/out</p>
              <p>• Click and drag to pan through data</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualizedChart;