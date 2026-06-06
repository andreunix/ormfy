import type { Migration, MigrationProvider } from 'kysely/migration';
import type { GetJitiArgs } from '../utils/jiti.js';
/**
 * An opinionated migration provider that reads migrations from TypeScript files.
 * Same as `FileMigrationProvider` but works in ESM/CJS without loader flag/s,
 * and on Windows too.
 */
export declare class TSFileMigrationProvider implements MigrationProvider {
    #private;
    constructor(props: TSFileMigrationProviderProps);
    getMigrations(): Promise<Record<string, Migration>>;
}
export interface TSFileMigrationProviderProps extends GetJitiArgs {
    migrationFolder: string;
}
