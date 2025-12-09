import React, { useState, useCallback } from 'react';
import { 
  Clock,
  Mail,
  Calendar,
  Play,
  Pause,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { ScheduledReport, ReportTemplate, ReportFilters } from '../../types/report.types';

interface ReportSchedulerProps {
  scheduledReports?: ScheduledReport[];
  templates?: ReportTemplate[];
  onCreateSchedule?: (schedule: CreateScheduleData) => void;
  onUpdateSchedule?: (id: string, updates: Partial<ScheduledReport>) => void;
  onDeleteSchedule?: (id: string) => void;
  onExecuteNow?: (id: string) => void;
  className?: string;
}

interface CreateScheduleData {
  name: string;
  description?: string;
  templateId: string;
  filters: ReportFilters;
  schedule: ScheduledReport['schedule'];
  cronExpression?: string;
  formats: string[];
  delivery: ScheduledReport['delivery'];
}

// Mock data for demonstration
const mockScheduledReports: ScheduledReport[] = [
  {
    id: 'schedule1',
    name: 'Weekly Team Performance',
    description: 'Automated weekly team performance summary',
    template: {
      id: 'template1',
      name: 'Team Performance Summary',
      type: 'team_performance'
    } as any,
    templateId: 'template1',
    filters: {
      dateRange: {
        start: new Date(),
        end: new Date()
      },
      teams: ['team1', 'team2']
    },
    schedule: 'weekly',
    cronExpression: '0 8 * * 1',
    formats: ['pdf', 'excel'],
    delivery: {
      method: 'email',
      recipients: ['coach@example.com', 'manager@example.com'],
      subject: 'Weekly Team Performance Report',
      message: 'Please find the weekly team performance report attached.',
      attachmentName: 'team_performance_weekly'
    },
    isActive: true,
    createdBy: 'john.doe@example.com',
    organizationId: 'org1',
    nextRun: new Date('2024-02-05T08:00:00Z'),
    lastRun: new Date('2024-01-29T08:00:00Z'),
    runCount: 8,
    lastStatus: 'success',
    createdAt: new Date('2023-12-01T10:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z')
  },
  {
    id: 'schedule2',
    name: 'Monthly Player Reports',
    description: 'Individual player progress reports sent monthly',
    template: {
      id: 'template2',
      name: 'Individual Player Report',
      type: 'player_progress'
    } as any,
    templateId: 'template2',
    filters: {
      dateRange: {
        start: new Date(),
        end: new Date()
      }
    },
    schedule: 'monthly',
    cronExpression: '0 9 1 * *',
    formats: ['pdf'],
    delivery: {
      method: 'email',
      recipients: ['coach@example.com'],
      subject: 'Monthly Player Progress Reports',
      attachmentName: 'player_reports_monthly'
    },
    isActive: false,
    createdBy: 'sarah.johnson@example.com',
    organizationId: 'org1',
    nextRun: new Date('2024-03-01T09:00:00Z'),
    lastRun: new Date('2024-01-01T09:00:00Z'),
    runCount: 2,
    lastStatus: 'failed: Insufficient data',
    createdAt: new Date('2023-11-15T16:20:00Z'),
    updatedAt: new Date('2024-01-01T09:05:00Z')
  }
];

const mockTemplates: ReportTemplate[] = [
  {
    id: 'template1',
    name: 'Team Performance Summary',
    type: 'team_performance',
    category: 'Performance'
  } as ReportTemplate,
  {
    id: 'template2',
    name: 'Individual Player Report',
    type: 'player_progress',
    category: 'Analytics'
  } as ReportTemplate,
  {
    id: 'template3',
    name: 'Workout Effectiveness Analysis',
    type: 'workout_effectiveness',
    category: 'Training'
  } as ReportTemplate
];

export const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  scheduledReports = mockScheduledReports,
  templates = mockTemplates,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onExecuteNow,
  className = ''
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);

  const toggleScheduleActive = useCallback((id: string, isActive: boolean) => {
    onUpdateSchedule?.(id, { isActive });
  }, [onUpdateSchedule]);

  const formatNextRun = (date: Date | undefined) => {
    if (!date) return 'Not scheduled';
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScheduleLabel = (schedule: ScheduledReport['schedule']) => {
    switch (schedule) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'custom': return 'Custom';
      default: return schedule;
    }
  };

  const getStatusColor = (lastStatus?: string) => {
    if (!lastStatus) return 'text-gray-500';
    if (lastStatus === 'success') return 'text-green-600';
    if (lastStatus.startsWith('failed')) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className={`report-scheduler ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Reports</h2>
          <p className="text-gray-600">Automate report generation and delivery</p>
        </div>
        
        {onCreateSchedule && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Schedule Report
          </button>
        )}
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
          <p className="text-gray-500 mb-4">
            Set up automated report generation to save time and ensure consistent delivery.
          </p>
          {onCreateSchedule && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Schedule
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map(schedule => (
            <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {schedule.isActive ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      )}
                    </div>

                    {/* Schedule Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{schedule.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getScheduleLabel(schedule.schedule)}
                        </span>
                        {!schedule.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Paused
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {schedule.description || 'No description available'}
                      </p>

                      <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Next: {formatNextRun(schedule.nextRun)}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          <span>{schedule.delivery.recipients.length} recipient{schedule.delivery.recipients.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{schedule.formats.join(', ').toUpperCase()}</span>
                        </div>
                        <div className="flex items-center">
                          <span>Runs: {schedule.runCount}</span>
                        </div>
                      </div>

                      {/* Last Status */}
                      {schedule.lastStatus && (
                        <div className={`text-sm mt-1 ${getStatusColor(schedule.lastStatus)}`}>
                          Last run: {schedule.lastStatus}
                          {schedule.lastRun && ` on ${schedule.lastRun.toLocaleDateString()}`}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleScheduleActive(schedule.id, !schedule.isActive)}
                        className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          schedule.isActive 
                            ? 'text-orange-600 hover:text-orange-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        title={schedule.isActive ? 'Pause schedule' : 'Resume schedule'}
                      >
                        {schedule.isActive ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>

                      {/* Execute Now */}
                      {onExecuteNow && schedule.isActive && (
                        <button
                          onClick={() => onExecuteNow(schedule.id)}
                          className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Execute now"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => setEditingSchedule(schedule)}
                        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Edit schedule"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      {onDeleteSchedule && (
                        <button
                          onClick={() => onDeleteSchedule(schedule.id)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Template</h4>
                      <p className="text-gray-600">{schedule.template.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Delivery</h4>
                      <p className="text-gray-600 capitalize">{schedule.delivery.method}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Created</h4>
                      <p className="text-gray-600">{schedule.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="mt-3">
                    <h4 className="font-medium text-gray-700 mb-1">Recipients</h4>
                    <div className="flex flex-wrap gap-1">
                      {schedule.delivery.recipients.map((recipient, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {recipient}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          schedule={editingSchedule}
          templates={templates}
          onSave={(data) => {
            if (editingSchedule) {
              onUpdateSchedule?.(editingSchedule.id, data);
              setEditingSchedule(null);
            } else {
              onCreateSchedule?.(data);
              setShowCreateModal(false);
            }
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};

// Schedule Modal Component
interface ScheduleModalProps {
  schedule?: ScheduledReport | null;
  templates: ReportTemplate[];
  onSave: (data: CreateScheduleData) => void;
  onCancel: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  schedule,
  templates,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateScheduleData>({
    name: schedule?.name || '',
    description: schedule?.description || '',
    templateId: schedule?.templateId || '',
    filters: schedule?.filters || {},
    schedule: schedule?.schedule || 'weekly',
    cronExpression: schedule?.cronExpression || '',
    formats: schedule?.formats || ['pdf'],
    delivery: schedule?.delivery || {
      method: 'email',
      recipients: [],
      subject: '',
      message: ''
    }
  });

  const [recipientInput, setRecipientInput] = useState('');

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !formData.delivery.recipients.includes(recipientInput.trim())) {
      setFormData(prev => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          recipients: [...prev.delivery.recipients, recipientInput.trim()]
        }
      }));
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        recipients: prev.delivery.recipients.filter(r => r !== recipient)
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {schedule ? 'Edit Schedule' : 'Create Schedule'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Template</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Schedule Settings</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.schedule === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cron Expression</label>
                    <input
                      type="text"
                      value={formData.cronExpression}
                      onChange={(e) => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0 8 * * *"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Export Formats</label>
                <div className="space-y-2">
                  {['pdf', 'excel', 'csv', 'html'].map(format => (
                    <label key={format} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={formData.formats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, formats: [...prev.formats, format] }));
                          } else {
                            setFormData(prev => ({ ...prev, formats: prev.formats.filter(f => f !== format) }));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 uppercase">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Delivery Settings</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select
                  value={formData.delivery.method}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    delivery: { ...prev.delivery, method: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="email">Email</option>
                  <option value="download">Download Only</option>
                  <option value="both">Email + Download</option>
                </select>
              </div>

              {(formData.delivery.method === 'email' || formData.delivery.method === 'both') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="email"
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Add recipient email"
                      />
                      <button
                        type="button"
                        onClick={handleAddRecipient}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.delivery.recipients.map(recipient => (
                        <span key={recipient} className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-indigo-100 text-indigo-800">
                          {recipient}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(recipient)}
                            className="ml-1 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={formData.delivery.subject}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        delivery: { ...prev.delivery, subject: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Report subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Message</label>
                    <textarea
                      value={formData.delivery.message}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        delivery: { ...prev.delivery, message: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Optional message to include in the email"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {schedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportScheduler;