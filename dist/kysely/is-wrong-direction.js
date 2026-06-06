// FIXME: we should introduce a way to ensure direction in `migratorTo` @ Kysely core.
export async function isWrongDirection(migrationName, expectedDirection, migrator) {
    if (!migrationName) {
        return false;
    }
    const migrations = await migrator.getMigrations();
    return (migrations.find((migration) => migration.name === migrationName &&
        ((expectedDirection === 'up' && migration.executedAt !== undefined) ||
            (expectedDirection === 'down' && !migration.executedAt))) !== undefined);
}
//# sourceMappingURL=is-wrong-direction.js.map