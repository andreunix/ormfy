import { CompiledQuery } from 'kysely';
export async function executeQuery(query, config) {
    return await config.kysely.executeQuery(CompiledQuery.raw(query.sql, query.parameters));
}
//# sourceMappingURL=execute-query.js.map