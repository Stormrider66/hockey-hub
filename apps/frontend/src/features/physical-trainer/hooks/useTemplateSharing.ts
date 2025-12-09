import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { 
  WorkoutTemplate, 
  TemplateShareSettings,
  TemplatePermission,
  SharedTemplateInfo
} from '../types/template.types';

export interface ShareRecipient {
  id: string;
  type: 'user' | 'team' | 'organization';
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface TemplateShareData {
  templateId: string;
  recipients: ShareRecipient[];
  permission: TemplatePermission;
  message?: string;
  expiresAt?: Date;
  allowPublicLink: boolean;
  notifyRecipients: boolean;
}

export interface SharedTemplateStats {
  totalShares: number;
  activeShares: number;
  totalUses: number;
  lastUsed?: Date;
  topUsers: Array<{
    userId: string;
    userName: string;
    useCount: number;
  }>;
}

export const useTemplateSharing = () => {
  const { t } = useTranslation(['physicalTrainer']);
  const [loading, setLoading] = useState(false);
  const [sharedTemplates, setSharedTemplates] = useState<SharedTemplateInfo[]>([]);
  const [shareStats, setShareStats] = useState<Record<string, SharedTemplateStats>>({});

  // Share a template with users/teams
  const shareTemplate = useCallback(async (data: TemplateShareData) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful share
      const shareInfo: SharedTemplateInfo = {
        id: `share_${Date.now()}`,
        templateId: data.templateId,
        sharedBy: 'current_user',
        sharedWith: data.recipients.map(r => ({
          id: r.id,
          type: r.type,
          name: r.name,
          permission: data.permission
        })),
        permission: data.permission,
        sharedAt: new Date(),
        expiresAt: data.expiresAt,
        publicLink: data.allowPublicLink ? `https://hockeyhub.com/shared/template/${data.templateId}` : undefined,
        message: data.message,
        stats: {
          views: 0,
          uses: 0,
          lastAccessed: null
        }
      };

      setSharedTemplates(prev => [...prev, shareInfo]);
      
      if (data.notifyRecipients) {
        toast.success(t('templates.share.notificationsSent', { 
          count: data.recipients.length 
        }));
      }
      
      toast.success(t('templates.share.success'));
      return { success: true, shareInfo };
    } catch (error) {
      toast.error(t('templates.share.error'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Update share permissions
  const updateSharePermissions = useCallback(async (
    shareId: string, 
    permission: TemplatePermission
  ) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSharedTemplates(prev => 
        prev.map(share => 
          share.id === shareId 
            ? { ...share, permission }
            : share
        )
      );
      
      toast.success(t('templates.share.permissionsUpdated'));
      return { success: true };
    } catch (error) {
      toast.error(t('templates.share.updateError'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Revoke template share
  const revokeShare = useCallback(async (shareId: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSharedTemplates(prev => prev.filter(share => share.id !== shareId));
      toast.success(t('templates.share.revoked'));
      return { success: true };
    } catch (error) {
      toast.error(t('templates.share.revokeError'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Generate public share link
  const generatePublicLink = useCallback(async (
    templateId: string,
    expiresIn?: number // hours
  ) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const link = `https://hockeyhub.com/public/template/${templateId}?token=${Date.now()}`;
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
        : undefined;
      
      toast.success(t('templates.share.linkGenerated'));
      return { 
        success: true, 
        link,
        expiresAt
      };
    } catch (error) {
      toast.error(t('templates.share.linkError'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Get share statistics
  const getShareStats = useCallback(async (templateId: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock statistics
      const stats: SharedTemplateStats = {
        totalShares: 12,
        activeShares: 8,
        totalUses: 156,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        topUsers: [
          { userId: 'user1', userName: 'Coach Johnson', useCount: 45 },
          { userId: 'user2', userName: 'Coach Smith', useCount: 32 },
          { userId: 'user3', userName: 'Coach Davis', useCount: 28 }
        ]
      };
      
      setShareStats(prev => ({ ...prev, [templateId]: stats }));
      return { success: true, stats };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Track template usage
  const trackTemplateUse = useCallback(async (
    templateId: string,
    action: 'view' | 'use' | 'duplicate'
  ) => {
    try {
      // Mock API call - fire and forget
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update local stats
      setShareStats(prev => {
        const currentStats = prev[templateId];
        if (!currentStats) return prev;
        
        return {
          ...prev,
          [templateId]: {
            ...currentStats,
            totalUses: currentStats.totalUses + (action === 'use' ? 1 : 0),
            lastUsed: action === 'use' ? new Date() : currentStats.lastUsed
          }
        };
      });
    } catch (error) {
      // Silently fail - don't interrupt user flow
      console.error('Failed to track template usage:', error);
    }
  }, []);

  // Search for users/teams to share with
  const searchRecipients = useCallback(async (query: string): Promise<ShareRecipient[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock search results
      const mockUsers: ShareRecipient[] = [
        {
          id: 'user1',
          type: 'user',
          name: 'Coach Johnson',
          email: 'johnson@team.com',
          avatarUrl: '/avatars/johnson.jpg'
        },
        {
          id: 'user2',
          type: 'user',
          name: 'Coach Smith',
          email: 'smith@team.com',
          avatarUrl: '/avatars/smith.jpg'
        },
        {
          id: 'team1',
          type: 'team',
          name: 'U18 Coaching Staff',
          avatarUrl: '/teams/u18.jpg'
        },
        {
          id: 'team2',
          type: 'team',
          name: 'Senior Team Trainers',
          avatarUrl: '/teams/senior.jpg'
        },
        {
          id: 'org1',
          type: 'organization',
          name: 'Hockey Club Training Department'
        }
      ];
      
      return mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Failed to search recipients:', error);
      return [];
    }
  }, []);

  // Get templates shared with me
  const getSharedWithMe = useCallback(async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock shared templates
      const templates: Array<WorkoutTemplate & { sharedBy: string; permission: TemplatePermission }> = [
        {
          id: 'shared1',
          name: 'Elite Power Development',
          description: 'High-intensity power workout for elite players',
          category: 'strength',
          tags: ['power', 'elite', 'explosive'],
          exercises: [],
          createdBy: 'coach_wilson',
          sharedBy: 'Coach Wilson',
          permission: 'viewer',
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date('2024-12-20'),
          isPublic: false,
          usageCount: 45,
          rating: 4.8
        },
        {
          id: 'shared2',
          name: 'Pre-Season Conditioning',
          description: 'Complete conditioning program for pre-season preparation',
          category: 'conditioning',
          tags: ['cardio', 'endurance', 'pre-season'],
          exercises: [],
          createdBy: 'trainer_garcia',
          sharedBy: 'Trainer Garcia',
          permission: 'collaborator',
          createdAt: new Date('2024-11-10'),
          updatedAt: new Date('2024-12-18'),
          isPublic: false,
          usageCount: 67,
          rating: 4.9
        }
      ];
      
      return { success: true, templates };
    } catch (error) {
      toast.error(t('templates.share.fetchError'));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [t]);

  return {
    loading,
    sharedTemplates,
    shareStats,
    shareTemplate,
    updateSharePermissions,
    revokeShare,
    generatePublicLink,
    getShareStats,
    trackTemplateUse,
    searchRecipients,
    getSharedWithMe
  };
};