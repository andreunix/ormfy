import type { OrmfyColumn, OrmfyTableName } from "./types.js";
export declare function createOrmfyGuard<DB, TName extends OrmfyTableName<DB>>(tableName: TName, columns: readonly OrmfyColumn<DB, TName>[], guarded?: readonly OrmfyColumn<DB, TName>[]): {
    assertAssignableColumn: (column: string) => void;
    assertAssignableColumns: (values: readonly string[]) => void;
    assertColumn: (column: string) => void;
    assertColumns: (values: readonly string[]) => void;
    assertFilter: (filter?: Record<string, unknown>) => void;
    columns: readonly OrmfyColumn<DB, TName>[];
    guarded: readonly OrmfyColumn<DB, TName>[];
};
export declare function hasOrmfyFilterConditions(filter?: Record<string, unknown>): boolean;
