import React, { useState, useCallback } from 'react';
import { 
  Settings,
  Eye
} from '@/components/icons';
import { ReportLayout } from '../../types/report.types';

interface LayoutConfigPanelProps {
  layout: ReportLayout;
  onUpdateLayout: (layout: ReportLayout) => void;
  className?: string;
}

const paperFormats = [
  { value: 'A4', label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  { value: 'letter', label: 'Letter (8.5 × 11 in)', width: 216, height: 279 },
  { value: 'legal', label: 'Legal (8.5 × 14 in)', width: 216, height: 356 }
];

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Calibri',
  'Verdana',
  'Tahoma'
];

const predefinedThemes = [
  {
    name: 'Professional Blue',
    primaryColor: '#4F46E5',
    secondaryColor: '#6B7280',
    fontFamily: 'Arial',
    fontSize: 12
  },
  {
    name: 'Corporate Gray',
    primaryColor: '#374151',
    secondaryColor: '#9CA3AF',
    fontFamily: 'Calibri',
    fontSize: 11
  },
  {
    name: 'Modern Green',
    primaryColor: '#059669',
    secondaryColor: '#6B7280',
    fontFamily: 'Helvetica',
    fontSize: 12
  },
  {
    name: 'Athletic Red',
    primaryColor: '#DC2626',
    secondaryColor: '#6B7280',
    fontFamily: 'Arial',
    fontSize: 12
  },
  {
    name: 'Classic Black',
    primaryColor: '#000000',
    secondaryColor: '#4B5563',
    fontFamily: 'Times New Roman',
    fontSize: 12
  }
];

export const LayoutConfigPanel: React.FC<LayoutConfigPanelProps> = ({
  layout,
  onUpdateLayout,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'margins' | 'theme' | 'header'>('page');

  const handleUpdateLayout = useCallback((updates: Partial<ReportLayout>) => {
    onUpdateLayout({
      ...layout,
      ...updates
    });
  }, [layout, onUpdateLayout]);

  const handleUpdateMargins = useCallback((field: keyof ReportLayout['margins'], value: number) => {
    handleUpdateLayout({
      margins: {
        ...layout.margins,
        [field]: value
      }
    });
  }, [layout.margins, handleUpdateLayout]);

  const handleUpdateTheme = useCallback((updates: Partial<NonNullable<ReportLayout['theme']>>) => {
    handleUpdateLayout({
      theme: {
        ...layout.theme,
        ...updates
      }
    });
  }, [layout.theme, handleUpdateLayout]);

  const handleUpdateHeader = useCallback((updates: Partial<NonNullable<ReportLayout['header']>>) => {
    handleUpdateLayout({
      header: {
        ...layout.header,
        ...updates
      }
    });
  }, [layout.header, handleUpdateLayout]);

  const handleUpdateFooter = useCallback((updates: Partial<NonNullable<ReportLayout['footer']>>) => {
    handleUpdateLayout({
      footer: {
        ...layout.footer,
        ...updates
      }
    });
  }, [layout.footer, handleUpdateLayout]);

  const applyPredefinedTheme = useCallback((theme: typeof predefinedThemes[0]) => {
    handleUpdateTheme(theme);
  }, [handleUpdateTheme]);

  return (
    <div className={`layout-config-panel ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-0">
          {[
            { id: 'page', label: 'Page', icon: Settings },
            { id: 'margins', label: 'Margins', icon: Settings },
            { id: 'theme', label: 'Theme', icon: Settings },
            { id: 'header', label: 'Headers', icon: Settings }
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

      <div className="p-4 space-y-6">
        {/* Page Settings */}
        {activeTab === 'page' && (
          <div className="space-y-6">
            {/* Orientation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Orientation</label>
              <div className="grid grid-cols-2 gap-3">
                {['portrait', 'landscape'].map((orientation) => (
                  <button
                    key={orientation}
                    onClick={() => handleUpdateLayout({ orientation: orientation as any })}
                    className={`p-3 text-center border rounded-lg text-sm font-medium ${
                      layout.orientation === orientation
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mx-auto mb-2 ${
                      orientation === 'portrait' ? 'w-6 h-8' : 'w-8 h-6'
                    } border-2 border-current rounded`} />
                    {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Paper Format</label>
              <div className="space-y-2">
                {paperFormats.map((format) => (
                  <label key={format.value} className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={layout.format === format.value}
                      onChange={() => handleUpdateLayout({ format: format.value as any })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">{format.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Page Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
              <div className="flex justify-center">
                <div 
                  className="border-2 border-gray-300 bg-white shadow-sm"
                  style={{
                    width: layout.orientation === 'portrait' ? '60px' : '80px',
                    height: layout.orientation === 'portrait' ? '80px' : '60px'
                  }}
                >
                  <div className="w-full h-full border border-gray-200 bg-gray-50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Margins Settings */}
        {activeTab === 'margins' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Page Margins (mm)</h3>
              
              {/* Visual Margin Editor */}
              <div className="relative mx-auto" style={{ width: '200px', height: '250px' }}>
                {/* Page outline */}
                <div className="absolute inset-0 border-2 border-gray-400 bg-white">
                  {/* Content area */}
                  <div 
                    className="absolute bg-blue-50 border border-blue-300"
                    style={{
                      top: `${(layout.margins.top / 297) * 100}%`,
                      right: `${(layout.margins.right / 210) * 100}%`,
                      bottom: `${(layout.margins.bottom / 297) * 100}%`,
                      left: `${(layout.margins.left / 210) * 100}%`
                    }}
                  />
                </div>

                {/* Top margin input */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <input
                    type="number"
                    value={layout.margins.top}
                    onChange={(e) => handleUpdateMargins('top', parseInt(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                    min="0"
                    max="50"
                  />
                </div>

                {/* Right margin input */}
                <div className="absolute top-1/2 -right-10 transform -translate-y-1/2">
                  <input
                    type="number"
                    value={layout.margins.right}
                    onChange={(e) => handleUpdateMargins('right', parseInt(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                    min="0"
                    max="50"
                  />
                </div>

                {/* Bottom margin input */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <input
                    type="number"
                    value={layout.margins.bottom}
                    onChange={(e) => handleUpdateMargins('bottom', parseInt(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                    min="0"
                    max="50"
                  />
                </div>

                {/* Left margin input */}
                <div className="absolute top-1/2 -left-10 transform -translate-y-1/2">
                  <input
                    type="number"
                    value={layout.margins.left}
                    onChange={(e) => handleUpdateMargins('left', parseInt(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {/* Preset Margins */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preset Margins</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Narrow', margins: { top: 10, right: 10, bottom: 10, left: 10 } },
                  { name: 'Normal', margins: { top: 20, right: 20, bottom: 20, left: 20 } },
                  { name: 'Wide', margins: { top: 30, right: 30, bottom: 30, left: 30 } },
                  { name: 'Custom', margins: layout.margins }
                ].map((preset) => {
                  const isSelected = JSON.stringify(preset.margins) === JSON.stringify(layout.margins);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleUpdateLayout({ margins: preset.margins })}
                      className={`p-2 text-xs text-center border rounded ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* Predefined Themes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Predefined Themes</label>
              <div className="space-y-2">
                {predefinedThemes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => applyPredefinedTheme(theme)}
                    className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="flex space-x-2 mr-3">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: theme.secondaryColor }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                      <div className="text-xs text-gray-500">{theme.fontFamily}, {theme.fontSize}px</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Theme */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Custom Theme</h4>
              
              {/* Primary Color */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={layout.theme?.primaryColor || '#4F46E5'}
                    onChange={(e) => handleUpdateTheme({ primaryColor: e.target.value })}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={layout.theme?.primaryColor || '#4F46E5'}
                    onChange={(e) => handleUpdateTheme({ primaryColor: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="#4F46E5"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={layout.theme?.secondaryColor || '#6B7280'}
                    onChange={(e) => handleUpdateTheme({ secondaryColor: e.target.value })}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={layout.theme?.secondaryColor || '#6B7280'}
                    onChange={(e) => handleUpdateTheme({ secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="#6B7280"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Font Family</label>
                <select
                  value={layout.theme?.fontFamily || 'Arial'}
                  onChange={(e) => handleUpdateTheme({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {fontFamilies.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Font Size (px)</label>
                <input
                  type="number"
                  value={layout.theme?.fontSize || 12}
                  onChange={(e) => handleUpdateTheme({ fontSize: parseInt(e.target.value) || 12 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="8"
                  max="24"
                />
              </div>
            </div>

            {/* Theme Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Preview</h4>
              <div 
                className="p-4 rounded border"
                style={{ 
                  fontFamily: layout.theme?.fontFamily || 'Arial',
                  fontSize: `${layout.theme?.fontSize || 12}px`
                }}
              >
                <h5 
                  className="font-bold mb-2"
                  style={{ color: layout.theme?.primaryColor || '#4F46E5' }}
                >
                  Report Title
                </h5>
                <p 
                  className="text-sm mb-2"
                  style={{ color: layout.theme?.secondaryColor || '#6B7280' }}
                >
                  This is a sample paragraph showing how your theme will look in the report.
                </p>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: layout.theme?.primaryColor || '#4F46E5' }}
                >
                  85%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header & Footer Settings */}
        {activeTab === 'header' && (
          <div className="space-y-6">
            {/* Header Settings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Header</label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={layout.header?.enabled || false}
                    onChange={(e) => handleUpdateHeader({ enabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable header</span>
                </label>
              </div>

              {layout.header?.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Header Content</label>
                    <textarea
                      value={layout.header.content || ''}
                      onChange={(e) => handleUpdateHeader({ content: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="{{reportName}} - {{currentDate}}"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={layout.header.height || 60}
                      onChange={(e) => handleUpdateHeader({ height: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="20"
                      max="200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Settings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Footer</label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={layout.footer?.enabled || false}
                    onChange={(e) => handleUpdateFooter({ enabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable footer</span>
                </label>
              </div>

              {layout.footer?.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Footer Content</label>
                    <textarea
                      value={layout.footer.content || ''}
                      onChange={(e) => handleUpdateFooter({ content: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="Page {{pageNumber}} of {{totalPages}} - Generated on {{currentDate}}"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={layout.footer.height || 40}
                      onChange={(e) => handleUpdateFooter({ height: parseInt(e.target.value) || 40 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="20"
                      max="100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Variables Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Available Variables</h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div><code>{'{{reportName}}'}</code> - Report title</div>
                <div><code>{'{{currentDate}}'}</code> - Current date</div>
                <div><code>{'{{pageNumber}}'}</code> - Current page number</div>
                <div><code>{'{{totalPages}}'}</code> - Total page count</div>
                <div><code>{'{{author}}'}</code> - Report author</div>
                <div><code>{'{{organizationName}}'}</code> - Organization name</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutConfigPanel;