import { copyFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { consola } from '../utils/logger.js'
import { join } from 'node:path'
import { CommonArgs } from '../arguments/common.js'
import { ORMIFY_EXTENSION } from '../arguments/extension.js'
import { configFileExists, getConfig } from '../config/get-config.js'
import { getCWD } from '../config/get-cwd.js'
import { createSubcommand } from '../utils/create-subcommand.js'
import { defineArgs } from '../utils/define-args.js'
import { defineCommand } from '../utils/define-command.js'

const {
	// TODO: consider supporting passing a config path to init command that controls the filepath to be created.
	config: _omitted0,
	environment: _omitted1,
	'no-filesystem-caching': _omitted3,
	...CommonArgsForInit
} = CommonArgs

const args = defineArgs({
	...CommonArgsForInit,
})

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates')

const Command = defineCommand(args, {
	meta: {
		description: 'Create a sample `ormfy.config` file',
	},
	async run(context) {
		const { args } = context

		const config = await getConfig(args)

		if (configFileExists(config)) {
			return consola.warn(
				`Init skipped: config file already exists at ${config.configMetadata.configFile}`,
			)
		}

		const filePath = join(getCWD(), `ormfy.config.${ORMIFY_EXTENSION}`)

		consola.debug('File path:', filePath)

		const templatePath = join(
			templateRoot,
			`config-template.${ORMIFY_EXTENSION}`,
		)

		consola.debug('Template path:', templatePath)

		await copyFile(templatePath, filePath)

		consola.success(`Config file created at ${filePath}`)
	},
})

export const InitCommand = createSubcommand('init', Command)
