export declare const InitCommand: {
    readonly init: Readonly<Omit<import("citty").CommandDef<{
        readonly 'no-outdated-check': {
            readonly default: false;
            readonly description: "Will not check for latest kysely/ormfy versions and notice newer versions exist.";
            readonly type: "boolean";
        };
        readonly version: {
            readonly alias: "v";
            readonly default: false;
            readonly description: "Show version number";
            readonly type: "boolean";
        };
        readonly cwd: {
            readonly description: "The current working directory to use for relative paths.";
            readonly type: "string";
        };
        readonly debug: {
            readonly default: false;
            readonly description: "Show debug information.";
            readonly type: "boolean";
        };
        readonly help: {
            readonly alias: "h";
            readonly default: false;
            readonly description: "Show help information";
            readonly type: "boolean";
        };
    }>, "meta"> & {
        meta: Omit<import("citty").Resolvable<import("citty").CommandMeta> | undefined, "name"> & {
            readonly name: "init";
        };
    }>;
};
