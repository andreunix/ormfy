import { Kysely } from 'kysely';
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js';
export declare function getKysely<DB = any>(config: ResolvedOrmfyConfig, debug?: boolean): Promise<Kysely<DB>>;
