'use client';

import React from 'react';
import { useTranslation } from '@hockey-hub/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useGetPlayerMedicalOverviewQuery } from '@/store/api/medicalApi';
import MedicalRestrictionPanel from '../MedicalRestrictionPanel';
import { format } from 'date-fns';
import { WorkoutSession } from '@/types/training';

interface MedicalReportModalProps {
  playerId: string | number;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  currentSession?: WorkoutSession;
}

interface AlternativeExercise {
  id: string;
  originalExercise: string;
  alternativeExercise: string;
  reason: string;
  modifications: string[];
  loadMultiplier: number;
}

// Mock data for alternative exercises
const mockAlternatives: AlternativeExercise[] = [
  {
    id: '1',
    originalExercise: 'Squats',
    alternativeExercise: 'Leg Press',
    reason: 'Knee injury - reduced weight bearing',
    modifications: ['Use machine support', 'Reduce range of motion', 'Lower weight'],
    loadMultiplier: 0.7,
  },
  {
    id: '2',
    originalExercise: 'Running',
    alternativeExercise: 'Cycling',
    reason: 'Ankle sprain - low impact required',
    modifications: ['Maintain low resistance', 'Keep RPM under 80', 'No standing'],
    loadMultiplier: 0.8,
  },
  {
    id: '3',
    originalExercise: 'Overhead Press',
    alternativeExercise: 'Seated Dumbbell Press',
    reason: 'Shoulder impingement',
    modifications: ['Use lighter weights', 'Neutral grip', 'Stop at ear level'],
    loadMultiplier: 0.6,
  },
];

const getSeverityColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'destructive';
    case 'recovering':
      return 'warning';
    case 'recovered':
      return 'secondary';
    default:
      return 'default';
  }
};

const getSeverityIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return <XCircle className="h-4 w-4" />;
    case 'recovering':
      return <AlertTriangle className="h-4 w-4" />;
    case 'recovered':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export const MedicalReportModal: React.FC<MedicalReportModalProps> = ({
  playerId,
  playerName,
  isOpen,
  onClose,
  currentSession,
}) => {
  const { t, ready } = useTranslation(['physicalTrainer', 'common']);
  const { data: medicalData, isLoading, error } = useGetPlayerMedicalOverviewQuery(
    playerId,
    { skip: !isOpen }
  );

  // Wait for translations to load
  if (!ready) {
    return null;
  }

  const renderOverviewTab = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:medical.errorLoading')}
          </AlertDescription>
        </Alert>
      );
    }

    const hasActiveInjuries = medicalData?.current_injuries?.length > 0;

    return (
      <div className="space-y-6">
        {/* Medical Clearance Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('physicalTrainer:medical.clearanceStatus')}
                </h4>
                <p className="text-2xl font-bold mt-1">
                  {medicalData?.medical_clearance ? (
                    <span className="text-green-600">{t('physicalTrainer:medical.cleared')}</span>
                  ) : (
                    <span className="text-red-600">{t('physicalTrainer:medical.notCleared')}</span>
                  )}
                </p>
              </div>
              {medicalData?.medicalClearance?.status === 'cleared' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            {medicalData?.last_assessment_date && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('physicalTrainer:medical.lastAssessment')}:{' '}
                {format(new Date(medicalData.last_assessment_date), 'PPP')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Injuries */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('physicalTrainer:medical.currentInjuries')}
          </h3>
          {!hasActiveInjuries ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <p>{t('physicalTrainer:medical.noActiveInjuries')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {medicalData?.current_injuries?.map((injury) => (
                  <Card key={injury.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {injury.injury_type}
                              <Badge variant={getSeverityColor(injury.recovery_status)}>
                                {getSeverityIcon(injury.recovery_status)}
                                {injury.recovery_status}
                              </Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {injury.notes || 'No additional notes'}
                            </p>
                          </div>
                        </div>

                        {/* Recovery Progress - placeholder for now */}

                        {/* Recovery Timeline */}
                        {injury.expected_return_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {t('physicalTrainer:medical.expectedRecovery')}:{' '}
                              {format(new Date(injury.expected_return_date), 'PPP')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRestrictionsTab = () => {
    if (isLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('physicalTrainer:medical.errorLoading')}
          </AlertDescription>
        </Alert>
      );
    }

    // Format data for MedicalRestrictionPanel
    const formattedRestrictions = medicalData ? [{
      playerId: String(playerId),
      injuries: medicalData.current_injuries || [],
      restrictions: [] // TODO: Get actual restrictions from medical data
    }] : [];

    return (
      <div className="space-y-4">
        {medicalData && (
          <MedicalRestrictionPanel
            restrictions={formattedRestrictions}
            compact={false}
          />
        )}
      </div>
    );
  };

  const renderAlternativesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {t('physicalTrainer:medical.alternativeExercises')}
          </h3>
        </div>

        <div className="space-y-4">
          {mockAlternatives.map((alt) => (
            <Card key={alt.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alt.originalExercise}</span>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-primary">
                          {alt.alternativeExercise}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alt.reason}</p>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(alt.loadMultiplier * 100)}% {t('physicalTrainer:medical.load')}
                    </Badge>
                  </div>

                  {alt.modifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {t('physicalTrainer:medical.modifications')}:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {alt.modifications.map((mod, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t('physicalTrainer:medical.documentsComingSoon')}
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {t('physicalTrainer:medical.documentsDescription')}
        </p>
      </div>
    );
  };

  const getInjuryStatusBadge = () => {
    if (!medicalData) return null;

    const hasActiveInjuries = medicalData.current_injuries?.length > 0;

    if (!hasActiveInjuries) {
      return (
        <Badge variant="secondary" className="ml-2">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('physicalTrainer:medical.healthy')}
        </Badge>
      );
    }

    const highSeverityInjury = medicalData.current_injuries?.find(
      (injury) => injury.recovery_status === 'active'
    );

    if (highSeverityInjury) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t('physicalTrainer:medical.injured')}
        </Badge>
      );
    }

    return (
      <Badge variant="warning" className="ml-2">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {t('physicalTrainer:medical.limited')}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('physicalTrainer:medical.reportTitle', { playerName })}
            {getInjuryStatusBadge()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Medical information and restrictions for {playerName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('physicalTrainer:medical.overview')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('physicalTrainer:medical.restrictions')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="flex items-center gap-1">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('physicalTrainer:medical.alternatives')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t('physicalTrainer:medical.documents')}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-6">
            <TabsContent value="overview" className="mt-0">
              {renderOverviewTab()}
            </TabsContent>
            <TabsContent value="restrictions" className="mt-0">
              {renderRestrictionsTab()}
            </TabsContent>
            <TabsContent value="alternatives" className="mt-0">
              {renderAlternativesTab()}
            </TabsContent>
            <TabsContent value="documents" className="mt-0">
              {renderDocumentsTab()}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};