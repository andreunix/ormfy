import { getConfigOrFail } from '../config/get-config.js';
import { usingKysely } from '../kysely/using-kysely.js';
import { getSeeder } from './get-seeder.js';
export async function usingSeeder(args, callback) {
    const config = await getConfigOrFail(args);
    return await usingKysely(config, async (kysely) => {
        const seeder = await getSeeder({ ...config, kysely });
        return await callback(seeder);
    });
}
//# sourceMappingURL=using-seeder.js.map