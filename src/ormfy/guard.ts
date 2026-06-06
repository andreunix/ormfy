// guard.ts
import type { OrmfyColumn, OrmfyTableName } from "./types.js";
import { OrmfyGuardedColumnError, OrmfyInvalidColumnError } from "./errors.js";

const filterOperators = new Set(["$between", "$complex", "$gt", "$gte", "$in", "$lt", "$lte", "$notEqual", "$notIn", "$notNull", "$null", "$search"]);

export function createOrmfyGuard<DB, TName extends OrmfyTableName<DB>>(
	tableName: TName,
	columns: readonly OrmfyColumn<DB, TName>[],
	guarded: readonly OrmfyColumn<DB, TName>[] = [],
) {
	const columnSet = new Set<string>(columns);
	const guardedSet = new Set<string>(guarded);

	function assertColumn(column: string) {
		if (!columnSet.has(column)) {
			throw new OrmfyInvalidColumnError(tableName, column);
		}
	}

	function assertColumns(values: readonly string[]) {
		for (const value of values) {
			assertColumn(value);
		}
	}

	function assertAssignableColumn(column: string) {
		assertColumn(column);

		if (guardedSet.has(column)) {
			throw new OrmfyGuardedColumnError(tableName, column);
		}
	}

	function assertAssignableColumns(values: readonly string[]) {
		for (const value of values) {
			assertAssignableColumn(value);
		}
	}

	function assertFilter(filter: Record<string, unknown> = {}) {
		const { $between, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...directFilter } = filter;

		for (const key of Object.keys(directFilter)) {
			if (!filterOperators.has(key)) {
				assertColumn(key);
			}
		}

		assertColumns(Object.keys(($between ?? {}) as object));
		assertColumns(Object.keys(($gt ?? {}) as object));
		assertColumns(Object.keys(($gte ?? {}) as object));
		assertColumns(Object.keys(($in ?? {}) as object));
		assertColumns(Object.keys(($lt ?? {}) as object));
		assertColumns(Object.keys(($lte ?? {}) as object));
		assertColumns(Object.keys(($notEqual ?? {}) as object));
		assertColumns(Object.keys(($notIn ?? {}) as object));
		assertColumns(Object.keys(($search ?? {}) as object));

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

export function hasOrmfyFilterConditions(filter: Record<string, unknown> = {}) {
	const { $between, $complex, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...directFilter } = filter;

	if (Object.values(directFilter).some((value) => value !== undefined)) {
		return true;
	}

	if (Object.keys(($between ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($gt ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($gte ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($in ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($lt ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($lte ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($notEqual ?? {}) as object).length > 0) {
		return true;
	}

	if (Object.keys(($notIn ?? {}) as object).length > 0) {
		return true;
	}

	if (Array.isArray($notNull) && $notNull.length > 0) {
		return true;
	}

	if (Array.isArray($null) && $null.length > 0) {
		return true;
	}

	if (Object.values(($search ?? {}) as object).some(Boolean)) {
		return true;
	}

	return Array.isArray($complex) ? $complex.length > 0 : Boolean($complex);
}
