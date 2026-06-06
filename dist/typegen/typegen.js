import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { consola } from '../utils/logger.js';
import { safeReaddir } from '../utils/safe-readdir.js';
import { usingKysely } from '../kysely/using-kysely.js';
const INDENT = '\t';
const DOUBLE_INDENT = '\t\t';
const LINE_WIDTH = 150;
const GENERATED_HEADER = [
    '// Auto-generated. Do not edit manually.',
    '// Regenerate with: ormfy db:typegen',
    '',
];
const SQL_TO_TS = {
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
};
export async function runTypegen(config, source) {
    const tables = source === 'database'
        ? await getTablesFromDatabase(config)
        : await getTablesFromMigrations(config);
    await writeArtifacts(config.cwd, tables);
    consola.success(`Generated database types from ${source} for ${tables.size} table(s).`);
}
async function writeArtifacts(cwd, tables) {
    const typesOutput = generateTypes(tables);
    const columnsOutput = generateColumns(tables);
    const dbDeclarationsOutput = generateDbDeclarations(tables);
    const outputFile = resolve(cwd, 'src/db/types.ts');
    const outputColumnsFile = resolve(cwd, 'src/db/columns.ts');
    const outputDbDeclarationsFile = resolve(cwd, 'src/@types/db.d.ts');
    await mkdir(dirname(outputFile), { recursive: true });
    await mkdir(dirname(outputColumnsFile), { recursive: true });
    await mkdir(dirname(outputDbDeclarationsFile), { recursive: true });
    await writeFile(outputFile, typesOutput, 'utf8');
    await writeFile(outputColumnsFile, columnsOutput, 'utf8');
    await writeFile(outputDbDeclarationsFile, dbDeclarationsOutput, 'utf8');
}
async function getTablesFromMigrations(config) {
    const tables = new Map();
    const files = (await safeReaddir(config.migrations.migrationFolder))
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))
        .sort();
    for (const file of files) {
        const content = await readFile(join(config.migrations.migrationFolder, file), 'utf8');
        const downIndex = content.indexOf('export async function down');
        const upContent = downIndex >= 0 ? content.slice(0, downIndex) : content;
        const lines = upContent.split('\n');
        let currentTable = null;
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index] ?? '';
            const createMatch = line.match(/\.createTable\(\s*['"]([^'"]+)['"]\s*\)/);
            if (createMatch?.[1]) {
                const tableName = createMatch[1];
                currentTable = tableName;
                if (!tables.has(tableName)) {
                    tables.set(tableName, { columns: new Map(), name: tableName });
                }
                continue;
            }
            const alterMatch = line.match(/\.alterTable\(\s*['"]([^'"]+)['"]\s*\)/);
            if (alterMatch?.[1]) {
                currentTable = alterMatch[1];
                continue;
            }
            const dropTableMatch = line.match(/\.dropTable\(\s*['"]([^'"]+)['"]\s*\)/);
            if (dropTableMatch?.[1]) {
                tables.delete(dropTableMatch[1]);
                currentTable = null;
                continue;
            }
            if (!currentTable) {
                continue;
            }
            if (!line.includes('.addColumn(')) {
                const dropColumnMatch = line.match(/\.dropColumn\(\s*['"]([^'"]+)['"]\s*\)/);
                if (dropColumnMatch?.[1]) {
                    tables.get(currentTable)?.columns.delete(dropColumnMatch[1]);
                }
                if (line.includes('.execute()')) {
                    currentTable = null;
                }
                continue;
            }
            const { block, endIndex } = getAddColumnBlock(lines, index);
            index = endIndex;
            const addColumnMatch = block.match(/\.addColumn\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"]([^'"]+)['"]|sql`([^`]+)`)/);
            const columnName = addColumnMatch?.[1];
            const sqlType = addColumnMatch?.[2] ?? addColumnMatch?.[3];
            if (columnName && sqlType) {
                const table = tables.get(currentTable);
                if (table) {
                    table.columns.set(columnName, {
                        generated: isGeneratedSqlType(sqlType) ||
                            block.includes('.defaultTo(') ||
                            block.includes('.generatedAlwaysAsIdentity(') ||
                            block.includes('.generatedByDefaultAsIdentity('),
                        name: columnName,
                        nullable: !block.includes('.notNull()') && !block.includes('.primaryKey()'),
                        tsType: sqlTypeToTs(sqlType),
                    });
                }
            }
        }
    }
    return tables;
}
async function getTablesFromDatabase(config) {
    return await usingKysely(config, async (kysely) => {
        const tables = new Map();
        const introspection = kysely.introspection;
        const metadata = await introspection.getTables({
            withInternalKyselyTables: false,
        });
        for (const table of metadata) {
            if (table.isView || table.isForeign) {
                continue;
            }
            const tableInfo = {
                columns: new Map(),
                name: table.name,
            };
            for (const column of table.columns) {
                tableInfo.columns.set(column.name, {
                    generated: column.isAutoIncrementing || column.hasDefaultValue,
                    name: column.name,
                    nullable: column.isNullable,
                    tsType: sqlTypeToTs(column.dataType),
                });
            }
            tables.set(table.name, tableInfo);
        }
        return tables;
    });
}
function getAddColumnBlock(lines, startIndex) {
    const blockLines = [];
    for (let index = startIndex; index < lines.length; index++) {
        const line = lines[index] ?? '';
        blockLines.push(line);
        if (index > startIndex && (line.includes('.addColumn(') || line.includes('.execute()'))) {
            blockLines.pop();
            return { block: blockLines.join('\n'), endIndex: index - 1 };
        }
    }
    return { block: blockLines.join('\n'), endIndex: lines.length - 1 };
}
function sqlTypeToTs(sqlType) {
    const normalized = sqlType
        .toLowerCase()
        .replace(/\(.*\)/, '')
        .trim();
    return SQL_TO_TS[normalized] ?? 'unknown';
}
function isGeneratedSqlType(sqlType) {
    const normalized = sqlType.toLowerCase().replace(/\(.*\)/, '').trim();
    return (normalized === 'serial' ||
        normalized === 'bigserial' ||
        normalized === 'smallserial');
}
function toPascalCase(value) {
    return value.replace(/(^|_)([a-z])/g, (_, _separator, char) => char.toUpperCase());
}
function generateTypes(tables) {
    const shouldImportGenerated = [...tables.values()].some((table) => [...table.columns.values()].some((column) => column.generated));
    const lines = [...GENERATED_HEADER];
    if (shouldImportGenerated) {
        lines.push('import type { Generated } from "ormfy";', '');
    }
    for (const table of tables.values()) {
        const interfaceName = `${toPascalCase(table.name)}Table`;
        lines.push(`export interface ${interfaceName} {`);
        for (const column of table.columns.values()) {
            const valueType = column.nullable ? `${column.tsType} | null` : column.tsType;
            const type = column.generated ? `Generated<${valueType}>` : valueType;
            lines.push(`${INDENT}${column.name}: ${type};`);
        }
        lines.push('}');
        lines.push('');
    }
    lines.push('export interface Database {');
    for (const table of tables.values()) {
        lines.push(`${INDENT}${table.name}: ${toPascalCase(table.name)}Table;`);
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}
function generateDbDeclarations(tables) {
    const lines = [...GENERATED_HEADER, 'export {};', '', 'declare global {', `${INDENT}namespace DB {`];
    const tableList = [...tables.values()];
    for (const [index, table] of tableList.entries()) {
        const typeName = toPascalCase(table.name);
        lines.push(`${DOUBLE_INDENT}export type ${typeName} = {`);
        for (const column of table.columns.values()) {
            const type = column.nullable ? `${column.tsType} | null` : column.tsType;
            lines.push(`${DOUBLE_INDENT}${INDENT}${column.name}: ${type};`);
        }
        lines.push(`${DOUBLE_INDENT}};`);
        if (index < tableList.length - 1) {
            lines.push('');
        }
    }
    lines.push(`${INDENT}}`);
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}
function generateColumns(tables) {
    const lines = [
        ...GENERATED_HEADER,
        'import type { Database } from "./types";',
        '',
        'type DatabaseColumns = {',
        `${INDENT}[Table in keyof Database]: readonly (keyof Database[Table] & string)[];`,
        '};',
        '',
        'export const databaseColumns = {',
    ];
    for (const table of tables.values()) {
        const columnNames = [...table.columns.values()].map((column) => column.name);
        const inlineColumns = `${INDENT}${table.name}: [${columnNames.map((column) => `"${column}"`).join(', ')}],`;
        if (inlineColumns.length <= LINE_WIDTH) {
            lines.push(inlineColumns);
            continue;
        }
        lines.push(`${INDENT}${table.name}: [`);
        for (const column of columnNames) {
            lines.push(`${DOUBLE_INDENT}"${column}",`);
        }
        lines.push(`${INDENT}],`);
    }
    lines.push('} as const satisfies DatabaseColumns;');
    lines.push('');
    lines.push('export const defaultOrmfyGuardedColumns = ["id", "created_at", "updated_at"] as const;');
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=typegen.js.map