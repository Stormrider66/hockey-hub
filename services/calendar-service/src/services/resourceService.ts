import { AppDataSource } from '../config/database';
import { 
  Resource, 
  ResourceType, 
  ResourceStatus,
  ResourceBooking,
  BookingStatus
} from '../entities';
import { Between, In, IsNull } from 'typeorm';

const resourceRepository = () => AppDataSource.getRepository(Resource);
const bookingRepository = () => AppDataSource.getRepository(ResourceBooking);

export interface CreateResourceDto {
  name: string;
  description?: string;
  type: ResourceType;
  organizationId: string;
  location?: string;
  capacity?: number;
  features?: Record<string, any>;
  availability?: Record<string, any>;
  hourlyRate?: number;
  requiresApproval?: boolean;
  approvers?: string[];
}

export interface UpdateResourceDto {
  name?: string;
  description?: string;
  status?: ResourceStatus;
  location?: string;
  capacity?: number;
  features?: Record<string, any>;
  availability?: Record<string, any>;
  hourlyRate?: number;
  requiresApproval?: boolean;
  approvers?: string[];
}

export interface ResourceFilters {
  organizationId?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  location?: string;
  minCapacity?: number;
  search?: string;
}

export interface CheckAvailabilityDto {
  resourceId: string;
  startTime: Date;
  endTime: Date;
  excludeBookingId?: string;
}

export class ResourceService {
  async createResource(data: CreateResourceDto): Promise<Resource> {
    const resource = resourceRepository().create({
      ...data,
      status: ResourceStatus.AVAILABLE,
    });

    return await resourceRepository().save(resource);
  }

  async updateResource(id: string, data: UpdateResourceDto): Promise<Resource> {
    const resource = await this.getResourceById(id);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    Object.assign(resource, data);
    return await resourceRepository().save(resource);
  }

  async deleteResource(id: string): Promise<void> {
    const resource = await this.getResourceById(id);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    resource.deletedAt = new Date();
    resource.isActive = false;
    resource.status = ResourceStatus.RETIRED;
    await resourceRepository().save(resource);
  }

  async getResourceById(id: string): Promise<Resource> {
    const resource = await resourceRepository().findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['bookings'],
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }

  async getResources(filters: ResourceFilters, page = 1, limit = 20) {
    const query = resourceRepository().createQueryBuilder('resource')
      .where('resource.deletedAt IS NULL')
      .andWhere('resource.isActive = :isActive', { isActive: true });

    if (filters.organizationId) {
      query.andWhere('resource.organizationId = :organizationId', { 
        organizationId: filters.organizationId 
      });
    }

    if (filters.type) {
      query.andWhere('resource.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('resource.status = :status', { status: filters.status });
    }

    if (filters.location) {
      query.andWhere('resource.location ILIKE :location', { 
        location: `%${filters.location}%` 
      });
    }

    if (filters.minCapacity) {
      query.andWhere('resource.capacity >= :minCapacity', { 
        minCapacity: filters.minCapacity 
      });
    }

    if (filters.search) {
      query.andWhere(
        '(resource.name ILIKE :search OR resource.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [resources, total] = await query
      .orderBy('resource.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkAvailability(data: CheckAvailabilityDto): Promise<boolean> {
    const { resourceId, startTime, endTime, excludeBookingId } = data;

    const query = bookingRepository().createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.status IN (:...statuses)', { 
        statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING] 
      })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflictingBookings = await query.getCount();
    return conflictingBookings === 0;
  }

  async getResourceAvailability(
    resourceId: string, 
    startDate: Date, 
    endDate: Date
  ) {
    const resource = await this.getResourceById(resourceId);
    
    const bookings = await bookingRepository().find({
      where: {
        resourceId,
        startTime: Between(startDate, endDate),
        status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
      },
      order: { startTime: 'ASC' },
    });

    const availableSlots = this.calculateAvailableSlots(
      resource,
      bookings,
      startDate,
      endDate
    );

    return {
      resource,
      bookings,
      availableSlots,
    };
  }

  private calculateAvailableSlots(
    resource: Resource,
    bookings: ResourceBooking[],
    startDate: Date,
    endDate: Date
  ) {
    const slots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleLowerCase();
      const dayAvailability = resource.availability?.[dayOfWeek] || [];

      for (const slot of dayAvailability) {
        const slotStart = new Date(currentDate);
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(currentDate);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        const isAvailable = !bookings.some(booking => 
          booking.startTime < slotEnd && booking.endTime > slotStart
        );

        if (isAvailable) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            available: true,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  async createBooking(
    resourceId: string,
    eventId: string,
    startTime: Date,
    endTime: Date,
    bookedBy: string,
    purpose?: string
  ): Promise<ResourceBooking> {
    const resource = await this.getResourceById(resourceId);
    
    const isAvailable = await this.checkAvailability({
      resourceId,
      startTime,
      endTime,
    });

    if (!isAvailable) {
      throw new Error('Resource is not available for the requested time');
    }

    const booking = bookingRepository().create({
      resourceId,
      eventId,
      startTime,
      endTime,
      bookedBy,
      purpose,
      status: resource.requiresApproval ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
      cost: this.calculateBookingCost(resource, startTime, endTime),
      currency: resource.currency || 'USD',
    });

    return await bookingRepository().save(booking);
  }

  private calculateBookingCost(
    resource: Resource,
    startTime: Date,
    endTime: Date
  ): number {
    if (!resource.hourlyRate) return 0;

    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return Math.ceil(hours * resource.hourlyRate);
  }

  async approveBooking(bookingId: string, approvedBy: string): Promise<ResourceBooking> {
    const booking = await bookingRepository().findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.approvedBy = approvedBy;
    booking.approvedAt = new Date();

    return await bookingRepository().save(booking);
  }

  async cancelBooking(
    bookingId: string, 
    cancelledBy: string, 
    reason?: string
  ): Promise<ResourceBooking> {
    const booking = await bookingRepository().findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledBy = cancelledBy;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

    return await bookingRepository().save(booking);
  }
}