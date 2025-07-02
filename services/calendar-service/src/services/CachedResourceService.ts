import { AppDataSource } from '../config/database';
import { 
  Resource, 
  ResourceType, 
  ResourceStatus,
  ResourceBooking,
  BookingStatus
} from '../entities';
import { Between, In, IsNull } from 'typeorm';
import { RedisCacheManager, CacheKeyBuilder } from '@hockey-hub/shared-lib';

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

export class CachedResourceService {
  private cacheManager: RedisCacheManager;

  constructor() {
    this.cacheManager = RedisCacheManager.getInstance();
  }

  async createResource(data: CreateResourceDto): Promise<Resource> {
    const resource = resourceRepository().create({
      ...data,
      status: ResourceStatus.AVAILABLE,
    });

    const savedResource = await resourceRepository().save(resource);
    
    // Invalidate organization resources cache
    await this.invalidateResourceCaches(savedResource.organizationId);
    
    return savedResource;
  }

  async updateResource(id: string, data: UpdateResourceDto): Promise<Resource> {
    const resource = await this.getResourceById(id);
    
    if (!resource) {
      throw new Error('Resource not found');
    }

    Object.assign(resource, data);
    const updatedResource = await resourceRepository().save(resource);
    
    // Invalidate caches
    await this.invalidateResourceCaches(updatedResource.organizationId, id);
    
    return updatedResource;
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
    
    // Invalidate caches
    await this.invalidateResourceCaches(resource.organizationId, id);
  }

  async getResourceById(id: string): Promise<Resource> {
    const cacheKey = CacheKeyBuilder.build('resource', id);
    
    const cachedResource = await this.cacheManager.get<Resource>(cacheKey);
    if (cachedResource) {
      return cachedResource;
    }

    const resource = await resourceRepository().findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['bookings'],
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Cache individual resource for 10 minutes
    await this.cacheManager.set(cacheKey, resource, 600, [`resource:${id}`, `org:${resource.organizationId}`]);

    return resource;
  }

  async getResources(filters: ResourceFilters, page = 1, limit = 20) {
    // Cache resources list by organization
    if (filters.organizationId && !filters.search && !filters.location) {
      const cacheKey = CacheKeyBuilder.build('resource', 'list', 'org', filters.organizationId, {
        type: filters.type,
        status: filters.status,
        minCapacity: filters.minCapacity,
        page,
        limit
      });

      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

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

    const result = {
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result if it's a simple organization query
    if (filters.organizationId && !filters.search && !filters.location) {
      const cacheKey = CacheKeyBuilder.build('resource', 'list', 'org', filters.organizationId, {
        type: filters.type,
        status: filters.status,
        minCapacity: filters.minCapacity,
        page,
        limit
      });

      await this.cacheManager.set(
        cacheKey, 
        result, 
        120, // 2 minutes TTL for lists
        [`org:${filters.organizationId}`, 'resource:list']
      );
    }

    return result;
  }

  async checkAvailability(data: CheckAvailabilityDto): Promise<boolean> {
    const { resourceId, startTime, endTime, excludeBookingId } = data;

    // Don't cache availability checks as they are time-sensitive
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
    const cacheKey = CacheKeyBuilder.build('resource', 'availability', resourceId, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });

    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

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

    const result = {
      resource,
      bookings,
      availableSlots,
    };

    // Cache availability for 5 minutes
    await this.cacheManager.set(
      cacheKey, 
      result, 
      300, 
      [`resource:${resourceId}`, 'resource:availability']
    );

    return result;
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

    const savedBooking = await bookingRepository().save(booking);
    
    // Invalidate availability caches
    await this.invalidateAvailabilityCaches(resourceId);
    
    return savedBooking;
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

    const savedBooking = await bookingRepository().save(booking);
    
    // Invalidate availability caches
    await this.invalidateAvailabilityCaches(booking.resourceId);
    
    return savedBooking;
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

    const savedBooking = await bookingRepository().save(booking);
    
    // Invalidate availability caches
    await this.invalidateAvailabilityCaches(booking.resourceId);
    
    return savedBooking;
  }

  private async invalidateResourceCaches(organizationId: string, resourceId?: string): Promise<void> {
    const tags = [`org:${organizationId}`, 'resource:list'];
    
    if (resourceId) {
      tags.push(`resource:${resourceId}`);
      await this.invalidateAvailabilityCaches(resourceId);
    }
    
    await this.cacheManager.invalidateByPattern(`resource:list:org:${organizationId}:*`);
    await this.cacheManager.invalidateByTags(tags);
  }

  private async invalidateAvailabilityCaches(resourceId: string): Promise<void> {
    await this.cacheManager.invalidateByPattern(`resource:availability:${resourceId}:*`);
    await this.cacheManager.invalidateByTags([`resource:${resourceId}`, 'resource:availability']);
  }
}