import React, { useState, useCallback } from 'react';
import { FileText, Clock, Folder, Plus, BarChart, Settings } from 'lucide-react';
import {
  ReportHistory,
  ReportPreview
} from './index';
import { LazyReportingLoader } from '../loaders/LazyReportingLoader';
import {
  ReportTemplate,
  GeneratedReport,
  ScheduledReport,
  DataSourceConfig
} from '../../types/report.types';

interface ReportingDashboardProps {
  className?: string;
}

type ActiveView = 'overview' | 'builder' | 'templates' | 'history' | 'scheduler' | 'preview';

// Mock data sources for the report builder
const mockDataSources: DataSourceConfig[] = [
  {
    name: 'player_performance_stats',
    description: 'Player Performance Statistics',
    fields: [
      { name: 'playerId', type: 'string', label: 'Player ID' },
      { name: 'playerName', type: 'string', label: 'Player Name' },
      { name: 'performanceScore', type: 'number', label: 'Performance Score' },
      { name: 'goals', type: 'number', label: 'Goals' },
      { name: 'assists', type: 'number', label: 'Assists' },
      { name: 'gamesPlayed', type: 'number', label: 'Games Played' },
      { name: 'date', type: 'date', label: 'Date' }
    ],
    filters: [],
    aggregations: ['sum', 'avg', 'count', 'max', 'min']
  },
  {
    name: 'team_analytics',
    description: 'Team Analytics Data',
    fields: [
      { name: 'teamId', type: 'string', label: 'Team ID' },
      { name: 'teamName', type: 'string', label: 'Team Name' },
      { name: 'averagePerformance', type: 'number', label: 'Average Performance' },
      { name: 'wins', type: 'number', label: 'Wins' },
      { name: 'losses', type: 'number', label: 'Losses' },
      { name: 'date', type: 'date', label: 'Date' }
    ],
    filters: [],
    aggregations: ['sum', 'avg', 'count', 'max', 'min']
  },
  {
    name: 'training_statistics',
    description: 'Training Session Statistics',
    fields: [
      { name: 'sessionId', type: 'string', label: 'Session ID' },
      { name: 'workoutType', type: 'string', label: 'Workout Type' },
      { name: 'duration', type: 'number', label: 'Duration (minutes)' },
      { name: 'participants', type: 'number', label: 'Participants' },
      { name: 'completionRate', type: 'number', label: 'Completion Rate %' },
      { name: 'averageRating', type: 'number', label: 'Average Rating' },
      { name: 'date', type: 'date', label: 'Date' }
    ],
    filters: [],
    aggregations: ['sum', 'avg', 'count', 'max', 'min']
  }
];

export const ReportingDashboard: React.FC<ReportingDashboardProps> = ({
  className = ''
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'builder', label: 'Report Builder', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Folder },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'scheduler', label: 'Scheduled Reports', icon: Settings }
  ];

  // Template management handlers
  const handleCreateTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setActiveView('builder');
  }, []);

  const handleEditTemplate = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setActiveView('builder');
  }, []);

  const handleSelectTemplate = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setActiveView('builder');
  }, []);

  const handlePreviewTemplate = useCallback((template: ReportTemplate) => {
    setPreviewTemplate(template);
    setActiveView('preview');
  }, []);

  const handleSaveTemplate = useCallback((template: ReportTemplate) => {
    console.log('Saving template:', template);
    // Here you would call the API to save the template
    setActiveView('templates');
  }, []);

  // Report generation handlers
  const handleGenerateReport = useCallback((template: ReportTemplate) => {
    console.log('Generating report from template:', template);
    // Here you would call the API to generate a report
  }, []);

  const handleDownloadReport = useCallback((report: GeneratedReport) => {
    console.log('Downloading report:', report);
    // Here you would initiate the download
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  }, []);

  const handleDeleteReport = useCallback((report: GeneratedReport) => {
    console.log('Deleting report:', report);
    // Here you would call the API to delete the report
  }, []);

  // Scheduled report handlers
  const handleCreateSchedule = useCallback((scheduleData: any) => {
    console.log('Creating schedule:', scheduleData);
    // Here you would call the API to create the schedule
  }, []);

  const handleUpdateSchedule = useCallback((id: string, updates: any) => {
    console.log('Updating schedule:', id, updates);
    // Here you would call the API to update the schedule
  }, []);

  const handleDeleteSchedule = useCallback((id: string) => {
    console.log('Deleting schedule:', id);
    // Here you would call the API to delete the schedule
  }, []);

  const handleExecuteSchedule = useCallback((id: string) => {
    console.log('Executing schedule now:', id);
    // Here you would call the API to execute the schedule immediately
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reporting Dashboard</h2>
        <p className="text-gray-600">Create, manage, and schedule comprehensive reports for your training programs</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-600">Templates</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <BarChart className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">45</div>
              <div className="text-sm text-gray-600">Generated Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">6</div>
              <div className="text-sm text-gray-600">Scheduled Reports</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Data Sources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateTemplate}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-6 h-6 text-indigo-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Create New Report</div>
              <div className="text-sm text-gray-600">Build a custom report from scratch</div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('templates')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Folder className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Browse Templates</div>
              <div className="text-sm text-gray-600">Use existing report templates</div>
            </div>
          </button>

          <button
            onClick={() => setActiveView('scheduler')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Clock className="w-6 h-6 text-purple-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Schedule Reports</div>
              <div className="text-sm text-gray-600">Automate report generation</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Weekly Team Performance report generated</span>
            <span className="text-gray-400 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Player Progress template updated</span>
            <span className="text-gray-400 ml-auto">1 day ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Monthly training summary scheduled</span>
            <span className="text-gray-400 ml-auto">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return renderOverview();
      
      case 'builder':
        return (
          <LazyReportingLoader
            componentType="builder"
            template={selectedTemplate || undefined}
            onSave={handleSaveTemplate}
            onPreview={handlePreviewTemplate}
            dataSources={mockDataSources}
          />
        );
      
      case 'templates':
        return (
          <LazyReportingLoader
            componentType="templateLibrary"
            onSelectTemplate={handleSelectTemplate}
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onPreviewTemplate={handlePreviewTemplate}
            onDuplicateTemplate={(template) => {
              const duplicated = { ...template, id: `${template.id}_copy`, name: `${template.name} (Copy)` };
              setSelectedTemplate(duplicated);
              setActiveView('builder');
            }}
            onDeleteTemplate={(template) => {
              console.log('Deleting template:', template);
              // Here you would call the API to delete the template
            }}
          />
        );
      
      case 'history':
        return (
          <ReportHistory
            onDownload={handleDownloadReport}
            onPreview={(report) => {
              // Convert GeneratedReport to ReportTemplate for preview
              setPreviewTemplate(report.template);
              setActiveView('preview');
            }}
            onDelete={handleDeleteReport}
            onRegenerateReport={(report) => {
              console.log('Regenerating report:', report);
              // Here you would call the API to regenerate the report
            }}
          />
        );
      
      case 'scheduler':
        return (
          <LazyReportingLoader
            componentType="scheduler"
            onCreateSchedule={handleCreateSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onExecuteNow={handleExecuteSchedule}
          />
        );
      
      case 'preview':
        return previewTemplate ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
              <button
                onClick={() => setActiveView('templates')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                ← Back to Templates
              </button>
            </div>
            <ReportPreview
              template={previewTemplate}
              onExport={(format) => {
                console.log('Exporting in format:', format);
                // Here you would call the API to export the report
              }}
              showControls={true}
              interactive={true}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No template selected for preview</p>
          </div>
        );
      
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`reporting-dashboard h-full flex ${className}`}>
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)}
              className={`w-full flex items-center px-3 py-2 text-left rounded-md text-sm font-medium ${
                activeView === item.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;