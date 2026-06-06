import { getJiti } from './jiti.js';
export async function importTSFile(path, args) {
    // a runtime that supports importing TypeScript files
    if (typeof Bun !== 'undefined') {
        return await import(path);
    }
    const jiti = await getJiti(args);
    return await jiti.import(path);
}
//# sourceMappingURL=import-ts-file.js.map