import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, FileText, Clock } from 'lucide-react';
import { useMigration } from '../../hooks/useMigration';
import { UnifiedWorkoutSession } from '../../types/unified';

interface RollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: UnifiedWorkoutSession[];
}

export function RollbackModal({ isOpen, onClose, workouts }: RollbackModalProps) {
  const { rollback, rollbackState } = useMigration();
  const [selectedFormat, setSelectedFormat] = useState<'strength' | 'conditioning' | 'hybrid' | 'agility'>('strength');
  const [confirmRollback, setConfirmRollback] = useState(false);

  const formatOptions = [
    {
      value: 'strength' as const,
      label: 'Strength Training',
      description: 'Traditional workout format with exercises and sets',
      color: 'blue'
    },
    {
      value: 'conditioning' as const,
      label: 'Conditioning/Cardio',
      description: 'Interval-based cardio programs',
      color: 'red'
    },
    {
      value: 'hybrid' as const,
      label: 'Hybrid Workouts',
      description: 'Mixed format with exercises and intervals',
      color: 'purple'
    },
    {
      value: 'agility' as const,
      label: 'Agility Training',
      description: 'Phase-based agility drills and patterns',
      color: 'orange'
    }
  ];

  const handleRollback = async () => {
    if (!confirmRollback) return;
    
    try {
      await rollback(workouts, selectedFormat);
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const getWorkoutsByType = () => {
    const byType: Record<string, number> = {};
    workouts.forEach(workout => {
      byType[workout.type] = (byType[workout.type] || 0) + 1;
    });
    return byType;
  };

  const workoutsByType = getWorkoutsByType();
  const estimatedDataLoss = workouts.filter(w => w.type !== selectedFormat).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <RotateCcw className="h-6 w-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Rollback Migration
              </h2>
              <p className="text-sm text-gray-500">
                Convert {workouts.length} unified workouts back to legacy format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {rollbackState.isRollingBack ? (
            /* Rollback Progress */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-16 h-16 border-4 border-yellow-200 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-yellow-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Rolling Back Migration
                </h3>
                <p className="text-gray-600">
                  Converting workouts back to {selectedFormat} format...
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{rollbackState.rollbackProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${rollbackState.rollbackProgress}%` }}
                  />
                </div>
              </div>

              {rollbackState.rollbackErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Rollback Errors</h4>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {rollbackState.rollbackErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error.field}: {error.message}
                      </div>
                    ))}
                    {rollbackState.rollbackErrors.length > 5 && (
                      <div className="text-sm text-red-600">
                        ... and {rollbackState.rollbackErrors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Rollback Configuration */
            <div className="space-y-6">
              
              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">Rollback Warning</h3>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>Rolling back will convert unified workouts to legacy format.</p>
                  <p>Some features and data may be lost in the conversion process.</p>
                  <p>This action cannot be easily undone.</p>
                </div>
              </div>

              {/* Current State */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Unified Workouts</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workoutsByType.strength || 0}</div>
                    <div className="text-sm text-gray-600">Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{workoutsByType.conditioning || 0}</div>
                    <div className="text-sm text-gray-600">Conditioning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{workoutsByType.hybrid || 0}</div>
                    <div className="text-sm text-gray-600">Hybrid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{workoutsByType.agility || 0}</div>
                    <div className="text-sm text-gray-600">Agility</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Total: {workouts.length} unified workouts
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Select Target Format</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedFormat(option.value)}
                      className={`p-4 text-left border-2 rounded-lg transition-all ${
                        selectedFormat === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-medium ${
                        selectedFormat === option.value 
                          ? `text-${option.color}-800` 
                          : 'text-gray-900'
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs mt-1 ${
                        selectedFormat === option.value 
                          ? `text-${option.color}-600` 
                          : 'text-gray-600'
                      }`}>
                        {option.description}
                      </div>
                      {selectedFormat === option.value && (
                        <div className={`text-xs mt-2 font-medium text-${option.color}-700`}>
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-3">Impact Analysis</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Workouts to convert:</span>
                    <span className="font-medium text-red-900">{workouts.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Direct conversions:</span>
                    <span className="font-medium text-green-700">
                      {workoutsByType[selectedFormat] || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Cross-format conversions:</span>
                    <span className="font-medium text-red-900">{estimatedDataLoss}</span>
                  </div>

                  {estimatedDataLoss > 0 && (
                    <div className="bg-red-100 p-3 rounded border border-red-300 mt-3">
                      <div className="text-red-800 font-medium mb-1">
                        ⚠️ Data Loss Warning
                      </div>
                      <div className="text-red-700 text-xs">
                        {estimatedDataLoss} workouts will be converted to {selectedFormat} format.
                        Type-specific features may be lost or simplified.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Estimated Time</span>
                </div>
                <div className="text-sm text-gray-600">
                  ~{Math.round(workouts.length * 30 / 1000)}s for {workouts.length} workouts
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={confirmRollback}
                    onChange={(e) => setConfirmRollback(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    I understand that this rollback may cause data loss and cannot be easily undone
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {rollbackState.isRollingBack 
                ? `Rolling back to ${selectedFormat} format...`
                : `Converting ${workouts.length} workouts to ${selectedFormat}`
              }
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={rollbackState.isRollingBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {rollbackState.isRollingBack ? 'Close' : 'Cancel'}
              </button>
              {!rollbackState.isRollingBack && (
                <button
                  onClick={handleRollback}
                  disabled={!confirmRollback}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Rollback
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RollbackModal;