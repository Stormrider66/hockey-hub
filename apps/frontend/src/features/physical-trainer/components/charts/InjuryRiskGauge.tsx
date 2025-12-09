'use client';

import React, { useMemo } from 'react';

interface InjuryRiskGaugeProps {
  value: number; // 0-100
  size?: number;
  showLabels?: boolean;
  showValue?: boolean;
  className?: string;
  label?: string;
}

const RISK_ZONES = [
  { start: 0, end: 30, color: '#10b981', label: 'Low' },
  { start: 30, end: 60, color: '#f59e0b', label: 'Medium' },
  { start: 60, end: 80, color: '#f97316', label: 'High' },
  { start: 80, end: 100, color: '#ef4444', label: 'Critical' }
];

export const InjuryRiskGauge = React.memo(function InjuryRiskGauge({
  value,
  size = 200,
  showLabels = true,
  showValue = true,
  className = '',
  label = 'Injury Risk'
}: InjuryRiskGaugeProps) {
  const { needleAngle, currentZone, gaugeArcs } = useMemo(() => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const startAngle = -135;
    const endAngle = 135;
    const angleRange = endAngle - startAngle;
    const needleAngle = startAngle + (clampedValue / 100) * angleRange;

    const currentZone = RISK_ZONES.find(zone => clampedValue >= zone.start && clampedValue <= zone.end) || RISK_ZONES[0];

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;
    const innerRadius = radius * 0.8;

    const gaugeArcs = RISK_ZONES.map(zone => {
      const zoneStartAngle = startAngle + (zone.start / 100) * angleRange;
      const zoneEndAngle = startAngle + (zone.end / 100) * angleRange;
      
      const startRad = (zoneStartAngle * Math.PI) / 180;
      const endRad = (zoneEndAngle * Math.PI) / 180;

      const x1 = centerX + Math.cos(startRad) * radius;
      const y1 = centerY + Math.sin(startRad) * radius;
      const x2 = centerX + Math.cos(endRad) * radius;
      const y2 = centerY + Math.sin(endRad) * radius;
      const ix1 = centerX + Math.cos(startRad) * innerRadius;
      const iy1 = centerY + Math.sin(startRad) * innerRadius;
      const ix2 = centerX + Math.cos(endRad) * innerRadius;
      const iy2 = centerY + Math.sin(endRad) * innerRadius;

      const largeArcFlag = (zone.end - zone.start) / 100 * angleRange > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');

      return { ...zone, path };
    });

    return { needleAngle, currentZone, gaugeArcs };
  }, [value, size]);

  const centerX = size / 2;
  const centerY = size / 2;
  const needleLength = size * 0.35;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleX = centerX + Math.cos(needleRad) * needleLength;
  const needleY = centerY + Math.sin(needleRad) * needleLength;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Gauge arcs */}
        <g>
          {gaugeArcs.map((arc, index) => (
            <path
              key={index}
              d={arc.path}
              fill={arc.color}
              opacity="0.8"
              className="transition-opacity hover:opacity-100"
            >
              <title>{`${arc.label}: ${arc.start}%-${arc.end}%`}</title>
            </path>
          ))}
        </g>

        {/* Zone labels */}
        {showLabels && (
          <g>
            {gaugeArcs.map((zone, index) => {
              const midAngle = -135 + ((zone.start + zone.end) / 2 / 100) * 270;
              const labelRad = (midAngle * Math.PI) / 180;
              const labelRadius = size * 0.32;
              const labelX = centerX + Math.cos(labelRad) * labelRadius;
              const labelY = centerY + Math.sin(labelRad) * labelRadius;

              return (
                <text
                  key={index}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white"
                >
                  {zone.label}
                </text>
              );
            })}
          </g>
        )}

        {/* Needle */}
        <g>
          {/* Needle shadow */}
          <line
            x1={centerX}
            y1={centerY + 2}
            x2={needleX}
            y2={needleY + 2}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Center cap */}
          <circle
            cx={centerX}
            cy={centerY}
            r="8"
            fill="#1f2937"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="5"
            fill="#f3f4f6"
          />
        </g>

        {/* Value display */}
        {showValue && (
          <g>
            <text
              x={centerX}
              y={centerY + size * 0.15}
              textAnchor="middle"
              className="text-2xl font-bold fill-gray-800"
            >
              {value.toFixed(0)}%
            </text>
            <text
              x={centerX}
              y={centerY + size * 0.23}
              textAnchor="middle"
              className="text-sm fill-gray-600"
            >
              {currentZone.label} Risk
            </text>
          </g>
        )}
      </svg>

      {/* Label */}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}

      {/* Risk indicators */}
      <div className="absolute top-0 right-0 flex flex-col gap-1">
        {value >= 60 && (
          <div className="flex items-center gap-1 bg-orange-100 rounded px-2 py-1">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium text-orange-800">Monitor</span>
          </div>
        )}
        {value >= 80 && (
          <div className="flex items-center gap-1 bg-red-100 rounded px-2 py-1">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-xs font-medium text-red-800">Action Required</span>
          </div>
        )}
      </div>
    </div>
  );
});