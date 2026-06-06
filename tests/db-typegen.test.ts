import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Kysely, DummyDriver, PostgresAdapter, PostgresQueryCompiler } from "../src";
import { runTypegen } from "../src/typegen/typegen";
import type { ResolvedOrmfyConfig } from "../src/config/ormfy-config";

type TestTable = {
  created_at: Date;
  email: string | null;
  id: number;
  profile: unknown | null;
};

type TestDatabase = {
  users: TestTable;
};

class FakeIntrospector {
  async getSchemas() {
    return [{ name: "public" }];
  }

  async getTables() {
    return [
      {
        columns: [
          {
            dataType: "serial",
            hasDefaultValue: true,
            isAutoIncrementing: true,
            isNullable: false,
            name: "id",
          },
          {
            dataType: "varchar",
            hasDefaultValue: false,
            isAutoIncrementing: false,
            isNullable: true,
            name: "email",
          },
          {
            dataType: "timestamp with time zone",
            hasDefaultValue: true,
            isAutoIncrementing: false,
            isNullable: false,
            name: "created_at",
          },
          {
            dataType: "jsonb",
            hasDefaultValue: false,
            isAutoIncrementing: false,
            isNullable: true,
            name: "profile",
          },
        ],
        isForeign: false,
        isView: false,
        name: "users",
      },
      {
        columns: [],
        isForeign: false,
        isView: true,
        name: "users_view",
      },
    ];
  }
}

class NoopDriver extends DummyDriver {}

function createDatabase(): Kysely<TestDatabase> {
  return new Kysely<TestDatabase>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new NoopDriver(),
      createIntrospector: () => new FakeIntrospector() as never,
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

async function createTempProject() {
  const cwd = await mkdtemp(join(tmpdir(), "ormfy-typegen-"))
  const migrationsFolder = join(cwd, "migrations")

  await mkdir(migrationsFolder, { recursive: true })

  const config = {
    args: {} as never,
    configMetadata: {},
    cwd,
    destroyOnExit: false,
    dialect: "pg",
    migrations: {
      getMigrationPrefix: () => "migration",
      migrationFolder: migrationsFolder,
    },
    seeds: {
      getSeedPrefix: () => "seed",
      seedFolder: join(cwd, "seeds"),
    },
  } as ResolvedOrmfyConfig

  return { config, cwd, migrationsFolder }
}

describe("db typegen", () => {
  test("generates files from migrations and centralizes ormfy imports", async () => {
    const { config, cwd, migrationsFolder } = await createTempProject()

    await writeFile(
      join(migrationsFolder, "001_init.ts"),
      [
        'import { sql, type Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("users")',
        '\t\t.addColumn("id", "serial", (column) => column.primaryKey())',
        '\t\t.addColumn("email", "varchar(255)")',
        '\t\t.addColumn("created_at", "timestamp with time zone", (column) => column.defaultTo(sql`now()`))',
        '\t\t.addColumn("profile", "jsonb")',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    await runTypegen(config, "migrations")

    const types = await readFile(resolve(cwd, "src/db/types.ts"), "utf8")
    const columns = await readFile(resolve(cwd, "src/db/columns.ts"), "utf8")
    const declarations = await readFile(resolve(cwd, "src/@types/db.d.ts"), "utf8")

    expect(types).toContain('import type { Generated } from "ormfy";')
    expect(types).toContain("export interface UsersTable")
    expect(types).toContain("id: Generated<number>;")
    expect(types).toContain("email: string | null;")
    expect(types).toContain("created_at: Generated<Date | null>;")
    expect(columns).toContain('users: ["id", "email", "created_at", "profile"],')
    expect(declarations).toContain("namespace DB")
    expect(declarations).toContain("export type Users = {")
  })

  test("omits Generated import when no generated columns are present", async () => {
    const { config, cwd, migrationsFolder } = await createTempProject()

    await writeFile(
      join(migrationsFolder, "001_plain.ts"),
      [
        'import type { Kysely } from "ormfy"',
        "",
        "export async function up(db: Kysely<never>): Promise<void> {",
        "\tawait db.schema",
        '\t\t.createTable("logs")',
        '\t\t.addColumn("id", "integer", (column) => column.primaryKey())',
        '\t\t.addColumn("message", "text")',
        "\t\t.execute()",
        "}",
      ].join("\n"),
      "utf8",
    )

    await runTypegen(config, "migrations")

    const types = await readFile(resolve(cwd, "src/db/types.ts"), "utf8")

    expect(types).not.toContain('import type { Generated } from "ormfy";')
    expect(types).toContain("id: number;")
    expect(types).toContain("message: string | null;")
  })

  test("generates files from live database metadata", async () => {
    const { config } = await createTempProject()
    const databaseConfig = {
      ...config,
      kysely: createDatabase(),
    } as ResolvedOrmfyConfig

    await runTypegen(databaseConfig, "database")

    const types = await readFile(resolve(databaseConfig.cwd, "src/db/types.ts"), "utf8")
    const columns = await readFile(resolve(databaseConfig.cwd, "src/db/columns.ts"), "utf8")

    expect(types).toContain("id: Generated<number>;")
    expect(types).toContain("created_at: Generated<Date>;")
    expect(types).toContain("profile: unknown | null;")
    expect(types).not.toContain("users_view")
    expect(columns).toContain('users: ["id", "email", "created_at", "profile"],')
  })
});
