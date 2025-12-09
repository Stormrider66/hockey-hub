'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle,
  Info,
  XCircle,
  Bell,
  BellOff,
  X,
  Eye,
  ArrowRight,
  Clock,
  User,
  Activity,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Filter
} from 'lucide-react';

import { 
  PerformanceAlerts,
  AlertAction
} from '../../types/performance-analytics.types';

interface PerformanceAlertsPanelProps {
  alerts: PerformanceAlerts[];
  onDismiss: () => void;
  onActionClick: (action: string, params?: any) => void;
  showDismissed?: boolean;
}

export function PerformanceAlertsPanel({
  alerts,
  onDismiss,
  onActionClick,
  showDismissed = false
}: PerformanceAlertsPanelProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);

  // State for local alert management
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<'all' | PerformanceAlerts['severity']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | PerformanceAlerts['type']>('all');

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => {
        // Show dismissed only if requested
        if (!showDismissed && (alert.acknowledged || acknowledgedAlerts.has(alert.id))) {
          return false;
        }
        
        // Apply severity filter
        if (severityFilter !== 'all' && alert.severity !== severityFilter) {
          return false;
        }
        
        // Apply type filter
        if (typeFilter !== 'all' && alert.type !== typeFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by severity first, then by timestamp
        const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        
        return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
      });
  }, [alerts, acknowledgedAlerts, showDismissed, severityFilter, typeFilter]);

  // Get alert icon based on type and severity
  const getAlertIcon = (type: PerformanceAlerts['type'], severity: PerformanceAlerts['severity']) => {
    const iconClass = severity === 'error' ? 'text-red-500' :
                     severity === 'warning' ? 'text-yellow-500' :
                     severity === 'success' ? 'text-green-500' : 'text-blue-500';

    switch (type) {
      case 'performance-decline':
        return <TrendingUp className={`h-4 w-4 rotate-180 ${iconClass}`} />;
      case 'injury-risk':
        return <Shield className={`h-4 w-4 ${iconClass}`} />;
      case 'overtraining':
        return <Activity className={`h-4 w-4 ${iconClass}`} />;
      case 'improvement':
        return <TrendingUp className={`h-4 w-4 ${iconClass}`} />;
      case 'milestone':
        return <Award className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  // Get alert background color
  const getAlertBgColor = (severity: PerformanceAlerts['severity'], acknowledged: boolean) => {
    const baseClasses = acknowledged ? 'opacity-60' : '';
    
    switch (severity) {
      case 'error':
        return `bg-red-50 border-l-red-500 ${baseClasses}`;
      case 'warning':
        return `bg-yellow-50 border-l-yellow-500 ${baseClasses}`;
      case 'success':
        return `bg-green-50 border-l-green-500 ${baseClasses}`;
      case 'info':
        return `bg-blue-50 border-l-blue-500 ${baseClasses}`;
      default:
        return `bg-gray-50 border-l-gray-500 ${baseClasses}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle alert acknowledgment
  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  };

  // Handle action click
  const handleActionClick = (action: AlertAction, alert: PerformanceAlerts) => {
    onActionClick(action.action, {
      ...action.params,
      alertId: alert.id,
      playerId: alert.playerId
    });
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = alerts.length;
    const unacknowledged = alerts.filter(a => !a.acknowledged && !acknowledgedAlerts.has(a.id)).length;
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unacknowledged,
      errors: byType.error || 0,
      warnings: byType.warning || 0,
      success: byType.success || 0,
      info: byType.info || 0
    };
  }, [alerts, acknowledgedAlerts]);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-500" />
              {t('physicalTrainer:analytics.alerts.title')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('physicalTrainer:analytics.alerts.noAlerts')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('physicalTrainer:analytics.alerts.noAlertsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            {t('physicalTrainer:analytics.alerts.title')}
            {summaryStats.unacknowledged > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summaryStats.unacknowledged}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BellOff className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summaryStats.errors}</div>
            <div className="text-xs text-gray-600">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.warnings}</div>
            <div className="text-xs text-gray-600">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.info}</div>
            <div className="text-xs text-gray-600">Info</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.success}</div>
            <div className="text-xs text-gray-600">Success</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            <option value="performance-decline">Performance Decline</option>
            <option value="injury-risk">Injury Risk</option>
            <option value="overtraining">Overtraining</option>
            <option value="improvement">Improvement</option>
            <option value="milestone">Milestone</option>
          </select>

          {filteredAlerts.length !== alerts.length && (
            <Badge variant="secondary" className="text-xs">
              {filteredAlerts.length} of {alerts.length} alerts
            </Badge>
          )}
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => {
            const isAcknowledged = alert.acknowledged || acknowledgedAlerts.has(alert.id);
            
            return (
              <Card 
                key={alert.id}
                className={`border-l-4 ${getAlertBgColor(alert.severity, isAcknowledged)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type, alert.severity)}
                      <div>
                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={alert.severity === 'error' ? 'destructive' : 
                                   alert.severity === 'warning' ? 'default' : 
                                   alert.severity === 'success' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isAcknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {isAcknowledged && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

                  {/* Player Information */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <User className="h-3 w-3" />
                    <span>Player ID: {alert.playerId}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{formatTimestamp(alert.triggeredAt)}</span>
                  </div>

                  {/* Actions */}
                  {alert.actions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-600">Available Actions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {alert.actions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(action, alert)}
                            className="text-xs h-8"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State for Filtered Results */}
        {filteredAlerts.length === 0 && alerts.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No alerts match your filters
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your filter criteria to see more alerts.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSeverityFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            {filteredAlerts.length} alert{filteredAlerts.length === 1 ? '' : 's'} shown
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All Alerts
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Alert History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}