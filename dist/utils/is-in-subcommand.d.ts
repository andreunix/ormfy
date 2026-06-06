import type { ArgsDef, CommandContext } from 'citty';
/**
 * Check if the current command is a subcommand.
 */
export declare function isInSubcommand<A extends ArgsDef>(context: CommandContext<A>): boolean;
