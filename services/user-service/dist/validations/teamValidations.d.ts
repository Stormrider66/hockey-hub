import { z } from 'zod';
export declare const createTeamSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        organizationId: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        season: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        primaryColor: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        organizationId: string;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }, {
        name: string;
        organizationId: string;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        organizationId: string;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        season?: string | undefined;
        category?: string | undefined;
    };
}, {
    body: {
        name: string;
        organizationId: string;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        season?: string | undefined;
        category?: string | undefined;
    };
}>;
export declare const updateTeamSchema: z.ZodObject<{
    params: z.ZodObject<{
        teamId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        teamId: string;
    }, {
        teamId: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        season: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        primaryColor: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }>, {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    };
    params: {
        teamId: string;
    };
}, {
    body: {
        name?: string | undefined;
        description?: string | undefined;
        logoUrl?: string | undefined;
        primaryColor?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        season?: string | undefined;
        category?: string | undefined;
    };
    params: {
        teamId: string;
    };
}>;
export declare const addTeamMemberSchema: z.ZodObject<{
    params: z.ZodObject<{
        teamId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        teamId: string;
    }, {
        teamId: string;
    }>;
    body: z.ZodObject<{
        userId: z.ZodString;
        role: z.ZodEnum<["player", "coach", "assistant_coach", "manager", "staff"]>;
        position: z.ZodOptional<z.ZodString>;
        jerseyNumber: z.ZodOptional<z.ZodString>;
        startDate: z.ZodEffects<z.ZodOptional<z.ZodString>, Date | undefined, string | undefined>;
    }, "strip", z.ZodTypeAny, {
        role: "player" | "coach" | "assistant_coach" | "manager" | "staff";
        userId: string;
        position?: string | undefined;
        jerseyNumber?: string | undefined;
        startDate?: Date | undefined;
    }, {
        role: "player" | "coach" | "assistant_coach" | "manager" | "staff";
        userId: string;
        position?: string | undefined;
        jerseyNumber?: string | undefined;
        startDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        role: "player" | "coach" | "assistant_coach" | "manager" | "staff";
        userId: string;
        position?: string | undefined;
        jerseyNumber?: string | undefined;
        startDate?: Date | undefined;
    };
    params: {
        teamId: string;
    };
}, {
    body: {
        role: "player" | "coach" | "assistant_coach" | "manager" | "staff";
        userId: string;
        position?: string | undefined;
        jerseyNumber?: string | undefined;
        startDate?: string | undefined;
    };
    params: {
        teamId: string;
    };
}>;
export declare const removeTeamMemberSchema: z.ZodObject<{
    params: z.ZodObject<{
        teamId: z.ZodString;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        teamId: string;
        userId: string;
    }, {
        teamId: string;
        userId: string;
    }>;
    query: z.ZodObject<{
        role: z.ZodOptional<z.ZodEnum<["player", "coach", "assistant_coach", "manager", "staff"]>>;
    }, "strip", z.ZodTypeAny, {
        role?: "player" | "coach" | "assistant_coach" | "manager" | "staff" | undefined;
    }, {
        role?: "player" | "coach" | "assistant_coach" | "manager" | "staff" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        role?: "player" | "coach" | "assistant_coach" | "manager" | "staff" | undefined;
    };
    params: {
        teamId: string;
        userId: string;
    };
}, {
    query: {
        role?: "player" | "coach" | "assistant_coach" | "manager" | "staff" | undefined;
    };
    params: {
        teamId: string;
        userId: string;
    };
}>;
export declare const getTeamSchema: z.ZodObject<{
    params: z.ZodObject<{
        teamId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        teamId: string;
    }, {
        teamId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        teamId: string;
    };
}, {
    params: {
        teamId: string;
    };
}>;
export declare const listTeamsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        limit: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        search: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived"]>>;
        category: z.ZodOptional<z.ZodString>;
        sort: z.ZodDefault<z.ZodOptional<z.ZodEnum<["name", "category", "createdAt"]>>>;
        order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        sort: "name" | "createdAt" | "category";
        page: number;
        limit: number;
        order: "asc" | "desc";
        search?: string | undefined;
        organizationId?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        category?: string | undefined;
    }, {
        search?: string | undefined;
        sort?: "name" | "createdAt" | "category" | undefined;
        organizationId?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        category?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        sort: "name" | "createdAt" | "category";
        page: number;
        limit: number;
        order: "asc" | "desc";
        search?: string | undefined;
        organizationId?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        category?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        sort?: "name" | "createdAt" | "category" | undefined;
        organizationId?: string | undefined;
        status?: "active" | "inactive" | "archived" | undefined;
        category?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    };
}>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>['body'];
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;
export type GetTeamInput = z.infer<typeof getTeamSchema>['params'];
export type ListTeamsQueryInput = z.infer<typeof listTeamsSchema>['query'];
//# sourceMappingURL=teamValidations.d.ts.map