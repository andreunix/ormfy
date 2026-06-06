import { OrmfyGuardedColumnError, OrmfyInvalidColumnError } from "./errors.js";
const filterOperators = new Set(["$between", "$complex", "$gt", "$gte", "$in", "$lt", "$lte", "$notEqual", "$notIn", "$notNull", "$null", "$search"]);
export function createOrmfyGuard(tableName, columns, guarded = []) {
    const columnSet = new Set(columns);
    const guardedSet = new Set(guarded);
    function assertColumn(column) {
        if (!columnSet.has(column)) {
            throw new OrmfyInvalidColumnError(tableName, column);
        }
    }
    function assertColumns(values) {
        for (const value of values) {
            assertColumn(value);
        }
    }
    function assertAssignableColumn(column) {
        assertColumn(column);
        if (guardedSet.has(column)) {
            throw new OrmfyGuardedColumnError(tableName, column);
        }
    }
    function assertAssignableColumns(values) {
        for (const value of values) {
            assertAssignableColumn(value);
        }
    }
    function assertFilter(filter = {}) {
        const { $between, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...directFilter } = filter;
        for (const key of Object.keys(directFilter)) {
            if (!filterOperators.has(key)) {
                assertColumn(key);
            }
        }
        assertColumns(Object.keys(($between ?? {})));
        assertColumns(Object.keys(($gt ?? {})));
        assertColumns(Object.keys(($gte ?? {})));
        assertColumns(Object.keys(($in ?? {})));
        assertColumns(Object.keys(($lt ?? {})));
        assertColumns(Object.keys(($lte ?? {})));
        assertColumns(Object.keys(($notEqual ?? {})));
        assertColumns(Object.keys(($notIn ?? {})));
        assertColumns(Object.keys(($search ?? {})));
        if (Array.isArray($notNull)) {
            assertColumns($notNull);
        }
        if (Array.isArray($null)) {
            assertColumns($null);
        }
    }
    return {
        assertAssignableColumn,
        assertAssignableColumns,
        assertColumn,
        assertColumns,
        assertFilter,
        columns,
        guarded,
    };
}
export function hasOrmfyFilterConditions(filter = {}) {
    const { $between, $complex, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...directFilter } = filter;
    if (Object.values(directFilter).some((value) => value !== undefined)) {
        return true;
    }
    if (Object.keys(($between ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($gt ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($gte ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($in ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($lt ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($lte ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($notEqual ?? {})).length > 0) {
        return true;
    }
    if (Object.keys(($notIn ?? {})).length > 0) {
        return true;
    }
    if (Array.isArray($notNull) && $notNull.length > 0) {
        return true;
    }
    if (Array.isArray($null) && $null.length > 0) {
        return true;
    }
    if (Object.values(($search ?? {})).some(Boolean)) {
        return true;
    }
    return Array.isArray($complex) ? $complex.length > 0 : Boolean($complex);
}
//# sourceMappingURL=guard.js.map