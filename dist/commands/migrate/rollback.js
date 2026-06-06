import { consola } from '../../utils/logger.js';
import { CommonArgs } from '../../arguments/common.js';
import { MigrateArgs } from '../../arguments/migrate.js';
import { processMigrationResultSet } from '../../kysely/process-migration-result-set.js';
import { usingMigrator } from '../../kysely/using-migrator.js';
import { createSubcommand } from '../../utils/create-subcommand.js';
import { defineArgs } from '../../utils/define-args.js';
import { defineCommand } from '../../utils/define-command.js';
const args = defineArgs({
    ...CommonArgs,
    ...MigrateArgs,
    all: {
        description: 'Rollback all completed migrations',
        required: true, // remove this if and when Migrator supports migration batches.
        type: 'boolean',
    },
});
const Command = defineCommand(args, {
    meta: {
        description: 'Rollback all the completed migrations',
    },
    async run(context) {
        await usingMigrator(context.args, async (migrator) => {
            consola.start('Starting migration rollback');
            const { NO_MIGRATIONS } = await import('kysely/migration').catch(() => import('kysely'));
            const resultSet = await migrator.migrateTo(NO_MIGRATIONS);
            await processMigrationResultSet(resultSet, 'down', migrator);
        });
    },
});
export const RollbackCommand = createSubcommand('rollback', Command);
export const LegacyRollbackCommand = createSubcommand('migrate:rollback', Command);
//# sourceMappingURL=rollback.js.map