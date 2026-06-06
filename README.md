# Ormfy

Small typed helper over Kysely for CRUD, filters, pagination and transactions.

## Install

Install directly from GitHub:

```bash
bun add github:andreunix/ormfy
```

For a fixed version, use the Git tag:

```bash
bun add github:andreunix/ormfy#v0.1.6
```

Ormfy reexports Kysely, so you can import Kysely core and dialect classes from the same package:

```ts
import { Kysely, PostgresDialect, ormfy } from "ormfy"
```

## CLI

Ormfy includes a Kysely migration/seed/sql CLI for Bun and Node TypeScript projects.
Configuration lives in the project root:

```bash
bunx ormfy init
```

This creates:

```txt
ormfy.config.ts
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
```

`gen:types` writes `src/db/types.ts` and `src/@types/db.d.ts`. It defaults to `migrations`, and you can switch to `database` in the config or by passing `database` on the command line.
`gen:models` reads the live database schema and writes one file per table under `src/db/models` by default. The generated model is self-contained, with `columns` and `guarded` inline in the file. Set `models.modelsFolder` and `models.dbImportPath` in `ormfy.config.ts` to change the output directory and the db import path.

If your shell does not resolve local package binaries, call the installed bin directly:

```bash
bun node_modules/.bin/ormfy init
```

## Create A Model

```ts
import { ormfy } from "ormfy"

const users = ormfy(db, "users", {
  columns: ["id", "email", "name", "created_at", "updated_at"],
  guarded: ["id", "created_at", "updated_at"],
  primaryKey: "id",
})
```

Generated model files follow this pattern:

```ts
import { ormfy } from "ormfy"
import { db } from ".."

export const testTable = ormfy(db, "test_table", {
  columns: ["id", "name", "created_at", "updated_at"],
  guarded: ["id", "created_at", "updated_at"],
  primaryKey: "id",
  idStrategy: "uuidv4",
})
```

## Find

```ts
const rows = await users.find({ email: "a@example.com" })
```

## Create

```ts
const user = await users.create({ email: "a@example.com", name: "Ana" })
```

## Update By Id

```ts
await users.updateById(id, { name: "Ana Maria" })
```

## Transaction

```ts
await users.transaction(async (tx) => {
  await users.updateById(id, { name: "Ana" }, { tx })
})
```

## Bound Transaction

```ts
await users.tx(async (usersTx, tx) => {
  await usersTx.updateById(id, { name: "Ana" })
})
```

## Test

```bash
bun test
bun run typecheck
```
