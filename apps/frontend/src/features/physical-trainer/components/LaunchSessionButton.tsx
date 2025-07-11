'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Clock, Users, MapPin, Dumbbell, Target, 
  AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useGetPlayersQuery } from '@/store/api/playerApi';
import { useAuth } from '@/contexts/AuthContext';

interface LaunchSessionButtonProps {
  sessionType?: string;
  teamId?: string;
  teamName?: string;
  sessionCategory?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  onLaunch?: () => void;
  onClick?: () => void;
  className?: string;
}

interface SessionConfig {
  duration: string;
  intensity: string;
  focus: string[];
  selectedPlayers: string[];
  notes: string;
  warmupDuration: string;
  cooldownDuration: string;
  equipmentNeeded: string[];
}

const DURATION_OPTIONS = [
  { value: '30', label: '30' },
  { value: '45', label: '45' },
  { value: '60', label: '60' },
  { value: '75', label: '75' },
  { value: '90', label: '90' },
  { value: '120', label: '120' },
];

const getIntensityOptions = (t: any) => [
  { value: 'low', label: t('training.intensity.low'), description: t('training.sessionDescriptions.recoveryMobilityFocus') },
  { value: 'medium', label: t('training.intensity.medium'), description: t('training.sessionDescriptions.moderateEffortSkillDevelopment') },
  { value: 'high', label: t('training.intensity.high'), description: t('training.sessionDescriptions.highIntensityPerformanceFocus') },
  { value: 'max', label: t('training.intensity.max'), description: t('training.sessionDescriptions.peakPerformanceTesting') },
];

const getFocusAreas = (t: any) => [
  { id: 'strength', label: t('exercises.focusAreas.strength'), icon: Dumbbell },
  { id: 'speed', label: t('exercises.focusAreas.speed'), icon: Target },
  { id: 'endurance', label: t('exercises.focusAreas.endurance'), icon: Clock },
  { id: 'agility', label: t('exercises.focusAreas.agility'), icon: Users },
  { id: 'power', label: t('exercises.focusAreas.power'), icon: Target },
  { id: 'flexibility', label: t('exercises.focusAreas.flexibility'), icon: MapPin },
];

const getEquipmentOptions = (t: any) => [
  { id: 'barbells', label: t('exercises.equipment.barbells') },
  { id: 'dumbbells', label: t('exercises.equipment.dumbbells') },
  { id: 'kettlebells', label: t('exercises.equipment.kettlebells') },
  { id: 'medicineBalls', label: t('exercises.equipment.medicineBalls') },
  { id: 'resistanceBands', label: t('exercises.equipment.resistanceBands') },
  { id: 'agilityLadder', label: t('exercises.equipment.agilityLadder') },
  { id: 'cones', label: t('exercises.equipment.cones') },
  { id: 'jumpBoxes', label: t('exercises.equipment.jumpBoxes') },
  { id: 'trxStraps', label: t('exercises.equipment.trxStraps') },
  { id: 'foamRollers', label: t('exercises.equipment.foamRollers') },
  { id: 'battleRopes', label: t('exercises.equipment.battleRopes') },
  { id: 'sleds', label: t('exercises.equipment.sleds') }
];

export default function LaunchSessionButton({
  sessionType,
  teamId,
  teamName,
  sessionCategory,
  size = 'default',
  variant = 'default',
  onLaunch,
  onClick,
  className
}: LaunchSessionButtonProps) {
  const { t } = useTranslation('physicalTrainer');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Fetch real players data
  const { data: playersData, isLoading: playersLoading } = useGetPlayersQuery({
    organizationId: user?.organizationId || '',
    includeStats: false
  });
  
  // Transform players data with mock status for now
  const players = useMemo(() => {
    if (!playersData?.players) return [];
    return playersData.players.map(player => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      number: parseInt(player.jerseyNumber || '0'),
      status: 'ready' as const // In production, this would come from medical service
    }));
  }, [playersData]);
  
  const [config, setConfig] = useState<SessionConfig>({
    duration: '60',
    intensity: 'medium',
    focus: [],
    selectedPlayers: [],
    notes: '',
    warmupDuration: '10',
    cooldownDuration: '10',
    equipmentNeeded: []
  });
  
  // Update selected players when players data loads
  useEffect(() => {
    if (players.length > 0 && config.selectedPlayers.length === 0) {
      setConfig(prev => ({
        ...prev,
        selectedPlayers: players.filter(p => p.status === 'ready').map(p => p.id)
      }));
    }
  }, [players]);

  const handleOpen = () => {
    if (onClick) {
      onClick();
    }
    setIsOpen(true);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onLaunch) {
      onLaunch();
    }
    
    setIsLaunching(false);
    setIsOpen(false);
  };

  const updateConfig = <K extends keyof SessionConfig>(field: K, value: SessionConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (focusId: string) => {
    setConfig(prev => ({
      ...prev,
      focus: prev.focus.includes(focusId)
        ? prev.focus.filter(f => f !== focusId)
        : [...prev.focus, focusId]
    }));
  };

  const togglePlayer = (playerId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(playerId)
        ? prev.selectedPlayers.filter(p => p !== playerId)
        : [...prev.selectedPlayers, playerId]
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setConfig(prev => ({
      ...prev,
      equipmentNeeded: prev.equipmentNeeded.includes(equipment)
        ? prev.equipmentNeeded.filter(e => e !== equipment)
        : [...prev.equipmentNeeded, equipment]
    }));
  };

  const selectedPlayersCount = config.selectedPlayers.length;
  const totalDuration = parseInt(config.duration) + parseInt(config.warmupDuration) + parseInt(config.cooldownDuration);
  
  const INTENSITY_OPTIONS = getIntensityOptions(t);
  const FOCUS_AREAS = getFocusAreas(t);
  const EQUIPMENT_OPTIONS = getEquipmentOptions(t);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleOpen}
        className={cn("gap-2", className)}
      >
        <Play className="h-4 w-4" />
        {t('physicalTrainer:sessions.launchSession')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('physicalTrainer:sessions.launchTrainingSession')}</DialogTitle>
            <DialogDescription>
              {t('physicalTrainer:sessions.configureAndLaunch', { 
                category: sessionCategory || t('physicalTrainer:training.sessionTypes.generalTraining'), 
                team: teamName || t('physicalTrainer:training.teams.team') 
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Session Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{totalDuration}</p>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:sessions.totalMinutes')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedPlayersCount}</p>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:sessions.playersSelected')}</p>
                  </div>
                  <div>
                    <Badge 
                      variant={
                        config.intensity === 'high' || config.intensity === 'max' ? 'destructive' :
                        config.intensity === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {t(`physicalTrainer:training.intensity.${config.intensity}`)} {t('physicalTrainer:sessions.intensity', { level: '' }).replace('{{level}} ', '')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration & Intensity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('physicalTrainer:sessions.sessionDuration')}</Label>
                <Select value={config.duration} onValueChange={(value) => updateConfig('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value === '120' ? `2 ${t('sessions.hours')}` : `${option.label} ${t('sessions.minutes')}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('physicalTrainer:sessions.intensityLevel')}</Label>
                <Select value={config.intensity} onValueChange={(value) => updateConfig('intensity', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENSITY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Warmup & Cooldown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('physicalTrainer:sessions.warmupDuration')}</Label>
                <Select value={config.warmupDuration} onValueChange={(value) => updateConfig('warmupDuration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 {t('sessions.minutes')}</SelectItem>
                    <SelectItem value="10">10 {t('sessions.minutes')}</SelectItem>
                    <SelectItem value="15">15 {t('sessions.minutes')}</SelectItem>
                    <SelectItem value="20">20 {t('sessions.minutes')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('physicalTrainer:sessions.cooldownDuration')}</Label>
                <Select value={config.cooldownDuration} onValueChange={(value) => updateConfig('cooldownDuration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:sessions.trainingFocusAreas')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {FOCUS_AREAS.map(area => (
                  <Button
                    key={area.id}
                    variant={config.focus.includes(area.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFocusArea(area.id)}
                    className="justify-start"
                  >
                    <area.icon className="h-4 w-4 mr-2" />
                    {area.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Player Selection */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:sessions.selectPlayers', { count: selectedPlayersCount })}</Label>
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                  {players.map(player => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={config.selectedPlayers.includes(player.id)}
                          onCheckedChange={() => togglePlayer(player.id)}
                          disabled={player.status === 'rest'}
                        />
                        <span className="font-medium">#{player.number}</span>
                        <span>{player.name}</span>
                      </div>
                      <Badge variant={
                        player.status === 'ready' ? 'default' :
                        player.status === 'caution' ? 'secondary' : 'destructive'
                      }>
                        {player.status === 'ready' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {player.status === 'caution' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {player.status === 'rest' && <X className="h-3 w-3 mr-1" />}
                        {t(`playerStatus.status.${player.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:sessions.equipmentNeeded')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map(equipment => (
                  <div key={equipment.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={config.equipmentNeeded.includes(equipment.id)}
                      onCheckedChange={() => toggleEquipment(equipment.id)}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {equipment.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:sessions.sessionNotes')}</Label>
              <Textarea
                placeholder={t('physicalTrainer:sessions.addInstructions')}
                value={config.notes}
                onChange={(e) => updateConfig('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('physicalTrainer:sessions.cancel')}
            </Button>
            <Button 
              onClick={handleLaunch} 
              disabled={isLaunching || selectedPlayersCount === 0}
            >
              {isLaunching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('physicalTrainer:sessions.launching')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t('physicalTrainer:sessions.launchSession')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}