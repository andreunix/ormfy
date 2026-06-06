/**
 * Returns the version of the Kysely package.
 */
export declare function getKyselyInstalledVersion(): Promise<string | null>;
/**
 * Returns the version of this package.
 */
export declare function getCTLInstalledVersion(): Promise<string | null>;
/**
 * Prints the version of the CLI and the Kysely package.
 */
export declare function printInstalledVersions(): Promise<void>;
export declare function printUpgradeNotice(args: {
    'outdated-check'?: boolean;
    version?: boolean;
}): Promise<void>;
