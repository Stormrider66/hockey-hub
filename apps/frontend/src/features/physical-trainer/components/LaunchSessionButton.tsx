'use client';

import React, { useState } from 'react';
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
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '75', label: '75 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '2 hours' },
];

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Recovery & mobility focus' },
  { value: 'medium', label: 'Medium', description: 'Moderate effort, skill development' },
  { value: 'high', label: 'High', description: 'High intensity, performance focus' },
  { value: 'max', label: 'Maximum', description: 'Peak performance testing' },
];

const FOCUS_AREAS = [
  { id: 'strength', label: 'Strength', icon: Dumbbell },
  { id: 'speed', label: 'Speed', icon: Target },
  { id: 'endurance', label: 'Endurance', icon: Clock },
  { id: 'agility', label: 'Agility', icon: Users },
  { id: 'power', label: 'Power', icon: Target },
  { id: 'flexibility', label: 'Flexibility', icon: MapPin },
];

const EQUIPMENT_OPTIONS = [
  'Barbells', 'Dumbbells', 'Kettlebells', 'Medicine Balls',
  'Resistance Bands', 'Agility Ladder', 'Cones', 'Jump Boxes',
  'TRX Straps', 'Foam Rollers', 'Battle Ropes', 'Sleds'
];

// Mock players data - in real app, this would come from props or API
const MOCK_PLAYERS = [
  { id: '1', name: 'Erik Andersson', number: 15, status: 'ready' },
  { id: '2', name: 'Marcus Lindberg', number: 7, status: 'ready' },
  { id: '3', name: 'Viktor Nilsson', number: 23, status: 'caution' },
  { id: '4', name: 'Johan Bergström', number: 12, status: 'ready' },
  { id: '5', name: 'Anders Johansson', number: 3, status: 'rest' },
];

export default function LaunchSessionButton({
  sessionType = 'Training Session',
  teamId,
  teamName = 'Team',
  sessionCategory = 'General Training',
  size = 'default',
  variant = 'default',
  onLaunch,
  onClick,
  className
}: LaunchSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    duration: '60',
    intensity: 'medium',
    focus: [],
    selectedPlayers: MOCK_PLAYERS.filter(p => p.status === 'ready').map(p => p.id),
    notes: '',
    warmupDuration: '10',
    cooldownDuration: '10',
    equipmentNeeded: []
  });

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

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleOpen}
        className={cn("gap-2", className)}
      >
        <Play className="h-4 w-4" />
        Launch Session
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Launch Training Session</DialogTitle>
            <DialogDescription>
              Configure and launch {sessionCategory} for {teamName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Session Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{totalDuration}</p>
                    <p className="text-sm text-muted-foreground">Total Minutes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedPlayersCount}</p>
                    <p className="text-sm text-muted-foreground">Players Selected</p>
                  </div>
                  <div>
                    <Badge 
                      variant={
                        config.intensity === 'high' || config.intensity === 'max' ? 'destructive' :
                        config.intensity === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {config.intensity} intensity
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration & Intensity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Duration</Label>
                <Select value={config.duration} onValueChange={(value) => updateConfig('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Intensity Level</Label>
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
                <Label>Warmup Duration (minutes)</Label>
                <Select value={config.warmupDuration} onValueChange={(value) => updateConfig('warmupDuration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cooldown Duration (minutes)</Label>
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
              <Label>Training Focus Areas</Label>
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
              <Label>Select Players ({selectedPlayersCount} selected)</Label>
              <ScrollArea className="h-48 border rounded-md p-4">
                <div className="space-y-2">
                  {MOCK_PLAYERS.map(player => (
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
                        {player.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>Equipment Needed</Label>
              <div className="grid grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map(equipment => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      checked={config.equipmentNeeded.includes(equipment)}
                      onCheckedChange={() => toggleEquipment(equipment)}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {equipment}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <Textarea
                placeholder="Add any specific instructions or notes for this session..."
                value={config.notes}
                onChange={(e) => updateConfig('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLaunch} 
              disabled={isLaunching || selectedPlayersCount === 0}
            >
              {isLaunching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Launch Session
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}