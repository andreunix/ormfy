import { CommonArgs } from '../arguments/common.js';
import { createSubcommand } from '../utils/create-subcommand.js';
import { defineArgs } from '../utils/define-args.js';
import { defineCommand } from '../utils/define-command.js';
import { getConfigOrFail } from '../config/get-config.js';
import { runTypegen } from '../typegen/typegen.js';
const args = defineArgs({
    ...CommonArgs,
    source: {
        description: 'Generate types from migrations or the live database.',
        options: ['migrations', 'database'],
        required: false,
        type: 'enum',
    },
});
const Command = defineCommand(args, {
    meta: {
        description: 'Generate Kysely types from migrations or the live database',
    },
    async run(context) {
        const config = await getConfigOrFail(context.args);
        const source = (context.args.source ?? config.typegen.source);
        await runTypegen(config, source);
    },
});
export const GenTypesCommand = createSubcommand('gen:types', Command);
export const LegacyDbTypegenCommand = createSubcommand('db:typegen', Command);
//# sourceMappingURL=gen-types.js.map