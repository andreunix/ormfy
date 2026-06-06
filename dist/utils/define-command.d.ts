import { type CommandDef } from 'citty';
import type { StrictArgsDef } from './define-args.js';
export declare function defineCommand<Args extends StrictArgsDef, const Command extends Omit<CommandDef<Args>, 'args'> & {
    args?: never;
}>(argDefs: Args, command: Command): CommandDef<Args>;
