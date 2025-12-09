import React, { useState } from 'react';
import { X, Settings, Info, AlertTriangle } from 'lucide-react';
import { BatchMigrationOptions } from '../../utils/dataMigration';

interface MigrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: BatchMigrationOptions;
  onSave: (options: BatchMigrationOptions) => void;
}

export function MigrationSettingsModal({ 
  isOpen, 
  onClose, 
  options, 
  onSave 
}: MigrationSettingsModalProps) {
  const [localOptions, setLocalOptions] = useState<BatchMigrationOptions>(options);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = () => {
    onSave(localOptions);
    onClose();
  };

  const handleReset = () => {
    setLocalOptions({
      batchSize: 50,
      validateBeforeMigration: true,
      stopOnError: false,
      preserveOriginal: true,
      dryRun: false
    });
  };

  const updateOption = <K extends keyof BatchMigrationOptions>(
    key: K,
    value: BatchMigrationOptions[K]
  ) => {
    setLocalOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Migration Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure migration behavior and safety options
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
          <div className="space-y-6">
            
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
              
              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Batch Size
                  </label>
                  <div className="group relative">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Number of workouts to process in each batch. Smaller batches use less memory but take longer.
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={localOptions.batchSize}
                    onChange={(e) => updateOption('batchSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-16 text-center">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={localOptions.batchSize}
                      onChange={(e) => updateOption('batchSize', parseInt(e.target.value) || 50)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Recommended: 25-100 for most datasets
                </div>
              </div>

              {/* Validation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Validate Before Migration
                    </label>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Check data integrity before starting migration. Recommended for safety.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateOption('validateBeforeMigration', !localOptions.validateBeforeMigration)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localOptions.validateBeforeMigration ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localOptions.validateBeforeMigration ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {localOptions.validateBeforeMigration && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✓ Data will be validated before migration starts
                  </div>
                )}
              </div>

              {/* Preserve Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">
                      Preserve Original Data
                    </label>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Keep original data for rollback capability. Strongly recommended.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateOption('preserveOriginal', !localOptions.preserveOriginal)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localOptions.preserveOriginal ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localOptions.preserveOriginal ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {!localOptions.preserveOriginal && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Warning: Original data will be lost if migration fails</span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  
                  {/* Stop on Error */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Stop on First Error
                        </label>
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            Stop the entire migration when the first error occurs. Useful for debugging.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => updateOption('stopOnError', !localOptions.stopOnError)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localOptions.stopOnError ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localOptions.stopOnError ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {localOptions.stopOnError 
                        ? 'Migration will stop at the first error for investigation'
                        : 'Migration will continue and process all valid data'
                      }
                    </div>
                  </div>

                  {/* Dry Run */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Dry Run Mode
                        </label>
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            Test the migration without making actual changes. No data will be modified.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => updateOption('dryRun', !localOptions.dryRun)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          localOptions.dryRun ? 'bg-yellow-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            localOptions.dryRun ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {localOptions.dryRun && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        ℹ️ Dry run mode: No data will be modified, only validation and testing
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Performance Impact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Performance Impact</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{localOptions.batchSize < 50 ? 'Low' : localOptions.batchSize < 100 ? 'Medium' : 'High'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Speed:</span>
                  <span>{localOptions.validateBeforeMigration ? 'Slower (Safer)' : 'Faster'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safety Level:</span>
                  <span>
                    {localOptions.preserveOriginal && localOptions.validateBeforeMigration 
                      ? 'Very High' 
                      : localOptions.preserveOriginal || localOptions.validateBeforeMigration
                      ? 'High'
                      : 'Medium'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Quick Presets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setLocalOptions({
                    batchSize: 25,
                    validateBeforeMigration: true,
                    stopOnError: true,
                    preserveOriginal: true,
                    dryRun: false
                  })}
                  className="p-3 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="text-sm font-medium text-green-800">Safe & Careful</div>
                  <div className="text-xs text-green-600 mt-1">
                    Small batches, validation, stop on errors
                  </div>
                </button>

                <button
                  onClick={() => setLocalOptions({
                    batchSize: 50,
                    validateBeforeMigration: true,
                    stopOnError: false,
                    preserveOriginal: true,
                    dryRun: false
                  })}
                  className="p-3 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="text-sm font-medium text-blue-800">Recommended</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Balanced speed and safety
                  </div>
                </button>

                <button
                  onClick={() => setLocalOptions({
                    batchSize: 100,
                    validateBeforeMigration: false,
                    stopOnError: false,
                    preserveOriginal: false,
                    dryRun: false
                  })}
                  className="p-3 text-left border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <div className="text-sm font-medium text-orange-800">Fast & Risky</div>
                  <div className="text-xs text-orange-600 mt-1">
                    Large batches, minimal validation
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              Reset to Defaults
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrationSettingsModal;