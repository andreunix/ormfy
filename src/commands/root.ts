import { fileURLToPath } from 'node:url'
import { consola, LogLevels } from '../utils/logger.js'
import { CommonArgs } from '../arguments/common.js'
import { getCWD } from '../config/get-cwd.js'
import { defineCommand } from '../utils/define-command.js'
import { printUpgradeNotice } from '../utils/version.js'
import { InitCommand } from './init.js'
import { LegacyDownCommand } from './migrate/down.js'
import { LegacyLatestCommand } from './migrate/latest.js'
import { LegacyListCommand } from './migrate/list.js'
import { LegacyMakeCommand as LegacyMigrateMakeCommand } from './migrate/make.js'
import { LegacyRollbackCommand } from './migrate/rollback.js'
import { MigrateCommand } from './migrate/root.js'
import { LegacyUpCommand } from './migrate/up.js'
import { LegacyMakeCommand as LegacySeedMakeCommand } from './seed/make.js'
import { SeedCommand } from './seed/root.js'
import { LegacyRunCommand } from './seed/run.js'
import { GenModelsCommand } from './gen-models.js'
import { SqlCommand } from './sql.js'
import { GenTypesCommand } from './gen-types.js'

export const RootCommand = defineCommand(CommonArgs, {
	meta: {
		name: 'ormfy',
		description: 'Ormfy command-line tools for Kysely migrations, seeds and SQL',
	},
	subCommands: {
		...InitCommand,
		...LegacyDownCommand,
		...LegacyLatestCommand,
		...LegacyListCommand,
		...LegacyMigrateMakeCommand,
		...LegacyRollbackCommand,
		...LegacyRunCommand,
		...LegacySeedMakeCommand,
		...LegacyUpCommand,
		...GenModelsCommand,
		...GenTypesCommand,
		...MigrateCommand,
		...SeedCommand,
		...SqlCommand,
	},
	setup(context) {
		const { args } = context

		if (args.debug) {
			consola.level = LogLevels.debug
		}

		consola.options.formatOptions.date = false

		consola.debug('cwd', getCWD(args as never)) // ensures the CWD is set
	},
	async cleanup(context) {
		try {
			await printUpgradeNotice(context.args as never)
		} catch (error) {
			consola.debug('Failed to print upgrade notice:', error)
		}

		consola.debug(`finished running from "${fileURLToPath(import.meta.url)}"`)
	},
})
