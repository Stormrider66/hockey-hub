// Report Section Types
export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'metric' | 'divider';
  title?: string;
  content?: any;
  config?: any;
  style?: {
    width?: string;
    height?: string;
    margin?: string;
    padding?: string;
    backgroundColor?: string;
    border?: string;
  };
  dataSource?: string;
  filters?: any[];
  order: number;
}

// Report Layout Configuration
export interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  format: 'A4' | 'letter' | 'legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: {
    enabled: boolean;
    content: string;
    height: number;
  };
  footer?: {
    enabled: boolean;
    content: string;
    height: number;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
  };
}

// Report Filters
export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  teams?: string[];
  players?: string[];
  workoutTypes?: string[];
  categories?: string[];
  customFilters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
}

// Report Metadata
export interface ReportMetadata {
  author: string;
  description?: string;
  tags: string[];
  category: string;
  permissions: {
    view: string[];
    edit: string[];
    admin: string[];
  };
  isPublic: boolean;
  version: string;
  lastModified: Date;
}

// Report Template
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'team_performance' | 'player_progress' | 'workout_effectiveness' | 'medical_report' | 'attendance' | 'custom_kpi' | 'executive_summary' | 'custom';
  category: string;
  sections: ReportSection[];
  layout: ReportLayout;
  defaultFilters: ReportFilters;
  metadata: ReportMetadata;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdBy?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generated Report
export interface GeneratedReport {
  id: string;
  name: string;
  description?: string;
  template: ReportTemplate;
  templateId: string;
  appliedFilters: ReportFilters;
  generatedData: any;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filePath?: string;
  downloadUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'expired';
  errorMessage?: string;
  generatedBy: string;
  organizationId?: string;
  scheduledReportId?: string;
  metadata?: {
    fileSize?: number;
    pageCount?: number;
    generationTime?: number;
    dataPoints?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// Scheduled Report
export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  template: ReportTemplate;
  templateId: string;
  filters: ReportFilters;
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  cronExpression?: string;
  formats: string[];
  delivery: {
    method: 'email' | 'download' | 'both';
    recipients: string[];
    subject?: string;
    message?: string;
    attachmentName?: string;
  };
  isActive: boolean;
  createdBy: string;
  organizationId?: string;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  lastStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Data Source Configuration
export interface DataSourceConfig {
  name: string;
  description: string;
  fields: DataField[];
  filters: FilterConfig[];
  aggregations: string[];
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  label: string;
  description?: string;
}

export interface FilterConfig {
  field: string;
  type: 'date_range' | 'select' | 'multi_select' | 'text' | 'number_range';
  options?: string[];
  required?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  xField?: string;
  yField?: string;
  labelField?: string;
  valueField?: string;
  datasetLabel?: string;
  backgroundColor?: string;
  borderColor?: string;
  colors?: string[];
}

export interface TableConfig {
  columns?: string[];
  maxRows?: number;
  showSummary?: boolean;
  sortable?: boolean;
}

export interface MetricConfig {
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
  field: string;
  format: 'number' | 'currency' | 'percentage' | 'decimal';
  showTrend?: boolean;
}