import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { consola } from '../utils/logger.js';
import { getTablesFromDatabase } from '../typegen/typegen.js';
const GENERATED_HEADER = [
    '// Auto-generated. Do not edit manually.',
    '// Regenerate with: ormfy gen:models',
    '',
];
export async function runModelsGen(config) {
    const tables = await getTablesFromDatabase(config);
    const modelsFolder = config.models.modelsFolder;
    await mkdir(modelsFolder, { recursive: true });
    for (const table of tables.values()) {
        const filePath = resolve(modelsFolder, `${table.name}.ts`);
        await writeFile(filePath, renderModelFile(modelsFolder, filePath, table), 'utf8');
    }
    consola.success(`Generated ${tables.size} model file(s).`);
}
function renderModelFile(modelsFolder, filePath, table) {
    const fileDir = dirname(filePath);
    const parentDir = dirname(modelsFolder);
    const dbImportPath = toImportPath(relative(fileDir, parentDir));
    const columnsImportPath = toImportPath(relative(fileDir, resolve(parentDir, 'columns.ts')));
    const exportName = toCamelCase(table.name);
    return [
        ...GENERATED_HEADER,
        'import { ormfy } from "ormfy";',
        `import { db } from "${dbImportPath}";`,
        'import { databaseColumns, defaultOrmfyGuardedColumns } from "' +
            columnsImportPath +
            '";',
        '',
        `export const ${exportName} = ormfy(db, "${table.name}", {`,
        `\tcolumns: databaseColumns.${table.name},`,
        '\tguarded: defaultOrmfyGuardedColumns,',
        '\tprimaryKey: "id",',
        '\tidStrategy: "uuidv4",',
        '});',
        '',
    ].join('\n');
}
function toCamelCase(value) {
    return value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}
function toImportPath(value) {
    const normalized = value.split(sep).join('/').replace(/\.ts$/, '');
    return normalized.startsWith('.') ? normalized : `./${normalized}`;
}
//# sourceMappingURL=gen-models.js.map