import { CompiledQuery, type QueryResult } from 'kysely'
import type { ResolvedOrmfyConfigWithKyselyInstance } from '../config/ormfy-config.js'

export interface Query {
	parameters?: unknown[]
	sql: string
}

export async function executeQuery(
	query: Query,
	config: ResolvedOrmfyConfigWithKyselyInstance,
): Promise<QueryResult<unknown>> {
	return await config.kysely.executeQuery(
		CompiledQuery.raw(query.sql, query.parameters),
	)
}
