import AppDataSource from '../data-source';
import { Resource } from '../entities/Resource';

export interface ResourceFilters {
  organizationId?: string;
  locationId?: string;
  resourceTypeId?: string;
}

const repo = AppDataSource.getRepository(Resource);

export function findAll(filters: ResourceFilters) {
  const qb = repo.createQueryBuilder('r');
  if (filters.organizationId) qb.andWhere('r.organizationId = :org', { org: filters.organizationId });
  if (filters.locationId) qb.andWhere('r.locationId = :loc', { loc: filters.locationId });
  if (filters.resourceTypeId) qb.andWhere('r.resourceTypeId = :rt', { rt: filters.resourceTypeId });
  qb.andWhere('r.isBookable = true');
  qb.orderBy('r.name', 'ASC');
  return qb.getMany();
}

export function findById(id: string) {
  return repo.findOne({ where: { id } });
}

export function createResource(dto: Partial<Resource>) {
  const res = repo.create(dto);
  return repo.save(res);
}

export async function updateResource(id: string, dto: Partial<Resource>) {
  await repo.update(id, dto);
  return findById(id);
}

export async function deleteResource(id: string) {
  const res = await repo.delete(id);
  return res.affected === 1;
} 