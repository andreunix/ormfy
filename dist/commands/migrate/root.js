import { CommonArgs } from '../../arguments/common.js';
import { createSubcommand } from '../../utils/create-subcommand.js';
import { defineCommand } from '../../utils/define-command.js';
import { DownCommand } from './down.js';
import { LatestCommand } from './latest.js';
import { ListCommand } from './list.js';
import { MakeCommand } from './make.js';
import { RollbackCommand } from './rollback.js';
import { UpCommand } from './up.js';
const subCommands = {
    ...DownCommand,
    ...LatestCommand,
    ...ListCommand,
    ...MakeCommand,
    ...RollbackCommand,
    ...UpCommand,
};
const Command = defineCommand(CommonArgs, {
    subCommands,
});
export const MigrateCommand = createSubcommand('migrate', Command);
//# sourceMappingURL=root.js.map