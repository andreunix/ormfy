import { CommonArgs } from '../arguments/common.js';
import { getConfigOrFail } from '../config/get-config.js';
import { createSubcommand } from '../utils/create-subcommand.js';
import { defineArgs } from '../utils/define-args.js';
import { defineCommand } from '../utils/define-command.js';
import { runModelsGen } from '../models/gen-models.js';
const args = defineArgs({
    ...CommonArgs,
});
const Command = defineCommand(args, {
    meta: {
        description: 'Generate one model file per table from the live database',
    },
    async run(context) {
        const config = await getConfigOrFail(context.args);
        await runModelsGen(config);
    },
});
export const GenModelsCommand = createSubcommand('gen:models', Command);
//# sourceMappingURL=gen-models.js.map