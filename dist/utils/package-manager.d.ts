export type PackageManagerName = 'bun' | 'npm' | 'pnpm' | 'yarn';
export interface EnrichedPackageManager {
    name: PackageManagerName;
    command: PackageManagerName;
    inProject: boolean;
}
export declare function getPackageManager(): Promise<EnrichedPackageManager>;
