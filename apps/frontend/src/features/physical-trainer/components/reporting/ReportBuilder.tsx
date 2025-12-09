import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Trash2, Copy, Eye, Save, Settings, BarChart, Table, FileText, Image, TrendingUp, Minus } from 'lucide-react';
import { ReportSection, ReportTemplate, ReportFilters, ReportLayout } from '../../types/report.types';
import { ReportPreview } from './ReportPreview';
import { FilterPanel } from './FilterPanel';
import { LayoutConfigPanel } from './LayoutConfigPanel';
import { SectionConfigPanel } from './SectionConfigPanel';

interface ReportBuilderProps {
  template?: ReportTemplate;
  onSave?: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
  dataSources?: Array<{
    name: string;
    description: string;
    fields: Array<{
      name: string;
      type: string;
      label: string;
    }>;
  }>;
  className?: string;
}

interface SectionType {
  type: ReportSection['type'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const sectionTypes: SectionType[] = [
  {
    type: 'text',
    label: 'Text Block',
    icon: FileText,
    description: 'Add formatted text content'
  },
  {
    type: 'chart',
    label: 'Chart',
    icon: BarChart,
    description: 'Display data as charts and graphs'
  },
  {
    type: 'table',
    label: 'Data Table',
    icon: Table,
    description: 'Show tabular data'
  },
  {
    type: 'metric',
    label: 'Key Metric',
    icon: TrendingUp,
    description: 'Highlight important numbers'
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    description: 'Add images and graphics'
  },
  {
    type: 'divider',
    label: 'Section Divider',
    icon: Minus,
    description: 'Visual separator between sections'
  }
];

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  template,
  onSave,
  onPreview,
  dataSources = [],
  className = ''
}) => {
  const [reportTemplate, setReportTemplate] = useState<ReportTemplate>(() => ({
    id: template?.id || '',
    name: template?.name || 'New Report',
    description: template?.description || '',
    type: template?.type || 'custom',
    category: template?.category || 'Custom',
    sections: template?.sections || [],
    layout: template?.layout || {
      orientation: 'portrait',
      format: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      theme: {
        primaryColor: '#4F46E5',
        secondaryColor: '#6B7280',
        fontFamily: 'Arial',
        fontSize: 12
      }
    },
    defaultFilters: template?.defaultFilters || {},
    metadata: template?.metadata || {
      author: 'Current User',
      tags: [],
      category: 'Custom',
      permissions: { view: [], edit: [], admin: [] },
      isPublic: false,
      version: '1.0.0',
      lastModified: new Date()
    },
    isActive: true,
    isSystemTemplate: false,
    createdAt: template?.createdAt || new Date(),
    updatedAt: new Date()
  }));

  const [activePanel, setActivePanel] = useState<'sections' | 'filters' | 'layout' | 'preview'>('sections');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<ReportSection | null>(null);
  const dragDropAreaRef = useRef<HTMLDivElement>(null);

  const handleAddSection = useCallback((sectionType: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: sectionType,
      title: getSectionDefaultTitle(sectionType),
      content: getSectionDefaultContent(sectionType),
      config: getSectionDefaultConfig(sectionType),
      order: reportTemplate.sections.length,
      style: {
        margin: '10px 0',
        padding: '15px'
      }
    };

    setReportTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));

    setSelectedSection(newSection.id);
  }, [reportTemplate.sections.length]);

  const handleRemoveSection = useCallback((sectionId: string) => {
    setReportTemplate(prev => ({
      ...prev,
      sections: prev.sections
        .filter(section => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index })),
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));

    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  }, [selectedSection]);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    const sectionToDuplicate = reportTemplate.sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicatedSection: ReportSection = {
      ...sectionToDuplicate,
      id: `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: `${sectionToDuplicate.title} (Copy)`,
      order: reportTemplate.sections.length
    };

    setReportTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, duplicatedSection],
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));
  }, [reportTemplate.sections]);

  const handleUpdateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReportTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));
  }, []);

  const handleMoveSection = useCallback((dragIndex: number, hoverIndex: number) => {
    setReportTemplate(prev => {
      const sections = [...prev.sections];
      const draggedSection = sections[dragIndex];
      
      sections.splice(dragIndex, 1);
      sections.splice(hoverIndex, 0, draggedSection);
      
      // Update order
      sections.forEach((section, index) => {
        section.order = index;
      });

      return {
        ...prev,
        sections,
        metadata: {
          ...prev.metadata,
          lastModified: new Date()
        }
      };
    });
  }, []);

  const handleUpdateFilters = useCallback((filters: ReportFilters) => {
    setReportTemplate(prev => ({
      ...prev,
      defaultFilters: filters,
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));
  }, []);

  const handleUpdateLayout = useCallback((layout: ReportLayout) => {
    setReportTemplate(prev => ({
      ...prev,
      layout,
      metadata: {
        ...prev.metadata,
        lastModified: new Date()
      }
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(reportTemplate);
  }, [onSave, reportTemplate]);

  const handlePreview = useCallback(() => {
    onPreview?.(reportTemplate);
  }, [onPreview, reportTemplate]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`report-builder h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="report-builder-header bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={reportTemplate.name}
                onChange={(e) => setReportTemplate(prev => ({
                  ...prev,
                  name: e.target.value,
                  metadata: { ...prev.metadata, lastModified: new Date() }
                }))}
                className="text-xl font-semibold text-gray-900 border-none outline-none bg-transparent placeholder-gray-400"
                placeholder="Report Name"
              />
              <input
                type="text"
                value={reportTemplate.description || ''}
                onChange={(e) => setReportTemplate(prev => ({
                  ...prev,
                  description: e.target.value,
                  metadata: { ...prev.metadata, lastModified: new Date() }
                }))}
                className="block text-sm text-gray-600 border-none outline-none bg-transparent placeholder-gray-400 mt-1"
                placeholder="Report Description"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Template
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'sections', label: 'Sections', icon: FileText },
                { id: 'filters', label: 'Filters', icon: Settings },
                { id: 'layout', label: 'Layout', icon: Copy },
                { id: 'preview', label: 'Preview', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 ${
                    activePanel === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-1" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'sections' && (
                <SectionsPanel
                  sectionTypes={sectionTypes}
                  onAddSection={handleAddSection}
                  sections={reportTemplate.sections}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                  onMoveSection={handleMoveSection}
                  onRemoveSection={handleRemoveSection}
                  onDuplicateSection={handleDuplicateSection}
                />
              )}

              {activePanel === 'filters' && (
                <FilterPanel
                  filters={reportTemplate.defaultFilters}
                  onUpdateFilters={handleUpdateFilters}
                  dataSources={dataSources}
                />
              )}

              {activePanel === 'layout' && (
                <LayoutConfigPanel
                  layout={reportTemplate.layout}
                  onUpdateLayout={handleUpdateLayout}
                />
              )}

              {activePanel === 'preview' && (
                <div className="p-4">
                  <ReportPreview
                    template={reportTemplate}
                    className="border rounded-lg"
                    scale={0.5}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Section Editor */}
            <div className="flex-1 flex">
              {/* Canvas */}
              <div className="flex-1 overflow-y-auto bg-gray-100">
                <ReportCanvas
                  template={reportTemplate}
                  selectedSection={selectedSection}
                  onSelectSection={setSelectedSection}
                  onMoveSection={handleMoveSection}
                  ref={dragDropAreaRef}
                />
              </div>

              {/* Section Configuration Panel */}
              {selectedSection && (
                <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                  <SectionConfigPanel
                    section={reportTemplate.sections.find(s => s.id === selectedSection)!}
                    onUpdateSection={(updates) => handleUpdateSection(selectedSection, updates)}
                    dataSources={dataSources}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// Helper functions
function getSectionDefaultTitle(type: ReportSection['type']): string {
  switch (type) {
    case 'text': return 'Text Section';
    case 'chart': return 'Chart';
    case 'table': return 'Data Table';
    case 'metric': return 'Key Metric';
    case 'image': return 'Image';
    case 'divider': return '';
    default: return 'Section';
  }
}

function getSectionDefaultContent(type: ReportSection['type']): any {
  switch (type) {
    case 'text': return 'Enter your text content here...';
    case 'chart': return { type: 'line', data: [], options: {} };
    case 'table': return { headers: [], rows: [] };
    case 'metric': return { value: 0, label: 'Metric', format: 'number' };
    case 'image': return { src: '', alt: '', caption: '' };
    case 'divider': return null;
    default: return null;
  }
}

function getSectionDefaultConfig(type: ReportSection['type']): any {
  switch (type) {
    case 'chart':
      return {
        chart: {
          type: 'line',
          xField: 'date',
          yField: 'value',
          backgroundColor: '#4F46E5',
          borderColor: '#4F46E5'
        }
      };
    case 'table':
      return {
        table: {
          maxRows: 50,
          showSummary: false,
          sortable: true
        }
      };
    case 'metric':
      return {
        metric: {
          aggregation: 'sum',
          field: 'value',
          format: 'number',
          showTrend: false
        }
      };
    default:
      return {};
  }
}

// Sections Panel Component
interface SectionsPanelProps {
  sectionTypes: SectionType[];
  onAddSection: (type: ReportSection['type']) => void;
  sections: ReportSection[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onMoveSection: (dragIndex: number, hoverIndex: number) => void;
  onRemoveSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
}

const SectionsPanel: React.FC<SectionsPanelProps> = ({
  sectionTypes,
  onAddSection,
  sections,
  selectedSection,
  onSelectSection,
  onRemoveSection,
  onDuplicateSection
}) => {
  return (
    <div className="p-4 space-y-6">
      {/* Add Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Add Section</h3>
        <div className="space-y-2">
          {sectionTypes.map((sectionType) => (
            <button
              key={sectionType.type}
              onClick={() => onAddSection(sectionType.type)}
              className="w-full flex items-center p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <sectionType.icon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">{sectionType.label}</div>
                <div className="text-xs text-gray-500">{sectionType.description}</div>
              </div>
              <Plus className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Section List */}
      {sections.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Report Sections</h3>
          <div className="space-y-2">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isSelected={selectedSection === section.id}
                  onSelect={() => onSelectSection(section.id)}
                  onRemove={() => onRemoveSection(section.id)}
                  onDuplicate={() => onDuplicateSection(section.id)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Section List Item Component
interface SectionListItemProps {
  section: ReportSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const SectionListItem: React.FC<SectionListItemProps> = ({
  section,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate
}) => {
  const sectionType = sectionTypes.find(t => t.type === section.type);
  const IconComponent = sectionType?.icon || FileText;

  return (
    <div
      className={`p-3 bg-white border rounded-lg cursor-pointer ${
        isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center">
        <IconComponent className="w-4 h-4 text-gray-400 mr-2" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {section.title || sectionType?.label || 'Section'}
          </div>
          <div className="text-xs text-gray-500">
            {sectionType?.label}
          </div>
        </div>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            title="Duplicate section"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
            title="Remove section"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Report Canvas Component
interface ReportCanvasProps {
  template: ReportTemplate;
  selectedSection: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onMoveSection: (dragIndex: number, hoverIndex: number) => void;
}

const ReportCanvas = React.forwardRef<HTMLDivElement, ReportCanvasProps>(({
  template,
  selectedSection,
  onSelectSection,
  onMoveSection
}, ref) => {
  return (
    <div className="p-8">
      <div
        ref={ref}
        className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg min-h-screen"
        style={{
          aspectRatio: template.layout.orientation === 'landscape' ? '11.7/8.3' : '8.3/11.7'
        }}
      >
        {/* Report Header */}
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h1>
          {template.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
        </div>

        {/* Report Sections */}
        <div className="p-8 space-y-6">
          {template.sections.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sections added yet. Use the sidebar to add content.</p>
            </div>
          ) : (
            template.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <CanvasSectionItem
                  key={section.id}
                  section={section}
                  index={index}
                  isSelected={selectedSection === section.id}
                  onSelect={() => onSelectSection(section.id)}
                  onMoveSection={onMoveSection}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
});

// Canvas Section Item Component
interface CanvasSectionItemProps {
  section: ReportSection;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveSection: (dragIndex: number, hoverIndex: number) => void;
}

const CanvasSectionItem: React.FC<CanvasSectionItemProps> = ({
  section,
  index,
  isSelected,
  onSelect,
  onMoveSection
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'section',
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      onMoveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));

  const renderSectionContent = () => {
    switch (section.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <p>{section.content || 'Enter your text content here...'}</p>
          </div>
        );
      case 'chart':
        return (
          <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be rendered here</p>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column 2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column 3
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample data</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample data</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample data</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'metric':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {section.content?.value || '0'}
            </div>
            <div className="text-lg text-gray-600">
              {section.content?.label || 'Metric'}
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Image placeholder</p>
            </div>
          </div>
        );
      case 'divider':
        return <hr className="border-gray-300" />;
      default:
        return <div className="text-gray-500">Unknown section type</div>;
    }
  };

  return (
    <div
      ref={ref}
      className={`relative cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
      style={{
        ...section.style,
        opacity: isDragging ? 0.5 : 1
      }}
      onClick={onSelect}
    >
      {section.title && section.type !== 'divider' && (
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
      )}
      {renderSectionContent()}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default ReportBuilder;