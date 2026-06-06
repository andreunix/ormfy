export async function hydrate(factory, parameters, defaultValue) {
    if (factory == null) {
        return (defaultValue?.() ?? factory);
    }
    if (typeof factory !== 'function') {
        return factory;
    }
    return await factory(...parameters);
}
//# sourceMappingURL=hydrate.js.map