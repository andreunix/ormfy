//index.ts
import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { OrmfyRecordNotFoundError, OrmfyUnsafeMutationError } from "./errors.js";
import { applyOrmfyFilter, assertOrmfyNulls, assertOrmfySortDirection, buildOrmfyMergeObject, splitOrmfyUpdate } from "./filter.js";
import { createOrmfyGuard, hasOrmfyFilterConditions } from "./guard.js";
export * from "./errors.js";
export { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, sql, } from "kysely";
export { buildCLI } from "./cli.js";
export { defineConfig, } from "./config/define-config.js";
export { DUMMY_DIALECT_CONFIG } from "./config/dummy-dialect-config.js";
export { getKnexTimestampPrefix } from "./config/get-file-prefix.js";
export { TSFileMigrationProvider, } from "./kysely/ts-file-migration-provider.js";
export { FileSeedProvider, } from "./seeds/file-seed-provider.js";
export { Seeder, } from "./seeds/seeder.js";
/**
 * Cria um model pequeno no estilo Active Record por cima do Kysely.
 *
 * O Ormfy mantem o Kysely disponivel via `query()` e `transaction()`, mas adiciona
 * helpers comuns como `find`, `create`, `updateById`, `paginate`,
 * `firstOrCreate`, `pluck`, `exists` e `lockForUpdate`.
 *
 * A lista `columns` funciona como allowlist em runtime para filtros, ordenacao,
 * updates e referencias dinamicas de coluna. Use `guarded` para bloquear mass
 * assignment em colunas como `id`, `created_at` e `updated_at`.
 *
 * @example
 * ```ts
 * export const citiesModel = ormfy(db, "cities", {
 *   columns: databaseColumns.cities,
 *   guarded: defaultOrmfyGuardedColumns,
 *   idStrategy: "uuidv7",
 *   primaryKey: "id",
 * })
 *
 * await citiesModel.create({ name: "Porto Velho", state_code: "RO" })
 * await citiesModel.find({ state_code: "RO" }, { sort: [["name", "asc"]] })
 * ```
 *
 * @example Metodos customizados no model
 * ```ts
 * export const citiesModel = ormfy(db, "cities", config, {
 *   findByStateCode(stateCode: string) {
 *     return citiesModel.find({ state_code: stateCode })
 *   },
 * })
 * ```
 */
export function ormfy(db, tableName, config, customOps) {
    return createOrmfyModel(db, tableName, config, customOps);
}
function createOrmfyModel(db, tableName, config, customOps, boundTx) {
    const table = tableName;
    const primaryKey = (config.primaryKey ?? "id");
    const idStrategy = config.idStrategy ?? "uuidv7";
    const guard = createOrmfyGuard(tableName, config.columns, config.guarded);
    const getDb = (tx) => (tx ?? boundTx ?? db);
    const base = {
        all(options) {
            return base.find({}, { tx: options?.tx });
        },
        query(tx) {
            return getDb(tx).selectFrom(table);
        },
        queryAll(tx) {
            return getDb(tx).selectFrom(table).selectAll();
        },
        withTx(tx) {
            return createOrmfyModel(db, tableName, config, customOps, tx);
        },
        transaction(optionsOrCallback, callback) {
            const options = typeof optionsOrCallback === "function" ? undefined : optionsOrCallback;
            const run = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;
            if (!run) {
                throw new Error("O callback da transacao e obrigatorio");
            }
            let transaction = db.transaction();
            if (options?.isolationLevel) {
                transaction = transaction.setIsolationLevel(options.isolationLevel);
            }
            if (options?.accessMode) {
                transaction = transaction.setAccessMode(options.accessMode);
            }
            return transaction.execute(run);
        },
        tx(optionsOrCallback, callback) {
            const options = typeof optionsOrCallback === "function" ? undefined : optionsOrCallback;
            const run = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;
            if (!run) {
                throw new Error("O callback da transacao e obrigatorio");
            }
            return base.transaction(options, (tx) => run(base.withTx(tx), tx));
        },
        async findById(id, options) {
            return base.findOne({ [primaryKey]: id }, { tx: options?.tx });
        },
        async findOrFail(id, options) {
            const row = await base.findById(id, options);
            if (!row) {
                throw new OrmfyRecordNotFoundError(table, `${primaryKey}=${id}`);
            }
            return row;
        },
        async findOne(filter, options) {
            const rows = await base.find(filter, {
                limit: 1,
                tx: options?.tx,
            });
            return rows[0];
        },
        async first(options) {
            const rows = await base.find({}, { limit: 1, tx: options?.tx });
            return rows[0];
        },
        async firstOrFail(filter, options) {
            const row = await base.findOne(filter, options);
            if (!row) {
                throw new OrmfyRecordNotFoundError(table);
            }
            return row;
        },
        async find(filter = {}, options = {}) {
            guard.assertFilter(filter);
            let query = applyOrmfyFilter(getDb(options.tx).selectFrom(table), filter);
            if (options.count) {
                query = query.select(sql `count(*) over()`.as("count"));
            }
            query = query.selectAll();
            query = applyOrmfySort(query, options.sort, guard);
            if (typeof options.limit === "number") {
                query = query.limit(normalizePositiveInteger(options.limit, 100));
            }
            if (typeof options.offset === "number") {
                query = query.offset(Math.max(0, Math.floor(options.offset)));
            }
            const rows = await query.execute();
            return rows;
        },
        async select(columns, filter = {}, options = {}) {
            guard.assertColumns(columns);
            guard.assertFilter(filter);
            let query = applyOrmfyFilter(getDb(options.tx).selectFrom(table), filter).select(columns);
            query = applyOrmfySort(query, options.sort, guard);
            if (typeof options.limit === "number") {
                query = query.limit(normalizePositiveInteger(options.limit, 100));
            }
            if (typeof options.offset === "number") {
                query = query.offset(Math.max(0, Math.floor(options.offset)));
            }
            return (await query.execute());
        },
        async selectOne(columns, filter = {}, options = {}) {
            const rows = await base.select(columns, filter, { ...options, limit: 1 });
            return rows[0];
        },
        async paginate(filter = {}, options = {}) {
            const page = Math.max(1, Math.floor(options.page ?? 1));
            const perPage = normalizePositiveInteger(options.perPage ?? 20, 100);
            const offset = (page - 1) * perPage;
            const rows = await base.find(filter, {
                count: true,
                limit: perPage,
                offset,
                sort: options.sort,
                tx: options.tx,
            });
            const total = rows.length > 0 ? Number(rows[0]?.count ?? 0) : 0;
            const totalPages = Math.ceil(total / perPage);
            return {
                data: rows.map((row) => {
                    const { count: _count, ...data } = row;
                    return data;
                }),
                meta: {
                    has_next_page: page < totalPages,
                    has_previous_page: page > 1,
                    page,
                    per_page: perPage,
                    total,
                    total_pages: totalPages,
                },
            };
        },
        async paginateSelect(columns, filter = {}, options = {}) {
            const page = Math.max(1, Math.floor(options.page ?? 1));
            const perPage = normalizePositiveInteger(options.perPage ?? 20, 100);
            const offset = (page - 1) * perPage;
            const total = await base.countDocuments(filter, { tx: options.tx });
            const rows = await base.select(columns, filter, {
                limit: perPage,
                offset,
                sort: options.sort,
                tx: options.tx,
            });
            const totalPages = Math.ceil(total / perPage);
            return {
                data: rows,
                meta: {
                    has_next_page: page < totalPages,
                    has_previous_page: page > 1,
                    page,
                    per_page: perPage,
                    total,
                    total_pages: totalPages,
                },
            };
        },
        async cursorPaginate(filter = {}, options) {
            guard.assertFilter(filter);
            guard.assertColumn(options.cursorColumn);
            const direction = options.direction ?? "desc";
            assertOrmfySortDirection(direction);
            const perPage = normalizePositiveInteger(options.perPage ?? 20, 100);
            let query = applyOrmfyFilter(getDb(options.tx).selectFrom(table), filter)
                .selectAll()
                .orderBy(options.cursorColumn, direction)
                .limit(perPage + 1);
            if (options.cursor !== undefined && options.cursor !== null) {
                query = query.where(options.cursorColumn, direction === "asc" ? ">" : "<", options.cursor);
            }
            const rows = (await query.execute());
            const data = rows.slice(0, perPage);
            const lastRow = data.at(-1);
            return {
                data,
                meta: {
                    has_next_page: rows.length > perPage,
                    next_cursor: rows.length > perPage && lastRow ? lastRow[options.cursorColumn] : null,
                    per_page: perPage,
                },
            };
        },
        async cursorPaginateSelect(columns, filter = {}, options) {
            guard.assertColumns(columns);
            guard.assertFilter(filter);
            guard.assertColumn(options.cursorColumn);
            const direction = options.direction ?? "desc";
            assertOrmfySortDirection(direction);
            const perPage = normalizePositiveInteger(options.perPage ?? 20, 100);
            const selectedColumns = Array.from(new Set([...columns, options.cursorColumn]));
            let query = applyOrmfyFilter(getDb(options.tx).selectFrom(table), filter)
                .select(selectedColumns)
                .orderBy(options.cursorColumn, direction)
                .limit(perPage + 1);
            if (options.cursor !== undefined && options.cursor !== null) {
                query = query.where(options.cursorColumn, direction === "asc" ? ">" : "<", options.cursor);
            }
            const rows = (await query.execute());
            const data = rows.slice(0, perPage).map((row) => pickRow(row, columns));
            const lastRow = rows.slice(0, perPage).at(-1);
            return {
                data,
                meta: {
                    has_next_page: rows.length > perPage,
                    next_cursor: rows.length > perPage && lastRow ? lastRow[options.cursorColumn] : null,
                    per_page: perPage,
                },
            };
        },
        async create(data, options) {
            const insert = prepareInsert(data, primaryKey, idStrategy, guard);
            const row = await applyReturning(getDb(options?.tx).insertInto(table).values(insert), options?.returning, guard).executeTakeFirstOrThrow();
            return row;
        },
        createMany(data, options) {
            return base.insertMany(data, options);
        },
        async insertMany(data, options) {
            if (data.length === 0) {
                return [];
            }
            const rowsToInsert = data.map((item) => prepareInsert(item, primaryKey, idStrategy, guard));
            const rows = await getDb(options?.tx)
                .insertInto(table)
                .values(rowsToInsert)
                .returningAll()
                .execute();
            return rows;
        },
        async batchInsert(data, options) {
            if (data.length === 0) {
                return [];
            }
            if (!options?.tx && options?.atomic !== false) {
                return base.transaction((tx) => base.batchInsert(data, { ...options, atomic: false, tx }));
            }
            const chunkSize = normalizePositiveInteger(options?.chunkSize ?? 500, 5000);
            const rows = [];
            for (let index = 0; index < data.length; index += chunkSize) {
                const chunk = data.slice(index, index + chunkSize);
                const inserted = await base.insertMany(chunk, { tx: options?.tx });
                rows.push(...inserted);
            }
            return rows;
        },
        async upsert(data, onConflict, options) {
            if (data.length === 0) {
                return [];
            }
            const conflictColumns = Array.isArray(onConflict) ? onConflict : [onConflict];
            guard.assertColumns(conflictColumns);
            guard.assertAssignableColumns(options.mergeColumns);
            if (options.mergeColumns.length === 0) {
                throw new Error("upsert requires at least one merge column");
            }
            const rowsToInsert = data.map((item) => prepareInsert(item, primaryKey, idStrategy, guard));
            const mergeColumns = options.mergeColumns;
            const rows = await getDb(options.tx)
                .insertInto(table)
                .values(rowsToInsert)
                .onConflict((oc) => Array.isArray(onConflict)
                ? oc.columns(onConflict).doUpdateSet(buildOrmfyMergeObject(mergeColumns))
                : oc.column(onConflict).doUpdateSet(buildOrmfyMergeObject(mergeColumns)))
                .returningAll()
                .execute();
            return rows;
        },
        async updateById(id, data, options) {
            const row = await updateWhere(getDb(options?.tx), table, guard, { [primaryKey]: id }, data, true, options?.returning).executeTakeFirstOrThrow();
            return row;
        },
        async update(filter, data, options) {
            const rows = await updateWhere(getDb(options?.tx), table, guard, filter, data, Boolean(options?.allowFullTableMutation), options?.returning).execute();
            return rows;
        },
        async updateOrCreate(filter, data, options) {
            const existing = await base.findOne(filter, { tx: options?.tx });
            if (existing) {
                return base.updateById(String(existing[primaryKey]), data, options);
            }
            return base.create({ ...filter, ...data }, options);
        },
        async firstOrCreate(filter, data = {}, options) {
            const existing = await base.findOne(filter, { tx: options?.tx });
            if (existing) {
                return existing;
            }
            return base.create({ ...filter, ...data }, options);
        },
        async increment(id, column, amount = 1, options) {
            return updateCounter(base, id, column, amount, "$incr", options);
        },
        async decrement(id, column, amount = 1, options) {
            return updateCounter(base, id, column, amount, "$decr", options);
        },
        async deleteById(id, options) {
            const row = await applyReturning(getDb(options?.tx).deleteFrom(table).where(primaryKey, "=", id), options?.returning, guard).executeTakeFirstOrThrow();
            return row;
        },
        async delete(filter, options) {
            guard.assertFilter(filter);
            assertSafeMutation(filter, Boolean(options?.allowFullTableMutation));
            const query = applyOrmfyFilter(getDb(options?.tx).deleteFrom(table), filter);
            const rows = await applyReturning(query, options?.returning, guard).execute();
            return rows;
        },
        async countDocuments(filter = {}, options) {
            guard.assertFilter(filter);
            const query = applyOrmfyFilter(getDb(options?.tx).selectFrom(table), filter);
            const result = await query.select((eb) => eb.fn.countAll().as("count")).executeTakeFirstOrThrow();
            return Number(result.count);
        },
        async exists(filter, options) {
            const rows = await base.find(filter, { limit: 1, tx: options?.tx });
            return rows.length > 0;
        },
        async doesntExist(filter, options) {
            return !(await base.exists(filter, options));
        },
        async pluck(column, filter = {}, options) {
            guard.assertColumn(column);
            const rows = await base.select([column], filter, { tx: options?.tx });
            return rows.map((row) => row[column]);
        },
        async value(column, filter, options) {
            guard.assertColumn(column);
            const row = await base.selectOne([column], filter, { tx: options?.tx });
            return row?.[column];
        },
        async lockForUpdate(txOrFilter, maybeFilter) {
            const tx = maybeFilter ? txOrFilter : boundTx;
            const filter = (maybeFilter ?? txOrFilter);
            if (!tx) {
                throw new Error("lockForUpdate requires a transaction or a model created with withTx(tx)");
            }
            guard.assertFilter(filter);
            const query = applyOrmfyFilter(tx.selectFrom(table), filter);
            const row = await query.selectAll().forUpdate().executeTakeFirstOrThrow();
            return row;
        },
    };
    const ops = typeof customOps === "function" ? customOps(base) : (customOps ?? {});
    return {
        ...base,
        ...ops,
    };
}
function prepareInsert(data, primaryKey, idStrategy, guard) {
    guard.assertAssignableColumns(Object.keys(data));
    const insert = { ...data };
    if (insert[primaryKey] === undefined) {
        const id = createId(idStrategy);
        if (id !== undefined) {
            insert[primaryKey] = id;
        }
    }
    guard.assertColumns(Object.keys(insert));
    return insert;
}
function updateWhere(db, table, guard, filter, data, allowFullTableMutation, returning) {
    guard.assertFilter(filter);
    assertSafeMutation(filter, allowFullTableMutation);
    const { decrement, increment, update } = splitOrmfyUpdate(data);
    guard.assertAssignableColumns(Object.keys(update));
    guard.assertAssignableColumns(Object.keys(increment ?? {}));
    guard.assertAssignableColumns(Object.keys(decrement ?? {}));
    let query = applyOrmfyFilter(db.updateTable(table).set(update), filter);
    for (const [column, value] of Object.entries(increment ?? {})) {
        if (typeof value === "number") {
            query = query.set({
                [column]: sql `${sql.ref(column)} + ${value}`,
            });
        }
    }
    for (const [column, value] of Object.entries(decrement ?? {})) {
        if (typeof value === "number") {
            query = query.set({
                [column]: sql `${sql.ref(column)} - ${value}`,
            });
        }
    }
    return applyReturning(query, returning, guard);
}
async function updateCounter(base, id, column, amount, operator, options) {
    return base.updateById(id, { [operator]: { [column]: amount } }, options);
}
function assertSafeMutation(filter, allowFullTableMutation) {
    if (!allowFullTableMutation && !hasOrmfyFilterConditions(filter)) {
        throw new OrmfyUnsafeMutationError();
    }
}
function applyOrmfySort(query, sort, guard) {
    let nextQuery = query;
    for (const [column, direction, nulls] of sort ?? []) {
        guard.assertColumn(column);
        assertOrmfySortDirection(direction);
        if (nulls) {
            assertOrmfyNulls(nulls);
            nextQuery = nextQuery.orderBy(sql `${sql.ref(column)} ${sql.raw(direction)} nulls ${sql.raw(nulls)}`);
            continue;
        }
        nextQuery = nextQuery.orderBy(column, direction);
    }
    return nextQuery;
}
function applyReturning(query, returning, guard) {
    if (returning) {
        guard.assertColumns(returning);
        return query.returning(returning);
    }
    return query.returningAll();
}
function pickRow(row, columns) {
    return Object.fromEntries(columns.map((column) => [column, row[column]]));
}
function normalizePositiveInteger(value, max) {
    if (!Number.isFinite(value)) {
        throw new Error("Expected a finite number");
    }
    return Math.min(max, Math.max(1, Math.floor(value)));
}
function createId(strategy) {
    if (strategy === "database" || strategy === "manual") {
        return undefined;
    }
    if (strategy === "uuidv7") {
        return createOrmfyId();
    }
    if (strategy === "uuidv4") {
        return randomUUID();
    }
    return strategy();
}
export function createOrmfyId() {
    return Bun.randomUUIDv7();
}
//# sourceMappingURL=index.js.map