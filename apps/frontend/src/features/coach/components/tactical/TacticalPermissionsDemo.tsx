'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Crown,
  Users,
  Eye,
  Zap,
  Target,
  Calendar,
  Download,
  Share2,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from '@/components/icons';
import { TacticalPermissionGuard, AIPermissionGuard, useCanAccessTactical } from '../TacticalPermissionGuard';
import { useTacticalPermissions, useAIUsage, useTacticalUI } from '../../hooks/useTacticalPermissions';

/**
 * Demo component showing tactical permissions system in action
 */
export default function TacticalPermissionsDemo() {
  const permissions = useTacticalPermissions();
  const uiConfig = useTacticalUI();
  const aiUsage = useAIUsage('demo_feature');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'HEAD_COACH': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'ASSISTANT_COACH': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'VIDEO_COACH': return <Eye className="h-5 w-5 text-purple-500" />;
      case 'TEAM_MANAGER': return <Users className="h-5 w-5 text-green-500" />;
      case 'PLAYER': return <Users className="h-5 w-5 text-gray-500" />;
      default: return <Users className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const featureTests = [
    { key: 'canCreatePlays', label: 'Create Plays', icon: Target },
    { key: 'canEditPlays', label: 'Edit Plays', icon: Eye },
    { key: 'canDeletePlays', label: 'Delete Plays', icon: XCircle },
    { key: 'canSharePlays', label: 'Share Plays', icon: Share2 },
    { key: 'canUseAIAnalysis', label: 'AI Analysis', icon: Zap },
    { key: 'canViewAnalytics', label: 'Analytics', icon: Target },
    { key: 'canScheduleSessions', label: 'Schedule', icon: Calendar },
    { key: 'canExportData', label: 'Export', icon: Download }
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Tactical Permissions System Demo</h1>
        <p className="text-muted-foreground">
          Role-based access control for hockey tactical features
        </p>
      </div>

      {/* Current User Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getRoleIcon(permissions.userRole)}
            Current User Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{getRoleDisplayName(permissions.userRole)}</h3>
              <p className="text-sm text-muted-foreground">
                {permissions.userPermissions.length} permissions granted
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {permissions.userRole}
            </Badge>
          </div>

          {uiConfig.warnings.limitedAccess && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {uiConfig.warnings.limitedAccess}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Feature Access Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Access Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featureTests.map(({ key, label, icon: Icon }) => {
              const hasAccess = permissions[key as keyof typeof permissions] as boolean;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${
                    hasAccess 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${
                      hasAccess ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasAccess ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${
                      hasAccess ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {hasAccess ? 'Allowed' : 'Denied'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Usage Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {aiUsage.remaining}
              </div>
              <p className="text-sm text-muted-foreground">Remaining Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {aiUsage.dailyLimit}
              </div>
              <p className="text-sm text-muted-foreground">Daily Limit</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {aiUsage.monthlyLimit}
              </div>
              <p className="text-sm text-muted-foreground">Monthly Limit</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Daily Usage</span>
              <span>{aiUsage.dailyLimit - aiUsage.remaining}/{aiUsage.dailyLimit}</span>
            </div>
            <Progress 
              value={((aiUsage.dailyLimit - aiUsage.remaining) / aiUsage.dailyLimit) * 100} 
              className="h-2"
            />
          </div>

          {!aiUsage.canUse && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                AI usage limit reached. Resets at midnight.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Permission Guards Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Play Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <TacticalPermissionGuard permission="tactical.play.create">
              <div className="space-y-3">
                <p className="text-sm text-green-700 mb-3">
                  ✓ You have permission to create tactical plays
                </p>
                <Button className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Create New Play
                </Button>
              </div>
            </TacticalPermissionGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <AIPermissionGuard feature="demo_analysis">
              <div className="space-y-3">
                <p className="text-sm text-green-700 mb-3">
                  ✓ AI analysis available ({aiUsage.remaining} uses left)
                </p>
                <Button 
                  className="w-full"
                  onClick={() => aiUsage.trackUsage()}
                  disabled={!aiUsage.canUse}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze Play
                </Button>
              </div>
            </AIPermissionGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Play Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <TacticalPermissionGuard permission="tactical.play.delete">
              <div className="space-y-3">
                <p className="text-sm text-green-700 mb-3">
                  ✓ You can delete tactical plays
                </p>
                <Button variant="destructive" className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Delete Play
                </Button>
              </div>
            </TacticalPermissionGuard>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <TacticalPermissionGuard permission="tactical.analytics.advanced">
              <div className="space-y-3">
                <p className="text-sm text-green-700 mb-3">
                  ✓ Advanced analytics available
                </p>
                <Button className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Advanced Reports
                </Button>
              </div>
            </TacticalPermissionGuard>
          </CardContent>
        </Card>
      </div>

      {/* Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Granted Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {permissions.userPermissions.map(permission => (
              <div key={permission} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs font-mono">{permission}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limitations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Limitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Max Plays Per Day:</span>
              <Badge variant="secondary">
                {uiConfig.limitations.maxPlaysPerDay === -1 ? 'Unlimited' : uiConfig.limitations.maxPlaysPerDay}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Video Uploads Per Day:</span>
              <Badge variant="secondary">
                {uiConfig.limitations.maxVideoUploadsPerDay === -1 ? 'Unlimited' : uiConfig.limitations.maxVideoUploadsPerDay}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Exports Per Day:</span>
              <Badge variant="secondary">
                {uiConfig.limitations.maxExportsPerDay === -1 ? 'Unlimited' : uiConfig.limitations.maxExportsPerDay}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Bulk Operations:</span>
              <Badge variant={uiConfig.limitations.canBulkOperations ? 'default' : 'secondary'}>
                {uiConfig.limitations.canBulkOperations ? 'Allowed' : 'Denied'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}