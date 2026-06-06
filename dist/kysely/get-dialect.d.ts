import { type Dialect } from 'kysely';
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js';
export declare function getDialect(config: ResolvedOrmfyConfig): Promise<Dialect>;
