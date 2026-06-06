export function createSubcommand(name, def) {
    return {
        [name]: { ...def, meta: { ...def.meta, name } },
    };
}
//# sourceMappingURL=create-subcommand.js.map