// @ts-nocheck
import { Logger } from '@hockey-hub/shared-lib/utils/logger';
import { CachedInvoiceRepository } from '../repositories/CachedInvoiceRepository';
import { CachedSubscriptionRepository } from '../repositories/CachedSubscriptionRepository';
import { CachedPaymentMethodRepository } from '../repositories/CachedPaymentMethodRepository';
import { InvoiceStatus } from '../entities/Invoice';
import { SubscriptionTier } from '../entities/Subscription';

export class CachedPaymentService {
  private logger: Logger;
  private invoiceRepo: CachedInvoiceRepository;
  private subscriptionRepo: CachedSubscriptionRepository;
  private paymentMethodRepo: CachedPaymentMethodRepository;

  constructor() {
    this.logger = new Logger('CachedPaymentService');
    this.invoiceRepo = new CachedInvoiceRepository();
    this.subscriptionRepo = new CachedSubscriptionRepository();
    this.paymentMethodRepo = new CachedPaymentMethodRepository();
  }

  // Dashboard methods optimized for different user roles
  async getAdminDashboardData(organizationId: string) {
    this.logger.info(`Getting admin dashboard data for organization ${organizationId}`);

    const [invoiceSummary, subscription, analytics] = await Promise.all([
      this.invoiceRepo.getDashboardSummary(organizationId),
      this.subscriptionRepo.findByOrganization(organizationId),
      this.subscriptionRepo.getSubscriptionAnalytics(organizationId)
    ]);

    return {
      billing: {
        ...invoiceSummary,
        currentPlan: subscription?.tier || 'none',
        nextBillingDate: subscription?.currentPeriodEnd || null
      },
      subscription: analytics,
      features: subscription?.features || null
    };
  }

  async getPlayerDashboardData(userId: string, organizationId: string) {
    this.logger.info(`Getting player dashboard payment data for user ${userId}`);

    const [subscription, userInvoices] = await Promise.all([
      this.subscriptionRepo.findByOrganization(organizationId),
      this.invoiceRepo.findByUser(userId, InvoiceStatus.PENDING)
    ]);

    return {
      subscriptionStatus: subscription?.status || 'none',
      subscriptionTier: subscription?.tier || 'none',
      pendingPayments: userInvoices.length,
      totalDue: userInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
    };
  }

  async getParentDashboardData(userId: string) {
    this.logger.info(`Getting parent dashboard payment data for user ${userId}`);

    const [invoices, paymentMethods] = await Promise.all([
      this.invoiceRepo.findByUser(userId),
      this.paymentMethodRepo.findByUser(userId)
    ]);

    const pendingInvoices = invoices.filter(inv => 
      inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.PARTIAL
    );

    const recentPayments = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .slice(0, 5);

    return {
      pendingInvoices: pendingInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        balanceDue: inv.balanceDue
      })),
      recentPayments: recentPayments.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        paidDate: inv.paidDate,
        amount: inv.totalAmount
      })),
      paymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        display: pm.getMaskedDisplay(),
        isDefault: pm.isDefault,
        isExpired: pm.isExpired()
      })),
      totalDue: pendingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
    };
  }

  async getCoachDashboardData(organizationId: string) {
    this.logger.info(`Getting coach dashboard payment data for organization ${organizationId}`);

    const features = await this.subscriptionRepo.getOrganizationFeatures(organizationId);

    return {
      subscriptionFeatures: {
        hasAdvancedAnalytics: features.hasAdvancedAnalytics,
        hasVideoAnalysis: features.hasVideoAnalysis,
        maxPlayers: features.maxPlayers,
        dataRetentionDays: features.dataRetentionDays
      }
    };
  }

  // Billing operations
  async getUpcomingInvoices(organizationId: string) {
    const invoices = await this.invoiceRepo.findByOrganization(
      organizationId, 
      InvoiceStatus.PENDING
    );
    
    return invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return dueDate <= thirtyDaysFromNow;
    });
  }

  async getOverdueInvoices(organizationId: string) {
    return this.invoiceRepo.findOverdueInvoices(organizationId);
  }

  // Subscription management
  async checkFeatureAccess(organizationId: string, feature: string): Promise<boolean> {
    const features = await this.subscriptionRepo.getOrganizationFeatures(organizationId);
    return features[feature] === true;
  }

  async checkUsageLimit(organizationId: string, resource: 'users' | 'teams' | 'players'): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
  }> {
    const analytics = await this.subscriptionRepo.getSubscriptionAnalytics(organizationId);
    const features = await this.subscriptionRepo.getOrganizationFeatures(organizationId);
    
    // TODO: Get actual usage from other services
    const mockUsage = {
      users: 15,
      teams: 3,
      players: 45
    };

    const limit = features[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
    const current = mockUsage[resource];

    return {
      allowed: current < limit,
      current,
      limit
    };
  }

  // Payment method management
  async getActivePaymentMethods(userId: string) {
    const methods = await this.paymentMethodRepo.findByUser(userId);
    return methods.filter(m => !m.isExpired());
  }

  async notifyExpiringCards() {
    const expiringCards = await this.paymentMethodRepo.getExpiringCards(30);
    
    // TODO: Send notifications via Communication Service
    this.logger.info(`Found ${expiringCards.length} expiring cards to notify`);
    
    return expiringCards;
  }

  // Revenue analytics
  async getRevenueMetrics(organizationId: string, startDate?: Date, endDate?: Date) {
    const invoices = await this.invoiceRepo.findByOrganization(organizationId);
    
    const filteredInvoices = invoices.filter(inv => {
      if (startDate && new Date(inv.issueDate) < startDate) return false;
      if (endDate && new Date(inv.issueDate) > endDate) return false;
      return true;
    });

    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);

    const pendingRevenue = filteredInvoices
      .filter(inv => inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.PARTIAL)
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    const monthlyBreakdown = filteredInvoices.reduce((acc, inv) => {
      const month = new Date(inv.issueDate).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { revenue: 0, invoices: 0 };
      }
      if (inv.status === InvoiceStatus.PAID) {
        acc[month].revenue += inv.paidAmount;
      }
      acc[month].invoices++;
      return acc;
    }, {} as Record<string, { revenue: number; invoices: number }>);

    return {
      totalRevenue,
      pendingRevenue,
      monthlyBreakdown,
      averageInvoiceValue: totalRevenue / filteredInvoices.filter(inv => inv.status === InvoiceStatus.PAID).length || 0
    };
  }
}