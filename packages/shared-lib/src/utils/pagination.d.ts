import { SelectQueryBuilder } from 'typeorm';
export interface PaginationOptions {
    page?: number;
    limit?: number;
    maxLimit?: number;
}
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface PaginationQuery {
    skip: number;
    take: number;
    page: number;
    limit: number;
}
/**
 * Parse pagination parameters from request query
 */
export declare function parsePaginationParams(query: Record<string, unknown>, defaults?: {
    page?: number;
    limit?: number;
    maxLimit?: number;
}): PaginationQuery;
/**
 * Apply pagination to a TypeORM query builder
 */
export declare function paginate<T>(queryBuilder: SelectQueryBuilder<T>, options: PaginationOptions): Promise<PaginationResult<T>>;
/**
 * Create pagination response from array
 */
export declare function paginateArray<T>(items: T[], options: PaginationOptions): PaginationResult<T>;
/**
 * Create pagination metadata
 */
export declare function createPaginationMeta(page: number, limit: number, total: number): PaginationResult<unknown>['pagination'];
/**
 * Pagination links generator for REST APIs
 */
export declare function generatePaginationLinks(baseUrl: string, currentPage: number, totalPages: number, queryParams?: Record<string, unknown>): {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
};
/**
 * Cursor-based pagination utilities
 */
export interface CursorPaginationOptions {
    cursor?: string;
    limit?: number;
    direction?: 'next' | 'prev';
}
export interface CursorPaginationResult<T> {
    data: T[];
    cursor: {
        next?: string;
        prev?: string;
    };
    hasMore: boolean;
}
/**
 * Encode cursor for cursor-based pagination
 */
export declare function encodeCursor(data: Record<string, unknown>): string;
/**
 * Decode cursor for cursor-based pagination
 */
export declare function decodeCursor(cursor: string): Record<string, unknown>;
/**
 * Apply cursor-based pagination to query builder
 */
export declare function paginateWithCursor<T extends {
    id: string;
    createdAt: Date;
}>(queryBuilder: SelectQueryBuilder<T>, options: CursorPaginationOptions, cursorField?: keyof T): Promise<CursorPaginationResult<T>>;
//# sourceMappingURL=pagination.d.ts.map