import { mkdir, readdir } from 'node:fs/promises';
export async function safeReaddir(path) {
    try {
        return await readdir(path);
    }
    catch {
        await mkdir(path);
        return await readdir(path);
    }
}
//# sourceMappingURL=safe-readdir.js.map