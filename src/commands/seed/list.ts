import { consola } from '../../utils/logger.js'
import { CommonArgs } from '../../arguments/common.js'
import { usingSeeder } from '../../seeds/using-seeder.js'
import { createSubcommand } from '../../utils/create-subcommand.js'
import { defineCommand } from '../../utils/define-command.js'

const Command = defineCommand(CommonArgs, {
	meta: {
		description: 'List seeds',
	},
	async run(context) {
		const seeds = await usingSeeder(context.args, (seeder) => seeder.getSeeds())

		consola.debug(seeds)

		if (!seeds.length) {
			return consola.info('No seeds found.')
		}

		consola.info(`Found ${seeds.length} seed${seeds.length > 1 ? 's' : ''}:`)

		for (const seed of seeds) {
			consola.log(seed.name)
		}
	},
})

export const ListCommand = createSubcommand('list', Command)
