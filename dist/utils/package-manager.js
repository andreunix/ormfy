import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getCWD } from '../config/get-cwd.js';
export async function getPackageManager() {
    const packageManager = await detectPackageManager(getCWD());
    if (packageManager) {
        return { name: packageManager, command: packageManager, inProject: true };
    }
    const name = typeof Bun !== 'undefined' ? 'bun' : 'npm';
    return { name, command: name, inProject: false };
}
async function detectPackageManager(startingFrom) {
    let current = resolve(startingFrom);
    while (true) {
        const lockfileManager = await detectPackageManagerFromLockfiles(current);
        if (lockfileManager) {
            return lockfileManager;
        }
        const packageJsonManager = await detectPackageManagerFromPackageJson(current);
        if (packageJsonManager) {
            return packageJsonManager;
        }
        const parent = dirname(current);
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}
async function detectPackageManagerFromLockfiles(cwd) {
    if (await exists(resolve(cwd, 'bun.lock'))) {
        return 'bun';
    }
    if (await exists(resolve(cwd, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }
    if (await exists(resolve(cwd, 'yarn.lock'))) {
        return 'yarn';
    }
    if (await exists(resolve(cwd, 'package-lock.json'))) {
        return 'npm';
    }
    return null;
}
async function detectPackageManagerFromPackageJson(cwd) {
    try {
        const raw = await readFile(resolve(cwd, 'package.json'), 'utf8');
        const packageManager = JSON.parse(raw).packageManager;
        if (!packageManager) {
            return null;
        }
        if (packageManager.startsWith('bun@')) {
            return 'bun';
        }
        if (packageManager.startsWith('pnpm@')) {
            return 'pnpm';
        }
        if (packageManager.startsWith('yarn@')) {
            return 'yarn';
        }
        if (packageManager.startsWith('npm@')) {
            return 'npm';
        }
        return null;
    }
    catch {
        return null;
    }
}
async function exists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=package-manager.js.map