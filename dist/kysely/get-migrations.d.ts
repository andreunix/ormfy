import type { MigrationInfo, Migrator } from 'kysely/migration';
export declare function getMigrations(migrator: Migrator): Promise<readonly MigrationInfo[]>;
