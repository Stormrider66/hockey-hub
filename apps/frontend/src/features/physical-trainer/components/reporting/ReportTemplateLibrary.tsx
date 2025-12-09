import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Copy, Pencil, Trash2, Eye, Plus, Star, Users, Lock, Globe } from 'lucide-react';
import { ReportTemplate } from '../../types/report.types';

interface ReportTemplateLibraryProps {
  templates?: ReportTemplate[];
  onSelectTemplate?: (template: ReportTemplate) => void;
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: ReportTemplate) => void;
  onDuplicateTemplate?: (template: ReportTemplate) => void;
  onDeleteTemplate?: (template: ReportTemplate) => void;
  onPreviewTemplate?: (template: ReportTemplate) => void;
  className?: string;
}

interface TemplateFilters {
  search: string;
  type: string;
  category: string;
  author: string;
  isPublic?: boolean;
  isFavorite?: boolean;
}

const reportTypes = [
  { value: '', label: 'All Types' },
  { value: 'team_performance', label: 'Team Performance' },
  { value: 'player_progress', label: 'Player Progress' },
  { value: 'workout_effectiveness', label: 'Workout Effectiveness' },
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'custom_kpi', label: 'Custom KPI' },
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'custom', label: 'Custom' }
];

// Mock data for demonstration
const mockTemplates: ReportTemplate[] = [
  {
    id: 'template1',
    name: 'Team Performance Summary',
    description: 'Comprehensive overview of team performance metrics and trends',
    type: 'team_performance',
    category: 'Performance',
    sections: [],
    layout: {
      orientation: 'portrait',
      format: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      theme: { primaryColor: '#4F46E5', secondaryColor: '#6B7280', fontFamily: 'Arial', fontSize: 12 }
    },
    defaultFilters: {},
    metadata: {
      author: 'System',
      tags: ['team', 'performance', 'summary'],
      category: 'Performance',
      permissions: { view: [], edit: [], admin: [] },
      isPublic: true,
      version: '1.0.0',
      lastModified: new Date()
    },
    isActive: true,
    isSystemTemplate: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'template2',
    name: 'Individual Player Report',
    description: 'Detailed analysis of individual player performance and development',
    type: 'player_progress',
    category: 'Analytics',
    sections: [],
    layout: {
      orientation: 'portrait',
      format: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      theme: { primaryColor: '#059669', secondaryColor: '#6B7280', fontFamily: 'Arial', fontSize: 12 }
    },
    defaultFilters: {},
    metadata: {
      author: 'John Smith',
      tags: ['player', 'progress', 'analytics'],
      category: 'Analytics',
      permissions: { view: [], edit: [], admin: [] },
      isPublic: false,
      version: '2.1.0',
      lastModified: new Date('2024-01-15')
    },
    isActive: true,
    isSystemTemplate: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'template3',
    name: 'Workout Effectiveness Analysis',
    description: 'Analyze the effectiveness of different workout types and training methods',
    type: 'workout_effectiveness',
    category: 'Training',
    sections: [],
    layout: {
      orientation: 'landscape',
      format: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      theme: { primaryColor: '#DC2626', secondaryColor: '#6B7280', fontFamily: 'Arial', fontSize: 12 }
    },
    defaultFilters: {},
    metadata: {
      author: 'Sarah Johnson',
      tags: ['workout', 'effectiveness', 'training'],
      category: 'Training',
      permissions: { view: [], edit: [], admin: [] },
      isPublic: true,
      version: '1.2.0',
      lastModified: new Date('2024-02-01')
    },
    isActive: true,
    isSystemTemplate: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-01')
  }
];

export const ReportTemplateLibrary: React.FC<ReportTemplateLibraryProps> = ({
  templates = mockTemplates,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onPreviewTemplate,
  className = ''
}) => {
  const [filters, setFilters] = useState<TemplateFilters>({
    search: '',
    type: '',
    category: '',
    author: '',
    isPublic: undefined,
    isFavorite: undefined
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'type'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !template.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type && template.type !== filters.type) return false;
      if (filters.category && template.category !== filters.category) return false;
      if (filters.author && template.metadata.author !== filters.author) return false;
      if (filters.isPublic !== undefined && template.metadata.isPublic !== filters.isPublic) return false;
      if (filters.isFavorite && !favorites.has(template.id)) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'updated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
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

  const toggleFavorite = useCallback((templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  }, []);

  const getUniqueCategories = useCallback(() => {
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories).sort();
  }, [templates]);

  const getUniqueAuthors = useCallback(() => {
    const authors = new Set(templates.map(t => t.metadata.author));
    return Array.from(authors).sort();
  }, [templates]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTypeLabel = (type: string) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType?.label || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      team_performance: 'bg-blue-100 text-blue-800',
      player_progress: 'bg-green-100 text-green-800',
      workout_effectiveness: 'bg-purple-100 text-purple-800',
      medical_report: 'bg-red-100 text-red-800',
      attendance: 'bg-yellow-100 text-yellow-800',
      custom_kpi: 'bg-indigo-100 text-indigo-800',
      executive_summary: 'bg-gray-100 text-gray-800',
      custom: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`report-template-library ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Templates</h2>
          <p className="text-gray-600">Choose from existing templates or create a new one</p>
        </div>
        
        {onCreateTemplate && (
          <button
            onClick={onCreateTemplate}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Template
          </button>
        )}
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
              placeholder="Search templates..."
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

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <select
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Authors</option>
                {getUniqueAuthors().map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Created Date</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilters(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
          className={`flex items-center px-3 py-1 text-sm border rounded-full ${
            filters.isFavorite 
              ? 'border-yellow-300 bg-yellow-50 text-yellow-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star className="w-4 h-4 mr-1" />
          Favorites
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, isPublic: true }))}
          className={`flex items-center px-3 py-1 text-sm border rounded-full ${
            filters.isPublic === true
              ? 'border-green-300 bg-green-50 text-green-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4 mr-1" />
          Public
        </button>
        <button
          onClick={() => setFilters(prev => ({ ...prev, isPublic: false }))}
          className={`flex items-center px-3 py-1 text-sm border rounded-full ${
            filters.isPublic === false
              ? 'border-blue-300 bg-blue-50 text-blue-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Lock className="w-4 h-4 mr-1" />
          Private
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isFavorite={favorites.has(template.id)}
              onToggleFavorite={toggleFavorite}
              onSelect={onSelectTemplate}
              onEdit={onEditTemplate}
              onDuplicate={onDuplicateTemplate}
              onDelete={onDeleteTemplate}
              onPreview={onPreviewTemplate}
              getTypeLabel={getTypeLabel}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map(template => (
            <TemplateListItem
              key={template.id}
              template={template}
              isFavorite={favorites.has(template.id)}
              onToggleFavorite={toggleFavorite}
              onSelect={onSelectTemplate}
              onEdit={onEditTemplate}
              onDuplicate={onDuplicateTemplate}
              onDelete={onDeleteTemplate}
              onPreview={onPreviewTemplate}
              getTypeLabel={getTypeLabel}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Copy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.type || filters.category || filters.author 
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first report template.'
            }
          </p>
          {onCreateTemplate && (
            <button
              onClick={onCreateTemplate}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Template
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: ReportTemplate;
  isFavorite: boolean;
  onToggleFavorite: (id: string, event: React.MouseEvent) => void;
  onSelect?: (template: ReportTemplate) => void;
  onEdit?: (template: ReportTemplate) => void;
  onDuplicate?: (template: ReportTemplate) => void;
  onDelete?: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
  getTypeLabel: (type: string) => string;
  getTypeColor: (type: string) => string;
  formatDate: (date: Date) => string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
  getTypeLabel,
  getTypeColor,
  formatDate
}) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(template)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">{template.name}</h3>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                {getTypeLabel(template.type)}
              </span>
              {template.isSystemTemplate && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  System
                </span>
              )}
              {template.metadata.isPublic ? (
                <Globe className="w-4 h-4 text-green-500 ml-2" title="Public template" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400 ml-2" title="Private template" />
              )}
            </div>
          </div>
          <button
            onClick={(e) => onToggleFavorite(template.id, e)}
            className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none"
          >
            {isFavorite ? (
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {template.description || 'No description available'}
        </p>

        {/* Metadata */}
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            <span>By {template.metadata.author}</span>
          </div>
          <div>
            <span>Updated {formatDate(template.updatedAt)}</span>
          </div>
          <div>
            <span>{template.sections.length} section{template.sections.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tags */}
        {template.metadata.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {template.metadata.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {tag}
              </span>
            ))}
            {template.metadata.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{template.metadata.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(template);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(template);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {onDelete && !template.isSystemTemplate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(template);
              }}
              className="text-gray-400 hover:text-red-600 focus:outline-none"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Template List Item Component
interface TemplateListItemProps extends TemplateCardProps {}

const TemplateListItem: React.FC<TemplateListItemProps> = ({
  template,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
  getTypeLabel,
  getTypeColor,
  formatDate
}) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(template)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Title and Type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">{template.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                  {getTypeLabel(template.type)}
                </span>
                {template.isSystemTemplate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    System
                  </span>
                )}
                {template.metadata.isPublic ? (
                  <Globe className="w-4 h-4 text-green-500" title="Public template" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" title="Private template" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate mt-1">
                {template.description || 'No description available'}
              </p>
            </div>

            {/* Metadata */}
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{template.metadata.author}</span>
              </div>
              <div>{formatDate(template.updatedAt)}</div>
              <div>{template.sections.length} sections</div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => onToggleFavorite(template.id, e)}
                className="p-2 text-gray-400 hover:text-yellow-500 focus:outline-none"
              >
                {isFavorite ? (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Star className="w-5 h-5" />
                )}
              </button>

              {onPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(template);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              {onDuplicate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(template);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}

              {onDelete && !template.isSystemTemplate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {template.metadata.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {template.metadata.tags.slice(0, 5).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {tag}
              </span>
            ))}
            {template.metadata.tags.length > 5 && (
              <span className="text-xs text-gray-500">+{template.metadata.tags.length - 5} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTemplateLibrary;