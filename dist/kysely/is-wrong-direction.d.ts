import type { Migrator } from 'kysely/migration';
export declare function isWrongDirection(migrationName: string | undefined, expectedDirection: 'up' | 'down', migrator: Migrator): Promise<boolean>;
