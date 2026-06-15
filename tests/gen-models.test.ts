import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
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
  test("writes one model file per table from migrations by default", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-"))
    const migrationsFolder = join(cwd, "migrations")
    await mkdir(migrationsFolder, { recursive: true })

    await writeFile(
      join(migrationsFolder, "001_init.ts"),
      [
        'import { sql, type Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("test_table")',
        '\t\t.addColumn("id", "serial", (column) => column.primaryKey())',
        '\t\t.addColumn("name", "varchar(255)")',
        '\t\t.addColumn("created_at", "timestamp with time zone", (column) => column.defaultTo(sql`now()`))',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "..",
        source: "migrations",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: migrationsFolder,
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
    expect(content).toContain('idStrategy: "database",')
  })

  test("uses custom db import path from database source", async () => {
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
        source: "database",
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
    expect(content).toContain('idStrategy: "database",')
  })

  test("infers string primary key strategy from migrations", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-string-pk-"))
    const migrationsFolder = join(cwd, "migrations")
    await mkdir(migrationsFolder, { recursive: true })

    await writeFile(
      join(migrationsFolder, "001_init.ts"),
      [
        'import { type Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("api_keys")',
        '\t\t.addColumn("key", "varchar(255)", (column) => column.primaryKey())',
        '\t\t.addColumn("name", "varchar(255)")',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "..",
        source: "migrations",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: migrationsFolder,
      },
      seeds: {
        getSeedPrefix: () => "seed",
        seedFolder: join(cwd, "seeds"),
      },
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runModelsGen(config)

    const content = await readFile(resolve(cwd, "src/db/models/api_keys.ts"), "utf8")

    expect(content).toContain('primaryKey: "key",')
    expect(content).toContain('idStrategy: "uuidv4",')
  })

  test("infers manual strategy for integer primary key without database default", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-integer-pk-"))
    const migrationsFolder = join(cwd, "migrations")
    await mkdir(migrationsFolder, { recursive: true })

    await writeFile(
      join(migrationsFolder, "001_init.ts"),
      [
        'import { type Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("legacy_users")',
        '\t\t.addColumn("id", "integer", (column) => column.primaryKey())',
        '\t\t.addColumn("name", "varchar(255)")',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "..",
        source: "migrations",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: migrationsFolder,
      },
      seeds: {
        getSeedPrefix: () => "seed",
        seedFolder: join(cwd, "seeds"),
      },
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runModelsGen(config)

    const content = await readFile(resolve(cwd, "src/db/models/legacy_users.ts"), "utf8")

    expect(content).toContain('primaryKey: "id",')
    expect(content).toContain('idStrategy: "manual",')
    expect(content).toContain('\tguarded: [\n\t\t"id",\n\t] as const,')
    expect(content).not.toContain('"created_at"')
  })

  test("does not force id primary key for tables without one", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "ormfy-models-no-id-"))
    const migrationsFolder = join(cwd, "migrations")
    await mkdir(migrationsFolder, { recursive: true })

    await writeFile(
      join(migrationsFolder, "001_init.ts"),
      [
        'import { type Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("logs")',
        '\t\t.addColumn("message", "text")',
        '\t\t.addColumn("created_at", "timestamp with time zone")',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    const config = {
      args: {} as never,
      configMetadata: {},
      cwd,
      destroyOnExit: false,
      dialect: "pg",
      models: {
        modelsFolder: join(cwd, "src/db/models"),
        dbImportPath: "..",
        source: "migrations",
      },
      typegen: {
        source: "migrations",
      },
      migrations: {
        getMigrationPrefix: () => "migration",
        migrationFolder: migrationsFolder,
      },
      seeds: {
        getSeedPrefix: () => "seed",
        seedFolder: join(cwd, "seeds"),
      },
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runModelsGen(config)

    const content = await readFile(resolve(cwd, "src/db/models/logs.ts"), "utf8")

    expect(content).not.toContain('primaryKey: "id",')
    expect(content).not.toContain("idStrategy:")
    expect(content).toContain('\tguarded: [\n\t\t"created_at",\n\t] as const,')
  })
});
