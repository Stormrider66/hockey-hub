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
  AlertCircle, CheckCircle2, X, Heart, CheckCircle,
  Maximize2, Minimize2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useGetPlayersQuery } from '@/store/api/playerApi';
import { useAuth } from '@/contexts/AuthContext';
import { workoutTemplates, modifiedWorkoutTemplates, individualPlayerWorkouts } from '../constants/workoutTemplates';
import { usePhysicalTrainerData } from '../hooks/usePhysicalTrainerData';

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

// Medical status for specific players
const playerMedicalStatus: Record<string, 'injured' | 'limited' | 'ready'> = {
  '2': 'injured',    // Oscar Möller - injured
  '5': 'limited',    // Max Lindholm - limited
  '11': 'injured',   // Dylan Sikura - injured  
  '14': 'limited',   // Arvid Lundberg - limited
};

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModifiedWorkout, setShowModifiedWorkout] = useState(false);
  const [selectedPlayerWorkout, setSelectedPlayerWorkout] = useState<string | null>(null);
  
  // Get team roster from Physical Trainer data
  const { players: teamPlayers } = usePhysicalTrainerData(teamId || 'a-team');
  
  // Transform players data with medical status
  const players = useMemo(() => {
    return teamPlayers.map(player => ({
      id: player.id,
      name: player.name,
      number: player.number,
      position: player.position,
      status: playerMedicalStatus[player.id] || 'ready'
    }));
  }, [teamPlayers]);
  
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

  // Option to skip config and go directly to briefing
  const handleQuickLaunch = () => {
    if (onLaunch) {
      onLaunch();
    }
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
  
  // Get modified workout for injured/limited players
  const getModifiedWorkout = (type: string) => {
    const modifiedType = type as keyof typeof modifiedWorkoutTemplates;
    return modifiedWorkoutTemplates[modifiedType] || modifiedWorkoutTemplates.strength;
  };
  
  // Get workout to display based on selection
  const getWorkoutToDisplay = () => {
    const workoutType = sessionType || 'strength';
    
    // If a specific player is selected, show their individual workout
    if (selectedPlayerWorkout && individualPlayerWorkouts[selectedPlayerWorkout]) {
      const playerWorkouts = individualPlayerWorkouts[selectedPlayerWorkout];
      return playerWorkouts[workoutType] || playerWorkouts.strength || workoutTemplates[workoutType as keyof typeof workoutTemplates];
    }
    
    // Otherwise show the general workout or modified workout
    if (showModifiedWorkout) {
      return getModifiedWorkout(workoutType);
    }
    
    return workoutTemplates[workoutType as keyof typeof workoutTemplates] || workoutTemplates.strength;
  };
  
  // Get the selected player info
  const selectedPlayer = selectedPlayerWorkout 
    ? players.find(p => p.id === selectedPlayerWorkout)
    : null;

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleOpen}
        className={cn("gap-2", className)}
      >
        <Play className="h-4 w-4" />
        {t('sessions.viewWorkout')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden flex flex-col",
            isFullscreen 
              ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 !translate-x-0 !translate-y-0 !top-0 !left-0" 
              : "max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]"
          )}
          style={isFullscreen ? { transform: 'none', top: 0, left: 0 } : undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t('sessions.launchTrainingSession')}</DialogTitle>
            <DialogDescription>
              {t('sessions.configureAndLaunch', { 
                category: sessionCategory || t('physicalTrainer:training.sessionTypes.generalTraining'), 
                team: teamName || t('physicalTrainer:training.teams.team') 
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-1 min-h-0">
            {/* Left side - Team Roster */}
            <div className="w-1/4 border-r bg-card flex flex-col">
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Team Roster</h3>
                  <p className="text-sm text-muted-foreground">
                    {teamName || 'Team'} • {players.length} players
                  </p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-1">
                  {players.map(player => {
                    const isSelected = config.selectedPlayers.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors",
                          isSelected && "bg-accent",
                          player.status === 'injured' && "opacity-50",
                          selectedPlayerWorkout === player.id && "ring-2 ring-primary"
                        )}
                        onClick={() => !player.status || player.status !== 'injured' ? togglePlayer(player.id) : null}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={player.status === 'injured'}
                          className="pointer-events-none"
                        />
                        <span className="font-medium text-sm">#{player.number}</span>
                        <span className="flex-1 text-sm truncate">{player.name}</span>
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (player.status === 'ready') {
                              setSelectedPlayerWorkout(null);
                            } else {
                              setSelectedPlayerWorkout(player.id);
                            }
                          }}
                          title={
                            player.status === 'ready' 
                              ? 'Click to view main workout' 
                              : `Click to view ${player.name}'s modified workout`
                          }
                        >
                          {player.status === 'ready' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {player.status === 'limited' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                          {player.status === 'injured' && <Heart className="h-3 w-3 text-red-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between mb-2">
                    <span>Selected:</span>
                    <span className="font-medium">{selectedPlayersCount} players</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Duration:</span>
                    <span className="font-medium">{totalDuration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Intensity:</span>
                    <Badge variant={
                      config.intensity === 'high' || config.intensity === 'max' ? 'destructive' :
                      config.intensity === 'medium' ? 'default' : 'secondary'
                    }>
                      {t(`physicalTrainer:training.intensity.${config.intensity}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Workout Display */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 border-b shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {sessionCategory || t('physicalTrainer:training.sessionTypes.generalTraining')}
                    </h2>
                    <p className="text-muted-foreground">
                      Session briefing for {teamName || 'Team'} • {new Date().toLocaleDateString()}
                    </p>
                    {selectedPlayer && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={selectedPlayer.status === 'injured' ? 'destructive' : 'secondary'}>
                          Viewing: {selectedPlayer.name} (#{selectedPlayer.number})
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedPlayerWorkout(null)}
                          className="h-6 px-2 text-xs"
                        >
                          Back to main workout
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="ml-4"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Show toggle if there are injured/limited players and not viewing individual workout */}
                {!selectedPlayerWorkout && players.some(p => p.status === 'injured' || p.status === 'limited') && (
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      variant={showModifiedWorkout ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowModifiedWorkout(!showModifiedWorkout)}
                      className="gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      {showModifiedWorkout ? 'Showing Modified Workout' : 'Show Modified Workout'}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {players.filter(p => p.status === 'injured' || p.status === 'limited').length} players need modifications
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden bg-muted/20">
                <div 
                  className="h-full overflow-y-scroll p-8"
                  style={{ 
                    overflowY: 'scroll',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.3) transparent'
                  }}
                >
                  <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {getWorkoutToDisplay()}
                  </pre>
                  {/* Add extra space at bottom to ensure scrollbar appears */}
                  <div className="h-10" />
                </div>
              </div>
              
              <DialogFooter className="p-6 border-t shrink-0">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t('sessions.cancel')}
                </Button>
                <Button 
                  onClick={handleLaunch} 
                  disabled={isLaunching || selectedPlayersCount === 0}
                  className="min-w-[140px]"
                >
                  {isLaunching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t('sessions.launching')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('sessions.launchSession')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}