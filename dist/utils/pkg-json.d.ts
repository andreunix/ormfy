export interface PackageJson {
    name?: string;
    version?: string;
    type?: string;
    packageManager?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    workspaces?: string[] | {
        catalog?: Record<string, string>;
        catalogs?: Record<string, Record<string, string>>;
    };
}
export interface GetPackageJSONOptions {
    id?: string;
    startingFrom?: string;
}
export declare function getConsumerPackageJSON(): Promise<PackageJson>;
export declare function getCTLPackageJSON(): Promise<PackageJson>;
