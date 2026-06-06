import type { CommandDef } from 'citty';
export declare const SeedCommand: {
    readonly seed: Readonly<Omit<CommandDef<{
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
        readonly 'no-filesystem-caching': {
            readonly default: false;
            readonly description: "Will not write cache files to disk. See https://github.com/unjs/jiti#fscache for more information.";
            readonly type: "boolean";
        };
        readonly config: {
            readonly alias: "c";
            readonly description: "Path to the config file.";
            readonly type: "string";
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
        readonly environment: {
            readonly alias: "e";
            readonly description: "Load .env and .env.<environment> before reading the configuration.";
            readonly type: "string";
            readonly valueHint: "production | development | test | ...";
        };
        readonly help: {
            readonly alias: "h";
            readonly default: false;
            readonly description: "Show help information";
            readonly type: "boolean";
        };
    }>, "meta"> & {
        meta: Omit<import("citty").Resolvable<import("citty").CommandMeta> | undefined, "name"> & {
            readonly name: "seed";
        };
    }>;
};
