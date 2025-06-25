import { z } from 'zod';
export declare const createOrganizationSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        contactEmail: z.ZodString;
        contactPhone: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        country: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        primaryColor: z.ZodOptional<z.ZodString>;
        secondaryColor: z.ZodOptional<z.ZodString>;
        defaultLanguage: z.ZodDefault<z.ZodOptional<z.ZodEnum<["sv", "en"]>>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        contactEmail: string;
        country: string;
        defaultLanguage: "sv" | "en";
        contactPhone?: string | undefined;
        logoUrl?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
    }, {
        name: string;
        contactEmail: string;
        contactPhone?: string | undefined;
        logoUrl?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        contactEmail: string;
        country: string;
        defaultLanguage: "sv" | "en";
        contactPhone?: string | undefined;
        logoUrl?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
    };
}, {
    body: {
        name: string;
        contactEmail: string;
        contactPhone?: string | undefined;
        logoUrl?: string | undefined;
        address?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
        primaryColor?: string | undefined;
        secondaryColor?: string | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    };
}>;
export declare const updateOrganizationSchema: z.ZodObject<{
    params: z.ZodObject<{
        organizationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        organizationId: string;
    }, {
        organizationId: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        contactEmail: z.ZodOptional<z.ZodString>;
        contactPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        primaryColor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        secondaryColor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        defaultLanguage: z.ZodOptional<z.ZodEnum<["sv", "en"]>>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "trial"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    }, {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    }>, {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    }, {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    };
    params: {
        organizationId: string;
    };
}, {
    body: {
        name?: string | undefined;
        contactEmail?: string | undefined;
        contactPhone?: string | null | undefined;
        logoUrl?: string | null | undefined;
        address?: string | null | undefined;
        city?: string | null | undefined;
        country?: string | null | undefined;
        primaryColor?: string | null | undefined;
        secondaryColor?: string | null | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        defaultLanguage?: "sv" | "en" | undefined;
    };
    params: {
        organizationId: string;
    };
}>;
export declare const getOrganizationSchema: z.ZodObject<{
    params: z.ZodObject<{
        organizationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        organizationId: string;
    }, {
        organizationId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        organizationId: string;
    };
}, {
    params: {
        organizationId: string;
    };
}>;
export declare const listOrganizationsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        limit: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>;
        search: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "trial"]>>;
        sort: z.ZodDefault<z.ZodOptional<z.ZodEnum<["name", "createdAt"]>>>;
        order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        sort: "name" | "createdAt";
        page: number;
        limit: number;
        order: "asc" | "desc";
        search?: string | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
    }, {
        search?: string | undefined;
        sort?: "name" | "createdAt" | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        sort: "name" | "createdAt";
        page: number;
        limit: number;
        order: "asc" | "desc";
        search?: string | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        sort?: "name" | "createdAt" | undefined;
        status?: "active" | "inactive" | "trial" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        order?: "asc" | "desc" | undefined;
    };
}>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type GetOrganizationInput = z.infer<typeof getOrganizationSchema>['params'];
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>['query'];
//# sourceMappingURL=organizationValidations.d.ts.map