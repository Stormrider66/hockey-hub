"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Activity,
  Heart,
  X,
  Save
} from 'lucide-react';
import { useGetPlayerAvailabilityQuery, useUpdatePlayerAvailabilityMutation } from '@/store/api/medicalApi';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlayerAvailabilityManagerProps {
  playerId: string;
  playerName?: string;
  onClose?: () => void;
  onUpdate?: (status: any) => void;
}

const AVAILABILITY_STATUSES = [
  { 
    value: 'full', 
    label: 'Fully Available', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800',
    description: 'Available for all training and games'
  },
  { 
    value: 'limited', 
    label: 'Limited Availability', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Can participate with restrictions'
  },
  { 
    value: 'individual', 
    label: 'Individual Training', 
    icon: User, 
    color: 'bg-orange-100 text-orange-800',
    description: 'Individual training sessions only'
  },
  { 
    value: 'rehab', 
    label: 'Rehabilitation', 
    icon: Heart, 
    color: 'bg-red-100 text-red-800',
    description: 'Rehabilitation and medical treatment'
  },
  { 
    value: 'unavailable', 
    label: 'Unavailable', 
    icon: X, 
    color: 'bg-gray-100 text-gray-800',
    description: 'Not available for any activities'
  },
];

export function PlayerAvailabilityManager({ 
  playerId, 
  playerName, 
  onClose, 
  onUpdate 
}: PlayerAvailabilityManagerProps) {
  const { data: currentStatus, isLoading: isLoadingStatus } = useGetPlayerAvailabilityQuery(playerId);
  const [updateAvailability, { isLoading: isUpdating }] = useUpdatePlayerAvailabilityMutation();
  
  const [selectedStatus, setSelectedStatus] = useState(currentStatus?.currentStatus || '');
  const [notes, setNotes] = useState(currentStatus?.notes || '');
  const [effectiveFrom, setEffectiveFrom] = useState(
    currentStatus?.effectiveFrom || format(new Date(), 'yyyy-MM-dd')
  );
  const [expectedEndDate, setExpectedEndDate] = useState(currentStatus?.expectedEndDate || '');
  const [injuryId, setInjuryId] = useState(currentStatus?.injuryId || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update local state when data loads
  React.useEffect(() => {
    if (currentStatus) {
      setSelectedStatus(currentStatus.currentStatus);
      setNotes(currentStatus.notes || '');
      setEffectiveFrom(currentStatus.effectiveFrom);
      setExpectedEndDate(currentStatus.expectedEndDate || '');
      setInjuryId(currentStatus.injuryId || '');
    }
  }, [currentStatus]);

  const selectedStatusInfo = AVAILABILITY_STATUSES.find(s => s.value === selectedStatus);

  const handleSave = async () => {
    if (!selectedStatus) {
      setError('Please select an availability status');
      return;
    }

    try {
      setError(null);
      
      const result = await updateAvailability({
        playerId,
        currentStatus: selectedStatus,
        notes: notes.trim() || undefined,
        effectiveFrom,
        expectedEndDate: expectedEndDate || undefined,
        injuryId: injuryId || undefined,
      }).unwrap();

      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        setSuccess(false);
        if (onUpdate) {
          onUpdate(result);
        }
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (err: any) {
      setError(err.data?.message || 'Failed to update availability status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = AVAILABILITY_STATUSES.find(s => s.value === status);
    if (!statusInfo) return null;

    return (
      <Badge className={cn("flex items-center gap-1", statusInfo.color)}>
        <statusInfo.icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Status Updated!</h3>
            <p className="text-sm text-muted-foreground">
              {playerName}'s availability status has been updated successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Player Availability Status
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {playerName && (
          <p className="text-muted-foreground">Managing availability for {playerName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoadingStatus ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading current status...</p>
          </div>
        ) : (
          <>
            {/* Current Status Display */}
            {currentStatus && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Status</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(currentStatus.currentStatus)}
                    <span className="text-sm text-muted-foreground">
                      Since {format(new Date(currentStatus.effectiveFrom), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {currentStatus.expectedEndDate && (
                    <span className="text-sm text-muted-foreground">
                      Until {format(new Date(currentStatus.expectedEndDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                {currentStatus.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{currentStatus.notes}</p>
                )}
              </div>
            )}

            {/* Status Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Availability Status *</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability status" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-3">
                          <status.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{status.label}</div>
                            <div className="text-xs text-muted-foreground">{status.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStatusInfo && (
                <div className={cn("p-3 rounded-lg", selectedStatusInfo.color.replace('text-', 'bg-').replace('800', '50'))}>
                  <div className="flex items-center gap-2 mb-1">
                    <selectedStatusInfo.icon className="h-4 w-4" />
                    <span className="font-medium">{selectedStatusInfo.label}</span>
                  </div>
                  <p className="text-sm">{selectedStatusInfo.description}</p>
                </div>
              )}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From *</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedEndDate">Expected End Date</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  min={effectiveFrom}
                />
              </div>
            </div>

            {/* Related Injury */}
            <div className="space-y-2">
              <Label htmlFor="injuryId">Related Injury ID (Optional)</Label>
              <Input
                id="injuryId"
                value={injuryId}
                onChange={(e) => setInjuryId(e.target.value)}
                placeholder="Enter injury ID if status is related to an injury"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this status change..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onClose && (
                <Button variant="outline" onClick={onClose} disabled={isUpdating}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!selectedStatus || !effectiveFrom || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}