'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  User,
  XCircle
} from 'lucide-react';
import { useGetPlayerMedicalOverviewQuery } from '@/store/api/medicalApi';

interface MedicalRestriction {
  playerId: string;
  injuries: Array<{
    id: number;
    injury_type: string;
    injury_date: string;
    recovery_status: 'active' | 'recovering' | 'recovered';
    expected_return_date?: string;
    notes?: string;
  }>;
  restrictions: string[];
}

interface MedicalRestrictionPanelProps {
  restrictions: MedicalRestriction[];
  compact?: boolean;
  onAcknowledge?: () => void;
}

const RESTRICTION_DETAILS: Record<string, {
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  exercises: string[];
}> = {
  no_sprinting: {
    label: 'No Sprinting',
    description: 'Avoid high-speed running exercises',
    severity: 'high',
    exercises: ['Sprint intervals', 'Speed ladder', 'Shuttle runs']
  },
  limited_jumping: {
    label: 'Limited Jumping',
    description: 'Reduce or avoid jumping exercises',
    severity: 'medium',
    exercises: ['Box jumps', 'Plyometrics', 'Jump squats']
  },
  no_squats: {
    label: 'No Squats',
    description: 'Avoid squatting movements',
    severity: 'high',
    exercises: ['Back squats', 'Front squats', 'Goblet squats']
  },
  no_jumping: {
    label: 'No Jumping',
    description: 'Completely avoid jumping exercises',
    severity: 'high',
    exercises: ['All plyometric exercises', 'Jump training']
  },
  limited_running: {
    label: 'Limited Running',
    description: 'Reduce running intensity and duration',
    severity: 'medium',
    exercises: ['Long distance runs', 'High-intensity intervals']
  },
  no_overhead: {
    label: 'No Overhead',
    description: 'Avoid overhead movements',
    severity: 'high',
    exercises: ['Overhead press', 'Snatches', 'Overhead squats']
  },
  limited_pushing: {
    label: 'Limited Pushing',
    description: 'Reduce pushing exercises',
    severity: 'medium',
    exercises: ['Bench press', 'Push-ups', 'Shoulder press']
  },
  no_heavy_lifting: {
    label: 'No Heavy Lifting',
    description: 'Avoid heavy weight training',
    severity: 'high',
    exercises: ['Deadlifts', 'Heavy squats', 'Olympic lifts']
  },
  limited_rotation: {
    label: 'Limited Rotation',
    description: 'Reduce rotational movements',
    severity: 'medium',
    exercises: ['Russian twists', 'Cable rotations', 'Medicine ball throws']
  },
  limited_agility: {
    label: 'Limited Agility',
    description: 'Reduce agility and change of direction work',
    severity: 'medium',
    exercises: ['Cone drills', 'Ladder drills', 'Quick direction changes']
  },
  general_caution: {
    label: 'General Caution',
    description: 'Monitor closely and modify as needed',
    severity: 'low',
    exercises: ['All exercises - use caution']
  }
};

export default function MedicalRestrictionPanel({
  restrictions,
  compact = false,
  onAcknowledge
}: MedicalRestrictionPanelProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [expandedPlayers, setExpandedPlayers] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(!compact);

  // Group restrictions by severity
  const groupedRestrictions = React.useMemo(() => {
    const groups = {
      high: [] as MedicalRestriction[],
      medium: [] as MedicalRestriction[],
      low: [] as MedicalRestriction[]
    };

    restrictions.forEach(restriction => {
      const maxSeverity = restriction.restrictions.reduce((max, r) => {
        const severity = RESTRICTION_DETAILS[r]?.severity || 'low';
        if (severity === 'high') return 'high';
        if (severity === 'medium' && max !== 'high') return 'medium';
        return max;
      }, 'low' as 'high' | 'medium' | 'low');

      groups[maxSeverity].push(restriction);
    });

    return groups;
  }, [restrictions]);

  const togglePlayerExpansion = (playerId: string) => {
    setExpandedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <Info className="h-4 w-4" />;
    }
  };

  // Compact mode - just show a button with count
  if (compact && !showDetails) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDetails(true)}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4 text-warning" />
        {restrictions.length} {t('physicalTrainer:medicalRestrictions.title')}
      </Button>
    );
  }

  return (
    <Card className={compact ? 'fixed top-20 right-4 z-50 w-96 shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('physicalTrainer:medicalRestrictions.title')}
          </CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:medicalRestrictions.warningMessage', {
              count: restrictions.length
            })}
          </AlertDescription>
        </Alert>

        <ScrollArea className={compact ? 'h-[400px]' : 'h-[500px]'}>
          <div className="space-y-4">
            {/* High Severity Restrictions */}
            {groupedRestrictions.high.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="gap-1">
                    {getSeverityIcon('high')}
                    {t('physicalTrainer:medicalRestrictions.highSeverity')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {groupedRestrictions.high.length} {t('physicalTrainer:medicalRestrictions.players')}
                  </span>
                </div>
                {groupedRestrictions.high.map(restriction => (
                  <RestrictionCard
                    key={restriction.playerId}
                    restriction={restriction}
                    expanded={expandedPlayers.includes(restriction.playerId)}
                    onToggle={() => togglePlayerExpansion(restriction.playerId)}
                  />
                ))}
              </div>
            )}

            {/* Medium Severity Restrictions */}
            {groupedRestrictions.medium.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning" className="gap-1">
                    {getSeverityIcon('medium')}
                    {t('physicalTrainer:medicalRestrictions.mediumSeverity')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {groupedRestrictions.medium.length} {t('physicalTrainer:medicalRestrictions.players')}
                  </span>
                </div>
                {groupedRestrictions.medium.map(restriction => (
                  <RestrictionCard
                    key={restriction.playerId}
                    restriction={restriction}
                    expanded={expandedPlayers.includes(restriction.playerId)}
                    onToggle={() => togglePlayerExpansion(restriction.playerId)}
                  />
                ))}
              </div>
            )}

            {/* Low Severity Restrictions */}
            {groupedRestrictions.low.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="gap-1">
                    {getSeverityIcon('low')}
                    {t('physicalTrainer:medicalRestrictions.lowSeverity')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {groupedRestrictions.low.length} {t('physicalTrainer:medicalRestrictions.players')}
                  </span>
                </div>
                {groupedRestrictions.low.map(restriction => (
                  <RestrictionCard
                    key={restriction.playerId}
                    restriction={restriction}
                    expanded={expandedPlayers.includes(restriction.playerId)}
                    onToggle={() => togglePlayerExpansion(restriction.playerId)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {onAcknowledge && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={onAcknowledge} className="w-full">
              {t('physicalTrainer:medicalRestrictions.acknowledge')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual restriction card component
function RestrictionCard({
  restriction,
  expanded,
  onToggle
}: {
  restriction: MedicalRestriction;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Player {restriction.playerId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {restriction.injuries.map((injury, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {injury.injury_type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {restriction.restrictions.length} {t('physicalTrainer:medicalRestrictions.restrictions')}
                </Badge>
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 p-4 bg-muted/30 rounded-lg space-y-3">
          {/* Injury Details */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('physicalTrainer:medicalRestrictions.injuryDetails')}
            </h4>
            {restriction.injuries.map((injury, idx) => (
              <div key={idx} className="ml-6 space-y-1 text-sm">
                <p>
                  <span className="font-medium">{injury.injury_type}</span> - 
                  <Badge variant={injury.recovery_status === 'active' ? 'destructive' : 'warning'} className="ml-2 text-xs">
                    {injury.recovery_status}
                  </Badge>
                </p>
                {injury.expected_return_date && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expected return: {new Date(injury.expected_return_date).toLocaleDateString()}
                  </p>
                )}
                {injury.notes && (
                  <p className="text-muted-foreground italic">{injury.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Exercise Restrictions */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {t('physicalTrainer:medicalRestrictions.exerciseRestrictions')}
            </h4>
            <div className="ml-6 space-y-2">
              {restriction.restrictions.map((restrictionKey, idx) => {
                const detail = RESTRICTION_DETAILS[restrictionKey];
                if (!detail) return null;
                
                return (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(detail.severity)} className="text-xs">
                        {detail.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{detail.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avoid: {detail.exercises.join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function getSeverityColor(severity: 'high' | 'medium' | 'low'): 'destructive' | 'warning' | 'secondary' {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    case 'low':
      return 'secondary';
  }
}

export { MedicalRestrictionPanel };