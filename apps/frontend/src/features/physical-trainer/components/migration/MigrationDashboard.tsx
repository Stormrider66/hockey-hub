import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  RotateCcw,
  Download,
  Upload,
  Eye,
  Settings,
  BarChart3,
  X
} from 'lucide-react';
import { useMigration, useMigrationValidation } from '../../hooks/useMigration';
import { BatchMigrationOptions } from '../../utils/dataMigration';
import MigrationProgressModal from './MigrationProgressModal';
import MigrationAnalysisModal from './MigrationAnalysisModal';
import MigrationSettingsModal from './MigrationSettingsModal';
import RollbackModal from './RollbackModal';

interface MigrationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: any[];
}

export function MigrationDashboard({ isOpen, onClose, workouts }: MigrationDashboardProps) {
  const { 
    state, 
    analysis, 
    rollbackState,
    analyzeData, 
    clearResults,
    exportResults
  } = useMigration();
  
  const { validateWorkouts, clearCache } = useMigrationValidation();
  
  const [showProgress, setShowProgress] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const [migrationOptions, setMigrationOptions] = useState<BatchMigrationOptions>({
    batchSize: 50,
    validateBeforeMigration: true,
    stopOnError: false,
    preserveOriginal: true,
    dryRun: false
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-analyze on mount
  useEffect(() => {
    if (isOpen && workouts.length > 0 && !analysis && !isAnalyzing) {
      handleAnalyzeData();
    }
  }, [isOpen, workouts, analysis, isAnalyzing]);

  const handleAnalyzeData = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeData(workouts);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartMigration = () => {
    setShowProgress(true);
  };

  const handleMigrationComplete = (results: any) => {
    setShowProgress(false);
    // Could show a success modal or notification here
  };

  const handleExportResults = () => {
    const results = exportResults();
    const blob = new Blob([JSON.stringify(results, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    clearResults();
    clearCache();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Data Migration Dashboard
                </h2>
                <p className="text-sm text-gray-500">
                  Manage workout data migration to unified format
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Overview */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Data Overview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Data Overview</h3>
                    <button
                      onClick={handleAnalyzeData}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
                    </button>
                  </div>

                  {analysis ? (
                    <div className="space-y-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-900">
                            {analysis.totalWorkouts}
                          </div>
                          <div className="text-sm text-blue-600">Total Workouts</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-900">
                            {analysis.migrationNeeded}
                          </div>
                          <div className="text-sm text-yellow-600">Need Migration</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-900">
                            {analysis.alreadyMigrated}
                          </div>
                          <div className="text-sm text-green-600">Already Migrated</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-red-900">
                            {analysis.invalidData}
                          </div>
                          <div className="text-sm text-red-600">Invalid Data</div>
                        </div>
                      </div>

                      {/* Format Breakdown */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Format Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(analysis.byFormat).map(([format, count]) => (
                            <div key={format} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{format}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(count / analysis.totalWorkouts) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                  {count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Estimated Duration */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Estimated Migration Time:</span>
                          <span className="font-medium text-gray-900">
                            {Math.round(analysis.estimatedDuration / 1000)}s
                          </span>
                        </div>
                      </div>

                      {/* Potential Issues */}
                      {analysis.potentialIssues.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span>Potential Issues ({analysis.potentialIssues.length})</span>
                          </h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                            <div className="space-y-1">
                              {analysis.potentialIssues.map((issue, index) => (
                                <div key={index} className="text-sm text-yellow-800">
                                  {issue}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {isAnalyzing ? 'Analyzing workout data...' : 'Click "Re-analyze" to analyze your data'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Migration Results */}
                {state.results && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Migration Results</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleExportResults}
                          className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={handleClearAll}
                          className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {state.results.filter(r => r.success).length}
                        </div>
                        <div className="text-sm text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {state.results.filter(r => !r.success).length}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {state.warnings.length}
                        </div>
                        <div className="text-sm text-gray-600">Warnings</div>
                      </div>
                    </div>

                    {state.endTime && state.startTime && (
                      <div className="text-sm text-gray-600">
                        Completed in {Math.round((state.endTime.getTime() - state.startTime.getTime()) / 1000)}s
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-6">
                
                {/* Migration Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Actions</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAnalysis(true)}
                      disabled={!analysis}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Analysis</span>
                    </button>

                    <button
                      onClick={() => setShowSettings(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Migration Settings</span>
                    </button>

                    <button
                      onClick={handleStartMigration}
                      disabled={!analysis || analysis.migrationNeeded === 0 || state.isRunning}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Migration</span>
                    </button>

                    {state.results && state.results.some(r => r.success) && (
                      <button
                        onClick={() => setShowRollback(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Migration Settings Preview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Settings</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch Size:</span>
                      <span className="font-medium">{migrationOptions.batchSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validate Before:</span>
                      <span className="font-medium">
                        {migrationOptions.validateBeforeMigration ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stop on Error:</span>
                      <span className="font-medium">
                        {migrationOptions.stopOnError ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preserve Original:</span>
                      <span className="font-medium">
                        {migrationOptions.preserveOriginal ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dry Run:</span>
                      <span className="font-medium">
                        {migrationOptions.dryRun ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {state.isRunning ? (
                        <>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          <span className="text-sm text-blue-600">Migration Running</span>
                        </>
                      ) : state.results ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Migration Complete</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <span className="text-sm text-gray-600">Ready to Migrate</span>
                        </>
                      )}
                    </div>

                    {rollbackState.isRollingBack && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
                        <span className="text-sm text-yellow-600">Rollback in Progress</span>
                      </div>
                    )}

                    {state.error && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Error Occurred</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {workouts.length} workouts loaded
                {analysis && (
                  <span className="ml-2">
                    • {analysis.migrationNeeded} need migration
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MigrationProgressModal
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        workouts={workouts}
        options={migrationOptions}
        onComplete={handleMigrationComplete}
      />

      <MigrationAnalysisModal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        analysis={analysis}
      />

      <MigrationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        options={migrationOptions}
        onSave={setMigrationOptions}
      />

      <RollbackModal
        isOpen={showRollback}
        onClose={() => setShowRollback(false)}
        workouts={state.results?.filter(r => r.success).map(r => r.data) || []}
      />
    </>
  );
}

export default MigrationDashboard;