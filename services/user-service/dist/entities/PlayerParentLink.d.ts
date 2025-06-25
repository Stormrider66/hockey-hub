import { User } from './User';
export type RelationshipType = 'parent' | 'guardian' | 'other';
export declare class PlayerParentLink {
    id: string;
    parentId: string;
    parent: Promise<User>;
    childId: string;
    child: Promise<User>;
    relationship: RelationshipType;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=PlayerParentLink.d.ts.map