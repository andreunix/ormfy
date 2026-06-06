import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js';
export type TypegenSource = 'migrations' | 'database';
export declare function runTypegen(config: ResolvedOrmfyConfig, source: TypegenSource): Promise<void>;
