"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateWithCursor = exports.decodeCursor = exports.encodeCursor = exports.generatePaginationLinks = exports.createPaginationMeta = exports.paginateArray = exports.paginate = exports.parsePaginationParams = void 0;
/**
 * Parse pagination parameters from request query
 */
function parsePaginationParams(query, defaults = {}) {
    const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
    const requestedLimit = parseInt(query.limit) || defaults.limit || 20;
    const maxLimit = defaults.maxLimit || 100;
    const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
    const skip = (page - 1) * limit;
    return { page, limit, skip, take: limit };
}
exports.parsePaginationParams = parsePaginationParams;
/**
 * Apply pagination to a TypeORM query builder
 */
async function paginate(queryBuilder, options) {
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
exports.paginate = paginate;
/**
 * Create pagination response from array
 */
function paginateArray(items, options) {
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
exports.paginateArray = paginateArray;
/**
 * Create pagination metadata
 */
function createPaginationMeta(page, limit, total) {
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
exports.createPaginationMeta = createPaginationMeta;
/**
 * Pagination links generator for REST APIs
 */
function generatePaginationLinks(baseUrl, currentPage, totalPages, queryParams = {}) {
    const buildUrl = (page) => {
        const params = new URLSearchParams({ ...queryParams, page: page.toString() });
        return `${baseUrl}?${params.toString()}`;
    };
    const links = {};
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
exports.generatePaginationLinks = generatePaginationLinks;
/**
 * Encode cursor for cursor-based pagination
 */
function encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}
exports.encodeCursor = encodeCursor;
/**
 * Decode cursor for cursor-based pagination
 */
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64').toString());
    }
    catch {
        throw new Error('Invalid cursor format');
    }
}
exports.decodeCursor = decodeCursor;
/**
 * Apply cursor-based pagination to query builder
 */
async function paginateWithCursor(queryBuilder, options, cursorField = 'createdAt') {
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
    const cursor = {};
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
exports.paginateWithCursor = paginateWithCursor;
