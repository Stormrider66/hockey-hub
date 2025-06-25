import { z } from 'zod';
export declare const addParentLinkSchema: z.ZodObject<{
    body: z.ZodObject<{
        parentId: z.ZodString;
        childId: z.ZodString;
        relationship: z.ZodDefault<z.ZodOptional<z.ZodEnum<["parent", "guardian", "other"]>>>;
        isPrimary: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        parentId: string;
        childId: string;
        isPrimary: boolean;
        relationship: "parent" | "guardian" | "other";
    }, {
        parentId: string;
        childId: string;
        isPrimary?: boolean | undefined;
        relationship?: "parent" | "guardian" | "other" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        parentId: string;
        childId: string;
        isPrimary: boolean;
        relationship: "parent" | "guardian" | "other";
    };
}, {
    body: {
        parentId: string;
        childId: string;
        isPrimary?: boolean | undefined;
        relationship?: "parent" | "guardian" | "other" | undefined;
    };
}>;
export declare const removeParentLinkSchema: z.ZodObject<{
    params: z.ZodObject<{
        linkId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        linkId: string;
    }, {
        linkId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        linkId: string;
    };
}, {
    params: {
        linkId: string;
    };
}>;
export declare const getRelatedUsersSchema: z.ZodObject<{
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
export type AddParentLinkInput = z.infer<typeof addParentLinkSchema>['body'];
export type RemoveParentLinkInput = z.infer<typeof removeParentLinkSchema>['params'];
export type GetRelatedUsersInput = z.infer<typeof getRelatedUsersSchema>['params'];
//# sourceMappingURL=parentValidations.d.ts.map