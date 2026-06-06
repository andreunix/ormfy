import type { ResolvedOrmfyConfig } from './ormfy-config.js';
export interface GetConfigArgs {
    config?: string;
    debug?: boolean;
    environment?: string;
    'filesystem-caching'?: boolean;
    transaction?: boolean;
}
export declare function getConfig(args: GetConfigArgs): Promise<ResolvedOrmfyConfig | null>;
export declare function getConfigOrFail(args: GetConfigArgs): Promise<ResolvedOrmfyConfig>;
export declare function configFileExists(config: ResolvedOrmfyConfig | null): config is ResolvedOrmfyConfig;
