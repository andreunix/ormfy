import { consola } from '../utils/logger.js';
import { join, parse } from 'node:path';
import { asArray } from '../utils/as-array.js';
import { importTSFile } from '../utils/import-ts-file.js';
import { isObject } from '../utils/is-object.js';
import { safeReaddir } from '../utils/safe-readdir.js';
export class FileSeedProvider {
    #props;
    constructor(props) {
        this.#props = props;
    }
    async getSeeds(seedNames) {
        const seedNamesMap = {};
        if (seedNames) {
            for (const seedName of asArray(seedNames)) {
                seedNamesMap[seedName] = true;
            }
        }
        const fileNames = await safeReaddir(this.#props.seedFolder);
        const seeds = {};
        for (const fileName of fileNames) {
            if (!fileName.endsWith('.ts') || fileName.endsWith('.d.ts')) {
                consola.warn(`Ignoring \`${fileName}\` - not a TS file.`);
                continue;
            }
            const seedKey = parse(fileName).name;
            if (!seedKey || (seedNames && !seedNamesMap[seedKey])) {
                continue;
            }
            const filePath = join(this.#props.seedFolder, fileName);
            const seedModule = (await importTSFile(filePath, this.#props));
            const seed = isSeed(seedModule?.default)
                ? seedModule.default
                : isSeed(seedModule)
                    ? seedModule
                    : null;
            if (!seed) {
                consola.warn(`Ignoring \`${fileName}\` - not a seed.`);
                continue;
            }
            seeds[seedKey] = seed;
        }
        return seeds;
    }
}
function isSeed(thing) {
    return isObject(thing) && typeof thing.seed === 'function';
}
//# sourceMappingURL=file-seed-provider.js.map