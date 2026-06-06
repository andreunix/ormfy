import { showUsage, } from 'citty';
import { consola } from './logger.js';
import { isInSubcommand } from './is-in-subcommand.js';
import { printInstalledVersions } from './version.js';
// biome-ignore lint/suspicious/noExplicitAny: it's fine
let lastSetupCommand;
// biome-ignore lint/suspicious/noExplicitAny: it's fine
let mergedContext;
export function defineCommand(argDefs, command) {
    // biome-ignore lint/suspicious/noExplicitAny: it's fine
    let parentCommand;
    const subCommands = sortSubCommands(command.subCommands);
    const subCommandUnion = Object.keys(subCommands || {}).join('|');
    const definedCommand = {
        ...command,
        args: argDefs,
        meta: {
            description: subCommandUnion ? `\`${subCommandUnion}\`` : undefined,
            ...command.meta,
        },
        run: async (context) => {
            if (isInSubcommand(context)) {
                return;
            }
            const ctx = mergedContext || context;
            consola.debug('context', ctx);
            const { args } = ctx;
            if (args.version) {
                return await printInstalledVersions();
            }
            if (!command.run) {
                return await showUsage(definedCommand, parentCommand);
            }
            return await command.run(ctx);
        },
        setup: (context) => {
            parentCommand = lastSetupCommand;
            lastSetupCommand = definedCommand;
            mergedContext = mergeContexts(context, mergedContext);
            return command.setup?.(mergedContext);
        },
        subCommands,
    };
    return definedCommand;
}
function sortSubCommands(
// biome-ignore lint/suspicious/noExplicitAny: it's fine
subCommands) {
    if (!subCommands) {
        return;
    }
    return Object.fromEntries(Object.entries(subCommands).sort(([nameA], [nameB]) => nameA.localeCompare(nameB)));
}
function mergeContexts(
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
currentContext, 
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
previousContext) {
    return {
        ...currentContext,
        args: mergeArgs(currentContext.args, previousContext?.args),
        rawArgs: previousContext?.rawArgs || currentContext.rawArgs,
    };
}
function mergeArgs(
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
currentArgs, 
// biome-ignore lint/suspicious/noExplicitAny: it's fine.
previousArgs) {
    return Object.entries(currentArgs).reduce((args, [key, value]) => {
        if (typeof value === 'boolean') {
            args[key] ||= value;
        }
        else if (Array.isArray(value)) {
            args[key] = [...(Array.isArray(args[key]) ? args[key] : []), ...value];
        }
        else {
            args[key] = value;
        }
        return args;
    }, { ...previousArgs });
}
//# sourceMappingURL=define-command.js.map