# Ormfy

Small typed helper over Kysely for CRUD, filters, pagination and transactions.

## Install

Install directly from GitHub:

```bash
bun add github:andreunix/ormfy
```

For a fixed version, use the Git tag:

```bash
bun add github:andreunix/ormfy#v0.1.0
```

Install Kysely in the consuming project too:

```bash
bun add kysely
```

Ormfy is not published to npm yet, so import it from the GitHub dependency:

```ts
import { ormfy } from "ormfy"
```

## CLI

Ormfy includes a Kysely migration/seed/sql CLI for Bun and Node TypeScript projects.
Configuration lives in the project root:

```bash
ormfy init
```

This creates:

```txt
ormfy.config.ts
```

Common commands:

```bash
ormfy migrate make create_users
ormfy migrate latest
ormfy migrate rollback
ormfy seed make initial_data
ormfy seed run
ormfy sql "select 1"
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
