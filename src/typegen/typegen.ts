import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { consola } from '../utils/logger.js'
import { safeReaddir } from '../utils/safe-readdir.js'
import { usingKysely } from '../kysely/using-kysely.js'
import type { ResolvedOrmfyConfig } from '../config/ormfy-config.js'

export type TypegenSource = 'migrations' | 'database'

type ColumnInfo = {
	generated: boolean
	name: string
	nullable: boolean
	tsType: string
}

type TableInfo = {
	columns: Map<string, ColumnInfo>
	name: string
}

const INDENT = '\t'
const DOUBLE_INDENT = '\t\t'
const LINE_WIDTH = 150
const GENERATED_HEADER = [
	'// Auto-generated. Do not edit manually.',
	'// Regenerate with: ormfy db:typegen',
	'',
]

const SQL_TO_TS: Record<string, string> = {
	bigint: 'number',
	bigserial: 'number',
	bool: 'boolean',
	boolean: 'boolean',
	binary: 'Uint8Array',
	blob: 'Uint8Array',
	bytea: 'Uint8Array',
	char: 'string',
	'character varying': 'string',
	date: 'Date',
	datetime: 'Date',
	datetime2: 'Date',
	decimal: 'number',
	double: 'number',
	'double precision': 'number',
	float: 'number',
	float4: 'number',
	float8: 'number',
	int: 'number',
	int2: 'number',
	int4: 'number',
	int8: 'number',
	integer: 'number',
	json: 'unknown',
	jsonb: 'unknown',
	longblob: 'Uint8Array',
	mediumblob: 'Uint8Array',
	mediumint: 'number',
	money: 'number',
	numeric: 'number',
	real: 'number',
	serial: 'number',
	smallint: 'number',
	smallserial: 'number',
	text: 'string',
	time: 'string',
	'time with time zone': 'string',
	'time without time zone': 'string',
	timetz: 'string',
	timestamp: 'Date',
	'timestamp with time zone': 'Date',
	'timestamp without time zone': 'Date',
	timestamptz: 'Date',
	tinyint: 'number',
	uuid: 'string',
	varbinary: 'Uint8Array',
	varchar: 'string',
}

export async function runTypegen(
	config: ResolvedOrmfyConfig,
	source: TypegenSource,
): Promise<void> {
	const tables =
		source === 'database'
			? await getTablesFromDatabase(config)
			: await getTablesFromMigrations(config)

	await writeArtifacts(config.cwd, tables)

	consola.success(
		`Generated database types from ${source} for ${tables.size} table(s).`,
	)
}

async function writeArtifacts(
	cwd: string,
	tables: Map<string, TableInfo>,
): Promise<void> {
	const typesOutput = generateTypes(tables)
	const columnsOutput = generateColumns(tables)
	const dbDeclarationsOutput = generateDbDeclarations(tables)

	const outputFile = resolve(cwd, 'src/db/types.ts')
	const outputColumnsFile = resolve(cwd, 'src/db/columns.ts')
	const outputDbDeclarationsFile = resolve(cwd, 'src/@types/db.d.ts')

	await mkdir(dirname(outputFile), { recursive: true })
	await mkdir(dirname(outputColumnsFile), { recursive: true })
	await mkdir(dirname(outputDbDeclarationsFile), { recursive: true })

	await writeFile(outputFile, typesOutput, 'utf8')
	await writeFile(outputColumnsFile, columnsOutput, 'utf8')
	await writeFile(outputDbDeclarationsFile, dbDeclarationsOutput, 'utf8')
}

async function getTablesFromMigrations(
	config: ResolvedOrmfyConfig,
): Promise<Map<string, TableInfo>> {
	const tables = new Map<string, TableInfo>()
	const files = (await safeReaddir(config.migrations.migrationFolder))
		.filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))
		.sort()

	for (const file of files) {
		const content = await readFile(
			join(config.migrations.migrationFolder, file),
			'utf8',
		)
		const downIndex = content.indexOf('export async function down')
		const upContent = downIndex >= 0 ? content.slice(0, downIndex) : content
		const lines = upContent.split('\n')
		let currentTable: string | null = null

		for (let index = 0; index < lines.length; index++) {
			const line = lines[index] ?? ''
			const createMatch = line.match(/\.createTable\(\s*['"]([^'"]+)['"]\s*\)/)

			if (createMatch?.[1]) {
				const tableName = createMatch[1]
				currentTable = tableName
				if (!tables.has(tableName)) {
					tables.set(tableName, { columns: new Map(), name: tableName })
				}
				continue
			}

			const alterMatch = line.match(/\.alterTable\(\s*['"]([^'"]+)['"]\s*\)/)
			if (alterMatch?.[1]) {
				currentTable = alterMatch[1]
				continue
			}

			const dropTableMatch = line.match(/\.dropTable\(\s*['"]([^'"]+)['"]\s*\)/)
			if (dropTableMatch?.[1]) {
				tables.delete(dropTableMatch[1])
				currentTable = null
				continue
			}

			if (!currentTable) {
				continue
			}

			if (!line.includes('.addColumn(')) {
				const dropColumnMatch = line.match(/\.dropColumn\(\s*['"]([^'"]+)['"]\s*\)/)
				if (dropColumnMatch?.[1]) {
					tables.get(currentTable)?.columns.delete(dropColumnMatch[1])
				}

				if (line.includes('.execute()')) {
					currentTable = null
				}

				continue
			}

			const { block, endIndex } = getAddColumnBlock(lines, index)
			index = endIndex

			const addColumnMatch = block.match(
				/\.addColumn\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]([^'"]+)['"]|sql`([^`]+)`)/,
			)
			const columnName = addColumnMatch?.[1]
			const sqlType = addColumnMatch?.[2] ?? addColumnMatch?.[3]

			if (columnName && sqlType) {
				const table = tables.get(currentTable)
				if (table) {
					table.columns.set(columnName, {
						generated:
							isGeneratedSqlType(sqlType) ||
							block.includes('.defaultTo(') ||
							block.includes('.generatedAlwaysAsIdentity(') ||
							block.includes('.generatedByDefaultAsIdentity('),
						name: columnName,
						nullable: !block.includes('.notNull()') && !block.includes('.primaryKey()'),
						tsType: sqlTypeToTs(sqlType),
					})
				}
			}
		}
	}

	return tables
}

async function getTablesFromDatabase(
	config: ResolvedOrmfyConfig,
): Promise<Map<string, TableInfo>> {
	return await usingKysely(config, async (kysely) => {
		const tables = new Map<string, TableInfo>()
		const introspection = kysely.introspection
		const metadata = await introspection.getTables({
			withInternalKyselyTables: false,
		})

		for (const table of metadata) {
			if (table.isView || table.isForeign) {
				continue
			}

			const tableInfo: TableInfo = {
				columns: new Map(),
				name: table.name,
			}

			for (const column of table.columns) {
				tableInfo.columns.set(column.name, {
					generated: column.isAutoIncrementing || column.hasDefaultValue,
					name: column.name,
					nullable: column.isNullable,
					tsType: sqlTypeToTs(column.dataType),
				})
			}

			tables.set(table.name, tableInfo)
		}

		return tables
	})
}

function getAddColumnBlock(
	lines: string[],
	startIndex: number,
): { block: string; endIndex: number } {
	const blockLines: string[] = []

	for (let index = startIndex; index < lines.length; index++) {
		const line = lines[index] ?? ''
		blockLines.push(line)

		if (index > startIndex && (line.includes('.addColumn(') || line.includes('.execute()'))) {
			blockLines.pop()
			return { block: blockLines.join('\n'), endIndex: index - 1 }
		}
	}

	return { block: blockLines.join('\n'), endIndex: lines.length - 1 }
}

function sqlTypeToTs(sqlType: string): string {
	const normalized = sqlType
		.toLowerCase()
		.replace(/\(.*\)/, '')
		.trim()

	return SQL_TO_TS[normalized] ?? 'unknown'
}

function isGeneratedSqlType(sqlType: string): boolean {
	const normalized = sqlType.toLowerCase().replace(/\(.*\)/, '').trim()

	return (
		normalized === 'serial' ||
		normalized === 'bigserial' ||
		normalized === 'smallserial'
	)
}

function toPascalCase(value: string): string {
	return value.replace(/(^|_)([a-z])/g, (_, _separator, char: string) => char.toUpperCase())
}

function generateTypes(tables: Map<string, TableInfo>): string {
	const lines: string[] = [
		...GENERATED_HEADER,
		'import type { Generated } from "ormfy";',
		'',
	]

	for (const table of tables.values()) {
		const interfaceName = `${toPascalCase(table.name)}Table`
		lines.push(`export interface ${interfaceName} {`)

		for (const column of table.columns.values()) {
			const valueType = column.nullable ? `${column.tsType} | null` : column.tsType
			const type = column.generated ? `Generated<${valueType}>` : valueType
			lines.push(`${INDENT}${column.name}: ${type};`)
		}

		lines.push('}')
		lines.push('')
	}

	lines.push('export interface Database {')
	for (const table of tables.values()) {
		lines.push(`${INDENT}${table.name}: ${toPascalCase(table.name)}Table;`)
	}
	lines.push('}')
	lines.push('')

	return lines.join('\n')
}

function generateDbDeclarations(tables: Map<string, TableInfo>): string {
	const lines: string[] = [...GENERATED_HEADER, 'export {};', '', 'declare global {', `${INDENT}namespace DB {`]

	const tableList = [...tables.values()]

	for (const [index, table] of tableList.entries()) {
		const typeName = toPascalCase(table.name)
		lines.push(`${DOUBLE_INDENT}export type ${typeName} = {`)

		for (const column of table.columns.values()) {
			const type = column.nullable ? `${column.tsType} | null` : column.tsType
			lines.push(`${DOUBLE_INDENT}${INDENT}${column.name}: ${type};`)
		}

		lines.push(`${DOUBLE_INDENT}};`)
		if (index < tableList.length - 1) {
			lines.push('')
		}
	}

	lines.push(`${INDENT}}`)
	lines.push('}')
	lines.push('')

	return lines.join('\n')
}

function generateColumns(tables: Map<string, TableInfo>): string {
	const lines: string[] = [
		...GENERATED_HEADER,
		'import type { Database } from "./types";',
		'',
		'type DatabaseColumns = {',
		`${INDENT}[Table in keyof Database]: readonly (keyof Database[Table] & string)[];`,
		'};',
		'',
		'export const databaseColumns = {',
	]

	for (const table of tables.values()) {
		const columnNames = [...table.columns.values()].map((column) => column.name)
		const inlineColumns = `${INDENT}${table.name}: [${columnNames.map((column) => `"${column}"`).join(', ')}],`

		if (inlineColumns.length <= LINE_WIDTH) {
			lines.push(inlineColumns)
			continue
		}

		lines.push(`${INDENT}${table.name}: [`)
		for (const column of columnNames) {
			lines.push(`${DOUBLE_INDENT}"${column}",`)
		}
		lines.push(`${INDENT}],`)
	}

	lines.push('} as const satisfies DatabaseColumns;')
	lines.push('')
	lines.push('export const defaultOrmfyGuardedColumns = ["id", "created_at", "updated_at"] as const;')
	lines.push('')

	return lines.join('\n')
}
