import { consola } from '../utils/logger.js'
import type { Migration, MigrationProvider } from 'kysely/migration'
import { join, parse } from 'node:path'
import { importTSFile } from '../utils/import-ts-file.js'
import { isObject } from '../utils/is-object.js'
import type { GetJitiArgs } from '../utils/jiti.js'
import { safeReaddir } from '../utils/safe-readdir.js'

/**
 * An opinionated migration provider that reads migrations from TypeScript files.
 * Same as `FileMigrationProvider` but works in ESM/CJS without loader flag/s,
 * and on Windows too.
 */
export class TSFileMigrationProvider implements MigrationProvider {
	readonly #props: TSFileMigrationProviderProps

	constructor(props: TSFileMigrationProviderProps) {
		this.#props = props
	}

	async getMigrations(): Promise<Record<string, Migration>> {
		const files = await safeReaddir(this.#props.migrationFolder)

		const migrations: Record<string, Migration> = {}

		for (const fileName of files) {
			if (!fileName.endsWith('.ts') || fileName.endsWith('.d.ts')) {
				consola.warn(`Ignoring \`${fileName}\` - not a TS file.`)
				continue
			}

			const filePath = join(this.#props.migrationFolder, fileName)

			const migrationModule = (await importTSFile(filePath, this.#props)) as {
				default?: unknown
			}

			const migrationKey = parse(fileName).name

			if (!migrationKey) {
				continue
			}

			const migration = isMigration(migrationModule?.default)
				? migrationModule.default
				: isMigration(migrationModule)
					? migrationModule
					: null

			if (!migration) {
				consola.warn(`Ignoring \`${fileName}\` - not a migration.`)
				continue
			}

			migrations[migrationKey] = migration
		}

		return migrations
	}
}

function isMigration(thing: unknown): thing is Migration {
	return isObject(thing) && typeof thing.up === 'function'
}

export interface TSFileMigrationProviderProps extends GetJitiArgs {
	migrationFolder: string
}
