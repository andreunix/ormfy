import { getConfigOrFail } from '../config/get-config.js';
import { getMigrator } from './get-migrator.js';
import { usingKysely } from './using-kysely.js';
export async function usingMigrator(args, callback) {
    const config = await getConfigOrFail(args);
    return await usingKysely(config, async (kysely) => {
        const migrator = await getMigrator({ ...config, kysely });
        return await callback(migrator);
    });
}
//# sourceMappingURL=using-migrator.js.map