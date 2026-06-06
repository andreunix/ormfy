/**
 * Check if the current command is a subcommand.
 */
export function isInSubcommand(context) {
    const { cmd: { subCommands }, rawArgs, } = context;
    if (!subCommands) {
        return false;
    }
    const subCommandNames = new Set(Object.keys(subCommands));
    return rawArgs.some((arg) => subCommandNames.has(arg));
}
//# sourceMappingURL=is-in-subcommand.js.map