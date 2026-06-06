import { consola } from '../utils/logger.js';
import { join, parse } from 'node:path';
import { importTSFile } from '../utils/import-ts-file.js';
import { isObject } from '../utils/is-object.js';
import { safeReaddir } from '../utils/safe-readdir.js';
/**
 * An opinionated migration provider that reads migrations from TypeScript files.
 * Same as `FileMigrationProvider` but works in ESM/CJS without loader flag/s,
 * and on Windows too.
 */
export class TSFileMigrationProvider {
    #props;
    constructor(props) {
        this.#props = props;
    }
    async getMigrations() {
        const files = await safeReaddir(this.#props.migrationFolder);
        const migrations = {};
        for (const fileName of files) {
            if (!fileName.endsWith('.ts') || fileName.endsWith('.d.ts')) {
                consola.warn(`Ignoring \`${fileName}\` - not a TS file.`);
                continue;
            }
            const filePath = join(this.#props.migrationFolder, fileName);
            const migrationModule = (await importTSFile(filePath, this.#props));
            const migrationKey = parse(fileName).name;
            if (!migrationKey) {
                continue;
            }
            const migration = isMigration(migrationModule?.default)
                ? migrationModule.default
                : isMigration(migrationModule)
                    ? migrationModule
                    : null;
            if (!migration) {
                consola.warn(`Ignoring \`${fileName}\` - not a migration.`);
                continue;
            }
            migrations[migrationKey] = migration;
        }
        return migrations;
    }
}
function isMigration(thing) {
    return isObject(thing) && typeof thing.up === 'function';
}
//# sourceMappingURL=ts-file-migration-provider.js.map