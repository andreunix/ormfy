import { CommonArgs } from '../arguments/common.js'
import { getConfigOrFail } from '../config/get-config.js'
import type { TypegenSource } from '../config/ormfy-config.js'
import { createSubcommand } from '../utils/create-subcommand.js'
import { defineArgs } from '../utils/define-args.js'
import { defineCommand } from '../utils/define-command.js'
import { runModelsGen } from '../models/gen-models.js'

const args = defineArgs({
	...CommonArgs,
	source: {
		description: 'Generate models from migrations or the live database.',
		options: ['migrations', 'database'],
		required: false,
		type: 'enum',
	},
})

const Command = defineCommand(args, {
	meta: {
		description: 'Generate one model file per table from migrations or the live database',
	},
	async run(context) {
		const config = await getConfigOrFail(context.args)

		const source = (context.args.source ?? config.models.source) as TypegenSource
		await runModelsGen({
			...config,
			models: {
				...config.models,
				source,
			},
		})
	},
})

export const GenModelsCommand = createSubcommand('gen:models', Command)
