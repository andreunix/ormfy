import { type GetConfigArgs, getConfigOrFail } from '../config/get-config.js'
import { usingKysely } from '../kysely/using-kysely.js'
import { getSeeder } from './get-seeder.js'
import type { Seeder } from './seeder.js'

export async function usingSeeder<T>(
	args: GetConfigArgs,
	callback: (seeder: Seeder) => Promise<T>,
): Promise<T> {
	const config = await getConfigOrFail(args)

	return await usingKysely(config, async (kysely) => {
		const seeder = await getSeeder({ ...config, kysely })

		return await callback(seeder)
	})
}
