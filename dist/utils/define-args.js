export function defineArgs(args, dontSort) {
    return dontSort ? args : sortArgs(args);
}
function sortArgs(args) {
    return Object.fromEntries(Object.entries(args).sort(([nameA, argA], [nameB, argB]) => {
        const aliasA = getAlias(argA);
        const aliasB = getAlias(argB);
        if (aliasA) {
            nameA = aliasA;
        }
        if (aliasB) {
            nameB = aliasB;
        }
        return nameA.localeCompare(nameB);
    }));
}
function getAlias(arg) {
    const { alias } = arg;
    if (!alias) {
        return null;
    }
    if (Array.isArray(alias)) {
        return alias.at(0) || null;
    }
    return alias;
}
//# sourceMappingURL=define-args.js.map