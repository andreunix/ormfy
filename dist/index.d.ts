import type { Kysely } from "kysely";
import type { Ormfy, OrmfyConfig, OrmfyCustomOpsFactory, OrmfyInsert, OrmfyTableName } from "./types.js";
type OrmfyCustomOpsInput<DB, TName extends OrmfyTableName<DB>, CustomOps extends object> = CustomOps | OrmfyCustomOpsFactory<DB, TName, CustomOps>;
export type * from "./types.js";
export * from "./errors.js";
export { buildCLI, type CLI } from "./cli.js";
export { type DefineConfigInput, defineConfig, } from "./config/define-config.js";
export { DUMMY_DIALECT_CONFIG } from "./config/dummy-dialect-config.js";
export { getKnexTimestampPrefix } from "./config/get-file-prefix.js";
export type { KyselyCoreDialect, OrmfyConfig, KyselyDialect, KyselyDialectConfig, KyselyOrganizationDialect, MigrationsBaseConfig, ResolvableKyselyDialect, SeedsBaseConfig, } from "./config/ormfy-config.js";
export { TSFileMigrationProvider, type TSFileMigrationProviderProps, } from "./kysely/ts-file-migration-provider.js";
export { FileSeedProvider, type FileSeedProviderProps, } from "./seeds/file-seed-provider.js";
export { type Seed, Seeder, type SeederProps, type SeedInfo, type SeedProvider, type SeedResult, type SeedResultSet, } from "./seeds/seeder.js";
/**
 * Cria um model pequeno no estilo Active Record por cima do Kysely.
 *
 * O Ormfy mantem o Kysely disponivel via `query()` e `transaction()`, mas adiciona
 * helpers comuns como `find`, `create`, `updateById`, `paginate`,
 * `firstOrCreate`, `pluck`, `exists` e `lockForUpdate`.
 *
 * A lista `columns` funciona como allowlist em runtime para filtros, ordenacao,
 * updates e referencias dinamicas de coluna. Use `guarded` para bloquear mass
 * assignment em colunas como `id`, `created_at` e `updated_at`.
 *
 * @example
 * ```ts
 * export const citiesModel = ormfy(db, "cities", {
 *   columns: databaseColumns.cities,
 *   guarded: defaultOrmfyGuardedColumns,
 *   idStrategy: "uuidv7",
 *   primaryKey: "id",
 * })
 *
 * await citiesModel.create({ name: "Porto Velho", state_code: "RO" })
 * await citiesModel.find({ state_code: "RO" }, { sort: [["name", "asc"]] })
 * ```
 *
 * @example Metodos customizados no model
 * ```ts
 * export const citiesModel = ormfy(db, "cities", config, {
 *   findByStateCode(stateCode: string) {
 *     return citiesModel.find({ state_code: stateCode })
 *   },
 * })
 * ```
 */
export declare function ormfy<DB, TName extends OrmfyTableName<DB>, CustomOps extends object = object>(db: Kysely<DB>, tableName: TName, config: OrmfyConfig<DB, TName>, customOps?: OrmfyCustomOpsInput<DB, TName, CustomOps>): Ormfy<DB, TName, CustomOps>;
export declare function createOrmfyId(): string;
export type OrmfyInsertable<DB, TName extends OrmfyTableName<DB>> = OrmfyInsert<DB, TName>;
