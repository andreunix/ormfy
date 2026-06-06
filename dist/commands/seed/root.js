import { CommonArgs } from '../../arguments/common.js';
import { createSubcommand } from '../../utils/create-subcommand.js';
import { defineCommand } from '../../utils/define-command.js';
import { ListCommand } from './list.js';
import { MakeCommand } from './make.js';
import { RunCommand } from './run.js';
const subCommands = {
    ...ListCommand,
    ...MakeCommand,
    ...RunCommand,
};
const Command = defineCommand(CommonArgs, {
    subCommands,
});
export const SeedCommand = createSubcommand('seed', Command);
//# sourceMappingURL=root.js.map