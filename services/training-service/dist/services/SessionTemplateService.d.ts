import { SessionTemplate } from '../entities';
export interface CreateSessionTemplateDto {
    name: string;
    description?: string;
    category: string;
    type: string;
    difficulty: string;
    visibility: string;
    organizationId: string;
    teamId?: string;
    createdBy: string;
    estimatedDuration: number;
    exercises: any[];
    warmup?: any;
    cooldown?: any;
    equipment?: string[];
    targetGroups?: any;
    goals?: string[];
    tags?: string[];
    permissions?: any;
}
export interface UpdateSessionTemplateDto extends Partial<CreateSessionTemplateDto> {
    id: string;
}
export interface SessionTemplateFilter {
    organizationId?: string;
    teamId?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    visibility?: string;
    createdBy?: string;
    search?: string;
    tags?: string[];
    isActive?: boolean;
}
export declare class SessionTemplateService {
    private repository;
    private logger;
    constructor();
    create(data: CreateSessionTemplateDto): Promise<SessionTemplate>;
    findAll(filter: SessionTemplateFilter, userId: string, page?: number, limit?: number): Promise<{
        data: SessionTemplate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, userId: string): Promise<SessionTemplate | null>;
    update(id: string, data: Partial<UpdateSessionTemplateDto>, userId: string): Promise<SessionTemplate>;
    delete(id: string, userId: string): Promise<void>;
    incrementUsageCount(id: string): Promise<void>;
    createFromWorkoutSession(workoutSessionId: string, data: Partial<CreateSessionTemplateDto>): Promise<SessionTemplate>;
    duplicateTemplate(id: string, userId: string, newName: string): Promise<SessionTemplate>;
    getPopularTemplates(organizationId: string, limit?: number): Promise<SessionTemplate[]>;
    bulkAssignToWorkouts(templateId: string, assignmentData: {
        playerIds: string[];
        teamId: string;
        scheduledDates: Date[];
        userId: string;
    }): Promise<{
        created: number;
        errors: any[];
    }>;
    private hasAccess;
    private canEdit;
}
//# sourceMappingURL=SessionTemplateService.d.ts.map