export interface AddParentLinkDto {
    parentId: string;
    childId: string;
    relationship?: 'parent' | 'guardian' | 'other';
    isPrimary?: boolean;
}
export interface RemoveParentLinkDto {
    linkId: string;
}
//# sourceMappingURL=parent.dto.d.ts.map