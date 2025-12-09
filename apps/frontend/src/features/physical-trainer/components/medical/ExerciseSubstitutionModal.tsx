import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  Info, 
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ExerciseSubstitution {
  originalExercise: string;
  substituteExercise: string;
  modifications: string[];
  reason: string;
  regressionLevel: number; // 1-5 scale
  intensity?: number; // percentage of original
  duration?: number; // minutes
  equipment?: string[];
}

export interface ExerciseRestriction {
  movementPattern: string;
  bodyPart: string;
  intensityLimit: number;
  restrictionType: 'prohibited' | 'limited' | 'modified';
  reason: string;
}

interface ExerciseSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  originalExercise: string;
  substitutions: ExerciseSubstitution[];
  restrictions: ExerciseRestriction[];
  onApplySubstitution: (substitution: ExerciseSubstitution) => void;
  onRequestAlternatives: () => void;
  loading?: boolean;
}

const getRegressionColor = (level: number) => {
  if (level <= 2) return 'text-green-600 bg-green-100';
  if (level <= 3) return 'text-yellow-600 bg-yellow-100';
  if (level <= 4) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

const getRestrictionColor = (type: ExerciseRestriction['restrictionType']) => {
  switch (type) {
    case 'prohibited': return 'text-red-600 bg-red-100 border-red-200';
    case 'limited': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'modified': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const ExerciseSubstitutionModal: React.FC<ExerciseSubstitutionModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  originalExercise,
  substitutions,
  restrictions,
  onApplySubstitution,
  onRequestAlternatives,
  loading = false
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [selectedSubstitution, setSelectedSubstitution] = useState<ExerciseSubstitution | null>(null);

  useEffect(() => {
    if (substitutions.length > 0 && !selectedSubstitution) {
      // Auto-select the first (usually best) substitution
      setSelectedSubstitution(substitutions[0]);
    }
  }, [substitutions, selectedSubstitution]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedSubstitution) {
      onApplySubstitution(selectedSubstitution);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('medical.exerciseSubstitution')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('medical.substitutionFor')} <span className="font-medium">{playerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Panel - Exercise & Restrictions */}
          <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* Original Exercise */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('medical.originalExercise')}
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900">{originalExercise}</h4>
                <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('medical.restrictedForPlayer')}
                </p>
              </div>
            </div>

            {/* Medical Restrictions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('medical.medicalRestrictions')}
              </h3>
              <div className="space-y-3">
                {restrictions.map((restriction, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getRestrictionColor(restriction.restrictionType)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {restriction.bodyPart} - {restriction.movementPattern}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {t(`medical.restrictionType.${restriction.restrictionType}`)}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">{restriction.reason}</p>
                    {restriction.intensityLimit < 100 && (
                      <p className="text-xs mt-2">
                        {t('medical.intensityLimit')}: {restriction.intensityLimit}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Guidelines */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('medical.safetyGuidelines')}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('medical.monitorPlayerResponse')}</li>
                <li>• {t('medical.adjustIntensityAsNeeded')}</li>
                <li>• {t('medical.stopIfPainOccurs')}</li>
                <li>• {t('medical.documentAnyIssues')}</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Substitutions */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('medical.recommendedSubstitutions')}
              </h3>
              <button
                onClick={onRequestAlternatives}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('medical.requestAlternatives')}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">{t('medical.findingSubstitutions')}</span>
              </div>
            ) : substitutions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('medical.noSubstitutionsFound')}</p>
                <button
                  onClick={onRequestAlternatives}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('medical.generateAlternatives')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {substitutions.map((substitution, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSubstitution === substitution
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSubstitution(substitution)}
                  >
                    {/* Exercise Transition */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-gray-600 truncate max-w-32">
                        {originalExercise}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {substitution.substituteExercise}
                      </span>
                    </div>

                    {/* Substitution Details */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {t('medical.regressionLevel')}: 
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRegressionColor(substitution.regressionLevel)}`}>
                          {substitution.regressionLevel}/5
                        </span>
                      </div>
                      
                      {substitution.intensity && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {t('medical.intensity')}: {substitution.intensity}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Modifications */}
                    {substitution.modifications.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          {t('medical.modifications')}:
                        </h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {substitution.modifications.map((mod, modIndex) => (
                            <li key={modIndex} className="flex items-start gap-2">
                              <span className="text-xs mt-1">•</span>
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reason */}
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>{t('medical.reason')}:</strong> {substitution.reason}
                    </p>

                    {/* Equipment */}
                    {substitution.equipment && substitution.equipment.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{t('medical.equipment')}:</span>
                        <div className="flex flex-wrap gap-1">
                          {substitution.equipment.map((item, equipIndex) => (
                            <span
                              key={equipIndex}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {selectedSubstitution === substitution && (
                      <div className="mt-3 flex items-center gap-2 text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('medical.selected')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedSubstitution && (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {t('medical.substitutionSelected')}: {selectedSubstitution.substituteExercise}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedSubstitution}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('medical.applySubstitution')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSubstitutionModal;