import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { consola } from '../utils/logger.js'
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js'
import {
	getTablesFromDatabase,
	getTablesFromMigrations,
	type TableInfo,
} from '../typegen/typegen.js'

const GENERATED_HEADER = [
	'// Auto-generated. Do not edit manually.',
	'// Regenerate with: ormfy gen:models',
	'',
]
const DEFAULT_GUARDED_COLUMNS = ['id', 'created_at']

export async function runModelsGen(config: ResolvedOrmfyConfig): Promise<void> {
	const tables =
		config.models.source === 'database'
			? await getTablesFromDatabase(config)
			: await getTablesFromMigrations(config)
	const modelsFolder = config.models.modelsFolder

	await mkdir(modelsFolder, { recursive: true })

	for (const table of tables.values()) {
		const filePath = resolve(modelsFolder, `${table.name}.ts`)
		await writeFile(filePath, renderModelFile(config, table), 'utf8')
	}

	consola.success(`Generated ${tables.size} model file(s).`)
}

function renderModelFile(
	config: ResolvedOrmfyConfig,
	table: TableInfo,
): string {
	const exportName = toCamelCase(table.name)
	const columnNames = [...table.columns.values()].map((column) => column.name)

	return [
		...GENERATED_HEADER,
		'import { ormfy } from "ormfy";',
		`import { db } from "${config.models.dbImportPath}";`,
		'',
		`export const ${exportName} = ormfy(db, "${table.name}", {`,
		`\tcolumns: ${renderReadonlyStringArray(columnNames)},`,
		`\tguarded: ${renderReadonlyStringArray(DEFAULT_GUARDED_COLUMNS)},`,
		'\tprimaryKey: "id",',
		'\tidStrategy: "uuidv4",',
		'});',
		'',
	].join('\n')
}

function renderReadonlyStringArray(values: readonly string[]): string {
	if (values.length === 0) {
		return '[] as const'
	}

	return `[\n${values.map((value) => `\t\t"${value}",`).join('\n')}\n\t] as const`
}

function toCamelCase(value: string): string {
	return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
