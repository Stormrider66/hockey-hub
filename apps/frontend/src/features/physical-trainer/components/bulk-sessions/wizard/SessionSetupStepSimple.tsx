'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertTriangle } from '@/components/icons';
import type { 
  BulkSessionConfig, 
  SessionConfiguration,
  EquipmentAvailability 
} from '../bulk-sessions.types';

interface SessionSetupStepProps {
  config: BulkSessionConfig;
  equipmentAvailability: EquipmentAvailability[];
  onConfigChange: (updates: Partial<BulkSessionConfig>) => void;
  onSessionChange: (sessionId: string, updates: Partial<SessionConfiguration>) => void;
  errors: string[];
}

const SessionSetupStepSimple: React.FC<SessionSetupStepProps> = ({
  config,
  equipmentAvailability,
  onConfigChange,
  onSessionChange,
  errors
}) => {
  const equipmentTypes = ['rowing', 'bike_erg', 'ski_erg', 'running', 'assault_bike', 'swimming'];

  return (
    <div className="space-y-6">
      {/* Error display */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Session configuration cards */}
      <div className="space-y-4">
        {config.sessions.map((session, index) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Session {index + 1}: {session.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Name */}
              <div className="space-y-2">
                <Label>Session Name</Label>
                <Input
                  value={session.name}
                  onChange={(e) => onSessionChange(session.id, { name: e.target.value })}
                  placeholder="Enter session name"
                />
              </div>

              {/* Equipment Selection */}
              <div className="space-y-2">
                <Label>Equipment Types</Label>
                <div className="grid grid-cols-3 gap-2">
                  {equipmentTypes.map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={session.equipment.includes(type as any) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const currentEquipment = session.equipment;
                        const isSelected = currentEquipment.includes(type as any);
                        
                        const updatedEquipment = isSelected
                          ? currentEquipment.filter(eq => eq !== type)
                          : [...currentEquipment, type as any];
                        
                        onSessionChange(session.id, { equipment: updatedEquipment });
                      }}
                    >
                      {type.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
                {session.equipment.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select at least one equipment type
                  </p>
                )}
              </div>

              {/* Player Count Display */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {session.playerIds.length} players, {session.teamIds.length} teams
                </span>
              </div>

              {/* Status Badge */}
              {session.equipment.length > 0 ? (
                <Badge variant="default">Configured</Badge>
              ) : (
                <Badge variant="secondary">Needs Configuration</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Alert>
            <AlertDescription>
              Player assignment functionality is temporarily simplified while we resolve component imports.
              You can configure equipment and session names for now.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionSetupStepSimple;