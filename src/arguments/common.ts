import { defineArgs } from '../utils/define-args.js'
import { JitiArgs } from './jiti.js'

export const CommonArgs = defineArgs({
	config: {
		alias: 'c',
		description: 'Path to the config file.',
		type: 'string',
	},
	cwd: {
		description: 'The current working directory to use for relative paths.',
		type: 'string',
	},
	debug: {
		default: false,
		description: 'Show debug information.',
		type: 'boolean',
	},
	environment: {
		alias: 'e',
		description:
			'Load .env and .env.<environment> before reading the configuration.',
		type: 'string',
		valueHint: 'production | development | test | ...',
	},
	help: {
		alias: 'h',
		default: false,
		description: 'Show help information',
		type: 'boolean',
	},
	...JitiArgs,
	'no-outdated-check': {
		default: false,
		description:
			'Will not check for latest kysely/ormfy versions and notice newer versions exist.',
		type: 'boolean',
	},
	version: {
		alias: 'v',
		default: false,
		description: 'Show version number',
		type: 'boolean',
	},
})
