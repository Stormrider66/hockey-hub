import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ComplianceViolation {
  playerId: string;
  playerName: string;
  exerciseId: string;
  exerciseName: string;
  restriction: string;
  reason: string;
}

interface ComplianceWarningProps {
  violations: ComplianceViolation[];
  onViewAlternatives: () => void;
  onDismiss?: () => void;
  severity?: 'high' | 'medium' | 'low';
}

export const ComplianceWarning: React.FC<ComplianceWarningProps> = ({
  violations,
  onViewAlternatives,
  onDismiss,
  severity = 'high'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!violations || violations.length === 0) {
    return null;
  }

  // Group violations by player
  const violationsByPlayer = violations.reduce((acc, violation) => {
    if (!acc[violation.playerId]) {
      acc[violation.playerId] = {
        playerName: violation.playerName,
        violations: []
      };
    }
    acc[violation.playerId].violations.push(violation);
    return acc;
  }, {} as Record<string, { playerName: string; violations: ComplianceViolation[] }>);

  // Sort by severity (assuming more violations = higher severity)
  const sortedPlayers = Object.entries(violationsByPlayer)
    .sort(([, a], [, b]) => b.violations.length - a.violations.length);

  // Determine if we need to show expand/collapse
  const totalViolations = violations.length;
  const shouldShowExpand = totalViolations > 3;
  const displayedViolations = shouldShowExpand && !isExpanded ? 3 : totalViolations;

  // Get variant based on severity
  const getVariant = () => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'default';
      default:
        return 'destructive';
    }
  };

  // Get icon color based on severity
  const getIconColor = () => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-red-600';
    }
  };

  let violationCount = 0;

  return (
    <Alert variant={getVariant()} className="mb-4">
      <AlertTriangle className={`h-4 w-4 ${getIconColor()}`} />
      <AlertTitle className="font-semibold">
        Medical Compliance Warning
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <p className="text-sm">
            The following exercises may conflict with player restrictions:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm">
            {sortedPlayers.map(([playerId, playerData]) => (
              <React.Fragment key={playerId}>
                {playerData.violations.map((violation, index) => {
                  if (violationCount >= displayedViolations) return null;
                  violationCount++;
                  
                  return (
                    <li key={`${playerId}-${violation.exerciseId}-${index}`}>
                      <span className="font-medium">{violation.playerName}</span> - {violation.exerciseName}: 
                      <span className="text-muted-foreground"> Conflicts with "{violation.restriction}" restriction</span>
                      {violation.reason && (
                        <span className="text-muted-foreground"> ({violation.reason})</span>
                      )}
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </ul>

          {shouldShowExpand && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show {totalViolations - 3} more violations
                </>
              )}
            </button>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="default"
              onClick={onViewAlternatives}
            >
              View Safe Alternatives
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ComplianceWarning;