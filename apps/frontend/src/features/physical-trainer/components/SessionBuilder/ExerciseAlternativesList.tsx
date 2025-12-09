import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Activity, Timer, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlternativeExercise {
  id: string;
  name: string;
  category: string;
  targetMuscles: string[];
  loadMultiplier: number; // e.g., 0.8 for 80% of normal load
  restMultiplier: number; // e.g., 1.5 for 150% rest time
  modification: string; // Description of how to modify
  safetyNotes: string; // Why this is safer
  compatibilityScore?: number; // 0-100 percentage
}

interface OriginalExercise {
  id: string;
  name: string;
  category: string;
  targetMuscles: string[];
}

interface ExerciseAlternativesListProps {
  originalExercise: OriginalExercise;
  alternatives: AlternativeExercise[];
  playerId: string;
  playerName: string;
  onSelectAlternative: (alternative: AlternativeExercise) => void;
  restriction: string;
}

export const ExerciseAlternativesList: React.FC<ExerciseAlternativesListProps> = ({
  originalExercise,
  alternatives,
  playerId,
  playerName,
  onSelectAlternative,
  restriction,
}) => {
  const formatPercentage = (multiplier: number) => {
    const percentage = multiplier * 100;
    return `${percentage}%`;
  };

  const getLoadBadgeColor = (multiplier: number) => {
    if (multiplier <= 0.6) return 'bg-green-100 text-green-800';
    if (multiplier <= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getRestBadgeColor = (multiplier: number) => {
    if (multiplier >= 1.5) return 'bg-blue-100 text-blue-800';
    if (multiplier >= 1.2) return 'bg-sky-100 text-sky-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getCommonMuscles = (alternative: AlternativeExercise) => {
    return alternative.targetMuscles.filter(muscle => 
      originalExercise.targetMuscles.includes(muscle)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with player info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Medical Restriction Alert</h4>
            <p className="text-sm text-amber-700 mt-1">
              {playerName} has restriction: <span className="font-medium">{restriction}</span>
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Please select a safe alternative exercise from the options below.
            </p>
          </div>
        </div>
      </div>

      {/* Original Exercise (Not Recommended) */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Original Exercise
              <Badge variant="destructive" className="ml-2">Not Recommended</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-lg">{originalExercise.name}</h4>
              <p className="text-sm text-muted-foreground">{originalExercise.category}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {originalExercise.targetMuscles.map((muscle) => (
                <Badge key={muscle} variant="outline" className="text-xs">
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Safe Alternatives
        </h3>

        {alternatives.map((alternative, index) => {
          const commonMuscles = getCommonMuscles(alternative);
          const muscleMatchPercentage = Math.round(
            (commonMuscles.length / originalExercise.targetMuscles.length) * 100
          );

          return (
            <Card 
              key={alternative.id} 
              className="border-green-200 hover:border-green-300 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {alternative.name}
                      {alternative.compatibilityScore && (
                        <Badge variant="secondary" className="ml-2">
                          {alternative.compatibilityScore}% similar effect
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{alternative.category}</p>
                  </div>
                  <Button 
                    onClick={() => onSelectAlternative(alternative)}
                    size="sm"
                    className="ml-4"
                  >
                    Select
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Load and Rest Adjustments */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Load:</span>
                    <Badge className={cn("text-xs", getLoadBadgeColor(alternative.loadMultiplier))}>
                      {formatPercentage(alternative.loadMultiplier)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Rest:</span>
                    <Badge className={cn("text-xs", getRestBadgeColor(alternative.restMultiplier))}>
                      {formatPercentage(alternative.restMultiplier)}
                    </Badge>
                  </div>
                </div>

                {/* Target Muscles */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Target Muscles ({muscleMatchPercentage}% match)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alternative.targetMuscles.map((muscle) => (
                      <Badge 
                        key={muscle} 
                        variant={commonMuscles.includes(muscle) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Modification Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Modification Instructions:
                  </p>
                  <p className="text-sm text-blue-700">{alternative.modification}</p>
                </div>

                {/* Safety Notes */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm font-medium text-green-900 mb-1 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Why This Is Safer:
                  </p>
                  <p className="text-sm text-green-700">{alternative.safetyNotes}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Alternatives Message */}
      {alternatives.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No alternative exercises available. Please consult with medical staff.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};