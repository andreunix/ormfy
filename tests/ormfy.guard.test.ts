import { describe, expect, test } from "bun:test";
import { OrmfyGuardedColumnError, OrmfyInvalidColumnError } from "../src/errors";
import { createOrmfyGuard } from "../src/guard";

type UserTable = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: Date;
};

type TestDb = {
  users: UserTable;
};

const guard = createOrmfyGuard<TestDb, "users">("users", ["id", "email", "name", "created_at"], ["id", "created_at"]);

describe("Ormfy guard", () => {
  test("accepts valid columns", () => {
    expect(() => guard.assertColumn("email")).not.toThrow();
  });

  test("rejects invalid columns", () => {
    expect(() => guard.assertColumn("missing")).toThrow(OrmfyInvalidColumnError);
  });

  test("rejects guarded columns for assignment", () => {
    expect(() => guard.assertAssignableColumn("id")).toThrow(OrmfyGuardedColumnError);
    expect(() => guard.assertAssignableColumn("email")).not.toThrow();
  });

  test("validates filters with valid columns", () => {
    expect(() => guard.assertFilter({ email: "a@example.com", $in: { name: ["Ana"] }, $notNull: ["created_at"] })).not.toThrow();
  });

  test("rejects filters with invalid columns", () => {
    expect(() => guard.assertFilter({ missing: "value" })).toThrow(OrmfyInvalidColumnError);
  });
});
