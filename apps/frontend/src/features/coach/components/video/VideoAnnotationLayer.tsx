/**
 * VideoAnnotationLayer Component
 * 
 * Interactive overlay for drawing annotations on video content
 * Supports multiple drawing tools and telestrator-style functionality
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Pencil,
  Circle,
  Square,
  ArrowRight,
  Type,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Palette,
  Eye,
  EyeOff
} from '@/components/icons';
import type {
  VideoAnnotation,
  AnnotationData,
  DrawingTool,
  DrawingState
} from '@/types/tactical/video.types';
import { cn } from '@/lib/utils';

export interface VideoAnnotationLayerProps {
  annotations: VideoAnnotation[];
  currentTime: number;
  videoElement: HTMLVideoElement | null;
  isPlaying: boolean;
  onAnnotationAdd?: (annotation: VideoAnnotation) => void;
  onAnnotationUpdate?: (annotation: VideoAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  canEdit?: boolean;
  showControls?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

const DRAWING_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green  
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFFFF', // White
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
];

const DEFAULT_TOOL: DrawingTool = {
  type: 'arrow',
  color: '#FF0000',
  strokeWidth: 3,
  opacity: 1,
  active: true
};

export const VideoAnnotationLayer: React.FC<VideoAnnotationLayerProps> = ({
  annotations = [],
  currentTime,
  videoElement,
  isPlaying,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  canEdit = true,
  showControls = true,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentTool: DEFAULT_TOOL,
    activeAnnotation: undefined,
    undoStack: [],
    redoStack: []
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [visibleAnnotations, setVisibleAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  // Update canvas size when video dimensions change
  useEffect(() => {
    if (!canvasRef.current || !videoElement) return;

    const updateCanvasSize = () => {
      if (!canvasRef.current || !videoElement) return;
      
      const rect = videoElement.getBoundingClientRect();
      const canvas = canvasRef.current;
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    updateCanvasSize();
    
    const observer = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [videoElement]);

  // Render annotations
  useEffect(() => {
    if (!canvasRef.current || !visibleAnnotations) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current annotations (within time range)
    const currentAnnotations = annotations.filter(annotation => {
      if (!annotation.visible) return false;
      
      const start = annotation.timestamp;
      const end = annotation.duration ? start + annotation.duration : start + 5; // Default 5s duration
      
      return currentTime >= start && currentTime <= end;
    });

    // Draw annotations
    currentAnnotations.forEach(annotation => {
      drawAnnotation(ctx, annotation, selectedAnnotation === annotation.id);
    });

    // Draw current drawing if in progress
    if (isDrawing && currentPoints.length > 0) {
      drawCurrentDrawing(ctx);
    }
  }, [annotations, currentTime, visibleAnnotations, selectedAnnotation, isDrawing, currentPoints]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: VideoAnnotation, isSelected: boolean) => {
    const { data } = annotation;
    
    ctx.save();
    ctx.strokeStyle = data.color;
    ctx.fillStyle = data.color;
    ctx.lineWidth = data.strokeWidth;
    ctx.globalAlpha = data.opacity;

    if (isSelected) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
    }

    switch (annotation.type) {
      case 'arrow':
        drawArrow(ctx, data);
        break;
      case 'circle':
        drawCircle(ctx, data);
        break;
      case 'rectangle':
        drawRectangle(ctx, data);
        break;
      case 'text':
        drawText(ctx, data);
        break;
      case 'freehand':
        drawFreehand(ctx, data);
        break;
      case 'line':
        drawLine(ctx, data);
        break;
    }

    ctx.restore();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.points || data.points.length < 2) return;
    
    const start = data.points[0];
    const end = data.points[data.points.length - 1];
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.dimensions) return;
    
    const radius = Math.min(data.dimensions.width, data.dimensions.height) / 2;
    
    ctx.beginPath();
    ctx.arc(data.position.x, data.position.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.dimensions) return;
    
    ctx.strokeRect(
      data.position.x - data.dimensions.width / 2,
      data.position.y - data.dimensions.height / 2,
      data.dimensions.width,
      data.dimensions.height
    );
  };

  const drawText = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.text) return;
    
    ctx.font = `${data.fontSize || 16}px Arial`;
    ctx.fillText(data.text, data.position.x, data.position.y);
  };

  const drawFreehand = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.points || data.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(data.points[0].x, data.points[0].y);
    
    for (let i = 1; i < data.points.length; i++) {
      ctx.lineTo(data.points[i].x, data.points[i].y);
    }
    
    ctx.stroke();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, data: AnnotationData) => {
    if (!data.points || data.points.length < 2) return;
    
    const start = data.points[0];
    const end = data.points[data.points.length - 1];
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const drawCurrentDrawing = (ctx: CanvasRenderingContext2D) => {
    if (currentPoints.length === 0) return;
    
    ctx.save();
    ctx.strokeStyle = drawingState.currentTool.color;
    ctx.lineWidth = drawingState.currentTool.strokeWidth;
    ctx.globalAlpha = drawingState.currentTool.opacity;
    ctx.setLineDash([5, 5]); // Dashed line for preview
    
    switch (drawingState.currentTool.type) {
      case 'freehand':
      case 'line':
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();
        break;
      case 'arrow':
        if (currentPoints.length >= 2) {
          const start = currentPoints[0];
          const end = currentPoints[currentPoints.length - 1];
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
        break;
      case 'circle':
        if (currentPoints.length >= 2) {
          const start = currentPoints[0];
          const end = currentPoints[currentPoints.length - 1];
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 'rectangle':
        if (currentPoints.length >= 2) {
          const start = currentPoints[0];
          const end = currentPoints[currentPoints.length - 1];
          
          ctx.strokeRect(
            Math.min(start.x, end.x),
            Math.min(start.y, end.y),
            Math.abs(end.x - start.x),
            Math.abs(end.y - start.y)
          );
        }
        break;
    }
    
    ctx.restore();
  };

  const getCanvasPoint = (event: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!canEdit || isPlaying || drawingState.currentTool.type === 'text') return;
    
    const point = getCanvasPoint(event);
    setIsDrawing(true);
    setCurrentPoints([point]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !canEdit) return;
    
    const point = getCanvasPoint(event);
    
    if (drawingState.currentTool.type === 'freehand') {
      setCurrentPoints(prev => [...prev, point]);
    } else {
      setCurrentPoints(prev => [prev[0], point]);
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!isDrawing || !canEdit) return;
    
    const finalPoint = getCanvasPoint(event);
    const finalPoints = drawingState.currentTool.type === 'freehand' 
      ? [...currentPoints, finalPoint]
      : [currentPoints[0], finalPoint];

    // Create annotation
    const annotation: VideoAnnotation = {
      id: `annotation-${Date.now()}`,
      videoId: 'current-video', // This should come from props
      timestamp: currentTime,
      duration: 5, // Default 5 second duration
      type: drawingState.currentTool.type,
      data: createAnnotationData(finalPoints),
      author: 'current-user', // This should come from auth context
      createdAt: new Date(),
      visible: true
    };

    onAnnotationAdd?.(annotation);
    
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const createAnnotationData = (points: Point[]): AnnotationData => {
    const tool = drawingState.currentTool;
    
    const baseData: AnnotationData = {
      position: points[0] || { x: 0, y: 0 },
      color: tool.color,
      strokeWidth: tool.strokeWidth,
      opacity: tool.opacity,
      points: points
    };

    switch (tool.type) {
      case 'circle':
        if (points.length >= 2) {
          const radius = Math.sqrt(
            Math.pow(points[1].x - points[0].x, 2) + 
            Math.pow(points[1].y - points[0].y, 2)
          );
          baseData.dimensions = { width: radius * 2, height: radius * 2 };
        }
        break;
      case 'rectangle':
        if (points.length >= 2) {
          baseData.dimensions = {
            width: Math.abs(points[1].x - points[0].x),
            height: Math.abs(points[1].y - points[0].y)
          };
        }
        break;
      case 'text':
        baseData.text = 'Text annotation';
        baseData.fontSize = 16;
        break;
    }

    return baseData;
  };

  const handleToolChange = (type: DrawingTool['type']) => {
    setDrawingState(prev => ({
      ...prev,
      currentTool: { ...prev.currentTool, type, active: true }
    }));
  };

  const handleColorChange = (color: string) => {
    setDrawingState(prev => ({
      ...prev,
      currentTool: { ...prev.currentTool, color }
    }));
  };

  const handleStrokeWidthChange = (width: number) => {
    setDrawingState(prev => ({
      ...prev,
      currentTool: { ...prev.currentTool, strokeWidth: width }
    }));
  };

  const handleOpacityChange = (opacity: number) => {
    setDrawingState(prev => ({
      ...prev,
      currentTool: { ...prev.currentTool, opacity: opacity / 100 }
    }));
  };

  const clearAnnotations = () => {
    // Clear annotations at current timestamp
    const annotationsToDelete = annotations.filter(annotation => {
      const start = annotation.timestamp;
      const end = annotation.duration ? start + annotation.duration : start + 5;
      return currentTime >= start && currentTime <= end;
    });

    annotationsToDelete.forEach(annotation => {
      onAnnotationDelete?.(annotation.id);
    });
  };

  if (!canEdit && !visibleAnnotations) return null;

  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
    >
      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full",
          canEdit && "pointer-events-auto cursor-crosshair"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            setIsDrawing(false);
            setCurrentPoints([]);
          }
        }}
      />

      {/* Drawing Controls */}
      {canEdit && showControls && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex flex-col space-y-2">
            {/* Tool Selection */}
            <div className="flex space-x-1">
              <Button
                variant={drawingState.currentTool.type === 'arrow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('arrow')}
                className="p-2"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingState.currentTool.type === 'circle' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('circle')}
                className="p-2"
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingState.currentTool.type === 'rectangle' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('rectangle')}
                className="p-2"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingState.currentTool.type === 'freehand' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('freehand')}
                className="p-2"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingState.currentTool.type === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('line')}
                className="p-2"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingState.currentTool.type === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleToolChange('text')}
                className="p-2"
              >
                <Type className="w-4 h-4" />
              </Button>
            </div>

            {/* Tool Properties */}
            <div className="flex items-center space-x-2">
              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Palette className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3">
                  <div className="grid grid-cols-5 gap-2">
                    {DRAWING_COLORS.map(color => (
                      <button
                        key={color}
                        className={cn(
                          "w-8 h-8 rounded border-2",
                          drawingState.currentTool.color === color 
                            ? "border-white" 
                            : "border-gray-400"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Stroke Width */}
              <div className="w-16">
                <Slider
                  value={[drawingState.currentTool.strokeWidth]}
                  onValueChange={([value]) => handleStrokeWidthChange(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div className="w-16">
                <Slider
                  value={[drawingState.currentTool.opacity * 100]}
                  onValueChange={([value]) => handleOpacityChange(value)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleAnnotations(!visibleAnnotations)}
                className="p-2"
              >
                {visibleAnnotations ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAnnotations}
                className="p-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Annotation Info */}
      {visibleAnnotations && annotations.length > 0 && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white text-sm">
            {annotations.filter(a => {
              const start = a.timestamp;
              const end = a.duration ? start + a.duration : start + 5;
              return currentTime >= start && currentTime <= end && a.visible;
            }).length} annotations visible
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnnotationLayer;