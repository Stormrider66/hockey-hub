import { Injectable } from '@nestjs/common';
import { EnhancedExportService } from './EnhancedExportService';
import { CSVExportService } from './CSVExportService';
import { EmailService } from './EmailService';
import * as cron from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ScheduledReport {
  id: string;
  name: string;
  reportType: 'workout-summary' | 'player-progress' | 'team-performance' | 'medical-compliance' | 'historical-trends' | 'custom';
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  customCron?: string; // For custom schedules
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filters: {
    teamId?: string;
    playerId?: string;
    dateRange?: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';
    customDateRange?: {
      start: Date;
      end: Date;
    };
    includeCharts?: boolean;
    includeMedicalData?: boolean;
    includePlayerBreakdown?: boolean;
  };
  recipients: Array<{
    email: string;
    name?: string;
    role?: string;
  }>;
  deliveryOptions: {
    subject?: string;
    message?: string;
    attachmentName?: string;
    compressLargeFiles?: boolean;
  };
  active: boolean;
  createdAt: Date;
  createdBy: string;
  lastRun?: Date;
  nextRun: Date;
  runCount: number;
  failureCount: number;
  lastError?: string;
}

@Injectable()
export class ScheduledReportingService {
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private readonly reportsDir = path.join(process.cwd(), 'storage', 'scheduled-reports');

  constructor(
    private enhancedExportService: EnhancedExportService,
    private csvExportService: CSVExportService,
    private emailService: EmailService
  ) {
    this.ensureReportsDirectory();
    this.loadScheduledReports();
  }

  async createScheduledReport(reportConfig: Omit<ScheduledReport, 'id' | 'createdAt' | 'nextRun' | 'runCount' | 'failureCount'>): Promise<ScheduledReport> {
    const report: ScheduledReport = {
      ...reportConfig,
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      nextRun: this.calculateNextRun(reportConfig.schedule, reportConfig.customCron),
      runCount: 0,
      failureCount: 0
    };

    this.scheduledReports.set(report.id, report);
    
    if (report.active) {
      this.scheduleReport(report);
    }

    await this.saveScheduledReports();
    return report;
  }

  async updateScheduledReport(reportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport | null> {
    const report = this.scheduledReports.get(reportId);
    if (!report) return null;

    const updatedReport = { ...report, ...updates };
    
    // Recalculate next run if schedule changed
    if (updates.schedule || updates.customCron) {
      updatedReport.nextRun = this.calculateNextRun(updatedReport.schedule, updatedReport.customCron);
    }

    this.scheduledReports.set(reportId, updatedReport);
    
    // Reschedule the cron job
    this.unscheduleReport(reportId);
    if (updatedReport.active) {
      this.scheduleReport(updatedReport);
    }

    await this.saveScheduledReports();
    return updatedReport;
  }

  async deleteScheduledReport(reportId: string): Promise<boolean> {
    const report = this.scheduledReports.get(reportId);
    if (!report) return false;

    this.unscheduleReport(reportId);
    this.scheduledReports.delete(reportId);
    await this.saveScheduledReports();
    return true;
  }

  async getScheduledReport(reportId: string): Promise<ScheduledReport | null> {
    return this.scheduledReports.get(reportId) || null;
  }

  async getAllScheduledReports(): Promise<ScheduledReport[]> {
    return Array.from(this.scheduledReports.values());
  }

  async getScheduledReportsByUser(userId: string): Promise<ScheduledReport[]> {
    return Array.from(this.scheduledReports.values()).filter(report => report.createdBy === userId);
  }

  async toggleReportStatus(reportId: string): Promise<ScheduledReport | null> {
    const report = this.scheduledReports.get(reportId);
    if (!report) return null;

    report.active = !report.active;
    
    if (report.active) {
      this.scheduleReport(report);
    } else {
      this.unscheduleReport(reportId);
    }

    await this.saveScheduledReports();
    return report;
  }

  async runReportNow(reportId: string): Promise<{ success: boolean; message: string; downloadUrl?: string }> {
    const report = this.scheduledReports.get(reportId);
    if (!report) {
      return { success: false, message: 'Report not found' };
    }

    try {
      const result = await this.executeReport(report);
      return {
        success: true,
        message: 'Report generated successfully',
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private scheduleReport(report: ScheduledReport): void {
    const cronExpression = this.getCronExpression(report.schedule, report.customCron);
    
    const task = cron.schedule(cronExpression, async () => {
      await this.executeScheduledReport(report.id);
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.cronJobs.set(report.id, task);
    console.log(`Scheduled report ${report.id} with cron expression: ${cronExpression}`);
  }

  private unscheduleReport(reportId: string): void {
    const task = this.cronJobs.get(reportId);
    if (task) {
      task.stop();
      task.destroy();
      this.cronJobs.delete(reportId);
      console.log(`Unscheduled report ${reportId}`);
    }
  }

  private async executeScheduledReport(reportId: string): Promise<void> {
    const report = this.scheduledReports.get(reportId);
    if (!report || !report.active) return;

    console.log(`Executing scheduled report: ${report.name} (${reportId})`);

    try {
      const result = await this.executeReport(report);
      
      // Send via email
      await this.sendReportViaEmail(report, result);
      
      // Update report statistics
      report.lastRun = new Date();
      report.runCount += 1;
      report.nextRun = this.calculateNextRun(report.schedule, report.customCron);
      report.lastError = undefined;
      
      await this.saveScheduledReports();
      
      console.log(`Successfully executed scheduled report: ${report.name}`);
    } catch (error) {
      console.error(`Failed to execute scheduled report ${report.name}:`, error);
      
      // Update error statistics
      report.failureCount += 1;
      report.lastError = error instanceof Error ? error.message : 'Unknown error';
      report.nextRun = this.calculateNextRun(report.schedule, report.customCron);
      
      await this.saveScheduledReports();
      
      // Send error notification to recipients
      await this.sendErrorNotification(report, error);
    }
  }

  private async executeReport(report: ScheduledReport): Promise<any> {
    // Prepare date range based on configuration
    const dateRange = this.getDateRangeForReport(report.filters.dateRange, report.filters.customDateRange);
    
    switch (report.reportType) {
      case 'workout-summary':
        return this.generateWorkoutSummaryReport(report, dateRange);
        
      case 'player-progress':
        return this.generatePlayerProgressReport(report, dateRange);
        
      case 'team-performance':
        return this.generateTeamPerformanceReport(report, dateRange);
        
      case 'medical-compliance':
        return this.generateMedicalComplianceReport(report, dateRange);
        
      case 'historical-trends':
        return this.generateHistoricalTrendsReport(report, dateRange);
        
      default:
        throw new Error(`Unsupported report type: ${report.reportType}`);
    }
  }

  private async generateWorkoutSummaryReport(report: ScheduledReport, dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock data - in real implementation, fetch from database
    const sessionData = {
      name: `Workout Summary - ${report.name}`,
      date: new Date(),
      workoutType: 'mixed',
      duration: 45,
      participantCount: 20,
      completionRate: 87.5,
      participants: [
        { name: 'Sidney Crosby', completionRate: 95, averageHeartRate: 145, grade: 'A' },
        { name: 'Connor McDavid', completionRate: 92, averageHeartRate: 150, grade: 'A' }
      ]
    };

    return this.enhancedExportService.generateWorkoutSummaryReport(sessionData, {
      format: report.format,
      includeCharts: report.filters.includeCharts,
      includeParticipantDetails: true,
      includeMedicalCompliance: report.filters.includeMedicalData
    });
  }

  private async generatePlayerProgressReport(report: ScheduledReport, dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock data - in real implementation, fetch from database
    const playerData = {
      id: report.filters.playerId || 'player-123',
      name: 'Sidney Crosby',
      team: 'Pittsburgh Penguins',
      currentLevel: 'Elite',
      progressScore: 92,
      performance: {
        strength: 85,
        cardio: 90,
        agility: 82,
        consistency: 95,
        technique: 88,
        recovery: 87
      },
      milestones: [
        { title: '100 Workouts Complete', date: new Date(), category: 'consistency' }
      ]
    };

    return this.enhancedExportService.generatePlayerProgressReport(playerData, {
      format: report.format,
      dateRange,
      includeCharts: report.filters.includeCharts,
      includeMedicalData: report.filters.includeMedicalData,
      includeRecommendations: true
    });
  }

  private async generateTeamPerformanceReport(report: ScheduledReport, dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock data - in real implementation, fetch from database
    const teamData = {
      id: report.filters.teamId || 'team-1',
      name: 'Pittsburgh Penguins',
      averageScore: 85.7,
      players: [
        { name: 'Sidney Crosby', overallScore: 92, grade: 'A', totalWorkouts: 156 },
        { name: 'Evgeni Malkin', overallScore: 88, grade: 'A', totalWorkouts: 142 }
      ]
    };

    return this.enhancedExportService.generateTeamPerformanceReport(teamData, {
      format: report.format,
      dateRange,
      includeCharts: report.filters.includeCharts,
      includePlayerBreakdown: report.filters.includePlayerBreakdown,
      includeComparisons: true
    });
  }

  private async generateMedicalComplianceReport(report: ScheduledReport, dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock data - would fetch from medical service
    const complianceData = [
      {
        playerId: 'player-123',
        playerName: 'Sidney Crosby',
        team: 'Pittsburgh Penguins',
        medicalStatus: 'cleared',
        complianceScore: 95,
        riskLevel: 'low'
      }
    ];

    return this.csvExportService.exportMedicalComplianceToCSV(complianceData, {
      filename: `medical_compliance_${report.filters.teamId || 'all_teams'}`
    });
  }

  private async generateHistoricalTrendsReport(report: ScheduledReport, dateRange: { start: Date; end: Date }): Promise<any> {
    // Mock trends data
    const trendsData = [
      {
        entityId: report.filters.teamId || report.filters.playerId || 'team-1',
        entityName: 'Pittsburgh Penguins',
        entityType: report.filters.playerId ? 'player' : 'team',
        metricName: 'performance',
        dataPoints: [
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            value: 82.5,
            trendDirection: 'up',
            changeFromPrevious: 3.2
          }
        ]
      }
    ];

    return this.csvExportService.exportHistoricalTrendsToCSV(trendsData, {
      filename: `historical_trends_${report.filters.teamId || report.filters.playerId || 'all'}`
    });
  }

  private async sendReportViaEmail(report: ScheduledReport, exportResult: any): Promise<void> {
    const subject = report.deliveryOptions.subject || `${report.name} - ${new Date().toLocaleDateString()}`;
    const message = report.deliveryOptions.message || `Please find your scheduled ${report.reportType} report attached.`;
    
    const attachmentName = report.deliveryOptions.attachmentName || 
                          `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${report.format}`;

    for (const recipient of report.recipients) {
      try {
        await this.emailService.sendReportEmail({
          to: recipient.email,
          subject,
          message: `Hello ${recipient.name || 'there'},\n\n${message}\n\nBest regards,\nHockey Hub Analytics Team`,
          attachments: [{
            filename: attachmentName,
            path: exportResult.filePath,
            contentType: this.getContentType(report.format)
          }]
        });
      } catch (error) {
        console.error(`Failed to send report to ${recipient.email}:`, error);
      }
    }
  }

  private async sendErrorNotification(report: ScheduledReport, error: any): Promise<void> {
    const subject = `Report Generation Failed: ${report.name}`;
    const message = `
      Hello,

      Your scheduled report "${report.name}" failed to generate.
      
      Error: ${error instanceof Error ? error.message : 'Unknown error'}
      Time: ${new Date().toLocaleString()}
      Report ID: ${report.id}
      
      Please check your report configuration or contact support if this issue persists.
      
      Best regards,
      Hockey Hub Analytics Team
    `;

    for (const recipient of report.recipients) {
      try {
        await this.emailService.sendEmail({
          to: recipient.email,
          subject,
          message
        });
      } catch (emailError) {
        console.error(`Failed to send error notification to ${recipient.email}:`, emailError);
      }
    }
  }

  private getCronExpression(schedule: string, customCron?: string): string {
    if (schedule === 'custom' && customCron) {
      return customCron;
    }

    switch (schedule) {
      case 'daily':
        return '0 8 * * *'; // 8 AM daily
      case 'weekly':
        return '0 8 * * 1'; // 8 AM every Monday
      case 'monthly':
        return '0 8 1 * *'; // 8 AM on the 1st of every month
      case 'quarterly':
        return '0 8 1 */3 *'; // 8 AM on the 1st of every 3rd month
      default:
        return '0 8 * * 1'; // Default to weekly
    }
  }

  private calculateNextRun(schedule: string, customCron?: string): Date {
    const now = new Date();
    
    switch (schedule) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        return tomorrow;
        
      case 'weekly':
        const nextMonday = new Date(now);
        const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(8, 0, 0, 0);
        return nextMonday;
        
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(8, 0, 0, 0);
        return nextMonth;
        
      case 'quarterly':
        const nextQuarter = new Date(now);
        const currentMonth = nextQuarter.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3 + 3;
        nextQuarter.setMonth(quarterStartMonth);
        nextQuarter.setDate(1);
        nextQuarter.setHours(8, 0, 0, 0);
        return nextQuarter;
        
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to next day
    }
  }

  private getDateRangeForReport(dateRangeType?: string, customRange?: { start: Date; end: Date }): { start: Date; end: Date } {
    const now = new Date();
    
    if (dateRangeType === 'custom' && customRange) {
      return customRange;
    }
    
    switch (dateRangeType) {
      case 'last_7_days':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        };
        
      case 'last_30_days':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        };
        
      case 'last_quarter':
        const quarterStart = new Date(now);
        quarterStart.setMonth(quarterStart.getMonth() - 3);
        return {
          start: quarterStart,
          end: now
        };
        
      default:
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        };
    }
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'html':
        return 'text/html';
      default:
        return 'application/octet-stream';
    }
  }

  private async saveScheduledReports(): Promise<void> {
    try {
      const reportsArray = Array.from(this.scheduledReports.values());
      const filePath = path.join(this.reportsDir, 'scheduled-reports.json');
      await fs.writeFile(filePath, JSON.stringify(reportsArray, null, 2));
    } catch (error) {
      console.error('Failed to save scheduled reports:', error);
    }
  }

  private async loadScheduledReports(): Promise<void> {
    try {
      const filePath = path.join(this.reportsDir, 'scheduled-reports.json');
      const data = await fs.readFile(filePath, 'utf8');
      const reportsArray: ScheduledReport[] = JSON.parse(data);
      
      for (const report of reportsArray) {
        // Convert date strings back to Date objects
        report.createdAt = new Date(report.createdAt);
        report.nextRun = new Date(report.nextRun);
        if (report.lastRun) {
          report.lastRun = new Date(report.lastRun);
        }
        
        this.scheduledReports.set(report.id, report);
        
        // Reschedule active reports
        if (report.active) {
          this.scheduleReport(report);
        }
      }
      
      console.log(`Loaded ${reportsArray.length} scheduled reports`);
    } catch (error) {
      console.log('No existing scheduled reports found, starting fresh');
    }
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create reports directory:', error);
    }
  }
}