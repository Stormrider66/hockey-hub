import AppDataSource from '../data-source';
import { Location } from '../entities/Location';

export interface LocationFilters {
  organizationId?: string;
}

const repo = AppDataSource.getRepository(Location);

export function findAll(filters: LocationFilters) {
  const qb = repo.createQueryBuilder('l');
  if (filters.organizationId) qb.where('l.organizationId = :org', { org: filters.organizationId });
  qb.orderBy('l.name', 'ASC');
  return qb.getMany();
}

export function findById(id: string) {
  return repo.findOne({ where: { id } });
}

export function createLocation(dto: Partial<Location>) {
  const location = repo.create(dto);
  return repo.save(location);
}

export async function updateLocation(id: string, dto: Partial<Location>) {
  await repo.update(id, dto);
  return findById(id);
}

export async function deleteLocation(id: string) {
  const res = await repo.delete(id);
  return res.affected === 1;
} 