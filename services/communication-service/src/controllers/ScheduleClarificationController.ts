import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { 
  ScheduleClarificationService,
  ClarificationType,
  ClarificationStatus,
  ClarificationPriority,
  PollType,
  ResponseStatus,
  VehicleType,
  CarpoolOfferStatus,
} from '../services/ScheduleClarificationService';
import { AuthGuard } from '@hockey-hub/shared-lib';

interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    teamIds: string[];
    roles: string[];
  };
}

@Controller('schedule-clarifications')
@UseGuards(AuthGuard)
export class ScheduleClarificationController {
  constructor(
    private readonly scheduleClarificationService: ScheduleClarificationService,
  ) {}

  @Post()
  async createScheduleClarification(
    @Req() req: AuthRequest,
    @Body() body: {
      eventId: string;
      eventDetails: {
        event_name: string;
        event_type: string;
        original_date: Date;
        original_time: string;
        original_location: string;
        proposed_date?: Date;
        proposed_time?: string;
        proposed_location?: string;
      };
      type: ClarificationType;
      title: string;
      description: string;
      teamId: string;
      participantIds: string[];
      priority?: ClarificationPriority;
      conflictDetails?: any;
      deadline?: Date;
    }
  ) {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId || !organizationId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.createScheduleClarification({
      ...body,
      initiatedBy: userId,
      organizationId,
    });
  }

  @Get()
  async getScheduleClarifications(
    @Req() req: AuthRequest,
    @Query() query: {
      teamId?: string;
      eventId?: string;
      status?: ClarificationStatus;
      type?: ClarificationType;
      participantId?: string;
    }
  ) {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    return await this.scheduleClarificationService.getScheduleClarifications({
      ...query,
      organizationId,
      participantId: query.participantId || userId,
    });
  }

  @Get(':id')
  async getScheduleClarification(
    @Param('id') id: string
  ) {
    return await this.scheduleClarificationService.getScheduleClarifications({
      eventId: id, // Using eventId as the filter since we don't have a getById method
    });
  }

  @Put(':id/status')
  async updateClarificationStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: {
      status: ClarificationStatus;
      resolution?: {
        resolution_type: string;
        resolution_notes: string;
        new_event_id?: string;
      };
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.updateClarificationStatus(
      id,
      body.status,
      userId,
      body.resolution
    );
  }

  // Carpool endpoints
  @Post(':clarificationId/carpool-offers')
  async createCarpoolOffer(
    @Req() req: AuthRequest,
    @Param('clarificationId') clarificationId: string,
    @Body() body: {
      eventId: string;
      eventDate: Date;
      vehicleType: VehicleType;
      availableSeats: number;
      pickupLocation: string;
      pickupCoordinates?: {
        latitude: number;
        longitude: number;
      };
      departureTime: string;
      returnTime?: string;
      isRoundTrip: boolean;
      pickupStops?: string[];
      driverPreferences?: any;
      notes?: string;
      contactInfo?: any;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.createCarpoolOffer({
      ...body,
      clarificationId,
      driverId: userId,
    });
  }

  @Get(':clarificationId/carpool-offers')
  async getCarpoolOffers(
    @Param('clarificationId') clarificationId: string,
    @Query() query: {
      status?: CarpoolOfferStatus;
    }
  ) {
    return await this.scheduleClarificationService.getCarpoolOffers({
      clarificationId,
      ...query,
    });
  }

  @Post('carpool-offers/:offerId/requests')
  async requestCarpool(
    @Req() req: AuthRequest,
    @Param('offerId') offerId: string,
    @Body() body: {
      playerId: string;
      seatsRequested: number;
      pickupAddress?: string;
      pickupCoordinates?: {
        latitude: number;
        longitude: number;
      };
      needsReturnTrip: boolean;
      specialRequirements?: any;
      notes?: string;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.requestCarpool({
      ...body,
      offerId,
      requesterId: userId,
    });
  }

  @Put('carpool-requests/:requestId/respond')
  async respondToCarpoolRequest(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
    @Body() body: {
      accepted: boolean;
      responseMessage?: string;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.respondToCarpoolRequest(
      requestId,
      userId,
      body.accepted,
      body.responseMessage
    );
  }

  @Get('carpool-offers/upcoming')
  async getUpcomingCarpoolOffers(
    @Req() req: AuthRequest,
    @Query('days') days?: string
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.getUpcomingCarpoolOffers(
      userId,
      days ? parseInt(days) : 7
    );
  }

  // Availability poll endpoints
  @Post(':clarificationId/polls')
  async createAvailabilityPoll(
    @Req() req: AuthRequest,
    @Param('clarificationId') clarificationId: string,
    @Body() body: {
      title: string;
      description?: string;
      type: PollType;
      options: Array<{
        date?: Date;
        time?: string;
        location?: string;
        description?: string;
        additional_info?: any;
      }>;
      targetUserIds?: string[];
      deadline?: Date;
      allowMultipleChoices?: boolean;
      anonymousResponses?: boolean;
      showResultsImmediately?: boolean;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.createAvailabilityPoll({
      ...body,
      clarificationId,
      createdBy: userId,
    });
  }

  @Post('polls/:pollId/responses')
  async submitPollResponse(
    @Req() req: AuthRequest,
    @Param('pollId') pollId: string,
    @Body() body: {
      playerId?: string;
      selectedOptionIds: string[];
      overallStatus: ResponseStatus;
      optionPreferences?: any;
      comments?: string;
      constraints?: any;
      isTentative?: boolean;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.submitPollResponse({
      ...body,
      pollId,
      userId,
    });
  }

  @Put('polls/:pollId/finalize')
  async finalizePollDecision(
    @Req() req: AuthRequest,
    @Param('pollId') pollId: string,
    @Body() body: {
      selectedOptionId: string;
      decisionNotes?: string;
    }
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('User context required');
    }

    return await this.scheduleClarificationService.finalizePollDecision(
      pollId,
      body.selectedOptionId,
      userId,
      body.decisionNotes
    );
  }
}