import { getRepository, Repository } from 'typeorm';
import { User } from '../entities/User';
import { PlayerParentLink } from '../entities/PlayerParentLink';
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import logger from '../config/logger';

// DTOs (Define properly later)
interface AddParentLinkDto {
    parentId: string;
    childId: string;
    relationship?: 'parent' | 'guardian' | 'other';
    isPrimary?: boolean;
}

export class ParentService {
    private linkRepository: Repository<PlayerParentLink>;
    private userRepository: Repository<User>;

    constructor() {
        this.linkRepository = getRepository(PlayerParentLink);
        this.userRepository = getRepository(User);
    }

    async addParentChildLink(data: AddParentLinkDto): Promise<PlayerParentLink> {
        logger.info(`Attempting to link parent ${data.parentId} to child ${data.childId}`);

        // Validate parent and child exist and potentially have correct roles (e.g., child is a player)
        const [parent, child] = await Promise.all([
            this.userRepository.findOne({ where: { id: data.parentId } }),
            this.userRepository.findOne({ where: { id: data.childId } })
        ]);

        if (!parent) {
            throw new NotFoundError(`Parent user with ID ${data.parentId} not found`);
        }
        if (!child) {
            throw new NotFoundError(`Child user with ID ${data.childId} not found`);
        }
        
        // Optional: Add checks for parent/child roles if needed

        // Check if link already exists
        const existingLink = await this.linkRepository.findOne({
            where: { parentId: data.parentId, childId: data.childId }
        });
        if (existingLink) {
            throw new ConflictError(`Link between parent ${data.parentId} and child ${data.childId} already exists`);
        }

        // Handle primary guardian logic (ensure only one primary per child)
        if (data.isPrimary) {
            await this.linkRepository.update(
                { childId: data.childId, isPrimary: true }, 
                { isPrimary: false } 
            );
        }

        const newLink = this.linkRepository.create({
            parentId: data.parentId,
            childId: data.childId,
            relationship: data.relationship || 'parent',
            isPrimary: data.isPrimary === undefined ? false : data.isPrimary,
        });

        const savedLink = await this.linkRepository.save(newLink);
        logger.info(`Successfully linked parent ${data.parentId} to child ${data.childId} (Link ID: ${savedLink.id})`);
        return savedLink;
    }

    async removeParentChildLink(linkId: string): Promise<void> {
        logger.warn(`Attempting to remove parent-child link ${linkId}`);
        const link = await this.linkRepository.findOne({ where: { id: linkId } });
        if (!link) {
            throw new NotFoundError(`Parent-child link with ID ${linkId} not found`);
        }

        await this.linkRepository.remove(link);
        // Or soft delete if configured: await this.linkRepository.softRemove(link);
        logger.info(`Parent-child link ${linkId} removed successfully`);
    }

    async getChildrenForParent(parentId: string): Promise<User[]> {
        const links = await this.linkRepository.find({
            where: { parentId },
            relations: ['child']
        });
        const childrenPromises = links.map(async (link) => await link.child);
        const children = await Promise.all(childrenPromises);
        return children.filter((child): child is User => !!child);
    }

    async getParentsForChild(childId: string): Promise<User[]> {
        const links = await this.linkRepository.find({
            where: { childId },
            relations: ['parent']
        });
        const parentPromises = links.map(async (link) => await link.parent);
        const parents = await Promise.all(parentPromises);
        return parents.filter((parent): parent is User => !!parent);
    }
    
    // Helper to check if a user is a parent/guardian of another user
    async isParentOf(parentId: string, childId: string): Promise<boolean> {
        const count = await this.linkRepository.count({ where: { parentId, childId } });
        return count > 0;
    }
} 