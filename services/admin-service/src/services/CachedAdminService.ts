import { Logger } from '@hockey-hub/shared-lib/utils/logger';
import { CachedConfigRepository } from '../repositories/CachedConfigRepository';
import { CachedHealthRepository } from '../repositories/CachedHealthRepository';
import { CachedMetricsRepository } from '../repositories/CachedMetricsRepository';
import { ConfigScope } from '../entities/SystemConfiguration';
import { ServiceName } from '../entities/ServiceHealth';
import { MetricType, MetricPeriod } from '../entities/SystemMetrics';

export class CachedAdminService {
  private logger: Logger;
  private configRepo: CachedConfigRepository;
  private healthRepo: CachedHealthRepository;
  private metricsRepo: CachedMetricsRepository;

  constructor() {
    this.logger = new Logger('CachedAdminService');
    this.configRepo = new CachedConfigRepository();
    this.healthRepo = new CachedHealthRepository();
    this.metricsRepo = new CachedMetricsRepository();
  }

  // Dashboard methods
  async getAdminDashboardData() {
    this.logger.info('Getting admin dashboard data');

    const [systemHealth, dashboardMetrics, unhealthyServices, anomalies] = await Promise.all([
      this.healthRepo.getSystemHealthScore(),
      this.metricsRepo.getDashboardMetrics(),
      this.healthRepo.getUnhealthyServices(),
      this.metricsRepo.getAnomalies()
    ]);

    return {
      health: {
        score: systemHealth.overall,
        criticalIssues: systemHealth.criticalIssues,
        warnings: systemHealth.warnings,
        unhealthyServices: unhealthyServices.map(s => ({
          name: s.serviceName,
          status: s.status,
          errorRate: s.errorRate,
          responseTime: s.responseTime
        }))
      },
      metrics: {
        users: {
          total: Number(dashboardMetrics.users?.value || '0'),
          growth: dashboardMetrics.users?.changePercentage || 0,
          active: dashboardMetrics.users?.breakdown.activeUsers || 0
        },
        organizations: {
          total: Number(dashboardMetrics.organizations?.value || '0'),
          growth: dashboardMetrics.organizations?.changePercentage || 0,
          active: dashboardMetrics.organizations?.breakdown.activeOrgs || 0
        },
        revenue: {
          total: dashboardMetrics.revenue?.breakdown.totalRevenue || 0,
          recurring: dashboardMetrics.revenue?.breakdown.recurringRevenue || 0,
          growth: dashboardMetrics.revenue?.changePercentage || 0
        },
        apiCalls: {
          total: Number(dashboardMetrics.apiCalls?.value || '0'),
          errorRate: dashboardMetrics.apiCalls?.breakdown.errorRate || 0,
          avgResponseTime: dashboardMetrics.apiCalls?.breakdown.averageResponseTime || 0
        }
      },
      anomalies: anomalies.slice(0, 5).map(a => ({
        type: a.type,
        value: a.value,
        change: a.changePercentage,
        timestamp: a.timestamp
      }))
    };
  }

  async getOrganizationDashboardData(organizationId: string) {
    this.logger.info(`Getting organization dashboard data for ${organizationId}`);

    const [summary, features, orgMetrics, orgHealth] = await Promise.all([
      this.metricsRepo.getOrganizationSummary(organizationId),
      this.configRepo.getFeatureFlags(organizationId),
      this.metricsRepo.getDashboardMetrics(organizationId),
      this.healthRepo.getHealthMetrics()
    ]);

    return {
      summary,
      features,
      performance: {
        apiCalls: Number(orgMetrics.apiCalls?.value || '0'),
        avgResponseTime: orgHealth.avgResponseTime,
        errorRate: orgHealth.avgErrorRate,
        uptime: orgHealth.uptime
      }
    };
  }

  // Service health monitoring
  async getServiceHealth(serviceName?: ServiceName) {
    if (serviceName) {
      const health = await this.healthRepo.getLatestHealth(serviceName);
      const history = await this.healthRepo.getHealthHistory(serviceName, 24);
      const metrics = await this.healthRepo.getHealthMetrics(serviceName);

      return {
        current: health,
        history,
        metrics,
        requiresAttention: health?.requiresAttention() || false
      };
    }

    const allHealth = await this.healthRepo.getAllServicesHealth();
    const systemScore = await this.healthRepo.getSystemHealthScore();

    return {
      services: allHealth,
      systemScore,
      summary: {
        healthy: Object.values(allHealth).filter(h => h?.isHealthy()).length,
        degraded: Object.values(allHealth).filter(h => h?.isDegraded()).length,
        unhealthy: Object.values(allHealth).filter(h => h && !h.isHealthy() && !h.isDegraded()).length
      }
    };
  }

  // Configuration management
  async getConfiguration(key: string, scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string) {
    return this.configRepo.getValue(key, scope, scopeId);
  }

  async setConfiguration(key: string, value: any, scope: ConfigScope = ConfigScope.SYSTEM, scopeId?: string) {
    return this.configRepo.set(key, value, scope, scopeId);
  }

  async getConfigurationsByCategory(category: string, organizationId?: string) {
    const configs = await this.configRepo.findByCategory(category, ConfigScope.ORGANIZATION, organizationId);
    
    return configs.map(config => ({
      key: config.key,
      value: config.getValue(),
      type: config.type,
      description: config.description,
      validation: config.validation,
      isReadOnly: config.isReadOnly
    }));
  }

  // Metrics and analytics
  async getMetricTrends(type: MetricType, days: number = 30, organizationId?: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [daily, weekly, monthly] = await Promise.all([
      this.metricsRepo.getMetricHistory(type, MetricPeriod.DAILY, startDate, endDate, organizationId),
      this.metricsRepo.getMetricHistory(type, MetricPeriod.WEEKLY, startDate, endDate, organizationId),
      this.metricsRepo.getMetricHistory(type, MetricPeriod.MONTHLY, startDate, endDate, organizationId)
    ]);

    const growth = await this.metricsRepo.getGrowthMetrics(type, organizationId);

    return {
      daily: daily.map(m => ({
        date: m.timestamp,
        value: Number(m.value),
        change: m.changePercentage
      })),
      weekly: weekly.map(m => ({
        date: m.timestamp,
        value: Number(m.value),
        change: m.changePercentage
      })),
      monthly: monthly.map(m => ({
        date: m.timestamp,
        value: Number(m.value),
        change: m.changePercentage
      })),
      growth
    };
  }

  // System monitoring
  async getSystemStatus() {
    const [health, metrics, configs] = await Promise.all([
      this.healthRepo.getSystemHealthScore(),
      this.metricsRepo.getDashboardMetrics(),
      this.configRepo.getPublicConfigs()
    ]);

    return {
      status: health.overall >= 80 ? 'healthy' : health.overall >= 60 ? 'degraded' : 'unhealthy',
      healthScore: health.overall,
      services: {
        total: Object.keys(ServiceName).length,
        healthy: Object.values(health.byService).filter(score => score >= 80).length,
        issues: health.criticalIssues.length + health.warnings.length
      },
      performance: {
        apiCalls: Number(metrics.apiCalls?.value || '0'),
        errorRate: metrics.apiCalls?.breakdown.errorRate || 0,
        avgResponseTime: metrics.apiCalls?.breakdown.averageResponseTime || 0,
        uptime: metrics.performance?.breakdown.uptime || 0
      },
      configuration: {
        totalConfigs: configs.length,
        categories: [...new Set(configs.map(c => c.category))]
      }
    };
  }

  // Feature flags
  async getFeatureFlag(flag: string, organizationId?: string): Promise<boolean> {
    const flags = await this.configRepo.getFeatureFlags(organizationId);
    return flags[flag] || false;
  }

  async setFeatureFlag(flag: string, enabled: boolean, organizationId?: string): Promise<void> {
    await this.configRepo.set(
      flag,
      enabled,
      organizationId ? ConfigScope.ORGANIZATION : ConfigScope.SYSTEM,
      organizationId
    );
  }

  // Maintenance operations
  async performHealthCheck(): Promise<void> {
    // This would trigger health checks for all services
    this.logger.info('Performing system-wide health check');
    
    // In a real implementation, this would:
    // 1. Call health endpoints for all services
    // 2. Record the results
    // 3. Send alerts if needed
  }

  async cleanupOldData(daysToKeep: number = 30): Promise<{
    healthRecords: number;
    metrics: number;
    auditLogs: number;
  }> {
    const healthDeleted = await this.healthRepo.cleanupOldHealth(daysToKeep);
    
    // TODO: Implement cleanup for metrics and audit logs
    
    return {
      healthRecords: healthDeleted,
      metrics: 0,
      auditLogs: 0
    };
  }
}