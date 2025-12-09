import React, { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock, 
  Activity,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface LoadManagementRecommendation {
  playerId: string;
  playerName: string;
  currentLoad: number;
  recommendedLoad: number;
  loadReduction: number; // percentage
  reason: string;
  durationDays: number;
  modifications: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
}

interface LoadManagementPanelProps {
  recommendations: LoadManagementRecommendation[];
  onApplyRecommendation: (playerId: string, newLoad: number) => void;
  onCustomizeLoad: (playerId: string, customLoad: number, reason: string) => void;
  className?: string;
}

const getRiskColor = (riskLevel: LoadManagementRecommendation['riskLevel']) => {
  switch (riskLevel) {
    case 'critical': return 'text-red-600 bg-red-100 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-100 border-green-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

const getLoadColor = (reduction: number) => {
  if (reduction >= 50) return 'text-red-600';
  if (reduction >= 30) return 'text-orange-600';
  if (reduction >= 15) return 'text-yellow-600';
  return 'text-blue-600';
};

export const LoadManagementPanel: React.FC<LoadManagementPanelProps> = ({
  recommendations,
  onApplyRecommendation,
  onCustomizeLoad,
  className = ''
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const [customLoads, setCustomLoads] = useState<Record<string, { load: number; reason: string }>>({});
  const [showCustomizeFor, setShowCustomizeFor] = useState<string | null>(null);

  const toggleExpanded = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleCustomLoadChange = (playerId: string, field: 'load' | 'reason', value: string | number) => {
    setCustomLoads(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value
      }
    }));
  };

  const handleApplyCustomLoad = (playerId: string) => {
    const custom = customLoads[playerId];
    if (custom && custom.load >= 0 && custom.load <= 100) {
      onCustomizeLoad(playerId, custom.load, custom.reason || 'Custom load adjustment');
      setShowCustomizeFor(null);
      setCustomLoads(prev => {
        const newCustomLoads = { ...prev };
        delete newCustomLoads[playerId];
        return newCustomLoads;
      });
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        <Target className="h-12 w-12 mx-auto mb-3 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('medical.loadManagement.noRecommendations')}
        </h3>
        <p className="text-sm">
          {t('medical.loadManagement.allPlayersOptimal')}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          {t('medical.loadManagement.title')}
        </h3>
        
        <div className="text-sm text-gray-600">
          {recommendations.length} {t('medical.loadManagement.playersNeedAdjustment')}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isExpanded = expandedPlayers.has(rec.playerId);
          const isCustomizing = showCustomizeFor === rec.playerId;
          const customLoad = customLoads[rec.playerId];

          return (
            <div
              key={rec.playerId}
              className={`border rounded-lg p-4 transition-all ${getRiskColor(rec.riskLevel)}`}
            >
              {/* Main Content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Player Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {rec.playerName}
                    </h4>
                    <p className="text-sm opacity-90 mb-2">{rec.reason}</p>
                    
                    {/* Load Comparison */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t('medical.loadManagement.current')}:
                        </span>
                        <span className="px-2 py-1 rounded text-sm font-medium bg-white bg-opacity-50">
                          {rec.currentLoad}%
                        </span>
                      </div>
                      
                      <TrendingDown className={`h-4 w-4 ${getLoadColor(rec.loadReduction)}`} />
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t('medical.loadManagement.recommended')}:
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getLoadColor(rec.loadReduction)} bg-white`}>
                          {rec.recommendedLoad}%
                        </span>
                      </div>
                      
                      <div className={`text-sm font-medium ${getLoadColor(rec.loadReduction)}`}>
                        (-{rec.loadReduction.toFixed(0)}%)
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{rec.durationDays} {rec.durationDays === 1 ? t('common.day') : t('common.days')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(rec.playerId)}
                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                    title={isExpanded ? t('common.collapse') : t('common.expand')}
                  >
                    {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => setShowCustomizeFor(isCustomizing ? null : rec.playerId)}
                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                    title={t('medical.loadManagement.customize')}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onApplyRecommendation(rec.playerId, rec.recommendedLoad)}
                    className="px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('medical.loadManagement.apply')}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                  {/* Modifications */}
                  {rec.modifications.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {t('medical.loadManagement.modifications')}:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {rec.modifications.map((mod, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <span>{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="text-xs opacity-75">
                    {t('common.lastUpdated')}: {new Date(rec.lastUpdated).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Custom Load Input */}
              {isCustomizing && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                  <h5 className="text-sm font-semibold mb-3">
                    {t('medical.loadManagement.customizeLoad')}:
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('medical.loadManagement.customLoad')} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customLoad?.load || rec.recommendedLoad}
                        onChange={(e) => handleCustomLoadChange(rec.playerId, 'load', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Enter load percentage"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('medical.loadManagement.reason')}
                      </label>
                      <input
                        type="text"
                        value={customLoad?.reason || ''}
                        onChange={(e) => handleCustomLoadChange(rec.playerId, 'reason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Reason for custom load"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => handleApplyCustomLoad(rec.playerId)}
                      disabled={!customLoad?.load || customLoad.load < 0 || customLoad.load > 100}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {t('medical.loadManagement.applyCustom')}
                    </button>
                    
                    <button
                      onClick={() => setShowCustomizeFor(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {recommendations.filter(r => r.riskLevel === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">{t('medical.riskLevel.critical')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {recommendations.filter(r => r.riskLevel === 'high').length}
            </div>
            <div className="text-sm text-gray-600">{t('medical.riskLevel.high')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {recommendations.filter(r => r.riskLevel === 'medium').length}
            </div>
            <div className="text-sm text-gray-600">{t('medical.riskLevel.medium')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {recommendations.filter(r => r.riskLevel === 'low').length}
            </div>
            <div className="text-sm text-gray-600">{t('medical.riskLevel.low')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadManagementPanel;