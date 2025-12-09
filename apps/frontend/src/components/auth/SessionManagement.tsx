'use client';

import { useState } from 'react';
import { useGetSessionsQuery, useRevokeSessionMutation, useRevokeAllSessionsMutation } from '@/store/api/authApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock, 
  AlertTriangle,
  LogOut,
  Shield
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/loading';

export function SessionManagement() {
  const { data: sessionsData, isLoading, refetch } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [revokeAllSessions] = useRevokeAllSessionsMutation();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      await revokeSession({ sessionId }).unwrap();
      toast.success('Session revoked successfully');
      refetch();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error as any).data?.message 
        : 'Failed to revoke session';
      toast.error(errorMessage || 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out from all devices? You will need to sign in again.')) {
      return;
    }

    try {
      setIsRevokingAll(true);
      await revokeAllSessions().unwrap();
      toast.success('All sessions revoked successfully');
      refetch();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error as any).data?.message 
        : 'Failed to revoke all sessions';
      toast.error(errorMessage || 'Failed to revoke all sessions');
    } finally {
      setIsRevokingAll(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  const sessions = sessionsData?.sessions || [];
  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions and secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <Alert>
                <AlertDescription>No active sessions found.</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Current Session */}
                {currentSession && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Current Session</h3>
                    <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(currentSession.deviceInfo.device)}
                            <div>
                              <p className="font-medium">
                                {currentSession.deviceInfo.browser} on {currentSession.deviceInfo.os}
                              </p>
                              <Badge variant="default" className="mt-1">Current</Badge>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{currentSession.ipAddress}</span>
                            </div>
                            {currentSession.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {currentSession.location.city && `${currentSession.location.city}, `}
                                  {currentSession.location.country}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                Active {formatDistanceToNow(new Date(currentSession.lastActivity), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Sessions */}
                {otherSessions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Other Sessions</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRevokeAllSessions}
                        disabled={isRevokingAll}
                      >
                        {isRevokingAll ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Revoking...
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out All
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {otherSessions.map((session) => (
                        <div key={session.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                {getDeviceIcon(session.deviceInfo.device)}
                                <div>
                                  <p className="font-medium">
                                    {session.deviceInfo.browser} on {session.deviceInfo.os}
                                  </p>
                                  {new Date(session.expiresAt) < new Date() && (
                                    <Badge variant="outline" className="mt-1 text-red-600 border-red-600">
                                      Expired
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>{session.ipAddress}</span>
                                </div>
                                {session.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                      {session.location.city && `${session.location.city}, `}
                                      {session.location.country}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Last active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={revokingSessionId === session.id}
                            >
                              {revokingSessionId === session.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                'Sign Out'
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Alert */}
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    If you see any unfamiliar sessions, sign out immediately and change your password.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default SessionManagement;
