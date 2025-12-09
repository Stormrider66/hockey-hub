import React, { useState, useCallback } from 'react';
import { FileText, BarChart, Table, Image, TrendingUp, SwatchIcon, Sliders, Box, Trash2 } from 'lucide-react';
import { ReportSection, ChartConfig, TableConfig, MetricConfig, DataSourceConfig } from '../../types/report.types';

interface SectionConfigPanelProps {
  section: ReportSection;
  onUpdateSection: (updates: Partial<ReportSection>) => void;
  dataSources?: DataSourceConfig[];
  className?: string;
}

const chartTypes = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'doughnut', label: 'Doughnut Chart', icon: '🍩' },
  { value: 'area', label: 'Area Chart', icon: '📈' },
  { value: 'scatter', label: 'Scatter Plot', icon: '🔵' }
];

const aggregationTypes = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'max', label: 'Maximum' },
  { value: 'min', label: 'Minimum' }
];

const formatTypes = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'decimal', label: 'Decimal' }
];

export const SectionConfigPanel: React.FC<SectionConfigPanelProps> = ({
  section,
  onUpdateSection,
  dataSources = [],
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'data' | 'style'>('content');

  const handleUpdateContent = useCallback((content: any) => {
    onUpdateSection({ content });
  }, [onUpdateSection]);

  const handleUpdateConfig = useCallback((config: any) => {
    onUpdateSection({ config: { ...section.config, ...config } });
  }, [section.config, onUpdateSection]);

  const handleUpdateStyle = useCallback((style: any) => {
    onUpdateSection({ style: { ...section.style, ...style } });
  }, [section.style, onUpdateSection]);

  const getIcon = () => {
    switch (section.type) {
      case 'text': return DocumentTextIcon;
      case 'chart': return ChartBarIcon;
      case 'table': return TableCellsIcon;
      case 'metric': return PresentationChartLineIcon;
      case 'image': return PhotoIcon;
      default: return CubeIcon;
    }
  };

  const Icon = getIcon();

  const renderContentTab = () => {
    switch (section.type) {
      case 'text':
        return renderTextContent();
      case 'chart':
        return renderChartContent();
      case 'table':
        return renderTableContent();
      case 'metric':
        return renderMetricContent();
      case 'image':
        return renderImageContent();
      case 'divider':
        return renderDividerContent();
      default:
        return <div className="text-gray-500 text-sm">No configuration available for this section type.</div>;
    }
  };

  const renderTextContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
        <textarea
          value={section.content || ''}
          onChange={(e) => handleUpdateContent(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={6}
          placeholder="Enter your text content here..."
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-2">Available Variables</h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div><code>{'{{current_date}}'}</code> - Current date</div>
          <div><code>{'{{date_range}}'}</code> - Filter date range</div>
          <div><code>{'{{team_count}}'}</code> - Number of teams</div>
          <div><code>{'{{player_count}}'}</code> - Number of players</div>
        </div>
      </div>
    </div>
  );

  const renderChartContent = () => {
    const chartConfig = (section.config?.chart || {}) as ChartConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleUpdateConfig({ chart: { ...chartConfig, type: type.value } })}
                className={`p-3 text-center border rounded-lg text-sm ${
                  chartConfig.type === type.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg mb-1">{type.icon}</div>
                <div className="font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">X-Axis Field</label>
            <select
              value={chartConfig.xField || ''}
              onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, xField: e.target.value } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select field...</option>
              {getAvailableFields().map((field) => (
                <option key={field.name} value={field.name}>{field.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Y-Axis Field</label>
            <select
              value={chartConfig.yField || ''}
              onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, yField: e.target.value } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select field...</option>
              {getAvailableFields().filter(f => f.type === 'number').map((field) => (
                <option key={field.name} value={field.name}>{field.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dataset Label</label>
          <input
            type="text"
            value={chartConfig.datasetLabel || ''}
            onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, datasetLabel: e.target.value } })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Data series name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={chartConfig.backgroundColor || '#4F46E5'}
                onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, backgroundColor: e.target.value } })}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={chartConfig.backgroundColor || '#4F46E5'}
                onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, backgroundColor: e.target.value } })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={chartConfig.borderColor || '#4F46E5'}
                onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, borderColor: e.target.value } })}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={chartConfig.borderColor || '#4F46E5'}
                onChange={(e) => handleUpdateConfig({ chart: { ...chartConfig, borderColor: e.target.value } })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    const tableConfig = (section.config?.table || {}) as TableConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Columns</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {getAvailableFields().map((field) => (
              <label key={field.name} className="flex items-center">
                <input
                  type="checkbox"
                  checked={tableConfig.columns?.includes(field.name) || false}
                  onChange={(e) => {
                    const currentColumns = tableConfig.columns || [];
                    const newColumns = e.target.checked
                      ? [...currentColumns, field.name]
                      : currentColumns.filter(col => col !== field.name);
                    handleUpdateConfig({ table: { ...tableConfig, columns: newColumns } });
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                <span className="ml-1 text-xs text-gray-500">({field.type})</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Rows</label>
          <input
            type="number"
            value={tableConfig.maxRows || 50}
            onChange={(e) => handleUpdateConfig({ table: { ...tableConfig, maxRows: parseInt(e.target.value) || 50 } })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="1"
            max="1000"
          />
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={tableConfig.showSummary || false}
              onChange={(e) => handleUpdateConfig({ table: { ...tableConfig, showSummary: e.target.checked } })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show summary row</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={tableConfig.sortable || false}
              onChange={(e) => handleUpdateConfig({ table: { ...tableConfig, sortable: e.target.checked } })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Enable sorting</span>
          </label>
        </div>
      </div>
    );
  };

  const renderMetricContent = () => {
    const metricConfig = (section.config?.metric || {}) as MetricConfig;
    const metricContent = section.content || {};
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metric Label</label>
          <input
            type="text"
            value={metricContent.label || section.title || ''}
            onChange={(e) => handleUpdateContent({ ...metricContent, label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Metric name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Field</label>
          <select
            value={metricConfig.field || ''}
            onChange={(e) => handleUpdateConfig({ metric: { ...metricConfig, field: e.target.value } })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select field...</option>
            {getAvailableFields().filter(f => f.type === 'number').map((field) => (
              <option key={field.name} value={field.name}>{field.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation</label>
            <select
              value={metricConfig.aggregation || 'sum'}
              onChange={(e) => handleUpdateConfig({ metric: { ...metricConfig, aggregation: e.target.value } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {aggregationTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={metricConfig.format || 'number'}
              onChange={(e) => handleUpdateConfig({ metric: { ...metricConfig, format: e.target.value } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {formatTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={metricConfig.showTrend || false}
              onChange={(e) => handleUpdateConfig({ metric: { ...metricConfig, showTrend: e.target.checked } })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show trend indicator</span>
          </label>
        </div>

        {/* Manual Value Override */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Manual Override</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Static Value (overrides data)</label>
            <input
              type="number"
              value={metricContent.value || ''}
              onChange={(e) => handleUpdateContent({ ...metricContent, value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Leave empty to use data"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderImageContent = () => {
    const imageContent = section.content || {};
    
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <input
            type="url"
            value={imageContent.src || ''}
            onChange={(e) => handleUpdateContent({ ...imageContent, src: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
          <input
            type="text"
            value={imageContent.alt || ''}
            onChange={(e) => handleUpdateContent({ ...imageContent, alt: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Image description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
          <input
            type="text"
            value={imageContent.caption || ''}
            onChange={(e) => handleUpdateContent({ ...imageContent, caption: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Image caption"
          />
        </div>

        {/* Image Upload */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Drag and drop an image here, or click to select</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                // Handle file upload here
                console.log('File selected:', e.target.files?.[0]);
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDividerContent = () => (
    <div className="text-center text-gray-500 py-8">
      <div className="border-t border-gray-300 mb-4" />
      <p className="text-sm">Dividers don't have configuration options.</p>
      <p className="text-xs text-gray-400">They create visual separation between sections.</p>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
        <select
          value={section.dataSource || ''}
          onChange={(e) => onUpdateSection({ dataSource: e.target.value || undefined })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">No data source</option>
          {dataSources.map((source) => (
            <option key={source.name} value={source.name}>
              {source.description}
            </option>
          ))}
        </select>
      </div>

      {section.dataSource && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Available Fields</h5>
          <div className="space-y-1">
            {getSelectedDataSource()?.fields.map((field) => (
              <div key={field.name} className="flex items-center text-xs">
                <span className="font-medium text-gray-700">{field.label}</span>
                <span className="ml-2 text-gray-500">({field.type})</span>
                {field.description && (
                  <span className="ml-2 text-gray-400">- {field.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {section.dataSource && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Filters</label>
          <textarea
            value={JSON.stringify(section.filters || [], null, 2)}
            onChange={(e) => {
              try {
                const filters = JSON.parse(e.target.value);
                onUpdateSection({ filters });
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            rows={4}
            placeholder="[]"
          />
          <p className="text-xs text-gray-500 mt-1">JSON array of additional filters for this section</p>
        </div>
      )}
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
          <input
            type="text"
            value={section.style?.width || ''}
            onChange={(e) => handleUpdateStyle({ width: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="auto, 100%, 500px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
          <input
            type="text"
            value={section.style?.height || ''}
            onChange={(e) => handleUpdateStyle({ height: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="auto, 200px"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
        <input
          type="text"
          value={section.style?.margin || ''}
          onChange={(e) => handleUpdateStyle({ margin: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="10px 0, 20px 10px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
        <input
          type="text"
          value={section.style?.padding || ''}
          onChange={(e) => handleUpdateStyle({ padding: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="15px, 20px 10px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={section.style?.backgroundColor || '#ffffff'}
            onChange={(e) => handleUpdateStyle({ backgroundColor: e.target.value })}
            className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={section.style?.backgroundColor || ''}
            onChange={(e) => handleUpdateStyle({ backgroundColor: e.target.value })}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="transparent, #ffffff"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Border</label>
        <input
          type="text"
          value={section.style?.border || ''}
          onChange={(e) => handleUpdateStyle({ border: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="1px solid #ccc"
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Default', style: { margin: '10px 0', padding: '15px' } },
            { name: 'Compact', style: { margin: '5px 0', padding: '10px' } },
            { name: 'Spacious', style: { margin: '20px 0', padding: '25px' } },
            { name: 'Bordered', style: { margin: '10px 0', padding: '15px', border: '1px solid #e5e7eb' } }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleUpdateStyle(preset.style)}
              className="p-2 text-xs text-center border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const getAvailableFields = () => {
    const selectedSource = getSelectedDataSource();
    return selectedSource?.fields || [];
  };

  const getSelectedDataSource = () => {
    return dataSources.find(source => source.name === section.dataSource);
  };

  return (
    <div className={`section-config-panel bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-500 mr-3" />
          <div className="flex-1">
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => onUpdateSection({ title: e.target.value })}
              className="text-lg font-medium text-gray-900 border-none outline-none bg-transparent placeholder-gray-400 w-full"
              placeholder="Section Title"
            />
            <div className="text-sm text-gray-500 capitalize">
              {section.type.replace('_', ' ')} Section
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-0">
          {[
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'data', label: 'Data', icon: Box },
            { id: 'style', label: 'Style', icon: SwatchIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'style' && renderStyleTab()}
      </div>
    </div>
  );
};

export default SectionConfigPanel;