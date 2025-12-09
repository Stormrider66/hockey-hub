import { chatApi } from '@/store/api/chatApi';
import { store } from '@/store/store';
import { toast } from 'react-hot-toast';

// Types for tactical sharing
export interface TacticalShareOptions {
  shareWith: 'team' | 'position_group' | 'individuals' | 'coaching_staff';
  targetIds: string[]; // User IDs or group IDs
  includePreview: boolean;
  includeInstructions: boolean;
  scheduleFor?: Date; // Optional scheduled sharing
  priority: 'normal' | 'important' | 'urgent';
  message?: string; // Custom message from coach
  shareType: 'play_share' | 'formation_update' | 'video_analysis' | 'play_discussion' | 'game_plan';
}

export interface TacticalPlayData {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'faceoff' | 'transition';
  situation: string;
  formation: string;
  data: any; // Tactical board data
  previewImage?: string; // Base64 or URL
  tags: string[];
}

export interface FormationUpdateData {
  formationName: string;
  positions: Array<{
    playerId: string;
    position: string;
    x: number;
    y: number;
    role: string;
    instructions?: string;
  }>;
  situationType: '5v5' | 'powerplay' | 'penalty_kill' | 'faceoff';
  effectiveFrom: Date;
  notes?: string;
}

export interface VideoAnalysisData {
  videoUrl: string;
  title: string;
  clipId?: string;
  timestamps: Array<{
    time: number;
    title: string;
    description: string;
    playType?: string;
    tags?: string[];
  }>;
  tacticalOverlays?: Array<{
    timestamp: number;
    overlayData: any; // SVG or canvas data for tactical overlay
    annotations: string[];
  }>;
  analysisNotes: string;
  relatedPlays?: string[]; // Play system IDs
}

export interface GamePlanData {
  opponent: string;
  gameDate: Date;
  keyStrategies: string[];
  lineupChanges?: Array<{
    line: string;
    players: string[];
    reason: string;
  }>;
  specialInstructions: string[];
  focusAreas: string[];
  pregameRoutine: string[];
  emergencyPlans?: Array<{
    scenario: string;
    response: string;
  }>;
}

export interface TacticalMessageMetadata {
  tacticalType: 'play_share' | 'formation_update' | 'video_analysis' | 'play_discussion' | 'game_plan';
  playData?: TacticalPlayData;
  formationData?: FormationUpdateData;
  videoData?: VideoAnalysisData;
  gamePlanData?: GamePlanData;
  requiresAcknowledgment?: boolean;
  deadline?: Date;
  relatedEventId?: string; // Calendar event ID
  sharedAt: Date;
  sharedBy: string;
}

export interface ShareHistory {
  id: string;
  playId: string;
  playName: string;
  shareType: string;
  sharedWith: string[];
  sharedAt: Date;
  acknowledgments: Array<{
    userId: string;
    acknowledgedAt: Date;
    reaction?: string;
  }>;
  viewCount: number;
  lastViewed: Date;
}

class TacticalCommunicationService {
  private socket: any = null;

  constructor() {
    // Socket will be set later through setSocket method
  }

  public setSocket(socket: any) {
    this.socket = socket;
  }

  // 1. Share Tactical Play with Team
  async sharePlay(
    conversationId: string,
    play: TacticalPlayData,
    options: TacticalShareOptions
  ): Promise<void> {
    try {
      // Generate preview image if not provided
      if (!play.previewImage && options.includePreview) {
        play.previewImage = await this.generatePlayPreview(play);
      }

      // Create tactical message metadata
      const metadata: TacticalMessageMetadata = {
        tacticalType: 'play_share',
        playData: play,
        requiresAcknowledgment: options.priority !== 'normal',
        sharedAt: new Date(),
        sharedBy: this.getCurrentUserId(),
        deadline: options.scheduleFor
      };

      // Format message content
      const messageContent = this.formatPlayShareMessage(play, options);

      // Send message via chat API
      await store.dispatch(
        chatApi.endpoints.sendMessage.initiate({
          conversationId,
          content: messageContent,
          type: 'tactical_play_share' as any,
          metadata: metadata as any,
          attachments: options.includePreview && play.previewImage ? [
            {
              type: 'image',
              url: play.previewImage,
              fileName: `${play.name}_preview.png`,
              fileType: 'image/png'
            }
          ] : []
        })
      );

      // Emit real-time tactical event
      if (this.socket) {
        this.socket.emit('tactical:play_shared', {
          conversationId,
          playId: play.id,
          playName: play.name,
          shareType: options.shareType,
          targetIds: options.targetIds,
          priority: options.priority,
          metadata
        });
      }

      // Save to share history
      await this.saveToShareHistory({
        playId: play.id,
        playName: play.name,
        shareType: options.shareType,
        sharedWith: options.targetIds,
        metadata
      });

      toast.success(`Play "${play.name}" shared with ${options.shareWith.replace('_', ' ')}`);

    } catch (error) {
      console.error('Failed to share tactical play:', error);
      toast.error('Failed to share play. Please try again.');
      throw error;
    }
  }

  // 2. Send Formation Update
  async sendFormationUpdate(
    conversationId: string,
    formation: FormationUpdateData,
    options: TacticalShareOptions
  ): Promise<void> {
    try {
      const metadata: TacticalMessageMetadata = {
        tacticalType: 'formation_update',
        formationData: formation,
        requiresAcknowledgment: true, // Always require acknowledgment for lineup changes
        sharedAt: new Date(),
        sharedBy: this.getCurrentUserId(),
        deadline: formation.effectiveFrom
      };

      const messageContent = this.formatFormationUpdateMessage(formation, options);

      await store.dispatch(
        chatApi.endpoints.sendMessage.initiate({
          conversationId,
          content: messageContent,
          type: 'formation_update' as any,
          metadata: metadata as any
        })
      );

      // Notify specific position groups if targeting them
      if (options.shareWith === 'position_group') {
        await this.notifyPositionGroups(formation, options.targetIds);
      }

      // Real-time notification
      if (this.socket) {
        this.socket.emit('tactical:formation_updated', {
          conversationId,
          formationName: formation.formationName,
          situationType: formation.situationType,
          effectiveFrom: formation.effectiveFrom,
          targetIds: options.targetIds
        });
      }

      toast.success(`Formation update sent - effective ${formation.effectiveFrom.toLocaleDateString()}`);

    } catch (error) {
      console.error('Failed to send formation update:', error);
      toast.error('Failed to send formation update');
      throw error;
    }
  }

  // 3. Share Video Analysis with Tactical Timestamps
  async shareVideoAnalysis(
    conversationId: string,
    videoData: VideoAnalysisData,
    options: TacticalShareOptions
  ): Promise<void> {
    try {
      const metadata: TacticalMessageMetadata = {
        tacticalType: 'video_analysis',
        videoData,
        requiresAcknowledgment: options.priority === 'urgent',
        sharedAt: new Date(),
        sharedBy: this.getCurrentUserId()
      };

      const messageContent = this.formatVideoAnalysisMessage(videoData, options);

      await store.dispatch(
        chatApi.endpoints.sendMessage.initiate({
          conversationId,
          content: messageContent,
          type: 'video_analysis' as any,
          metadata: metadata as any,
          attachments: [{
            type: 'video',
            url: videoData.videoUrl,
            fileName: `${videoData.title}.mp4`,
            fileType: 'video/mp4',
            metadata: {
              duration: videoData.timestamps[videoData.timestamps.length - 1]?.time || 0,
              timestamps: videoData.timestamps
            }
          }]
        })
      );

      // Create threaded discussion for video analysis
      if (options.shareType === 'play_discussion') {
        await this.createVideoDiscussionThread(conversationId, videoData);
      }

      if (this.socket) {
        this.socket.emit('tactical:video_shared', {
          conversationId,
          videoTitle: videoData.title,
          timestampCount: videoData.timestamps.length,
          targetIds: options.targetIds
        });
      }

      toast.success(`Video analysis "${videoData.title}" shared with ${videoData.timestamps.length} key moments`);

    } catch (error) {
      console.error('Failed to share video analysis:', error);
      toast.error('Failed to share video analysis');
      throw error;
    }
  }

  // 4. Create Play Discussion Thread
  async createPlayDiscussion(
    conversationId: string,
    play: TacticalPlayData,
    discussionTopic: string,
    options: TacticalShareOptions
  ): Promise<string> {
    try {
      const metadata: TacticalMessageMetadata = {
        tacticalType: 'play_discussion',
        playData: play,
        sharedAt: new Date(),
        sharedBy: this.getCurrentUserId()
      };

      const messageContent = `🏒 **TACTICAL DISCUSSION: ${play.name}**\n\n**Topic:** ${discussionTopic}\n\n**Play Details:**\n- Category: ${play.category}\n- Situation: ${play.situation}\n- Formation: ${play.formation}\n\n${play.description}\n\n**Questions for discussion:**\n- How can we improve execution?\n- What are the key timing elements?\n- Where do you see potential improvements?\n\n*React with 👍 when you've reviewed the play. Share your thoughts below!*`;

      const response = await store.dispatch(
        chatApi.endpoints.sendMessage.initiate({
          conversationId,
          content: messageContent,
          type: 'play_discussion' as any,
          metadata: metadata as any
        })
      );

      const messageId = response.data?.id;

      if (this.socket && messageId) {
        this.socket.emit('tactical:discussion_created', {
          conversationId,
          messageId,
          playId: play.id,
          topic: discussionTopic,
          targetIds: options.targetIds
        });
      }

      toast.success(`Discussion started for "${play.name}"`);
      return messageId || '';

    } catch (error) {
      console.error('Failed to create play discussion:', error);
      toast.error('Failed to create discussion thread');
      throw error;
    }
  }

  // 5. Broadcast Game Plan
  async broadcastGamePlan(
    conversationId: string,
    gamePlan: GamePlanData,
    options: TacticalShareOptions
  ): Promise<void> {
    try {
      const metadata: TacticalMessageMetadata = {
        tacticalType: 'game_plan',
        gamePlanData: gamePlan,
        requiresAcknowledgment: true, // Always require acknowledgment for game plans
        sharedAt: new Date(),
        sharedBy: this.getCurrentUserId(),
        deadline: new Date(gamePlan.gameDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours before game
      };

      const messageContent = this.formatGamePlanMessage(gamePlan, options);

      await store.dispatch(
        chatApi.endpoints.sendMessage.initiate({
          conversationId,
          content: messageContent,
          type: 'game_plan' as any,
          metadata: metadata as any
        })
      );

      if (this.socket) {
        this.socket.emit('tactical:game_plan_broadcast', {
          conversationId,
          opponent: gamePlan.opponent,
          gameDate: gamePlan.gameDate,
          strategiesCount: gamePlan.keyStrategies.length,
          targetIds: options.targetIds
        });
      }

      // Schedule reminder notifications
      await this.scheduleGamePlanReminders(gamePlan, options.targetIds);

      toast.success(`Game plan for ${gamePlan.opponent} broadcast to team`);

    } catch (error) {
      console.error('Failed to broadcast game plan:', error);
      toast.error('Failed to broadcast game plan');
      throw error;
    }
  }

  // Helper: Generate play preview image
  private async generatePlayPreview(play: TacticalPlayData): Promise<string> {
    try {
      // This would integrate with the tactical board renderer
      // to capture a snapshot of the play diagram
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Draw basic hockey rink outline
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 300);
      
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 380, 280);

      // Add center line
      ctx.beginPath();
      ctx.moveTo(200, 10);
      ctx.lineTo(200, 290);
      ctx.stroke();

      // Add play name
      ctx.fillStyle = '#1e40af';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(play.name, 200, 30);

      // Add category badge
      ctx.fillStyle = this.getCategoryColor(play.category);
      ctx.fillRect(10, 250, 80, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(play.category.toUpperCase(), 50, 270);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate play preview:', error);
      return '';
    }
  }

  // Helper: Format play share message
  private formatPlayShareMessage(play: TacticalPlayData, options: TacticalShareOptions): string {
    const priorityEmoji = options.priority === 'urgent' ? '🚨' : options.priority === 'important' ? '⚠️' : '🏒';
    
    let message = `${priorityEmoji} **NEW TACTICAL PLAY SHARED**\n\n`;
    message += `**${play.name}**\n`;
    message += `📋 Category: ${play.category.charAt(0).toUpperCase() + play.category.slice(1)}\n`;
    message += `🎯 Situation: ${play.situation}\n`;
    message += `👥 Formation: ${play.formation}\n\n`;
    
    if (play.description) {
      message += `**Description:**\n${play.description}\n\n`;
    }

    if (play.tags.length > 0) {
      message += `**Tags:** ${play.tags.join(', ')}\n\n`;
    }

    if (options.message) {
      message += `**Coach Notes:**\n${options.message}\n\n`;
    }

    if (options.includeInstructions) {
      message += `📝 **Instructions:**\n`;
      message += `- Review the play diagram carefully\n`;
      message += `- Practice the positioning and timing\n`;
      message += `- Ask questions if anything is unclear\n`;
      message += `- React with 👍 when you understand the play\n\n`;
    }

    if (options.priority === 'urgent') {
      message += `⏰ **URGENT:** Please review immediately and confirm understanding.\n`;
    } else if (options.priority === 'important') {
      message += `⚠️ **IMPORTANT:** Please review before next practice.\n`;
    }

    return message;
  }

  // Helper: Format formation update message
  private formatFormationUpdateMessage(formation: FormationUpdateData, options: TacticalShareOptions): string {
    let message = `🔄 **FORMATION UPDATE**\n\n`;
    message += `**${formation.formationName}** - ${formation.situationType}\n`;
    message += `📅 **Effective:** ${formation.effectiveFrom.toLocaleString()}\n\n`;

    message += `**Position Assignments:**\n`;
    formation.positions.forEach(pos => {
      message += `• ${pos.position}: ${pos.role}`;
      if (pos.instructions) {
        message += ` - ${pos.instructions}`;
      }
      message += `\n`;
    });

    if (formation.notes) {
      message += `\n**Notes:**\n${formation.notes}\n`;
    }

    message += `\n⚡ **Action Required:** Please acknowledge receipt and review your position.\n`;
    message += `React with ✅ to confirm you understand your assignment.`;

    return message;
  }

  // Helper: Format video analysis message
  private formatVideoAnalysisMessage(videoData: VideoAnalysisData, options: TacticalShareOptions): string {
    let message = `🎥 **VIDEO ANALYSIS SHARED**\n\n`;
    message += `**${videoData.title}**\n\n`;

    if (videoData.timestamps.length > 0) {
      message += `**Key Moments:**\n`;
      videoData.timestamps.slice(0, 5).forEach(ts => {
        const minutes = Math.floor(ts.time / 60);
        const seconds = ts.time % 60;
        message += `• [${minutes}:${seconds.toString().padStart(2, '0')}] ${ts.title}\n`;
      });

      if (videoData.timestamps.length > 5) {
        message += `... and ${videoData.timestamps.length - 5} more key moments\n`;
      }
      message += `\n`;
    }

    if (videoData.analysisNotes) {
      message += `**Analysis:**\n${videoData.analysisNotes}\n\n`;
    }

    if (videoData.relatedPlays && videoData.relatedPlays.length > 0) {
      message += `🔗 **Related Plays:** ${videoData.relatedPlays.length} play systems referenced\n\n`;
    }

    message += `📺 Click the video to view with tactical overlays and timestamped analysis.\n`;
    message += `💬 Use this thread to discuss insights and questions.`;

    return message;
  }

  // Helper: Format game plan message
  private formatGamePlanMessage(gamePlan: GamePlanData, options: TacticalShareOptions): string {
    let message = `🏒 **GAME PLAN** vs ${gamePlan.opponent}\n\n`;
    message += `📅 **Game Date:** ${gamePlan.gameDate.toLocaleString()}\n\n`;

    message += `**Key Strategies:**\n`;
    gamePlan.keyStrategies.forEach(strategy => {
      message += `• ${strategy}\n`;
    });
    message += `\n`;

    if (gamePlan.lineupChanges && gamePlan.lineupChanges.length > 0) {
      message += `**Lineup Changes:**\n`;
      gamePlan.lineupChanges.forEach(change => {
        message += `• ${change.line}: ${change.players.join(', ')} - ${change.reason}\n`;
      });
      message += `\n`;
    }

    message += `**Special Instructions:**\n`;
    gamePlan.specialInstructions.forEach(instruction => {
      message += `• ${instruction}\n`;
    });
    message += `\n`;

    message += `**Focus Areas:**\n`;
    gamePlan.focusAreas.forEach(area => {
      message += `• ${area}\n`;
    });
    message += `\n`;

    message += `**Pre-Game Routine:**\n`;
    gamePlan.pregameRoutine.forEach((item, index) => {
      message += `${index + 1}. ${item}\n`;
    });

    message += `\n⚡ **REQUIRED:** Please acknowledge receipt and ask questions if needed.\n`;
    message += `React with 🏒 to confirm you're ready for the game!`;

    return message;
  }

  // Helper methods
  private getCategoryColor(category: string): string {
    const colors = {
      offensive: '#10b981',
      defensive: '#ef4444', 
      'special-teams': '#8b5cf6',
      faceoff: '#3b82f6',
      transition: '#f97316'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('current_user_id') || 'current-user-id';
  }

  private async notifyPositionGroups(formation: FormationUpdateData, targetIds: string[]): Promise<void> {
    // Send specific notifications to position groups
    // This would integrate with the notification service
    console.log('Notifying position groups:', { formation, targetIds });
  }

  private async createVideoDiscussionThread(conversationId: string, videoData: VideoAnalysisData): Promise<void> {
    // Create a threaded discussion for video analysis
    console.log('Creating video discussion thread:', { conversationId, videoData });
  }

  private async scheduleGamePlanReminders(gamePlan: GamePlanData, targetIds: string[]): Promise<void> {
    // Schedule reminder notifications before the game
    console.log('Scheduling game plan reminders:', { gamePlan, targetIds });
  }

  private async saveToShareHistory(shareData: Partial<ShareHistory>): Promise<void> {
    try {
      const history = JSON.parse(localStorage.getItem('tactical_share_history') || '[]');
      history.unshift({
        id: `share-${Date.now()}`,
        ...shareData,
        sharedAt: new Date(),
        acknowledgments: [],
        viewCount: 0,
        lastViewed: new Date()
      });
      
      // Keep only last 100 shares
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem('tactical_share_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save share history:', error);
    }
  }

  // Public methods for accessing share history and stats
  public getShareHistory(): ShareHistory[] {
    try {
      return JSON.parse(localStorage.getItem('tactical_share_history') || '[]');
    } catch {
      return [];
    }
  }

  public getShareStats() {
    const history = this.getShareHistory();
    return {
      totalShares: history.length,
      sharesByType: history.reduce((acc, share) => {
        acc[share.shareType] = (acc[share.shareType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageAcknowledgments: history.reduce((sum, share) => sum + share.acknowledgments.length, 0) / history.length || 0,
      totalViews: history.reduce((sum, share) => sum + share.viewCount, 0)
    };
  }

  // Real-time collaboration methods
  public startLivePlayEditing(playId: string, conversationId: string) {
    if (this.socket) {
      this.socket.emit('tactical:start_live_editing', { playId, conversationId });
    }
  }

  public broadcastPlayChange(playId: string, changes: any, conversationId: string) {
    if (this.socket) {
      this.socket.emit('tactical:play_updated', { playId, changes, conversationId });
    }
  }

  public stopLivePlayEditing(playId: string, conversationId: string) {
    if (this.socket) {
      this.socket.emit('tactical:stop_live_editing', { playId, conversationId });
    }
  }
}

export const tacticalCommunicationService = new TacticalCommunicationService();
export default tacticalCommunicationService;