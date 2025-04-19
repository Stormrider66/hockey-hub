// Placeholder for PhysicalSessionTemplate repository
import { Repository, EntityRepository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { PhysicalSessionTemplate } from '../entities/PhysicalSessionTemplate';

@EntityRepository(PhysicalSessionTemplate)
export class PhysicalSessionTemplateRepository extends Repository<PhysicalSessionTemplate> {
    async findTemplates(filters: {
        organizationId?: string;
        categoryId?: string;
        searchTerm?: string;
    }, limit: number, offset: number): Promise<PhysicalSessionTemplate[]> {
        const query = this.createQueryBuilder('template')
            .where('1=1');

        if (filters.organizationId) {
            query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                orgId: filters.organizationId
            });
        } else {
            query.andWhere('template.is_public = true');
        }

        if (filters.categoryId) {
            query.andWhere('template.categoryId = :categoryId', { categoryId: filters.categoryId });
        }

        if (filters.searchTerm) {
            query.andWhere(
                '(template.name ILIKE :search OR template.description ILIKE :search)',
                { search: `%${filters.searchTerm}%` }
            );
        }

        return query
            .orderBy('template.created_at', 'DESC')
            .take(limit)
            .skip(offset)
            .getMany();
    }

    async countTemplates(filters: {
        organizationId?: string;
        categoryId?: string;
        searchTerm?: string;
    }): Promise<number> {
        const query = this.createQueryBuilder('template')
            .where('1=1');

        if (filters.organizationId) {
            query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                orgId: filters.organizationId
            });
        } else {
            query.andWhere('template.is_public = true');
        }

        if (filters.categoryId) {
            query.andWhere('template.categoryId = :categoryId', { categoryId: filters.categoryId });
        }

        if (filters.searchTerm) {
            query.andWhere(
                '(template.name ILIKE :search OR template.description ILIKE :search)',
                { search: `%${filters.searchTerm}%` }
            );
        }

        return query.getCount();
    }

    async findTemplateById(id: string, organizationId?: string): Promise<PhysicalSessionTemplate | null> {
        const query = this.createQueryBuilder('template')
            .where('template.id = :id', { id });

        if (organizationId) {
            query.andWhere('(template.organization_id = :orgId OR template.is_public = true)', {
                orgId: organizationId
            });
        } else {
            query.andWhere('template.is_public = true');
        }

        return query.getOne();
    }

    async createTemplate(data: Partial<PhysicalSessionTemplate>): Promise<PhysicalSessionTemplate> {
        const template = this.create(data);
        return this.save(template);
    }

    async updateTemplate(id: string, data: Partial<PhysicalSessionTemplate>): Promise<PhysicalSessionTemplate | null> {
        const result = await this.update(id, data);
        if (result.affected === 0) {
            return null;
        }
        return this.findOneBy({ id });
    }

    async deleteTemplate(id: string): Promise<boolean> {
        const result = await this.softDelete(id);
        return result.affected === 1;
    }
}

// Export the repository instance
export const physicalSessionTemplateRepository = AppDataSource.getCustomRepository(PhysicalSessionTemplateRepository); 