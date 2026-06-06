import { CommonArgs } from '../arguments/common.js'
import { createSubcommand } from '../utils/create-subcommand.js'
import { defineArgs } from '../utils/define-args.js'
import { defineCommand } from '../utils/define-command.js'
import { getConfigOrFail } from '../config/get-config.js'
import { runTypegen } from '../typegen/typegen.js'
import type { TypegenSource } from '../config/ormfy-config.js'

const args = defineArgs({
	...CommonArgs,
	source: {
		description: 'Generate types from migrations or the live database.',
		options: ['migrations', 'database'],
		required: false,
		type: 'enum',
	},
})

const Command = defineCommand(args, {
	meta: {
		description: 'Generate Kysely types from migrations or the live database',
	},
	async run(context) {
		const config = await getConfigOrFail(context.args)
		const source = (context.args.source ?? config.typegen.source) as TypegenSource

		await runTypegen(config, source)
	},
})

export const GenTypesCommand = createSubcommand('gen:types', Command)
