import AppDataSource from '../data-source';
import { ResourceType } from '../entities/ResourceType';

export interface ResourceTypeFilters {
  organizationId?: string;
}

const repo = AppDataSource.getRepository(ResourceType);

export function findAll(filters: ResourceTypeFilters) {
  const qb = repo.createQueryBuilder('rt');
  if (filters.organizationId) qb.where('rt.organizationId = :org', { org: filters.organizationId });
  qb.orderBy('rt.name', 'ASC');
  return qb.getMany();
}

export function findById(id: string) {
  return repo.findOne({ where: { id } });
}

export function createResourceType(dto: Partial<ResourceType>) {
  const entity = repo.create(dto);
  return repo.save(entity);
}

export async function updateResourceType(id: string, dto: Partial<ResourceType>) {
  await repo.update(id, dto);
  return findById(id);
}

export async function deleteResourceType(id: string) {
  const res = await repo.delete(id);
  return res.affected === 1;
} 