import { consola } from '../../utils/logger.js'
import { CommonArgs } from '../../arguments/common.js'
import { MigrateArgs } from '../../arguments/migrate.js'
import { createMigrationNameArg } from '../../arguments/migration-name.js'
import { isWrongDirection } from '../../kysely/is-wrong-direction.js'
import { processMigrationResultSet } from '../../kysely/process-migration-result-set.js'
import { usingMigrator } from '../../kysely/using-migrator.js'
import { createSubcommand } from '../../utils/create-subcommand.js'
import { defineArgs } from '../../utils/define-args.js'
import { defineCommand } from '../../utils/define-command.js'

const args = defineArgs({
	...CommonArgs,
	...MigrateArgs,
	...createMigrationNameArg(),
})

const Command = defineCommand(args, {
	meta: {
		description: 'Undo the last/specified migration that was run',
	},
	async run(context) {
		const { args } = context
		const { migration_name } = args

		await usingMigrator(args, async (migrator) => {
			if (await isWrongDirection(migration_name, 'down', migrator)) {
				return consola.info(
					`Migration skipped: "${migration_name}" has not been run yet`,
				)
			}

			consola.start('Starting migration down')

			const resultSet = migration_name
				? await migrator.migrateTo(migration_name)
				: await migrator.migrateDown()

			await processMigrationResultSet(resultSet, 'down', migrator)
		})
	},
})

export const DownCommand = createSubcommand('down', Command)
export const LegacyDownCommand = createSubcommand('migrate:down', Command)
