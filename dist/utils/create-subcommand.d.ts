import type { CommandDef } from 'citty';
export declare function createSubcommand<Name extends string, const Command extends CommandDef<any>>(name: Name, def: Command): {
    readonly [K in Name]: Readonly<Omit<Command, 'meta'> & {
        meta: Omit<Command['meta'], 'name'> & {
            readonly name: Name;
        };
    }>;
};
