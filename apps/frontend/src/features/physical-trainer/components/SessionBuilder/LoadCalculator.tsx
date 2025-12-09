import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, Link, Percent, Weight, AlertCircle } from 'lucide-react';
import { 
  SessionTemplate, 
  SessionExercise,
  LoadCalculation,
  PlayerLoad
} from '../../types/session-builder.types';
import { useGetTestsQuery } from '@/store/api/trainingApi';

interface LoadCalculatorProps {
  session: SessionTemplate;
  onUpdate: (session: SessionTemplate) => void;
}

interface ExerciseLoadSettingProps {
  exercise: SessionExercise;
  onUpdateLoad: (load: LoadCalculation) => void;
  testTypes: string[];
}

const TEST_TYPE_MAPPING: Record<string, string[]> = {
  'Barbell Back Squat': ['Squat 1RM'],
  'Barbell Front Squat': ['Squat 1RM', 'Front Squat 1RM'],
  'Bench Press': ['Bench Press 1RM'],
  'Deadlift': ['Deadlift 1RM'],
  'Romanian Deadlift': ['Deadlift 1RM', 'RDL 1RM'],
  'Overhead Press': ['Overhead Press 1RM', 'Bench Press 1RM'],
  'Pull-ups': ['Pull-up Max', 'Body Weight'],
  'Dips': ['Dip Max', 'Body Weight']
};

const ExerciseLoadSetting: React.FC<ExerciseLoadSettingProps> = ({ 
  exercise, 
  onUpdateLoad,
  testTypes 
}) => {
  const [loadType, setLoadType] = useState<LoadCalculation['type']>(
    exercise.loadCalculation?.type || 'percentage'
  );
  const [percentage, setPercentage] = useState(
    exercise.loadCalculation?.percentage || 70
  );
  const [referenceTest, setReferenceTest] = useState(
    exercise.loadCalculation?.referenceTest || ''
  );

  const suggestedTests = TEST_TYPE_MAPPING[exercise.name] || [];
  const availableTests = suggestedTests.filter(test => testTypes.includes(test));

  const handleUpdate = () => {
    const newLoad: LoadCalculation = {
      type: loadType,
      percentage: loadType === 'percentage' ? percentage : undefined,
      referenceTest: loadType === 'percentage' ? referenceTest : undefined,
      unit: loadType === 'percentage' ? 'kg' : loadType === 'rpe' ? 'rpe' : 'kg'
    };
    onUpdateLoad(newLoad);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-medium">{exercise.name}</h5>
          <p className="text-sm text-muted-foreground">
            {exercise.sets} sets × {exercise.reps || exercise.duration} {exercise.reps ? 'reps' : 's'}
          </p>
        </div>
        {exercise.loadCalculation && (
          <Badge variant="secondary">
            <Calculator className="h-3 w-3 mr-1" />
            Calculated
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Load Type</Label>
          <Select value={loadType} onValueChange={(value: any) => setLoadType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage of Max</SelectItem>
              <SelectItem value="absolute">Absolute Weight</SelectItem>
              <SelectItem value="rpe">RPE Based</SelectItem>
              <SelectItem value="bodyweight">Body Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadType === 'percentage' && (
          <>
            <div>
              <Label>Reference Test</Label>
              <Select value={referenceTest} onValueChange={setReferenceTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.length > 0 ? (
                    <>
                      <SelectItem value="" disabled className="text-muted-foreground">
                        Suggested Tests
                      </SelectItem>
                      {availableTests.map(test => (
                        <SelectItem key={test} value={test}>
                          {test} (Recommended)
                        </SelectItem>
                      ))}
                    </>
                  ) : null}
                  <SelectItem value="all-tests" disabled className="text-muted-foreground">
                    All Tests
                  </SelectItem>
                  {testTypes.map(test => (
                    <SelectItem key={test} value={test}>
                      {test}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Percentage</Label>
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
              <Slider
                value={[percentage]}
                onValueChange={([value]) => setPercentage(value)}
                min={30}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Light (30%)</span>
                <span>Moderate (70%)</span>
                <span>Heavy (100%)</span>
              </div>
            </div>
          </>
        )}

        {loadType === 'rpe' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Players will select weight based on Rate of Perceived Exertion (RPE)
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleUpdate} 
          className="w-full"
          disabled={loadType === 'percentage' && !referenceTest}
        >
          <Link className="h-4 w-4 mr-2" />
          Apply Load Calculation
        </Button>
      </div>
    </Card>
  );
};

export const LoadCalculator: React.FC<LoadCalculatorProps> = ({ session, onUpdate }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    session.targetPlayers || []
  );

  // Fetch test data for selected players
  const { data: testData } = useGetTestsQuery(
    { playerIds: selectedPlayers },
    { skip: selectedPlayers.length === 0 }
  );

  // Get unique test types from the data
  const testTypes = useMemo(() => {
    if (!testData?.results) return [];
    const types = new Set<string>();
    testData.results.forEach(result => types.add(result.testType));
    return Array.from(types);
  }, [testData]);

  // Get exercises that can have load calculations
  const loadableExercises = useMemo(() => {
    return session.phases.flatMap(phase => 
      phase.exercises.filter(ex => 
        ex.category === 'main' || ex.category === 'accessory'
      )
    );
  }, [session]);

  const handleUpdateExerciseLoad = (exerciseId: string, load: LoadCalculation) => {
    const newPhases = session.phases.map(phase => ({
      ...phase,
      exercises: phase.exercises.map(ex => 
        ex.sessionExerciseId === exerciseId
          ? { ...ex, loadCalculation: load }
          : ex
      )
    }));

    onUpdate({
      ...session,
      phases: newPhases
    });
  };

  const calculatePlayerLoads = () => {
    if (!testData?.results || selectedPlayers.length === 0) return;

    const newPhases = session.phases.map(phase => ({
      ...phase,
      exercises: phase.exercises.map(exercise => {
        if (!exercise.loadCalculation || exercise.loadCalculation.type !== 'percentage') {
          return exercise;
        }

        const playerLoads: PlayerLoad[] = selectedPlayers.map(playerId => {
          const playerTest = testData.results.find(
            r => r.playerId === playerId && r.testType === exercise.loadCalculation!.referenceTest
          );

          if (!playerTest) {
            return {
              playerId,
              playerName: `Player ${playerId}`, // TODO: Get actual name
              calculatedLoad: 0,
              unit: 'kg' as const,
              note: 'No test data available'
            };
          }

          const calculatedLoad = Math.round(
            playerTest.value * (exercise.loadCalculation!.percentage! / 100)
          );

          return {
            playerId,
            playerName: `Player ${playerId}`, // TODO: Get actual name
            calculatedLoad,
            unit: playerTest.unit as any,
            adjustmentFactor: 1.0 // TODO: Apply wellness/fatigue adjustments
          };
        });

        return {
          ...exercise,
          loadCalculation: {
            ...exercise.loadCalculation!,
            playerLoads
          }
        };
      })
    }));

    onUpdate({
      ...session,
      phases: newPhases
    });
  };

  return (
    <div className="space-y-4">
      {/* Info section */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Link exercises to player test data to automatically calculate personalized training loads.
          Loads will be calculated based on each player's most recent test results.
        </AlertDescription>
      </Alert>

      {/* Player selection reminder */}
      {selectedPlayers.length === 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please assign players in the Assignment tab to calculate personalized loads.
          </AlertDescription>
        </Alert>
      )}

      {/* Available tests */}
      {testTypes.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-2">Available Test Data</h4>
          <div className="flex flex-wrap gap-2">
            {testTypes.map(type => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Exercise load settings */}
      <div className="space-y-3">
        <h4 className="font-medium">Configure Exercise Loads</h4>
        {loadableExercises.length === 0 ? (
          <Card className="p-8 text-center">
            <Weight className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No exercises available for load calculation.
              Add main or accessory exercises to the session.
            </p>
          </Card>
        ) : (
          <>
            {loadableExercises.map(exercise => (
              <ExerciseLoadSetting
                key={exercise.sessionExerciseId}
                exercise={exercise}
                onUpdateLoad={(load) => handleUpdateExerciseLoad(exercise.sessionExerciseId, load)}
                testTypes={testTypes}
              />
            ))}

            {/* Calculate all loads button */}
            {selectedPlayers.length > 0 && (
              <Button 
                onClick={calculatePlayerLoads} 
                className="w-full"
                disabled={!loadableExercises.some(ex => 
                  ex.loadCalculation?.type === 'percentage' && ex.loadCalculation.referenceTest
                )}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Loads for {selectedPlayers.length} Players
              </Button>
            )}
          </>
        )}
      </div>

      {/* Player load preview */}
      {loadableExercises.some(ex => ex.loadCalculation?.playerLoads?.length) && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Calculated Player Loads</h4>
          <div className="space-y-3">
            {loadableExercises
              .filter(ex => ex.loadCalculation?.playerLoads?.length)
              .map(exercise => (
                <div key={exercise.sessionExerciseId} className="space-y-2">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {exercise.loadCalculation!.playerLoads!.slice(0, 4).map(load => (
                      <div key={load.playerId} className="flex justify-between p-2 bg-muted rounded">
                        <span>{load.playerName}</span>
                        <span className="font-medium">
                          {load.calculatedLoad} {load.unit}
                        </span>
                      </div>
                    ))}
                    {exercise.loadCalculation!.playerLoads!.length > 4 && (
                      <div className="col-span-2 text-center text-muted-foreground">
                        +{exercise.loadCalculation!.playerLoads!.length - 4} more players
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};