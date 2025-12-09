'use client';

import React from 'react';
import IntervalPreview from './IntervalPreview';
import { WorkoutEquipmentType } from '../types/conditioning.types';
import type { IntervalSet } from '../types/conditioning.types';

export default function IntervalPreviewDemo() {
  const sampleIntervals: IntervalSet[] = [
    {
      id: 'demo-1',
      type: 'warmup',
      name: 'Easy Row',
      duration: 300, // 5 minutes
      equipment: WorkoutEquipmentType.ROWING,
      targetMetrics: {
        heartRate: {
          type: 'percentage',
          value: 60,
          reference: 'max'
        },
        watts: {
          type: 'absolute',
          value: 150
        }
      },
      notes: 'Gradually increase intensity',
      color: '#10b981'
    },
    {
      id: 'demo-2',
      type: 'work',
      name: 'Sprint Interval',
      duration: 60, // 1 minute
      equipment: WorkoutEquipmentType.BIKE,
      targetMetrics: {
        heartRate: {
          type: 'percentage',
          value: 90,
          reference: 'max'
        },
        watts: {
          type: 'percentage',
          value: 110,
          reference: 'ftp'
        },
        rpm: 95
      },
      color: '#ef4444'
    },
    {
      id: 'demo-3',
      type: 'rest',
      name: 'Recovery',
      duration: 120, // 2 minutes
      equipment: WorkoutEquipmentType.BIKE,
      targetMetrics: {},
      color: '#3b82f6'
    },
    {
      id: 'demo-4',
      type: 'active_recovery',
      name: 'Easy Spin',
      duration: 180, // 3 minutes
      equipment: WorkoutEquipmentType.BIKE,
      targetMetrics: {
        heartRate: {
          type: 'zone',
          value: 2
        },
        watts: {
          type: 'percentage',
          value: 50,
          reference: 'ftp'
        }
      },
      notes: 'Keep cadence high, resistance low',
      color: '#f59e0b'
    },
    {
      id: 'demo-5',
      type: 'cooldown',
      name: 'Cool Down',
      duration: 240, // 4 minutes
      equipment: WorkoutEquipmentType.TREADMILL,
      targetMetrics: {
        pace: {
          type: 'absolute',
          value: 360 // 6:00 per km
        },
        heartRate: {
          type: 'percentage',
          value: 50,
          reference: 'max'
        }
      },
      color: '#6366f1'
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6">Interval Preview Component Demo</h1>
        
        <div className="space-y-4">
          {sampleIntervals.map((interval, index) => (
            <IntervalPreview
              key={interval.id}
              interval={interval}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}