'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Filter,
  Download,
  RefreshCw,
  User,
  Calendar,
  Target,
  Zap,
  Eye,
  Settings
} from 'lucide-react';

export interface MedicalAlert {
  alertId: string;
  playerId: string;
  playerName?: string;
  alertType: 'injury_risk' | 'recovery_setback' | 'clearance_needed' | 'compliance_issue' | 'performance_decline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
  createdAt: string | Date;
  isResolved: boolean;
  resolvedAt?: string | Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface MedicalAlertPanelProps {
  teamId?: string;
  playerId?: string;
  alerts: MedicalAlert[];
  onAlertResolve?: (alertId: string) => void;
  onAlertView?: (alertId: string) => void;
}

export const MedicalAlertPanel: React.FC<MedicalAlertPanelProps> = ({
  teamId,
  playerId,
  alerts,
  onAlertResolve,
  onAlertView
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'injury_risk':
        return <Target className="h-4 w-4" />;
      case 'recovery_setback':
        return <Clock className="h-4 w-4" />;
      case 'clearance_needed':
        return <CheckCircle className="h-4 w-4" />;
      case 'compliance_issue':
        return <User className="h-4 w-4" />;
      case 'performance_decline':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      injury_risk: 'Injury Risk',
      recovery_setback: 'Recovery Setback',
      clearance_needed: 'Clearance Needed',
      compliance_issue: 'Compliance Issue',
      performance_decline: 'Performance Decline'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && alert.isResolved) return false;
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && alert.alertType !== selectedType) return false;
    return true;
  });

  const groupedAlerts = {
    critical: filteredAlerts.filter(a => a.severity === 'critical'),
    high: filteredAlerts.filter(a => a.severity === 'high'),
    medium: filteredAlerts.filter(a => a.severity === 'medium'),
    low: filteredAlerts.filter(a => a.severity === 'low')
  };

  const handleResolveAlert = (alertId: string) => {
    if (onAlertResolve) {
      onAlertResolve(alertId);
    }
  };

  const handleViewAlert = (alertId: string) => {
    setSelectedAlert(alertId);
    if (onAlertView) {
      onAlertView(alertId);
    }
  };

  const renderAlertCard = (alert: MedicalAlert) => (
    <Card 
      key={alert.alertId} 
      className={`transition-all hover:shadow-md ${
        selectedAlert === alert.alertId ? 'ring-2 ring-blue-500' : ''
      } ${alert.isResolved ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getSeverityIcon(alert.severity)}
            <div>
              <h4 className="font-medium">{alert.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getTypeIcon(alert.alertType)}
                  {getTypeLabel(alert.alertType)}
                </Badge>
                {alert.playerName && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {alert.playerName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewAlert(alert.alertId)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            {!alert.isResolved && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleResolveAlert(alert.alertId)}
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
        
        <div className="bg-blue-50 p-3 rounded-lg mb-3">
          <h5 className="text-sm font-medium text-blue-800 mb-1">Recommended Action</h5>
          <p className="text-sm text-blue-700">{alert.recommendedAction}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
          </div>
          {alert.isResolved && alert.resolvedAt && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Resolved {new Date(alert.resolvedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Additional Details</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(alert.metadata).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground">{key.replace('_', ' ')}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSummaryStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold">{filteredAlerts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{groupedAlerts.critical.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{groupedAlerts.high.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unresolved</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredAlerts.filter(a => !a.isResolved).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.isResolved).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Medical Alert Center
          </h3>
          <p className="text-muted-foreground">
            Real-time medical alerts and priority notifications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {renderSummaryStats()}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="injury_risk">Injury Risk</SelectItem>
                <SelectItem value="recovery_setback">Recovery Setback</SelectItem>
                <SelectItem value="clearance_needed">Clearance Needed</SelectItem>
                <SelectItem value="compliance_issue">Compliance Issue</SelectItem>
                <SelectItem value="performance_decline">Performance Decline</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showResolved ? "default" : "outline"}
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide' : 'Show'} Resolved
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts by Priority */}
      <Tabs defaultValue="priority">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="priority">By Priority</TabsTrigger>
          <TabsTrigger value="type">By Type</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="space-y-6">
          {/* Critical Alerts */}
          {groupedAlerts.critical.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Alerts ({groupedAlerts.critical.length})
              </h4>
              <div className="space-y-3">
                {groupedAlerts.critical.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* High Priority Alerts */}
          {groupedAlerts.high.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                High Priority ({groupedAlerts.high.length})
              </h4>
              <div className="space-y-3">
                {groupedAlerts.high.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Medium Priority Alerts */}
          {groupedAlerts.medium.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Medium Priority ({groupedAlerts.medium.length})
              </h4>
              <div className="space-y-3">
                {groupedAlerts.medium.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Low Priority Alerts */}
          {groupedAlerts.low.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Low Priority ({groupedAlerts.low.length})
              </h4>
              <div className="space-y-3">
                {groupedAlerts.low.map(renderAlertCard)}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="type" className="space-y-6">
          {/* Group by alert type */}
          {Object.entries(
            filteredAlerts.reduce((acc, alert) => {
              if (!acc[alert.alertType]) acc[alert.alertType] = [];
              acc[alert.alertType].push(alert);
              return acc;
            }, {} as Record<string, MedicalAlert[]>)
          ).map(([type, typeAlerts]) => (
            <div key={type}>
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {getTypeIcon(type)}
                {getTypeLabel(type)} ({typeAlerts.length})
              </h4>
              <div className="space-y-3">
                {typeAlerts.map(renderAlertCard)}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Timeline view - group by date */}
          {Object.entries(
            filteredAlerts.reduce((acc, alert) => {
              const date = alert.createdAt.toDateString();
              if (!acc[date]) acc[date] = [];
              acc[date].push(alert);
              return acc;
            }, {} as Record<string, MedicalAlert[]>)
          )
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, dateAlerts]) => (
            <div key={date}>
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {date} ({dateAlerts.length})
              </h4>
              <div className="space-y-3">
                {dateAlerts
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map(renderAlertCard)}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">
              {showResolved 
                ? "No alerts match the current filters."
                : "All alerts have been resolved. Great work!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};