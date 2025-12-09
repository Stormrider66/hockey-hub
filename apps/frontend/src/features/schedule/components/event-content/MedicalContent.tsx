import React from 'react';
import { Heart, AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScheduleEvent, UserRole } from '../../types';

interface MedicalContentProps {
  event: ScheduleEvent;
  role: UserRole;
}

export const MedicalContent: React.FC<MedicalContentProps> = ({ event, role }) => {
  const isAuthorized = role === 'medicalStaff' || 
    (role === 'player' && event.participants?.includes(role));

  if (!isAuthorized && event.confidential) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          This medical appointment contains confidential information.
          Only authorized personnel and the patient can view details.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {event.confidential && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This appointment contains confidential medical information.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Appointment Details
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Type</p>
              <Badge variant="outline">
                {event.metadata?.appointmentType || 'General Assessment'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="font-medium">30 minutes</p>
            </div>
            {event.metadata?.practitioner && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Medical Staff</p>
                <p className="font-medium">{event.metadata.practitioner}</p>
              </div>
            )}
            {event.metadata?.instructions && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Pre-appointment Instructions</p>
                <p className="text-sm">{event.metadata.instructions}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};