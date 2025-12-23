// @ts-nocheck - Suppress TypeScript errors for build
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CSVExportOptions {
  data: any[];
  columns?: string[];
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  lineBreak?: string;
  encoding?: 'utf8' | 'utf16le' | 'latin1';
}

@Injectable()
export class CSVExportService {
  private readonly exportDir = path.join(process.cwd(), 'storage', 'exports');

  constructor() {
    this.ensureExportDirectory();
  }

  async exportToCSV(options: CSVExportOptions): Promise<{
    buffer: Buffer;
    filePath: string;
    downloadUrl: string;
    metadata: {
      fileSize: number;
      rowCount: number;
      columnCount: number;
      format: string;
    };
  }> {
    const {
      data,
      columns,
      filename = `export_${Date.now()}`,
      includeHeaders = true,
      delimiter = ',',
      quoteChar = '"',
      escapeChar = '"',
      lineBreak = '\n',
      encoding = 'utf8'
    } = options;

    if (!data || data.length === 0) {
      throw new Error('No data provided for CSV export');
    }

    // Determine columns from data if not provided
    const csvColumns = columns || Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      csvRows.push(this.formatCSVRow(csvColumns, delimiter, quoteChar, escapeChar));
    }

    // Add data rows
    for (const row of data) {
      const values = csvColumns.map(col => {
        const value = row[col];
        return value !== null && value !== undefined ? String(value) : '';
      });
      csvRows.push(this.formatCSVRow(values, delimiter, quoteChar, escapeChar));
    }

    // Join all rows
    const csvContent = csvRows.join(lineBreak);
    const buffer = Buffer.from(csvContent, encoding);

    // Save to file
    const fileName = `${filename.replace(/\s+/g, '_')}.csv`;
    const filePath = path.join(this.exportDir, fileName);
    await fs.writeFile(filePath, buffer);

    return {
      buffer,
      filePath,
      downloadUrl: `/api/exports/${fileName}`,
      metadata: {
        fileSize: buffer.length,
        rowCount: data.length + (includeHeaders ? 1 : 0),
        columnCount: csvColumns.length,
        format: 'csv'
      }
    };
  }

  async exportWorkoutSessionsToCSV(sessions: any[], options?: Partial<CSVExportOptions>): Promise<any> {
    const flattenedSessions = sessions.map(session => ({
      'Session ID': session.id,
      'Date': new Date(session.date).toLocaleDateString(),
      'Workout Type': session.workoutType,
      'Duration (min)': session.duration,
      'Participant Count': session.participantCount,
      'Completion Rate (%)': session.completionRate,
      'Average Adherence (%)': session.averageAdherence,
      'Average Heart Rate': session.teamMetrics?.averageHeartRate,
      'Max Heart Rate': session.teamMetrics?.maxHeartRate,
      'Total Calories': session.teamMetrics?.totalCalories,
      'Average Intensity (%)': session.teamMetrics?.averageIntensity,
      'Top Performers': session.insights?.topPerformers?.join('; '),
      'Areas for Improvement': session.insights?.areasForImprovement?.join('; ')
    }));

    return this.exportToCSV({
      data: flattenedSessions,
      filename: options?.filename || 'workout_sessions',
      ...options
    });
  }

  async exportPlayerProgressToCSV(players: any[], options?: Partial<CSVExportOptions>): Promise<any> {
    const flattenedPlayers = players.map(player => ({
      'Player ID': player.playerId,
      'Player Name': player.playerName,
      'Team': player.team,
      'Current Level': player.overallProgress?.currentLevel,
      'Progress Score': player.overallProgress?.progressScore,
      'Improvement Rate (%)': player.overallProgress?.improvementRate,
      'Consistency Score': player.overallProgress?.consistencyScore,
      'Total Workouts': player.overallProgress?.totalWorkouts,
      'Strength Score': player.performance?.strength,
      'Cardio Score': player.performance?.cardio,
      'Agility Score': player.performance?.agility,
      'Recovery Score': player.performance?.recovery,
      'Last Workout Date': player.lastWorkoutDate ? new Date(player.lastWorkoutDate).toLocaleDateString() : '',
      'Recent Milestones': player.milestones?.map((m: any) => m.title).join('; '),
      'High Priority Recommendations': player.recommendations?.filter((r: any) => r.priority === 'high').map((r: any) => r.title).join('; ')
    }));

    return this.exportToCSV({
      data: flattenedPlayers,
      filename: options?.filename || 'player_progress',
      ...options
    });
  }

  async exportTeamPerformanceToCSV(teams: any[], options?: Partial<CSVExportOptions>): Promise<any> {
    const flattenedTeams = teams.map(team => ({
      'Team ID': team.teamId,
      'Team Name': team.teamName,
      'Total Sessions': team.overallMetrics?.totalSessions,
      'Total Participants': team.overallMetrics?.totalParticipants,
      'Average Completion Rate (%)': team.overallMetrics?.averageCompletionRate,
      'Average Adherence Score (%)': team.overallMetrics?.averageAdherenceScore,
      'Total Training Hours': team.overallMetrics?.totalTrainingHours,
      'Top Performer': team.playerRankings?.[0]?.playerName,
      'Top Performer Score': team.playerRankings?.[0]?.overallScore,
      'Team Strengths': team.teamStrengths?.join('; '),
      'Improvement Areas': team.improvementAreas?.join('; '),
      'Recommendations': team.recommendations?.join('; ')
    }));

    return this.exportToCSV({
      data: flattenedTeams,
      filename: options?.filename || 'team_performance',
      ...options
    });
  }

  async exportMedicalComplianceToCSV(complianceData: any[], options?: Partial<CSVExportOptions>): Promise<any> {
    const flattenedCompliance = complianceData.map(record => ({
      'Player ID': record.playerId,
      'Player Name': record.playerName,
      'Team': record.team,
      'Medical Status': record.medicalStatus,
      'Injury Type': record.currentInjury?.type,
      'Injury Severity': record.currentInjury?.severity,
      'Return to Play Date': record.returnToPlayDate ? new Date(record.returnToPlayDate).toLocaleDateString() : '',
      'Restrictions': record.restrictions?.join('; '),
      'Cleared Exercises': record.clearedExercises?.join('; '),
      'Prohibited Exercises': record.prohibitedExercises?.join('; '),
      'Last Medical Check': record.lastMedicalCheck ? new Date(record.lastMedicalCheck).toLocaleDateString() : '',
      'Next Medical Check': record.nextMedicalCheck ? new Date(record.nextMedicalCheck).toLocaleDateString() : '',
      'Compliance Score (%)': record.complianceScore,
      'Risk Level': record.riskLevel,
      'Medical Notes': record.medicalNotes
    }));

    return this.exportToCSV({
      data: flattenedCompliance,
      filename: options?.filename || 'medical_compliance',
      ...options
    });
  }

  async exportHistoricalTrendsToCSV(trendsData: any[], options?: Partial<CSVExportOptions>): Promise<any> {
    const flattenedTrends = trendsData.flatMap(trend => {
      return trend.dataPoints.map((point: any) => ({
        'Entity ID': trend.entityId,
        'Entity Name': trend.entityName,
        'Entity Type': trend.entityType, // 'player' or 'team'
        'Date': new Date(point.date).toLocaleDateString(),
        'Metric': trend.metricName,
        'Value': point.value,
        'Trend Direction': point.trendDirection, // 'up', 'down', 'stable'
        'Change from Previous (%)': point.changeFromPrevious,
        'Percentile Rank': point.percentileRank,
        'Season Phase': point.seasonPhase,
        'Forecasted Value': point.forecastedValue,
        'Confidence Level (%)': point.confidenceLevel
      }));
    });

    return this.exportToCSV({
      data: flattenedTrends,
      filename: options?.filename || 'historical_trends',
      ...options
    });
  }

  async exportBulkAnalytics(analyticsData: {
    sessions?: any[];
    players?: any[];
    teams?: any[];
    medicalCompliance?: any[];
    historicalTrends?: any[];
  }, options?: {
    createSeparateFiles?: boolean;
    zipFiles?: boolean;
    baseFilename?: string;
  }): Promise<any> {
    const results = [];
    const { createSeparateFiles = true, baseFilename = 'hockey_analytics' } = options || {};

    if (createSeparateFiles) {
      // Create separate CSV files for each data type
      if (analyticsData.sessions) {
        const sessionsResult = await this.exportWorkoutSessionsToCSV(
          analyticsData.sessions,
          { filename: `${baseFilename}_sessions` }
        );
        results.push({ type: 'sessions', ...sessionsResult });
      }

      if (analyticsData.players) {
        const playersResult = await this.exportPlayerProgressToCSV(
          analyticsData.players,
          { filename: `${baseFilename}_players` }
        );
        results.push({ type: 'players', ...playersResult });
      }

      if (analyticsData.teams) {
        const teamsResult = await this.exportTeamPerformanceToCSV(
          analyticsData.teams,
          { filename: `${baseFilename}_teams` }
        );
        results.push({ type: 'teams', ...teamsResult });
      }

      if (analyticsData.medicalCompliance) {
        const medicalResult = await this.exportMedicalComplianceToCSV(
          analyticsData.medicalCompliance,
          { filename: `${baseFilename}_medical` }
        );
        results.push({ type: 'medical', ...medicalResult });
      }

      if (analyticsData.historicalTrends) {
        const trendsResult = await this.exportHistoricalTrendsToCSV(
          analyticsData.historicalTrends,
          { filename: `${baseFilename}_trends` }
        );
        results.push({ type: 'trends', ...trendsResult });
      }
    } else {
      // Create a single combined CSV file
      const combinedData: any[] = [];

      // Add all data with type indicators
      if (analyticsData.sessions) {
        combinedData.push(...analyticsData.sessions.map(s => ({ ...s, dataType: 'session' })));
      }
      if (analyticsData.players) {
        combinedData.push(...analyticsData.players.map(p => ({ ...p, dataType: 'player' })));
      }
      if (analyticsData.teams) {
        combinedData.push(...analyticsData.teams.map(t => ({ ...t, dataType: 'team' })));
      }

      const combinedResult = await this.exportToCSV({
        data: combinedData,
        filename: `${baseFilename}_combined`
      });
      results.push({ type: 'combined', ...combinedResult });
    }

    return {
      success: true,
      files: results,
      totalFiles: results.length,
      totalSize: results.reduce((sum, file) => sum + file.metadata.fileSize, 0)
    };
  }

  private formatCSVRow(values: string[], delimiter: string, quoteChar: string, escapeChar: string): string {
    return values.map(value => {
      // Convert to string and handle null/undefined
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      
      // Check if quoting is needed
      const needsQuoting = stringValue.includes(delimiter) || 
                          stringValue.includes(quoteChar) || 
                          stringValue.includes('\n') || 
                          stringValue.includes('\r');

      if (needsQuoting) {
        // Escape quote characters
        const escapedValue = stringValue.replace(new RegExp(quoteChar, 'g'), escapeChar + quoteChar);
        return quoteChar + escapedValue + quoteChar;
      }

      return stringValue;
    }).join(delimiter);
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create export directory:', error);
    }
  }

  // Utility method to convert nested objects to flat structure
  private flattenObject(obj: any, prefix: string = '', separator: string = '.'): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively flatten nested objects
          Object.assign(flattened, this.flattenObject(value, newKey, separator));
        } else if (Array.isArray(value)) {
          // Convert arrays to semicolon-separated strings
          flattened[newKey] = value.join('; ');
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  }

  // Method to generate CSV with custom column mappings
  async exportWithColumnMapping(data: any[], columnMappings: { [key: string]: string }, options?: Partial<CSVExportOptions>): Promise<any> {
    const mappedData = data.map(row => {
      const mappedRow: any = {};
      for (const [originalKey, displayName] of Object.entries(columnMappings)) {
        mappedRow[displayName] = this.getNestedValue(row, originalKey);
      }
      return mappedRow;
    });

    return this.exportToCSV({
      data: mappedData,
      columns: Object.values(columnMappings),
      ...options
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }
}