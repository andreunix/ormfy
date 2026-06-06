import type { Migrator } from 'kysely/migration';
import type { ResolvedOrmfyConfigWithKyselyInstance } from '../config/ormfy-config.js';
export declare function getMigrator(config: ResolvedOrmfyConfigWithKyselyInstance): Promise<Migrator>;
