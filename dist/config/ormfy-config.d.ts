import type { Kysely, Dialect as KyselyDialectInstance, KyselyPlugin, MssqlDialectConfig, MysqlDialectConfig, PGliteDialectConfig, PostgresDialectConfig, SqliteDialectConfig } from 'kysely';
import type { MigrationProvider, Migrator, MigratorProps } from 'kysely/migration';
import type { NeonDialectConfig } from 'kysely-neon';
import type { PostgresJSDialectConfig } from 'kysely-postgres-js';
import type { PPGDialectConfig } from 'kysely-prisma-postgres';
import type { Seeder, SeederProps, SeedProvider } from '../seeds/seeder.js';
import type { GetConfigArgs } from './get-config.js';
type SetRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type TypegenSource = 'migrations' | 'database';
export type KyselyDialect = ResolvableKyselyDialect | KyselyDialectInstance;
export type ResolvableKyselyDialect = KyselyCoreDialect | KyselyOrganizationDialect;
export type KyselyCoreDialect = 'pg' | 'mysql2' | 'tedious' | 'better-sqlite3' | 'pglite';
export type KyselyOrganizationDialect = 'postgres' | '@neondatabase/serverless' | 'bun' | '@prisma/ppg';
export type Factory<T, P extends any[] = []> = (...args: P) => T | Promise<T>;
export type OrFactory<T, P extends any[] = []> = T | Factory<T, P>;
interface KyselyDialectConfigDictionary {
    '@neondatabase/serverless': NeonDialectConfig;
    '@prisma/ppg': PPGDialectConfig;
    'better-sqlite3': SqliteDialectConfig;
    bun: PostgresJSDialectConfig;
    mysql2: MysqlDialectConfig;
    pg: PostgresDialectConfig;
    pglite: PGliteDialectConfig;
    postgres: PostgresJSDialectConfig;
    tedious: MssqlDialectConfig;
}
export type KyselyDialectConfig<Dialect extends KyselyDialect> = Dialect extends ResolvableKyselyDialect ? KyselyDialectConfigDictionary[Dialect] : never;
export type OrmfyConfig<Dialect extends KyselyDialect = KyselyDialect> = {
    destroyOnExit?: boolean;
    /**
     * Pasta onde o comando `gen:models` escreve os arquivos por tabela.
     *
     * Padrao: `src/db/models`
     */
    models?: ModelsBaseConfig;
    /**
     * Configuracao do comando `gen:types`.
     *
     * O default e `migrations`, mas pode ser trocado para `database`.
     */
    typegen?: TypegenBaseConfig;
    migrations?: MigratorlessMigrationsConfig | MigratorfulMigrationsConfig;
    seeds?: SeederlessSeedsConfig | SeederfulSeedsConfig;
} & (Dialect extends ResolvableKyselyDialect ? {
    dialect: Dialect;
    dialectConfig: OrFactory<KyselyDialectConfig<Dialect>>;
    kysely?: never;
    plugins?: OrFactory<KyselyPlugin[]>;
} : {
    dialect: OrFactory<Dialect>;
    kysely?: never;
    plugins?: OrFactory<KyselyPlugin[]>;
} | {
    dialect?: never;
    dialectConfig?: never;
    kysely: OrFactory<Kysely<any>>;
    plugins?: never;
});
type MigratorfulMigrationsConfig = Pick<MigrationsBaseConfig, 'getMigrationPrefix'> & {
    migrationFolder?: never;
    migrator: Factory<Migrator, [db: Kysely<any>]>;
    provider?: never;
};
type MigratorlessMigrationsConfig = MigrationsBaseConfig & ({
    migrationFolder?: string;
    migrator?: never;
    provider?: never;
} | {
    migrationFolder?: never;
    migrator?: never;
    provider: OrFactory<MigrationProvider>;
});
type SeederfulSeedsConfig = Pick<SeedsBaseConfig, 'getSeedPrefix'> & {
    provider?: never;
    seeder: Factory<Seeder, [db: Kysely<any>]>;
    seedFolder?: never;
};
type SeederlessSeedsConfig = SeedsBaseConfig & ({
    provider?: never;
    seeder?: never;
    seedFolder?: string;
} | {
    provider: OrFactory<SeedProvider>;
    seeder?: never;
    seedFolder?: never;
});
export interface ResolvedOrmfyConfig {
    args: GetConfigArgs;
    configMetadata: {
        configFile?: string;
    };
    cwd: string;
    destroyOnExit?: boolean;
    dialect?: KyselyDialect;
    dialectConfig?: OrFactory<KyselyDialectConfig<ResolvableKyselyDialect>>;
    kysely?: OrFactory<Kysely<any>>;
    models: SetRequired<ModelsBaseConfig, 'modelsFolder'> & {
        modelsFolder: string;
        dbImportPath: string;
        source: TypegenSource;
    };
    typegen: SetRequired<TypegenBaseConfig, 'source'> & {
        source: TypegenSource;
    };
    migrations: SetRequired<MigrationsBaseConfig, 'getMigrationPrefix'> & {
        migrationFolder: string;
        migrator?: Factory<Migrator, [db: Kysely<any>]>;
        provider?: OrFactory<MigrationProvider>;
    };
    plugins?: OrFactory<KyselyPlugin[]>;
    seeds: SetRequired<SeedsBaseConfig, 'getSeedPrefix'> & {
        provider?: OrFactory<SeedProvider>;
        seeder?: Factory<Seeder, [db: Kysely<any>]>;
        seedFolder: string;
    };
}
export interface ResolvedOrmfyConfigWithKyselyInstance extends Omit<ResolvedOrmfyConfig, 'kysely'> {
    kysely: Kysely<any>;
}
export type MigrationsBaseConfig = Omit<MigratorProps, 'db' | 'provider'> & {
    getMigrationPrefix?(): string | Promise<string>;
};
/**
 * Configuracao do gerador de models.
 *
 * O caminho e resolvido a partir da raiz do projeto.
 */
export type ModelsBaseConfig = {
    /**
     * Fonte usada pelo `gen:models`.
     *
     * O default e `migrations`, e pode ser trocado para `database`.
     */
    source?: TypegenSource;
    modelsFolder?: string;
    dbImportPath?: string;
};
/**
 * Configuracao do gerador de tipos.
 */
export type TypegenBaseConfig = {
    source?: TypegenSource;
};
export type SeedsBaseConfig = Omit<SeederProps, 'db' | 'provider'> & {
    getSeedPrefix?(): string | Promise<string>;
};
export {};
