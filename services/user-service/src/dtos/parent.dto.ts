// Define DTO interfaces for parent-child link operations

export interface AddParentLinkDto {
    parentId: string; // UUID
    childId: string; // UUID
    relationship?: 'parent' | 'guardian' | 'other';
    isPrimary?: boolean;
}

export interface RemoveParentLinkDto {
    linkId: string; // UUID of the PlayerParentLink record
} 