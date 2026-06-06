import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { consola } from '../utils/logger.js';
import { ORMIFY_EXTENSION } from '../arguments/extension.js';
import { getJiti } from '../utils/jiti.js';
import { getCWD } from './get-cwd.js';
import { getMillisPrefix } from './get-file-prefix.js';
export async function getConfig(args) {
    const { config: configArg, environment } = args;
    const configPath = configArg
        ? resolve(getCWD(), dirname(configArg))
        : await findNearestKyselyConfigPath();
    if (!configPath) {
        return null;
    }
    const jiti = await getJiti({
        debug: args.debug,
        filesystemCaching: args['filesystem-caching'],
    });
    consola.debug('configPath', configPath);
    const configFile = configArg
        ? resolve(getCWD(), configArg)
        : await findNearestConfigFile(configPath);
    if (!configFile) {
        return null;
    }
    await loadDotenv(configPath, environment);
    const config = await loadOrmfyConfig(configFile, jiti);
    consola.debug('loadedConfig', config);
    return {
        ...config,
        args,
        configMetadata: { configFile },
        cwd: configPath,
        models: {
            ...config.models,
            modelsFolder: resolveCollectionFolderPath(configPath, config.models?.modelsFolder, 'src/db/models'),
            dbImportPath: config.models?.dbImportPath ?? '..',
        },
        typegen: {
            source: config.typegen?.source ?? 'migrations',
            ...config.typegen,
        },
        migrations: {
            getMigrationPrefix: getMillisPrefix,
            ...config.migrations,
            disableTransactions: args.transaction === false ||
                config.migrations
                    ?.disableTransactions,
            migrationFolder: resolveCollectionFolderPath(configPath, config.migrations?.migrationFolder, 'migrations'),
        },
        seeds: {
            getSeedPrefix: getMillisPrefix,
            ...config.seeds,
            seedFolder: resolveCollectionFolderPath(configPath, config.seeds?.seedFolder, 'seeds'),
        },
    };
}
export async function getConfigOrFail(args) {
    const config = await getConfig(args);
    if (!configFileExists(config)) {
        throw new Error('No config file found. Try creating one by running `ormfy init`.');
    }
    return config;
}
export function configFileExists(config) {
    if (!config) {
        return false;
    }
    const { configFile } = config.configMetadata;
    return (configFile !== undefined &&
        configFile !== 'ormfy.config' &&
        configFile !== 'kysely.config');
}
const BASE_CONFIG_FILESNAMES = [
    `ormfy.config.${ORMIFY_EXTENSION}`,
    `kysely.config.${ORMIFY_EXTENSION}`,
];
async function findNearestKyselyConfigPath() {
    const configFile = await findNearestFile(BASE_CONFIG_FILESNAMES, getCWD());
    if (!configFile) {
        return null;
    }
    consola.debug('found ormfy config file at', configFile);
    return dirname(configFile);
}
async function findNearestConfigFile(configPath) {
    for (const fileName of BASE_CONFIG_FILESNAMES) {
        const filePath = resolve(configPath, fileName);
        if (await fileExists(filePath)) {
            return filePath;
        }
    }
    return null;
}
async function findNearestFile(fileNames, startingFrom) {
    let current = resolve(startingFrom);
    while (true) {
        for (const fileName of fileNames) {
            const filePath = resolve(current, fileName);
            if (await fileExists(filePath)) {
                return filePath;
            }
        }
        const parent = dirname(current);
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}
async function fileExists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
async function loadDotenv(cwd, environment) {
    const fileNames = environment ? ['.env', `.env.${environment}`] : ['.env'];
    for (const fileName of fileNames) {
        const filePath = resolve(cwd, fileName);
        if (!(await fileExists(filePath))) {
            continue;
        }
        const raw = await readFile(filePath, 'utf8');
        for (const [key, value] of parseDotenv(raw)) {
            process.env[key] ??= value;
        }
    }
}
function parseDotenv(raw) {
    return raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) {
            return null;
        }
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        return [key, unquoteDotenvValue(value)];
    })
        .filter((entry) => entry !== null);
}
function unquoteDotenvValue(value) {
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}
async function loadOrmfyConfig(filePath, jiti) {
    const imported = await jiti.import(pathToFileURL(filePath).href);
    const config = imported && typeof imported === 'object' && 'default' in imported
        ? imported.default
        : imported;
    if (!config || typeof config !== 'object') {
        throw new Error(`Config file ${filePath} must export a config object.`);
    }
    return config;
}
function resolveCollectionFolderPath(configPath, configuredFolderPath, defaultFolderName) {
    return resolve(configPath, configuredFolderPath || `./${defaultFolderName}`);
}
//# sourceMappingURL=get-config.js.map