import type { CompiledQuery, DatabaseConnection, Driver, QueryResult, TransactionSettings } from "kysely";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import { describe, expect, test } from "bun:test";
import { OrmfyInvalidColumnError, ormfy } from "../src";

type OrderTable = {
  id: string;
  status: string | null;
  total: number;
  created_at: Date;
};

type TestDb = {
  orders: OrderTable;
};

class RecordingDriver implements Driver {
  queries: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  rowsQueue: unknown[][] = [];
  private connection: DatabaseConnection = {
    executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
      this.queries.push({ sql: compiledQuery.sql, parameters: compiledQuery.parameters });
      return { rows: (this.rowsQueue.shift() ?? []) as R[] };
    },
    streamQuery: async function* <R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; },
  };
  async init() {}
  async acquireConnection() { return this.connection; }
  async beginTransaction(_connection: DatabaseConnection, _settings: TransactionSettings) {}
  async commitTransaction() {}
  async rollbackTransaction() {}
  async releaseConnection() {}
  async destroy() {}
}

function createModel() {
  const driver = new RecordingDriver();
  const db = new Kysely<TestDb>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => driver,
      createIntrospector: (database) => new PostgresIntrospector(database),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
  const model = ormfy(db, "orders", { columns: ["id", "status", "total", "created_at"], idStrategy: "manual" });
  return { driver, model };
}

describe("Ormfy select/projection", () => {
  test("select returns only requested columns", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ id: "ord_1", status: "open" }]);
    expect(await model.select(["id", "status"] as const, { status: "open" })).toEqual([{ id: "ord_1", status: "open" }]);
    expect(driver.queries[0]?.sql).toBe('select "id", "status" from "orders" where "status" = $1');
  });

  test("selectOne returns only requested columns", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ id: "ord_1" }]);
    expect(await model.selectOne(["id"] as const, { id: "ord_1" })).toEqual({ id: "ord_1" });
    expect(driver.queries[0]?.sql).toBe('select "id" from "orders" where "id" = $1 limit $2');
  });

  test("pluck returns only values from requested column", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ status: "open" }, { status: "paid" }]);
    expect(await model.pluck("status", {})).toEqual(["open", "paid"]);
    expect(driver.queries[0]?.sql).toBe('select "status" from "orders"');
  });

  test("value returns a single value", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ total: 10 }]);
    expect(await model.value("total", { id: "ord_1" })).toBe(10);
    expect(driver.queries[0]?.sql).toBe('select "total" from "orders" where "id" = $1 limit $2');
  });

  test("invalid select column fails", async () => {
    const { model } = createModel();
    await expect(model.select(["missing" as "id"])).rejects.toThrow(OrmfyInvalidColumnError);
  });
});
