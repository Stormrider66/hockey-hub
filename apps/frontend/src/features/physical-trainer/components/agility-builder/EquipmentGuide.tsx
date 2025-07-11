'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Target,
  Grid3X3,
  Circle,
  Zap,
  Shield,
  Sparkles,
  Info,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgilityEquipmentType, AgilityDrill } from '../../types/agility.types';
import { useTranslation } from 'react-i18next';

interface EquipmentGuideProps {
  requiredEquipment: AgilityEquipmentType[];
  drills: AgilityDrill[];
}

interface EquipmentInfo {
  type: AgilityEquipmentType;
  name: string;
  description: string;
  quantity: string;
  setup: string[];
  alternatives?: string[];
  icon: React.ReactNode;
  color: string;
}

const EQUIPMENT_INFO: Record<AgilityEquipmentType, EquipmentInfo> = {
  cones: {
    type: 'cones',
    name: 'Training Cones',
    description: 'Flexible markers for creating drill patterns',
    quantity: '10-20 cones recommended',
    setup: [
      'Use bright colors for visibility',
      'Space according to drill requirements',
      'Secure on windy days',
      'Number or label for complex patterns'
    ],
    alternatives: ['Disc markers', 'Water bottles', 'Shoes'],
    icon: <Target className="h-5 w-5" />,
    color: 'text-orange-500'
  },
  ladder: {
    type: 'ladder',
    name: 'Agility Ladder',
    description: 'Flat ladder for footwork and coordination drills',
    quantity: '1-2 ladders (15-20 feet)',
    setup: [
      'Lay flat on ground',
      'Secure ends if needed',
      'Ensure adequate space around',
      'Check for tangles before use'
    ],
    alternatives: ['Chalk/tape lines', 'Jump ropes laid flat'],
    icon: <Grid3X3 className="h-5 w-5" />,
    color: 'text-blue-500'
  },
  hurdles: {
    type: 'hurdles',
    name: 'Mini Hurdles',
    description: 'Adjustable barriers for jumping and stepping drills',
    quantity: '6-12 hurdles',
    setup: [
      'Adjust height for skill level',
      'Space 1-2 feet apart',
      'Ensure stable placement',
      'Use collapsible type for safety'
    ],
    alternatives: ['Cones with sticks', 'Pool noodles'],
    icon: <Shield className="h-5 w-5" />,
    color: 'text-green-500'
  },
  reaction_ball: {
    type: 'reaction_ball',
    name: 'Reaction Ball',
    description: 'Multi-sided ball that bounces unpredictably',
    quantity: '2-3 balls',
    setup: [
      'Use on hard, flat surface',
      'Clear surrounding area',
      'Have backup balls ready',
      'Check ball condition'
    ],
    alternatives: ['Tennis balls', 'Partially deflated balls'],
    icon: <Circle className="h-5 w-5" />,
    color: 'text-purple-500'
  },
  poles: {
    type: 'poles',
    name: 'Agility Poles',
    description: 'Vertical markers for weaving and direction changes',
    quantity: '6-10 poles',
    setup: [
      'Insert firmly in ground/base',
      'Space 3-5 feet apart',
      'Use flexible poles for safety',
      'Mark with flags if needed'
    ],
    alternatives: ['Cones stacked high', 'PVC pipes in bases'],
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-indigo-500'
  },
  markers: {
    type: 'markers',
    name: 'Floor Markers',
    description: 'Flat discs or spots for positioning',
    quantity: '10-20 markers',
    setup: [
      'Place flat on surface',
      'Use non-slip type',
      'Bright colors recommended',
      'Number for sequences'
    ],
    alternatives: ['Tape X marks', 'Chalk marks'],
    icon: <Target className="h-5 w-5" />,
    color: 'text-red-500'
  },
  lights: {
    type: 'lights',
    name: 'Reaction Lights',
    description: 'Electronic lights for visual reaction training',
    quantity: '4-8 lights with controller',
    setup: [
      'Position at various heights',
      'Ensure clear sight lines',
      'Check battery levels',
      'Program desired sequences'
    ],
    alternatives: ['Coach with colored cards', 'Smartphone apps'],
    icon: <Zap className="h-5 w-5" />,
    color: 'text-yellow-500'
  },
  none: {
    type: 'none',
    name: 'No Equipment',
    description: 'Bodyweight and partner drills',
    quantity: 'N/A',
    setup: ['Clear space', 'Mark boundaries if needed'],
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-gray-500'
  }
};

export default function EquipmentGuide({ requiredEquipment, drills }: EquipmentGuideProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [showSetupDetails, setShowSetupDetails] = useState<AgilityEquipmentType | null>(null);

  // Calculate equipment usage
  const equipmentUsage = new Map<AgilityEquipmentType, AgilityDrill[]>();
  drills.forEach(drill => {
    drill.equipment.forEach(eq => {
      const current = equipmentUsage.get(eq) || [];
      equipmentUsage.set(eq, [...current, drill]);
    });
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create equipment list text
    const equipmentList = Array.from(equipmentUsage.entries())
      .map(([equipment, drillList]) => {
        const info = EQUIPMENT_INFO[equipment];
        return `${info.name}\n- ${info.quantity}\n- Used in: ${drillList.map(d => d.name).join(', ')}\n`;
      })
      .join('\n');

    // Create blob and download
    const blob = new Blob([equipmentList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agility-equipment-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('physicalTrainer:agility.equipment.title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('physicalTrainer:agility.equipment.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Equipment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(equipmentUsage.entries()).map(([equipment, drillList]) => {
          const info = EQUIPMENT_INFO[equipment];
          const isExpanded = showSetupDetails === equipment;

          return (
            <Card 
              key={equipment}
              className={cn(
                "cursor-pointer transition-all",
                isExpanded && "md:col-span-2 lg:col-span-3"
              )}
              onClick={() => setShowSetupDetails(isExpanded ? null : equipment)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-1", info.color)}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{info.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {info.description}
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {info.quantity}
                        </Badge>
                        <span className="text-muted-foreground">
                          Used in {drillList.length} drill{drillList.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {/* Setup Instructions */}
                          <div>
                            <h4 className="font-medium mb-2">Setup Instructions:</h4>
                            <ul className="space-y-1">
                              {info.setup.map((step, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="text-primary mr-2">•</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Alternatives */}
                          {info.alternatives && (
                            <div>
                              <h4 className="font-medium mb-2">Alternatives:</h4>
                              <div className="flex flex-wrap gap-2">
                                {info.alternatives.map(alt => (
                                  <Badge key={alt} variant="outline" className="text-xs">
                                    {alt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Drills Using This Equipment */}
                          <div>
                            <h4 className="font-medium mb-2">Used in drills:</h4>
                            <div className="space-y-1">
                              {drillList.map(drill => (
                                <div key={drill.id} className="text-sm text-muted-foreground">
                                  • {drill.name} ({drill.reps} reps)
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Setup Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro tip:</strong> Set up all equipment before starting the session. 
          Create a diagram or take a photo of complex setups for future reference. 
          Always have alternatives ready in case equipment is unavailable.
        </AlertDescription>
      </Alert>

      {/* Missing Equipment Warning */}
      {requiredEquipment.length === 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No equipment selected yet. Add drills to see required equipment.
          </AlertDescription>
        </Alert>
      )}

      {/* Equipment Checklist (Printable) */}
      <Card className="print:block hidden">
        <CardHeader>
          <CardTitle>Equipment Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(equipmentUsage.entries()).map(([equipment, drillList]) => {
              const info = EQUIPMENT_INFO[equipment];
              return (
                <div key={equipment} className="flex items-center gap-4">
                  <div className="w-6 h-6 border-2 border-gray-400 rounded" />
                  <div>
                    <span className="font-medium">{info.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({info.quantity})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}