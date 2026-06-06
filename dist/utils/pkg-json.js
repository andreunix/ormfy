import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCWD } from '../config/get-cwd.js';
const PACKAGE_JSONS = {};
export async function getConsumerPackageJSON() {
    return await getPackageJSON({ startingFrom: getCWD() });
}
export async function getCTLPackageJSON() {
    return await getPackageJSON({ id: 'ormfy' });
}
async function getPackageJSON(options) {
    const { id, startingFrom = dirname(fileURLToPath(import.meta.url)) } = options;
    const cacheKey = `${String(id)}_${startingFrom}`;
    if (PACKAGE_JSONS[cacheKey]) {
        return PACKAGE_JSONS[cacheKey];
    }
    const packageJsonPath = id
        ? await findPackageJsonForPackage(id, startingFrom)
        : await findNearestPackageJson(startingFrom);
    if (!packageJsonPath) {
        throw new Error(`Could not find package.json${id ? ` for ${id}` : ''}.`);
    }
    const raw = await readFile(packageJsonPath, 'utf8');
    const pkgJSON = JSON.parse(raw);
    PACKAGE_JSONS[cacheKey] = pkgJSON;
    return pkgJSON;
}
async function findPackageJsonForPackage(id, startingFrom) {
    const nearestPackageJson = await findNearestPackageJson(startingFrom);
    if (nearestPackageJson) {
        const pkgJSON = JSON.parse(await readFile(nearestPackageJson, 'utf8'));
        if (pkgJSON.name === id) {
            return nearestPackageJson;
        }
    }
    return findNearestPackageJson(dirname(fileURLToPath(import.meta.url)));
}
async function findNearestPackageJson(startingFrom) {
    let current = startingFrom;
    while (true) {
        const packageJsonPath = `${current}/package.json`;
        try {
            await readFile(packageJsonPath, 'utf8');
            return packageJsonPath;
        }
        catch {
            const parent = dirname(current);
            if (parent === current) {
                return null;
            }
            current = parent;
        }
    }
}
//# sourceMappingURL=pkg-json.js.map