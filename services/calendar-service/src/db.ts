import AppDataSource from './data-source';

/**
 * Compatibility wrapper mimicking the old `db` pool interface so that legacy
 * utilities (e.g. conflictDetection) can continue to function while they are
 * being migrated to the repository pattern.
 */
const db = {
  /**
   * Executes a raw SQL query using TypeORM's underlying driver. This should be
   * considered temporary – utilities should prefer repository/query-builder
   * abstractions instead of raw SQL.
   */
  async query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
    const rows = await AppDataSource.query(sql, params);
    return { rows };
  },
};

export default db; 