import { access, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { consola } from './logger.js'
import { getCWD } from '../config/get-cwd.js'
import { isObject } from './is-object.js'
import { getPackageManager } from './package-manager.js'
import {
	getConsumerPackageJSON,
	getCTLPackageJSON,
	type PackageJson,
} from './pkg-json.js'

type SupportedPackageManagerName = 'bun' | 'npm' | 'pnpm' | 'yarn'

/**
 * Returns the version of the Kysely package.
 */
export async function getKyselyInstalledVersion(): Promise<string | null> {
	try {
		const pkgJSON = await getConsumerPackageJSON()

		const version = getVersionFromPackageJSON('kysely', pkgJSON)

		if (!version) {
			return null
		}

		if (version.startsWith('catalog:')) {
			return await getVersionFromCatalog('kysely', version)
		}

		return version
	} catch {
		return null
	}
}

/**
 * Returns the version of this package.
 */
export async function getCTLInstalledVersion(): Promise<string | null> {
	try {
		const pkgJSON = await getCTLPackageJSON()

		return getVersionFromPackageJSON('ormfy', pkgJSON)
	} catch {
		return null
	}
}

function getVersionFromPackageJSON(
	name: string,
	pkgJSON: PackageJson,
): string | null {
	if (pkgJSON.name === name) {
		return pkgJSON.version || null
	}

	return pkgJSON.dependencies?.[name] || pkgJSON.devDependencies?.[name] || null
}

/**
 * Prints the version of the CLI and the Kysely package.
 */
export async function printInstalledVersions(): Promise<void> {
	const [cliVersion, kyselyVersion] = await Promise.all([
		getCTLInstalledVersion(),
		getKyselyInstalledVersion(),
	])

	consola.log(
		`kysely ${kyselyVersion ? `v${kyselyVersion}` : '[not installed]'}`,
	)
	consola.log(`ormfy v${cliVersion}`)
}

async function getKyselyLatestVersion(): Promise<string> {
	return await getPackageLatestVersion('kysely')
}

async function getCTLLatestVersion(): Promise<string> {
	return await getPackageLatestVersion('ormfy')
}

async function getPackageLatestVersion(packageName: string): Promise<string> {
	const response = await fetch(
		`https://registry.npmjs.org/${packageName}`,
	)

	if (!response.ok) {
		throw new Error(`Failed to fetch ${packageName} metadata.`)
	}

	const metadata = (await response.json()) as { 'dist-tags': { latest: string } }

	return metadata['dist-tags'].latest
}

export async function printUpgradeNotice(args: {
	'outdated-check'?: boolean
	version?: boolean
}): Promise<void> {
	if (args.version || args['outdated-check'] === false || process.env.CI) {
		return
	}

	const [
		kyselyInstalledVersion,
		kyselyLatestVersion,
		ctlInstalledVersion,
		ctlLatestVersion,
	] = await Promise.all([
		getKyselyInstalledVersion(),
		getKyselyLatestVersion(),
		getCTLInstalledVersion(),
		getCTLLatestVersion(),
	])

	const notices: [
		prettyName: string,
		packageName: string,
		installedVersion: string | null,
		latestVersion: string,
	][] = []

	if (!kyselyInstalledVersion?.includes(kyselyLatestVersion)) {
		notices.push([
			'Kysely',
			'kysely',
			kyselyInstalledVersion,
			kyselyLatestVersion,
		])
	}

	if (!ctlInstalledVersion?.includes(ctlLatestVersion)) {
		notices.push([
				'Ormfy',
				'ormfy',
			ctlInstalledVersion,
			ctlLatestVersion,
		])
	}

	if (!notices.length) {
		return
	}

	const detectedPackageManager = await getPackageManager()
	const packageManagerName = normalizePackageManagerName(detectedPackageManager.name)
	const command =
		detectedPackageManager.name === packageManagerName
			? detectedPackageManager.command
			: 'npm'

	const installGloballyCommand = (
		{
			bun: (name) => `add -g ${name}@latest`,
			npm: (name) => `i -g ${name}@latest`,
			pnpm: (name) => `add -g ${name}@latest`,
			// doesn't support global installs in modern versions.
			yarn: (name) => `add -D ${name}@latest`,
		} satisfies Record<SupportedPackageManagerName, (name: string) => string>
	)[packageManagerName]

	const installLocallyCommand = (
		{
			bun: (name, dev?) => `add ${dev ? '-D ' : ''}${name}@latest`,
			npm: (name, dev?) => `i ${dev ? '-D ' : ''}${name}@latest`,
			pnpm: (name, dev?) => `add ${dev ? '-D ' : ''}${name}@latest`,
			yarn: (name, dev?) => `add ${dev ? '-D ' : ''}${name}@latest`,
		} satisfies Record<
			SupportedPackageManagerName,
			(name: string, dev?: boolean) => string
		>
	)[packageManagerName]

	consola.box(
		notices
			.map(
				([prettyName, name, installedVersion, latestVersion]) =>
					`A new ${prettyName} version is available: ${installedVersion ? `v${installedVersion}` : '[not installed]'} -> v${latestVersion}\nRun \`${
						command
					} ${
							name === 'ormfy'
							? installGloballyCommand(name)
							: installLocallyCommand(name)
					}\` to upgrade.`,
			)
			.join('\n\n'),
	)
}

interface CatalogContainer {
	catalog?: Record<string, string>
	catalogs?: Record<string, Record<string, string>>
}

async function getVersionFromCatalog(
	packageName: string,
	catalogReference: string,
): Promise<string | null> {
	const workspaceDirPath = await findWorkspaceDir(getCWD())

	consola.debug('workspaceDirPath', workspaceDirPath)

	const rawWorkspaceFile = await readOptionalFile(
		join(workspaceDirPath, 'pnpm-workspace.yaml'),
	)

	if (rawWorkspaceFile) {
		consola.debug('rawWorkspaceFile', rawWorkspaceFile)

		const workspaceFile = parsePnpmWorkspaceCatalog(rawWorkspaceFile)

		consola.debug('workspaceFile', workspaceFile)

		return extractVersionFromCatalogContainer(
			workspaceFile,
			packageName,
			catalogReference,
		)
	}

	const rawPackageJson = await readOptionalFile(join(workspaceDirPath, 'package.json'))

	if (rawPackageJson) {
		const rootPkgJSON = JSON.parse(rawPackageJson) as PackageJson

		consola.debug('rootPkgJSON', rootPkgJSON)

		const { workspaces } = rootPkgJSON

		if (!isObject(workspaces)) {
			return null
		}

		return extractVersionFromCatalogContainer(
			workspaces,
			packageName,
			catalogReference,
		)
	}

	return null
}

async function findWorkspaceDir(startingFrom: string): Promise<string> {
	let current = resolve(startingFrom)

	while (true) {
		if (
			(await exists(join(current, 'pnpm-workspace.yaml'))) ||
			(await exists(join(current, 'package.json')))
		) {
			return current
		}

		const parent = dirname(current)

		if (parent === current) {
			return startingFrom
		}

		current = parent
	}
}

async function exists(path: string): Promise<boolean> {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

async function readOptionalFile(path: string): Promise<string | null> {
	try {
		return await readFile(path, 'utf8')
	} catch {
		return null
	}
}

function parsePnpmWorkspaceCatalog(raw: string): CatalogContainer {
	const catalog: Record<string, string> = {}
	const catalogs: Record<string, Record<string, string>> = {}
	const lines = raw.split(/\r?\n/)
	let section: 'catalog' | 'catalogs' | null = null
	let catalogName: string | null = null

	for (const rawLine of lines) {
		const line = rawLine.replace(/\s+#.*$/, '')

		if (!line.trim()) {
			continue
		}

		if (/^catalog:\s*$/.test(line)) {
			section = 'catalog'
			catalogName = null
			continue
		}

		if (/^catalogs:\s*$/.test(line)) {
			section = 'catalogs'
			catalogName = null
			continue
		}

		const namedCatalogMatch = line.match(/^ {2}([\w-]+):\s*$/)

		if (section === 'catalogs' && namedCatalogMatch) {
			catalogName = namedCatalogMatch[1]
			catalogs[catalogName] ||= {}
			continue
		}

		const dependencyMatch = line.match(/^ {2,4}(@?[^:\s]+(?:\/[^:\s]+)?):\s*['"]?([^'"]+)['"]?\s*$/)

		if (!dependencyMatch) {
			continue
		}

		const [, name, version] = dependencyMatch

		if (section === 'catalog') {
			catalog[name] = version
		} else if (section === 'catalogs' && catalogName) {
			catalogs[catalogName][name] = version
		}
	}

	return { catalog, catalogs }
}

function normalizePackageManagerName(name: string): SupportedPackageManagerName {
	if (name === 'bun' || name === 'pnpm' || name === 'yarn') {
		return name
	}

	return 'npm'
}

const CATALOG_REFERENCE_PREFIX_REGEX = /^catalog:/

function extractVersionFromCatalogContainer(
	container: CatalogContainer,
	packageName: string,
	catalogReference: string,
): string | null {
	if (catalogReference === 'catalog:') {
		return container.catalog?.[packageName] || null
	}

	const catalogName = catalogReference.replace(
		CATALOG_REFERENCE_PREFIX_REGEX,
		'',
	)

	return container.catalogs?.[catalogName]?.[packageName] || null
}
