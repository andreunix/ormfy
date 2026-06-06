import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consola } from '../../utils/logger.js';
import { join } from 'node:path';
import { CommonArgs } from '../../arguments/common.js';
import { ORMIFY_EXTENSION } from '../../arguments/extension.js';
import { getConfigOrFail } from '../../config/get-config.js';
import { createSubcommand } from '../../utils/create-subcommand.js';
import { defineArgs } from '../../utils/define-args.js';
import { defineCommand } from '../../utils/define-command.js';
const args = defineArgs({
    ...CommonArgs,
    seed_name: {
        description: 'Seed file name to create',
        required: true,
        type: 'positional',
    },
});
const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');
const Command = defineCommand(args, {
    meta: {
        description: 'Create a new seed file',
    },
    async run(context) {
        const { args } = context;
        const config = await getConfigOrFail(args);
        const { getSeedPrefix, seedFolder } = config.seeds;
        const wasSeedsFolderCreated = Boolean(await mkdir(seedFolder, { recursive: true }));
        if (wasSeedsFolderCreated) {
            consola.debug('Seeds folder created');
        }
        const filename = `${await getSeedPrefix()}${args.seed_name}.${ORMIFY_EXTENSION}`;
        consola.debug('Filename:', filename);
        const filePath = join(seedFolder, filename);
        consola.debug('File path:', filePath);
        const templatePath = join(templateRoot, 'seed-template.template');
        consola.debug('Template path:', templatePath);
        await writeFile(filePath, await readFile(templatePath, 'utf8'), 'utf8');
        consola.success(`Created seed file at ${filePath}`);
    },
});
export const MakeCommand = createSubcommand('make', Command);
export const LegacyMakeCommand = createSubcommand('seed:make', Command);
//# sourceMappingURL=make.js.map