import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplate, GeneratedReport, ReportSection, ReportFilters } from '../entities/ReportTemplate';
import { ReportDataAggregatorService } from './ReportDataAggregatorService';
import { ExportService } from './ExportService';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface GenerateReportOptions {
  templateId: string;
  filters: ReportFilters;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  userId: string;
  organizationId?: string;
  name?: string;
  description?: string;
  scheduledReportId?: string;
}

export interface ReportGenerationProgress {
  id: string;
  status: 'initializing' | 'fetching_data' | 'processing_sections' | 'generating_export' | 'saving' | 'completed' | 'failed';
  progress: number;
  message: string;
  currentSection?: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

@Injectable()
export class ReportGeneratorService {
  private generationProgress = new Map<string, ReportGenerationProgress>();

  constructor(
    @InjectRepository(ReportTemplate)
    private templateRepository: Repository<ReportTemplate>,
    @InjectRepository(GeneratedReport)
    private reportRepository: Repository<GeneratedReport>,
    private dataAggregator: ReportDataAggregatorService,
    private exportService: ExportService
  ) {}

  async generateReport(options: GenerateReportOptions): Promise<string> {
    const reportId = this.generateReportId();
    
    try {
      // Initialize progress tracking
      this.initializeProgress(reportId, options);

      // Create report record
      const report = await this.createReportRecord(reportId, options);

      // Generate report asynchronously
      this.generateReportAsync(reportId, report, options);

      return reportId;
    } catch (error) {
      this.updateProgress(reportId, 'failed', 0, `Failed to initialize report generation: ${error.message}`);
      throw error;
    }
  }

  private async generateReportAsync(reportId: string, report: GeneratedReport, options: GenerateReportOptions): Promise<void> {
    try {
      // Load template
      this.updateProgress(reportId, 'initializing', 10, 'Loading report template...');
      const template = await this.templateRepository.findOne({ 
        where: { id: options.templateId },
        relations: ['generatedReports']
      });

      if (!template) {
        throw new Error('Report template not found');
      }

      // Fetch data for all sections
      this.updateProgress(reportId, 'fetching_data', 20, 'Fetching data...');
      const sectionData = await this.fetchSectionData(template.sections, options.filters);

      // Process sections
      this.updateProgress(reportId, 'processing_sections', 40, 'Processing report sections...');
      const processedSections = await this.processSections(template.sections, sectionData, options.filters);

      // Generate export
      this.updateProgress(reportId, 'generating_export', 70, `Generating ${options.format.toUpperCase()} export...`);
      const exportResult = await this.exportService.generateExport({
        template,
        sections: processedSections,
        data: sectionData,
        format: options.format,
        filters: options.filters
      });

      // Save report
      this.updateProgress(reportId, 'saving', 90, 'Saving report...');
      await this.saveReportFile(report, exportResult);

      // Update report record
      report.status = 'completed';
      report.filePath = exportResult.filePath;
      report.downloadUrl = exportResult.downloadUrl;
      report.generatedData = { sections: processedSections, metadata: exportResult.metadata };
      report.metadata = {
        fileSize: exportResult.metadata.fileSize,
        pageCount: exportResult.metadata.pageCount,
        generationTime: Date.now() - this.generationProgress.get(reportId)?.startTime.getTime(),
        dataPoints: this.countDataPoints(sectionData)
      };

      await this.reportRepository.save(report);

      this.updateProgress(reportId, 'completed', 100, 'Report generation completed successfully');

    } catch (error) {
      // Update report status
      const report = await this.reportRepository.findOne({ where: { id: reportId } });
      if (report) {
        report.status = 'failed';
        report.errorMessage = error.message;
        await this.reportRepository.save(report);
      }

      this.updateProgress(reportId, 'failed', 0, `Report generation failed: ${error.message}`);
    }
  }

  private async fetchSectionData(sections: ReportSection[], filters: ReportFilters): Promise<Map<string, any>> {
    const sectionData = new Map<string, any>();

    for (const section of sections) {
      if (section.dataSource) {
        try {
          const data = await this.dataAggregator.fetchData(section.dataSource, {
            ...filters,
            ...section.filters
          });
          sectionData.set(section.id, data);
        } catch (error) {
          console.error(`Failed to fetch data for section ${section.id}:`, error);
          sectionData.set(section.id, { error: error.message });
        }
      }
    }

    return sectionData;
  }

  private async processSections(sections: ReportSection[], sectionData: Map<string, any>, filters: ReportFilters): Promise<ReportSection[]> {
    return sections.map(section => {
      const data = sectionData.get(section.id);
      
      if (!data || data.error) {
        return {
          ...section,
          content: data?.error ? `Error: ${data.error}` : 'No data available'
        };
      }

      // Process section based on type
      switch (section.type) {
        case 'chart':
          return this.processChartSection(section, data, filters);
        case 'table':
          return this.processTableSection(section, data, filters);
        case 'metric':
          return this.processMetricSection(section, data, filters);
        case 'text':
          return this.processTextSection(section, data, filters);
        default:
          return section;
      }
    });
  }

  private processChartSection(section: ReportSection, data: any, filters: ReportFilters): ReportSection {
    // Process chart data based on chart type
    const chartConfig = section.config?.chart || {};
    
    return {
      ...section,
      content: {
        type: chartConfig.type || 'line',
        data: this.formatChartData(data, chartConfig),
        options: {
          ...chartConfig.options,
          title: {
            display: true,
            text: section.title || 'Chart'
          }
        }
      }
    };
  }

  private processTableSection(section: ReportSection, data: any, filters: ReportFilters): ReportSection {
    const tableConfig = section.config?.table || {};
    
    return {
      ...section,
      content: {
        headers: tableConfig.columns || Object.keys(data[0] || {}),
        rows: data.slice(0, tableConfig.maxRows || 100),
        summary: tableConfig.showSummary ? this.generateTableSummary(data) : null
      }
    };
  }

  private processMetricSection(section: ReportSection, data: any, filters: ReportFilters): ReportSection {
    const metricConfig = section.config?.metric || {};
    
    return {
      ...section,
      content: {
        value: this.calculateMetricValue(data, metricConfig),
        label: section.title || 'Metric',
        format: metricConfig.format || 'number',
        trend: metricConfig.showTrend ? this.calculateTrend(data, metricConfig) : null
      }
    };
  }

  private processTextSection(section: ReportSection, data: any, filters: ReportFilters): ReportSection {
    // Process text with variable substitution
    let content = section.content || '';
    
    // Replace variables in text
    const variables = this.extractVariables(content);
    for (const variable of variables) {
      const value = this.getVariableValue(variable, data, filters);
      content = content.replace(`{{${variable}}}`, value);
    }
    
    return {
      ...section,
      content
    };
  }

  private formatChartData(data: any, config: any): any {
    // Format data based on chart type
    switch (config.type) {
      case 'line':
      case 'bar':
        return {
          labels: data.map((item: any) => item[config.xField || 'date']),
          datasets: [{
            label: config.datasetLabel || 'Data',
            data: data.map((item: any) => item[config.yField || 'value']),
            backgroundColor: config.backgroundColor || '#4F46E5',
            borderColor: config.borderColor || '#4F46E5'
          }]
        };
      case 'pie':
      case 'doughnut':
        return {
          labels: data.map((item: any) => item[config.labelField || 'label']),
          datasets: [{
            data: data.map((item: any) => item[config.valueField || 'value']),
            backgroundColor: config.colors || ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6']
          }]
        };
      default:
        return data;
    }
  }

  private generateTableSummary(data: any[]): any {
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const numericFields = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number'
    );
    
    return numericFields.reduce((summary, field) => {
      const values = data.map(item => item[field]).filter(val => typeof val === 'number');
      summary[field] = {
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
      return summary;
    }, {} as any);
  }

  private calculateMetricValue(data: any, config: any): number {
    switch (config.aggregation) {
      case 'sum':
        return Array.isArray(data) ? data.reduce((sum, item) => sum + (item[config.field] || 0), 0) : 0;
      case 'avg':
        return Array.isArray(data) && data.length > 0 
          ? data.reduce((sum, item) => sum + (item[config.field] || 0), 0) / data.length 
          : 0;
      case 'count':
        return Array.isArray(data) ? data.length : 0;
      case 'max':
        return Array.isArray(data) ? Math.max(...data.map(item => item[config.field] || 0)) : 0;
      case 'min':
        return Array.isArray(data) ? Math.min(...data.map(item => item[config.field] || 0)) : 0;
      default:
        return typeof data === 'number' ? data : 0;
    }
  }

  private calculateTrend(data: any, config: any): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (!Array.isArray(data) || data.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }
    
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const current = sortedData[sortedData.length - 1][config.field] || 0;
    const previous = sortedData[sortedData.length - 2][config.field] || 0;
    
    if (previous === 0) return { direction: 'stable', percentage: 0 };
    
    const percentage = ((current - previous) / previous) * 100;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';
    
    return { direction, percentage: Math.abs(percentage) };
  }

  private extractVariables(text: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      variables.push(match[1].trim());
    }
    
    return variables;
  }

  private getVariableValue(variable: string, data: any, filters: ReportFilters): string {
    // Handle common variables
    switch (variable) {
      case 'current_date':
        return new Date().toLocaleDateString();
      case 'date_range':
        return filters.dateRange 
          ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
          : 'All time';
      case 'team_count':
        return filters.teams?.length.toString() || 'All teams';
      case 'player_count':
        return filters.players?.length.toString() || 'All players';
      default:
        // Try to extract from data
        return data?.[variable]?.toString() || `[${variable}]`;
    }
  }

  private countDataPoints(sectionData: Map<string, any>): number {
    let total = 0;
    for (const [_, data] of sectionData) {
      if (Array.isArray(data)) {
        total += data.length;
      } else if (typeof data === 'object' && data !== null) {
        total += Object.keys(data).length;
      } else {
        total += 1;
      }
    }
    return total;
  }

  private async createReportRecord(reportId: string, options: GenerateReportOptions): Promise<GeneratedReport> {
    const report = new GeneratedReport();
    report.id = reportId;
    report.name = options.name || `Report ${new Date().toLocaleDateString()}`;
    report.description = options.description;
    report.templateId = options.templateId;
    report.appliedFilters = options.filters;
    report.format = options.format;
    report.status = 'pending';
    report.generatedBy = options.userId;
    report.organizationId = options.organizationId;
    report.scheduledReportId = options.scheduledReportId;
    report.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return await this.reportRepository.save(report);
  }

  private async saveReportFile(report: GeneratedReport, exportResult: any): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'storage', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const fileName = `${report.id}.${report.format}`;
    const filePath = path.join(reportsDir, fileName);
    
    await fs.writeFile(filePath, exportResult.buffer);
  }

  private initializeProgress(reportId: string, options: GenerateReportOptions): void {
    this.generationProgress.set(reportId, {
      id: reportId,
      status: 'initializing',
      progress: 0,
      message: 'Initializing report generation...',
      startTime: new Date()
    });
  }

  private updateProgress(reportId: string, status: ReportGenerationProgress['status'], progress: number, message: string, currentSection?: string): void {
    const existing = this.generationProgress.get(reportId);
    if (existing) {
      existing.status = status;
      existing.progress = progress;
      existing.message = message;
      existing.currentSection = currentSection;
      
      if (progress > 0 && progress < 100) {
        const elapsed = Date.now() - existing.startTime.getTime();
        const estimated = (elapsed / progress) * (100 - progress);
        existing.estimatedCompletion = new Date(Date.now() + estimated);
      }
    }
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Public methods for progress tracking
  getGenerationProgress(reportId: string): ReportGenerationProgress | null {
    return this.generationProgress.get(reportId) || null;
  }

  clearProgress(reportId: string): void {
    this.generationProgress.delete(reportId);
  }

  // Report management methods
  async getGeneratedReports(userId: string, organizationId?: string, limit = 50, offset = 0): Promise<{ reports: GeneratedReport[]; total: number }> {
    const query = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.template', 'template')
      .where('report.generatedBy = :userId', { userId })
      .orderBy('report.createdAt', 'DESC')
      .limit(limit)
      .offset(offset);

    if (organizationId) {
      query.andWhere('report.organizationId = :organizationId', { organizationId });
    }

    const [reports, total] = await query.getManyAndCount();
    return { reports, total };
  }

  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, generatedBy: userId }
    });

    if (!report) {
      throw new Error('Report not found or access denied');
    }

    // Delete file if exists
    if (report.filePath) {
      try {
        await fs.unlink(report.filePath);
      } catch (error) {
        console.warn(`Failed to delete report file: ${error.message}`);
      }
    }

    await this.reportRepository.remove(report);
  }

  async getReportDownloadUrl(reportId: string, userId: string): Promise<string> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, generatedBy: userId }
    });

    if (!report) {
      throw new Error('Report not found or access denied');
    }

    if (report.status !== 'completed') {
      throw new Error('Report is not ready for download');
    }

    return report.downloadUrl || `/api/reports/${reportId}/download`;
  }
}