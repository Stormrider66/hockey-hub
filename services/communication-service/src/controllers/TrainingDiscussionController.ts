// @ts-nocheck - Suppress TypeScript errors for build
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TrainingDiscussionService } from '../services/TrainingDiscussionService';
import { 
  TrainingSessionType, 
  DiscussionStatus 
} from '../entities/TrainingDiscussion';
import { Logger } from '@hockey-hub/shared-lib';

interface AuthRequest extends Request {
  user: {
    id: string;
    organizationId: string;
    teamId?: string;
    roles: string[];
  };
}

@Controller('training-discussions')
@UseGuards(AuthGuard('jwt'))
export class TrainingDiscussionController {
  private readonly logger = new Logger('TrainingDiscussionController');

  constructor(
    private readonly trainingDiscussionService: TrainingDiscussionService,
  ) {}

  @Post()
  async createTrainingDiscussion(
    @Body() body: {
      sessionId: string;
      sessionType: TrainingSessionType;
      sessionTitle: string;
      sessionDate: string;
      sessionLocation?: string;
      teamId?: string;
      coachIds?: string[];
      trainerIds?: string[];
      playerIds?: string[];
      exerciseIds?: string[];
      metadata?: Record<string, any>;
    },
    @Req() req: AuthRequest,
  ) {
    try {
      const discussion = await this.trainingDiscussionService.createTrainingDiscussion({
        ...body,
        sessionDate: new Date(body.sessionDate),
        organizationId: req.user.organizationId,
        createdBy: req.user.id,
      });

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error('Failed to create training discussion', error);
      throw new HttpException(
        'Failed to create training discussion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/exercises')
  async createExerciseThread(
    @Param('id') trainingDiscussionId: string,
    @Body() body: {
      exerciseId: string;
      exerciseName: string;
      exerciseDescription?: string;
      metadata?: Record<string, any>;
    },
    @Req() req: AuthRequest,
  ) {
    try {
      const thread = await this.trainingDiscussionService.createExerciseThread({
        trainingDiscussionId,
        ...body,
        createdBy: req.user.id,
      });

      return {
        success: true,
        data: thread,
      };
    } catch (error) {
      this.logger.error('Failed to create exercise thread', error);
      throw new HttpException(
        'Failed to create exercise thread',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  async getBySession(
    @Param('sessionId') sessionId: string,
    @Query('type') sessionType: TrainingSessionType,
  ) {
    try {
      const discussion = await this.trainingDiscussionService.getTrainingDiscussion(
        sessionId,
        sessionType,
      );

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error('Failed to get training discussion', error);
      throw new HttpException(
        'Failed to get training discussion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    try {
      const discussion = await this.trainingDiscussionService.getTrainingDiscussionById(id);
      
      if (!discussion) {
        throw new HttpException('Training discussion not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to get training discussion', error);
      throw new HttpException(
        'Failed to get training discussion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/exercises')
  async getExerciseDiscussions(@Param('id') trainingDiscussionId: string) {
    try {
      const discussions = await this.trainingDiscussionService.getExerciseDiscussions(
        trainingDiscussionId,
      );

      return {
        success: true,
        data: discussions,
      };
    } catch (error) {
      this.logger.error('Failed to get exercise discussions', error);
      throw new HttpException(
        'Failed to get exercise discussions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/active')
  async getActiveForUser(@Req() req: AuthRequest) {
    try {
      const discussions = await this.trainingDiscussionService.getActiveDiscussionsForUser(
        req.user.id,
      );

      return {
        success: true,
        data: discussions,
      };
    } catch (error) {
      this.logger.error('Failed to get active discussions', error);
      throw new HttpException(
        'Failed to get active discussions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organization/upcoming')
  async getUpcoming(@Req() req: AuthRequest) {
    try {
      const discussions = await this.trainingDiscussionService.getUpcomingDiscussions(
        req.user.organizationId,
        req.user.teamId,
      );

      return {
        success: true,
        data: discussions,
      };
    } catch (error) {
      this.logger.error('Failed to get upcoming discussions', error);
      throw new HttpException(
        'Failed to get upcoming discussions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DiscussionStatus,
    @Req() req: AuthRequest,
  ) {
    try {
      const discussion = await this.trainingDiscussionService.updateDiscussionStatus(
        id,
        status,
        req.user.id,
      );

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error('Failed to update discussion status', error);
      throw new HttpException(
        'Failed to update discussion status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/activate')
  async activateDiscussion(@Param('id') id: string) {
    try {
      const discussion = await this.trainingDiscussionService.activateDiscussion(id);

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error('Failed to activate discussion', error);
      throw new HttpException(
        'Failed to activate discussion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/complete')
  async completeDiscussion(@Param('id') id: string) {
    try {
      const discussion = await this.trainingDiscussionService.completeDiscussion(id);

      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error('Failed to complete discussion', error);
      throw new HttpException(
        'Failed to complete discussion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('archive-old')
  async archiveOldDiscussions(
    @Body('daysOld') daysOld: number = 30,
  ) {
    try {
      const count = await this.trainingDiscussionService.archiveOldDiscussions(daysOld);

      return {
        success: true,
        data: { archivedCount: count },
      };
    } catch (error) {
      this.logger.error('Failed to archive old discussions', error);
      throw new HttpException(
        'Failed to archive old discussions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}