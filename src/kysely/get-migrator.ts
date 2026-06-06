import type { Migrator } from 'kysely/migration'
import type { ResolvedOrmfyConfigWithKyselyInstance } from '../config/ormfy-config.js'
import { hydrate } from '../utils/hydrate.js'
import { TSFileMigrationProvider } from './ts-file-migration-provider.js'

export async function getMigrator(
	config: ResolvedOrmfyConfigWithKyselyInstance,
): Promise<Migrator> {
	const { args, kysely, migrations } = config
	const { migrationFolder, migrator, ...migratorOptions } = migrations

	if (migrator) {
		return await hydrate(migrator, [kysely])
	}

	const provider = await hydrate(
		migrations.provider,
		[],
		() =>
			new TSFileMigrationProvider({
				debug: args.debug,
				filesystemCaching: args['filesystem-caching'],
				migrationFolder,
			}),
	)

	const { Migrator } = await import('kysely/migration').catch(
		() => import('kysely') as never as typeof import('kysely/migration'),
	)

	return new Migrator({ ...migratorOptions, db: kysely, provider })
}
