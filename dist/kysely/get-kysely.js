import { consola } from '../utils/logger.js';
import { Kysely } from 'kysely';
import { hydrate } from '../utils/hydrate.js';
import { getDialect } from './get-dialect.js';
// biome-ignore lint/suspicious/noExplicitAny: `any` is required here, for now.
export async function getKysely(config, debug = false) {
    const { kysely } = config;
    if (kysely) {
        return await hydrate(kysely, []);
    }
    const [dialect, plugins] = await Promise.all([
        getDialect(config),
        hydrate(config.plugins, []),
    ]);
    return new Kysely({
        dialect,
        log: debug
            ? (event) => {
                if (event.level === 'error') {
                    return consola.error(event.error);
                }
                return consola.log(`executed \`${event.query.sql}\` in ${event.queryDurationMillis}ms`);
            }
            : [],
        plugins,
    });
}
//# sourceMappingURL=get-kysely.js.map