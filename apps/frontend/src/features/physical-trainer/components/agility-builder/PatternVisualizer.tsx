'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw,
  Grid3X3,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConePosition, DrillPath, DrillPattern } from '../../types/agility.types';
import { DRILL_PATTERNS } from '../../types/agility.types';

interface PatternVisualizerProps {
  pattern: DrillPattern;
  patternData?: {
    cones: ConePosition[];
    paths: DrillPath[];
    gridSize: { width: number; height: number; unit: 'meters' | 'feet' };
  };
  onUpdate?: (patternData: any) => void;
  readOnly?: boolean;
  className?: string;
}

const PATH_COLORS = {
  sprint: '#3b82f6', // blue
  shuffle: '#10b981', // green
  backpedal: '#f59e0b', // amber
  carioca: '#8b5cf6', // violet
  hop: '#ec4899', // pink
  // Hockey-specific path types
  hockey_stride: '#1d4ed8', // dark blue
  crossover: '#059669', // dark green
  transition: '#dc2626', // red
  edge_work: '#7c3aed' // purple
};

const PATH_STYLES = {
  sprint: { strokeDasharray: 'none' },
  shuffle: { strokeDasharray: '5,5' },
  backpedal: { strokeDasharray: '10,5' },
  carioca: { strokeDasharray: '3,3' },
  hop: { strokeDasharray: '2,6' },
  // Hockey-specific path styles
  hockey_stride: { strokeDasharray: 'none', strokeWidth: 4 },
  crossover: { strokeDasharray: '8,4' },
  transition: { strokeDasharray: '4,4,8,4' },
  edge_work: { strokeDasharray: '12,3' }
};

export default function PatternVisualizer({
  pattern,
  patternData,
  onUpdate,
  readOnly = true,
  className
}: PatternVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedCone, setSelectedCone] = useState<string | null>(null);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);

  // Use preset pattern or custom data
  const data = patternData || DRILL_PATTERNS[pattern] || {
    cones: [],
    paths: [],
    gridSize: { width: 20, height: 20, unit: 'meters' }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSelectedCone(null);
    setIsDrawingPath(false);
    setPathStart(null);
  };

  const handleConeClick = (coneId: string) => {
    if (readOnly) return;

    if (isDrawingPath && pathStart) {
      // Complete the path
      if (pathStart !== coneId) {
        const newPath: DrillPath = {
          from: pathStart,
          to: coneId,
          type: 'sprint',
          order: data.paths.length + 1
        };
        onUpdate?.({
          ...data,
          paths: [...data.paths, newPath]
        });
      }
      setIsDrawingPath(false);
      setPathStart(null);
    } else {
      // Start drawing a path
      setSelectedCone(coneId);
      setIsDrawingPath(true);
      setPathStart(coneId);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onUpdate) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const x = (svgP.x / 400) * 100;
    const y = (svgP.y / 400) * 100;

    // Check if clicking near an existing cone
    const clickedCone = data.cones.find(cone => {
      const dx = cone.x - x;
      const dy = cone.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 5;
    });

    if (!clickedCone && !isDrawingPath) {
      // Add new cone
      const newCone: ConePosition = {
        id: `cone-${Date.now()}`,
        x,
        y,
        label: `${data.cones.length + 1}`
      };
      onUpdate({
        ...data,
        cones: [...data.cones, newCone]
      });
    }
  };

  const exportPattern = () => {
    // TODO: Implement SVG export functionality
    console.log('Export pattern:', data);
  };

  // Draw arrow marker for path direction
  const arrowMarker = (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="#666"
        />
      </marker>
    </defs>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* SVG Canvas */}
      <div className="relative bg-gray-50 rounded-lg overflow-hidden">
        {/* Controls */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          {!readOnly && (
            <Button size="icon" variant="secondary" onClick={exportPattern}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className="w-full h-full cursor-crosshair"
          style={{ transform: `scale(${zoom})` }}
          onClick={handleCanvasClick}
        >
          {arrowMarker}

          {/* Grid */}
          <g className="opacity-30">
            {Array.from({ length: 21 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 20}
                y1={0}
                x2={i * 20}
                y2={400}
                stroke="#ccc"
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 21 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * 20}
                x2={400}
                y2={i * 20}
                stroke="#ccc"
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Paths */}
          {data.paths.map((path, index) => {
            const fromCone = data.cones.find(c => c.id === path.from);
            const toCone = data.cones.find(c => c.id === path.to);
            
            if (!fromCone || !toCone) return null;

            const x1 = (fromCone.x / 100) * 400;
            const y1 = (fromCone.y / 100) * 400;
            const x2 = (toCone.x / 100) * 400;
            const y2 = (toCone.y / 100) * 400;

            return (
              <g key={index}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={PATH_COLORS[path.type] || PATH_COLORS.sprint}
                  strokeWidth={PATH_STYLES[path.type]?.strokeWidth || 3}
                  strokeDasharray={PATH_STYLES[path.type]?.strokeDasharray || 'none'}
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-sm"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#666"
                  className="font-medium"
                >
                  {path.order}
                </text>
                {/* Hockey-specific action indicators */}
                {path.action && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#444"
                    className="font-bold uppercase"
                  >
                    {path.action}
                  </text>
                )}
                {/* Puck indicator */}
                {path.withPuck && (
                  <circle
                    cx={(x1 + x2) / 2 + 15}
                    cy={(y1 + y2) / 2}
                    r="4"
                    fill="#000"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}

          {/* Cones */}
          {data.cones.map((cone) => {
            // Skip transparent cones (used as path markers)
            if (cone.color === 'transparent') return null;
            
            const x = (cone.x / 100) * 400;
            const y = (cone.y / 100) * 400;
            const isSelected = selectedCone === cone.id || pathStart === cone.id;

            return (
              <g
                key={cone.id}
                onClick={() => handleConeClick(cone.id)}
                className="cursor-pointer"
              >
                {/* Hockey net rendering */}
                {cone.label === 'Net' ? (
                  <>
                    {/* Net rectangle */}
                    <rect
                      x={x - 15}
                      y={y - 8}
                      width={30}
                      height={16}
                      fill="#ef4444"
                      stroke="#1f2937"
                      strokeWidth={2}
                      rx={2}
                      className="drop-shadow-md"
                    />
                    {/* Net mesh pattern */}
                    <g stroke="#fff" strokeWidth={1} opacity={0.7}>
                      <line x1={x - 10} y1={y - 5} x2={x + 10} y2={y + 5} />
                      <line x1={x - 10} y1={y + 5} x2={x + 10} y2={y - 5} />
                      <line x1={x - 5} y1={y - 8} x2={x - 5} y2={y + 8} />
                      <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
                      <line x1={x + 5} y1={y - 8} x2={x + 5} y2={y + 8} />
                    </g>
                  </>
                ) : cone.label?.startsWith('T') ? (
                  /* Target rendering */
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill={cone.color || '#fbbf24'}
                      stroke="#1f2937"
                      strokeWidth={2}
                      className="drop-shadow-md"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={4}
                      fill="none"
                      stroke="#1f2937"
                      strokeWidth={1}
                    />
                  </>
                ) : (
                  /* Regular cone triangle */
                  <path
                    d={`M ${x} ${y - 12} L ${x - 8} ${y + 8} L ${x + 8} ${y + 8} Z`}
                    fill={cone.color || '#f97316'}
                    stroke={isSelected ? '#1f2937' : '#fff'}
                    strokeWidth={2}
                    className="drop-shadow-md"
                  />
                )}
                {/* Label */}
                {cone.label && (
                  <text
                    x={x}
                    y={y + (cone.label === 'Net' ? 25 : cone.label?.startsWith('T') ? 25 : 25)}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#1f2937"
                  >
                    {cone.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Drawing hint */}
          {!readOnly && isDrawingPath && pathStart && (
            <text
              x={200}
              y={20}
              textAnchor="middle"
              fontSize="14"
              fill="#666"
              className="animate-pulse"
            >
              Click another cone to complete the path
            </text>
          )}
        </svg>
        
        {/* Grid size indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/80 px-1 rounded">
          {data.gridSize.width} × {data.gridSize.height} {data.gridSize.unit}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1 justify-center">
        {Object.entries(PATH_COLORS).map(([type, color]) => {
          // Show hockey-specific legend only when they're present in the pattern
          const isHockeyType = ['hockey_stride', 'crossover', 'transition', 'edge_work'].includes(type);
          const hasHockeyPaths = data.paths.some(p => ['hockey_stride', 'crossover', 'transition', 'edge_work'].includes(p.type));
          
          if (isHockeyType && !hasHockeyPaths) return null;
          
          return (
            <Badge
              key={type}
              variant="secondary"
              className="text-xs px-2 py-0.5"
              style={{ borderColor: color, borderWidth: 2 }}
            >
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export { PatternVisualizer };