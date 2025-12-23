// @ts-nocheck - Presence service with null handling patterns
import { Repository, In, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { UserPresence, PresenceStatus, ConversationParticipant } from '../entities';
import { messageCacheService } from './MessageCacheService';

export interface UpdatePresenceDto {
  status: PresenceStatus;
  status_message?: string;
  device_info?: {
    platform?: string;
    browser?: string;
    os?: string;
    ip_address?: string;
  };
}

export interface UserPresenceInfo {
  user_id: string;
  status: PresenceStatus;
  last_seen_at: Date;
  status_message?: string;
  is_typing?: boolean;
  typing_in_conversation_id?: string;
}

export class PresenceService {
  private presenceRepo: Repository<UserPresence>;
  private participantRepo: Repository<ConversationParticipant>;
  
  // In-memory typing indicators (should be moved to Redis in production)
  private readonly TYPING_TIMEOUT_MS = 5000;
  private readonly AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private readonly OFFLINE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.presenceRepo = AppDataSource.getRepository(UserPresence);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
  }

  async updatePresence(userId: string, data: UpdatePresenceDto): Promise<UserPresence> {
    let presence = await this.presenceRepo.findOne({
      where: { user_id: userId },
    });

    if (!presence) {
      presence = this.presenceRepo.create({
        user_id: userId,
        status: data.status,
        status_message: data.status_message,
        device_info: data.device_info,
        active_device: data.device_info?.platform,
      });
    } else {
      presence.status = data.status;
      presence.status_message = data.status_message || presence.status_message;
      presence.last_seen_at = new Date();
      
      if (data.device_info) {
        presence.device_info = data.device_info;
        presence.active_device = data.device_info.platform;
      }

      // Clear away/busy timestamps if going online
      if (data.status === PresenceStatus.ONLINE) {
        presence.away_since = null;
        presence.busy_until = null;
      } else if (data.status === PresenceStatus.AWAY && !presence.away_since) {
        presence.away_since = new Date();
      }
    }

    await this.presenceRepo.save(presence);
    
    // Cache the presence update
    await messageCacheService.cacheUserPresence(
      userId,
      presence.status,
      presence.last_seen_at
    );
    
    return presence;
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    // Try cache first
    const cachedPresence = await messageCacheService.getCachedUserPresence(userId);
    if (cachedPresence) {
      // Check if cache is fresh enough (less than 1 minute old)
      if (Date.now() - cachedPresence.timestamp < 60000) {
        return {
          user_id: userId,
          status: cachedPresence.status,
          last_seen_at: new Date(cachedPresence.lastSeen),
          status_message: cachedPresence.status_message,
        } as UserPresence;
      }
    }
    
    const presence = await this.presenceRepo.findOne({
      where: { user_id: userId },
    });

    if (presence) {
      // Check if presence should be updated to away/offline based on last seen
      const now = Date.now();
      const lastSeenTime = presence.last_seen_at.getTime();
      const timeSinceLastSeen = now - lastSeenTime;

      if (
        presence.status === PresenceStatus.ONLINE &&
        timeSinceLastSeen > this.AWAY_TIMEOUT_MS
      ) {
        presence.status = PresenceStatus.AWAY;
        presence.away_since = new Date(lastSeenTime + this.AWAY_TIMEOUT_MS);
        await this.presenceRepo.save(presence);
      } else if (
        (presence.status === PresenceStatus.ONLINE || presence.status === PresenceStatus.AWAY) &&
        timeSinceLastSeen > this.OFFLINE_TIMEOUT_MS
      ) {
        presence.status = PresenceStatus.OFFLINE;
        await this.presenceRepo.save(presence);
      }
    }

    return presence;
  }

  async getMultipleUserPresence(userIds: string[]): Promise<UserPresenceInfo[]> {
    if (userIds.length === 0) {
      return [];
    }

    const presences = await this.presenceRepo.find({
      where: { user_id: In(userIds) },
    });

    // Create a map for quick lookup
    const presenceMap = new Map(presences.map((p) => [p.user_id, p]));

    // Return presence info for all requested users
    return Promise.all(
      userIds.map(async (userId) => {
        const presence = presenceMap.get(userId);
        
        if (!presence) {
          return {
            user_id: userId,
            status: PresenceStatus.OFFLINE,
            last_seen_at: new Date(0), // Never seen
          };
        }

        // Check typing status
        const conversationTyping = await this.getTypingConversation(userId);

        return {
          user_id: userId,
          status: presence.status,
          last_seen_at: presence.last_seen_at,
          status_message: presence.status_message,
          is_typing: !!conversationTyping,
          typing_in_conversation_id: conversationTyping,
        };
      })
    );
  }

  async getOnlineUsersInOrganization(organizationId: string): Promise<string[]> {
    // This would need to join with user table to filter by organization
    // For now, returning online users within a time window
    const onlineThreshold = new Date(Date.now() - this.AWAY_TIMEOUT_MS);
    
    const onlinePresences = await this.presenceRepo.find({
      where: [
        { status: PresenceStatus.ONLINE },
        { status: PresenceStatus.AWAY, last_seen_at: MoreThan(onlineThreshold) },
      ],
    });

    return onlinePresences.map((p) => p.user_id);
  }

  async getConversationPresence(conversationId: string): Promise<UserPresenceInfo[]> {
    // Get all participants in the conversation
    const participants = await this.participantRepo.find({
      where: {
        conversation_id: conversationId,
        left_at: null,
      },
    });

    const userIds = participants.map((p) => p.user_id);
    return this.getMultipleUserPresence(userIds);
  }

  // Typing indicators
  async setTyping(userId: string, conversationId: string): Promise<void> {
    // Verify user is participant
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: null,
      },
    });

    if (!participant) {
      return;
    }

    // Use Redis for typing indicators
    await messageCacheService.setUserTyping(conversationId, userId);
  }

  async clearTyping(userId: string, conversationId: string): Promise<void> {
    await messageCacheService.removeUserTyping(conversationId, userId);
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    return messageCacheService.getTypingUsers(conversationId);
  }

  private async getTypingConversation(userId: string): Promise<string | undefined> {
    // This would require scanning all conversations in Redis
    // For now, return undefined. In production, maintain a reverse index
    return undefined;
  }

  // Heartbeat for maintaining online status
  async heartbeat(userId: string): Promise<void> {
    await this.presenceRepo.update(
      { user_id: userId },
      { last_seen_at: new Date() }
    );
  }

  // Cleanup method for disconnections
  async handleDisconnect(userId: string): Promise<void> {
    // Since we don't have a reverse index for typing indicators in Redis,
    // we'll need to get user's active conversations and clear typing for each
    // In production, maintain a reverse index of user->conversations typing
    
    // Update presence to away
    await this.updatePresence(userId, {
      status: PresenceStatus.AWAY,
    });
  }
}