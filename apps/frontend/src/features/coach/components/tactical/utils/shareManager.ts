/**
 * Sharing utilities for tactical plays
 */

export interface ShareOptions {
  generateLink: boolean;
  linkExpiration: '1hour' | '1day' | '7days' | '30days' | 'never';
  passwordProtected: boolean;
  password?: string;
  allowDownload: boolean;
  allowComments: boolean;
  includeQRCode: boolean;
}

export interface ShareLinkData {
  id: string;
  url: string;
  shortUrl: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
  accessCount: number;
  createdAt: Date;
  isPasswordProtected: boolean;
}

export interface PlayShareData {
  playId: string;
  playName: string;
  teamId?: string;
  coachId?: string;
  shareOptions: ShareOptions;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canComment: boolean;
    canEdit: boolean;
  };
}

export class ShareManager {
  private static readonly BASE_URL = 'https://hockeyhub.app/shared';
  private static readonly API_ENDPOINT = '/api/shares';

  /**
   * Create a shareable link for a tactical play
   */
  static async createShareLink(
    playData: PlayShareData,
    options: ShareOptions
  ): Promise<ShareLinkData> {
    try {
      // In a real implementation, this would call your backend API
      const shareId = this.generateShareId();
      const expirationDate = this.calculateExpirationDate(options.linkExpiration);
      
      const shareLink: ShareLinkData = {
        id: shareId,
        url: `${this.BASE_URL}/${shareId}`,
        shortUrl: `https://hh.app/${shareId.substring(0, 8)}`,
        expiresAt: expirationDate,
        accessCount: 0,
        createdAt: new Date(),
        isPasswordProtected: options.passwordProtected
      };

      // Simulate API call
      await this.simulateAPICall(shareLink, playData, options);

      return shareLink;
    } catch (error) {
      console.error('Failed to create share link:', error);
      throw error;
    }
  }

  /**
   * Generate multiple share links for batch sharing
   */
  static async createBatchShareLinks(
    playsData: PlayShareData[],
    options: ShareOptions
  ): Promise<ShareLinkData[]> {
    const promises = playsData.map(playData => 
      this.createShareLink(playData, options)
    );
    return Promise.all(promises);
  }

  /**
   * Create a temporary link that expires after first view
   */
  static async createOneTimeLink(playData: PlayShareData): Promise<ShareLinkData> {
    const options: ShareOptions = {
      generateLink: true,
      linkExpiration: '1hour',
      passwordProtected: false,
      allowDownload: false,
      allowComments: false,
      includeQRCode: false
    };

    const shareLink = await this.createShareLink(playData, options);
    
    // Mark as one-time use (would be handled by backend)
    (shareLink as any).isOneTimeUse = true;
    
    return shareLink;
  }

  /**
   * Create a playbook share link with all plays
   */
  static async createPlaybookShare(
    playsData: PlayShareData[],
    playbookName: string,
    options: ShareOptions
  ): Promise<ShareLinkData> {
    const combinedData: PlayShareData = {
      playId: `playbook-${Date.now()}`,
      playName: playbookName,
      teamId: playsData[0]?.teamId,
      coachId: playsData[0]?.coachId,
      shareOptions: options,
      permissions: {
        canView: true,
        canDownload: options.allowDownload,
        canComment: options.allowComments,
        canEdit: false
      }
    };

    return this.createShareLink(combinedData, options);
  }

  /**
   * Generate embed code for websites
   */
  static generateEmbedCode(
    shareId: string, 
    options: {
      width?: number;
      height?: number;
      showControls?: boolean;
      autoPlay?: boolean;
      responsive?: boolean;
    } = {}
  ): string {
    const {
      width = 800,
      height = 600,
      showControls = true,
      autoPlay = false,
      responsive = true
    } = options;

    const embedUrl = `${this.BASE_URL}/embed/${shareId}?controls=${showControls}&autoplay=${autoPlay}`;
    
    if (responsive) {
      return `<div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
  <iframe src="${embedUrl}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
          allowfullscreen>
  </iframe>
</div>`;
    } else {
      return `<iframe src="${embedUrl}" 
        width="${width}" 
        height="${height}" 
        frameborder="0" 
        allowfullscreen>
</iframe>`;
    }
  }

  /**
   * Generate social media sharing URLs
   */
  static generateSocialShares(shareLink: ShareLinkData, playName: string) {
    const encodedUrl = encodeURIComponent(shareLink.url);
    const encodedTitle = encodeURIComponent(`Check out this hockey play: ${playName}`);
    const encodedDescription = encodeURIComponent('Hockey tactical play shared via Hockey Hub');

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    };
  }

  /**
   * Generate team sharing options
   */
  static async shareWithTeam(
    playData: PlayShareData,
    teamMembers: Array<{
      id: string;
      name: string;
      email: string;
      role: 'player' | 'coach' | 'staff';
    }>,
    message?: string
  ): Promise<{ success: boolean; notifiedMembers: number }> {
    try {
      // Create internal share link
      const shareLink = await this.createShareLink(playData, {
        generateLink: true,
        linkExpiration: '30days',
        passwordProtected: false,
        allowDownload: true,
        allowComments: true,
        includeQRCode: true
      });

      // Simulate sending notifications to team members
      const notifications = teamMembers.map(member => ({
        to: member.email,
        subject: `New tactical play shared: ${playData.playName}`,
        body: `${message || 'A new tactical play has been shared with the team.'}\n\nView play: ${shareLink.url}`,
        recipientId: member.id,
        recipientRole: member.role
      }));

      // Simulate API call to send notifications
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        notifiedMembers: notifications.length
      };
    } catch (error) {
      console.error('Failed to share with team:', error);
      return {
        success: false,
        notifiedMembers: 0
      };
    }
  }

  /**
   * Copy share URL to clipboard
   */
  static async copyToClipboard(url: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Get share analytics
   */
  static async getShareAnalytics(shareId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    downloads: number;
    comments: number;
    viewsByDay: Array<{ date: string; views: number }>;
    topReferrers: Array<{ source: string; visits: number }>;
    demographics: {
      countries: Record<string, number>;
      devices: Record<string, number>;
    };
  }> {
    // Simulate API call for analytics
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalViews: Math.floor(Math.random() * 100) + 10,
      uniqueViewers: Math.floor(Math.random() * 50) + 5,
      downloads: Math.floor(Math.random() * 20) + 1,
      comments: Math.floor(Math.random() * 10),
      viewsByDay: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 15) + 1
      })),
      topReferrers: [
        { source: 'Direct', visits: Math.floor(Math.random() * 30) + 10 },
        { source: 'Email', visits: Math.floor(Math.random() * 20) + 5 },
        { source: 'Social Media', visits: Math.floor(Math.random() * 15) + 2 }
      ],
      demographics: {
        countries: {
          'United States': Math.floor(Math.random() * 40) + 20,
          'Canada': Math.floor(Math.random() * 30) + 15,
          'Sweden': Math.floor(Math.random() * 15) + 5,
          'Finland': Math.floor(Math.random() * 10) + 3
        },
        devices: {
          'Desktop': Math.floor(Math.random() * 50) + 30,
          'Mobile': Math.floor(Math.random() * 30) + 20,
          'Tablet': Math.floor(Math.random() * 20) + 10
        }
      }
    };
  }

  /**
   * Revoke/disable a share link
   */
  static async revokeShareLink(shareId: string): Promise<boolean> {
    try {
      // Simulate API call to revoke share
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      return false;
    }
  }

  /**
   * Update share permissions
   */
  static async updateSharePermissions(
    shareId: string,
    newOptions: Partial<ShareOptions>
  ): Promise<boolean> {
    try {
      // Simulate API call to update permissions
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Failed to update share permissions:', error);
      return false;
    }
  }

  // Private helper methods
  private static generateShareId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static calculateExpirationDate(expiration: string): Date | undefined {
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
      default:
        return undefined;
    }
  }

  private static async simulateAPICall(
    shareLink: ShareLinkData,
    playData: PlayShareData,
    options: ShareOptions
  ): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // In a real implementation, this would:
    // 1. Store the share data in the database
    // 2. Set up access permissions
    // 3. Configure expiration
    // 4. Generate secure tokens
    // 5. Set up analytics tracking
    
    console.log('Share created:', {
      shareLink,
      playData,
      options
    });
  }

  /**
   * Validate share URL before creating
   */
  static validateShareData(playData: PlayShareData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!playData.playId) {
      errors.push('Play ID is required');
    }

    if (!playData.playName || playData.playName.trim().length === 0) {
      errors.push('Play name is required');
    }

    if (playData.playName && playData.playName.length > 100) {
      errors.push('Play name must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate preview image for social sharing
   */
  static async generateSocialPreview(
    playName: string,
    teamName?: string,
    imageData?: string
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Standard social media preview size
      canvas.width = 1200;
      canvas.height = 630;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(playName, canvas.width / 2, 200);
      
      // Team name
      if (teamName) {
        ctx.font = '32px Arial';
        ctx.fillText(teamName, canvas.width / 2, 260);
      }
      
      // Branding
      ctx.font = '24px Arial';
      ctx.fillText('Hockey Hub', canvas.width / 2, canvas.height - 50);
      
      // If tactical board image is available, add it as a smaller overlay
      if (imageData) {
        const img = new Image();
        img.onload = () => {
          const imgWidth = 300;
          const imgHeight = 150;
          const imgX = canvas.width - imgWidth - 50;
          const imgY = canvas.height - imgHeight - 100;
          
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(canvas.toDataURL('image/png'));
        img.src = imageData;
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    });
  }
}

export default ShareManager;