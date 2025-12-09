import React from 'react';
import { X, AlertTriangle, FileText, Clock, Database } from 'lucide-react';
import { MigrationAnalysis } from '../../hooks/useMigration';

interface MigrationAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: MigrationAnalysis | null;
}

export function MigrationAnalysisModal({ isOpen, onClose, analysis }: MigrationAnalysisModalProps) {
  if (!isOpen || !analysis) return null;

  const migrationPercentage = analysis.totalWorkouts > 0 
    ? Math.round((analysis.migrationNeeded / analysis.totalWorkouts) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Migration Analysis Report
              </h2>
              <p className="text-sm text-gray-500">
                Detailed analysis of {analysis.totalWorkouts} workouts
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
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Workouts</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analysis.totalWorkouts}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Workouts in dataset
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Need Migration</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">
                  {analysis.migrationNeeded}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  {migrationPercentage}% of total
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm font-medium text-green-800">Already Migrated</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analysis.alreadyMigrated}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {Math.round((analysis.alreadyMigrated / analysis.totalWorkouts) * 100)}% of total
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <X className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Invalid Data</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {analysis.invalidData}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {Math.round((analysis.invalidData / analysis.totalWorkouts) * 100)}% of total
                </div>
              </div>
            </div>

            {/* Format Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Format Distribution</h3>
              
              <div className="space-y-4">
                {Object.entries(analysis.byFormat).map(([format, count]) => {
                  const percentage = Math.round((count / analysis.totalWorkouts) * 100);
                  const formatColors = {
                    strength: 'bg-blue-500',
                    conditioning: 'bg-red-500',
                    hybrid: 'bg-purple-500',
                    agility: 'bg-orange-500',
                    unified: 'bg-green-500',
                    unknown: 'bg-gray-500'
                  };
                  
                  return (
                    <div key={format} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${formatColors[format] || 'bg-gray-400'}`} />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {format} Workouts
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {count} ({percentage}%)
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${formatColors[format] || 'bg-gray-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Migration Requirements */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Requirements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Estimated Time</div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {Math.round(analysis.estimatedDuration / 1000)}s
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on {Math.round(analysis.estimatedDuration / analysis.totalWorkouts)}ms per workout
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Memory Usage</div>
                  <div className="text-sm text-gray-600">
                    ~{Math.round((analysis.totalWorkouts * 50) / 1024)}KB
                  </div>
                  <div className="text-xs text-gray-500">
                    Estimated peak memory
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Backup Space</div>
                  <div className="text-sm text-gray-600">
                    ~{Math.round((analysis.totalWorkouts * 10) / 1024)}KB
                  </div>
                  <div className="text-xs text-gray-500">
                    For rollback data
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Issues */}
            {analysis.potentialIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-medium text-yellow-800">
                    Potential Issues ({analysis.potentialIssues.length})
                  </h3>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {analysis.potentialIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-yellow-100 rounded-md"
                    >
                      <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="text-sm text-yellow-800 leading-relaxed">
                        {issue}
                      </div>
                    </div>
                  ))}
                </div>
                
                {analysis.potentialIssues.length > 20 && (
                  <div className="mt-3 text-sm text-yellow-700">
                    Showing first 20 issues. Full list will be available in migration report.
                  </div>
                )}
              </div>
            )}

            {/* Migration Strategy */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Migration Strategy</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pre-migration Validation</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Validate {analysis.migrationNeeded} workouts before migration to catch issues early
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Batch Processing</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Recommended batch size: {analysis.totalWorkouts < 100 ? 25 : 50} workouts
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Backup Strategy</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {analysis.invalidData > 0 || analysis.potentialIssues.length > 0
                        ? 'Preserve original data due to potential issues'
                        : 'Original data can be safely replaced after successful migration'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Error Handling</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {analysis.potentialIssues.length > 5
                        ? 'Continue on errors to process valid data'
                        : 'Stop on first error for careful review'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-800 mb-4">Expected Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {Math.max(0, analysis.migrationNeeded - Math.floor(analysis.invalidData / 2))}
                  </div>
                  <div className="text-sm text-green-600">Expected Successful</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {Math.min(analysis.potentialIssues.length, 10)}
                  </div>
                  <div className="text-sm text-yellow-600">Expected Warnings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {Math.floor(analysis.invalidData / 2)}
                  </div>
                  <div className="text-sm text-red-600">Expected Failures</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-green-700">
                Success Rate: ~{Math.round(((analysis.migrationNeeded - Math.floor(analysis.invalidData / 2)) / analysis.migrationNeeded) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Analysis completed at {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrationAnalysisModal;