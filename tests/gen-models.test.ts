import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Kysely, DummyDriver, PostgresAdapter, PostgresQueryCompiler } from "../src";
import { runModelsGen } from "../src/models/gen-models";
import type { ResolvedOrmfyConfig } from "../src/config/ormfy-config";

type TestDatabase = {
  test_table: {
    created_at: Date;
    id: number;
    name: string | null;
  };
};

class FakeIntrospector {
  async getSchemas() {
    return [{ name: "public" }];
  }

  async getTables() {
    return [
      {
        columns: [
          { dataType: "serial", hasDefaultValue: true, isAutoIncrementing: true, isNullable: false, name: "id" },
          { dataType: "varchar", hasDefaultValue: false, isAutoIncrementing: false, isNullable: true, name: "name" },
          { dataType: "timestamp with time zone", hasDefaultValue: true, isAutoIncrementing: false, isNullable: false, name: "created_at" },
        ],
        isForeign: false,
        isView: false,
        name: "test_table",
      },
    ];
  }
}

function createDatabase(): Kysely<TestDatabase> {
  return new Kysely<TestDatabase>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: () => new FakeIntrospector() as never,
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

describe("gen models", () => {
  test("writes one model file per table", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-"))
    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "..",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: join(cwd, "migrations"),
      },
      seeds: {
        getSeedPrefix: () => "seed",
        seedFolder: join(cwd, "seeds"),
      },
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runModelsGen(config)

    const filePath = resolve(cwd, "src/db/models/test_table.ts")
    const content = await readFile(filePath, "utf8")

    expect(content).toContain('import { ormfy } from "ormfy";')
    expect(content).toContain('import { db } from "..";')
    expect(content).toContain('export const testTable = ormfy(db, "test_table", {')
    expect(content).toContain('\tcolumns: [\n\t\t"id",\n\t\t"name",\n\t\t"created_at",\n\t] as const,')
    expect(content).toContain('\tguarded: [\n\t\t"id",\n\t\t"created_at",\n\t] as const,')
    expect(content).toContain('idStrategy: "uuidv4",')
  })

  test("uses custom db import path", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-paths-"))
    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "../../db",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: join(cwd, "migrations"),
      },
      seeds: {
        getSeedPrefix: () => "seed",
        seedFolder: join(cwd, "seeds"),
      },
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runModelsGen(config)

    const filePath = resolve(cwd, "src/db/models/test_table.ts")
    const content = await readFile(filePath, "utf8")

    expect(content).toContain('import { db } from "../../db";')
    expect(content).toContain('\tguarded: [\n\t\t"id",\n\t\t"created_at",\n\t] as const,')
  })
});
