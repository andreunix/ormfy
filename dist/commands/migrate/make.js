import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consola } from '../../utils/logger.js';
import { join } from 'node:path';
import { CommonArgs } from '../../arguments/common.js';
import { ORMIFY_EXTENSION } from '../../arguments/extension.js';
import { createMigrationNameArg } from '../../arguments/migration-name.js';
import { getConfigOrFail } from '../../config/get-config.js';
import { createSubcommand } from '../../utils/create-subcommand.js';
import { defineArgs } from '../../utils/define-args.js';
import { defineCommand } from '../../utils/define-command.js';
const args = defineArgs({
    ...CommonArgs,
    ...createMigrationNameArg(true),
});
const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');
const Command = defineCommand(args, {
    meta: {
        description: 'Create a new migration file',
    },
    async run(context) {
        const { args } = context;
        const config = await getConfigOrFail(args);
        const { getMigrationPrefix, migrationFolder } = config.migrations;
        const wasMigrationsFolderCreated = Boolean(await mkdir(migrationFolder, { recursive: true }));
        if (wasMigrationsFolderCreated) {
            consola.debug('Migrations folder created');
        }
        const filename = `${await getMigrationPrefix()}${args.migration_name}.${ORMIFY_EXTENSION}`;
        consola.debug('Filename:', filename);
        const filePath = join(migrationFolder, filename);
        consola.debug('File path:', filePath);
        const templatePath = join(templateRoot, `migration-template.${ORMIFY_EXTENSION}`);
        consola.debug('Template path:', templatePath);
        await copyFile(templatePath, filePath);
        consola.success(`Created migration file at ${filePath}`);
    },
});
export const MakeCommand = createSubcommand('make', Command);
export const LegacyMakeCommand = createSubcommand('migrate:make', Command);
//# sourceMappingURL=make.js.map