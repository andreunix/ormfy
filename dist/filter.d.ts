import type { OrmfyFindFilter, OrmfyTableName, OrmfyUpdateInput } from "./types.js";
export declare function applyOrmfyFilter<Query, DB, TName extends OrmfyTableName<DB>>(query: Query, { $between, $complex, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...filter }?: OrmfyFindFilter<DB, TName>): Query;
export declare function splitOrmfyUpdate<DB, TName extends OrmfyTableName<DB>>(data: OrmfyUpdateInput<DB, TName>): {
    decrement: Partial<Record<import("./types.js").OrmfyNumericColumn<DB, TName>, number>> | undefined;
    increment: Partial<Record<import("./types.js").OrmfyNumericColumn<DB, TName>, number>> | undefined;
    update: Omit<OrmfyUpdateInput<DB, TName>, "$decr" | "$incr">;
};
export declare function buildOrmfyMergeObject(mergeColumns: readonly string[]): never;
export declare function assertOrmfySortDirection(value: string): asserts value is "asc" | "desc";
export declare function assertOrmfyNulls(value: string): asserts value is "first" | "last";
