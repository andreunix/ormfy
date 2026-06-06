import type { ArgDef } from 'citty';
export type StrictArgsDef = Record<string, StrictArgDef>;
export type StrictArgDef = ArgDef & {
    description: NonNullable<ArgDef['description']>;
    type: NonNullable<ArgDef['type']>;
};
export declare function defineArgs<const Args extends StrictArgsDef>(args: Args, dontSort?: boolean): Args;
