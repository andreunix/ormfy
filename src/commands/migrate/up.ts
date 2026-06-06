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
		description: 'Run the next migration that has not yet been run',
	},
	async run(context) {
		const { args } = context
		const { migration_name } = args

		await usingMigrator(args, async (migrator) => {
			if (await isWrongDirection(migration_name, 'up', migrator)) {
				return consola.info(
					`Migration skipped: migration "${migration_name}" has already been run`,
				)
			}

			consola.start('Starting migration up')

			const resultSet = migration_name
				? await migrator.migrateTo(migration_name)
				: await migrator.migrateUp()

			await processMigrationResultSet(resultSet, 'up', migrator)
		})
	},
})

export const UpCommand = createSubcommand('up', Command)
export const LegacyUpCommand = createSubcommand('migrate:up', Command)
