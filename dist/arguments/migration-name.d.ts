export declare const createMigrationNameArg: (required?: boolean) => {
    readonly migration_name: {
        readonly description: "Migration name to run/undo.";
        readonly required: boolean;
        readonly type: "positional";
    };
};
