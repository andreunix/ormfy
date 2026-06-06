import type { ArgsDef, CommandContext } from 'citty'

/**
 * Check if the current command is a subcommand.
 */
export function isInSubcommand<A extends ArgsDef>(
	context: CommandContext<A>,
): boolean {
	const {
		cmd: { subCommands },
		rawArgs,
	} = context

	if (!subCommands) {
		return false
	}

	const subCommandNames = new Set(Object.keys(subCommands))

	return rawArgs.some((arg) => subCommandNames.has(arg))
}
