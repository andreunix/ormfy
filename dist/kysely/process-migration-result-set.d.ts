import type { MigrationResultSet, Migrator } from 'kysely/migration';
export declare function processMigrationResultSet(resultSet: MigrationResultSet, direction: 'up' | 'down', migrator: Migrator): Promise<void>;
