/**
 * BatchResultsSummary Component
 * 
 * Displays comprehensive results from batch operations including
 * success/failure breakdown, error details, and action items.
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight, Clock, RefreshCw } from 'lucide-react';
import { BatchResponse, BatchOperationResult, BatchError } from '../../types/batch-operations.types';

interface BatchResultsSummaryProps {
  results: BatchResponse;
  onRetry?: (failedOperations: BatchOperationResult[]) => void;
  onUndo?: () => void;
  showDetails?: boolean;
}

export const BatchResultsSummary: React.FC<BatchResultsSummaryProps> = ({
  results,
  onRetry,
  onUndo,
  showDetails = true
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [selectedTab, setSelectedTab] = useState<'all' | 'success' | 'failed'>('all');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    if (results.summary.failed === 0) return 'border-green-200 bg-green-50';
    if (results.summary.successful > 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getStatusTextColor = () => {
    if (results.summary.failed === 0) return 'text-green-800';
    if (results.summary.successful > 0) return 'text-yellow-800';
    return 'text-red-800';
  };

  const filteredResults = results.results.filter(result => {
    switch (selectedTab) {
      case 'success':
        return result.status === 'SUCCESS';
      case 'failed':
        return result.status === 'FAILED';
      default:
        return true;
    }
  });

  const failedResults = results.results.filter(r => r.status === 'FAILED');

  return (
    <div className={`border rounded-lg ${getStatusColor()}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${getStatusTextColor()}`}>
            Batch Operation Results
          </h3>
          <div className="flex gap-2">
            {failedResults.length > 0 && onRetry && (
              <button
                onClick={() => onRetry(failedResults)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Failed
              </button>
            )}
            {onUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Undo
              </button>
            )}
          </div>
        </div>
        
        <p className={`text-sm ${getStatusTextColor()} mt-1`}>
          Request ID: {results.requestId} • Status: {results.status}
        </p>
      </div>

      {/* Summary Section */}
      <div className="p-4">
        <button
          onClick={() => toggleSection('summary')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="text-md font-medium text-gray-900">Summary</h4>
          {expandedSections.has('summary') ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections.has('summary') && (
          <div className="mt-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Successful</p>
                    <p className="text-xl font-bold text-green-600">{results.summary.successful}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Failed</p>
                    <p className="text-xl font-bold text-red-600">{results.summary.failed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-xl font-bold text-blue-600">{formatDuration(results.summary.duration)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-purple-600 rounded mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Avg Time</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatDuration(results.summary.averageOperationTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">Performance Metrics</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Operations:</span>
                  <span className="ml-2 font-medium">{results.summary.total}</span>
                </div>
                <div>
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="ml-2 font-medium">
                    {Math.round((results.summary.successful / results.summary.total) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Peak Concurrency:</span>
                  <span className="ml-2 font-medium">{results.summary.peakConcurrency}</span>
                </div>
                <div>
                  <span className="text-gray-600">Operations/sec:</span>
                  <span className="ml-2 font-medium">
                    {Math.round(results.summary.total / (results.summary.duration / 1000))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {showDetails && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <button
              onClick={() => toggleSection('details')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-md font-medium text-gray-900">Detailed Results</h4>
              {expandedSections.has('details') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.has('details') && (
              <div className="mt-4">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      selectedTab === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({results.results.length})
                  </button>
                  <button
                    onClick={() => setSelectedTab('success')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      selectedTab === 'success' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Success ({results.summary.successful})
                  </button>
                  <button
                    onClick={() => setSelectedTab('failed')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      selectedTab === 'failed' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Failed ({results.summary.failed})
                  </button>
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredResults.map((result, index) => (
                    <div
                      key={result.operationId}
                      className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900">
                                Operation {index + 1}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {result.operationId}
                              </span>
                            </div>
                            
                            {result.error && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm font-medium text-red-800">
                                  {result.error.code}
                                </p>
                                <p className="text-sm text-red-700">
                                  {result.error.message}
                                </p>
                                {result.error.suggestedAction && (
                                  <p className="text-sm text-red-600 mt-1">
                                    <strong>Suggestion:</strong> {result.error.suggestedAction}
                                  </p>
                                )}
                              </div>
                            )}

                            {result.result && selectedTab !== 'failed' && (
                              <div className="mt-2 text-sm text-gray-600">
                                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(result.result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          {result.duration && (
                            <p>{formatDuration(result.duration)}</p>
                          )}
                          {result.retryCount && result.retryCount > 0 && (
                            <p>Retries: {result.retryCount}</p>
                          )}
                          <p>{new Date(result.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No {selectedTab === 'all' ? '' : selectedTab} operations to display
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Errors */}
      {results.errors && results.errors.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <button
              onClick={() => toggleSection('errors')}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-md font-medium text-red-900">Global Errors</h4>
              {expandedSections.has('errors') ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.has('errors') && (
              <div className="mt-4 space-y-3">
                {results.errors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-red-900">{error.code}</h5>
                        <p className="text-sm text-red-800 mt-1">{error.message}</p>
                        {error.details && (
                          <pre className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        )}
                        {error.suggestedAction && (
                          <p className="text-sm text-red-700 mt-2">
                            <strong>Suggested Action:</strong> {error.suggestedAction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};