import { z } from 'zod';
export declare const getUserSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        userId: string;
    };
}, {
    params: {
        userId: string;
    };
}>;
export declare const updateUserSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        preferredLanguage: z.ZodOptional<z.ZodEnum<["sv", "en"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "pending"]>>;
        avatarUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    }, {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    }>, {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    }, {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    };
    params: {
        userId: string;
    };
}, {
    body: {
        phone?: string | null | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        preferredLanguage?: "sv" | "en" | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        avatarUrl?: string | null | undefined;
    };
    params: {
        userId: string;
    };
}>;
export declare const listUsersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        limit: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        search: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "pending"]>>;
        sort: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "email", "createdAt"]>>>;
        order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
        organizationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sort: "createdAt" | "email" | "firstName" | "lastName";
        page: number;
        limit: number;
        order: "asc" | "desc";
        role?: string | undefined;
        search?: string | undefined;
        organizationId?: string | undefined;
        teamId?: string | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
    }, {
        role?: string | undefined;
        search?: string | undefined;
        sort?: "createdAt" | "email" | "firstName" | "lastName" | undefined;
        organizationId?: string | undefined;
        teamId?: string | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        sort: "createdAt" | "email" | "firstName" | "lastName";
        page: number;
        limit: number;
        order: "asc" | "desc";
        role?: string | undefined;
        search?: string | undefined;
        organizationId?: string | undefined;
        teamId?: string | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
    };
}, {
    query: {
        role?: string | undefined;
        search?: string | undefined;
        sort?: "createdAt" | "email" | "firstName" | "lastName" | undefined;
        organizationId?: string | undefined;
        teamId?: string | undefined;
        status?: "active" | "inactive" | "pending" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    };
}>;
export declare const assignRoleSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
    body: z.ZodObject<{
        roleName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        roleName: string;
    }, {
        roleName: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        roleName: string;
    };
    params: {
        userId: string;
    };
}, {
    body: {
        roleName: string;
    };
    params: {
        userId: string;
    };
}>;
export declare const removeRoleSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
        roleName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        roleName: string;
    }, {
        userId: string;
        roleName: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        userId: string;
        roleName: string;
    };
}, {
    params: {
        userId: string;
        roleName: string;
    };
}>;
export type GetUserInput = z.infer<typeof getUserSchema>['params'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>['query'];
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>['params'];
//# sourceMappingURL=userValidations.d.ts.map