import type { ResolvedOrmfyConfigWithKyselyInstance } from '../config/ormfy-config.js'
import { hydrate } from '../utils/hydrate.js'
import { FileSeedProvider } from './file-seed-provider.js'
import { Seeder } from './seeder.js'

export async function getSeeder(
	config: ResolvedOrmfyConfigWithKyselyInstance,
): Promise<Seeder> {
	const { args, kysely, seeds } = config
	const { seedFolder, seeder, ...seederOptions } = seeds

	if (seeder) {
		return await hydrate(seeder, [kysely])
	}

	const provider = await hydrate(
		seeds.provider,
		[],
		() =>
			new FileSeedProvider({
				debug: args.debug,
				filesystemCaching: args['filesystem-caching'],
				seedFolder,
			}),
	)

	return new Seeder({ ...seederOptions, db: kysely, provider })
}
