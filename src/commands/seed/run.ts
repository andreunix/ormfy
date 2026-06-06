import { consola } from '../../utils/logger.js'
import { CommonArgs } from '../../arguments/common.js'
import { usingSeeder } from '../../seeds/using-seeder.js'
import { createSubcommand } from '../../utils/create-subcommand.js'
import { defineArgs } from '../../utils/define-args.js'
import { defineCommand } from '../../utils/define-command.js'
import { exitWithError } from '../../utils/error.js'

const args = defineArgs({
	...CommonArgs,
	specific: {
		description: 'Run seed file/s with given name/s',
		type: 'string',
	},
})

const Command = defineCommand(args, {
	meta: {
		description: 'Run seed files',
	},
	async run(context) {
		const { args } = context
		const { specific } = args

		consola.start('Starting seed run')

		const resultSet = await usingSeeder(args, (seeder) => seeder.run(specific))

		consola.debug(resultSet)

		const { error, results } = resultSet

		if (!results.length) {
			return consola.info('No seeds found.')
		}

		if (!error) {
			consola.success('Seed successful')
		}

		const actuallyRan = error
			? results.filter((result) => result.status !== 'NotExecuted')
			: results

		consola.info(
			`Ran ${actuallyRan.length} seed${actuallyRan.length > 1 ? 's' : ''}:`,
		)

		for (const result of results) {
			consola.log(
				`[${
					{
						Error: 'x',
						NotExecuted: ' ',
						Success: 'ok',
					}[result.status]
				}] ${result.seedName}${
					error && result.status === 'Error' ? ` - ${error}` : ''
				}`,
			)
		}

		if (error) {
			exitWithError(error)
		}
	},
})

export const RunCommand = createSubcommand('run', Command)
export const LegacyRunCommand = createSubcommand('seed:run', Command)
