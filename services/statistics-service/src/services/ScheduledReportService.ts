// @ts-nocheck - Scheduled report service with NestJS decorators
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledReport, ReportFilters } from '../entities/ReportTemplate';
import { ReportGeneratorService } from './ReportGeneratorService';
import { EmailService } from './EmailService';

export interface CreateScheduledReportDTO {
  name: string;
  description?: string;
  templateId: string;
  filters: ReportFilters;
  schedule: ScheduledReport['schedule'];
  cronExpression?: string;
  formats: string[];
  delivery: ScheduledReport['delivery'];
  organizationId?: string;
}

export interface UpdateScheduledReportDTO extends Partial<CreateScheduledReportDTO> {
  id: string;
  isActive?: boolean;
}

export interface ScheduledReportExecution {
  reportId: string;
  scheduledReportId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'delivering' | 'delivered';
  startTime: Date;
  endTime?: Date;
  error?: string;
  generatedFiles: {
    format: string;
    filePath: string;
    downloadUrl: string;
  }[];
}

@Injectable()
export class ScheduledReportService {
  private executionQueue = new Map<string, ScheduledReportExecution>();

  constructor(
    @InjectRepository(ScheduledReport)
    private scheduledReportRepository: Repository<ScheduledReport>,
    private reportGenerator: ReportGeneratorService,
    private emailService: EmailService
  ) {}

  async createScheduledReport(reportData: CreateScheduledReportDTO, userId: string): Promise<ScheduledReport> {
    const scheduledReport = new ScheduledReport();
    
    scheduledReport.name = reportData.name;
    scheduledReport.description = reportData.description;
    scheduledReport.templateId = reportData.templateId;
    scheduledReport.filters = reportData.filters;
    scheduledReport.schedule = reportData.schedule;
    scheduledReport.cronExpression = reportData.cronExpression || this.generateCronExpression(reportData.schedule);
    scheduledReport.formats = reportData.formats;
    scheduledReport.delivery = reportData.delivery;
    scheduledReport.createdBy = userId;
    scheduledReport.organizationId = reportData.organizationId;
    scheduledReport.nextRun = this.calculateNextRun(scheduledReport.cronExpression);
    scheduledReport.isActive = true;

    return await this.scheduledReportRepository.save(scheduledReport);
  }

  async updateScheduledReport(reportData: UpdateScheduledReportDTO, userId: string): Promise<ScheduledReport> {
    const scheduledReport = await this.scheduledReportRepository.findOne({
      where: { id: reportData.id, createdBy: userId }
    });

    if (!scheduledReport) {
      throw new Error('Scheduled report not found or access denied');
    }

    // Update fields
    if (reportData.name) scheduledReport.name = reportData.name;
    if (reportData.description !== undefined) scheduledReport.description = reportData.description;
    if (reportData.templateId) scheduledReport.templateId = reportData.templateId;
    if (reportData.filters) scheduledReport.filters = reportData.filters;
    if (reportData.schedule) {
      scheduledReport.schedule = reportData.schedule;
      scheduledReport.cronExpression = reportData.cronExpression || this.generateCronExpression(reportData.schedule);
      scheduledReport.nextRun = this.calculateNextRun(scheduledReport.cronExpression);
    }
    if (reportData.formats) scheduledReport.formats = reportData.formats;
    if (reportData.delivery) scheduledReport.delivery = reportData.delivery;
    if (reportData.isActive !== undefined) scheduledReport.isActive = reportData.isActive;

    return await this.scheduledReportRepository.save(scheduledReport);
  }

  async getScheduledReports(userId: string, organizationId?: string): Promise<ScheduledReport[]> {
    const query = this.scheduledReportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.template', 'template')
      .where('report.createdBy = :userId', { userId })
      .orderBy('report.createdAt', 'DESC');

    if (organizationId) {
      query.andWhere('report.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  async deleteScheduledReport(reportId: string, userId: string): Promise<void> {
    const scheduledReport = await this.scheduledReportRepository.findOne({
      where: { id: reportId, createdBy: userId }
    });

    if (!scheduledReport) {
      throw new Error('Scheduled report not found or access denied');
    }

    await this.scheduledReportRepository.remove(scheduledReport);
  }

  async executeScheduledReport(reportId: string): Promise<string> {
    const scheduledReport = await this.scheduledReportRepository.findOne({
      where: { id: reportId, isActive: true },
      relations: ['template']
    });

    if (!scheduledReport) {
      throw new Error('Scheduled report not found or inactive');
    }

    const executionId = this.generateExecutionId();
    const execution: ScheduledReportExecution = {
      reportId: executionId,
      scheduledReportId: reportId,
      status: 'pending',
      startTime: new Date(),
      generatedFiles: []
    };

    this.executionQueue.set(executionId, execution);

    try {
      // Execute report generation for each format
      execution.status = 'generating';
      
      for (const format of scheduledReport.formats) {
        const reportGenerationId = await this.reportGenerator.generateReport({
          templateId: scheduledReport.templateId,
          filters: scheduledReport.filters,
          format: format as any,
          userId: scheduledReport.createdBy,
          organizationId: scheduledReport.organizationId,
          name: `${scheduledReport.name} - ${new Date().toLocaleDateString()}`,
          scheduledReportId: reportId
        });

        // Wait for report generation to complete
        await this.waitForReportCompletion(reportGenerationId);
        
        const downloadUrl = await this.reportGenerator.getReportDownloadUrl(reportGenerationId, scheduledReport.createdBy);
        
        execution.generatedFiles.push({
          format,
          filePath: `reports/${reportGenerationId}.${format}`,
          downloadUrl
        });
      }

      execution.status = 'completed';

      // Handle delivery
      if (scheduledReport.delivery.method === 'email' || scheduledReport.delivery.method === 'both') {
        execution.status = 'delivering';
        await this.deliverReportByEmail(scheduledReport, execution);
        execution.status = 'delivered';
      }

      // Update scheduled report
      scheduledReport.lastRun = new Date();
      scheduledReport.runCount += 1;
      scheduledReport.lastStatus = 'success';
      scheduledReport.nextRun = this.calculateNextRun(scheduledReport.cronExpression);
      await this.scheduledReportRepository.save(scheduledReport);

      execution.endTime = new Date();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date();

      // Update scheduled report
      scheduledReport.lastRun = new Date();
      scheduledReport.lastStatus = `failed: ${error.message}`;
      await this.scheduledReportRepository.save(scheduledReport);

      throw error;
    }

    return executionId;
  }

  private async waitForReportCompletion(reportId: string, maxWaitTime = 300000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const progress = this.reportGenerator.getGenerationProgress(reportId);
      
      if (!progress) {
        throw new Error('Report generation progress not found');
      }

      if (progress.status === 'completed') {
        return;
      }

      if (progress.status === 'failed') {
        throw new Error(`Report generation failed: ${progress.message}`);
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Report generation timed out');
  }

  private async deliverReportByEmail(scheduledReport: ScheduledReport, execution: ScheduledReportExecution): Promise<void> {
    const subject = scheduledReport.delivery.subject || `${scheduledReport.name} - ${new Date().toLocaleDateString()}`;
    const message = scheduledReport.delivery.message || 'Please find your scheduled report attached.';
    
    const attachments = execution.generatedFiles.map(file => ({
      filename: scheduledReport.delivery.attachmentName 
        ? `${scheduledReport.delivery.attachmentName}.${file.format}`
        : `${scheduledReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${file.format}`,
      path: file.filePath
    }));

    for (const recipient of scheduledReport.delivery.recipients) {
      await this.emailService.sendEmail({
        to: recipient,
        subject,
        text: message,
        attachments
      });
    }
  }

  // Cron job to execute scheduled reports
  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledReports(): Promise<void> {
    const now = new Date();
    
    const dueReports = await this.scheduledReportRepository.find({
      where: {
        isActive: true,
        nextRun: require('typeorm').LessThanOrEqual(now)
      }
    });

    for (const report of dueReports) {
      try {
        await this.executeScheduledReport(report.id);
      } catch (error) {
        console.error(`Failed to execute scheduled report ${report.id}:`, error);
      }
    }
  }

  private generateCronExpression(schedule: ScheduledReport['schedule']): string {
    switch (schedule) {
      case 'daily':
        return '0 8 * * *'; // 8 AM daily
      case 'weekly':
        return '0 8 * * 1'; // 8 AM every Monday
      case 'monthly':
        return '0 8 1 * *'; // 8 AM first day of month
      case 'quarterly':
        return '0 8 1 1,4,7,10 *'; // 8 AM first day of quarter
      default:
        return '0 8 * * *'; // Default to daily
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron calculation - in production, use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Public methods for monitoring
  getExecutionStatus(executionId: string): ScheduledReportExecution | null {
    return this.executionQueue.get(executionId) || null;
  }

  clearExecution(executionId: string): void {
    this.executionQueue.delete(executionId);
  }

  async getExecutionHistory(scheduledReportId: string, limit = 50): Promise<any[]> {
    // In a real implementation, you would store execution history in the database
    // For now, return mock data
    return [
      {
        id: 'exec_1',
        startTime: new Date(),
        endTime: new Date(),
        status: 'completed',
        formats: ['pdf', 'excel'],
        deliveryMethod: 'email'
      }
    ];
  }
}