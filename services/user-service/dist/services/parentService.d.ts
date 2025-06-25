import { User } from '../entities/User';
import { PlayerParentLink } from '../entities/PlayerParentLink';
interface AddParentLinkDto {
    parentId: string;
    childId: string;
    relationship?: 'parent' | 'guardian' | 'other';
    isPrimary?: boolean;
}
export declare class ParentService {
    private linkRepository;
    private userRepository;
    constructor();
    addParentChildLink(data: AddParentLinkDto): Promise<PlayerParentLink>;
    removeParentChildLink(linkId: string): Promise<void>;
    getChildrenForParent(parentId: string): Promise<User[]>;
    getParentsForChild(childId: string): Promise<User[]>;
    isParentOf(parentId: string, childId: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=parentService.d.ts.map