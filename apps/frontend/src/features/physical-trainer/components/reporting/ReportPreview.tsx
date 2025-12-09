import React, { useState, useRef, useCallback } from 'react';
import { Printer, ArrowDownTrayIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReportTemplate, ReportSection, ReportFilters } from '../../types/report.types';

interface ReportPreviewProps {
  template: ReportTemplate;
  filters?: ReportFilters;
  data?: Map<string, any>;
  scale?: number;
  className?: string;
  onExport?: (format: 'pdf' | 'excel' | 'csv' | 'html') => void;
  onPrint?: () => void;
  showControls?: boolean;
  interactive?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  template,
  filters = {},
  data = new Map(),
  scale = 1,
  className = '',
  onExport,
  onPrint,
  showControls = true,
  interactive = true
}) => {
  const [currentScale, setCurrentScale] = useState(scale);
  const [showDataSources, setShowDataSources] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setCurrentScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCurrentScale(prev => Math.max(prev - 0.1, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setCurrentScale(1);
  }, []);

  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint();
    } else {
      // Default print behavior
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintHTML());
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [onPrint, template]);

  const generatePrintHTML = useCallback(() => {
    const theme = template.layout.theme || {
      primaryColor: '#4F46E5',
      secondaryColor: '#6B7280',
      fontFamily: 'Arial',
      fontSize: 12
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${template.name}</title>
          <style>
            @media print {
              @page {
                size: ${template.layout.format};
                orientation: ${template.layout.orientation};
                margin: ${template.layout.margins.top}mm ${template.layout.margins.right}mm ${template.layout.margins.bottom}mm ${template.layout.margins.left}mm;
              }
            }
            body {
              font-family: ${theme.fontFamily}, sans-serif;
              font-size: ${theme.fontSize}px;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .report-header {
              border-bottom: 2px solid ${theme.primaryColor};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .report-title {
              color: ${theme.primaryColor};
              font-size: 28px;
              font-weight: bold;
              margin: 0 0 10px 0;
            }
            .report-description {
              color: ${theme.secondaryColor};
              margin: 0;
            }
            .section {
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .section-title {
              color: ${theme.primaryColor};
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .metric-value {
              font-size: 36px;
              font-weight: bold;
              color: ${theme.primaryColor};
              text-align: center;
            }
            .metric-label {
              color: ${theme.secondaryColor};
              text-align: center;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
            }
            th {
              background: ${theme.primaryColor};
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .chart-placeholder {
              background: #f3f4f6;
              border: 2px dashed #d1d5db;
              height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${theme.secondaryColor};
            }
          </style>
        </head>
        <body>
          ${generateReportHTML()}
        </body>
      </html>
    `;
  }, [template]);

  const generateReportHTML = useCallback(() => {
    let html = `
      <div class="report-header">
        <h1 class="report-title">${template.name}</h1>
        ${template.description ? `<p class="report-description">${template.description}</p>` : ''}
      </div>
    `;

    if (filters.dateRange) {
      html += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Report Period:</strong> ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}
        </div>
      `;
    }

    const sortedSections = template.sections.sort((a, b) => a.order - b.order);
    
    for (const section of sortedSections) {
      html += generateSectionHTML(section);
    }

    return html;
  }, [template, filters]);

  const generateSectionHTML = useCallback((section: ReportSection) => {
    let sectionHTML = '<div class="section">';
    
    if (section.title && section.type !== 'divider') {
      sectionHTML += `<h2 class="section-title">${section.title}</h2>`;
    }

    switch (section.type) {
      case 'text':
        sectionHTML += `<p>${section.content || ''}</p>`;
        break;
      case 'metric':
        if (section.content) {
          sectionHTML += `
            <div class="metric-value">${section.content.value || 0}</div>
            <div class="metric-label">${section.content.label || ''}</div>
          `;
        }
        break;
      case 'table':
        if (section.content && section.content.headers && section.content.rows) {
          sectionHTML += generateTableHTML(section.content);
        }
        break;
      case 'chart':
        sectionHTML += '<div class="chart-placeholder">Chart would be rendered here</div>';
        break;
      case 'divider':
        sectionHTML += '<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">';
        break;
      default:
        sectionHTML += `<p>${section.content || ''}</p>`;
    }

    sectionHTML += '</div>';
    return sectionHTML;
  }, []);

  const generateTableHTML = useCallback((tableContent: any) => {
    const headers = tableContent.headers || [];
    const rows = tableContent.rows || [];

    let html = '<table>';
    
    // Headers
    html += '<thead><tr>';
    for (const header of headers) {
      html += `<th>${header}</th>`;
    }
    html += '</tr></thead>';
    
    // Rows
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const header of headers) {
        html += `<td>${row[header] || ''}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
    return html;
  }, []);

  const getDataSourceStatus = useCallback((section: ReportSection) => {
    if (!section.dataSource) return 'none';
    if (data.has(section.id)) {
      const sectionData = data.get(section.id);
      return sectionData?.error ? 'error' : 'success';
    }
    return 'pending';
  }, [data]);

  const renderSectionPreview = useCallback((section: ReportSection) => {
    const status = getDataSourceStatus(section);
    const sectionData = data.get(section.id);

    switch (section.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: section.content?.replace(/\n/g, '<br>') || 'Enter your text content here...' 
            }} />
          </div>
        );

      case 'chart':
        return (
          <div className="h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">
                {status === 'error' ? 'Error loading chart data' : 'Chart Preview'}
              </p>
              {sectionData && !sectionData.error && (
                <p className="text-xs text-gray-400 mt-2">
                  {Array.isArray(sectionData) ? `${sectionData.length} data points` : 'Data loaded'}
                </p>
              )}
            </div>
            <DataSourceStatusIndicator status={status} />
          </div>
        );

      case 'table':
        const tableData = sectionData || section.content;
        const headers = tableData?.headers || ['Column 1', 'Column 2', 'Column 3'];
        const rows = tableData?.rows?.slice(0, 5) || [
          { 'Column 1': 'Sample data', 'Column 2': 'Sample data', 'Column 3': 'Sample data' }
        ];

        return (
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header: string, index: number) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {headers.map((header: string, colIndex: number) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {status === 'error' && (
              <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">Error loading table data</p>
                </div>
              </div>
            )}
            <DataSourceStatusIndicator status={status} />
          </div>
        );

      case 'metric':
        const metricData = sectionData || section.content;
        const value = metricData?.value || 0;
        const label = metricData?.label || section.title || 'Metric';

        return (
          <div className="text-center relative">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="text-lg text-gray-600">{label}</div>
            {metricData?.trend && (
              <div className={`text-sm mt-1 ${
                metricData.trend.direction === 'up' ? 'text-green-600' : 
                metricData.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metricData.trend.direction === 'up' ? '↗' : metricData.trend.direction === 'down' ? '↘' : '→'}
                {metricData.trend.percentage.toFixed(1)}%
              </div>
            )}
            <DataSourceStatusIndicator status={status} />
          </div>
        );

      case 'image':
        return (
          <div className="relative">
            {section.content?.src ? (
              <div className="text-center">
                <img
                  src={section.content.src}
                  alt={section.content.alt || ''}
                  className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                />
                {section.content.caption && (
                  <p className="text-sm text-gray-600 mt-2">{section.content.caption}</p>
                )}
              </div>
            ) : (
              <div className="h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-gray-500">Image placeholder</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'divider':
        return <hr className="border-gray-300 my-6" />;

      default:
        return (
          <div className="text-gray-500 italic">
            Unknown section type: {section.type}
          </div>
        );
    }
  }, [data, getDataSourceStatus]);

  return (
    <div className={`report-preview ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="preview-controls bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(currentScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDataSources(!showDataSources)}
              className={`px-3 py-1 text-xs rounded-md focus:outline-none ${
                showDataSources 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Data Sources
            </button>
            
            {onExport && (
              <div className="flex space-x-1">
                {['pdf', 'excel', 'csv', 'html'].map((format) => (
                  <button
                    key={format}
                    onClick={() => onExport(format as any)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 focus:outline-none"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </button>
          </div>
        </div>
      )}

      {/* Data Sources Panel */}
      {showDataSources && (
        <div className="data-sources-panel bg-gray-50 border-b border-gray-200 px-4 py-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Data Sources Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {template.sections
              .filter(section => section.dataSource)
              .map((section) => {
                const status = getDataSourceStatus(section);
                return (
                  <div
                    key={section.id}
                    className="flex items-center text-xs bg-white px-2 py-1 rounded border"
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      status === 'success' ? 'bg-green-500' :
                      status === 'error' ? 'bg-red-500' :
                      status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`} />
                    <span className="flex-1 truncate">{section.title || 'Untitled Section'}</span>
                    <span className="text-gray-500 ml-1">({section.dataSource})</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div 
        className="preview-content overflow-auto bg-gray-100 p-4"
        style={{ transform: `scale(${currentScale})`, transformOrigin: 'top left' }}
      >
        <div
          ref={previewRef}
          className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg"
          style={{
            minHeight: '29.7cm', // A4 height
            aspectRatio: template.layout.orientation === 'landscape' ? '11.7/8.3' : '8.3/11.7'
          }}
        >
          {/* Report Header */}
          <div className="p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
            {template.description && (
              <p className="text-gray-600">{template.description}</p>
            )}
            
            {/* Filter Info */}
            {filters.dateRange && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Report Period:</strong> {' '}
                  {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
                </p>
                {filters.teams && filters.teams.length > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Teams:</strong> {filters.teams.join(', ')}
                  </p>
                )}
                {filters.players && filters.players.length > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Players:</strong> {filters.players.length} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Report Sections */}
          <div className="p-8 space-y-8">
            {template.sections.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sections in this report</p>
                <p className="text-gray-400 text-sm">Add sections using the report builder</p>
              </div>
            ) : (
              template.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div
                    key={section.id}
                    className="section"
                    style={section.style}
                  >
                    {section.title && section.type !== 'divider' && (
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                    )}
                    {renderSectionPreview(section)}
                  </div>
                ))
            )}
          </div>

          {/* Report Footer */}
          <div className="p-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Generated on {new Date().toLocaleString()}</p>
            {template.metadata.author && (
              <p className="mt-1">By {template.metadata.author}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Source Status Indicator Component
interface DataSourceStatusIndicatorProps {
  status: 'success' | 'error' | 'pending' | 'none';
}

const DataSourceStatusIndicator: React.FC<DataSourceStatusIndicatorProps> = ({ status }) => {
  if (status === 'none') return null;

  return (
    <div className="absolute top-2 right-2">
      {status === 'success' && (
        <CheckCircle className="w-5 h-5 text-green-500" title="Data loaded successfully" />
      )}
      {status === 'error' && (
        <AlertTriangle className="w-5 h-5 text-red-500" title="Error loading data" />
      )}
      {status === 'pending' && (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" title="Loading data..." />
      )}
    </div>
  );
};

export default ReportPreview;