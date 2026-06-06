import { describe, expect, test } from "bun:test";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import { applyOrmfyFilter, assertOrmfyNulls, assertOrmfySortDirection, buildOrmfyMergeObject, splitOrmfyUpdate } from "../src/ormfy/filter";
import type { OrmfyFindFilter } from "../src/ormfy/types";

type UserTable = {
  id: string;
  email: string | null;
  name: string | null;
  score: number | null;
  created_at: Date | null;
};

type TestDb = {
  users: UserTable;
};

function createDb() {
  return new Kysely<TestDb>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => ({
        init: async () => {},
        acquireConnection: async () => { throw new Error("not used"); },
        beginTransaction: async () => {},
        commitTransaction: async () => {},
        rollbackTransaction: async () => {},
        releaseConnection: async () => {},
        destroy: async () => {},
      }),
      createIntrospector: (database) => new PostgresIntrospector(database),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

function compileFilter(filter: OrmfyFindFilter<TestDb, "users">) {
  const base = createDb().selectFrom("users");
  return applyOrmfyFilter<typeof base, TestDb, "users">(base, filter).select("id").compile();
}

describe("Ormfy filter", () => {
  test("applies direct equality", () => {
    const query = compileFilter({ email: "a@example.com" });
    expect(query.sql).toBe('select "id" from "users" where "email" = $1');
    expect(query.parameters).toEqual(["a@example.com"]);
  });

  test("applies $in", () => {
    const query = compileFilter({ $in: { id: ["1", "2"] } });
    expect(query.sql).toBe('select "id" from "users" where "id" in ($1, $2)');
  });

  test("applies $notEqual", () => {
    const query = compileFilter({ $notEqual: { email: "blocked@example.com" } });
    expect(query.sql).toBe('select "id" from "users" where "email" != $1');
  });

  test("applies $notNull", () => {
    const query = compileFilter({ $notNull: ["created_at"] });
    expect(query.sql).toBe('select "id" from "users" where "created_at" is not null');
  });

  test("applies $search with escaped value", () => {
    const query = compileFilter({ $search: { name: "a%b_" } });
    expect(query.sql).toContain('"name" ilike $1');
    expect(query.sql).toContain("escape '\\'");
    expect(query.parameters).toEqual(["%a\\%b\\_%"]);
  });

  test("applies $complex", () => {
    const query = compileFilter({
      $complex: (eb) => eb("email", "is not", null),
    });
    expect(query.sql).toBe('select "id" from "users" where "email" is not null');
  });

  test("keeps pure helpers working", () => {
    expect(splitOrmfyUpdate<TestDb, "users">({ name: "Ana", $incr: { score: 1 } })).toEqual({
      decrement: undefined,
      increment: { score: 1 },
      update: { name: "Ana" },
    });
    const merge = buildOrmfyMergeObject(["email"]) as Record<string, unknown>;
    expect(merge.email).toBeTruthy();
    expect(() => assertOrmfySortDirection("asc")).not.toThrow();
    expect(() => assertOrmfySortDirection("sideways")).toThrow();
    expect(() => assertOrmfyNulls("first")).not.toThrow();
    expect(() => assertOrmfyNulls("middle")).toThrow();
  });
});
