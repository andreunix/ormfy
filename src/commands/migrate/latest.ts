import { consola } from '../../utils/logger.js'
import { CommonArgs } from '../../arguments/common.js'
import { MigrateArgs } from '../../arguments/migrate.js'
import { processMigrationResultSet } from '../../kysely/process-migration-result-set.js'
import { usingMigrator } from '../../kysely/using-migrator.js'
import { createSubcommand } from '../../utils/create-subcommand.js'
import { defineArgs } from '../../utils/define-args.js'
import { defineCommand } from '../../utils/define-command.js'

const args = defineArgs({ ...CommonArgs, ...MigrateArgs })

const Command = defineCommand(args, {
	meta: {
		description: 'Update the database schema to the latest version',
	},
	async run(context) {
		await usingMigrator(context.args, async (migrator) => {
			consola.start('Starting migration to latest')

			const resultSet = await migrator.migrateToLatest()

			await processMigrationResultSet(resultSet, 'up', migrator)
		})
	},
})

export const LatestCommand = createSubcommand('latest', Command)
export const LegacyLatestCommand = createSubcommand('migrate:latest', Command)
