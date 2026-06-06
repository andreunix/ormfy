import { type QueryResult } from 'kysely';
import type { ResolvedOrmfyConfigWithKyselyInstance } from '../config/ormfy-config.js';
export interface Query {
    parameters?: unknown[];
    sql: string;
}
export declare function executeQuery(query: Query, config: ResolvedOrmfyConfigWithKyselyInstance): Promise<QueryResult<unknown>>;
