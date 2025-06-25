import { Pool, PoolClient, QueryResult } from 'pg';
interface DbInterface {
    query: (text: string, params?: any[]) => Promise<QueryResult<any>>;
    getClient: () => Promise<PoolClient>;
    pool: Pool | null;
}
declare const dbInterface: DbInterface;
export default dbInterface;
//# sourceMappingURL=index.d.ts.map