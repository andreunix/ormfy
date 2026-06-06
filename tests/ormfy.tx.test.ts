import type { CompiledQuery, DatabaseConnection, Driver, QueryResult, TransactionSettings } from "kysely";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import { describe, expect, test } from "bun:test";
import { ormfy } from "../src";

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
  transactions: string[] = [];
  private connection: DatabaseConnection = {
    executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
      this.queries.push({ sql: compiledQuery.sql, parameters: compiledQuery.parameters });
      return { rows: (this.rowsQueue.shift() ?? []) as R[] };
    },
    streamQuery: async function* <R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; },
  };
  async init() {}
  async acquireConnection() { return this.connection; }
  async beginTransaction(_connection: DatabaseConnection, settings: TransactionSettings) { this.transactions.push("begin:" + (settings.isolationLevel ?? "") + ":" + (settings.accessMode ?? "")); }
  async commitTransaction() { this.transactions.push("commit"); }
  async rollbackTransaction() { this.transactions.push("rollback"); }
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

describe("Ormfy transactions", () => {
  test("transaction executes callback", async () => {
    const { driver, model } = createModel();
    const result = await model.transaction(async (tx) => {
      expect(tx.isTransaction).toBe(true);
      return "ok";
    });
    expect(result).toBe("ok");
    expect(driver.transactions).toEqual(["begin::", "commit"]);
  });

  test("transaction propagates callback errors", async () => {
    const { driver, model } = createModel();
    await expect(model.transaction(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(driver.transactions).toEqual(["begin::", "rollback"]);
  });

  test("withTx returns a bound model", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ id: "ord_1", status: "paid" }]);
    await model.transaction(async (tx) => {
      const orders = model.withTx(tx);
      await orders.updateById("ord_1", { status: "paid" });
    });
    expect(driver.queries[0]?.sql).toBe('update "orders" set "status" = $1 where "id" = $2 returning *');
  });

  test("tx executes callback with bound model", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ id: "ord_1", status: "paid" }]);
    await model.tx(async (orders, tx) => {
      expect(tx.isTransaction).toBe(true);
      await orders.updateById("ord_1", { status: "paid" });
    });
    expect(driver.queries[0]?.sql).toBe('update "orders" set "status" = $1 where "id" = $2 returning *');
  });

  test("lockForUpdate works with transaction", async () => {
    const { driver, model } = createModel();
    driver.rowsQueue.push([{ id: "ord_1", status: "open", total: 1, created_at: new Date(0) }]);
    await model.transaction(async (tx) => {
      await model.lockForUpdate(tx, { id: "ord_1" });
    });
    expect(driver.queries[0]?.sql).toBe('select * from "orders" where "id" = $1 for update');
  });
});
