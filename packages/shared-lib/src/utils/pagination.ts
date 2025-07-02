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
export function parsePaginationParams(
  query: any,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationQuery {
  const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
  const requestedLimit = parseInt(query.limit) || defaults.limit || 20;
  const maxLimit = defaults.maxLimit || 100;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

/**
 * Apply pagination to a TypeORM query builder
 */
export async function paginate<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginationOptions
): Promise<PaginationResult<T>> {
  const { page, limit, skip } = parsePaginationParams(options);

  // Clone the query builder for counting
  const totalQueryBuilder = queryBuilder.clone();
  
  // Get total count
  const total = await totalQueryBuilder.getCount();
  
  // Apply pagination
  queryBuilder.skip(skip).take(limit);
  
  // Get paginated results
  const data = await queryBuilder.getMany();
  
  const pages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
}

/**
 * Create pagination response from array
 */
export function paginateArray<T>(
  items: T[],
  options: PaginationOptions
): PaginationResult<T> {
  const { page, limit, skip } = parsePaginationParams(options);
  const total = items.length;
  const pages = Math.ceil(total / limit);
  
  // Slice array for pagination
  const data = items.slice(skip, skip + limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationResult<any>['pagination'] {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}

/**
 * Pagination links generator for REST APIs
 */
export function generatePaginationLinks(
  baseUrl: string,
  currentPage: number,
  totalPages: number,
  queryParams: Record<string, any> = {}
): {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
} {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...queryParams, page: page.toString() });
    return `${baseUrl}?${params.toString()}`;
  };
  
  const links: any = {};
  
  if (currentPage > 1) {
    links.first = buildUrl(1);
    links.prev = buildUrl(currentPage - 1);
  }
  
  if (currentPage < totalPages) {
    links.next = buildUrl(currentPage + 1);
    links.last = buildUrl(totalPages);
  }
  
  return links;
}

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
export function encodeCursor(data: Record<string, any>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode cursor for cursor-based pagination
 */
export function decodeCursor(cursor: string): Record<string, any> {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Apply cursor-based pagination to query builder
 */
export async function paginateWithCursor<T extends { id: string; createdAt: Date }>(
  queryBuilder: SelectQueryBuilder<T>,
  options: CursorPaginationOptions,
  cursorField: keyof T = 'createdAt' as keyof T
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(options.limit || 20, 100);
  const direction = options.direction || 'next';
  
  if (options.cursor) {
    const cursorData = decodeCursor(options.cursor);
    const operator = direction === 'next' ? '<' : '>';
    
    queryBuilder.where(`${queryBuilder.alias}.${String(cursorField)} ${operator} :cursorValue`, {
      cursorValue: cursorData[String(cursorField)]
    });
  }
  
  // Order by cursor field
  const order = direction === 'next' ? 'DESC' : 'ASC';
  queryBuilder.orderBy(`${queryBuilder.alias}.${String(cursorField)}`, order);
  
  // Get one extra item to check if there are more results
  const items = await queryBuilder.take(limit + 1).getMany();
  
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  
  // If direction is prev, reverse the results
  if (direction === 'prev') {
    data.reverse();
  }
  
  const cursor: CursorPaginationResult<T>['cursor'] = {};
  
  if (data.length > 0) {
    const firstItem = data[0];
    const lastItem = data[data.length - 1];
    
    cursor.prev = encodeCursor({ [String(cursorField)]: firstItem[cursorField] });
    cursor.next = encodeCursor({ [String(cursorField)]: lastItem[cursorField] });
  }
  
  return {
    data,
    cursor,
    hasMore
  };
}