import { consola } from '../utils/logger.js'
import { join, parse } from 'node:path'
import { asArray } from '../utils/as-array.js'
import { importTSFile } from '../utils/import-ts-file.js'
import { isObject } from '../utils/is-object.js'
import type { GetJitiArgs } from '../utils/jiti.js'
import { safeReaddir } from '../utils/safe-readdir.js'
import type { Seed, SeedProvider } from './seeder.js'

export class FileSeedProvider implements SeedProvider {
	readonly #props: FileSeedProviderProps

	constructor(props: FileSeedProviderProps) {
		this.#props = props
	}

	async getSeeds(seedNames?: string | string[]): Promise<Record<string, Seed>> {
		const seedNamesMap: Record<string, true> = {}

		if (seedNames) {
			for (const seedName of asArray(seedNames)) {
				seedNamesMap[seedName] = true
			}
		}

		const fileNames = await safeReaddir(this.#props.seedFolder)

		const seeds: Record<string, Seed> = {}

		for (const fileName of fileNames) {
			if (!fileName.endsWith('.ts') || fileName.endsWith('.d.ts')) {
				consola.warn(`Ignoring \`${fileName}\` - not a TS file.`)
				continue
			}

			const seedKey = parse(fileName).name

			if (!seedKey || (seedNames && !seedNamesMap[seedKey])) {
				continue
			}

			const filePath = join(this.#props.seedFolder, fileName)

			const seedModule = (await importTSFile(filePath, this.#props)) as {
				default?: unknown
			}

			const seed = isSeed(seedModule?.default)
				? seedModule.default
				: isSeed(seedModule)
					? seedModule
					: null

			if (!seed) {
				consola.warn(`Ignoring \`${fileName}\` - not a seed.`)
				continue
			}

			seeds[seedKey] = seed
		}

		return seeds
	}
}

function isSeed(thing: unknown): thing is Seed {
	return isObject(thing) && typeof thing.seed === 'function'
}

export interface FileSeedProviderProps extends GetJitiArgs {
	seedFolder: string
}
