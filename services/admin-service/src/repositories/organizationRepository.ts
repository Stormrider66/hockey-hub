import { AppDataSource } from '../data-source';
import { Organization } from '../entities/Organization';

const repo = () => AppDataSource.getRepository(Organization);

export const createOrganization = async (name: string) => {
  const entity = repo().create({ name });
  return repo().save(entity);
}; 