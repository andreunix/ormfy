import { consola } from '../utils/logger.js'
import { Kysely } from 'kysely'
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js'
import { hydrate } from '../utils/hydrate.js'
import { getDialect } from './get-dialect.js'

// biome-ignore lint/suspicious/noExplicitAny: `any` is required here, for now.
export async function getKysely<DB = any>(
	config: ResolvedOrmfyConfig,
	debug = false,
): Promise<Kysely<DB>> {
	const { kysely } = config

	if (kysely) {
		return await hydrate(kysely, [])
	}

	const [dialect, plugins] = await Promise.all([
		getDialect(config),
		hydrate(config.plugins, []),
	])

	return new Kysely<DB>({
		dialect,
		log: debug
			? (event) => {
					if (event.level === 'error') {
						return consola.error(event.error)
					}

					return consola.log(
						`executed \`${event.query.sql}\` in ${event.queryDurationMillis}ms`,
					)
				}
			: [],
		plugins,
	})
}
