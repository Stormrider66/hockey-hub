import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Activity, Clock, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnomalyDetectionPanelProps {
  teamId: string;
  organizationId: string;
  onAnomalySelect?: (anomaly: any) => void;
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  confidence: number;
  urgency: number;
  affectedEntities: Array<{
    type: string;
    id: string;
    name: string;
    impactLevel: string;
  }>;
  anomalyData: {
    detectedMetric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    deviationPercentage: number;
  };
  possibleCauses: Array<{
    cause: string;
    probability: number;
  }>;
  recommendations: string[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

const AnomalyDetectionPanel: React.FC<AnomalyDetectionPanelProps> = ({
  teamId,
  organizationId,
  onAnomalySelect
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [isLoading, setIsLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [timeframe, setTimeframe] = useState<string>('7d');

  useEffect(() => {
    loadAnomalies();
  }, [teamId, timeframe]);

  const loadAnomalies = async () => {
    setIsLoading(true);
    try {
      // Mock data loading
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockAnomalies: Anomaly[] = [
        {
          id: 'anomaly-001',
          type: 'performance_drop',
          severity: 'high',
          title: 'Unusual Performance Decline - Connor McDavid',
          description: 'Performance metrics showing 15% decline over past 5 days, significantly outside normal variation',
          detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          confidence: 92,
          urgency: 88,
          affectedEntities: [
            {
              type: 'player',
              id: 'mcdavid-connor',
              name: 'Connor McDavid',
              impactLevel: 'high'
            }
          ],
          anomalyData: {
            detectedMetric: 'composite_performance_score',
            currentValue: 78,
            expectedValue: 92,
            deviation: 2.8,
            deviationPercentage: -15
          },
          possibleCauses: [
            { cause: 'Accumulated fatigue', probability: 75 },
            { cause: 'Minor injury not reported', probability: 45 },
            { cause: 'External stress factors', probability: 30 }
          ],
          recommendations: [
            'Immediate wellness check with player',
            'Review training load over past 2 weeks',
            'Consider reducing intensity for 2-3 days',
            'Schedule medical evaluation'
          ],
          status: 'new'
        },
        {
          id: 'anomaly-002',
          type: 'unusual_load',
          severity: 'medium',
          title: 'Training Load Spike - Defensemen Group',
          description: 'Defensive unit showing 30% higher load than planned, risk of overtraining',
          detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          confidence: 85,
          urgency: 65,
          affectedEntities: [
            {
              type: 'group',
              id: 'defensemen',
              name: 'Defensive Unit',
              impactLevel: 'medium'
            }
          ],
          anomalyData: {
            detectedMetric: 'weekly_training_load',
            currentValue: 130,
            expectedValue: 100,
            deviation: 2.1,
            deviationPercentage: 30
          },
          possibleCauses: [
            { cause: 'Unplanned additional sessions', probability: 80 },
            { cause: 'Higher intensity than prescribed', probability: 60 },
            { cause: 'Compensation for injured players', probability: 40 }
          ],
          recommendations: [
            'Review and adjust training schedule',
            'Implement load redistribution',
            'Add recovery session',
            'Monitor fatigue markers closely'
          ],
          status: 'investigating'
        },
        {
          id: 'anomaly-003',
          type: 'recovery_anomaly',
          severity: 'medium',
          title: 'Delayed Recovery Pattern - Nathan MacKinnon',
          description: 'Recovery metrics not returning to baseline 48 hours post-game',
          detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          confidence: 78,
          urgency: 55,
          affectedEntities: [
            {
              type: 'player',
              id: 'mackinnon-nathan',
              name: 'Nathan MacKinnon',
              impactLevel: 'medium'
            }
          ],
          anomalyData: {
            detectedMetric: 'recovery_score',
            currentValue: 62,
            expectedValue: 85,
            deviation: 1.9,
            deviationPercentage: -27
          },
          possibleCauses: [
            { cause: 'Insufficient sleep quality', probability: 70 },
            { cause: 'Nutritional deficiency', probability: 50 },
            { cause: 'Chronic fatigue accumulation', probability: 65 }
          ],
          recommendations: [
            'Sleep quality assessment',
            'Nutritional consultation',
            'Modified training for 3 days',
            'Hydration protocol review'
          ],
          status: 'investigating'
        },
        {
          id: 'anomaly-004',
          type: 'pattern_deviation',
          severity: 'low',
          title: 'Movement Pattern Change - Sidney Crosby',
          description: 'Skating stride showing subtle changes that may indicate compensation',
          detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          confidence: 72,
          urgency: 35,
          affectedEntities: [
            {
              type: 'player',
              id: 'crosby-sidney',
              name: 'Sidney Crosby',
              impactLevel: 'low'
            }
          ],
          anomalyData: {
            detectedMetric: 'stride_symmetry',
            currentValue: 88,
            expectedValue: 95,
            deviation: 1.5,
            deviationPercentage: -7
          },
          possibleCauses: [
            { cause: 'Minor muscle tightness', probability: 60 },
            { cause: 'Equipment adjustment needed', probability: 40 },
            { cause: 'Natural variation', probability: 30 }
          ],
          recommendations: [
            'Movement screening assessment',
            'Equipment check',
            'Targeted mobility work',
            'Continue monitoring'
          ],
          status: 'resolved'
        }
      ];

      setAnomalies(mockAnomalies);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'investigating': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    return `${diffHours}h ago`;
  };

  const filteredAnomalies = anomalies.filter(anomaly => {
    if (filterSeverity !== 'all' && anomaly.severity !== filterSeverity) return false;
    if (filterStatus === 'active' && (anomaly.status === 'resolved' || anomaly.status === 'false_positive')) return false;
    if (filterStatus === 'resolved' && anomaly.status !== 'resolved') return false;
    return true;
  });

  const handleMarkResolved = (anomalyId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, status: 'resolved' } : a
    ));
  };

  const handleMarkFalsePositive = (anomalyId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === anomalyId ? { ...a, status: 'false_positive' } : a
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Anomaly Detection System
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time detection of unusual patterns and performance deviations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-32">
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{anomalies.length}</div>
            <p className="text-sm text-gray-600">Total Anomalies</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {anomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length}
            </div>
            <p className="text-sm text-gray-600">High Priority</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {anomalies.filter(a => a.status === 'investigating').length}
            </div>
            <p className="text-sm text-gray-600">Investigating</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {anomalies.filter(a => a.status === 'resolved').length}
            </div>
            <p className="text-sm text-gray-600">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {filteredAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>URGENT:</strong> {filteredAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length} high-priority anomalies require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Anomaly List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No anomalies detected for the selected filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnomalies.map(anomaly => (
            <Card key={anomaly.id} className={`border-l-4 ${
              anomaly.severity === 'critical' ? 'border-l-red-500' :
              anomaly.severity === 'high' ? 'border-l-orange-500' :
              anomaly.severity === 'medium' ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(anomaly.status)}
                      <h4 className="font-medium text-gray-900">{anomaly.title}</h4>
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(anomaly.detectedAt)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3">{anomaly.description}</p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">Metric</p>
                        <p className="text-sm font-medium">{anomaly.anomalyData.detectedMetric}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">Current</p>
                        <p className="text-sm font-medium">{anomaly.anomalyData.currentValue}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">Expected</p>
                        <p className="text-sm font-medium">{anomaly.anomalyData.expectedValue}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">Deviation</p>
                        <p className="text-sm font-medium text-red-600">
                          {anomaly.anomalyData.deviationPercentage}%
                        </p>
                      </div>
                    </div>

                    {/* Affected Entities */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-600">Affected:</span>
                      {anomaly.affectedEntities.map((entity, idx) => (
                        <Badge key={idx} variant="outline">
                          {entity.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Possible Causes */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Possible Causes:</p>
                      <div className="flex flex-wrap gap-2">
                        {anomaly.possibleCauses.map((cause, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {cause.cause} ({cause.probability}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Confidence and Urgency */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Confidence: {anomaly.confidence}%</span>
                      <span>Urgency: {anomaly.urgency}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAnomaly(anomaly)}
                    >
                      View Details
                    </Button>
                    {anomaly.status === 'new' || anomaly.status === 'investigating' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleMarkResolved(anomaly.id)}
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600"
                          onClick={() => handleMarkFalsePositive(anomaly.id)}
                        >
                          False Positive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedAnomaly.title}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAnomaly(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                  <div className="space-y-2">
                    {selectedAnomaly.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Detection Timeline</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Detected:</span>
                      <span className="font-medium">{selectedAnomaly.detectedAt.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{selectedAnomaly.status}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAnomaly(null)}
                  >
                    Close
                  </Button>
                  {selectedAnomaly.status !== 'resolved' && (
                    <Button
                      onClick={() => {
                        handleMarkResolved(selectedAnomaly.id);
                        setSelectedAnomaly(null);
                      }}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetectionPanel;