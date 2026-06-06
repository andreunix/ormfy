// filter.ts
import { sql } from "kysely";
import { OrmfyInvalidSortError } from "./errors.js";
import type { OrmfyFindFilter, OrmfyTableName, OrmfyUpdateInput } from "./types.js";

export function applyOrmfyFilter<Query, DB, TName extends OrmfyTableName<DB>>(
	query: Query,
	{ $between, $complex, $gt, $gte, $in, $lt, $lte, $notEqual, $notIn, $notNull, $null, $search, ...filter }: OrmfyFindFilter<DB, TName> = {},
): Query {
	let nextQuery = query as {
		where(expression: unknown): unknown;
		where(callback: (eb: unknown) => unknown): unknown;
		where(column: string, operator: string, value: unknown): unknown;
	};

	for (const [column, value] of Object.entries(filter)) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, "=", value) as typeof nextQuery;
		}
	}

	for (const [column, values] of Object.entries($in ?? {})) {
		if (values) {
			if ((values as unknown[]).length === 0) {
				nextQuery = nextQuery.where(sql`1 = 0`) as typeof nextQuery;
				continue;
			}

			nextQuery = nextQuery.where(column, "in", values as unknown[]) as typeof nextQuery;
		}
	}

	for (const [column, values] of Object.entries($notIn ?? {})) {
		if (values && (values as unknown[]).length > 0) {
			nextQuery = nextQuery.where(column, "not in", values as unknown[]) as typeof nextQuery;
		}
	}

	for (const [column, value] of Object.entries($notEqual ?? {})) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, "!=", value) as typeof nextQuery;
		}
	}

	for (const [column, value] of Object.entries($gt ?? {})) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, ">", value) as typeof nextQuery;
		}
	}

	for (const [column, value] of Object.entries($gte ?? {})) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, ">=", value) as typeof nextQuery;
		}
	}

	for (const [column, value] of Object.entries($lt ?? {})) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, "<", value) as typeof nextQuery;
		}
	}

	for (const [column, value] of Object.entries($lte ?? {})) {
		if (value !== undefined) {
			nextQuery = nextQuery.where(column, "<=", value) as typeof nextQuery;
		}
	}

	for (const [column, range] of Object.entries($between ?? {})) {
		if (Array.isArray(range) && range.length === 2) {
			const [from, to] = range;
			nextQuery = nextQuery.where(column, ">=", from) as typeof nextQuery;
			nextQuery = nextQuery.where(column, "<=", to) as typeof nextQuery;
		}
	}

	for (const column of $null ?? []) {
		nextQuery = nextQuery.where(column, "is", null) as typeof nextQuery;
	}

	for (const column of $notNull ?? []) {
		nextQuery = nextQuery.where(column, "is not", null) as typeof nextQuery;
	}

	for (const [column, value] of Object.entries($search ?? {}) as Array<[string, string]>) {
		if (value) {
			nextQuery = nextQuery.where(sql`${sql.ref(column)} ilike ${`%${escapeLike(value)}%`} escape '\\'`) as typeof nextQuery;
		}
	}

	for (const complexFilter of Array.isArray($complex) ? $complex : $complex ? [$complex] : []) {
		nextQuery = nextQuery.where((eb: unknown) => complexFilter(eb as never)) as typeof nextQuery;
	}

	return nextQuery as Query;
}

export function splitOrmfyUpdate<DB, TName extends OrmfyTableName<DB>>(data: OrmfyUpdateInput<DB, TName>) {
	const { $decr, $incr, ...update } = data;
	return { decrement: $decr, increment: $incr, update };
}

export function buildOrmfyMergeObject(mergeColumns: readonly string[]) {
	return Object.fromEntries(mergeColumns.map((column) => [column, sql.ref(`excluded.${column}`)])) as never;
}

export function assertOrmfySortDirection(value: string): asserts value is "asc" | "desc" {
	if (value !== "asc" && value !== "desc") {
		throw new OrmfyInvalidSortError(value);
	}
}

export function assertOrmfyNulls(value: string): asserts value is "first" | "last" {
	if (value !== "first" && value !== "last") {
		throw new OrmfyInvalidSortError(value);
	}
}

function escapeLike(value: string) {
	return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
