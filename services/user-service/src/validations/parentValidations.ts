import { z } from 'zod';

const relationshipEnum = z.enum(['parent', 'guardian', 'other']).optional();

// Schema for adding a parent-child link
export const addParentLinkSchema = z.object({
  body: z.object({
    parentId: z.string().uuid({ message: 'Valid parent user ID is required' }),
    childId: z.string().uuid({ message: 'Valid child user ID is required' }),
    relationship: relationshipEnum.default('parent'),
    isPrimary: z.boolean().optional().default(false),
  }),
});

// Schema for removing a parent-child link (by link ID)
export const removeParentLinkSchema = z.object({
  params: z.object({
    linkId: z.string().uuid({ message: 'Invalid link ID format' }),
  }),
});

// Schema for getting children or parents (by user ID)
export const getRelatedUsersSchema = z.object({
  params: z.object({
      userId: z.string().uuid({ message: 'Invalid user ID format' })
  })
});

// Type definitions inferred from schemas
export type AddParentLinkInput = z.infer<typeof addParentLinkSchema>['body'];
export type RemoveParentLinkInput = z.infer<typeof removeParentLinkSchema>['params'];
export type GetRelatedUsersInput = z.infer<typeof getRelatedUsersSchema>['params']; 