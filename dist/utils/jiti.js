import { consola } from './logger.js';
import { getCWD } from '../config/get-cwd.js';
export async function getJiti(args) {
    const jitiOptions = await getJitiOptions(args);
    consola.debug('jitiOptions', jitiOptions);
    const { createJiti } = await import('jiti');
    return createJiti(import.meta.url, jitiOptions);
}
async function getJitiOptions(args) {
    return {
        debug: Boolean(args.debug),
        fsCache: Boolean(args.filesystemCaching),
        jsx: true,
        tryNative: typeof Bun !== 'undefined',
        tsconfigPaths: getCWD(),
    };
}
//# sourceMappingURL=jiti.js.map