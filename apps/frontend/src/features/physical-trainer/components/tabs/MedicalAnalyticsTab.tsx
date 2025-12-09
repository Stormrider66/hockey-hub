'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Heart, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Download
} from '@/components/icons';
import { ReportExporter } from '../ReportExporter';
import { exportTestData, ExportOptions } from '../../utils/dataExportImport';
import { toast } from 'sonner';

// Import medical analytics components - large components are lazy loaded
import { LazyMedicalAnalyticsLoader } from '../loaders/LazyMedicalAnalyticsLoader';
import { preloadMedicalAnalytics } from '../loaders/preloadUtils';
import { MedicalAlertPanel } from '../medical-analytics/MedicalAlertPanel';
import { RecoveryProgressMonitor } from '../medical-analytics/RecoveryProgressMonitor';
import { MedicalRiskAssessment } from '../medical-analytics/MedicalRiskAssessment';
import { RehabilitationTracker } from '../medical-analytics/RehabilitationTracker';

// Import API hooks
import { 
  useGetTeamMedicalOverviewQuery,
  useGetMedicalAlertsQuery,
  MedicalAlert 
} from '@/store/api/medicalAnalyticsApi';

interface MedicalAnalyticsTabProps {
  selectedTeamId?: string;
  organizationId: string;
}

export const MedicalAnalyticsTab: React.FC<MedicalAnalyticsTabProps> = ({
  selectedTeamId,
  organizationId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // Fetch medical analytics data
  const { 
    data: teamOverview, 
    isLoading: overviewLoading,
    error: overviewError 
  } = useGetTeamMedicalOverviewQuery(
    { teamId: selectedTeamId || 'default-team' },
    { skip: !selectedTeamId }
  );

  const { 
    data: alerts = [], 
    isLoading: alertsLoading 
  } = useGetMedicalAlertsQuery(
    { teamId: selectedTeamId },
    { skip: !selectedTeamId }
  );

  // Filter critical alerts for the overview
  const criticalAlerts = alerts.filter((alert: MedicalAlert) => 
    alert.severity === 'critical' || alert.severity === 'high'
  );

  // Mock medical overview stats - in real implementation this would come from API
  const medicalStats = {
    totalPlayers: teamOverview?.totalPlayers || 25,
    healthyPlayers: teamOverview?.healthyPlayers || 18,
    injuredPlayers: teamOverview?.injuredPlayers || 3,
    activeProtocols: teamOverview?.recoveringPlayers || 4,
    avgRiskScore: teamOverview?.averageInjuryRisk || 42,
    criticalAlerts: criticalAlerts.length,
    monthlyTrend: '+8.5%' // Improvement
  };

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Healthy Players</p>
              <p className="text-2xl font-bold text-green-600">{medicalStats.healthyPlayers}</p>
              <p className="text-xs text-muted-foreground">
                of {medicalStats.totalPlayers} total
              </p>
            </div>
            <Heart className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Injuries</p>
              <p className="text-2xl font-bold text-red-600">{medicalStats.injuredPlayers}</p>
              <p className="text-xs text-muted-foreground">
                {medicalStats.activeProtocols} in recovery
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Risk Score</p>
              <p className="text-2xl font-bold text-orange-600">{medicalStats.avgRiskScore}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">{medicalStats.monthlyTrend}</p>
              </div>
            </div>
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{medicalStats.criticalAlerts}</p>
              <p className="text-xs text-muted-foreground">
                {alerts.length - medicalStats.criticalAlerts} other alerts
              </p>
            </div>
            <Activity className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuickAccess = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <h4 className="font-medium mb-1">Active Alerts</h4>
            <p className="text-sm text-muted-foreground">
              {criticalAlerts.length} requiring attention
            </p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium mb-1">Today's RTP</h4>
            <p className="text-sm text-muted-foreground">
              3 assessments scheduled
            </p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium mb-1">Recovery Status</h4>
            <p className="text-sm text-muted-foreground">
              {medicalStats.activeProtocols} players tracking
            </p>
          </div>
          
          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <FileText className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium mb-1">Reports</h4>
            <p className="text-sm text-muted-foreground">
              Generate medical reports
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading medical analytics...</p>
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">Failed to load medical analytics data</p>
              <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Medical Analytics & Performance Insights</h2>
        <p className="text-muted-foreground">
          Comprehensive medical data integration for injury prevention and performance optimization
        </p>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Quick Access */}
      {renderQuickAccess()}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-1"
            onMouseEnter={() => preloadMedicalAnalytics.medicalDashboard()}
          >
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="patterns" 
            className="flex items-center gap-1"
            onMouseEnter={() => preloadMedicalAnalytics.injuryPattern()}
          >
            <TrendingUp className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                {criticalAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="rtp" 
            className="flex items-center gap-1"
            onMouseEnter={() => preloadMedicalAnalytics.returnToPlay()}
          >
            <Calendar className="h-4 w-4" />
            RTP
          </TabsTrigger>
          <TabsTrigger value="recovery" className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="rehab" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Rehab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <LazyMedicalAnalyticsLoader 
            componentType="medicalDashboard" 
            teamId={selectedTeamId} 
          />
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <LazyMedicalAnalyticsLoader 
            componentType="injuryPattern" 
            teamId={selectedTeamId} 
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <MedicalAlertPanel 
            teamId={selectedTeamId}
            alerts={alerts}
            onAlertResolve={(alertId) => {
              console.log('Resolving alert:', alertId);
              // In real implementation, this would call the API
            }}
            onAlertView={(alertId) => {
              console.log('Viewing alert:', alertId);
              // In real implementation, this would open alert details
            }}
          />
        </TabsContent>

        <TabsContent value="rtp" className="mt-6">
          <LazyMedicalAnalyticsLoader 
            componentType="returnToPlay" 
            teamId={selectedTeamId} 
          />
        </TabsContent>

        <TabsContent value="recovery" className="mt-6">
          <RecoveryProgressMonitor teamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <MedicalRiskAssessment teamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="rehab" className="mt-6">
          <RehabilitationTracker teamId={selectedTeamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};