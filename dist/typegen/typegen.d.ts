import type { ResolvedOrmfyConfig, TypegenSource } from '../config/ormfy-config.js';
export type ColumnInfo = {
    generated: boolean;
    name: string;
    nullable: boolean;
    tsType: string;
};
export type TableInfo = {
    columns: Map<string, ColumnInfo>;
    name: string;
};
export declare function runTypegen(config: ResolvedOrmfyConfig, source?: TypegenSource): Promise<void>;
export declare function getTablesFromDatabase(config: ResolvedOrmfyConfig): Promise<Map<string, TableInfo>>;
