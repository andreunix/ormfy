export declare class OrmfyInvalidColumnError extends Error {
    constructor(table: string, column: string);
}
export declare class OrmfyGuardedColumnError extends Error {
    constructor(table: string, column: string);
}
export declare class OrmfyUnsafeMutationError extends Error {
    constructor();
}
export declare class OrmfyRecordNotFoundError extends Error {
    constructor(table: string, details?: string);
}
export declare class OrmfyInvalidSortError extends Error {
    constructor(value: string);
}
