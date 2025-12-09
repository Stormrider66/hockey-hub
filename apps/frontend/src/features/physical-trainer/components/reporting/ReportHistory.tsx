import React, { useState, useCallback } from 'react';
import { Clock, ArrowDownTrayIcon, Trash2, Eye, CheckCircle, ExclamationCircleIcon, RefreshCw, FileText, Search, Filter } from 'lucide-react';
import { GeneratedReport } from '../../types/report.types';

interface ReportHistoryProps {
  reports?: GeneratedReport[];
  onDownload?: (report: GeneratedReport) => void;
  onPreview?: (report: GeneratedReport) => void;
  onDelete?: (report: GeneratedReport) => void;
  onRegenerateReport?: (report: GeneratedReport) => void;
  isLoading?: boolean;
  className?: string;
}

interface HistoryFilters {
  search: string;
  status: string;
  format: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// Mock data for demonstration
const mockReports: GeneratedReport[] = [
  {
    id: 'report1',
    name: 'Team Performance Summary - January 2024',
    description: 'Monthly team performance analysis',
    template: {
      id: 'template1',
      name: 'Team Performance Summary',
      type: 'team_performance'
    } as any,
    templateId: 'template1',
    appliedFilters: {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      teams: ['team1', 'team2']
    },
    generatedData: {},
    format: 'pdf',
    filePath: '/reports/report1.pdf',
    downloadUrl: '/api/reports/report1/download',
    status: 'completed',
    generatedBy: 'john.doe@example.com',
    organizationId: 'org1',
    metadata: {
      fileSize: 2547382,
      pageCount: 12,
      generationTime: 8500,
      dataPoints: 450
    },
    createdAt: new Date('2024-02-01T10:30:00Z'),
    updatedAt: new Date('2024-02-01T10:30:00Z'),
    expiresAt: new Date('2024-03-02T10:30:00Z')
  },
  {
    id: 'report2',
    name: 'Player Progress Report - Sidney Crosby',
    description: 'Individual player development analysis',
    template: {
      id: 'template2',
      name: 'Individual Player Report',
      type: 'player_progress'
    } as any,
    templateId: 'template2',
    appliedFilters: {
      players: ['player1']
    },
    generatedData: {},
    format: 'excel',
    filePath: '/reports/report2.xlsx',
    downloadUrl: '/api/reports/report2/download',
    status: 'completed',
    generatedBy: 'sarah.johnson@example.com',
    organizationId: 'org1',
    metadata: {
      fileSize: 1234567,
      generationTime: 3200,
      dataPoints: 120
    },
    createdAt: new Date('2024-01-28T14:15:00Z'),
    updatedAt: new Date('2024-01-28T14:15:00Z'),
    expiresAt: new Date('2024-02-27T14:15:00Z')
  },
  {
    id: 'report3',
    name: 'Workout Effectiveness Analysis',
    description: 'Quarterly training program analysis',
    template: {
      id: 'template3',
      name: 'Workout Effectiveness Analysis',
      type: 'workout_effectiveness'
    } as any,
    templateId: 'template3',
    appliedFilters: {
      dateRange: {
        start: new Date('2023-10-01'),
        end: new Date('2023-12-31')
      },
      workoutTypes: ['strength', 'conditioning']
    },
    generatedData: {},
    format: 'pdf',
    status: 'failed',
    errorMessage: 'Insufficient data for the selected date range',
    generatedBy: 'mike.wilson@example.com',
    organizationId: 'org1',
    createdAt: new Date('2024-01-25T09:20:00Z'),
    updatedAt: new Date('2024-01-25T09:20:00Z')
  },
  {
    id: 'report4',
    name: 'Weekly Training Summary',
    description: 'Automated weekly report',
    template: {
      id: 'template1',
      name: 'Team Performance Summary',
      type: 'team_performance'
    } as any,
    templateId: 'template1',
    appliedFilters: {
      dateRange: {
        start: new Date('2024-01-22'),
        end: new Date('2024-01-28')
      }
    },
    generatedData: {},
    format: 'html',
    status: 'generating',
    generatedBy: 'system@example.com',
    organizationId: 'org1',
    scheduledReportId: 'scheduled1',
    createdAt: new Date('2024-01-29T08:00:00Z'),
    updatedAt: new Date('2024-01-29T08:00:00Z')
  }
];

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports = mockReports,
  onDownload,
  onPreview,
  onDelete,
  onRegenerateReport,
  isLoading = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    status: '',
    format: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'name' | 'size'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      if (filters.search && !report.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !report.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && report.status !== filters.status) return false;
      if (filters.format && report.format !== filters.format) return false;
      if (filters.dateRange.start && report.createdAt < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && report.createdAt > new Date(filters.dateRange.end)) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'size':
          aValue = a.metadata?.fileSize || 0;
          bValue = b.metadata?.fileSize || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getStatusIcon = (status: GeneratedReport['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'generating':
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: GeneratedReport['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'generating':
        return 'Generating...';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const getStatusColor = (status: GeneratedReport['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'generating':
      case 'pending':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'expired':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'csv':
        return '📋';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const isExpiringSoon = (report: GeneratedReport) => {
    if (!report.expiresAt) return false;
    const daysUntilExpiry = Math.ceil((report.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <div className={`report-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report History</h2>
          <p className="text-gray-600">View and manage previously generated reports</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search reports..."
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              showFilters ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="generating">Generating</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={filters.format}
                onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="html">HTML</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500">
            {filters.search || filters.status || filters.format || filters.dateRange.start || filters.dateRange.end
              ? 'Try adjusting your filters or search terms.'
              : 'Generate your first report to see it here.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(report.status)}
                    </div>

                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{report.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getFormatIcon(report.format)} {report.format.toUpperCase()}
                        </span>
                        {report.scheduledReportId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {report.description || 'No description available'}
                      </p>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Created {formatDate(report.createdAt)}</span>
                        <span>By {report.generatedBy}</span>
                        {report.metadata?.fileSize && (
                          <span>{formatFileSize(report.metadata.fileSize)}</span>
                        )}
                        {report.metadata?.pageCount && (
                          <span>{report.metadata.pageCount} pages</span>
                        )}
                        {report.metadata?.generationTime && (
                          <span>Generated in {(report.metadata.generationTime / 1000).toFixed(1)}s</span>
                        )}
                      </div>

                      {/* Error Message */}
                      {report.status === 'failed' && report.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Error:</strong> {report.errorMessage}
                        </div>
                      )}

                      {/* Expiry Warning */}
                      {isExpiringSoon(report) && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                          <Clock className="w-4 h-4 inline mr-1" />
                          This report will expire on {report.expiresAt?.toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {report.status === 'completed' && onPreview && (
                        <button
                          onClick={() => onPreview(report)}
                          className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}

                      {report.status === 'completed' && onDownload && (
                        <button
                          onClick={() => onDownload(report)}
                          className="p-2 text-gray-400 hover:text-indigo-600 focus:outline-none"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                      )}

                      {(report.status === 'failed' || report.status === 'expired') && onRegenerateReport && (
                        <button
                          onClick={() => onRegenerateReport(report)}
                          className="p-2 text-gray-400 hover:text-green-600 focus:outline-none"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={() => onDelete(report)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportHistory;