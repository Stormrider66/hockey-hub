import AppDataSource from '../data-source';
import { Event } from '../entities/Event';
import { EventResource } from '../entities/EventResource';

export interface EventFilters {
  start?: string; // ISO
  end?: string;
  teamId?: string;
  eventType?: string;
  locationId?: string;
}

const eventRepo = AppDataSource.getRepository(Event);

export async function findAll(filters: EventFilters): Promise<Event[]> {
  const qb = eventRepo.createQueryBuilder('e');
  if (filters.start) {
    qb.andWhere('e.endTime >= :start', { start: filters.start });
  }
  if (filters.end) {
    qb.andWhere('e.startTime <= :end', { end: filters.end });
  }
  if (filters.teamId) {
    qb.andWhere(':teamId = ANY(e.teamIds)', { teamId: filters.teamId });
  }
  if (filters.eventType) {
    qb.andWhere('e.eventType = :eventType', { eventType: filters.eventType });
  }
  if (filters.locationId) {
    qb.andWhere('e.locationId = :locationId', { locationId: filters.locationId });
  }

  qb.leftJoinAndSelect('e.eventResources', 'er');
  qb.leftJoinAndSelect('e.attendees', 'att');
  qb.orderBy('e.startTime', 'ASC');
  return qb.getMany();
}

export async function findById(id: string): Promise<Event | null> {
  return eventRepo.findOne({ where: { id }, relations: ['eventResources', 'attendees'] });
}

export interface CreateEventDTO extends Partial<Event> {
  resourceIds?: string[];
}

export async function createEvent(dto: CreateEventDTO): Promise<Event> {
  return AppDataSource.transaction(async manager => {
    const ev = manager.create(Event, dto);
    const saved = await manager.save(ev);
    if (dto.resourceIds && dto.resourceIds.length > 0) {
      const ers = dto.resourceIds.map(rid => {
        const er = new EventResource();
        er.eventId = saved.id;
        er.resourceId = rid;
        return er;
      });
      await manager.save(ers);
      saved.eventResources = ers;
    }
    return saved;
  });
}

export async function updateEvent(id: string, dto: CreateEventDTO): Promise<Event | null> {
  return AppDataSource.transaction(async manager => {
    const existing = await manager.findOne(Event, { where: { id }, relations: ['eventResources'] });
    if (!existing) return null;

    // update scalar fields
    Object.assign(existing, dto);
    const saved = await manager.save(existing);

    if (dto.resourceIds) {
      // delete old links
      await manager.delete(EventResource, { eventId: id });
      if (dto.resourceIds.length > 0) {
        const ers = dto.resourceIds.map(rid => {
          const er = new EventResource();
          er.eventId = id;
          er.resourceId = rid;
          return er;
        });
        await manager.save(ers);
        saved.eventResources = ers;
      } else {
        saved.eventResources = [];
      }
    }
    return saved;
  });
}

export async function deleteEvent(id: string): Promise<boolean> {
  const res = await eventRepo.delete(id);
  return res.affected === 1;
} 