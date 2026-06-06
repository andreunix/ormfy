import type { Migrator } from 'kysely/migration'
import { type GetConfigArgs, getConfigOrFail } from '../config/get-config.js'
import { getMigrator } from './get-migrator.js'
import { usingKysely } from './using-kysely.js'

export async function usingMigrator<T>(
	args: GetConfigArgs,
	callback: (migrator: Migrator) => Promise<T>,
): Promise<T> {
	const config = await getConfigOrFail(args)

	return await usingKysely(config, async (kysely) => {
		const migrator = await getMigrator({ ...config, kysely })

		return await callback(migrator)
	})
}
