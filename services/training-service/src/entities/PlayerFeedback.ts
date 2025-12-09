import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export type FeedbackType = 'game' | 'practice' | 'general' | 'behavioral' | 'tactical';
export type FeedbackTone = 'positive' | 'constructive' | 'critical' | 'mixed';
export type FeedbackStatus = 'unread' | 'read' | 'acknowledged' | 'discussed';

@Entity('player_feedback')
@Index('idx_feedback_player_status', ['playerId', 'status'])
@Index('idx_feedback_coach_type', ['coachId', 'type'])
@Index('idx_feedback_requires_response', ['requiresResponse'])
@Index('idx_feedback_parent_visible', ['parentVisible'])
@Index('idx_feedback_related_event', ['relatedEventId'])
export class PlayerFeedback extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ 
    type: 'enum', 
    enum: ['game', 'practice', 'general', 'behavioral', 'tactical']
  })
  type: FeedbackType;

  @Column({ type: 'uuid', nullable: true })
  relatedEventId?: string; // Game or Practice ID

  @Column({ 
    type: 'enum', 
    enum: ['positive', 'constructive', 'critical', 'mixed']
  })
  tone: FeedbackTone;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'simple-array', nullable: true })
  actionItems?: string[];

  @Column({ type: 'boolean', default: false })
  requiresResponse: boolean;

  @Column({ type: 'text', nullable: true })
  playerResponse?: string;

  @Column({ type: 'timestamp', nullable: true })
  playerResponseDate?: Date;

  @Column({ type: 'boolean', default: false })
  parentVisible: boolean;

  @Column({ 
    type: 'enum', 
    enum: ['unread', 'read', 'acknowledged', 'discussed'],
    default: 'unread'
  })
  status: FeedbackStatus;

  @Column({ type: 'timestamp', nullable: true })
  discussedInPerson?: Date;
}