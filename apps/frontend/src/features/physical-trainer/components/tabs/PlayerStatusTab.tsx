'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Heart, Zap, Activity } from 'lucide-react';
import { VirtualizedList } from "@/components/ui/VirtualizedList";
import { useMedicalCompliance } from '../../hooks/useMedicalCompliance';
import { MedicalReportButton } from '../SessionBuilder/MedicalReportButton';
import { MedicalReportModal } from '../SessionBuilder/MedicalReportModal';
import { PlayerDetailsModal } from './PlayerDetailsModal';

interface Player {
  id: number;
  name: string;
  status: 'ready' | 'caution' | 'rest';
  load: number;
  fatigue: string;
  trend: 'up' | 'down' | 'stable';
}

interface PlayerStatusTabProps {
  selectedTeamId: string | null;
  playerReadiness: Player[];
}

export default function PlayerStatusTab({ selectedTeamId, playerReadiness }: PlayerStatusTabProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<Player | null>(null);
  
  // Get all player IDs for medical data fetching
  const playerIds = useMemo(() => 
    playerReadiness.map(player => player.id.toString()),
    [playerReadiness]
  );

  // Fetch medical compliance data for all players
  const {
    medicalData,
    isLoading: medicalLoading,
    checkPlayerCompliance,
    getRestrictions,
    complianceStatus,
    getSummary
  } = useMedicalCompliance({
    playerIds,
    workoutType: 'strength', // Default workout type for status checking
    enableRealTimeChecks: true
  });

  // Helper function to get medical status for a player
  const getPlayerMedicalStatus = useCallback((playerId: string) => {
    const playerMedicalData = medicalData.find(m => m.playerId === playerId);
    return playerMedicalData?.status || 'healthy';
  }, [medicalData]);

  // Helper function to determine overall player status based on training readiness and medical status
  const getOverallPlayerStatus = useCallback((player: Player) => {
    const medicalStatus = getPlayerMedicalStatus(player.id.toString());
    
    // If player is injured, override training status
    if (medicalStatus === 'injured') {
      return 'rest';
    }
    
    // If player is limited, downgrade status if currently ready
    if (medicalStatus === 'limited' && player.status === 'ready') {
      return 'caution';
    }
    
    // Otherwise use training status
    return player.status;
  }, [getPlayerMedicalStatus]);

  // Handle medical report button click
  const handleViewMedicalReport = useCallback((playerId: string, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName });
    setMedicalModalOpen(true);
  }, []);

  // Handle view details button click
  const handleViewDetails = useCallback((player: Player) => {
    setSelectedPlayerForDetails(player);
    setDetailsModalOpen(true);
  }, []);

  const renderPlayerCard = useCallback(({ item: player, style }: { item: Player; style: React.CSSProperties }) => {
    const playerId = player.id.toString();
    const medicalStatus = getPlayerMedicalStatus(playerId);
    const overallStatus = getOverallPlayerStatus(player);
    const playerCompliance = checkPlayerCompliance(playerId);
    const hasRestrictions = playerCompliance && (playerCompliance.violations.length > 0 || playerCompliance.warnings.length > 0);
    
    return (
      <div style={style} className="px-4 pb-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  overallStatus === 'ready' ? 'bg-green-100' : 
                  overallStatus === 'caution' ? 'bg-amber-100' : 'bg-red-100'
                )}>
                  {overallStatus === 'ready' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : overallStatus === 'caution' ? (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{player.name}</div>
                    {medicalStatus !== 'healthy' && (
                      <MedicalReportButton
                        playerId={playerId}
                        playerName={player.name}
                        injuryStatus={medicalStatus as 'injured' | 'limited'}
                        onClick={() => handleViewMedicalReport(playerId, player.name)}
                      />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('physicalTrainer:playerStatus.statusLabel')}: {t(`physicalTrainer:playerStatus.${overallStatus}`)} 
                    {medicalStatus !== 'healthy' && (
                      <span className={cn(
                        "ml-2",
                        medicalStatus === 'injured' ? 'text-red-600' : 'text-yellow-600'
                      )}>
                        | {t('physicalTrainer:medical.status.' + medicalStatus)}
                      </span>
                    )}
                    | {t('physicalTrainer:playerStatus.fatigueLabel')}: {player.fatigue}
                  </div>
                  {hasRestrictions && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {playerCompliance.violations.length > 0 && (
                        <span className="text-red-600">
                          {playerCompliance.violations.length} {t('physicalTrainer:medical.violations')}
                        </span>
                      )}
                      {playerCompliance.warnings.length > 0 && (
                        <span className="text-yellow-600 ml-2">
                          {playerCompliance.warnings.length} {t('physicalTrainer:medical.warnings')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewDetails(player)}
              >
                {t('common:actions.viewDetails')}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('physicalTrainer:playerStatus.trainingLoad')}</span>
                <span className="font-medium">{player.load}%</span>
              </div>
              <Progress value={player.load} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.hrVariability')}</div>
                  <div className="text-sm font-medium">{t('physicalTrainer:playerStatus.normal')}</div>
                </div>
                <div className="text-center">
                  <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.powerOutput')}</div>
                  <div className="text-sm font-medium">95%</div>
                </div>
                <div className="text-center">
                  <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">{t('physicalTrainer:playerStatus.recovery')}</div>
                  <div className="text-sm font-medium">{t('physicalTrainer:playerStatus.good')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [t, getPlayerMedicalStatus, getOverallPlayerStatus, checkPlayerCompliance, handleViewMedicalReport, handleViewDetails]);

  const containerHeight = useMemo(() => {
    // Calculate height based on viewport
    return Math.min(window.innerHeight - 300, 800);
  }, []);

  // Get medical summary
  const medicalSummary = useMemo(() => {
    if (!medicalData || medicalLoading) return null;
    return getSummary();
  }, [medicalData, medicalLoading, getSummary]);

  return (
    <div className="space-y-6">
      {/* Medical Summary Card */}
      {medicalSummary && (medicalSummary.injuredPlayers > 0 || medicalSummary.limitedPlayers > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('physicalTrainer:medical.summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{medicalSummary.healthyPlayers}</div>
                <div className="text-xs text-muted-foreground">{t('physicalTrainer:medical.healthy')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{medicalSummary.limitedPlayers}</div>
                <div className="text-xs text-muted-foreground">{t('physicalTrainer:medical.limited')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{medicalSummary.injuredPlayers}</div>
                <div className="text-xs text-muted-foreground">{t('physicalTrainer:medical.injured')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{medicalSummary.totalRestrictions}</div>
                <div className="text-xs text-muted-foreground">{t('physicalTrainer:medical.restrictions')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Status Cards */}
      <Card>
        <CardHeader>
          <CardTitle>{t('physicalTrainer:playerStatus.title')}</CardTitle>
          <CardDescription>{t('physicalTrainer:playerStatus.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <VirtualizedList
            items={playerReadiness}
            height={containerHeight}
            itemHeight={240} // Increased height to accommodate medical info
            renderItem={renderPlayerCard}
            emptyMessage={t('physicalTrainer:playerStatus.noPlayers')}
            overscan={2}
          />
        </CardContent>
      </Card>

      {/* Medical Report Modal */}
      {selectedPlayer && (
        <MedicalReportModal
          open={medicalModalOpen}
          onClose={() => {
            setMedicalModalOpen(false);
            setSelectedPlayer(null);
          }}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
        />
      )}

      {/* Player Details Modal */}
      {selectedPlayerForDetails && (
        <PlayerDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedPlayerForDetails(null);
          }}
          player={selectedPlayerForDetails}
          medicalStatus={getPlayerMedicalStatus(selectedPlayerForDetails.id.toString()) as 'healthy' | 'limited' | 'injured'}
          restrictions={getRestrictions(selectedPlayerForDetails.id.toString())}
        />
      )}
    </div>
  );
}