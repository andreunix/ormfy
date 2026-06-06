import type { Kysely } from 'kysely';
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js';
export declare function usingKysely<T>(config: ResolvedOrmfyConfig, callback: (kysely: Kysely<any>) => Promise<T>): Promise<T>;
