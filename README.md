# Ormfy

Ormfy is a small typed layer on top of Kysely. It gives you a model helper, a root-level config file, and a CLI for migrations, seeds, SQL, type generation, and model generation.

## Install

Install directly from GitHub:

```bash
bun add github:andreunix/ormfy#v0.1.8
```

Ormfy reexports Kysely, so you import the ORM helper, Kysely core, and dialect classes from the same package:

```ts
import { Kysely, PostgresDialect, ormfy } from "ormfy"
```

You do not install Kysely separately unless you want a different version than the one bundled with Ormfy.

## What Ormfy Gives You

- `ormfy(db, tableName, config)` for typed CRUD, filters, pagination, and transactions.
- A root `ormfy.config.ts` in the project root.
- CLI commands for migrations, seeds, SQL, `gen:types`, and `gen:models`.
- Reexports for Kysely and the dialect helpers used by the CLI templates.

## Quick Start

Create your config:

```bash
bunx ormfy init
```

This creates `ormfy.config.ts` in the project root.

Define a database and a model:

```ts
import { Kysely, PostgresDialect, ormfy, defineConfig } from "ormfy"
import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL!)

export const db = new Kysely({
  dialect: new PostgresDialect({
    postgres: sql,
  }),
})

export const users = ormfy(db, "users", {
  columns: ["id", "email", "name", "created_at", "updated_at"],
  guarded: ["id", "created_at", "updated_at"],
  primaryKey: "id",
})

export default defineConfig({
  dialect: "postgres",
  dialectConfig: () => ({
    postgres: sql,
  }),
})
```

## Model Helper

`ormfy(db, tableName, config)` wraps a Kysely instance with a typed model API.

```ts
import { ormfy } from "ormfy"

const users = ormfy(db, "users", {
  columns: ["id", "email", "name", "created_at", "updated_at"],
  guarded: ["id", "created_at", "updated_at"],
  primaryKey: "id",
  idStrategy: "uuidv4",
})
```

Common methods include:

- `find`
- `findOne`
- `findById`
- `create`
- `update`
- `updateById`
- `delete`
- `deleteById`
- `paginate`
- `transaction`
- `tx`
- `query`
- `queryAll`
- `pluck`
- `value`

### ID Strategy

Default `idStrategy` is `uuidv4`.

Supported values:

- `uuidv4`
- `uuidv7`
- `manual`
- `database`
- a custom function returning a `string`, `number`, or `bigint`

## CLI

Ormfy CLI works in Bun and Node TypeScript projects.

```bash
bunx ormfy init
```

Common commands:

```bash
bunx ormfy migrate make create_users
bunx ormfy migrate latest
bunx ormfy migrate rollback
bunx ormfy seed make initial_data
bunx ormfy seed run
bunx ormfy sql "select 1"
bunx ormfy gen:types
bunx ormfy gen:types database
bunx ormfy gen:models
bunx ormfy gen:models database
```

If the shell does not resolve the local binary, call it directly:

```bash
bun node_modules/.bin/ormfy init
```

## Config

`ormfy.config.ts` lives in the project root.

Example:

```ts
import {
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  defineConfig,
} from "ormfy"

export default defineConfig({
  dialect: {
    createAdapter() {
      return new PostgresAdapter()
    },
    createDriver() {
      return new DummyDriver()
    },
    createIntrospector(db: unknown) {
      return new PostgresIntrospector(db as never)
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler()
    },
  },
  models: {
    modelsFolder: "src/db/models",
    dbImportPath: "..",
    source: "migrations",
  },
  typegen: {
    source: "migrations",
  },
  migrations: {
    migrationFolder: "migrations",
  },
  seeds: {
    seedFolder: "seeds",
  },
})
```

### Models config

- `models.modelsFolder`: output directory for generated model files.
- `models.dbImportPath`: import path used inside generated models for `db`.
- `models.source`: `migrations` or `database`. Default is `migrations`.

### Type generation config

- `typegen.source`: `migrations` or `database`. Default is `migrations`.

## Generated Types

`gen:types` writes:

- `src/db/types.ts`
- `src/@types/db.d.ts`

It reads the migration folder by default. Use `database` when you want the generated types to reflect the live database schema instead of the migration files.

## Generated Models

`gen:models` writes one file per table under `src/db/models` by default.

It reads migrations by default, so the generated models are aligned with the schema declared in your migration files. Use `database` when you want to introspect the live database instead.

Generated files are self-contained. They include `columns` and `guarded` inline. `gen:models` infers `primaryKey` and `idStrategy` per table when it can:

- generated primary keys use `idStrategy: "database"`
- string primary keys without a database default use `idStrategy: "uuidv4"`
- other primary keys without a database default use `idStrategy: "manual"`
- tables without a detected primary key omit `primaryKey` and `idStrategy`

```ts
import { ormfy } from "ormfy"
import { db } from ".."

export const testTable = ormfy(db, "test_table", {
  columns: [
    "id",
    "name",
    "created_at",
    "updated_at",
  ] as const,
  guarded: [
    "id",
    "created_at",
    "updated_at",
  ] as const,
  primaryKey: "id",
  idStrategy: "database",
})
```

## Supported Dialects

Ormfy supports the Kysely dialects already handled by the package:

- `pg`
- `mysql2`
- `tedious`
- `better-sqlite3`
- `pglite`
- `postgres`
- `bun`
- `@neondatabase/serverless`
- `@prisma/ppg`

For serverless environments, prefer a dialect that does not depend on a long-lived TCP pool.

## Serverless / SvelteKit

Ormfy works in server-side runtimes like SvelteKit as long as the dialect is compatible with the runtime.

For serverless, prefer:

- `@neondatabase/serverless`
- `postgres` / `bun` with a serverless-safe connection strategy

Example:

```ts
import { Kysely, NeonDialect } from "ormfy"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const db = new Kysely({
  dialect: new NeonDialect({
    neon: sql,
  }),
})
```

## Testing and Development

```bash
bun test
bun run typecheck
bun run build
```

## Notes

- The CLI expects `ormfy.config.ts` at the project root.
- Models and type generation are separate commands.
- `gen:models` and `gen:types` can use either migrations or live database metadata.
