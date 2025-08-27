export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function createPaginationResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total?: number
): PaginationResponse<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pageSize) || 1);
  const computedTotal = total ?? data.length;
  const hasPrev = safePage > 1;
  const hasNext = computedTotal > safePage * safeSize;
  return { data, total: computedTotal, page: safePage, pageSize: safeSize, hasPrev, hasNext };
}











