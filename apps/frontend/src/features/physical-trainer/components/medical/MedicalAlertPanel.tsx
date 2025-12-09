import React, { useState, useEffect } from 'react';
import { AlertTriangle, Heart, Shield, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MedicalAlert {
  id: string;
  playerId: string;
  playerName: string;
  sessionId?: string;
  alertType: 'injury_risk' | 'load_management' | 'medical_emergency' | 'wellness_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendations: string[];
  requiresImmediateAction: boolean;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface MedicalAlertPanelProps {
  alerts: MedicalAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
  className?: string;
}

const getSeverityColor = (severity: MedicalAlert['severity']) => {
  switch (severity) {
    case 'critical': return 'border-red-500 bg-red-50 text-red-900';
    case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
    case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
    case 'low': return 'border-blue-500 bg-blue-50 text-blue-900';
    default: return 'border-gray-500 bg-gray-50 text-gray-900';
  }
};

const getSeverityIcon = (severity: MedicalAlert['severity']) => {
  switch (severity) {
    case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'high': return <AlertCircle className="h-5 w-5 text-orange-500" />;
    case 'medium': return <Shield className="h-5 w-5 text-yellow-500" />;
    case 'low': return <Heart className="h-5 w-5 text-blue-500" />;
    default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getAlertTypeIcon = (alertType: MedicalAlert['alertType']) => {
  switch (alertType) {
    case 'injury_risk': return <AlertTriangle className="h-4 w-4" />;
    case 'load_management': return <Shield className="h-4 w-4" />;
    case 'medical_emergency': return <Heart className="h-4 w-4" />;
    case 'wellness_concern': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

export const MedicalAlertPanel: React.FC<MedicalAlertPanelProps> = ({
  alerts,
  onAcknowledgeAlert,
  onDismissAlert,
  className = ''
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  // Auto-expand critical alerts
  useEffect(() => {
    const criticalAlerts = alerts
      .filter(alert => alert.severity === 'critical' || alert.requiresImmediateAction)
      .map(alert => alert.id);
    
    if (criticalAlerts.length > 0) {
      setExpandedAlerts(prev => new Set([...prev, ...criticalAlerts]));
    }
  }, [alerts]);

  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const handleAcknowledge = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onAcknowledgeAlert(alertId);
  };

  const handleDismiss = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDismissAlert(alertId);
  };

  if (alerts.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Heart className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>{t('medical.noActiveAlerts')}</p>
      </div>
    );
  }

  // Sort alerts by severity and timestamp
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {t('medical.activeAlerts')} ({alerts.length})
        </h3>
        
        {/* Alert summary */}
        <div className="flex items-center gap-2 text-sm">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const count = alerts.filter(a => a.severity === severity).length;
            if (count === 0) return null;
            
            return (
              <span
                key={severity}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  severity === 'critical' ? 'bg-red-100 text-red-800' :
                  severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                {count} {t(`medical.severity.${severity}`)}
              </span>
            );
          })}
        </div>
      </div>

      {sortedAlerts.map((alert) => {
        const isExpanded = expandedAlerts.has(alert.id);
        const isAcknowledged = !!alert.acknowledgedAt;
        
        return (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              getSeverityColor(alert.severity)
            } ${isAcknowledged ? 'opacity-60' : ''}`}
            onClick={() => toggleExpanded(alert.id)}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(alert.severity)}
                  {getAlertTypeIcon(alert.alertType)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">
                      {alert.playerName}
                    </h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {t(`medical.alertType.${alert.alertType}`)}
                    </span>
                    {alert.requiresImmediateAction && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white animate-pulse">
                        {t('medical.immediateAction')}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {alert.sessionId && (
                      <span>Session: {alert.sessionId.slice(-6)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {!isAcknowledged && (
                  <button
                    onClick={(e) => handleAcknowledge(alert.id, e)}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title={t('medical.acknowledgeAlert')}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {t('medical.acknowledge')}
                  </button>
                )}
                
                <button
                  onClick={(e) => handleDismiss(alert.id, e)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                  title={t('medical.dismissAlert')}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                {alert.recommendations.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold mb-2">
                      {t('medical.recommendations')}:
                    </h5>
                    <ul className="text-sm space-y-1">
                      {alert.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-xs mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isAcknowledged && (
                  <div className="mt-3 p-2 bg-white bg-opacity-30 rounded text-xs">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {t('medical.acknowledgedBy')} {alert.acknowledgedBy} at{' '}
                      {alert.acknowledgedAt && new Date(alert.acknowledgedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MedicalAlertPanel;