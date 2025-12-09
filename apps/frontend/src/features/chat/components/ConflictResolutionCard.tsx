import React, { useState } from 'react';
import { AlertTriangle, Calendar, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConflictDetails {
  conflicting_event_id?: string;
  conflicting_event_name?: string;
  conflict_reason?: string;
  affected_players?: string[];
}

interface ConflictResolutionCardProps {
  conflictDetails: ConflictDetails;
  onResolve: (resolution: any) => void;
  isCoordinator: boolean;
}

export const ConflictResolutionCard: React.FC<ConflictResolutionCardProps> = ({
  conflictDetails,
  onResolve,
  isCoordinator,
}) => {
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const resolutionOptions = [
    { value: 'reschedule_original', label: 'Reschedule Original Event', icon: Calendar },
    { value: 'reschedule_conflict', label: 'Reschedule Conflicting Event', icon: Calendar },
    { value: 'cancel_original', label: 'Cancel Original Event', icon: XCircle },
    { value: 'cancel_conflict', label: 'Cancel Conflicting Event', icon: XCircle },
    { value: 'proceed_both', label: 'Proceed with Both Events', icon: CheckCircle },
    { value: 'split_team', label: 'Split Team Between Events', icon: Users },
  ];

  const handleResolve = () => {
    if (!resolutionType || !resolutionNotes) {
      return;
    }

    onResolve({
      resolution_type: resolutionType,
      resolution_notes: resolutionNotes,
      resolved_at: new Date(),
    });

    setShowResolutionForm(false);
  };

  return (
    <Card className="mb-4 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Schedule Conflict Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {conflictDetails.conflicting_event_name && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Conflicting Event:</span>
              <Badge variant="destructive">{conflictDetails.conflicting_event_name}</Badge>
            </div>
          )}

          {conflictDetails.conflict_reason && (
            <div>
              <span className="font-medium">Reason:</span>
              <p className="text-sm text-gray-600 mt-1">{conflictDetails.conflict_reason}</p>
            </div>
          )}

          {conflictDetails.affected_players && conflictDetails.affected_players.length > 0 && (
            <div>
              <span className="font-medium">Affected Players:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {conflictDetails.affected_players.map((player, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {player}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isCoordinator && !showResolutionForm && (
            <Button
              className="w-full mt-4"
              onClick={() => setShowResolutionForm(true)}
            >
              Propose Resolution
            </Button>
          )}

          {showResolutionForm && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <h4 className="font-medium">Resolution Options</h4>
              
              <div className="grid grid-cols-1 gap-2">
                {resolutionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setResolutionType(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      resolutionType === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolutionNotes">Resolution Details</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain the resolution and any next steps..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleResolve}
                  disabled={!resolutionType || !resolutionNotes}
                >
                  Submit Resolution
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResolutionForm(false);
                    setResolutionType('');
                    setResolutionNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};