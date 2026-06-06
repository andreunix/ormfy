// filter.ts
import { sql } from "kysely";
import { OrmfyInvalidSortError } from "./errors.js";
export function applyOrmfyFilter(query, { $between, $complex, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...filter } = {}) {
    let nextQuery = query;
    for (const [column, value] of Object.entries(filter)) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, "=", value);
        }
    }
    for (const [column, values] of Object.entries($in ?? {})) {
        if (values) {
            if (values.length === 0) {
                nextQuery = nextQuery.where(sql `1 = 0`);
                continue;
            }
            nextQuery = nextQuery.where(column, "in", values);
        }
    }
    for (const [column, values] of Object.entries($notIn ?? {})) {
        if (values && values.length > 0) {
            nextQuery = nextQuery.where(column, "not in", values);
        }
    }
    for (const [column, value] of Object.entries($notEqual ?? {})) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, "!=", value);
        }
    }
    for (const [column, value] of Object.entries($gt ?? {})) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, ">", value);
        }
    }
    for (const [column, value] of Object.entries($gte ?? {})) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, ">=", value);
        }
    }
    for (const [column, value] of Object.entries($lt ?? {})) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, "<", value);
        }
    }
    for (const [column, value] of Object.entries($lte ?? {})) {
        if (value !== undefined) {
            nextQuery = nextQuery.where(column, "<=", value);
        }
    }
    for (const [column, range] of Object.entries($between ?? {})) {
        if (Array.isArray(range) && range.length === 2) {
            const [from, to] = range;
            nextQuery = nextQuery.where(column, ">=", from);
            nextQuery = nextQuery.where(column, "<=", to);
        }
    }
    for (const column of $null ?? []) {
        nextQuery = nextQuery.where(column, "is", null);
    }
    for (const column of $notNull ?? []) {
        nextQuery = nextQuery.where(column, "is not", null);
    }
    for (const [column, value] of Object.entries($search ?? {})) {
        if (value) {
            nextQuery = nextQuery.where(sql `${sql.ref(column)} ilike ${`%${escapeLike(value)}%`} escape '\\'`);
        }
    }
    for (const complexFilter of Array.isArray($complex) ? $complex : $complex ? [$complex] : []) {
        nextQuery = nextQuery.where((eb) => complexFilter(eb));
    }
    return nextQuery;
}
export function splitOrmfyUpdate(data) {
    const { $decr, $incr, ...update } = data;
    return { decrement: $decr, increment: $incr, update };
}
export function buildOrmfyMergeObject(mergeColumns) {
    return Object.fromEntries(mergeColumns.map((column) => [column, sql.ref(`excluded.${column}`)]));
}
export function assertOrmfySortDirection(value) {
    if (value !== "asc" && value !== "desc") {
        throw new OrmfyInvalidSortError(value);
    }
}
export function assertOrmfyNulls(value) {
    if (value !== "first" && value !== "last") {
        throw new OrmfyInvalidSortError(value);
    }
}
function escapeLike(value) {
    return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
//# sourceMappingURL=filter.js.map