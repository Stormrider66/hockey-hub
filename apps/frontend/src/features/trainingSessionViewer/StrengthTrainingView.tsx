import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dumbbell, Users, Timer, TrendingUp, Activity, 
  ChevronRight, CheckCircle2, Circle, Play, Pause,
  RotateCcw, Zap, Gauge, Weight
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  status: 'ready' | 'limited' | 'unavailable';
}

interface SetData {
  weight?: number;
  speed?: number;
  avgPower?: number;
  maxPower?: number;
  device?: string;
  completed: boolean;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  completed: boolean;
  notes?: string;
  previousBest?: string;
  setData?: SetData[];
}

interface RestTimerData {
  exerciseId: string;
  setNumber: number;
  timeRemaining: number;
  isRunning: boolean;
}

interface StrengthProgram {
  playerId: string;
  programName: string;
  focus: string;
  exercises: {
    warmup: Exercise[];
    main: Exercise[];
    accessory: Exercise[];
    cooldown: Exercise[];
  };
  notes?: string;
}

// Mock J20 team roster
const j20Roster: Player[] = [
  { id: '1', name: 'Viktor Lindqvist', number: 9, position: 'Forward', status: 'ready' },
  { id: '2', name: 'Adam Bergström', number: 12, position: 'Forward', status: 'ready' },
  { id: '3', name: 'Emil Johansson', number: 7, position: 'Forward', status: 'limited' },
  { id: '4', name: 'Oscar Nilsson', number: 15, position: 'Forward', status: 'ready' },
  { id: '5', name: 'Lucas Andersson', number: 22, position: 'Defenseman', status: 'ready' },
  { id: '6', name: 'Filip Eriksson', number: 4, position: 'Defenseman', status: 'ready' },
  { id: '7', name: 'Max Pettersson', number: 28, position: 'Defenseman', status: 'unavailable' },
  { id: '8', name: 'Jesper Olsson', number: 35, position: 'Goalie', status: 'ready' },
  { id: '9', name: 'Carl Svensson', number: 18, position: 'Forward', status: 'ready' },
  { id: '10', name: 'Anton Larsson', number: 11, position: 'Forward', status: 'ready' },
];

// Mock strength programs for each player
const getPlayerProgram = (playerId: string): StrengthProgram => {
  // Base program structure that varies slightly per player
  const baseProgram: StrengthProgram = {
    playerId,
    programName: 'In-Season Power Development',
    focus: 'Power & Explosive Strength',
    exercises: {
      warmup: [
        { id: 'w1', name: 'Dynamic Stretching', sets: 1, reps: '5 min', rest: '-', completed: false },
        { id: 'w2', name: 'Band Pull-Aparts', sets: 2, reps: '15', rest: '30s', completed: false },
        { id: 'w3', name: 'Box Jumps (Low)', sets: 3, reps: '5', rest: '60s', completed: false },
      ],
      main: [
        { 
          id: 'm1', 
          name: 'Power Clean', 
          sets: 4, 
          reps: '3', 
          weight: '80% 1RM', 
          rest: '3 min', 
          completed: false,
          previousBest: '85kg x 3',
          notes: 'Focus on explosive hip drive'
        },
        { 
          id: 'm2', 
          name: 'Back Squat', 
          sets: 4, 
          reps: '5', 
          weight: '85% 1RM', 
          rest: '3 min', 
          completed: false,
          previousBest: '120kg x 5',
          notes: 'Control descent, explosive up'
        },
        { 
          id: 'm3', 
          name: 'Bench Press', 
          sets: 4, 
          reps: '5', 
          weight: '80% 1RM', 
          rest: '2.5 min', 
          completed: false,
          previousBest: '90kg x 5'
        },
      ],
      accessory: [
        { id: 'a1', name: 'Bulgarian Split Squats', sets: 3, reps: '8 each', weight: 'DBs', rest: '90s', completed: false },
        { id: 'a2', name: 'Bent-Over Row', sets: 3, reps: '10', weight: 'Barbell', rest: '90s', completed: false },
        { id: 'a3', name: 'Russian Twists', sets: 3, reps: '20', weight: 'Med Ball', rest: '60s', completed: false },
      ],
      cooldown: [
        { id: 'c1', name: 'Static Stretching', sets: 1, reps: '10 min', rest: '-', completed: false },
        { id: 'c2', name: 'Foam Rolling', sets: 1, reps: '5 min', rest: '-', completed: false },
      ]
    },
    notes: 'Week 3 of power phase. Increase weight if all reps completed with good form.'
  };

  // Add player-specific variations
  if (playerId === '3') { // Emil - limited status
    baseProgram.programName = 'Modified Program - Limited';
    baseProgram.focus = 'Maintenance & Recovery';
    baseProgram.exercises.main[0].weight = '60% 1RM';
    baseProgram.exercises.main[1].weight = '70% 1RM';
    baseProgram.notes = 'Reduced intensity due to minor shoulder discomfort. Focus on form.';
  }

  return baseProgram;
};

interface StrengthTrainingViewProps {
  teamName?: string;
}

export default function StrengthTrainingView({ teamName = 'J20 Team' }: StrengthTrainingViewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(j20Roster[0]);
  const [program, setProgram] = useState<StrengthProgram>(getPlayerProgram(j20Roster[0].id));
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [restTimers, setRestTimers] = useState<{ [key: string]: RestTimerData }>({});

  // Initialize set data for exercises
  useEffect(() => {
    const updatedProgram = { ...program };
    ['warmup', 'main', 'accessory', 'cooldown'].forEach((section) => {
      updatedProgram.exercises[section as keyof typeof updatedProgram.exercises] = 
        updatedProgram.exercises[section as keyof typeof updatedProgram.exercises].map(ex => ({
          ...ex,
          setData: ex.setData || Array(ex.sets).fill(null).map(() => ({ completed: false }))
        }));
    });
    setProgram(updatedProgram);
  }, [selectedPlayer.id]);

  // Rest timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRestTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].isRunning && updated[key].timeRemaining > 0) {
            updated[key].timeRemaining -= 1;
          } else if (updated[key].timeRemaining === 0) {
            updated[key].isRunning = false;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setProgram(getPlayerProgram(player.id));
    setRestTimers({});
  };

  const startRestTimer = (exerciseId: string, setNumber: number, restTime: string) => {
    const seconds = parseRestTime(restTime);
    setRestTimers(prev => ({
      ...prev,
      [`${exerciseId}-${setNumber}`]: {
        exerciseId,
        setNumber,
        timeRemaining: seconds,
        isRunning: true
      }
    }));
  };

  const parseRestTime = (restTime: string): number => {
    if (restTime.includes('min')) {
      const minutes = parseFloat(restTime.replace('min', '').trim());
      return minutes * 60;
    } else if (restTime.includes('s')) {
      return parseInt(restTime.replace('s', '').trim());
    }
    return 90; // default
  };

  const updateSetData = (
    section: keyof StrengthProgram['exercises'], 
    exerciseId: string, 
    setIndex: number, 
    field: keyof SetData, 
    value: any
  ) => {
    setProgram(prev => ({
      ...prev,
      exercises: {
        ...prev.exercises,
        [section]: prev.exercises[section].map(ex => {
          if (ex.id === exerciseId && ex.setData) {
            const newSetData = [...ex.setData];
            newSetData[setIndex] = {
              ...newSetData[setIndex],
              [field]: value
            };
            return { ...ex, setData: newSetData };
          }
          return ex;
        })
      }
    }));
  };

  const completeSet = (
    section: keyof StrengthProgram['exercises'], 
    exerciseId: string, 
    setIndex: number
  ) => {
    updateSetData(section, exerciseId, setIndex, 'completed', true);
    
    // Check if all sets are completed
    const exercise = program.exercises[section].find(ex => ex.id === exerciseId);
    if (exercise && exercise.setData) {
      const allCompleted = exercise.setData.every((set, idx) => 
        idx === setIndex ? true : set.completed
      );
      if (allCompleted) {
        toggleExercise(exerciseId, section);
      }
    }
  };

  const toggleExercise = (exerciseId: string, section: keyof StrengthProgram['exercises']) => {
    setProgram(prev => ({
      ...prev,
      exercises: {
        ...prev.exercises,
        [section]: prev.exercises[section].map(ex => 
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        )
      }
    }));
  };

  const calculateProgress = () => {
    const allExercises = [
      ...program.exercises.warmup,
      ...program.exercises.main,
      ...program.exercises.accessory,
      ...program.exercises.cooldown
    ];
    const completed = allExercises.filter(ex => ex.completed).length;
    return (completed / allExercises.length) * 100;
  };

  return (
    <div className="h-full flex">
      {/* Left sidebar - Player roster */}
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{teamName} Roster</h2>
          <p className="text-sm text-muted-foreground">Select a player to view their program</p>
        </div>
        <div className="h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="p-2">
            {j20Roster.map((player) => (
              <Button
                key={player.id}
                variant={selectedPlayer.id === player.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  selectedPlayer.id === player.id && "bg-secondary"
                )}
                onClick={() => handlePlayerSelect(player)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg w-8">#{player.number}</span>
                    <div className="text-left">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      player.status === 'ready' ? 'default' : 
                      player.status === 'limited' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {player.status}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Player's strength program */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  #{selectedPlayer.number} {selectedPlayer.name}
                  <Badge variant="outline">{selectedPlayer.position}</Badge>
                </h1>
                <p className="text-muted-foreground mt-1">{program.programName}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Session Progress</div>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateProgress()} className="w-32 h-2" />
                    <span className="text-sm font-medium">{Math.round(calculateProgress())}%</span>
                  </div>
                </div>
                <Button>
                  <Timer className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </div>
            </div>
          </div>

          {/* Program Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Today's Focus: {program.focus}</CardTitle>
              {program.notes && (
                <CardDescription>{program.notes}</CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* Exercise Sections */}
          <Tabs defaultValue="warmup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="warmup">Warm-up</TabsTrigger>
              <TabsTrigger value="main">Main Work</TabsTrigger>
              <TabsTrigger value="accessory">Accessory</TabsTrigger>
              <TabsTrigger value="cooldown">Cool-down</TabsTrigger>
            </TabsList>

            <TabsContent value="warmup" className="mt-4">
              <ExerciseSection 
                title="Warm-up"
                exercises={program.exercises.warmup}
                section="warmup"
                onToggle={(id) => toggleExercise(id, 'warmup')}
                activeExercise={activeExercise}
                onSetActive={setActiveExercise}
                restTimers={restTimers}
                onStartRestTimer={startRestTimer}
                onUpdateSetData={updateSetData}
                onCompleteSet={completeSet}
              />
            </TabsContent>

            <TabsContent value="main" className="mt-4">
              <ExerciseSection 
                title="Main Exercises"
                exercises={program.exercises.main}
                section="main"
                onToggle={(id) => toggleExercise(id, 'main')}
                activeExercise={activeExercise}
                onSetActive={setActiveExercise}
                restTimers={restTimers}
                onStartRestTimer={startRestTimer}
                onUpdateSetData={updateSetData}
                onCompleteSet={completeSet}
              />
            </TabsContent>

            <TabsContent value="accessory" className="mt-4">
              <ExerciseSection 
                title="Accessory Work"
                exercises={program.exercises.accessory}
                section="accessory"
                onToggle={(id) => toggleExercise(id, 'accessory')}
                activeExercise={activeExercise}
                onSetActive={setActiveExercise}
                restTimers={restTimers}
                onStartRestTimer={startRestTimer}
                onUpdateSetData={updateSetData}
                onCompleteSet={completeSet}
              />
            </TabsContent>

            <TabsContent value="cooldown" className="mt-4">
              <ExerciseSection 
                title="Cool-down"
                exercises={program.exercises.cooldown}
                section="cooldown"
                onToggle={(id) => toggleExercise(id, 'cooldown')}
                activeExercise={activeExercise}
                onSetActive={setActiveExercise}
                restTimers={restTimers}
                onStartRestTimer={startRestTimer}
                onUpdateSetData={updateSetData}
                onCompleteSet={completeSet}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface ExerciseSectionProps {
  title: string;
  exercises: Exercise[];
  section: keyof StrengthProgram['exercises'];
  onToggle: (id: string) => void;
  activeExercise: string | null;
  onSetActive: (id: string | null) => void;
  restTimers: { [key: string]: RestTimerData };
  onStartRestTimer: (exerciseId: string, setNumber: number, restTime: string) => void;
  onUpdateSetData: (
    section: keyof StrengthProgram['exercises'], 
    exerciseId: string, 
    setIndex: number, 
    field: keyof SetData, 
    value: any
  ) => void;
  onCompleteSet: (
    section: keyof StrengthProgram['exercises'], 
    exerciseId: string, 
    setIndex: number
  ) => void;
}

function ExerciseSection({ 
  title, 
  exercises, 
  section,
  onToggle, 
  activeExercise, 
  onSetActive,
  restTimers,
  onStartRestTimer,
  onUpdateSetData,
  onCompleteSet
}: ExerciseSectionProps) {
  return (
    <div className="space-y-3">
      {exercises.map((exercise) => (
        <Card 
          key={exercise.id} 
          className={cn(
            "transition-all",
            exercise.completed && "opacity-60",
            activeExercise === exercise.id && "ring-2 ring-primary"
          )}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Exercise Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onToggle(exercise.id)}
                  >
                    {exercise.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="space-y-1">
                    <h3 className={cn(
                      "font-semibold",
                      exercise.completed && "line-through"
                    )}>
                      {exercise.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        <span className="text-muted-foreground">Sets:</span> {exercise.sets}
                      </span>
                      <span>
                        <span className="text-muted-foreground">Reps:</span> {exercise.reps}
                      </span>
                      {exercise.weight && (
                        <span>
                          <span className="text-muted-foreground">Weight:</span> {exercise.weight}
                        </span>
                      )}
                      <span>
                        <span className="text-muted-foreground">Rest:</span> {exercise.rest}
                      </span>
                    </div>
                    {exercise.notes && (
                      <p className="text-xs text-muted-foreground italic">{exercise.notes}</p>
                    )}
                    {exercise.previousBest && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Previous best: {exercise.previousBest}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant={activeExercise === exercise.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetActive(activeExercise === exercise.id ? null : exercise.id)}
                >
                  {activeExercise === exercise.id ? (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>

              {/* Set-by-set tracking */}
              {activeExercise === exercise.id && exercise.setData && (
                <div className="space-y-3 mt-4 pt-4 border-t">
                  {exercise.setData.map((setData, setIndex) => {
                    const timerKey = `${exercise.id}-${setIndex}`;
                    const timer = restTimers[timerKey];
                    const isResting = timer && timer.isRunning;
                    
                    return (
                      <div key={setIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Set {setIndex + 1}</h4>
                          {!setData.completed && !isResting && (
                            <Button
                              size="sm"
                              onClick={() => {
                                onCompleteSet(section, exercise.id, setIndex);
                                if (setIndex < exercise.sets - 1) {
                                  onStartRestTimer(exercise.id, setIndex + 1, exercise.rest);
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete Set
                            </Button>
                          )}
                          {isResting && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-lg font-mono">
                                <Timer className="h-4 w-4 mr-2" />
                                {formatTime(timer.timeRemaining)}
                              </Badge>
                            </div>
                          )}
                          {setData.completed && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        {/* Data input during rest */}
                        {(isResting || setData.completed) && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Label className="text-xs flex items-center gap-1">
                                <Weight className="h-3 w-3" />
                                Weight (kg)
                              </Label>
                              <Input
                                type="number"
                                value={setData.weight || ''}
                                onChange={(e) => onUpdateSetData(section, exercise.id, setIndex, 'weight', parseFloat(e.target.value))}
                                placeholder="0"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                Speed (m/s)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={setData.speed || ''}
                                onChange={(e) => onUpdateSetData(section, exercise.id, setIndex, 'speed', parseFloat(e.target.value))}
                                placeholder="0.0"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Avg Power (W)
                              </Label>
                              <Input
                                type="number"
                                value={setData.avgPower || ''}
                                onChange={(e) => onUpdateSetData(section, exercise.id, setIndex, 'avgPower', parseFloat(e.target.value))}
                                placeholder="0"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Max Power (W)
                              </Label>
                              <Input
                                type="number"
                                value={setData.maxPower || ''}
                                onChange={(e) => onUpdateSetData(section, exercise.id, setIndex, 'maxPower', parseFloat(e.target.value))}
                                placeholder="0"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Device</Label>
                              <Input
                                type="text"
                                value={setData.device || ''}
                                onChange={(e) => onUpdateSetData(section, exercise.id, setIndex, 'device', e.target.value)}
                                placeholder="e.g., GymAware"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
} 