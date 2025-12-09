import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Interfaces for Excel export
export interface ExcelExportOptions {
  format: 'xlsx' | 'csv' | 'tsv';
  includeCharts: boolean;
  includeAnalytics: boolean;
  includePlayerData: boolean;
  includeStatistics: boolean;
  includeFormulas: boolean;
  multipleSheets: boolean;
  formatting: ExcelFormatting;
  customSheets?: CustomSheet[];
  filters: ExcelFilters;
}

export interface ExcelFormatting {
  headerStyle: {
    backgroundColor: string;
    fontColor: string;
    bold: boolean;
    fontSize: number;
  };
  dataStyle: {
    fontSize: number;
    alternateRowColor?: string;
  };
  numberFormat: string;
  dateFormat: string;
  percentFormat: string;
  borderStyle: 'thin' | 'medium' | 'thick' | 'none';
}

export interface CustomSheet {
  name: string;
  data: any[];
  headers: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  chartOptions?: ChartOptions;
}

export interface ChartOptions {
  title: string;
  xAxis: string;
  yAxis: string;
  width: number;
  height: number;
  position: { row: number; col: number };
}

export interface ExcelFilters {
  categories?: string[];
  formations?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  effectiveness?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface PlaySystem {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'faceoff' | 'transition';
  situation: string;
  formation: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  coachNotes?: string;
  keyPoints?: string[];
  variations?: PlayVariation[];
  effectiveness?: number;
  successRate?: number;
  usageFrequency?: number;
  playerPositions?: PlayerPosition[];
  statistics?: PlayStatistics;
}

export interface PlayVariation {
  id: string;
  name: string;
  description: string;
  data: any;
  effectiveness?: number;
  notes?: string;
}

export interface PlayerPosition {
  playerId: string;
  playerName: string;
  position: string;
  role: string;
  instructions?: string;
  performanceRating?: number;
}

export interface PlayStatistics {
  timesUsed: number;
  successfulExecutions: number;
  averageExecutionTime: number;
  playerRatings: Record<string, number>;
  situationalEffectiveness: Record<string, number>;
  monthlyUsage: Record<string, number>;
  seasonTrends: {
    month: string;
    usage: number;
    effectiveness: number;
  }[];
}

// Excel Export Service
export class ExcelExportService {
  private options: ExcelExportOptions;
  private workbook: XLSX.WorkBook;

  constructor(options: ExcelExportOptions) {
    this.options = options;
    this.workbook = XLSX.utils.book_new();
  }

  async exportPlaysToExcel(plays: PlaySystem[]): Promise<Blob> {
    try {
      // Filter plays based on options
      const filteredPlays = this.filterPlays(plays);

      if (this.options.multipleSheets) {
        await this.createMultipleSheets(filteredPlays);
      } else {
        await this.createSingleSheet(filteredPlays);
      }

      // Add custom sheets if specified
      if (this.options.customSheets) {
        this.addCustomSheets();
      }

      // Generate and return file
      return this.generateFile();

    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private filterPlays(plays: PlaySystem[]): PlaySystem[] {
    let filtered = [...plays];

    // Filter by categories
    if (this.options.filters.categories && this.options.filters.categories.length > 0) {
      filtered = filtered.filter(play => this.options.filters.categories!.includes(play.category));
    }

    // Filter by formations
    if (this.options.filters.formations && this.options.filters.formations.length > 0) {
      filtered = filtered.filter(play => 
        play.formation && this.options.filters.formations!.includes(play.formation)
      );
    }

    // Filter by date range
    if (this.options.filters.dateRange) {
      const { start, end } = this.options.filters.dateRange;
      filtered = filtered.filter(play => 
        play.createdAt >= start && play.createdAt <= end
      );
    }

    // Filter by effectiveness
    if (this.options.filters.effectiveness) {
      const { min, max } = this.options.filters.effectiveness;
      filtered = filtered.filter(play => {
        const effectiveness = play.effectiveness || 0;
        return effectiveness >= min && effectiveness <= max;
      });
    }

    // Filter by tags
    if (this.options.filters.tags && this.options.filters.tags.length > 0) {
      filtered = filtered.filter(play => 
        this.options.filters.tags!.some(tag => play.tags.includes(tag))
      );
    }

    return filtered;
  }

  private async createMultipleSheets(plays: PlaySystem[]) {
    // Main plays sheet
    this.createPlaysOverviewSheet(plays);

    // Category breakdown sheets
    this.createCategorySheets(plays);

    // Statistics sheet
    if (this.options.includeStatistics) {
      this.createStatisticsSheet(plays);
    }

    // Analytics sheet
    if (this.options.includeAnalytics) {
      this.createAnalyticsSheet(plays);
    }

    // Player data sheet
    if (this.options.includePlayerData) {
      this.createPlayerDataSheet(plays);
    }

    // Variations sheet
    this.createVariationsSheet(plays);

    // Trends analysis sheet
    this.createTrendsSheet(plays);
  }

  private async createSingleSheet(plays: PlaySystem[]) {
    const sheetData = this.preparePlayData(plays);
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    
    this.applyFormatting(worksheet, sheetData.length);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Plays');
  }

  private createPlaysOverviewSheet(plays: PlaySystem[]) {
    const playData = plays.map(play => ({
      'Play ID': play.id,
      'Play Name': play.name,
      'Category': play.category.charAt(0).toUpperCase() + play.category.slice(1),
      'Formation': play.formation || 'Not specified',
      'Situation': play.situation || 'General',
      'Description': play.description,
      'Tags': play.tags.join(', '),
      'Effectiveness %': play.effectiveness || 0,
      'Success Rate %': play.successRate || 0,
      'Usage Frequency': play.usageFrequency || 0,
      'Key Points Count': play.keyPoints?.length || 0,
      'Variations Count': play.variations?.length || 0,
      'Player Positions': play.playerPositions?.length || 0,
      'Coach Notes': play.coachNotes || '',
      'Created Date': this.formatDate(play.createdAt),
      'Updated Date': this.formatDate(play.updatedAt),
      'Days Since Created': this.daysSince(play.createdAt),
      'Days Since Updated': this.daysSince(play.updatedAt)
    }));

    const worksheet = XLSX.utils.json_to_sheet(playData);
    this.applyAdvancedFormatting(worksheet, playData.length);
    
    // Add auto-filter
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: Object.keys(playData[0]).length - 1, r: playData.length }
    })};

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Plays Overview');
  }

  private createCategorySheets(plays: PlaySystem[]) {
    const categories = [...new Set(plays.map(p => p.category))];
    
    categories.forEach(category => {
      const categoryPlays = plays.filter(p => p.category === category);
      const categoryData = this.prepareDetailedPlayData(categoryPlays);
      
      const worksheet = XLSX.utils.json_to_sheet(categoryData);
      this.applyFormatting(worksheet, categoryData.length);
      
      const sheetName = category.charAt(0).toUpperCase() + category.slice(1);
      XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);
    });
  }

  private createStatisticsSheet(plays: PlaySystem[]) {
    const statistics = this.calculateDetailedStatistics(plays);
    
    // Overall statistics
    const overallStats = [
      { Metric: 'Total Plays', Value: statistics.totalPlays },
      { Metric: 'Average Effectiveness', Value: `${statistics.avgEffectiveness.toFixed(1)}%` },
      { Metric: 'Average Success Rate', Value: `${statistics.avgSuccessRate.toFixed(1)}%` },
      { Metric: 'Most Used Category', Value: statistics.mostUsedCategory },
      { Metric: 'Most Common Formation', Value: statistics.mostCommonFormation },
      { Metric: 'Total Usage Frequency', Value: statistics.totalUsage },
      { Metric: 'Plays with Variations', Value: statistics.playsWithVariations },
      { Metric: 'Average Variations per Play', Value: statistics.avgVariationsPerPlay.toFixed(1) },
      { Metric: 'Most Tagged Play', Value: statistics.mostTaggedPlay },
      { Metric: 'Recent Activity (7 days)', Value: statistics.recentActivity }
    ];

    const worksheet = XLSX.utils.json_to_sheet(overallStats);
    
    // Add category breakdown table
    const categoryStats = Object.entries(statistics.categoryBreakdown).map(([category, data]) => ({
      Category: category.charAt(0).toUpperCase() + category.slice(1),
      'Play Count': data.count,
      'Percentage': `${((data.count / statistics.totalPlays) * 100).toFixed(1)}%`,
      'Avg Effectiveness': `${data.avgEffectiveness.toFixed(1)}%`,
      'Total Usage': data.totalUsage,
      'Most Effective Play': data.mostEffectivePlay
    }));

    // Add category data starting from row with some spacing
    XLSX.utils.sheet_add_json(worksheet, categoryStats, { origin: 'A15', header: Object.keys(categoryStats[0]) });
    
    this.applyFormatting(worksheet, overallStats.length + categoryStats.length + 5);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Statistics');
  }

  private createAnalyticsSheet(plays: PlaySystem[]) {
    const analytics = this.calculateAdvancedAnalytics(plays);
    
    // Performance trends
    const trendsData = analytics.performanceTrends.map(trend => ({
      'Time Period': trend.period,
      'Plays Created': trend.playsCreated,
      'Average Effectiveness': `${trend.avgEffectiveness.toFixed(1)}%`,
      'Total Usage': trend.totalUsage,
      'Most Active Category': trend.mostActiveCategory,
      'Improvement Rate': `${trend.improvementRate.toFixed(1)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(trendsData);
    
    // Add effectiveness distribution
    const effectivenessDistribution = analytics.effectivenessDistribution.map(dist => ({
      'Effectiveness Range': `${dist.min}-${dist.max}%`,
      'Play Count': dist.count,
      'Percentage': `${dist.percentage.toFixed(1)}%`,
      'Category Breakdown': dist.categories.join(', ')
    }));

    XLSX.utils.sheet_add_json(worksheet, effectivenessDistribution, { 
      origin: 'A15',
      header: ['Effectiveness Range', 'Play Count', 'Percentage', 'Category Breakdown']
    });

    // Add formation analysis
    const formationAnalysis = analytics.formationAnalysis.map(analysis => ({
      Formation: analysis.formation,
      'Usage Count': analysis.count,
      'Avg Effectiveness': `${analysis.avgEffectiveness.toFixed(1)}%`,
      'Best Category': analysis.bestCategory,
      'Success Rate': `${analysis.avgSuccessRate.toFixed(1)}%`
    }));

    XLSX.utils.sheet_add_json(worksheet, formationAnalysis, { 
      origin: 'A25',
      header: Object.keys(formationAnalysis[0])
    });

    this.applyFormatting(worksheet, trendsData.length + effectivenessDistribution.length + formationAnalysis.length + 10);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Analytics');
  }

  private createPlayerDataSheet(plays: PlaySystem[]) {
    const allPlayerPositions: (PlayerPosition & { playName: string; playCategory: string })[] = [];
    
    plays.forEach(play => {
      if (play.playerPositions) {
        play.playerPositions.forEach(position => {
          allPlayerPositions.push({
            ...position,
            playName: play.name,
            playCategory: play.category
          });
        });
      }
    });

    const playerData = allPlayerPositions.map(pos => ({
      'Play Name': pos.playName,
      'Play Category': pos.playCategory.charAt(0).toUpperCase() + pos.playCategory.slice(1),
      'Player Name': pos.playerName,
      'Position': pos.position,
      'Role': pos.role,
      'Instructions': pos.instructions || 'Standard execution',
      'Performance Rating': pos.performanceRating || 'Not rated'
    }));

    const worksheet = XLSX.utils.json_to_sheet(playerData);
    this.applyFormatting(worksheet, playerData.length);
    
    // Add auto-filter for easier sorting
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: Object.keys(playerData[0]).length - 1, r: playerData.length }
    })};

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Player Data');
  }

  private createVariationsSheet(plays: PlaySystem[]) {
    const allVariations: (PlayVariation & { playName: string; playCategory: string })[] = [];
    
    plays.forEach(play => {
      if (play.variations) {
        play.variations.forEach(variation => {
          allVariations.push({
            ...variation,
            playName: play.name,
            playCategory: play.category
          });
        });
      }
    });

    const variationsData = allVariations.map(variation => ({
      'Original Play': variation.playName,
      'Play Category': variation.playCategory.charAt(0).toUpperCase() + variation.playCategory.slice(1),
      'Variation Name': variation.name,
      'Description': variation.description,
      'Effectiveness': `${variation.effectiveness || 0}%`,
      'Notes': variation.notes || 'No additional notes'
    }));

    const worksheet = XLSX.utils.json_to_sheet(variationsData);
    this.applyFormatting(worksheet, variationsData.length);

    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Variations');
  }

  private createTrendsSheet(plays: PlaySystem[]) {
    // Monthly creation trends
    const monthlyTrends = this.calculateMonthlyTrends(plays);
    const trendsData = monthlyTrends.map(trend => ({
      'Month': trend.month,
      'Plays Created': trend.playsCreated,
      'Plays Updated': trend.playsUpdated,
      'Avg Effectiveness': `${trend.avgEffectiveness.toFixed(1)}%`,
      'Most Active Category': trend.mostActiveCategory,
      'New Formations': trend.newFormations
    }));

    const worksheet = XLSX.utils.json_to_sheet(trendsData);

    // Add weekly usage trends
    const weeklyUsage = this.calculateWeeklyUsage(plays);
    const weeklyData = weeklyUsage.map(week => ({
      'Week': week.weekOf,
      'Total Usage': week.totalUsage,
      'Most Used Play': week.mostUsedPlay,
      'Best Performing Play': week.bestPerformingPlay,
      'New Plays': week.newPlays
    }));

    XLSX.utils.sheet_add_json(worksheet, weeklyData, { 
      origin: 'A15',
      header: Object.keys(weeklyData[0])
    });

    this.applyFormatting(worksheet, trendsData.length + weeklyData.length + 5);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Trends');
  }

  private addCustomSheets() {
    this.options.customSheets?.forEach(customSheet => {
      const worksheet = XLSX.utils.json_to_sheet(customSheet.data, { header: customSheet.headers });
      this.applyFormatting(worksheet, customSheet.data.length);
      
      // Add chart if specified (note: XLSX.js has limited chart support)
      if (customSheet.chartType && customSheet.chartOptions) {
        this.addChartPlaceholder(worksheet, customSheet.chartOptions);
      }
      
      XLSX.utils.book_append_sheet(this.workbook, worksheet, customSheet.name);
    });
  }

  private addChartPlaceholder(worksheet: XLSX.WorkSheet, chartOptions: ChartOptions) {
    // Since XLSX.js doesn't support native charts, add a placeholder
    const placeholder = `[CHART: ${chartOptions.title} - ${chartOptions.xAxis} vs ${chartOptions.yAxis}]`;
    const cellRef = XLSX.utils.encode_cell({ r: chartOptions.position.row, c: chartOptions.position.col });
    worksheet[cellRef] = { t: 's', v: placeholder };
  }

  private preparePlayData(plays: PlaySystem[]) {
    return plays.map(play => ({
      'ID': play.id,
      'Name': play.name,
      'Category': play.category,
      'Formation': play.formation || '',
      'Situation': play.situation || '',
      'Description': play.description,
      'Tags': play.tags.join(', '),
      'Effectiveness': play.effectiveness || 0,
      'Success Rate': play.successRate || 0,
      'Usage Frequency': play.usageFrequency || 0,
      'Coach Notes': play.coachNotes || '',
      'Key Points': play.keyPoints?.join('; ') || '',
      'Variations Count': play.variations?.length || 0,
      'Created': this.formatDate(play.createdAt),
      'Updated': this.formatDate(play.updatedAt)
    }));
  }

  private prepareDetailedPlayData(plays: PlaySystem[]) {
    return plays.map(play => ({
      'Play Name': play.name,
      'Description': play.description,
      'Formation': play.formation || 'Not specified',
      'Situation': play.situation || 'General',
      'Effectiveness %': play.effectiveness || 0,
      'Success Rate %': play.successRate || 0,
      'Times Used': play.usageFrequency || 0,
      'Tags': play.tags.join(', '),
      'Key Points': play.keyPoints?.join('; ') || '',
      'Coach Notes': play.coachNotes || '',
      'Player Positions': play.playerPositions?.length || 0,
      'Variations': play.variations?.length || 0,
      'Created Date': this.formatDate(play.createdAt),
      'Last Updated': this.formatDate(play.updatedAt),
      'Age (Days)': this.daysSince(play.createdAt)
    }));
  }

  private calculateDetailedStatistics(plays: PlaySystem[]) {
    const totalPlays = plays.length;
    const avgEffectiveness = plays.reduce((sum, play) => sum + (play.effectiveness || 0), 0) / totalPlays;
    const avgSuccessRate = plays.reduce((sum, play) => sum + (play.successRate || 0), 0) / totalPlays;
    const totalUsage = plays.reduce((sum, play) => sum + (play.usageFrequency || 0), 0);

    // Category breakdown
    const categoryBreakdown = plays.reduce((acc, play) => {
      if (!acc[play.category]) {
        acc[play.category] = {
          count: 0,
          totalEffectiveness: 0,
          avgEffectiveness: 0,
          totalUsage: 0,
          mostEffectivePlay: ''
        };
      }
      
      const category = acc[play.category];
      category.count++;
      category.totalEffectiveness += play.effectiveness || 0;
      category.totalUsage += play.usageFrequency || 0;
      
      if (!category.mostEffectivePlay || (play.effectiveness || 0) > 
          (plays.find(p => p.name === category.mostEffectivePlay)?.effectiveness || 0)) {
        category.mostEffectivePlay = play.name;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(categoryBreakdown).forEach((category: any) => {
      category.avgEffectiveness = category.count > 0 ? category.totalEffectiveness / category.count : 0;
    });

    // Most used category
    const mostUsedCategory = Object.entries(categoryBreakdown)
      .sort(([, a]: [string, any], [, b]: [string, any]) => b.count - a.count)[0]?.[0] || 'None';

    // Most common formation
    const formations = plays.reduce((acc, play) => {
      if (play.formation) {
        acc[play.formation] = (acc[play.formation] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const mostCommonFormation = Object.entries(formations)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

    // Variations statistics
    const playsWithVariations = plays.filter(play => play.variations && play.variations.length > 0).length;
    const avgVariationsPerPlay = plays.reduce((sum, play) => sum + (play.variations?.length || 0), 0) / totalPlays;

    // Most tagged play
    const mostTaggedPlay = plays.sort((a, b) => b.tags.length - a.tags.length)[0]?.name || 'None';

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = plays.filter(play => play.updatedAt >= sevenDaysAgo).length;

    return {
      totalPlays,
      avgEffectiveness,
      avgSuccessRate,
      mostUsedCategory,
      mostCommonFormation,
      totalUsage,
      playsWithVariations,
      avgVariationsPerPlay,
      mostTaggedPlay,
      recentActivity,
      categoryBreakdown
    };
  }

  private calculateAdvancedAnalytics(plays: PlaySystem[]) {
    // Performance trends by month
    const monthlyData = plays.reduce((acc, play) => {
      const monthKey = `${play.createdAt.getFullYear()}-${String(play.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          playsCreated: 0,
          totalEffectiveness: 0,
          totalUsage: 0,
          categories: {} as Record<string, number>
        };
      }
      
      acc[monthKey].playsCreated++;
      acc[monthKey].totalEffectiveness += play.effectiveness || 0;
      acc[monthKey].totalUsage += play.usageFrequency || 0;
      acc[monthKey].categories[play.category] = (acc[monthKey].categories[play.category] || 0) + 1;
      
      return acc;
    }, {} as Record<string, any>);

    const performanceTrends = Object.entries(monthlyData).map(([period, data]: [string, any], index, arr) => {
      const avgEffectiveness = data.playsCreated > 0 ? data.totalEffectiveness / data.playsCreated : 0;
      const mostActiveCategory = Object.entries(data.categories)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0]?.[0] || 'None';
      
      // Calculate improvement rate compared to previous month
      let improvementRate = 0;
      if (index > 0) {
        const prevData = arr[index - 1][1] as any;
        const prevAvg = prevData.playsCreated > 0 ? prevData.totalEffectiveness / prevData.playsCreated : 0;
        improvementRate = prevAvg > 0 ? ((avgEffectiveness - prevAvg) / prevAvg) * 100 : 0;
      }
      
      return {
        period,
        playsCreated: data.playsCreated,
        avgEffectiveness,
        totalUsage: data.totalUsage,
        mostActiveCategory,
        improvementRate
      };
    });

    // Effectiveness distribution
    const effectivenessRanges = [
      { min: 0, max: 20 },
      { min: 21, max: 40 },
      { min: 41, max: 60 },
      { min: 61, max: 80 },
      { min: 81, max: 100 }
    ];

    const effectivenessDistribution = effectivenessRanges.map(range => {
      const playsInRange = plays.filter(play => {
        const effectiveness = play.effectiveness || 0;
        return effectiveness >= range.min && effectiveness <= range.max;
      });
      
      const categories = [...new Set(playsInRange.map(p => p.category))];
      
      return {
        min: range.min,
        max: range.max,
        count: playsInRange.length,
        percentage: (playsInRange.length / plays.length) * 100,
        categories
      };
    });

    // Formation analysis
    const formationData = plays.reduce((acc, play) => {
      if (play.formation) {
        if (!acc[play.formation]) {
          acc[play.formation] = {
            count: 0,
            totalEffectiveness: 0,
            totalSuccessRate: 0,
            categories: {} as Record<string, number>
          };
        }
        
        acc[play.formation].count++;
        acc[play.formation].totalEffectiveness += play.effectiveness || 0;
        acc[play.formation].totalSuccessRate += play.successRate || 0;
        acc[play.formation].categories[play.category] = (acc[play.formation].categories[play.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const formationAnalysis = Object.entries(formationData).map(([formation, data]: [string, any]) => ({
      formation,
      count: data.count,
      avgEffectiveness: data.count > 0 ? data.totalEffectiveness / data.count : 0,
      avgSuccessRate: data.count > 0 ? data.totalSuccessRate / data.count : 0,
      bestCategory: Object.entries(data.categories)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0]?.[0] || 'None'
    }));

    return {
      performanceTrends,
      effectivenessDistribution,
      formationAnalysis
    };
  }

  private calculateMonthlyTrends(plays: PlaySystem[]) {
    const monthlyData = plays.reduce((acc, play) => {
      const createdMonth = `${play.createdAt.getFullYear()}-${String(play.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const updatedMonth = `${play.updatedAt.getFullYear()}-${String(play.updatedAt.getMonth() + 1).padStart(2, '0')}`;
      
      // Track creations
      if (!acc[createdMonth]) {
        acc[createdMonth] = {
          playsCreated: 0,
          playsUpdated: 0,
          totalEffectiveness: 0,
          categories: {} as Record<string, number>,
          formations: {} as Record<string, boolean>
        };
      }
      acc[createdMonth].playsCreated++;
      acc[createdMonth].totalEffectiveness += play.effectiveness || 0;
      acc[createdMonth].categories[play.category] = (acc[createdMonth].categories[play.category] || 0) + 1;
      if (play.formation) {
        acc[createdMonth].formations[play.formation] = true;
      }
      
      // Track updates (if different from creation month)
      if (updatedMonth !== createdMonth) {
        if (!acc[updatedMonth]) {
          acc[updatedMonth] = {
            playsCreated: 0,
            playsUpdated: 0,
            totalEffectiveness: 0,
            categories: {} as Record<string, number>,
            formations: {} as Record<string, boolean>
          };
        }
        acc[updatedMonth].playsUpdated++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => ({
        month,
        playsCreated: data.playsCreated,
        playsUpdated: data.playsUpdated,
        avgEffectiveness: data.playsCreated > 0 ? data.totalEffectiveness / data.playsCreated : 0,
        mostActiveCategory: Object.entries(data.categories)
          .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0]?.[0] || 'None',
        newFormations: Object.keys(data.formations).length
      }));
  }

  private calculateWeeklyUsage(plays: PlaySystem[]) {
    // This is a simplified implementation - in real use, you'd have actual usage data
    const weeks: any[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
      
      const weekPlays = plays.filter(play => 
        play.updatedAt >= weekStart && play.updatedAt <= weekEnd
      );
      
      const totalUsage = weekPlays.reduce((sum, play) => sum + (play.usageFrequency || 0), 0);
      const mostUsedPlay = weekPlays.sort((a, b) => (b.usageFrequency || 0) - (a.usageFrequency || 0))[0]?.name || 'None';
      const bestPerformingPlay = weekPlays.sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0))[0]?.name || 'None';
      
      weeks.push({
        weekOf: weekStart.toISOString().split('T')[0],
        totalUsage,
        mostUsedPlay,
        bestPerformingPlay,
        newPlays: weekPlays.filter(play => 
          play.createdAt >= weekStart && play.createdAt <= weekEnd
        ).length
      });
    }
    
    return weeks.reverse();
  }

  private applyFormatting(worksheet: XLSX.WorkSheet, dataLength: number) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply header formatting
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          font: {
            bold: this.options.formatting.headerStyle.bold,
            sz: this.options.formatting.headerStyle.fontSize,
            color: { rgb: this.options.formatting.headerStyle.fontColor.replace('#', '') }
          },
          fill: {
            fgColor: { rgb: this.options.formatting.headerStyle.backgroundColor.replace('#', '') }
          },
          border: this.getBorderStyle()
        };
      }
    }

    // Apply data formatting
    for (let row = 1; row <= dataLength; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { sz: this.options.formatting.dataStyle.fontSize },
            border: this.getBorderStyle(),
            fill: this.getAlternateRowFill(row)
          };

          // Apply number formatting for numeric cells
          if (worksheet[cellRef].t === 'n') {
            worksheet[cellRef].z = this.options.formatting.numberFormat;
          }
        }
      }
    }

    // Set column widths
    worksheet['!cols'] = Array(range.e.c - range.s.c + 1).fill({ wch: 15 });
  }

  private applyAdvancedFormatting(worksheet: XLSX.WorkSheet, dataLength: number) {
    this.applyFormatting(worksheet, dataLength);
    
    // Add conditional formatting for effectiveness columns
    // Note: XLSX.js has limited conditional formatting support
    // This would be better implemented with a library like ExcelJS
  }

  private getBorderStyle() {
    const style = this.options.formatting.borderStyle;
    return {
      top: { style, color: { rgb: '000000' } },
      bottom: { style, color: { rgb: '000000' } },
      left: { style, color: { rgb: '000000' } },
      right: { style, color: { rgb: '000000' } }
    };
  }

  private getAlternateRowFill(row: number) {
    if (this.options.formatting.dataStyle.alternateRowColor && row % 2 === 0) {
      return {
        fgColor: { rgb: this.options.formatting.dataStyle.alternateRowColor.replace('#', '') }
      };
    }
    return {};
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private generateFile(): Blob {
    const writeOptions: XLSX.WritingOptions = {
      bookType: this.options.format,
      type: 'array',
      compression: true
    };

    const fileData = XLSX.write(this.workbook, writeOptions);
    const mimeType = this.getMimeType();
    
    return new Blob([fileData], { type: mimeType });
  }

  private getMimeType(): string {
    switch (this.options.format) {
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'tsv':
        return 'text/tab-separated-values';
      default:
        return 'application/octet-stream';
    }
  }

  // Static method to create default options
  static createDefaultOptions(): ExcelExportOptions {
    return {
      format: 'xlsx',
      includeCharts: false,
      includeAnalytics: true,
      includePlayerData: true,
      includeStatistics: true,
      includeFormulas: false,
      multipleSheets: true,
      formatting: {
        headerStyle: {
          backgroundColor: '#2980b9',
          fontColor: '#ffffff',
          bold: true,
          fontSize: 11
        },
        dataStyle: {
          fontSize: 10,
          alternateRowColor: '#f8f9fa'
        },
        numberFormat: '#,##0.00',
        dateFormat: 'mm/dd/yyyy',
        percentFormat: '0.00%',
        borderStyle: 'thin'
      },
      filters: {}
    };
  }

  // Utility method to export single sheet quickly
  static async quickExport(plays: PlaySystem[], filename?: string): Promise<void> {
    const options = ExcelExportService.createDefaultOptions();
    options.multipleSheets = false;
    
    const exporter = new ExcelExportService(options);
    const blob = await exporter.exportPlaysToExcel(plays);
    
    const fileName = filename || `hockey_plays_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }

  // Utility method to export with analytics
  static async exportWithAnalytics(plays: PlaySystem[], filename?: string): Promise<void> {
    const options = ExcelExportService.createDefaultOptions();
    
    const exporter = new ExcelExportService(options);
    const blob = await exporter.exportPlaysToExcel(plays);
    
    const fileName = filename || `hockey_playbook_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }
}

export default ExcelExportService;