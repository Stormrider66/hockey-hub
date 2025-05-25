import AppDataSource from '../data-source';
import { EventAttendee } from '../entities/EventAttendee';

export interface AddAttendeeDTO {
  eventId: string;
  userId: string;
  status?: string;
  reasonForAbsence?: string | null;
}

const repo = AppDataSource.getRepository(EventAttendee);

export function findByEvent(eventId: string) {
  return repo.find({ where: { eventId } });
}

export async function addAttendee(dto: AddAttendeeDTO) {
  const attendee = repo.create({
    eventId: dto.eventId,
    userId: dto.userId,
    status: dto.status as any,
    reasonForAbsence: dto.reasonForAbsence ?? null,
  });
  return repo.save(attendee);
}

export async function removeAttendee(eventId: string, userId: string) {
  const res = await repo.delete({ eventId, userId });
  return res.affected === 1;
} 