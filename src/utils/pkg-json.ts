import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCWD } from '../config/get-cwd.js'

export interface PackageJson {
	name?: string
	version?: string
	type?: string
	packageManager?: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	workspaces?: string[] | { catalog?: Record<string, string>; catalogs?: Record<string, Record<string, string>> }
}

export interface GetPackageJSONOptions {
	id?: string
	startingFrom?: string
}

const PACKAGE_JSONS: Record<string, PackageJson> = {}

export async function getConsumerPackageJSON(): Promise<PackageJson> {
	return await getPackageJSON({ startingFrom: getCWD() })
}

export async function getCTLPackageJSON(): Promise<PackageJson> {
	return await getPackageJSON({ id: 'ormfy' })
}

async function getPackageJSON(
	options: GetPackageJSONOptions,
): Promise<PackageJson> {
	const { id, startingFrom = dirname(fileURLToPath(import.meta.url)) } = options

	const cacheKey = `${String(id)}_${startingFrom}`

	if (PACKAGE_JSONS[cacheKey]) {
		return PACKAGE_JSONS[cacheKey]
	}

	const packageJsonPath = id
		? await findPackageJsonForPackage(id, startingFrom)
		: await findNearestPackageJson(startingFrom)

	if (!packageJsonPath) {
		throw new Error(`Could not find package.json${id ? ` for ${id}` : ''}.`)
	}

	const raw = await readFile(packageJsonPath, 'utf8')
	const pkgJSON = JSON.parse(raw) as PackageJson

	PACKAGE_JSONS[cacheKey] = pkgJSON

	return pkgJSON
}

async function findPackageJsonForPackage(
	id: string,
	startingFrom: string,
): Promise<string | null> {
	const nearestPackageJson = await findNearestPackageJson(startingFrom)

	if (nearestPackageJson) {
		const pkgJSON = JSON.parse(await readFile(nearestPackageJson, 'utf8')) as PackageJson

		if (pkgJSON.name === id) {
			return nearestPackageJson
		}
	}

	return findNearestPackageJson(dirname(fileURLToPath(import.meta.url)))
}

async function findNearestPackageJson(startingFrom: string): Promise<string | null> {
	let current = startingFrom

	while (true) {
		const packageJsonPath = `${current}/package.json`

		try {
			await readFile(packageJsonPath, 'utf8')
			return packageJsonPath
		} catch {
			const parent = dirname(current)

			if (parent === current) {
				return null
			}

			current = parent
		}
	}
}
