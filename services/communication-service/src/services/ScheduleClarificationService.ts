import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull, MoreThan } from 'typeorm';
import { 
  ScheduleClarification, 
  ClarificationType, 
  ClarificationStatus,
  ClarificationPriority,
  CarpoolOffer,
  CarpoolOfferStatus,
  CarpoolRequest,
  CarpoolRequestStatus,
  AvailabilityPoll,
  PollType,
  PollStatus,
  AvailabilityResponse,
  ResponseStatus,
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
} from '../entities';
import { ConversationService } from './ConversationService';
import { NotificationService } from './NotificationService';
import { BaseError, ErrorCode } from '@hockey-hub/shared-lib';

@Injectable()
export class ScheduleClarificationService {
  constructor(
    @InjectRepository(ScheduleClarification)
    private scheduleClarificationRepository: Repository<ScheduleClarification>,
    @InjectRepository(CarpoolOffer)
    private carpoolOfferRepository: Repository<CarpoolOffer>,
    @InjectRepository(CarpoolRequest)
    private carpoolRequestRepository: Repository<CarpoolRequest>,
    @InjectRepository(AvailabilityPoll)
    private availabilityPollRepository: Repository<AvailabilityPoll>,
    @InjectRepository(AvailabilityResponse)
    private availabilityResponseRepository: Repository<AvailabilityResponse>,
    private conversationService: ConversationService,
    private notificationService: NotificationService,
  ) {}

  async createScheduleClarification(data: {
    eventId: string;
    eventDetails: any;
    type: ClarificationType;
    title: string;
    description: string;
    initiatedBy: string;
    organizationId: string;
    teamId: string;
    participantIds: string[];
    priority?: ClarificationPriority;
    conflictDetails?: any;
    deadline?: Date;
  }): Promise<ScheduleClarification> {
    // Create conversation for the clarification
    const conversation = await this.conversationService.createConversation({
      type: ConversationType.SCHEDULE_CLARIFICATION,
      name: data.title,
      description: `Schedule clarification for ${data.eventDetails.event_name}`,
      createdBy: data.initiatedBy,
      metadata: {
        eventId: data.eventId,
        eventName: data.eventDetails.event_name,
        eventDate: data.eventDetails.original_date,
        clarificationType: data.type,
        organizationId: data.organizationId,
        teamId: data.teamId,
      },
    });

    // Add participants to conversation
    const participantRoles = this.determineParticipantRoles(data.participantIds, data.initiatedBy);
    for (const [userId, role] of Object.entries(participantRoles)) {
      await this.conversationService.addParticipant(conversation.id, userId, role as ParticipantRole);
    }

    // Create schedule clarification
    const clarification = this.scheduleClarificationRepository.create({
      conversation_id: conversation.id,
      event_id: data.eventId,
      type: data.type,
      status: ClarificationStatus.OPEN,
      priority: data.priority || ClarificationPriority.MEDIUM,
      organization_id: data.organizationId,
      team_id: data.teamId,
      initiated_by: data.initiatedBy,
      title: data.title,
      description: data.description,
      event_details: data.eventDetails,
      conflict_details: data.conflictDetails,
      participant_ids: data.participantIds,
      deadline: data.deadline,
      createdBy: data.initiatedBy,
    });

    const savedClarification = await this.scheduleClarificationRepository.save(clarification);

    // Update conversation metadata with clarification ID
    await this.conversationService.updateConversationMetadata(conversation.id, {
      scheduleClarificationId: savedClarification.id,
    });

    // Send notifications
    await this.sendClarificationNotifications(savedClarification, 'created');

    return savedClarification;
  }

  async updateClarificationStatus(
    clarificationId: string,
    status: ClarificationStatus,
    userId: string,
    resolution?: any
  ): Promise<ScheduleClarification> {
    const clarification = await this.scheduleClarificationRepository.findOne({
      where: { id: clarificationId },
    });

    if (!clarification) {
      throw new BaseError('Schedule clarification not found', ErrorCode.NOT_FOUND, 404);
    }

    clarification.status = status;
    clarification.updatedBy = userId;

    if (status === ClarificationStatus.RESOLVED && resolution) {
      clarification.resolution = {
        ...resolution,
        resolved_by: userId,
        resolved_at: new Date(),
      };
    }

    const updated = await this.scheduleClarificationRepository.save(clarification);

    // Send notifications
    await this.sendClarificationNotifications(updated, 'status_changed');

    return updated;
  }

  async createCarpoolOffer(data: {
    clarificationId: string;
    driverId: string;
    eventId: string;
    eventDate: Date;
    vehicleType: string;
    availableSeats: number;
    pickupLocation: string;
    pickupCoordinates?: any;
    departureTime: string;
    returnTime?: string;
    isRoundTrip: boolean;
    driverPreferences?: any;
    notes?: string;
    contactInfo?: any;
  }): Promise<CarpoolOffer> {
    const offer = this.carpoolOfferRepository.create({
      schedule_clarification_id: data.clarificationId,
      driver_id: data.driverId,
      event_id: data.eventId,
      event_date: data.eventDate,
      vehicle_type: data.vehicleType as any,
      available_seats: data.availableSeats,
      occupied_seats: 0,
      pickup_location: data.pickupLocation,
      pickup_coordinates: data.pickupCoordinates,
      departure_time: data.departureTime,
      return_time: data.returnTime,
      is_round_trip: data.isRoundTrip,
      driver_preferences: data.driverPreferences,
      notes: data.notes,
      contact_info: data.contactInfo,
      status: CarpoolOfferStatus.AVAILABLE,
      createdBy: data.driverId,
    });

    const savedOffer = await this.carpoolOfferRepository.save(offer);

    // Post message in conversation
    const clarification = await this.scheduleClarificationRepository.findOne({
      where: { id: data.clarificationId },
    });
    
    if (clarification) {
      await this.conversationService.sendMessage({
        conversationId: clarification.conversation_id,
        senderId: data.driverId,
        content: `🚗 New carpool offer: ${data.availableSeats} seats available from ${data.pickupLocation} at ${data.departureTime}`,
        type: 'system',
        metadata: {
          action: 'carpool_offer_created',
          offerId: savedOffer.id,
        },
      });
    }

    return savedOffer;
  }

  async requestCarpool(data: {
    offerId: string;
    requesterId: string;
    playerId: string;
    seatsRequested: number;
    pickupAddress?: string;
    pickupCoordinates?: any;
    needsReturnTrip: boolean;
    specialRequirements?: any;
    notes?: string;
  }): Promise<CarpoolRequest> {
    const offer = await this.carpoolOfferRepository.findOne({
      where: { id: data.offerId },
    });

    if (!offer) {
      throw new BaseError('Carpool offer not found', ErrorCode.NOT_FOUND, 404);
    }

    if (offer.available_seats - offer.occupied_seats < data.seatsRequested) {
      throw new BaseError('Not enough seats available', ErrorCode.CONFLICT, 409);
    }

    const request = this.carpoolRequestRepository.create({
      carpool_offer_id: data.offerId,
      requester_id: data.requesterId,
      player_id: data.playerId,
      seats_requested: data.seatsRequested,
      pickup_address: data.pickupAddress,
      pickup_coordinates: data.pickupCoordinates,
      needs_return_trip: data.needsReturnTrip,
      special_requirements: data.specialRequirements,
      notes: data.notes,
      status: CarpoolRequestStatus.PENDING,
      createdBy: data.requesterId,
    });

    const savedRequest = await this.carpoolRequestRepository.save(request);

    // Notify driver
    await this.notificationService.createNotification({
      userId: offer.driver_id,
      type: 'carpool_request',
      title: 'New Carpool Request',
      message: `You have a new carpool request for ${data.seatsRequested} seat(s)`,
      metadata: {
        requestId: savedRequest.id,
        offerId: offer.id,
      },
    });

    return savedRequest;
  }

  async respondToCarpoolRequest(
    requestId: string,
    driverId: string,
    accepted: boolean,
    responseMessage?: string
  ): Promise<CarpoolRequest> {
    const request = await this.carpoolRequestRepository.findOne({
      where: { id: requestId },
      relations: ['carpool_offer'],
    });

    if (!request) {
      throw new BaseError('Carpool request not found', ErrorCode.NOT_FOUND, 404);
    }

    if (request.carpool_offer.driver_id !== driverId) {
      throw new BaseError('Unauthorized to respond to this request', ErrorCode.FORBIDDEN, 403);
    }

    request.status = accepted ? CarpoolRequestStatus.ACCEPTED : CarpoolRequestStatus.REJECTED;
    request.response_message = responseMessage;
    request.responded_at = new Date();
    request.updatedBy = driverId;

    if (accepted) {
      // Update occupied seats
      request.carpool_offer.occupied_seats += request.seats_requested;
      if (request.carpool_offer.occupied_seats >= request.carpool_offer.available_seats) {
        request.carpool_offer.status = CarpoolOfferStatus.FULL;
      } else {
        request.carpool_offer.status = CarpoolOfferStatus.PARTIALLY_FILLED;
      }
      await this.carpoolOfferRepository.save(request.carpool_offer);
    }

    const updated = await this.carpoolRequestRepository.save(request);

    // Notify requester
    await this.notificationService.createNotification({
      userId: request.requester_id,
      type: 'carpool_response',
      title: accepted ? 'Carpool Request Accepted' : 'Carpool Request Declined',
      message: responseMessage || `Your carpool request has been ${accepted ? 'accepted' : 'declined'}`,
      metadata: {
        requestId: request.id,
        offerId: request.carpool_offer_id,
      },
    });

    return updated;
  }

  async createAvailabilityPoll(data: {
    clarificationId: string;
    createdBy: string;
    title: string;
    description?: string;
    type: PollType;
    options: any[];
    targetUserIds?: string[];
    deadline?: Date;
    allowMultipleChoices?: boolean;
    anonymousResponses?: boolean;
    showResultsImmediately?: boolean;
  }): Promise<AvailabilityPoll> {
    const poll = this.availabilityPollRepository.create({
      schedule_clarification_id: data.clarificationId,
      created_by: data.createdBy,
      title: data.title,
      description: data.description,
      type: data.type,
      options: data.options.map((opt, index) => ({
        id: `option_${index}`,
        ...opt,
      })),
      target_user_ids: data.targetUserIds,
      deadline: data.deadline,
      allow_multiple_choices: data.allowMultipleChoices || false,
      anonymous_responses: data.anonymousResponses !== false,
      show_results_immediately: data.showResultsImmediately !== false,
      status: PollStatus.ACTIVE,
      createdBy: data.createdBy,
    });

    const savedPoll = await this.availabilityPollRepository.save(poll);

    // Post in conversation
    const clarification = await this.scheduleClarificationRepository.findOne({
      where: { id: data.clarificationId },
    });

    if (clarification) {
      await this.conversationService.sendMessage({
        conversationId: clarification.conversation_id,
        senderId: data.createdBy,
        content: `📊 New availability poll: ${data.title}`,
        type: 'system',
        metadata: {
          action: 'poll_created',
          pollId: savedPoll.id,
        },
      });
    }

    // Notify target users
    const notifyUserIds = data.targetUserIds || clarification?.participant_ids || [];
    for (const userId of notifyUserIds) {
      if (userId !== data.createdBy) {
        await this.notificationService.createNotification({
          userId,
          type: 'availability_poll',
          title: 'New Availability Poll',
          message: `Please respond to: ${data.title}`,
          metadata: {
            pollId: savedPoll.id,
            clarificationId: data.clarificationId,
          },
        });
      }
    }

    return savedPoll;
  }

  async submitPollResponse(data: {
    pollId: string;
    userId: string;
    playerId?: string;
    selectedOptionIds: string[];
    overallStatus: ResponseStatus;
    optionPreferences?: any;
    comments?: string;
    constraints?: any;
    isTentative?: boolean;
  }): Promise<AvailabilityResponse> {
    const poll = await this.availabilityPollRepository.findOne({
      where: { id: data.pollId },
    });

    if (!poll) {
      throw new BaseError('Poll not found', ErrorCode.NOT_FOUND, 404);
    }

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BaseError('Poll is no longer active', ErrorCode.CONFLICT, 409);
    }

    // Check if user already responded
    const existingResponse = await this.availabilityResponseRepository.findOne({
      where: {
        availability_poll_id: data.pollId,
        user_id: data.userId,
      },
    });

    if (existingResponse) {
      // Update existing response
      existingResponse.selected_option_ids = data.selectedOptionIds;
      existingResponse.overall_status = data.overallStatus;
      existingResponse.option_preferences = data.optionPreferences;
      existingResponse.comments = data.comments;
      existingResponse.constraints = data.constraints;
      existingResponse.is_tentative = data.isTentative || false;
      existingResponse.updated_response_at = new Date();
      existingResponse.updatedBy = data.userId;

      return await this.availabilityResponseRepository.save(existingResponse);
    }

    // Create new response
    const response = this.availabilityResponseRepository.create({
      availability_poll_id: data.pollId,
      user_id: data.userId,
      player_id: data.playerId,
      selected_option_ids: data.selectedOptionIds,
      overall_status: data.overallStatus,
      option_preferences: data.optionPreferences,
      comments: data.comments,
      constraints: data.constraints,
      is_tentative: data.isTentative || false,
      responded_at: new Date(),
      createdBy: data.userId,
    });

    return await this.availabilityResponseRepository.save(response);
  }

  async finalizePollDecision(
    pollId: string,
    selectedOptionId: string,
    decidedBy: string,
    decisionNotes?: string
  ): Promise<AvailabilityPoll> {
    const poll = await this.availabilityPollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new BaseError('Poll not found', ErrorCode.NOT_FOUND, 404);
    }

    poll.status = PollStatus.DECIDED;
    poll.final_decision = {
      selected_option_id: selectedOptionId,
      decided_by: decidedBy,
      decided_at: new Date(),
      decision_notes: decisionNotes,
    };
    poll.closed_at = new Date();
    poll.updatedBy = decidedBy;

    const updated = await this.availabilityPollRepository.save(poll);

    // Notify all participants
    const clarification = await this.scheduleClarificationRepository.findOne({
      where: { id: poll.schedule_clarification_id },
    });

    if (clarification) {
      const selectedOption = poll.options.find(opt => opt.id === selectedOptionId);
      await this.conversationService.sendMessage({
        conversationId: clarification.conversation_id,
        senderId: decidedBy,
        content: `✅ Poll decision made: ${selectedOption?.description || 'Option selected'}`,
        type: 'system',
        metadata: {
          action: 'poll_decided',
          pollId: poll.id,
          selectedOptionId,
        },
      });
    }

    return updated;
  }

  async getScheduleClarifications(filters: {
    organizationId?: string;
    teamId?: string;
    eventId?: string;
    status?: ClarificationStatus;
    type?: ClarificationType;
    initiatedBy?: string;
    participantId?: string;
  }): Promise<ScheduleClarification[]> {
    const query = this.scheduleClarificationRepository.createQueryBuilder('clarification');

    if (filters.organizationId) {
      query.andWhere('clarification.organization_id = :organizationId', { organizationId: filters.organizationId });
    }

    if (filters.teamId) {
      query.andWhere('clarification.team_id = :teamId', { teamId: filters.teamId });
    }

    if (filters.eventId) {
      query.andWhere('clarification.event_id = :eventId', { eventId: filters.eventId });
    }

    if (filters.status) {
      query.andWhere('clarification.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('clarification.type = :type', { type: filters.type });
    }

    if (filters.initiatedBy) {
      query.andWhere('clarification.initiated_by = :initiatedBy', { initiatedBy: filters.initiatedBy });
    }

    if (filters.participantId) {
      query.andWhere(':participantId = ANY(clarification.participant_ids)', { participantId: filters.participantId });
    }

    query.orderBy('clarification.created_at', 'DESC');

    return await query.getMany();
  }

  async getCarpoolOffers(filters: {
    clarificationId?: string;
    eventId?: string;
    driverId?: string;
    eventDate?: Date;
    status?: CarpoolOfferStatus;
  }): Promise<CarpoolOffer[]> {
    const where: any = {};

    if (filters.clarificationId) where.schedule_clarification_id = filters.clarificationId;
    if (filters.eventId) where.event_id = filters.eventId;
    if (filters.driverId) where.driver_id = filters.driverId;
    if (filters.eventDate) where.event_date = filters.eventDate;
    if (filters.status) where.status = filters.status;

    return await this.carpoolOfferRepository.find({
      where,
      relations: ['requests'],
      order: { created_at: 'DESC' },
    });
  }

  async getUpcomingCarpoolOffers(userId: string, days: number = 7): Promise<CarpoolOffer[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.carpoolOfferRepository.find({
      where: {
        event_date: MoreThan(new Date()),
        status: In([CarpoolOfferStatus.AVAILABLE, CarpoolOfferStatus.PARTIALLY_FILLED]),
      },
      relations: ['requests'],
      order: { event_date: 'ASC' },
    });
  }

  private determineParticipantRoles(participantIds: string[], initiatorId: string): Record<string, ParticipantRole> {
    const roles: Record<string, ParticipantRole> = {};
    
    // Initiator is always an admin
    roles[initiatorId] = ParticipantRole.ADMIN;
    
    // Others are members (could be enhanced with role detection)
    for (const id of participantIds) {
      if (id !== initiatorId) {
        roles[id] = ParticipantRole.MEMBER;
      }
    }
    
    return roles;
  }

  private async sendClarificationNotifications(
    clarification: ScheduleClarification,
    action: 'created' | 'status_changed' | 'resolved'
  ): Promise<void> {
    const participants = clarification.participant_ids.filter(id => id !== clarification.initiated_by);
    
    for (const participantId of participants) {
      await this.notificationService.createNotification({
        userId: participantId,
        type: 'schedule_clarification',
        title: this.getNotificationTitle(clarification, action),
        message: this.getNotificationMessage(clarification, action),
        metadata: {
          clarificationId: clarification.id,
          eventId: clarification.event_id,
          action,
        },
      });
    }
  }

  private getNotificationTitle(clarification: ScheduleClarification, action: string): string {
    switch (action) {
      case 'created':
        return 'New Schedule Clarification';
      case 'status_changed':
        return 'Schedule Clarification Updated';
      case 'resolved':
        return 'Schedule Clarification Resolved';
      default:
        return 'Schedule Update';
    }
  }

  private getNotificationMessage(clarification: ScheduleClarification, action: string): string {
    const eventName = clarification.event_details?.event_name || 'Event';
    
    switch (action) {
      case 'created':
        return `New clarification for ${eventName}: ${clarification.title}`;
      case 'status_changed':
        return `Status updated to ${clarification.status} for ${eventName}`;
      case 'resolved':
        return `Clarification resolved for ${eventName}`;
      default:
        return `Update for ${eventName}`;
    }
  }
}