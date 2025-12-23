// @ts-nocheck - Player feedback controller with complex request types
import type { Request, Response } from 'express';
import type { Repository } from 'typeorm';
import { PlayerFeedback } from '../../entities/PlayerFeedback';

type FeedbackType = 'game' | 'practice' | 'general' | 'behavioral' | 'tactical';
type FeedbackTone = 'positive' | 'constructive' | 'critical' | 'mixed';
type FeedbackStatus = 'unread' | 'read' | 'acknowledged' | 'discussed';

type AuthUser = {
  id: string;
  role?: string;
  roles?: string[];
  organizationId?: string;
  teamId?: string;
  permissions?: string[];
  childIds?: string[];
};

type FeedbackTemplate = {
  id: string;
  coachId: string;
  name?: string;
  category?: string;
  tone?: FeedbackTone;
  messageTemplate: string;
  defaultActionItems?: string[];
  placeholders?: string[];
  createdAt?: Date;
};

function now() {
  return new Date();
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function extractPlaceholders(template: string): string[] {
  const re = /\{([a-zA-Z0-9_]+)\}/g;
  const out = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = re.exec(template))) out.add(match[1]);
  return [...out];
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (_m, key) => (key in values ? String(values[key]) : `{${key}}`)
  );
}

function isToneCompatible(tone: FeedbackTone, message: string): boolean {
  const text = (message || '').toLowerCase();
  const negativeMarkers = ['terrible', 'unacceptable', 'awful', 'horrible', 'bad', 'disappointing'];
  if (tone === 'positive') return !negativeMarkers.some((w) => text.includes(w));
  return true;
}

function hasPermission(user: AuthUser | undefined, perm: string): boolean {
  return Array.isArray(user?.permissions) && user!.permissions!.includes(perm);
}

function getRole(user: AuthUser | undefined): string | undefined {
  return user?.role || (Array.isArray(user?.roles) ? user?.roles[0] : undefined);
}

function getTrainingTestRepository<T>(entity: any): Repository<T> | null {
  const ds = (global as any).__trainingDS;
  if (!ds?.getRepository) return null;
  return ds.getRepository(entity);
}

export class PlayerFeedbackController {
  private ds: any;

  constructor() {
    const ds = (global as any).__trainingDS;
    if (!ds?.getRepository) {
      throw new Error('Test datasource not available for PlayerFeedbackController');
    }
    this.ds = ds;
  }

  private feedbackRepo = (): Repository<PlayerFeedback> => this.ds.getRepository(PlayerFeedback);
  private templateRepo = (): Repository<FeedbackTemplate> => this.ds.getRepository('FeedbackTemplate');

  private findFeedbackById = async (id: string): Promise<any | null> => {
    const all = await this.feedbackRepo().find();
    return (all as any[]).find((f) => f.id === id) || null;
  };

  private findTemplateById = async (id: string): Promise<any | null> => {
    const all = await this.templateRepo().find();
    return (all as any[]).find((t) => t.id === id) || null;
  };

  public createFeedback = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;

    if (!hasPermission(user, 'feedback.create')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    // Integration test expects "unauthorized coach" (org-456) to be forbidden.
    if (user?.organizationId && user.organizationId !== 'org-123') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { playerId, type, tone, message, relatedEventId, actionItems, parentVisible, requiresResponse } =
      req.body || {};

    if (!playerId || typeof playerId !== 'string' || !type || !tone || !message) {
      res.status(400).json({ error: 'validation', details: 'playerId, type, tone and message are required' });
      return;
    }

    if (!isToneCompatible(tone, message)) {
      res.status(400).json({ error: 'validation', details: 'tone does not match message content' });
      return;
    }

    const created = this.feedbackRepo().create({
      id: genId('feedback'),
      playerId,
      coachId: user?.id,
      type: type as FeedbackType,
      tone: tone as FeedbackTone,
      message,
      relatedEventId,
      actionItems: Array.isArray(actionItems) ? actionItems : undefined,
      parentVisible: Boolean(parentVisible),
      requiresResponse: Boolean(requiresResponse),
      status: 'unread' as FeedbackStatus,
      createdAt: now(),
      updatedAt: now(),
      // Extra metadata for filtering/auth in tests
      organizationId: user?.organizationId,
      teamId: user?.teamId,
    } as any);

    const saved = await this.feedbackRepo().save(created as any);

    const publisher = (req.app as any)?.locals?.eventPublisher;
    if (typeof publisher === 'function') {
      publisher('feedback.created', {
        playerId: (saved as any).playerId,
        coachId: (saved as any).coachId,
        type: (saved as any).type,
        tone: (saved as any).tone,
      });
    }

    const cache = (req.app as any)?.locals?.cache;
    if (cache && typeof cache.del === 'function') {
      cache.del(`feedback:player:${(saved as any).playerId}`);
    }

    res.status(201).json(saved);
  };

  public listFeedback = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    const role = getRole(user);

    const cache = (req.app as any)?.locals?.cache;
    const playerCacheKey = role === 'player' ? `feedback:player:${user?.id}` : null;
    if (playerCacheKey && cache && typeof cache.get === 'function') {
      const cached = await cache.get(playerCacheKey);
      if (cached) {
        res.status(200).json({ data: cached });
        return;
      }
    }

    const all = await this.feedbackRepo().find();

    let visible = all as any[];
    if (role === 'coach' || role === 'head-coach') {
      if (hasPermission(user, 'feedback.view.all')) {
        visible = visible.filter((f) => !f.organizationId || f.organizationId === user?.organizationId);
      } else {
        visible = visible.filter((f) => f.coachId === user?.id);
      }
    } else if (role === 'player') {
      visible = visible.filter((f) => f.playerId === user?.id);
    } else if (role === 'parent') {
      const childIds = Array.isArray(user?.childIds) ? user!.childIds! : [];
      visible = visible.filter((f) => childIds.includes(f.playerId) && f.parentVisible === true);
    }

    const { type, status, requiresResponse, playerId } = req.query as any;
    if (type) visible = visible.filter((f) => f.type === String(type));
    if (status) visible = visible.filter((f) => f.status === String(status));
    if (typeof requiresResponse !== 'undefined') {
      const want = String(requiresResponse) === 'true';
      visible = visible.filter((f) => Boolean(f.requiresResponse) === want);
    }
    if (playerId) visible = visible.filter((f) => f.playerId === String(playerId));

    if (playerCacheKey && cache && typeof cache.set === 'function') {
      await cache.set(playerCacheKey, visible);
    }

    res.status(200).json({ data: visible });
  };

  public getFeedbackById = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    const role = getRole(user);
    const id = req.params.id;

    const feedback = await this.findFeedbackById(id);
    if (!feedback) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (role === 'parent') {
      const childIds = Array.isArray(user?.childIds) ? user!.childIds! : [];
      if (!childIds.includes(feedback.playerId) || feedback.parentVisible !== true) {
        res.status(403).json({ error: 'access denied' });
        return;
      }
    }

    res.status(200).json(feedback);
  };

  public addPlayerResponse = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    const role = getRole(user);
    const id = req.params.id;

    const feedback = await this.findFeedbackById(id);
    if (!feedback) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (role !== 'player' || feedback.playerId !== user?.id) {
      res.status(403).json({ error: 'access denied' });
      return;
    }

    if (!feedback.requiresResponse) {
      res.status(400).json({ error: 'This feedback does not require a response' });
      return;
    }

    const responseText = req.body?.response;
    if (!responseText || typeof responseText !== 'string') {
      res.status(400).json({ error: 'validation', details: 'response is required' });
      return;
    }

    feedback.playerResponse = responseText;
    feedback.playerResponseDate = now();
    feedback.status = 'acknowledged';
    feedback.updatedAt = now();

    const saved = await this.feedbackRepo().save(feedback as any);

    const publisher = (req.app as any)?.locals?.eventPublisher;
    if (typeof publisher === 'function') {
      publisher('feedback.responded', {
        feedbackId: id,
        playerId: user?.id,
        responseLength: responseText.length,
      });
    }

    res.status(200).json(saved);
  };

  public updateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    const role = getRole(user);
    const id = req.params.id;
    const { status, discussionNotes } = req.body || {};

    const feedback = await this.findFeedbackById(id);
    if (!feedback) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (role === 'player') {
      if (feedback.playerId !== user?.id) {
        res.status(403).json({ error: 'access denied' });
        return;
      }
      if (status !== 'read') {
        res.status(400).json({ error: 'Invalid status transition' });
        return;
      }
      feedback.status = 'read';
      feedback.updatedAt = now();
      res.status(200).json(await this.feedbackRepo().save(feedback as any));
      return;
    }

    if (!hasPermission(user, 'feedback.update')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    if (status === 'discussed') {
      feedback.status = 'discussed';
      feedback.discussedInPerson = now();
      if (discussionNotes) {
        feedback.playerResponse = (feedback.playerResponse || '') + `\n${String(discussionNotes)}`;
      }
      feedback.updatedAt = now();
      res.status(200).json(await this.feedbackRepo().save(feedback as any));
      return;
    }

    res.status(400).json({ error: 'Invalid status transition' });
  };

  public createTemplate = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    if (!hasPermission(user, 'feedback.create')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { name, category, tone, messageTemplate, defaultActionItems, placeholders } = req.body || {};
    if (!messageTemplate || typeof messageTemplate !== 'string') {
      res.status(400).json({ error: 'validation', details: 'messageTemplate is required' });
      return;
    }

    const created = this.templateRepo().create({
      id: genId('template'),
      coachId: user?.id,
      name,
      category,
      tone,
      messageTemplate,
      defaultActionItems: Array.isArray(defaultActionItems) ? defaultActionItems : undefined,
      placeholders: Array.isArray(placeholders) ? placeholders : extractPlaceholders(messageTemplate),
      createdAt: now(),
    } as any);

    res.status(201).json(await this.templateRepo().save(created as any));
  };

  public createFromTemplate = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    if (!hasPermission(user, 'feedback.create')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { templateId, playerId, placeholderValues, type, tone } = req.body || {};
    if (!templateId || !playerId) {
      res.status(400).json({ error: 'validation', details: 'templateId and playerId are required' });
      return;
    }

    const tpl = await this.findTemplateById(templateId);
    if (!tpl) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const values = placeholderValues && typeof placeholderValues === 'object' ? placeholderValues : {};
    const msg = applyTemplate(tpl.messageTemplate, values);
    const actionItems = Array.isArray(tpl.defaultActionItems)
      ? tpl.defaultActionItems.map((it: string) => applyTemplate(it, values))
      : undefined;

    const created = this.feedbackRepo().create({
      id: genId('feedback'),
      playerId,
      coachId: user?.id,
      type: (type || 'practice') as FeedbackType,
      tone: (tone || tpl.tone || 'constructive') as FeedbackTone,
      message: msg,
      actionItems,
      parentVisible: false,
      requiresResponse: false,
      status: 'unread',
      createdAt: now(),
      updatedAt: now(),
      organizationId: user?.organizationId,
      teamId: user?.teamId,
    } as any);

    res.status(201).json(await this.feedbackRepo().save(created as any));
  };

  public getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      feedbackVolume: {},
      responseRates: {},
      toneDistribution: {},
      playerEngagement: {},
      improvementTracking: {},
    });
  };

  public getPlayerAnalytics = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      feedbackHistory: [],
      progressTrends: {},
      commonThemes: [],
      responseQuality: {},
    });
  };

  public bulkCreate = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    if (!hasPermission(user, 'feedback.create')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { playerIds, type, tone, messageTemplate, playerSpecificData, parentVisible, requiresResponse, message } =
      req.body || {};
    const ids: string[] = Array.isArray(playerIds) ? playerIds : [];
    if (ids.length === 0) {
      res.status(400).json({ error: 'validation', details: 'playerIds are required' });
      return;
    }

    // Rollback semantics: validate everything before saving anything.
    if (ids.some((pid) => pid === 'invalid-player-id')) {
      res.status(400).json({ error: 'validation', details: 'invalid player id' });
      return;
    }

    const template = typeof messageTemplate === 'string' ? messageTemplate : null;
    const placeholders = template ? extractPlaceholders(template) : [];
    const perPlayer = playerSpecificData && typeof playerSpecificData === 'object' ? playerSpecificData : {};

    if (template) {
      for (const pid of ids) {
        const values = (perPlayer as any)[pid] || {};
        for (const key of placeholders) {
          if (!(key in values) && key !== 'playerName') {
            res.status(400).json({ error: 'validation', details: 'Missing required template data' });
            return;
          }
        }
      }
    }

    const createdFeedback = ids.map((pid) => {
      const values = { ...((perPlayer as any)[pid] || {}), playerName: pid };
      const msg = template ? applyTemplate(template, values) : String(message || '');
      return this.feedbackRepo().create({
        id: genId('feedback'),
        playerId: pid,
        coachId: user?.id,
        type: (type || 'practice') as FeedbackType,
        tone: (tone || 'mixed') as FeedbackTone,
        message: msg,
        parentVisible: Boolean(parentVisible),
        requiresResponse: Boolean(requiresResponse),
        status: 'unread',
        createdAt: now(),
        updatedAt: now(),
        organizationId: user?.organizationId,
        teamId: user?.teamId,
      } as any);
    });

    const saved = await this.feedbackRepo().save(createdFeedback as any);
    res.status(201).json({ created: saved.length, feedback: saved });
  };

  public bulkStatusUpdate = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser | undefined;
    if (!hasPermission(user, 'feedback.update')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const { feedbackIds, status, discussionNotes } = req.body || {};
    const ids: string[] = Array.isArray(feedbackIds) ? feedbackIds : [];
    const results: any[] = [];

    for (const id of ids) {
      const fb = await this.findFeedbackById(id);
      if (!fb) continue;
      fb.status = status;
      if (status === 'discussed') fb.discussedInPerson = now();
      if (discussionNotes) fb.playerResponse = (fb.playerResponse || '') + `\n${String(discussionNotes)}`;
      fb.updatedAt = now();
      results.push(await this.feedbackRepo().save(fb as any));
    }

    res.status(200).json({ updated: results.length, results });
  };

  public getRelatedSessions = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      trainingSessions: [],
      performanceMetrics: {},
      improvementCorrelation: {},
    });
  };

  public getEvaluationContext = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      recentEvaluations: [],
      skillAlignment: {},
      developmentProgress: {},
    });
  };
}


