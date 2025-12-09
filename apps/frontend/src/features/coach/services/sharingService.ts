import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

// Share link types and permissions
export type SharePermission = 'view' | 'comment' | 'edit' | 'download' | 'admin';
export type ShareExpiration = 'never' | '1hour' | '1day' | '7days' | '30days' | '90days' | '1year';
export type ShareStatus = 'active' | 'expired' | 'disabled' | 'pending';
export type ShareType = 'play' | 'playbook' | 'analysis' | 'video' | 'export';

// Share link interfaces
export interface ShareLink {
  id: string;
  shareCode: string;
  url: string;
  qrCode?: string;
  title: string;
  description?: string;
  type: ShareType;
  resourceId: string;
  resourceData?: any;
  
  // Security settings
  permissions: SharePermission[];
  passwordProtected: boolean;
  password?: string;
  allowAnonymous: boolean;
  requireEmail: boolean;
  
  // Access control
  expiration: ShareExpiration;
  expiresAt?: Date;
  maxViews?: number;
  currentViews: number;
  maxDownloads?: number;
  currentDownloads: number;
  
  // User management
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  allowedUsers?: string[];
  allowedDomains?: string[];
  
  // Analytics
  status: ShareStatus;
  lastAccessedAt?: Date;
  accessLog: ShareAccessLog[];
  analytics: ShareAnalytics;
  
  // Customization
  customBranding?: ShareBranding;
  customMessage?: string;
  redirectAfterView?: string;
  
  // Metadata
  tags: string[];
  category?: string;
  isPublic: boolean;
  isFeatured?: boolean;
}

export interface ShareAccessLog {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  action: 'view' | 'download' | 'comment' | 'share';
  success: boolean;
  errorMessage?: string;
  duration?: number;
  referrer?: string;
}

export interface ShareAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalDownloads: number;
  averageViewDuration: number;
  viewsByDay: Record<string, number>;
  viewsByCountry: Record<string, number>;
  viewsByDevice: Record<string, number>;
  popularityScore: number;
  engagementRate: number;
  lastUpdated: Date;
}

export interface ShareBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  organizationName: string;
  customCSS?: string;
  favicon?: string;
}

export interface CreateShareLinkOptions {
  title: string;
  description?: string;
  type: ShareType;
  resourceId: string;
  resourceData?: any;
  
  // Security
  permissions: SharePermission[];
  passwordProtected?: boolean;
  password?: string;
  allowAnonymous?: boolean;
  requireEmail?: boolean;
  
  // Access control
  expiration?: ShareExpiration;
  maxViews?: number;
  maxDownloads?: number;
  allowedUsers?: string[];
  allowedDomains?: string[];
  
  // Customization
  customBranding?: ShareBranding;
  customMessage?: string;
  redirectAfterView?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  
  // Advanced options
  generateQRCode?: boolean;
  enableAnalytics?: boolean;
  trackLocation?: boolean;
  requireSignIn?: boolean;
  watermark?: string;
}

export interface ShareLinkValidation {
  isValid: boolean;
  canAccess: boolean;
  errors: string[];
  warnings: string[];
  requiresAuthentication: boolean;
  requiresPassword: boolean;
  isExpired: boolean;
  isOverLimit: boolean;
  allowedActions: SharePermission[];
}

export interface ShareStats {
  totalShares: number;
  activeShares: number;
  totalViews: number;
  totalDownloads: number;
  popularShares: ShareLink[];
  recentActivity: ShareAccessLog[];
  viewsByPeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topCategories: Array<{ category: string; count: number }>;
  topCountries: Array<{ country: string; views: number }>;
}

// Share Link Service
export class SharingService {
  private baseUrl: string = 'https://hockeyhub.app/shared';
  private apiKey: string = process.env.NEXT_PUBLIC_SHARING_API_KEY || 'dev-key';
  private encryptionKey: string = 'HockeyHub-Share-Encryption-Key-2024';
  
  // Create a new share link
  async createShareLink(options: CreateShareLinkOptions): Promise<ShareLink> {
    try {
      const shareCode = this.generateShareCode();
      const shareLink: ShareLink = {
        id: uuidv4(),
        shareCode,
        url: `${this.baseUrl}/${shareCode}`,
        title: options.title,
        description: options.description,
        type: options.type,
        resourceId: options.resourceId,
        resourceData: options.resourceData,
        
        // Security settings
        permissions: options.permissions,
        passwordProtected: options.passwordProtected || false,
        password: options.passwordProtected ? this.hashPassword(options.password!) : undefined,
        allowAnonymous: options.allowAnonymous !== false,
        requireEmail: options.requireEmail || false,
        
        // Access control
        expiration: options.expiration || 'never',
        expiresAt: this.calculateExpirationDate(options.expiration || 'never'),
        maxViews: options.maxViews,
        currentViews: 0,
        maxDownloads: options.maxDownloads,
        currentDownloads: 0,
        
        // User management
        createdBy: 'current-user-id', // Would come from auth context
        createdAt: new Date(),
        updatedAt: new Date(),
        allowedUsers: options.allowedUsers,
        allowedDomains: options.allowedDomains,
        
        // Analytics
        status: 'active',
        accessLog: [],
        analytics: {
          totalViews: 0,
          uniqueViews: 0,
          totalDownloads: 0,
          averageViewDuration: 0,
          viewsByDay: {},
          viewsByCountry: {},
          viewsByDevice: {},
          popularityScore: 0,
          engagementRate: 0,
          lastUpdated: new Date()
        },
        
        // Customization
        customBranding: options.customBranding,
        customMessage: options.customMessage,
        redirectAfterView: options.redirectAfterView,
        
        // Metadata
        tags: options.tags || [],
        category: options.category,
        isPublic: options.isPublic !== false,
        isFeatured: false
      };

      // Generate QR code if requested
      if (options.generateQRCode) {
        shareLink.qrCode = await this.generateQRCode(shareLink.url);
      }

      // Store the share link (in real implementation, this would be an API call)
      await this.storeShareLink(shareLink);

      return shareLink;

    } catch (error) {
      console.error('Failed to create share link:', error);
      throw new Error(`Failed to create share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate a share link access
  async validateShareLink(shareCode: string, password?: string, userContext?: any): Promise<ShareLinkValidation> {
    try {
      const shareLink = await this.getShareLink(shareCode);
      
      if (!shareLink) {
        return {
          isValid: false,
          canAccess: false,
          errors: ['Share link not found'],
          warnings: [],
          requiresAuthentication: false,
          requiresPassword: false,
          isExpired: false,
          isOverLimit: false,
          allowedActions: []
        };
      }

      const validation: ShareLinkValidation = {
        isValid: true,
        canAccess: true,
        errors: [],
        warnings: [],
        requiresAuthentication: false,
        requiresPassword: false,
        isExpired: false,
        isOverLimit: false,
        allowedActions: [...shareLink.permissions]
      };

      // Check if expired
      if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
        validation.isValid = false;
        validation.canAccess = false;
        validation.isExpired = true;
        validation.errors.push('Share link has expired');
      }

      // Check if disabled
      if (shareLink.status !== 'active') {
        validation.isValid = false;
        validation.canAccess = false;
        validation.errors.push(`Share link is ${shareLink.status}`);
      }

      // Check view limits
      if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
        validation.canAccess = false;
        validation.isOverLimit = true;
        validation.errors.push('Maximum view limit reached');
      }

      // Check password protection
      if (shareLink.passwordProtected) {
        validation.requiresPassword = true;
        if (!password) {
          validation.canAccess = false;
          validation.errors.push('Password required');
        } else if (!this.verifyPassword(password, shareLink.password!)) {
          validation.canAccess = false;
          validation.errors.push('Invalid password');
        }
      }

      // Check user permissions
      if (shareLink.allowedUsers && shareLink.allowedUsers.length > 0) {
        validation.requiresAuthentication = true;
        if (!userContext?.userId || !shareLink.allowedUsers.includes(userContext.userId)) {
          validation.canAccess = false;
          validation.errors.push('User not authorized');
        }
      }

      // Check domain restrictions
      if (shareLink.allowedDomains && shareLink.allowedDomains.length > 0) {
        if (!userContext?.email) {
          validation.canAccess = false;
          validation.errors.push('Email verification required');
        } else {
          const userDomain = userContext.email.split('@')[1];
          if (!shareLink.allowedDomains.includes(userDomain)) {
            validation.canAccess = false;
            validation.errors.push('Domain not authorized');
          }
        }
      }

      // Check if anonymous access is allowed
      if (!shareLink.allowAnonymous && !userContext?.userId) {
        validation.requiresAuthentication = true;
        validation.canAccess = false;
        validation.errors.push('Authentication required');
      }

      // Add warnings
      if (shareLink.expiresAt) {
        const hoursUntilExpiry = (shareLink.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 24) {
          validation.warnings.push(`Link expires in ${Math.round(hoursUntilExpiry)} hours`);
        }
      }

      if (shareLink.maxViews) {
        const remainingViews = shareLink.maxViews - shareLink.currentViews;
        if (remainingViews < 10) {
          validation.warnings.push(`Only ${remainingViews} views remaining`);
        }
      }

      return validation;

    } catch (error) {
      console.error('Failed to validate share link:', error);
      return {
        isValid: false,
        canAccess: false,
        errors: ['Validation failed'],
        warnings: [],
        requiresAuthentication: false,
        requiresPassword: false,
        isExpired: false,
        isOverLimit: false,
        allowedActions: []
      };
    }
  }

  // Access a share link
  async accessShareLink(
    shareCode: string, 
    action: SharePermission = 'view',
    context?: {
      password?: string;
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
      userId?: string;
      userEmail?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string; requiresPassword?: boolean }> {
    try {
      const validation = await this.validateShareLink(shareCode, context?.password, {
        userId: context?.userId,
        email: context?.userEmail
      });

      if (!validation.canAccess) {
        return {
          success: false,
          error: validation.errors.join(', '),
          requiresPassword: validation.requiresPassword
        };
      }

      if (!validation.allowedActions.includes(action)) {
        return {
          success: false,
          error: `Action '${action}' not permitted`
        };
      }

      const shareLink = await this.getShareLink(shareCode);
      if (!shareLink) {
        return { success: false, error: 'Share link not found' };
      }

      // Log the access
      const accessLog: ShareAccessLog = {
        id: uuidv4(),
        timestamp: new Date(),
        userId: context?.userId,
        userEmail: context?.userEmail,
        ipAddress: context?.ipAddress || '127.0.0.1',
        userAgent: context?.userAgent || 'Unknown',
        action,
        success: true,
        referrer: context?.referrer
      };

      // Update analytics
      await this.updateShareAnalytics(shareCode, accessLog);

      // Return resource data based on type
      const resourceData = await this.getResourceData(shareLink);

      return {
        success: true,
        data: {
          shareLink,
          resourceData,
          permissions: validation.allowedActions,
          analytics: shareLink.analytics
        }
      };

    } catch (error) {
      console.error('Failed to access share link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update share link settings
  async updateShareLink(shareCode: string, updates: Partial<CreateShareLinkOptions>): Promise<ShareLink> {
    try {
      const shareLink = await this.getShareLink(shareCode);
      if (!shareLink) {
        throw new Error('Share link not found');
      }

      // Apply updates
      const updatedLink: ShareLink = {
        ...shareLink,
        ...updates,
        updatedAt: new Date()
      };

      // Handle password update
      if (updates.passwordProtected !== undefined) {
        updatedLink.passwordProtected = updates.passwordProtected;
        if (updates.passwordProtected && updates.password) {
          updatedLink.password = this.hashPassword(updates.password);
        } else if (!updates.passwordProtected) {
          updatedLink.password = undefined;
        }
      }

      // Handle expiration update
      if (updates.expiration) {
        updatedLink.expiration = updates.expiration;
        updatedLink.expiresAt = this.calculateExpirationDate(updates.expiration);
      }

      // Regenerate QR code if URL or settings changed
      if (updates.generateQRCode) {
        updatedLink.qrCode = await this.generateQRCode(updatedLink.url);
      }

      await this.storeShareLink(updatedLink);
      return updatedLink;

    } catch (error) {
      console.error('Failed to update share link:', error);
      throw new Error(`Failed to update share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete/disable share link
  async deleteShareLink(shareCode: string): Promise<boolean> {
    try {
      const shareLink = await this.getShareLink(shareCode);
      if (!shareLink) {
        return false;
      }

      shareLink.status = 'disabled';
      shareLink.updatedAt = new Date();
      
      await this.storeShareLink(shareLink);
      return true;

    } catch (error) {
      console.error('Failed to delete share link:', error);
      return false;
    }
  }

  // Get share link by code
  async getShareLink(shareCode: string): Promise<ShareLink | null> {
    try {
      // In real implementation, this would be an API call
      const stored = localStorage.getItem(`share_${shareCode}`);
      if (!stored) return null;
      
      const shareLink = JSON.parse(stored) as ShareLink;
      
      // Convert date strings back to Date objects
      shareLink.createdAt = new Date(shareLink.createdAt);
      shareLink.updatedAt = new Date(shareLink.updatedAt);
      if (shareLink.expiresAt) {
        shareLink.expiresAt = new Date(shareLink.expiresAt);
      }
      if (shareLink.lastAccessedAt) {
        shareLink.lastAccessedAt = new Date(shareLink.lastAccessedAt);
      }
      
      return shareLink;

    } catch (error) {
      console.error('Failed to get share link:', error);
      return null;
    }
  }

  // List share links for a user
  async listShareLinks(userId: string, filters?: {
    type?: ShareType;
    status?: ShareStatus;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ links: ShareLink[]; total: number }> {
    try {
      // In real implementation, this would be an API call
      const allLinks: ShareLink[] = [];
      
      // Get all stored share links (simplified for demo)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('share_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const link = JSON.parse(stored) as ShareLink;
            if (link.createdBy === userId) {
              allLinks.push(link);
            }
          }
        }
      }

      // Apply filters
      let filtered = allLinks;
      if (filters?.type) {
        filtered = filtered.filter(link => link.type === filters.type);
      }
      if (filters?.status) {
        filtered = filtered.filter(link => link.status === filters.status);
      }
      if (filters?.category) {
        filtered = filtered.filter(link => link.category === filters.category);
      }

      // Sort by created date (newest first)
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 50;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        links: paginated,
        total: filtered.length
      };

    } catch (error) {
      console.error('Failed to list share links:', error);
      return { links: [], total: 0 };
    }
  }

  // Get sharing statistics
  async getShareStats(userId: string): Promise<ShareStats> {
    try {
      const { links } = await this.listShareLinks(userId);
      
      const totalShares = links.length;
      const activeShares = links.filter(link => link.status === 'active').length;
      const totalViews = links.reduce((sum, link) => sum + link.analytics.totalViews, 0);
      const totalDownloads = links.reduce((sum, link) => sum + link.analytics.totalDownloads, 0);

      // Get popular shares (top 10 by views)
      const popularShares = links
        .filter(link => link.analytics.totalViews > 0)
        .sort((a, b) => b.analytics.totalViews - a.analytics.totalViews)
        .slice(0, 10);

      // Get recent activity (last 50 access logs)
      const recentActivity: ShareAccessLog[] = [];
      links.forEach(link => {
        recentActivity.push(...link.accessLog);
      });
      recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      recentActivity.splice(50);

      // Calculate views by period
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const viewsByPeriod = {
        today: recentActivity.filter(log => log.timestamp >= today && log.action === 'view').length,
        thisWeek: recentActivity.filter(log => log.timestamp >= thisWeek && log.action === 'view').length,
        thisMonth: recentActivity.filter(log => log.timestamp >= thisMonth && log.action === 'view').length
      };

      // Get top categories
      const categoryCount = links.reduce((acc, link) => {
        if (link.category) {
          acc[link.category] = (acc[link.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get top countries (from analytics)
      const countryViews: Record<string, number> = {};
      links.forEach(link => {
        Object.entries(link.analytics.viewsByCountry).forEach(([country, views]) => {
          countryViews[country] = (countryViews[country] || 0) + views;
        });
      });

      const topCountries = Object.entries(countryViews)
        .map(([country, views]) => ({ country, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        totalShares,
        activeShares,
        totalViews,
        totalDownloads,
        popularShares,
        recentActivity,
        viewsByPeriod,
        topCategories,
        topCountries
      };

    } catch (error) {
      console.error('Failed to get share stats:', error);
      return {
        totalShares: 0,
        activeShares: 0,
        totalViews: 0,
        totalDownloads: 0,
        popularShares: [],
        recentActivity: [],
        viewsByPeriod: { today: 0, thisWeek: 0, thisMonth: 0 },
        topCategories: [],
        topCountries: []
      };
    }
  }

  // Generate QR code for share URL
  private async generateQRCode(url: string): Promise<string> {
    try {
      // In real implementation, use a QR code library like qrcode
      // For demo, return a placeholder data URL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 200;
      canvas.height = 200;
      
      // Draw simple QR placeholder
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 10, 180, 180);
      ctx.fillStyle = '#000000';
      
      // Draw some QR-like patterns
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(20 + i * 16, 20 + j * 16, 14, 14);
          }
        }
      }
      
      return canvas.toDataURL('image/png');

    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return ''; // Return empty string as fallback
    }
  }

  // Generate unique share code
  private generateShareCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Hash password for storage
  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.encryptionKey).toString();
  }

  // Verify password
  private verifyPassword(password: string, hash: string): boolean {
    const computed = CryptoJS.SHA256(password + this.encryptionKey).toString();
    return computed === hash;
  }

  // Calculate expiration date
  private calculateExpirationDate(expiration: ShareExpiration): Date | undefined {
    if (expiration === 'never') return undefined;
    
    const now = new Date();
    switch (expiration) {
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case '90days':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case '1year':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }

  // Store share link (mock implementation)
  private async storeShareLink(shareLink: ShareLink): Promise<void> {
    try {
      localStorage.setItem(`share_${shareLink.shareCode}`, JSON.stringify(shareLink));
    } catch (error) {
      console.error('Failed to store share link:', error);
      throw error;
    }
  }

  // Update share analytics
  private async updateShareAnalytics(shareCode: string, accessLog: ShareAccessLog): Promise<void> {
    try {
      const shareLink = await this.getShareLink(shareCode);
      if (!shareLink) return;

      // Add to access log
      shareLink.accessLog.push(accessLog);
      
      // Keep only last 1000 entries
      if (shareLink.accessLog.length > 1000) {
        shareLink.accessLog = shareLink.accessLog.slice(-1000);
      }

      // Update counters
      if (accessLog.action === 'view') {
        shareLink.currentViews++;
        shareLink.analytics.totalViews++;
      } else if (accessLog.action === 'download') {
        shareLink.currentDownloads++;
        shareLink.analytics.totalDownloads++;
      }

      // Update last accessed
      shareLink.lastAccessedAt = accessLog.timestamp;

      // Update daily views
      const dayKey = accessLog.timestamp.toISOString().split('T')[0];
      if (accessLog.action === 'view') {
        shareLink.analytics.viewsByDay[dayKey] = (shareLink.analytics.viewsByDay[dayKey] || 0) + 1;
      }

      // Update device analytics
      const deviceType = this.getDeviceType(accessLog.userAgent);
      shareLink.analytics.viewsByDevice[deviceType] = (shareLink.analytics.viewsByDevice[deviceType] || 0) + 1;

      // Update analytics timestamp
      shareLink.analytics.lastUpdated = new Date();

      // Calculate popularity score (simplified)
      const ageInDays = (Date.now() - shareLink.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      shareLink.analytics.popularityScore = shareLink.analytics.totalViews / Math.max(ageInDays, 1);

      await this.storeShareLink(shareLink);

    } catch (error) {
      console.error('Failed to update share analytics:', error);
    }
  }

  // Get device type from user agent
  private getDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  // Get resource data based on share link type
  private async getResourceData(shareLink: ShareLink): Promise<any> {
    // In real implementation, this would fetch actual resource data
    switch (shareLink.type) {
      case 'play':
        return shareLink.resourceData || { id: shareLink.resourceId, name: 'Hockey Play' };
      case 'playbook':
        return shareLink.resourceData || { id: shareLink.resourceId, name: 'Hockey Playbook' };
      case 'analysis':
        return shareLink.resourceData || { id: shareLink.resourceId, name: 'Game Analysis' };
      default:
        return shareLink.resourceData || { id: shareLink.resourceId };
    }
  }

  // Utility methods for external use
  static generateShareUrl(baseUrl: string, shareCode: string): string {
    return `${baseUrl}/shared/${shareCode}`;
  }

  static isValidShareCode(shareCode: string): boolean {
    return /^[A-Za-z0-9]{12}$/.test(shareCode);
  }

  static parseShareUrl(url: string): string | null {
    const match = url.match(/\/shared\/([A-Za-z0-9]{12})$/);
    return match ? match[1] : null;
  }

  // Bulk operations
  async createBulkShareLinks(options: CreateShareLinkOptions[]): Promise<ShareLink[]> {
    const results: ShareLink[] = [];
    
    for (const option of options) {
      try {
        const shareLink = await this.createShareLink(option);
        results.push(shareLink);
      } catch (error) {
        console.error(`Failed to create share link for ${option.title}:`, error);
        // Continue with other links
      }
    }
    
    return results;
  }

  async updateBulkShareLinks(updates: Array<{ shareCode: string; options: Partial<CreateShareLinkOptions> }>): Promise<ShareLink[]> {
    const results: ShareLink[] = [];
    
    for (const update of updates) {
      try {
        const shareLink = await this.updateShareLink(update.shareCode, update.options);
        results.push(shareLink);
      } catch (error) {
        console.error(`Failed to update share link ${update.shareCode}:`, error);
        // Continue with other links
      }
    }
    
    return results;
  }
}

export default SharingService;