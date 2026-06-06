import { getKysely } from './get-kysely.js';
export async function usingKysely(config, 
// biome-ignore lint/suspicious/noExplicitAny: `any` is required here, for now.
callback) {
    const kysely = await getKysely(config);
    try {
        return await callback(kysely);
    }
    finally {
        if (config.destroyOnExit !== false) {
            await kysely.destroy();
        }
    }
}
//# sourceMappingURL=using-kysely.js.map