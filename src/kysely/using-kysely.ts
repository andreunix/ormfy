import type { Kysely } from 'kysely'
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js'
import { getKysely } from './get-kysely.js'

export async function usingKysely<T>(
	config: ResolvedOrmfyConfig,
	// biome-ignore lint/suspicious/noExplicitAny: `any` is required here, for now.
	callback: (kysely: Kysely<any>) => Promise<T>,
): Promise<T> {
	const kysely = await getKysely(config)

	try {
		return await callback(kysely)
	} finally {
		if (config.destroyOnExit !== false) {
			await kysely.destroy()
		}
	}
}
