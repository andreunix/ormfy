# Ormfy

Small typed helper over Kysely for CRUD, filters, pagination and transactions.

## Install

Install directly from GitHub:

```bash
bun add github:andreunix/ormfy
```

For a fixed version, use the Git tag:

```bash
bun add github:andreunix/ormfy#v0.1.3
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
bunx ormfy db:typegen
bunx ormfy db:typegen database
```

`db:typegen` writes `src/db/types.ts`, `src/db/columns.ts`, and `src/@types/db.d.ts`. Use `migrations` to derive the shape from your migration files, or `database` to introspect the live database.

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
