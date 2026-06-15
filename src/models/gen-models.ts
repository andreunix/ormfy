import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { consola } from '../utils/logger.js'
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js'
import {
	getTablesFromDatabase,
	getTablesFromMigrations,
	type ColumnInfo,
	type TableInfo,
} from '../typegen/typegen.js'

const GENERATED_HEADER = [
	'// Auto-generated. Do not edit manually.',
	'// Regenerate with: ormfy gen:models',
	'',
]
const DEFAULT_GUARDED_COLUMNS = ['id', 'created_at', 'updated_at']

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
	const columns = [...table.columns.values()]
	const columnNames = columns.map((column) => column.name)
	const primaryKey = inferPrimaryKey(table)
	const guardedColumns = getGuardedColumns(table, primaryKey)
	const idStrategy = primaryKey ? getIdStrategy(primaryKey) : null
	const configLines = [
		`\tcolumns: ${renderReadonlyStringArray(columnNames)},`,
		`\tguarded: ${renderReadonlyStringArray(guardedColumns)},`,
	]

	if (primaryKey) {
		configLines.push(`\tprimaryKey: "${primaryKey.name}",`)
		configLines.push(`\tidStrategy: "${idStrategy}",`)
	}

	return [
		...GENERATED_HEADER,
		'import { ormfy } from "ormfy";',
		`import { db } from "${config.models.dbImportPath}";`,
		'',
		`export const ${exportName} = ormfy(db, "${table.name}", {`,
		...configLines,
		'});',
		'',
	].join('\n')
}

function inferPrimaryKey(table: TableInfo): ColumnInfo | undefined {
	return [...table.columns.values()].find((column) => column.primaryKey) ?? table.columns.get('id')
}

function getGuardedColumns(table: TableInfo, primaryKey: ColumnInfo | undefined): string[] {
	return [...new Set([primaryKey?.name, ...DEFAULT_GUARDED_COLUMNS])].filter((column): column is string =>
		Boolean(column && table.columns.has(column)),
	)
}

function getIdStrategy(column: ColumnInfo): 'database' | 'manual' | 'uuidv4' {
	if (column.generated) {
		return 'database'
	}

	if (column.tsType === 'string') {
		return 'uuidv4'
	}

	return 'manual'
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
