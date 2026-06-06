let migrations;
export async function getMigrations(migrator) {
    return (migrations ||= await migrator.getMigrations());
}
//# sourceMappingURL=get-migrations.js.map