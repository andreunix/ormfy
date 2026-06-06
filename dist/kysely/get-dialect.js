import { MysqlDialect, PostgresDialect, SqliteDialect, } from 'kysely';
import { hydrate } from '../utils/hydrate.js';
export async function getDialect(config) {
    const { dialect } = config;
    if (!dialect) {
        throw new Error('No dialect provided');
    }
    if (typeof dialect !== 'string') {
        return await hydrate(dialect, []);
    }
    const dialectConfig = await hydrate(config.dialectConfig, []);
    if (dialect === 'pg') {
        return new PostgresDialect(dialectConfig);
    }
    if (dialect === 'mysql2') {
        return new MysqlDialect(dialectConfig);
    }
    if (dialect === 'tedious') {
        // since it was introduced only in kysely v0.27.0
        // and we want to support older versions too
        return new (await import('kysely')).MssqlDialect(dialectConfig);
    }
    if (dialect === 'better-sqlite3') {
        return new SqliteDialect(dialectConfig);
    }
    if (dialect === 'pglite') {
        // since it was introduced only in kysely v0.29.0
        // and we want to support older versions too
        return new (await import('kysely')).PGliteDialect(dialectConfig);
    }
    if (dialect === 'postgres' || dialect === 'bun') {
        return new (await import('kysely-postgres-js')).PostgresJSDialect(dialectConfig);
    }
    if (dialect === '@neondatabase/serverless') {
        return new (await import('kysely-neon')).NeonDialect(dialectConfig);
    }
    if (dialect === '@prisma/ppg') {
        return new (await import('kysely-prisma-postgres')).PPGDialect(dialectConfig);
    }
    dialect;
    throw new Error(`Unknown dialect: "${dialect}"`);
}
//# sourceMappingURL=get-dialect.js.map