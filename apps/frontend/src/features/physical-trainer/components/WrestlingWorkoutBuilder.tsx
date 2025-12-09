import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  Target, 
  Shield, 
  RotateCcw,
  AlertTriangle,
  Play,
  Pause,
  Trophy,
  UserCheck,
  Scale
} from '@/components/icons';

// Import types
import {
  WrestlingProgram,
  WrestlingRound,
  WrestlingTechnique,
  TechniqueType,
  IntensityLevel,
  WeightClass,
  PartnerPairing,
  PartnerAssignmentConfig,
  BulkWrestlingSession,
  TECHNIQUE_LIBRARY,
  WRESTLING_EQUIPMENT
} from '../types/wrestling.types';

// Import shared components
import { WorkoutBuilderHeader } from './shared/WorkoutBuilderHeader';
import { PlayerTeamAssignment } from './shared/PlayerTeamAssignment';

interface WrestlingWorkoutBuilderProps {
  onSave?: (program: WrestlingProgram) => void;
  onCancel?: () => void;
  initialProgram?: WrestlingProgram;
  supportsBulkMode?: boolean;
}

const defaultRound: Omit<WrestlingRound, 'id'> = {
  name: 'New Round',
  type: 'technique',
  duration: 300, // 5 minutes
  restPeriod: 60, // 1 minute
  intensity: 'drilling',
  techniques: [],
  instructions: '',
  partnerRotation: false,
  scoring: {
    trackAttempts: true,
    trackSuccesses: true,
    trackTechnique: false
  },
  safetyProtocol: {
    tapOutAllowed: true,
    timeLimit: true,
    supervision: 'coach'
  },
  equipment: ['Wrestling mats'],
  matSpace: 'quarter'
};

const intensityColors: Record<IntensityLevel, string> = {
  technique: 'bg-green-100 text-green-800 border-green-300',
  drilling: 'bg-blue-100 text-blue-800 border-blue-300',
  live: 'bg-orange-100 text-orange-800 border-orange-300',
  competition: 'bg-red-100 text-red-800 border-red-300'
};

const intensityDescriptions: Record<IntensityLevel, string> = {
  technique: '50% - Focus on form and technique',
  drilling: '70% - Controlled repetition',
  live: '90% - Full-speed sparring',
  competition: '100% - Match simulation'
};

const WrestlingWorkoutBuilder: React.FC<WrestlingWorkoutBuilderProps> = ({
  onSave,
  onCancel,
  initialProgram,
  supportsBulkMode = false
}) => {
  const { t } = useTranslation('physicalTrainer');

  // State management
  const [program, setProgram] = useState<WrestlingProgram>(
    initialProgram || {
      id: '',
      name: 'New Wrestling Program',
      description: '',
      focus: 'technique',
      totalDuration: 60,
      rounds: [],
      partnerPairings: [],
      matRequirements: {
        mats: 1,
        size: 'practice',
        spacing: 3
      },
      safetyChecklist: [
        'Proper warm-up completed',
        'Mats inspected and clean',
        'First aid kit accessible',
        'Emergency procedures reviewed'
      ],
      progressionNotes: '',
      difficultyLevel: 'beginner'
    }
  );

  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [partnerConfig, setPartnerConfig] = useState<PartnerAssignmentConfig>({
    strategy: 'weight_based',
    maxWeightDifference: 15,
    allowSkillMismatch: false,
    rotationFrequency: 3,
    avoidRepeats: true
  });

  // Calculate total duration based on rounds
  const calculateTotalDuration = useCallback((rounds: WrestlingRound[]): number => {
    return rounds.reduce((total, round) => total + round.duration + round.restPeriod, 0) / 60; // Convert to minutes
  }, []);

  // Add new round
  const addRound = useCallback(() => {
    const newRound: WrestlingRound = {
      ...defaultRound,
      id: `round-${Date.now()}`,
      name: `Round ${program.rounds.length + 1}`
    };

    const updatedRounds = [...program.rounds, newRound];
    setProgram(prev => ({
      ...prev,
      rounds: updatedRounds,
      totalDuration: calculateTotalDuration(updatedRounds)
    }));
    setSelectedRoundIndex(updatedRounds.length - 1);
  }, [program.rounds, calculateTotalDuration]);

  // Remove round
  const removeRound = useCallback((index: number) => {
    const updatedRounds = program.rounds.filter((_, i) => i !== index);
    setProgram(prev => ({
      ...prev,
      rounds: updatedRounds,
      totalDuration: calculateTotalDuration(updatedRounds)
    }));
    setSelectedRoundIndex(null);
  }, [program.rounds, calculateTotalDuration]);

  // Update round
  const updateRound = useCallback((index: number, updates: Partial<WrestlingRound>) => {
    const updatedRounds = [...program.rounds];
    updatedRounds[index] = { ...updatedRounds[index], ...updates };
    setProgram(prev => ({
      ...prev,
      rounds: updatedRounds,
      totalDuration: calculateTotalDuration(updatedRounds)
    }));
  }, [program.rounds, calculateTotalDuration]);

  // Add technique to round
  const addTechniqueToRound = useCallback((roundIndex: number, technique: WrestlingTechnique) => {
    const updatedRounds = [...program.rounds];
    if (!updatedRounds[roundIndex].techniques.some(t => t.id === technique.id)) {
      updatedRounds[roundIndex].techniques.push(technique);
      setProgram(prev => ({ ...prev, rounds: updatedRounds }));
    }
  }, [program.rounds]);

  // Remove technique from round
  const removeTechniqueFromRound = useCallback((roundIndex: number, techniqueId: string) => {
    const updatedRounds = [...program.rounds];
    updatedRounds[roundIndex].techniques = updatedRounds[roundIndex].techniques.filter(t => t.id !== techniqueId);
    setProgram(prev => ({ ...prev, rounds: updatedRounds }));
  }, [program.rounds]);

  // Generate partner pairings
  const generatePartnerPairings = useCallback(() => {
    // This would integrate with the actual player data
    // For now, we'll create a placeholder implementation
    console.log('Generating partner pairings with config:', partnerConfig);
  }, [partnerConfig]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(program);
    }
  }, [program, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const selectedRound = selectedRoundIndex !== null ? program.rounds[selectedRoundIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <WorkoutBuilderHeader
        title={program.name || 'Wrestling Workout'}
        workoutType="wrestling"
        onSave={handleSave}
        onCancel={handleCancel}
        supportsBulkMode={supportsBulkMode}
        bulkMode={bulkMode}
        onBulkToggle={setBulkMode}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Main Program Configuration */}
        <div className="col-span-8">
          <Tabs defaultValue="program" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="rounds">Rounds</TabsTrigger>
              <TabsTrigger value="partners">Partners</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>

            {/* Program Configuration */}
            <TabsContent value="program" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Program Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="program-name">Program Name</Label>
                      <Input
                        id="program-name"
                        value={program.name}
                        onChange={(e) => setProgram(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Beginner Wrestling Fundamentals"
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={program.difficultyLevel}
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') =>
                          setProgram(prev => ({ ...prev, difficultyLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={program.description}
                      onChange={(e) => setProgram(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the focus and goals of this wrestling program..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="focus">Focus Area</Label>
                      <Select
                        value={program.focus}
                        onValueChange={(value: 'technique' | 'conditioning' | 'competition' | 'mixed') =>
                          setProgram(prev => ({ ...prev, focus: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technique">Technique</SelectItem>
                          <SelectItem value="conditioning">Conditioning</SelectItem>
                          <SelectItem value="competition">Competition</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Total Duration</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {Math.round(program.totalDuration)} minutes
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label>Total Rounds</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {program.rounds.length} rounds
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mat Requirements */}
                  <div>
                    <Label className="text-base font-medium">Mat Requirements</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="mats-count">Number of Mats</Label>
                        <Input
                          id="mats-count"
                          type="number"
                          min="1"
                          value={program.matRequirements.mats}
                          onChange={(e) => setProgram(prev => ({
                            ...prev,
                            matRequirements: {
                              ...prev.matRequirements,
                              mats: parseInt(e.target.value) || 1
                            }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mat-size">Mat Size</Label>
                        <Select
                          value={program.matRequirements.size}
                          onValueChange={(value: 'competition' | 'practice' | 'mini') =>
                            setProgram(prev => ({
                              ...prev,
                              matRequirements: { ...prev.matRequirements, size: value }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="competition">Competition (12x12m)</SelectItem>
                            <SelectItem value="practice">Practice (10x10m)</SelectItem>
                            <SelectItem value="mini">Mini (8x8m)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mat-spacing">Spacing (meters)</Label>
                        <Input
                          id="mat-spacing"
                          type="number"
                          min="1"
                          max="10"
                          value={program.matRequirements.spacing}
                          onChange={(e) => setProgram(prev => ({
                            ...prev,
                            matRequirements: {
                              ...prev.matRequirements,
                              spacing: parseInt(e.target.value) || 3
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rounds Configuration */}
            <TabsContent value="rounds" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Training Rounds</h3>
                <Button onClick={addRound} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Round
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {program.rounds.map((round, index) => (
                  <Card
                    key={round.id}
                    className={`cursor-pointer transition-all ${
                      selectedRoundIndex === index
                        ? 'ring-2 ring-amber-500 shadow-md'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedRoundIndex(index)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">{round.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(round.duration / 60)}:{(round.duration % 60).toString().padStart(2, '0')}
                              </span>
                              <Badge className={intensityColors[round.intensity]}>
                                {round.intensity}
                              </Badge>
                              <span>{round.techniques.length} techniques</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRound(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Round Editor */}
              {selectedRound && selectedRoundIndex !== null && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Edit Round: {selectedRound.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="round-name">Round Name</Label>
                        <Input
                          id="round-name"
                          value={selectedRound.name}
                          onChange={(e) => updateRound(selectedRoundIndex, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="round-type">Round Type</Label>
                        <Select
                          value={selectedRound.type}
                          onValueChange={(value: 'warmup' | 'technique' | 'drilling' | 'live' | 'conditioning' | 'cooldown') =>
                            updateRound(selectedRoundIndex, { type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warmup">Warm-up</SelectItem>
                            <SelectItem value="technique">Technique</SelectItem>
                            <SelectItem value="drilling">Drilling</SelectItem>
                            <SelectItem value="live">Live Wrestling</SelectItem>
                            <SelectItem value="conditioning">Conditioning</SelectItem>
                            <SelectItem value="cooldown">Cool-down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="30"
                          max="1800"
                          value={selectedRound.duration}
                          onChange={(e) => updateRound(selectedRoundIndex, { 
                            duration: parseInt(e.target.value) || 300 
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rest">Rest Period (seconds)</Label>
                        <Input
                          id="rest"
                          type="number"
                          min="0"
                          max="300"
                          value={selectedRound.restPeriod}
                          onChange={(e) => updateRound(selectedRoundIndex, { 
                            restPeriod: parseInt(e.target.value) || 60 
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="intensity">Intensity Level</Label>
                        <Select
                          value={selectedRound.intensity}
                          onValueChange={(value: IntensityLevel) =>
                            updateRound(selectedRoundIndex, { intensity: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technique">
                              <div className="flex flex-col">
                                <span>Technique</span>
                                <span className="text-xs text-muted-foreground">
                                  {intensityDescriptions.technique}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="drilling">
                              <div className="flex flex-col">
                                <span>Drilling</span>
                                <span className="text-xs text-muted-foreground">
                                  {intensityDescriptions.drilling}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="live">
                              <div className="flex flex-col">
                                <span>Live</span>
                                <span className="text-xs text-muted-foreground">
                                  {intensityDescriptions.live}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="competition">
                              <div className="flex flex-col">
                                <span>Competition</span>
                                <span className="text-xs text-muted-foreground">
                                  {intensityDescriptions.competition}
                                </span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instructions">Round Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={selectedRound.instructions}
                        onChange={(e) => updateRound(selectedRoundIndex, { instructions: e.target.value })}
                        placeholder="Specific instructions for this round..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="partner-rotation"
                          checked={selectedRound.partnerRotation}
                          onCheckedChange={(checked) =>
                            updateRound(selectedRoundIndex, { partnerRotation: checked })
                          }
                        />
                        <Label htmlFor="partner-rotation">Partner Rotation</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="tap-outs"
                          checked={selectedRound.safetyProtocol.tapOutAllowed}
                          onCheckedChange={(checked) =>
                            updateRound(selectedRoundIndex, {
                              safetyProtocol: {
                                ...selectedRound.safetyProtocol,
                                tapOutAllowed: checked
                              }
                            })
                          }
                        />
                        <Label htmlFor="tap-outs">Allow Tap Outs</Label>
                      </div>
                    </div>

                    {/* Technique Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base font-medium">Selected Techniques</Label>
                        <span className="text-sm text-muted-foreground">
                          {selectedRound.techniques.length} techniques
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedRound.techniques.map((technique) => (
                          <Badge
                            key={technique.id}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {technique.name}
                            <button
                              onClick={() => removeTechniqueFromRound(selectedRoundIndex, technique.id)}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Partner Configuration */}
            <TabsContent value="partners" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Partner Assignment Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="strategy">Assignment Strategy</Label>
                      <Select
                        value={partnerConfig.strategy}
                        onValueChange={(value: 'weight_based' | 'skill_based' | 'mixed' | 'random') =>
                          setPartnerConfig(prev => ({ ...prev, strategy: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weight_based">Weight-Based</SelectItem>
                          <SelectItem value="skill_based">Skill-Based</SelectItem>
                          <SelectItem value="mixed">Mixed Criteria</SelectItem>
                          <SelectItem value="random">Random</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weight-diff">Max Weight Difference (kg)</Label>
                      <Input
                        id="weight-diff"
                        type="number"
                        min="5"
                        max="30"
                        value={partnerConfig.maxWeightDifference}
                        onChange={(e) => setPartnerConfig(prev => ({
                          ...prev,
                          maxWeightDifference: parseInt(e.target.value) || 15
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rotation-freq">Rotation Frequency (rounds)</Label>
                      <Input
                        id="rotation-freq"
                        type="number"
                        min="1"
                        max="10"
                        value={partnerConfig.rotationFrequency}
                        onChange={(e) => setPartnerConfig(prev => ({
                          ...prev,
                          rotationFrequency: parseInt(e.target.value) || 3
                        }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="skill-mismatch"
                        checked={partnerConfig.allowSkillMismatch}
                        onCheckedChange={(checked) =>
                          setPartnerConfig(prev => ({ ...prev, allowSkillMismatch: checked }))
                        }
                      />
                      <Label htmlFor="skill-mismatch">Allow Skill Mismatch</Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="avoid-repeats"
                      checked={partnerConfig.avoidRepeats}
                      onCheckedChange={(checked) =>
                        setPartnerConfig(prev => ({ ...prev, avoidRepeats: checked }))
                      }
                    />
                    <Label htmlFor="avoid-repeats">Avoid Repeat Pairings</Label>
                  </div>

                  <Button onClick={generatePartnerPairings} className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Generate Partner Pairings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Safety Configuration */}
            <TabsContent value="safety" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Safety Checklist</Label>
                    <div className="space-y-2 mt-2">
                      {program.safetyChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Required Equipment</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {WRESTLING_EQUIPMENT.REQUIRED.map((equipment) => (
                        <Badge key={equipment} variant="secondary" className="justify-start">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Safety Equipment</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {WRESTLING_EQUIPMENT.SAFETY.map((equipment) => (
                        <Badge key={equipment} variant="outline" className="justify-start">
                          <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="progression-notes">Progression Notes</Label>
                    <Textarea
                      id="progression-notes"
                      value={program.progressionNotes}
                      onChange={(e) => setProgram(prev => ({ ...prev, progressionNotes: e.target.value }))}
                      placeholder="Notes on safety progression, modifications, or special considerations..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Player Assignment */}
          <PlayerTeamAssignment
            selectedPlayers={selectedPlayers}
            selectedTeams={selectedTeams}
            onPlayersChange={setSelectedPlayers}
            onTeamsChange={setSelectedTeams}
            showMedical={true}
            title="Wrestler Assignment"
          />

          {/* Technique Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Technique Library</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {Object.entries(TECHNIQUE_LIBRARY.categories).map(([category, techniques]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm capitalize mb-2">{category}</h4>
                      <div className="space-y-1">
                        {techniques.map((technique) => (
                          <Button
                            key={technique.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-auto p-2"
                            onClick={() => selectedRoundIndex !== null && 
                              addTechniqueToRound(selectedRoundIndex, technique)}
                            disabled={selectedRoundIndex === null}
                          >
                            <div className="text-left">
                              <div className="font-medium text-xs">{technique.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {technique.difficulty} • {technique.type}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Program Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Duration:</span>
                <span className="font-medium">{Math.round(program.totalDuration)} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rounds:</span>
                <span className="font-medium">{program.rounds.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mats Required:</span>
                <span className="font-medium">{program.matRequirements.mats}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Difficulty:</span>
                <span className="font-medium capitalize">{program.difficultyLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Focus:</span>
                <span className="font-medium capitalize">{program.focus}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WrestlingWorkoutBuilder;