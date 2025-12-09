import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { TrainingDiscussionService } from '../services/TrainingDiscussionService';
import { ConversationService } from '../services/ConversationService';
import { MessageService } from '../services/MessageService';
import { 
  TrainingDiscussion, 
  ExerciseDiscussion,
  TrainingSessionType,
  DiscussionStatus 
} from '../entities';
import { Conversation, ConversationParticipant } from '../entities';
import { authMiddleware, validationMiddleware } from '@hockey-hub/shared-lib';
import { IsString, IsEnum, IsDateString, IsOptional, IsArray, IsUUID, IsObject, IsNumber } from 'class-validator';

// DTOs
class CreateTrainingDiscussionDto {
  @IsUUID()
  sessionId: string;

  @IsEnum(TrainingSessionType)
  sessionType: TrainingSessionType;

  @IsString()
  sessionTitle: string;

  @IsDateString()
  sessionDate: string;

  @IsOptional()
  @IsString()
  sessionLocation?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  coachIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  trainerIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  playerIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exerciseIds?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

class CreateExerciseThreadDto {
  @IsUUID()
  exerciseId: string;

  @IsString()
  exerciseName: string;

  @IsOptional()
  @IsString()
  exerciseDescription?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

class UpdateStatusDto {
  @IsEnum(DiscussionStatus)
  status: DiscussionStatus;
}

class ArchiveOldDto {
  @IsOptional()
  @IsNumber()
  daysOld?: number;
}

const router = Router();

// Initialize service
let trainingDiscussionService: TrainingDiscussionService;

// Service initialization
const initializeService = () => {
  if (!trainingDiscussionService) {
    const conversationService = new ConversationService();
    const messageService = new MessageService();
    trainingDiscussionService = new TrainingDiscussionService(
      AppDataSource.getRepository(TrainingDiscussion),
      AppDataSource.getRepository(ExerciseDiscussion),
      AppDataSource.getRepository(Conversation),
      AppDataSource.getRepository(ConversationParticipant),
      conversationService,
      messageService
    );
  }
};

// Create training discussion
router.post(
  '/',
  authMiddleware,
  validationMiddleware(CreateTrainingDiscussionDto),
  async (req, res, next) => {
    try {
      initializeService();
      
      const user = (req as any).user;
      const discussion = await trainingDiscussionService.createTrainingDiscussion({
        ...req.body,
        sessionDate: new Date(req.body.sessionDate),
        organizationId: user.organizationId,
        createdBy: user.id,
      });

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create exercise thread
router.post(
  '/:id/exercises',
  authMiddleware,
  validationMiddleware(CreateExerciseThreadDto),
  async (req, res, next) => {
    try {
      initializeService();
      
      const user = (req as any).user;
      const thread = await trainingDiscussionService.createExerciseThread({
        trainingDiscussionId: req.params.id,
        ...req.body,
        createdBy: user.id,
      });

      res.json({
        success: true,
        data: thread,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get by session
router.get(
  '/session/:sessionId',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const { sessionId } = req.params;
      const { type } = req.query;

      if (!type || !Object.values(TrainingSessionType).includes(type as TrainingSessionType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or missing session type',
        });
      }

      const discussion = await trainingDiscussionService.getTrainingDiscussion(
        sessionId,
        type as TrainingSessionType
      );

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get by ID
router.get(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const discussion = await trainingDiscussionService.getTrainingDiscussionById(req.params.id);
      
      if (!discussion) {
        return res.status(404).json({
          success: false,
          error: 'Training discussion not found',
        });
      }

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get exercise discussions
router.get(
  '/:id/exercises',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const discussions = await trainingDiscussionService.getExerciseDiscussions(req.params.id);

      res.json({
        success: true,
        data: discussions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get active for user
router.get(
  '/user/active',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const user = (req as any).user;
      const discussions = await trainingDiscussionService.getActiveDiscussionsForUser(user.id);

      res.json({
        success: true,
        data: discussions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get upcoming
router.get(
  '/organization/upcoming',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const user = (req as any).user;
      const discussions = await trainingDiscussionService.getUpcomingDiscussions(
        user.organizationId,
        user.teamId
      );

      res.json({
        success: true,
        data: discussions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update status
router.put(
  '/:id/status',
  authMiddleware,
  validationMiddleware(UpdateStatusDto),
  async (req, res, next) => {
    try {
      initializeService();
      
      const user = (req as any).user;
      const discussion = await trainingDiscussionService.updateDiscussionStatus(
        req.params.id,
        req.body.status,
        user.id
      );

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Activate discussion
router.post(
  '/:id/activate',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const discussion = await trainingDiscussionService.activateDiscussion(req.params.id);

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Complete discussion
router.post(
  '/:id/complete',
  authMiddleware,
  async (req, res, next) => {
    try {
      initializeService();
      
      const discussion = await trainingDiscussionService.completeDiscussion(req.params.id);

      res.json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Archive old discussions
router.post(
  '/archive-old',
  authMiddleware,
  validationMiddleware(ArchiveOldDto),
  async (req, res, next) => {
    try {
      initializeService();
      
      const count = await trainingDiscussionService.archiveOldDiscussions(req.body.daysOld || 30);

      res.json({
        success: true,
        data: { archivedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;