import type { Migrator } from 'kysely/migration';
import { type GetConfigArgs } from '../config/get-config.js';
export declare function usingMigrator<T>(args: GetConfigArgs, callback: (migrator: Migrator) => Promise<T>): Promise<T>;
